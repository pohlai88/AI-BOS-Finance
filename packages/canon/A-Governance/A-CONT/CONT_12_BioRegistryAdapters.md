> **🟢 [ACTIVE]** — Certified for Production  
> **Canon Code:** CONT_12  
> **Version:** 1.0.0  
> **Certified Date:** 2025-01-XX  
> **Plane:** A — Governance (Contract)  
> **Binding Scope:** All AI-BOS multi-industry deployments  
> **Authority:** Platform Architecture Team  
> **Derives From:** CONT_10 BioSkin Architecture, CONT_11 UI/UX Governance

---

# CONT_12: BioRegistry & Industry Adapter Architecture
## Dependency Inversion for Multi-Industry UI

**Purpose:** Define the **BioRegistry pattern** that enables industry-specific customization WITHOUT modifying core BioSkin components.

---

## 1. Executive Summary

### 1.1 The Problem

BioSkin components are **industry-agnostic**, but different industries need:
- Different empty state messages
- Different command palette commands
- Different filter presets
- Different validation messages
- Different quick actions

### 1.2 The Solution: BioRegistry

**BioRegistry** is a **dependency inversion** pattern that allows industry adapters to **inject** domain-specific logic into core components without the core knowing about the domain.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CORE BIOSKIN (Industry-Agnostic)                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  BioRegistry.getEmptyState('invoices')  → Returns injected config       │ │
│  │  BioRegistry.getCommands('ap')           → Returns injected commands    │ │
│  │  BioRegistry.getFilterPresets('gl')      → Returns injected presets    │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↑ Reads from
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INDUSTRY ADAPTERS (Inject at Startup)               │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐   │
│  │ AgriOpsAdapter│ │ProductionAdapter│ │ OutletAdapter │ │ SupplyChain  │   │
│  │   registers   │ │   registers    │ │   registers   │ │   Adapter    │   │
│  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Industry Adapter Clusters

### 2.1 The Cluster Strategy

Instead of creating 15+ individual industry adapters, we group industries into **5 clusters** based on operational similarity:

| Cluster | Industries Covered | Core Patterns |
|---------|-------------------|---------------|
| **AgriOps** | Plantation, Vertical Farming, Smart Greenhouse | Yield tracking, Sensor data, Harvest cycles |
| **Production** | Manufacturing, Central Kitchen, Food Processing | BOM, Work orders, Quality control |
| **Outlet** | F&B, Franchise, Retail, E-commerce | POS, Inventory, Customer service |
| **SupplyChain** | Cold Chain, Warehouse, Logistics | FEFO, Temperature, Tracking |
| **Corporate** | Holding, Trading, Intercompany | Consolidation, Elimination, Reporting |

### 2.2 Cluster Coverage Matrix

| Adapter | AP | AR | GL | Inventory | Payroll | Production | CRM |
|---------|----|----|----|-----------|---------| -----------|-----|
| AgriOps | ✅ | ✅ | ✅ | ✅ (Yield) | ✅ | ✅ (Harvest) | ❌ |
| Production | ✅ | ✅ | ✅ | ✅ (WIP) | ✅ | ✅ (BOM) | ❌ |
| Outlet | ✅ | ✅ | ✅ | ✅ (Stock) | ✅ | ❌ | ✅ |
| SupplyChain | ✅ | ✅ | ✅ | ✅ (FEFO) | ✅ | ❌ | ❌ |
| Corporate | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |

---

## 3. BioRegistry Interface

### 3.1 Core Interface

```typescript
// packages/bioskin/src/registry/BioRegistry.ts

/**
 * Industry Adapter Interface
 * Each adapter cluster implements this interface
 */
export interface IndustryAdapter {
  /** Unique adapter identifier */
  id: AdapterCluster;
  
  /** Display name for UI */
  name: string;
  
  /** Module configurations */
  modules: ModuleConfig[];
  
  /** Empty state configurations per module/entity */
  emptyStates: Record<string, EmptyStateConfig>;
  
  /** Command palette commands */
  commands: CommandConfig[];
  
  /** Filter presets per module */
  filterPresets: Record<string, FilterPreset[]>;
  
  /** Validation message overrides */
  validationMessages: Record<string, string>;
  
  /** Quick actions per entity type */
  quickActions: Record<string, QuickAction[]>;
  
  /** Exception types and handlers */
  exceptionTypes: ExceptionTypeConfig[];
  
  /** Design token overrides (optional) */
  tokens?: Partial<DesignTokens>;
}

/**
 * Adapter Cluster Types
 */
export type AdapterCluster = 
  | 'agriops' 
  | 'production' 
  | 'outlet' 
  | 'supplychain' 
  | 'corporate';

/**
 * Module Configuration
 */
export interface ModuleConfig {
  code: string;           // 'ap', 'ar', 'gl', 'inventory', etc.
  name: string;           // 'Accounts Payable'
  icon: LucideIcon;       // FileInvoice
  route: string;          // '/ap'
  capabilities: string[]; // ['create', 'approve', 'export']
}

/**
 * Empty State Configuration
 */
export interface EmptyStateConfig {
  icon: LucideIcon;
  title: string;
  description: string;
  action: {
    label: string;
    route?: string;
    handler?: () => void;
  };
  hints?: string[];
  quickActions?: QuickAction[];
}

/**
 * Command Configuration
 */
export interface CommandConfig {
  id: string;
  label: string;
  keywords?: string[];
  module: string;
  icon?: LucideIcon;
  shortcut?: string;
  route?: string;
  handler?: () => void;
  permissions?: string[];
}

/**
 * Filter Preset
 */
export interface FilterPreset {
  id: string;
  name: string;
  filters: Array<{
    field: string;
    operator: string;
    value: unknown;
  }>;
  isDefault?: boolean;
}

/**
 * Quick Action
 */
export interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  route?: string;
  handler?: () => void;
  permissions?: string[];
}

/**
 * Exception Type Configuration
 */
export interface ExceptionTypeConfig {
  code: string;
  label: string;
  severity: 'critical' | 'warning' | 'info';
  module: string;
  resolution?: string;
}
```

### 3.2 Registry Implementation

```typescript
// packages/bioskin/src/registry/BioRegistry.ts

class BioRegistryImpl {
  private adapters = new Map<AdapterCluster, IndustryAdapter>();
  private activeAdapter: AdapterCluster | null = null;
  
  /**
   * Register an industry adapter
   */
  register(adapter: IndustryAdapter): void {
    this.adapters.set(adapter.id, adapter);
    console.log(`[BioRegistry] Registered adapter: ${adapter.name}`);
  }
  
  /**
   * Activate an adapter for the current session
   */
  activate(adapterId: AdapterCluster): void {
    if (!this.adapters.has(adapterId)) {
      throw new Error(`[BioRegistry] Adapter not found: ${adapterId}`);
    }
    this.activeAdapter = adapterId;
    console.log(`[BioRegistry] Activated adapter: ${adapterId}`);
  }
  
  /**
   * Get the active adapter
   */
  getActiveAdapter(): IndustryAdapter | null {
    if (!this.activeAdapter) return null;
    return this.adapters.get(this.activeAdapter) ?? null;
  }
  
  /**
   * Get empty state config for a module/entity
   */
  getEmptyState(key: string): EmptyStateConfig | undefined {
    return this.getActiveAdapter()?.emptyStates[key];
  }
  
  /**
   * Get commands for a module
   */
  getCommands(module?: string): CommandConfig[] {
    const adapter = this.getActiveAdapter();
    if (!adapter) return [];
    
    if (module) {
      return adapter.commands.filter(cmd => cmd.module === module);
    }
    return adapter.commands;
  }
  
  /**
   * Get filter presets for a module
   */
  getFilterPresets(module: string): FilterPreset[] {
    return this.getActiveAdapter()?.filterPresets[module] ?? [];
  }
  
  /**
   * Get validation message override
   */
  getValidationMessage(code: string): string | undefined {
    return this.getActiveAdapter()?.validationMessages[code];
  }
  
  /**
   * Get quick actions for an entity type
   */
  getQuickActions(entityType: string): QuickAction[] {
    return this.getActiveAdapter()?.quickActions[entityType] ?? [];
  }
  
  /**
   * Get exception types for a module
   */
  getExceptionTypes(module?: string): ExceptionTypeConfig[] {
    const adapter = this.getActiveAdapter();
    if (!adapter) return [];
    
    if (module) {
      return adapter.exceptionTypes.filter(ex => ex.module === module);
    }
    return adapter.exceptionTypes;
  }
  
  /**
   * Get design token overrides
   */
  getTokenOverrides(): Partial<DesignTokens> {
    return this.getActiveAdapter()?.tokens ?? {};
  }
}

/**
 * Singleton instance
 */
export const BioRegistry = new BioRegistryImpl();
```

---

## 4. Adapter Implementation Examples

### 4.1 SupplyChain Adapter (Proof Adapter)

```typescript
// apps/web/adapters/supplychain-adapter.ts
import { BioRegistry, type IndustryAdapter } from '@aibos/bioskin';
import { 
  Truck, Package, Thermometer, AlertTriangle, 
  BarcodeScan, Route, Clock, Warehouse 
} from 'lucide-react';

export const SupplyChainAdapter: IndustryAdapter = {
  id: 'supplychain',
  name: 'Supply Chain & Cold Chain',
  
  modules: [
    { code: 'warehouse', name: 'Warehouse', icon: Warehouse, route: '/warehouse', capabilities: ['receive', 'pick', 'ship'] },
    { code: 'coldchain', name: 'Cold Chain', icon: Thermometer, route: '/coldchain', capabilities: ['monitor', 'alert', 'report'] },
    { code: 'tracking', name: 'Tracking', icon: Route, route: '/tracking', capabilities: ['scan', 'trace', 'deliver'] },
  ],
  
  emptyStates: {
    'shipments': {
      icon: Truck,
      title: 'No shipments yet',
      description: 'Create your first shipment to start tracking deliveries',
      action: { label: 'Create Shipment', route: '/shipments/new' },
      hints: [
        'Tip: Use barcode scanning for faster receiving',
        'Set up FEFO rules for perishable goods',
      ],
      quickActions: [
        { id: 'scan', label: 'Scan Barcode', icon: BarcodeScan, route: '/scan' },
        { id: 'import', label: 'Import CSV', icon: Package, route: '/import' },
      ],
    },
    'coldchain-alerts': {
      icon: Thermometer,
      title: 'No temperature alerts',
      description: 'All monitored shipments are within safe temperature ranges',
      action: { label: 'View Dashboard', route: '/coldchain/dashboard' },
    },
  },
  
  commands: [
    { id: 'scan-receive', label: 'Scan to Receive', module: 'warehouse', icon: BarcodeScan, shortcut: 'R' },
    { id: 'scan-pick', label: 'Scan to Pick', module: 'warehouse', icon: BarcodeScan, shortcut: 'P' },
    { id: 'check-temp', label: 'Check Temperature', module: 'coldchain', icon: Thermometer },
    { id: 'track-shipment', label: 'Track Shipment', module: 'tracking', icon: Route },
    { id: 'create-shipment', label: 'Create Shipment', module: 'tracking', icon: Truck },
  ],
  
  filterPresets: {
    'warehouse': [
      { id: 'expiring-soon', name: 'Expiring Soon (7 days)', filters: [{ field: 'expiryDate', operator: 'lt', value: 'today+7d' }] },
      { id: 'low-stock', name: 'Low Stock', filters: [{ field: 'qty', operator: 'lt', value: 'reorderPoint' }] },
      { id: 'fefo-violation', name: 'FEFO Violations', filters: [{ field: 'fefoViolation', operator: 'eq', value: true }] },
    ],
    'coldchain': [
      { id: 'temp-breach', name: 'Temperature Breach', filters: [{ field: 'tempStatus', operator: 'eq', value: 'breach' }] },
      { id: 'at-risk', name: 'At Risk', filters: [{ field: 'tempStatus', operator: 'eq', value: 'warning' }] },
    ],
  },
  
  validationMessages: {
    'FEFO_VIOLATION': 'This item violates FEFO (First Expired, First Out) rules. Please select a different lot.',
    'TEMP_OUT_OF_RANGE': 'Temperature reading is outside acceptable range. Check sensor calibration.',
    'EXPIRY_EXCEEDED': 'This item has expired and cannot be shipped.',
  },
  
  quickActions: {
    'shipment': [
      { id: 'print-label', label: 'Print Label', icon: Package },
      { id: 'track', label: 'Track', icon: Route },
      { id: 'view-temp', label: 'Temperature Log', icon: Thermometer },
    ],
    'lot': [
      { id: 'view-trace', label: 'Full Traceability', icon: Route },
      { id: 'check-expiry', label: 'Check Expiry', icon: Clock },
    ],
  },
  
  exceptionTypes: [
    { code: 'TEMP_BREACH', label: 'Temperature Breach', severity: 'critical', module: 'coldchain', resolution: 'Inspect product quality, document breach, escalate if needed' },
    { code: 'FEFO_VIOLATION', label: 'FEFO Violation', severity: 'critical', module: 'warehouse', resolution: 'Reorganize stock to pick oldest expiry first' },
    { code: 'EXPIRY_ALERT', label: 'Expiry Alert', severity: 'warning', module: 'warehouse', resolution: 'Prioritize shipment or mark for disposal' },
    { code: 'REORDER_POINT', label: 'Reorder Point Reached', severity: 'info', module: 'warehouse', resolution: 'Create purchase order' },
    { code: 'SENSOR_OFFLINE', label: 'Sensor Offline', severity: 'warning', module: 'coldchain', resolution: 'Check sensor connectivity and battery' },
  ],
  
  tokens: {
    colors: {
      // Cold chain specific: blue-tinted for cold
      primary: '#0ea5e9',  // sky-500
      statusDanger: '#ef4444',  // Red for temperature breach
    },
  },
};

// Register at app startup
BioRegistry.register(SupplyChainAdapter);
```

### 4.2 Corporate Adapter

```typescript
// apps/web/adapters/corporate-adapter.ts
import { BioRegistry, type IndustryAdapter } from '@aibos/bioskin';
import { Building2, GitMerge, FileSpreadsheet, TrendingUp, Scale } from 'lucide-react';

export const CorporateAdapter: IndustryAdapter = {
  id: 'corporate',
  name: 'Corporate & Holding',
  
  modules: [
    { code: 'consolidation', name: 'Consolidation', icon: GitMerge, route: '/consolidation', capabilities: ['consolidate', 'eliminate', 'report'] },
    { code: 'intercompany', name: 'Intercompany', icon: Building2, route: '/intercompany', capabilities: ['match', 'reconcile', 'eliminate'] },
    { code: 'reporting', name: 'Financial Reporting', icon: FileSpreadsheet, route: '/reporting', capabilities: ['generate', 'drill', 'export'] },
  ],
  
  emptyStates: {
    'consolidation': {
      icon: GitMerge,
      title: 'No consolidation runs yet',
      description: 'Set up your group structure and run your first consolidation',
      action: { label: 'Configure Group', route: '/consolidation/setup' },
      hints: [
        'Tip: Define elimination rules before first consolidation',
        'Map intercompany accounts for automatic matching',
      ],
    },
    'intercompany': {
      icon: Building2,
      title: 'No intercompany transactions',
      description: 'Intercompany transactions will appear here once recorded',
      action: { label: 'Record IC Transaction', route: '/intercompany/new' },
    },
  },
  
  commands: [
    { id: 'run-consolidation', label: 'Run Consolidation', module: 'consolidation', icon: GitMerge },
    { id: 'ic-reconcile', label: 'IC Reconciliation', module: 'intercompany', icon: Scale },
    { id: 'generate-report', label: 'Generate Report', module: 'reporting', icon: FileSpreadsheet },
  ],
  
  filterPresets: {
    'intercompany': [
      { id: 'unmatched', name: 'Unmatched Transactions', filters: [{ field: 'matchStatus', operator: 'eq', value: 'unmatched' }] },
      { id: 'variance', name: 'With Variance', filters: [{ field: 'variance', operator: 'gt', value: 0 }] },
    ],
    'consolidation': [
      { id: 'pending-elim', name: 'Pending Eliminations', filters: [{ field: 'eliminationStatus', operator: 'eq', value: 'pending' }] },
    ],
  },
  
  validationMessages: {
    'IC_MISMATCH': 'Intercompany amounts do not match. Variance: {variance}',
    'MINORITY_CALC': 'Minority interest calculation requires ownership percentage',
  },
  
  quickActions: {
    'entity': [
      { id: 'view-subs', label: 'View Subsidiaries', icon: Building2 },
      { id: 'ic-balance', label: 'IC Balances', icon: Scale },
    ],
  },
  
  exceptionTypes: [
    { code: 'IC_MISMATCH', label: 'IC Mismatch', severity: 'critical', module: 'intercompany', resolution: 'Investigate and resolve variance between entities' },
    { code: 'ELIM_INCOMPLETE', label: 'Elimination Incomplete', severity: 'warning', module: 'consolidation', resolution: 'Review elimination entries' },
    { code: 'FX_VARIANCE', label: 'FX Translation Variance', severity: 'info', module: 'consolidation', resolution: 'Review translation rates' },
  ],
};

BioRegistry.register(CorporateAdapter);
```

---

## 5. Integration Pattern

### 5.1 App Initialization

```typescript
// apps/web/app/providers.tsx
'use client';

import { BioRegistry } from '@aibos/bioskin';
import { SupplyChainAdapter } from '@/adapters/supplychain-adapter';
import { CorporateAdapter } from '@/adapters/corporate-adapter';
// ... other adapters

// Register all adapters
BioRegistry.register(SupplyChainAdapter);
BioRegistry.register(CorporateAdapter);

// Activate based on tenant/deployment
const tenantAdapter = getTenantAdapter(); // From config/env
BioRegistry.activate(tenantAdapter);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <BioRegistryProvider>
      {children}
    </BioRegistryProvider>
  );
}
```

### 5.2 Component Integration

```typescript
// Component using registry-injected config
function ModuleEmptyState({ module }: { module: string }) {
  const config = BioRegistry.getEmptyState(module);
  
  if (!config) {
    return <EmptyState title="No data" description="No data available" />;
  }
  
  return (
    <EmptyState
      icon={config.icon}
      title={config.title}
      description={config.description}
      action={config.action}
      hints={config.hints}
      quickActions={config.quickActions}
    />
  );
}

// Command palette using registry-injected commands
function CommandPalette() {
  const commands = BioRegistry.getCommands();
  
  return (
    <BioCommandPalette commands={commands} />
  );
}
```

---

## 6. Validation & Testing

### 6.1 Adapter Validation Schema

```typescript
// packages/bioskin/src/registry/validation.ts
import { z } from 'zod';

export const IndustryAdapterSchema = z.object({
  id: z.enum(['agriops', 'production', 'outlet', 'supplychain', 'corporate']),
  name: z.string().min(1),
  modules: z.array(z.object({
    code: z.string(),
    name: z.string(),
    route: z.string().startsWith('/'),
  })).min(1),
  emptyStates: z.record(z.object({
    title: z.string(),
    description: z.string(),
    action: z.object({ label: z.string() }),
  })),
  commands: z.array(z.object({
    id: z.string(),
    label: z.string(),
    module: z.string(),
  })),
  exceptionTypes: z.array(z.object({
    code: z.string(),
    label: z.string(),
    severity: z.enum(['critical', 'warning', 'info']),
  })),
});

// Validate adapter at registration
BioRegistry.register = (adapter) => {
  IndustryAdapterSchema.parse(adapter); // Throws if invalid
  // ... original registration logic
};
```

### 6.2 Adapter Tests

```typescript
// __tests__/registry/adapters.test.ts
describe('Industry Adapters', () => {
  it('SupplyChainAdapter passes validation', () => {
    expect(() => IndustryAdapterSchema.parse(SupplyChainAdapter)).not.toThrow();
  });
  
  it('SupplyChainAdapter has required empty states', () => {
    expect(SupplyChainAdapter.emptyStates['shipments']).toBeDefined();
  });
  
  it('SupplyChainAdapter has FEFO exception type', () => {
    const fefo = SupplyChainAdapter.exceptionTypes.find(e => e.code === 'FEFO_VIOLATION');
    expect(fefo).toBeDefined();
    expect(fefo?.severity).toBe('critical');
  });
});
```

---

## 7. Summary

### Key Decisions

1. **5 Adapter Clusters** instead of 15+ individual adapters
2. **Dependency Inversion** — core components read from registry
3. **Schema Validation** — adapters are validated at registration
4. **Proof Adapter** — SupplyChain validates the architecture

### Benefits

| Benefit | Description |
|---------|-------------|
| **No Core Changes** | Add industries without touching bioskin |
| **Type Safety** | Full TypeScript coverage of adapter interface |
| **Testable** | Each adapter can be unit tested in isolation |
| **Scalable** | New industries = new adapter, no forking |

---

**Status:** ✅ ACTIVE  
**Supersedes:** None (New Contract)  
**Depends On:** CONT_10, CONT_11  
**Last Updated:** 2025-01-XX  
**Maintainer:** AI-BOS Platform Architecture Team  
**Review Cycle:** Quarterly
