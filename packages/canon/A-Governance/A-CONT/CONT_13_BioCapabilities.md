> **🟢 [ACTIVE]** — Certified for Production  
> **Canon Code:** CONT_13  
> **Version:** 1.0.0  
> **Certified Date:** 2025-01-XX  
> **Plane:** A — Governance (Contract)  
> **Binding Scope:** All AI-BOS feature toggles and capability management  
> **Authority:** Platform Architecture Team  
> **Derives From:** CONT_10 BioSkin Architecture, CONT_12 BioRegistry

---

# CONT_13: BioCapabilities Feature Flag System
## Controlled Feature Toggling for Multi-Industry Compliance

**Purpose:** Define the **BioCapabilities** pattern that enables feature toggling based on industry requirements, compliance rules, and user roles.

---

## 1. Executive Summary

### 1.1 The Problem

Different industries have different requirements for UI capabilities:

| Industry | Inline Edit | Bulk Delete | CSV Export | Audit Bypass |
|----------|-------------|-------------|------------|--------------|
| Finance | ✅ | ✅ | ✅ | ❌ Never |
| Healthcare | ❌ HIPAA | ❌ HIPAA | ⚠️ Redacted | ❌ Never |
| Supply Chain | ✅ | ✅ | ✅ | ❌ Never |
| Manufacturing | ✅ | ⚠️ QA only | ✅ | ❌ Never |

### 1.2 The Solution: BioCapabilities

**BioCapabilities** is a **feature flag system** that:
1. Defines **capability profiles** per industry/adapter
2. Allows **runtime toggling** based on role, state, or context
3. Enforces **compliance requirements** (some features cannot be enabled)
4. Provides **UI feedback** when features are disabled

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CAPABILITY EVALUATION FLOW                          │
│                                                                             │
│  Component Request:  "Can I render inline edit?"                            │
│          ↓                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ BioCapabilities.check('table.inlineEdit')                               ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│          ↓                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ 1. Check Adapter Profile (industry default)                             ││
│  │ 2. Check Role Overrides (user permissions)                              ││
│  │ 3. Check Context (entity state, period lock)                            ││
│  │ 4. Check Compliance Rules (HIPAA, SOX, etc.)                            ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│          ↓                                                                  │
│  Result: { enabled: boolean, reason?: string }                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Capability Categories

### 2.1 Capability Tree

```typescript
// packages/bioskin/src/capabilities/types.ts

/**
 * Complete capability tree
 * Hierarchical: category.feature.subfeature
 */
export interface CapabilityTree {
  table: {
    inlineEdit: boolean;
    bulkEdit: boolean;
    bulkDelete: boolean;
    csvImport: boolean;
    csvExport: boolean;
    excelExport: boolean;
    virtualization: boolean;
    columnPinning: boolean;
    columnReorder: boolean;
    rowSelection: boolean;
    keyboardNavigation: boolean;
  };
  
  form: {
    templates: boolean;
    cloning: boolean;
    smartDefaults: boolean;
    autoRepair: boolean;
    draftSave: boolean;
    offlineMode: boolean;
  };
  
  timeline: {
    comments: boolean;
    attachments: boolean;
    diffs: boolean;
    export: boolean;
    filtering: boolean;
  };
  
  navigation: {
    tabs: boolean;
    splitView: boolean;
    breadcrumbs: boolean;
    recentHistory: boolean;
    bookmarks: boolean;
  };
  
  actions: {
    create: boolean;
    update: boolean;
    delete: boolean;
    approve: boolean;
    reject: boolean;
    void: boolean;
    clone: boolean;
    archive: boolean;
  };
  
  audit: {
    viewHistory: boolean;
    exportHistory: boolean;
    compareVersions: boolean;
    rollback: boolean;  // Usually false for compliance
  };
  
  sharing: {
    shareLink: boolean;
    shareFilters: boolean;
    exportPdf: boolean;
    print: boolean;
  };
}

/**
 * Capability check result
 */
export interface CapabilityResult {
  enabled: boolean;
  reason?: string;
  source: 'adapter' | 'role' | 'context' | 'compliance';
}
```

### 2.2 Compliance Rules (Non-Negotiable)

Some capabilities are **hardcoded disabled** based on compliance:

```typescript
// packages/bioskin/src/capabilities/compliance.ts

/**
 * Compliance rules - cannot be overridden
 */
export const ComplianceRules: Record<string, CapabilityOverride> = {
  // HIPAA - Healthcare
  'hipaa': {
    'table.bulkDelete': { enabled: false, reason: 'HIPAA: Bulk delete disabled for patient records' },
    'table.inlineEdit': { enabled: false, reason: 'HIPAA: Direct edit disabled, use formal amendment' },
    'table.csvExport': { enabled: true, requiresRedaction: true, reason: 'HIPAA: Export requires PHI redaction' },
    'audit.rollback': { enabled: false, reason: 'HIPAA: Rollback disabled for audit integrity' },
  },
  
  // SOX - Finance
  'sox': {
    'audit.rollback': { enabled: false, reason: 'SOX: Rollback disabled for audit integrity' },
    'actions.void': { enabled: true, requiresApproval: true, reason: 'SOX: Void requires dual approval' },
  },
  
  // FDA 21 CFR Part 11 - Manufacturing
  'fda21cfr11': {
    'audit.rollback': { enabled: false, reason: 'FDA: Rollback disabled for electronic records' },
    'form.autoRepair': { enabled: false, reason: 'FDA: Automatic data correction disabled' },
  },
  
  // FEFO - Supply Chain
  'fefo': {
    'actions.override': { enabled: true, requiresReason: true, reason: 'FEFO: Override requires documented reason' },
  },
};

/**
 * Get active compliance rules based on adapter
 */
export function getComplianceRules(adapterId: string): CapabilityOverride[] {
  const ruleMap: Record<string, string[]> = {
    'corporate': ['sox'],
    'supplychain': ['fefo'],
    // Healthcare would add 'hipaa'
    // Manufacturing would add 'fda21cfr11'
  };
  
  const ruleIds = ruleMap[adapterId] ?? [];
  return ruleIds.flatMap(id => Object.values(ComplianceRules[id] ?? {}));
}
```

---

## 3. Capability Profiles

### 3.1 Industry Default Profiles

```typescript
// packages/bioskin/src/capabilities/profiles.ts

/**
 * Default capability profiles per adapter cluster
 */
export const CapabilityProfiles: Record<AdapterCluster, Partial<CapabilityTree>> = {
  // Finance - Full capabilities, SOX compliance
  'corporate': {
    table: {
      inlineEdit: true,
      bulkEdit: true,
      bulkDelete: true,
      csvImport: true,
      csvExport: true,
      excelExport: true,
      virtualization: true,
      columnPinning: true,
      columnReorder: true,
      rowSelection: true,
      keyboardNavigation: true,
    },
    form: {
      templates: true,
      cloning: true,
      smartDefaults: true,
      autoRepair: true,
      draftSave: true,
      offlineMode: false,  // Disabled for audit integrity
    },
    timeline: {
      comments: false,  // Formal audit only
      attachments: true,
      diffs: true,
      export: true,
      filtering: true,
    },
    actions: {
      create: true,
      update: true,
      delete: true,
      approve: true,
      reject: true,
      void: true,
      clone: true,
      archive: true,
    },
    audit: {
      viewHistory: true,
      exportHistory: true,
      compareVersions: true,
      rollback: false,  // SOX compliance
    },
  },
  
  // Supply Chain - Scan-first, exception-driven
  'supplychain': {
    table: {
      inlineEdit: true,
      bulkEdit: true,
      bulkDelete: false,  // Use void instead
      csvImport: true,
      csvExport: true,
      excelExport: true,
      virtualization: true,
      columnPinning: false,
      columnReorder: false,
      rowSelection: true,
      keyboardNavigation: false,  // Scan-first
    },
    form: {
      templates: true,
      cloning: true,
      smartDefaults: true,
      autoRepair: false,  // Manual verification required
      draftSave: false,
      offlineMode: true,  // Warehouse may have connectivity issues
    },
    timeline: {
      comments: true,
      attachments: true,
      diffs: true,
      export: true,
      filtering: true,
    },
    actions: {
      create: true,
      update: true,
      delete: false,
      approve: false,  // Automated workflows
      reject: false,
      void: true,
      clone: false,
      archive: true,
    },
    audit: {
      viewHistory: true,
      exportHistory: true,
      compareVersions: true,
      rollback: false,
    },
  },
  
  // Production/Manufacturing
  'production': {
    table: {
      inlineEdit: true,
      bulkEdit: false,  // QA controlled
      bulkDelete: false,
      csvImport: true,
      csvExport: true,
      excelExport: true,
      virtualization: true,
      columnPinning: true,
      columnReorder: false,
      rowSelection: true,
      keyboardNavigation: true,
    },
    form: {
      templates: true,
      cloning: true,
      smartDefaults: true,
      autoRepair: false,  // FDA compliance
      draftSave: true,
      offlineMode: true,
    },
    timeline: {
      comments: true,
      attachments: true,
      diffs: true,
      export: false,  // Controlled document export
      filtering: true,
    },
    actions: {
      create: true,
      update: true,
      delete: false,
      approve: true,
      reject: true,
      void: true,
      clone: true,
      archive: true,
    },
    audit: {
      viewHistory: true,
      exportHistory: false,  // FDA controlled
      compareVersions: true,
      rollback: false,
    },
  },
  
  // AgriOps - Field-friendly
  'agriops': {
    table: {
      inlineEdit: true,
      bulkEdit: true,
      bulkDelete: false,
      csvImport: true,
      csvExport: true,
      excelExport: false,
      virtualization: true,
      columnPinning: false,
      columnReorder: false,
      rowSelection: true,
      keyboardNavigation: false,
    },
    form: {
      templates: true,
      cloning: true,
      smartDefaults: true,
      autoRepair: true,
      draftSave: true,
      offlineMode: true,  // Field connectivity
    },
    timeline: {
      comments: true,
      attachments: true,
      diffs: false,
      export: true,
      filtering: false,
    },
    actions: {
      create: true,
      update: true,
      delete: false,
      approve: false,
      reject: false,
      void: true,
      clone: true,
      archive: true,
    },
    audit: {
      viewHistory: true,
      exportHistory: true,
      compareVersions: false,
      rollback: false,
    },
  },
  
  // Outlet - POS-focused
  'outlet': {
    table: {
      inlineEdit: true,
      bulkEdit: true,
      bulkDelete: false,
      csvImport: true,
      csvExport: true,
      excelExport: true,
      virtualization: true,
      columnPinning: false,
      columnReorder: false,
      rowSelection: true,
      keyboardNavigation: true,
    },
    form: {
      templates: true,
      cloning: true,
      smartDefaults: true,
      autoRepair: true,
      draftSave: false,
      offlineMode: true,  // POS resilience
    },
    timeline: {
      comments: false,
      attachments: false,
      diffs: true,
      export: true,
      filtering: true,
    },
    actions: {
      create: true,
      update: true,
      delete: false,
      approve: false,
      reject: false,
      void: true,
      clone: true,
      archive: true,
    },
    audit: {
      viewHistory: true,
      exportHistory: true,
      compareVersions: true,
      rollback: false,
    },
  },
};
```

---

## 4. BioCapabilities Implementation

### 4.1 Core Implementation

```typescript
// packages/bioskin/src/capabilities/BioCapabilities.ts

import { BioRegistry } from '../registry/BioRegistry';
import { CapabilityProfiles } from './profiles';
import { getComplianceRules } from './compliance';
import type { CapabilityTree, CapabilityResult } from './types';

type CapabilityPath = 
  | `table.${keyof CapabilityTree['table']}`
  | `form.${keyof CapabilityTree['form']}`
  | `timeline.${keyof CapabilityTree['timeline']}`
  | `navigation.${keyof CapabilityTree['navigation']}`
  | `actions.${keyof CapabilityTree['actions']}`
  | `audit.${keyof CapabilityTree['audit']}`
  | `sharing.${keyof CapabilityTree['sharing']}`;

interface CapabilityContext {
  userId?: string;
  userRole?: string;
  entityState?: string;
  periodStatus?: 'open' | 'closed';
  entityType?: string;
}

class BioCapabilitiesImpl {
  private roleOverrides = new Map<string, Partial<CapabilityTree>>();
  
  /**
   * Check if a capability is enabled
   */
  check(path: CapabilityPath, context?: CapabilityContext): CapabilityResult {
    const [category, feature] = path.split('.') as [keyof CapabilityTree, string];
    
    // 1. Get adapter profile
    const adapter = BioRegistry.getActiveAdapter();
    if (!adapter) {
      return { enabled: false, reason: 'No active adapter', source: 'adapter' };
    }
    
    const profile = CapabilityProfiles[adapter.id];
    const adapterDefault = (profile?.[category] as Record<string, boolean>)?.[feature] ?? false;
    
    // 2. Check compliance rules (cannot be overridden)
    const complianceRules = getComplianceRules(adapter.id);
    const complianceBlock = complianceRules.find(r => r.path === path && !r.enabled);
    if (complianceBlock) {
      return { enabled: false, reason: complianceBlock.reason, source: 'compliance' };
    }
    
    // 3. Check context (period lock, entity state)
    if (context) {
      const contextResult = this.checkContext(path, context);
      if (!contextResult.enabled) {
        return contextResult;
      }
    }
    
    // 4. Check role overrides
    if (context?.userRole) {
      const roleProfile = this.roleOverrides.get(context.userRole);
      const roleOverride = (roleProfile?.[category] as Record<string, boolean>)?.[feature];
      if (roleOverride !== undefined) {
        return { enabled: roleOverride, source: 'role' };
      }
    }
    
    // 5. Return adapter default
    return { enabled: adapterDefault, source: 'adapter' };
  }
  
  /**
   * Check all capabilities for a category
   */
  checkCategory<K extends keyof CapabilityTree>(
    category: K,
    context?: CapabilityContext
  ): Record<keyof CapabilityTree[K], CapabilityResult> {
    const adapter = BioRegistry.getActiveAdapter();
    const profile = adapter ? CapabilityProfiles[adapter.id]?.[category] : {};
    
    const results = {} as Record<keyof CapabilityTree[K], CapabilityResult>;
    
    for (const feature of Object.keys(profile ?? {})) {
      const path = `${category}.${feature}` as CapabilityPath;
      results[feature as keyof CapabilityTree[K]] = this.check(path, context);
    }
    
    return results;
  }
  
  /**
   * Register role-based capability overrides
   */
  registerRoleOverrides(role: string, capabilities: Partial<CapabilityTree>): void {
    this.roleOverrides.set(role, capabilities);
  }
  
  /**
   * Check context-based restrictions
   */
  private checkContext(path: CapabilityPath, context: CapabilityContext): CapabilityResult {
    // Period lock check
    if (context.periodStatus === 'closed') {
      const writeActions = ['actions.update', 'actions.delete', 'actions.void', 'table.inlineEdit', 'table.bulkEdit'];
      if (writeActions.includes(path)) {
        return { 
          enabled: false, 
          reason: 'Period is closed. No modifications allowed.', 
          source: 'context' 
        };
      }
    }
    
    // Entity state checks
    if (context.entityState === 'approved' && path.startsWith('actions.')) {
      const restrictedInApproved = ['actions.update', 'actions.delete'];
      if (restrictedInApproved.includes(path)) {
        return { 
          enabled: false, 
          reason: 'Cannot modify approved records. Void and recreate if needed.', 
          source: 'context' 
        };
      }
    }
    
    return { enabled: true, source: 'context' };
  }
}

/**
 * Singleton instance
 */
export const BioCapabilities = new BioCapabilitiesImpl();
```

### 4.2 React Hook

```typescript
// packages/bioskin/src/capabilities/useCapability.ts

import { useMemo } from 'react';
import { BioCapabilities } from './BioCapabilities';
import type { CapabilityPath, CapabilityContext, CapabilityResult } from './types';

/**
 * Hook to check a capability
 */
export function useCapability(
  path: CapabilityPath,
  context?: CapabilityContext
): CapabilityResult {
  return useMemo(
    () => BioCapabilities.check(path, context),
    [path, context?.userId, context?.userRole, context?.entityState, context?.periodStatus]
  );
}

/**
 * Hook to check multiple capabilities
 */
export function useCapabilities(
  paths: CapabilityPath[],
  context?: CapabilityContext
): Record<string, CapabilityResult> {
  return useMemo(() => {
    const results: Record<string, CapabilityResult> = {};
    for (const path of paths) {
      results[path] = BioCapabilities.check(path, context);
    }
    return results;
  }, [paths.join(','), context?.userId, context?.userRole, context?.entityState, context?.periodStatus]);
}

/**
 * Hook to check all capabilities in a category
 */
export function useCategoryCapabilities<K extends keyof CapabilityTree>(
  category: K,
  context?: CapabilityContext
): Record<keyof CapabilityTree[K], CapabilityResult> {
  return useMemo(
    () => BioCapabilities.checkCategory(category, context),
    [category, context?.userId, context?.userRole, context?.entityState, context?.periodStatus]
  );
}
```

---

## 5. Component Integration

### 5.1 CapabilityGate Component

```typescript
// packages/bioskin/src/capabilities/CapabilityGate.tsx

import React from 'react';
import { useCapability } from './useCapability';
import type { CapabilityPath, CapabilityContext } from './types';

interface CapabilityGateProps {
  /** Capability to check */
  capability: CapabilityPath;
  /** Context for evaluation */
  context?: CapabilityContext;
  /** Content to render if enabled */
  children: React.ReactNode;
  /** Fallback if disabled (optional) */
  fallback?: React.ReactNode;
  /** Show tooltip explaining why disabled */
  showReason?: boolean;
}

export function CapabilityGate({
  capability,
  context,
  children,
  fallback = null,
  showReason = false,
}: CapabilityGateProps) {
  const result = useCapability(capability, context);
  
  if (result.enabled) {
    return <>{children}</>;
  }
  
  if (fallback) {
    if (showReason && result.reason) {
      return (
        <Tooltip content={result.reason}>
          <span>{fallback}</span>
        </Tooltip>
      );
    }
    return <>{fallback}</>;
  }
  
  return null;
}
```

### 5.2 Table Integration Example

```typescript
// Integration in BioTable
function BioTable({ data, columns, context, ...props }) {
  const tableCapabilities = useCategoryCapabilities('table', context);
  
  return (
    <div>
      {/* Toolbar with capability-gated actions */}
      <div className="toolbar">
        <CapabilityGate capability="table.csvImport" context={context}>
          <BioTableImport onImport={handleImport} />
        </CapabilityGate>
        
        <CapabilityGate capability="table.csvExport" context={context}>
          <BioTableExport data={data} />
        </CapabilityGate>
        
        <CapabilityGate 
          capability="table.bulkEdit" 
          context={context}
          fallback={<DisabledButton>Bulk Edit</DisabledButton>}
          showReason
        >
          <BioTableBulkEdit selectedRows={selectedRows} />
        </CapabilityGate>
      </div>
      
      {/* Table with conditional features */}
      <Table
        data={data}
        columns={columns}
        enableInlineEdit={tableCapabilities.inlineEdit.enabled}
        enableRowSelection={tableCapabilities.rowSelection.enabled}
        enableVirtualization={tableCapabilities.virtualization.enabled}
      />
    </div>
  );
}
```

---

## 6. Testing

### 6.1 Capability Tests

```typescript
// __tests__/capabilities/BioCapabilities.test.ts

describe('BioCapabilities', () => {
  beforeEach(() => {
    BioRegistry.register(SupplyChainAdapter);
    BioRegistry.activate('supplychain');
  });
  
  describe('Adapter Profile', () => {
    it('returns adapter default for enabled capability', () => {
      const result = BioCapabilities.check('table.inlineEdit');
      expect(result.enabled).toBe(true);
      expect(result.source).toBe('adapter');
    });
    
    it('returns adapter default for disabled capability', () => {
      const result = BioCapabilities.check('table.bulkDelete');
      expect(result.enabled).toBe(false);
      expect(result.source).toBe('adapter');
    });
  });
  
  describe('Context Overrides', () => {
    it('disables edit when period is closed', () => {
      const result = BioCapabilities.check('table.inlineEdit', { periodStatus: 'closed' });
      expect(result.enabled).toBe(false);
      expect(result.source).toBe('context');
      expect(result.reason).toContain('Period is closed');
    });
    
    it('disables update for approved entities', () => {
      const result = BioCapabilities.check('actions.update', { entityState: 'approved' });
      expect(result.enabled).toBe(false);
      expect(result.source).toBe('context');
    });
  });
  
  describe('Compliance Rules', () => {
    beforeEach(() => {
      BioRegistry.register(CorporateAdapter);
      BioRegistry.activate('corporate');
    });
    
    it('always disables audit rollback for SOX', () => {
      const result = BioCapabilities.check('audit.rollback');
      expect(result.enabled).toBe(false);
      expect(result.source).toBe('compliance');
      expect(result.reason).toContain('SOX');
    });
  });
});
```

---

## 7. Summary

### Key Decisions

1. **Hierarchical Capabilities** — `category.feature` path pattern
2. **Four Evaluation Layers** — Adapter → Compliance → Context → Role
3. **Compliance is Non-Negotiable** — Cannot be overridden
4. **React Integration** — Hooks + Gate components

### Capability Enforcement

| Layer | Override Order | Can Override? |
|-------|----------------|---------------|
| **Compliance** | Highest | ❌ Never |
| **Context** | High | ❌ Auto-applied |
| **Role** | Medium | ✅ Per-role config |
| **Adapter** | Baseline | ✅ Per-adapter default |

---

**Status:** ✅ ACTIVE  
**Supersedes:** None (New Contract)  
**Depends On:** CONT_10, CONT_12  
**Last Updated:** 2025-01-XX  
**Maintainer:** AI-BOS Platform Architecture Team  
**Review Cycle:** Quarterly
