# 🎯 BIOSKIN 3.0 CUSTOMIZATION DECISION GUIDE
## Sharp-Eye Framework for Developers

**Canon Code:** SPEC_BIOSKIN_03  
**Purpose:** Help developers identify when to customize BioRegistry, BioCapabilities, or BioTokens  
**Target Audience:** Feature Developers, UI Engineers, Integration Teams  
**Status:** Active — Production Ready  
**Version:** 1.0.0

---

## 📋 Executive Summary

This guide provides a **decision framework** to help you determine **whether you need to customize** the three BioSkin 3.0 systems:

1. **BioRegistry** — Industry-specific content (empty states, commands, filters)
2. **BioCapabilities** — Feature toggling (what users can/cannot do)
3. **BioTokens** — Visual theming (colors, spacing, typography)

---

## 🔍 Quick Decision Matrix

| Question | If YES → | System to Customize |
|----------|----------|---------------------|
| Do different industries need different empty state messages? | Customize | **BioRegistry** |
| Do different industries need different filter presets? | Customize | **BioRegistry** |
| Do different industries need different quick actions? | Customize | **BioRegistry** |
| Should certain features be disabled for compliance reasons? | Customize | **BioCapabilities** |
| Should features vary based on user role or entity state? | Customize | **BioCapabilities** |
| Should the UI look different across industries (colors, branding)? | Customize | **BioTokens** |
| Do you just need to add a new page/component? | **DON'T** customize | Use existing BioSkin |

---

## 1️⃣ BioRegistry: When to Customize

### Decision Triggers

Use the **"Content Varies by Industry"** test:

```
❓ QUESTION: "Does this content need to be different for Supply Chain vs Finance?"

Examples:
- Empty state message: "No invoices yet" vs "No shipments yet" → ✅ YES
- Filter preset: "Overdue invoices" vs "Expired lots" → ✅ YES
- Command label: "Create Invoice" vs "Scan Barcode" → ✅ YES
- Validation message: "Amount required" (same everywhere) → ❌ NO
```

### 📊 Customization Checklist

| Content Type | Customize if... | Example |
|--------------|----------------|---------|
| **Empty States** | Message changes per industry | Finance: "No invoices"<br>SupplyChain: "No shipments" |
| **Commands** | Actions are industry-specific | Finance: "Post Journal Entry"<br>SupplyChain: "Scan to Receive" |
| **Filter Presets** | Filtering logic differs | Finance: "Pending Approval"<br>SupplyChain: "Expiring Soon (FEFO)" |
| **Quick Actions** | Actions vary by context | Finance: "Approve", "Reject"<br>SupplyChain: "Print Label", "Track" |
| **Exception Types** | Industries have unique problems | Finance: "IC Mismatch"<br>SupplyChain: "Temperature Breach" |
| **Validation Messages** | Error terminology differs | Finance: "GL Account required"<br>SupplyChain: "Lot Number required" |

### ✅ CUSTOMIZE: Real-World Examples

#### Example 1: Empty State Customization

**Scenario:** You're building a "Shipments" module for Supply Chain, but Finance doesn't have shipments.

```typescript
// ✅ CUSTOMIZE: Register in SupplyChainAdapter
const SupplyChainAdapter: IndustryAdapter = {
  id: 'supplychain',
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
      ],
    },
  },
  // ... rest of adapter
};

// Usage in component:
function ShipmentsPage() {
  const config = BioRegistry.getEmptyState('shipments');
  return <EmptyState {...config} />;
}
```

#### Example 2: Command Customization

**Scenario:** Supply Chain needs scan-first workflows, Finance needs approval workflows.

```typescript
// ✅ CUSTOMIZE: Different command palettes per industry
const SupplyChainAdapter: IndustryAdapter = {
  commands: [
    { id: 'scan-receive', label: 'Scan to Receive', module: 'warehouse', icon: BarcodeScan, shortcut: 'R' },
    { id: 'scan-pick', label: 'Scan to Pick', module: 'warehouse', icon: BarcodeScan, shortcut: 'P' },
    { id: 'check-temp', label: 'Check Temperature', module: 'coldchain', icon: Thermometer },
  ],
};

const CorporateAdapter: IndustryAdapter = {
  commands: [
    { id: 'approve-invoice', label: 'Approve Invoice', module: 'ap', icon: Check, shortcut: 'A' },
    { id: 'reject-invoice', label: 'Reject Invoice', module: 'ap', icon: X, shortcut: 'R' },
    { id: 'post-journal', label: 'Post Journal Entry', module: 'gl', icon: FileText },
  ],
};
```

#### Example 3: Filter Preset Customization

**Scenario:** Finance needs "Pending Approval" filters, Supply Chain needs "FEFO Violations".

```typescript
// ✅ CUSTOMIZE: Industry-specific filter logic
const SupplyChainAdapter: IndustryAdapter = {
  filterPresets: {
    'warehouse': [
      { 
        id: 'expiring-soon', 
        name: 'Expiring Soon (7 days)', 
        filters: [{ field: 'expiryDate', operator: 'lt', value: 'today+7d' }] 
      },
      { 
        id: 'fefo-violation', 
        name: 'FEFO Violations', 
        filters: [{ field: 'fefoViolation', operator: 'eq', value: true }] 
      },
    ],
  },
};

const CorporateAdapter: IndustryAdapter = {
  filterPresets: {
    'ap': [
      { 
        id: 'pending-approval', 
        name: 'Pending Approval', 
        filters: [{ field: 'status', operator: 'eq', value: 'pending' }] 
      },
      { 
        id: 'overdue', 
        name: 'Overdue Invoices', 
        filters: [{ field: 'dueDate', operator: 'lt', value: 'today' }] 
      },
    ],
  },
};
```

### ❌ DON'T CUSTOMIZE: Wrong Use Cases

#### Anti-Pattern 1: Generic Content

```typescript
// ❌ DON'T DO THIS: Content is the same for all industries
const adapter: IndustryAdapter = {
  emptyStates: {
    'no-data': {
      title: 'No data',  // Too generic, doesn't need adapter
      description: 'No data available',
    },
  },
};

// ✅ DO THIS: Use component default
function MyPage() {
  return data.length === 0 ? (
    <EmptyState title="No data" description="No data available" />
  ) : (
    <Table data={data} />
  );
}
```

#### Anti-Pattern 2: Per-Tenant Customization

```typescript
// ❌ DON'T DO THIS: Creating adapters per tenant
const Tenant123Adapter = { ... };
const Tenant456Adapter = { ... };

// ✅ DO THIS: Use ONE adapter per industry cluster
const SupplyChainAdapter = { ... }; // Used by all Supply Chain tenants
```

---

## 2️⃣ BioCapabilities: When to Customize

### Decision Triggers

Use the **"Feature Availability Varies"** test:

```
❓ QUESTION: "Should this feature be enabled/disabled based on:
   - Industry compliance rules?
   - User role?
   - Entity state (approved, locked, closed)?
   - Context (period closed, read-only mode)?

If YES to ANY → Customize BioCapabilities
```

### 📊 Customization Checklist

| Scenario | Customize if... | Example |
|----------|----------------|---------|
| **Compliance** | Regulations forbid feature | HIPAA: No bulk delete<br>SOX: No audit rollback |
| **Role-Based** | Feature restricted by role | Admin: Can delete<br>Viewer: Cannot delete |
| **State-Based** | Feature depends on entity state | Approved records: Cannot edit<br>Draft: Can edit |
| **Context-Based** | Feature depends on period/lock | Closed period: Cannot post<br>Open period: Can post |
| **Industry Default** | Feature useful in one industry, not others | Supply Chain: Offline mode ✅<br>Finance: Offline mode ❌ |

### ✅ CUSTOMIZE: Real-World Examples

#### Example 1: Compliance-Driven Capability

**Scenario:** HIPAA compliance forbids bulk delete in healthcare.

```typescript
// ✅ CUSTOMIZE: Add compliance rule
const ComplianceRules = {
  'hipaa': {
    'table.bulkDelete': { 
      enabled: false, 
      reason: 'HIPAA: Bulk delete disabled for patient records' 
    },
    'table.inlineEdit': { 
      enabled: false, 
      reason: 'HIPAA: Direct edit disabled, use formal amendment' 
    },
  },
};

// Map to adapter
export function getComplianceRules(adapterId: string) {
  const ruleMap = {
    'healthcare': ['hipaa'],
    'corporate': ['sox'],
    // ...
  };
  return ruleMap[adapterId] ?? [];
}

// Usage in component:
function PatientTable() {
  const bulkDeleteCap = useCapability('table.bulkDelete');
  
  return (
    <BioTable
      data={patients}
      toolbar={
        <CapabilityGate 
          capability="table.bulkDelete"
          fallback={<DisabledButton>Bulk Delete (HIPAA)</DisabledButton>}
          showReason
        >
          <BulkDeleteButton />
        </CapabilityGate>
      }
    />
  );
}
```

#### Example 2: Context-Based Capability

**Scenario:** Users cannot edit records when period is closed.

```typescript
// ✅ CUSTOMIZE: Context evaluation in BioCapabilities
class BioCapabilitiesImpl {
  check(path: CapabilityPath, context?: CapabilityContext): CapabilityResult {
    // ... other checks
    
    // Context check: Period lock
    if (context?.periodStatus === 'closed') {
      const writeActions = ['actions.update', 'actions.delete', 'table.inlineEdit'];
      if (writeActions.includes(path)) {
        return { 
          enabled: false, 
          reason: 'Period is closed. No modifications allowed.', 
          source: 'context' 
        };
      }
    }
    
    // ... rest of checks
  }
}

// Usage in component:
function InvoiceEditPage({ invoice }: Props) {
  const period = usePeriod(invoice.periodId);
  const editCap = useCapability('actions.update', { 
    periodStatus: period.status 
  });
  
  if (!editCap.enabled) {
    return <ErrorState title="Period Closed" description={editCap.reason} />;
  }
  
  return <BioForm mode="edit" data={invoice} />;
}
```

#### Example 3: Industry Profile Capability

**Scenario:** Supply Chain needs offline mode (warehouse connectivity), Finance doesn't.

```typescript
// ✅ CUSTOMIZE: Set different defaults per industry
const CapabilityProfiles = {
  'supplychain': {
    form: {
      offlineMode: true,   // ✅ Warehouse connectivity issues
      draftSave: false,    // Immediate sync required
    },
  },
  'corporate': {
    form: {
      offlineMode: false,  // ❌ Must have connectivity for audit
      draftSave: true,     // ✅ Complex forms need drafts
    },
  },
};

// Usage in component:
function ReceivingForm() {
  const offlineCap = useCapability('form.offlineMode');
  
  return (
    <BioForm
      mode="create"
      enableOffline={offlineCap.enabled}
      onSubmit={handleSubmit}
    />
  );
}
```

### ❌ DON'T CUSTOMIZE: Wrong Use Cases

#### Anti-Pattern 1: Feature Detection

```typescript
// ❌ DON'T USE CAPABILITIES FOR FEATURE DETECTION
const hasDarkMode = useCapability('theme.darkMode');

// ✅ USE REGULAR FEATURE FLAGS OR ENV VARS
const hasDarkMode = process.env.NEXT_PUBLIC_ENABLE_DARK_MODE === 'true';
```

#### Anti-Pattern 2: Business Logic

```typescript
// ❌ DON'T USE CAPABILITIES FOR BUSINESS RULES
const canApprove = useCapability('invoice.approve', { amount: 10000 });

// ✅ USE SERVER-SIDE VALIDATION + POLICIES
const canApprove = await checkApprovalPolicy(userId, invoice.amount);
```

---

## 3️⃣ BioTokens: When to Customize

### Decision Triggers

Use the **"Visual Identity Differs"** test:

```
❓ QUESTION: "Does this industry need a different visual identity?"

Examples:
- Supply Chain: Blue theme (cold chain association) → ✅ YES
- Finance: Navy theme (trust, corporate) → ✅ YES
- All industries: Same button style → ❌ NO
```

### 📊 Customization Checklist

| Visual Element | Customize if... | Example |
|----------------|----------------|---------|
| **Primary Color** | Industries have different branding | Finance: Navy blue<br>SupplyChain: Sky blue<br>AgriOps: Green |
| **Status Colors** | Industries have unique statuses | SupplyChain: "Cold", "Frozen"<br>AgriOps: "Ready", "Growing" |
| **Spacing** | Industry needs denser/looser UI | Manufacturing: Dense (efficiency)<br>Healthcare: Spacious (clarity) |
| **Typography** | Industry needs different fonts | (Rare, usually stays consistent) |
| **Dark Mode** | All industries → ❌ NO | Use global dark mode tokens |

### ✅ CUSTOMIZE: Real-World Examples

#### Example 1: Industry Primary Color

**Scenario:** Supply Chain needs blue (cold chain), AgriOps needs green (growth).

```typescript
// ✅ CUSTOMIZE: Define adapter token overrides
const SupplyChainAdapter: IndustryAdapter = {
  tokens: {
    colors: {
      primary: '#0ea5e9',      // Sky blue for cold chain
      primaryHover: '#0284c7',
      primaryLight: '#e0f2fe',
    },
  },
};

const AgriOpsAdapter: IndustryAdapter = {
  tokens: {
    colors: {
      primary: '#16a34a',      // Green for growth
      primaryHover: '#15803d',
      primaryLight: '#dcfce7',
    },
  },
};

// CSS generated:
// [data-adapter="supplychain"] {
//   --bio-primary: #0ea5e9;
//   --bio-primary-hover: #0284c7;
// }
//
// [data-adapter="agriops"] {
//   --bio-primary: #16a34a;
//   --bio-primary-hover: #15803d;
// }
```

#### Example 2: Industry-Specific Status Colors

**Scenario:** Supply Chain needs temperature status colors.

```typescript
// ✅ CUSTOMIZE: Add industry-specific statuses
const SupplyChainAdapter: IndustryAdapter = {
  tokens: {
    // Standard statuses (inherited)
    status: {
      success: '#22c55e',
      warning: '#f59e0b',
      danger: '#ef4444',
    },
    // Custom statuses (industry-specific)
    customStatus: {
      cold: '#0ea5e9',        // Temperature within cold range
      coldBg: '#e0f2fe',
      frozen: '#3b82f6',      // Temperature within frozen range
      frozenBg: '#dbeafe',
    },
  },
};

// Usage in component:
function TemperatureBadge({ temp, range }) {
  const statusColor = range === 'frozen' 
    ? 'var(--bio-status-frozen)' 
    : 'var(--bio-status-cold)';
    
  return (
    <Badge style={{ backgroundColor: statusColor }}>
      {temp}°C ({range})
    </Badge>
  );
}
```

### ❌ DON'T CUSTOMIZE: Wrong Use Cases

#### Anti-Pattern 1: Component-Specific Colors

```typescript
// ❌ DON'T CREATE TOKENS FOR EVERY COMPONENT
const adapter: IndustryAdapter = {
  tokens: {
    buttonBg: '#...',     // ❌ Too specific
    tableBorder: '#...',  // ❌ Too specific
    navHover: '#...',     // ❌ Too specific
  },
};

// ✅ USE SEMANTIC TOKENS
// Components already use:
// - Buttons: var(--bio-primary)
// - Tables: var(--bio-border)
// - Nav: var(--bio-bg-hover)
```

#### Anti-Pattern 2: Per-Tenant Theming

```typescript
// ❌ DON'T CREATE TOKENS PER TENANT
const Tenant123Tokens = { primary: '#ff0000' };
const Tenant456Tokens = { primary: '#00ff00' };

// ✅ USE RUNTIME TOKEN OVERRIDES
<BioTokenProvider
  adapterId="supplychain"
  tokenOverrides={{
    primary: tenantBrandColor,  // From tenant config
  }}
>
  {children}
</BioTokenProvider>
```

---

## 🎯 Decision Flowchart

```
┌─────────────────────────────────────────────────────────────────┐
│ START: Do I need to customize BioSkin 3.0?                      │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ↓
         ┌────────────────────────────┐
         │ Does CONTENT vary by       │
         │ industry?                  │
         │ (messages, commands,       │
         │  filters, quick actions)   │
         └─────────┬──────────────────┘
                   │
          ┌────────┴────────┐
          │ YES             │ NO
          ↓                 ↓
    ┌─────────────┐   ┌────────────────────────────┐
    │ CUSTOMIZE   │   │ Does FEATURE AVAILABILITY  │
    │ BioRegistry │   │ vary by industry/role/     │
    └─────────────┘   │ context/compliance?        │
                      └─────────┬──────────────────┘
                                │
                       ┌────────┴────────┐
                       │ YES             │ NO
                       ↓                 ↓
                 ┌─────────────────┐   ┌────────────────────────────┐
                 │ CUSTOMIZE       │   │ Does VISUAL IDENTITY       │
                 │ BioCapabilities │   │ vary by industry?          │
                 └─────────────────┘   │ (colors, branding)         │
                                       └─────────┬──────────────────┘
                                                 │
                                        ┌────────┴────────┐
                                        │ YES             │ NO
                                        ↓                 ↓
                                  ┌──────────────┐   ┌──────────────────┐
                                  │ CUSTOMIZE    │   │ ✅ NO            │
                                  │ BioTokens    │   │ CUSTOMIZATION    │
                                  └──────────────┘   │ NEEDED           │
                                                     │                  │
                                                     │ Use existing     │
                                                     │ BioSkin          │
                                                     │ components       │
                                                     └──────────────────┘
```

---

## 📝 Customization Checklist

Before customizing, ask yourself:

### BioRegistry Checklist

- [ ] Does this empty state message vary by industry?
- [ ] Do filter presets differ across industries?
- [ ] Are quick actions industry-specific?
- [ ] Do commands/actions have different names?
- [ ] Are exception types unique to this industry?
- [ ] If **any** YES → Customize BioRegistry

### BioCapabilities Checklist

- [ ] Is this feature forbidden by compliance (HIPAA, SOX, FDA)?
- [ ] Should this feature be role-restricted?
- [ ] Does this feature depend on entity state (approved, locked)?
- [ ] Does this feature depend on period status (open, closed)?
- [ ] Should this feature be enabled in one industry but not others?
- [ ] If **any** YES → Customize BioCapabilities

### BioTokens Checklist

- [ ] Does this industry need a unique primary color?
- [ ] Does this industry have unique status types?
- [ ] Should spacing/density differ for this industry?
- [ ] If **any** YES → Customize BioTokens

---

## 🚫 Common Anti-Patterns to Avoid

| Anti-Pattern | Why It's Wrong | Right Approach |
|--------------|----------------|----------------|
| Creating adapter per tenant | Defeats multi-tenant architecture | One adapter per industry cluster |
| Using capabilities for feature detection | Capabilities are for UX, not env config | Use environment variables |
| Creating tokens for every component | Over-granular, unmaintainable | Use semantic tokens |
| Customizing when content is generic | Unnecessary overhead | Use component defaults |
| Using BioRegistry for business logic | Registry is for UI content only | Use server-side policies |

---

## 🎓 Training Scenarios

### Scenario 1: Adding a New "Orders" Module

**Question:** Do I need to customize?

**Analysis:**
- Orders exist in **all** industries (F&B, Retail, Manufacturing)
- Empty state: "No orders yet" — Same for all → ❌ No Registry
- Actions: "Create Order" — Same for all → ❌ No Registry
- Features: All industries need create/edit → ❌ No Capabilities
- Colors: Use industry theme → ❌ No Tokens

**Answer:** ✅ **NO customization needed.** Use existing BioSkin components.

---

### Scenario 2: Adding "Temperature Monitoring"

**Question:** Do I need to customize?

**Analysis:**
- Temperature monitoring is **Supply Chain only**
- Empty state: "No temperature alerts" — Industry-specific → ✅ Registry
- Actions: "Check Temperature" — Industry-specific → ✅ Registry
- Status colors: "Cold", "Frozen" — Industry-specific → ✅ Tokens
- Features: Not applicable to Finance → ❌ No Capabilities (just don't show the module)

**Answer:** ✅ **Customize BioRegistry + BioTokens**

```typescript
const SupplyChainAdapter: IndustryAdapter = {
  emptyStates: {
    'temperature-alerts': {
      icon: Thermometer,
      title: 'No temperature alerts',
      description: 'All shipments within safe temperature ranges',
    },
  },
  commands: [
    { id: 'check-temp', label: 'Check Temperature', module: 'coldchain', icon: Thermometer },
  ],
  tokens: {
    customStatus: {
      cold: '#0ea5e9',
      frozen: '#3b82f6',
    },
  },
};
```

---

### Scenario 3: Adding "Audit Rollback" Feature

**Question:** Do I need to customize?

**Analysis:**
- Audit rollback is a **compliance issue**
- SOX: Forbids audit rollback → ✅ Capabilities (compliance)
- HIPAA: Forbids audit rollback → ✅ Capabilities (compliance)
- Content: Same error message → ❌ No Registry
- Visuals: Same button style → ❌ No Tokens

**Answer:** ✅ **Customize BioCapabilities (compliance rule)**

```typescript
const ComplianceRules = {
  'sox': {
    'audit.rollback': { 
      enabled: false, 
      reason: 'SOX: Rollback disabled for audit integrity' 
    },
  },
  'hipaa': {
    'audit.rollback': { 
      enabled: false, 
      reason: 'HIPAA: Rollback disabled for audit integrity' 
    },
  },
};
```

---

## 🎯 Summary: When to Customize

| System | Customize When... | Don't Customize When... |
|--------|-------------------|-------------------------|
| **BioRegistry** | Content varies by industry | Content is generic/universal |
| **BioCapabilities** | Features must be controlled by compliance/role/context | Feature is always available |
| **BioTokens** | Visual identity differs by industry | Visuals are consistent |

---

## 📚 Next Steps

After reading this guide:

1. **Audit your current implementation** — Are you customizing unnecessarily?
2. **Review your adapters** — Do they follow the cluster strategy (5 adapters, not 15+)?
3. **Check compliance** — Are you using BioCapabilities for compliance rules?
4. **Validate tokens** — Are you using semantic tokens, not hardcoded colors?

---

**Document Status:** ✅ Active  
**Created:** 2025-01-XX  
**Last Updated:** 2025-01-XX  
**Maintainer:** AI-BOS Platform Architecture Team  
**Related Contracts:** CONT_11, CONT_12, CONT_13, CONT_14  
**Related PRD:** PRD_BIOSKIN_02
