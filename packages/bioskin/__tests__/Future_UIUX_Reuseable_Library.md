# 🧬 Future UI/UX Reusable Library — Canon → Molecule → Cell Architecture

> **Purpose:** Implement once, reuse across industries (Finance, Healthcare, Manufacturing, Retail, etc.)  
> **Architecture Pattern:** Canon (Governance) → Molecule (Patterns) → Cell (Components)  
> **Status:** Design Specification  
> **Version:** 1.0.0

---

## Executive Summary

This document maps the **10 outstanding UI/UX capabilities** to a **three-layer reusable architecture**:

1. **Canon (Plane A - Governance)** — Immutable UI/UX contracts and standards
2. **Molecule (Plane B - Functional)** — Industry-agnostic reusable UI patterns
3. **Cell (Plane C - Atomic)** — Base components and primitives

**Goal:** Build UI/UX components that work identically across Finance, Healthcare, Manufacturing, Retail, and any future industry without rewriting.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    CANON (Governance Layer)                       │
│  Immutable UI/UX contracts, standards, and design principles     │
│  Example: CONT_11_UIUXStandards.md                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  MOLECULE (Pattern Layer)                        │
│  Industry-agnostic reusable UI patterns and composed components │
│  Example: MOL_EmptyState, MOL_CommandPalette, MOL_Table         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    CELL (Component Layer)                        │
│  Atomic UI components, primitives, and base building blocks     │
│  Example: CELL_Surface, CELL_Button, CELL_Input                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Layer 1: Canon (Governance — Plane A)

### Purpose
**Immutable UI/UX contracts** that define standards, principles, and non-negotiable rules for all industries.

### Structure
```
canon/A-Governance/A-CONT/
├── CONT_11_UIUXStandards.md          # Core UI/UX principles
├── CONT_12_AccessibilityStandards.md # A11y requirements
├── CONT_13_PerformanceStandards.md    # Performance benchmarks
└── CONT_14_DesignTokens.md           # Design system tokens
```

### Canon Contracts

#### CONT_11: UI/UX Standards Contract

**Canon Code:** `CONT_11`  
**Version:** 1.0.0  
**Plane:** A — Governance  
**Binding Scope:** All UI/UX implementations across all industries

**Non-Negotiable Principles:**

1. **Zero-Friction Onboarding**
   - Every empty state MUST teach: what, why, how
   - Every empty state MUST provide a clear action to create the first record
   - Empty states MUST be contextual to the module/domain

2. **Global Command Palette**
   - Every application MUST support ⌘K / Ctrl+K
   - Command palette MUST support fuzzy search
   - Command palette MUST show recent searches

3. **Instant Search & Filters**
   - Search MUST be debounced (max 300ms)
   - Filters MUST be shareable via URL
   - Filters MUST support saved views

4. **Excel-Level Table Experience**
   - Tables MUST support: sorting, filtering, pagination, selection
   - Tables MUST support virtualization for 1000+ rows
   - Tables MUST support CSV export/import
   - Tables MUST support keyboard navigation

5. **Permission-Aware UX**
   - UI MUST adapt to user permissions (hide/disable actions)
   - UI MUST explain why actions are disabled
   - Field-level security MUST be enforced

6. **Audit-Ready Activity Timeline**
   - Every state-changing action MUST be logged
   - Timeline MUST show: who, what, when, where
   - Timeline MUST support before/after diffs

7. **Inline Validation**
   - Validation MUST happen in real-time (onChange or debounced)
   - Errors MUST be explained in plain language
   - Auto-repair suggestions MUST be provided when possible

8. **Smart Defaults & Templates**
   - Every form MUST support templates
   - Every form MUST support cloning
   - Defaults MUST be context-aware (date = today, user = current)

9. **Fast Navigation**
   - Applications MUST support tabs or split view
   - Navigation MUST preserve context (filters, scroll position)
   - Breadcrumbs MUST be present on detail pages

10. **Performance & Resilience**
    - Optimistic UI updates MUST be used for mutations
    - Offline detection MUST be implemented
    - Error states MUST explain what happened and how to recover

---

## Layer 2: Molecule (Pattern Layer — Plane B)

### Purpose
**Industry-agnostic reusable UI patterns** that compose Cells into complete user experiences. These patterns work identically across Finance, Healthcare, Manufacturing, etc.

### Structure
```
packages/bioskin/src/molecules/
├── MOL_EmptyState/              # Zero-friction onboarding pattern
├── MOL_CommandPalette/          # Global command palette pattern
├── MOL_SearchFilters/           # Search + filters pattern
├── MOL_TableExperience/         # Excel-level table pattern
├── MOL_PermissionAware/          # Permission-aware UX pattern
├── MOL_ActivityTimeline/         # Audit-ready timeline pattern
├── MOL_Validation/              # Inline validation pattern
├── MOL_Templates/               # Smart defaults + templates pattern
├── MOL_Navigation/              # Fast navigation pattern
└── MOL_Resilience/              # Performance & resilience pattern
```

### Molecule Specifications

#### MOL_EmptyState — Zero-Friction Onboarding

**Molecule Code:** `MOL_EmptyState`  
**Purpose:** Guided empty states that teach users what to do next  
**Industry Agnostic:** ✅ Works for Finance (invoices), Healthcare (patients), Manufacturing (orders)

**Interface:**
```typescript
interface EmptyStateProps {
  // Canon-defined (immutable)
  icon: LucideIcon;
  title: string;
  description: string;
  action: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  
  // Industry-specific (configurable)
  hints?: string[];                    // Tips for this domain
  quickActions?: QuickAction[];        // Domain-specific quick actions
  module?: string;                      // 'ap' | 'ar' | 'gl' | 'patients' | 'orders'
  contextualHelp?: ContextualHelp;     // Module-specific help
}

interface QuickAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}

interface ContextualHelp {
  videoUrl?: string;
  docsUrl?: string;
  examples?: Example[];
}
```

**Implementation:**
```tsx
// packages/bioskin/src/molecules/MOL_EmptyState/EmptyState.tsx
export function EmptyState({
  icon,
  title,
  description,
  action,
  hints,
  quickActions,
  module,
  contextualHelp,
}: EmptyStateProps) {
  // Base implementation (works for all industries)
  return (
    <Surface variant="subtle" padding="lg">
      <Icon className="w-12 h-12" />
      <Txt variant="heading">{title}</Txt>
      <Txt variant="body">{description}</Txt>
      <Btn onClick={action.onClick}>{action.label}</Btn>
      
      {/* Industry-specific enhancements */}
      {hints && <HintsList hints={hints} />}
      {quickActions && <QuickActionsList actions={quickActions} />}
      {contextualHelp && <ContextualHelp help={contextualHelp} />}
    </Surface>
  );
}
```

**Usage (Finance):**
```tsx
<EmptyState
  icon={FileInvoice}
  title="No invoices yet"
  description="Create your first invoice to get started with Accounts Payable"
  action={{ label: "Create Invoice", onClick: () => navigate('/ap/invoices/new') }}
  module="ap"
  hints={["Tip: Use templates to speed up invoice creation", "You can import invoices from CSV"]}
  quickActions={[
    { label: "Import CSV", icon: Upload, onClick: () => importCSV() },
    { label: "Use Template", icon: FileText, onClick: () => useTemplate() }
  ]}
/>
```

**Usage (Healthcare):**
```tsx
<EmptyState
  icon={Users}
  title="No patients yet"
  description="Add your first patient to start managing healthcare records"
  action={{ label: "Add Patient", onClick: () => navigate('/patients/new') }}
  module="patients"
  hints={["Tip: You can bulk import patients from CSV", "Link patients to insurance providers"]}
  quickActions={[
    { label: "Import CSV", icon: Upload, onClick: () => importPatients() },
    { label: "Link Insurance", icon: Shield, onClick: () => linkInsurance() }
  ]}
/>
```

---

#### MOL_CommandPalette — Global Command Palette

**Molecule Code:** `MOL_CommandPalette`  
**Purpose:** Global ⌘K / Ctrl+K command palette with fuzzy search  
**Industry Agnostic:** ✅ Works for all industries

**Interface:**
```typescript
interface CommandPaletteProps {
  // Canon-defined (immutable)
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commands: Command[];
  onSelect: (command: Command) => void;
  
  // Industry-specific (configurable)
  recentSearches?: string[];
  shortcuts?: Record<string, string>;  // Custom shortcuts per industry
  categories?: Category[];             // Industry-specific categories
}

interface Command {
  id: string;
  label: string;
  keywords?: string[];
  category?: string;
  icon?: LucideIcon;
  shortcut?: string;
  onSelect?: () => void;
  href?: string;
  // Industry-specific
  module?: string;                     // 'ap' | 'ar' | 'patients' | 'orders'
  permissions?: string[];               // Required permissions
}
```

**Implementation:**
```tsx
// packages/bioskin/src/molecules/MOL_CommandPalette/CommandPalette.tsx
export function CommandPalette({
  open,
  onOpenChange,
  commands,
  onSelect,
  recentSearches,
  shortcuts,
  categories,
}: CommandPaletteProps) {
  // Base implementation with fuzzy search (works for all industries)
  return (
    <Command.Dialog open={open} onOpenChange={onOpenChange}>
      <Command.Input placeholder="Type a command or search..." />
      <Command.List>
        {categories?.map(category => (
          <Command.Group key={category.id} heading={category.label}>
            {commands
              .filter(cmd => cmd.category === category.id)
              .map(cmd => (
                <Command.Item key={cmd.id} onSelect={() => onSelect(cmd)}>
                  <cmd.icon />
                  <span>{cmd.label}</span>
                  {cmd.shortcut && <kbd>{cmd.shortcut}</kbd>}
                </Command.Item>
              ))}
          </Command.Group>
        ))}
      </Command.List>
    </Command.Dialog>
  );
}
```

**Usage (Finance):**
```tsx
<CommandPalette
  commands={[
    { id: 'create-invoice', label: 'Create Invoice', category: 'ap', module: 'ap' },
    { id: 'create-payment', label: 'Create Payment', category: 'ap', module: 'ap' },
    { id: 'view-ledger', label: 'View General Ledger', category: 'gl', module: 'gl' },
  ]}
  categories={[
    { id: 'ap', label: 'Accounts Payable' },
    { id: 'ar', label: 'Accounts Receivable' },
    { id: 'gl', label: 'General Ledger' },
  ]}
/>
```

**Usage (Healthcare):**
```tsx
<CommandPalette
  commands={[
    { id: 'add-patient', label: 'Add Patient', category: 'patients', module: 'patients' },
    { id: 'schedule-appointment', label: 'Schedule Appointment', category: 'appointments', module: 'appointments' },
    { id: 'view-chart', label: 'View Patient Chart', category: 'patients', module: 'patients' },
  ]}
  categories={[
    { id: 'patients', label: 'Patients' },
    { id: 'appointments', label: 'Appointments' },
    { id: 'billing', label: 'Billing' },
  ]}
/>
```

---

#### MOL_SearchFilters — Blazing Search + Filters

**Molecule Code:** `MOL_SearchFilters`  
**Purpose:** Instant search with debouncing, saved views, shareable URLs  
**Industry Agnostic:** ✅ Works for all industries

**Interface:**
```typescript
interface SearchFiltersProps {
  // Canon-defined (immutable)
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: Filter[];
  onFilterChange: (filters: Filter[]) => void;
  debounceMs?: number;                  // Default: 300ms
  
  // Industry-specific (configurable)
  savedViews?: SavedView[];
  onSaveView?: (name: string, filters: Filter[]) => void;
  shareableUrl?: boolean;                // Enable URL sync
  recentFilters?: Filter[];              // Recently used filters
  filterPresets?: FilterPreset[];        // Industry-specific presets
}

interface Filter {
  field: string;
  operator: 'eq' | 'gt' | 'lt' | 'contains' | 'between';
  value: unknown;
  label: string;                          // Human-readable label
}

interface SavedView {
  id: string;
  name: string;
  filters: Filter[];
  isDefault?: boolean;
  isShared?: boolean;
}

interface FilterPreset {
  id: string;
  name: string;
  filters: Filter[];
  module?: string;                       // Industry-specific
}
```

**Implementation:**
```tsx
// packages/bioskin/src/molecules/MOL_SearchFilters/SearchFilters.tsx
export function SearchFilters({
  searchValue,
  onSearchChange,
  filters,
  onFilterChange,
  debounceMs = 300,
  savedViews,
  onSaveView,
  shareableUrl = false,
  recentFilters,
  filterPresets,
}: SearchFiltersProps) {
  // Debounced search (works for all industries)
  const debouncedSearch = useDebouncedCallback(onSearchChange, debounceMs);
  
  // URL sync (if enabled)
  useEffect(() => {
    if (shareableUrl) {
      const params = new URLSearchParams();
      filters.forEach(filter => {
        params.set(filter.field, String(filter.value));
      });
      window.history.replaceState({}, '', `?${params.toString()}`);
    }
  }, [filters, shareableUrl]);
  
  return (
    <div>
      <Input
        value={searchValue}
        onChange={(e) => debouncedSearch(e.target.value)}
        placeholder="Search..."
      />
      <ActiveFilters filters={filters} onClear={onFilterChange} />
      {savedViews && <SavedViewsList views={savedViews} onLoad={onFilterChange} />}
      {filterPresets && <FilterPresets presets={filterPresets} onApply={onFilterChange} />}
    </div>
  );
}
```

**Usage (Finance):**
```tsx
<SearchFilters
  searchValue={search}
  onSearchChange={setSearch}
  filters={filters}
  onFilterChange={setFilters}
  shareableUrl={true}
  savedViews={[
    { id: '1', name: 'Approved Invoices', filters: [{ field: 'status', operator: 'eq', value: 'approved', label: 'Status: Approved' }] },
    { id: '2', name: 'This Month', filters: [{ field: 'date', operator: 'between', value: [startOfMonth, endOfMonth], label: 'Date: This Month' }] },
  ]}
  filterPresets={[
    { id: 'pending', name: 'Pending Approval', filters: [{ field: 'status', operator: 'eq', value: 'pending', label: 'Status: Pending' }], module: 'ap' },
  ]}
/>
```

**Usage (Healthcare):**
```tsx
<SearchFilters
  searchValue={search}
  onSearchChange={setSearch}
  filters={filters}
  onFilterChange={setFilters}
  shareableUrl={true}
  savedViews={[
    { id: '1', name: 'Active Patients', filters: [{ field: 'status', operator: 'eq', value: 'active', label: 'Status: Active' }] },
  ]}
  filterPresets={[
    { id: 'today', name: 'Today\'s Appointments', filters: [{ field: 'date', operator: 'eq', value: today, label: 'Date: Today' }], module: 'appointments' },
  ]}
/>
```

---

#### MOL_TableExperience — Excel-Level Table

**Molecule Code:** `MOL_TableExperience`  
**Purpose:** Excel-level table with virtualization, column management, inline editing  
**Industry Agnostic:** ✅ Works for all industries

**Interface:**
```typescript
interface TableExperienceProps<T> {
  // Canon-defined (immutable)
  data: T[];
  columns: ColumnDef<T>[];
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enablePagination?: boolean;
  enableSelection?: boolean;
  
  // Industry-specific (configurable)
  enableColumnPinning?: boolean;
  enableColumnResizing?: boolean;
  enableColumnReordering?: boolean;
  enableInlineEdit?: boolean;
  enableCSVImport?: boolean;
  enableCSVExport?: boolean;
  keyboardNavigation?: boolean;
  bulkActions?: BulkAction[];
  rowActions?: RowAction[];
  module?: string;                      // Industry-specific customization
}
```

**Implementation:**
```tsx
// packages/bioskin/src/molecules/MOL_TableExperience/TableExperience.tsx
export function TableExperience<T>({
  data,
  columns,
  enableSorting = true,
  enableFiltering = true,
  enablePagination = true,
  enableSelection = false,
  enableColumnPinning = false,
  enableColumnResizing = false,
  enableColumnReordering = false,
  enableInlineEdit = false,
  enableCSVImport = false,
  enableCSVExport = true,
  keyboardNavigation = true,
  bulkActions,
  rowActions,
  module,
}: TableExperienceProps<T>) {
  // Base table implementation (works for all industries)
  const table = useReactTable({
    data,
    columns,
    enableSorting,
    enableFiltering,
    enablePagination,
    enableColumnPinning,
    enableColumnResizing,
    enableColumnReordering,
  });
  
  return (
    <div>
      {enableCSVImport && <CSVImportButton onImport={handleImport} />}
      {enableCSVExport && <CSVExportButton data={data} />}
      {bulkActions && <BulkActionsMenu actions={bulkActions} />}
      <Table table={table} />
      {enableInlineEdit && <InlineEditHandler />}
      {keyboardNavigation && <KeyboardNavigationHandler />}
    </div>
  );
}
```

---

#### MOL_PermissionAware — Permission-Aware UX

**Molecule Code:** `MOL_PermissionAware`  
**Purpose:** UI that adapts to user permissions  
**Industry Agnostic:** ✅ Works for all industries

**Interface:**
```typescript
interface PermissionAwareProps {
  // Canon-defined (immutable)
  user: User;
  permissions: PermissionMap;
  children: React.ReactNode;
  
  // Industry-specific (configurable)
  fieldSecurity?: FieldSecurityMap;      // Field-level security rules
  statePermissions?: StatePermissionMap; // State-based permissions
  onRequestAccess?: (permission: string) => void; // Request access flow
}
```

---

#### MOL_ActivityTimeline — Audit-Ready Timeline

**Molecule Code:** `MOL_ActivityTimeline`  
**Purpose:** Activity timeline with audit trail, diffs, attachments  
**Industry Agnostic:** ✅ Works for all industries

**Interface:**
```typescript
interface ActivityTimelineProps {
  // Canon-defined (immutable)
  items: TimelineItem[];
  showDiffs?: boolean;
  showAttachments?: boolean;
  
  // Industry-specific (configurable)
  enableComments?: boolean;
  enableExport?: boolean;
  filters?: TimelineFilter[];
  module?: string;
}
```

---

#### MOL_Validation — Inline Validation + Auto-Repair

**Molecule Code:** `MOL_Validation`  
**Purpose:** Real-time validation with auto-repair hints  
**Industry Agnostic:** ✅ Works for all industries

**Interface:**
```typescript
interface ValidationProps {
  // Canon-defined (immutable)
  schema: ZodSchema;
  value: unknown;
  onChange: (value: unknown) => void;
  validationMode?: 'onChange' | 'onBlur' | 'onSubmit';
  
  // Industry-specific (configurable)
  autoRepair?: AutoRepairRule[];
  errorMessages?: Record<string, string>; // Custom error messages
  examples?: string[];                    // Field examples
  validationExplanation?: string;        // Plain language explanation
}
```

---

#### MOL_Templates — Smart Defaults + Templates

**Molecule Code:** `MOL_Templates`  
**Purpose:** Template system with cloning and smart defaults  
**Industry Agnostic:** ✅ Works for all industries

**Interface:**
```typescript
interface TemplatesProps {
  // Canon-defined (immutable)
  templates: Template[];
  onUseTemplate: (template: Template) => void;
  onClone: (sourceId: string, modifications?: Partial<T>) => void;
  
  // Industry-specific (configurable)
  smartDefaults?: SmartDefaultRule[];
  module?: string;
  teamPresets?: TeamPreset[];
}
```

---

#### MOL_Navigation — Fast Navigation + Multi-Tasking

**Molecule Code:** `MOL_Navigation`  
**Purpose:** Tab system, split view, context preservation  
**Industry Agnostic:** ✅ Works for all industries

**Interface:**
```typescript
interface NavigationProps {
  // Canon-defined (immutable)
  tabs?: Tab[];
  onTabClose?: (tabId: string) => void;
  splitView?: SplitViewConfig;
  
  // Industry-specific (configurable)
  preserveContext?: boolean;              // Preserve filters, scroll position
  navigationHistory?: boolean;            // Enable back/forward
  module?: string;
}
```

---

#### MOL_Resilience — Performance & Resilience UX

**Molecule Code:** `MOL_Resilience`  
**Purpose:** Optimistic UI, offline handling, error recovery  
**Industry Agnostic:** ✅ Works for all industries

**Interface:**
```typescript
interface ResilienceProps {
  // Canon-defined (immutable)
  optimisticUpdates?: boolean;
  offlineDetection?: boolean;
  errorRecovery?: boolean;
  
  // Industry-specific (configurable)
  syncIndicator?: boolean;
  conflictResolution?: ConflictResolutionStrategy;
  module?: string;
}
```

---

## Layer 3: Cell (Component Layer — Plane C)

### Purpose
**Atomic UI components** and primitives that Molecules compose. These are the base building blocks.

### Structure
```
packages/bioskin/src/atoms/
├── CELL_Surface/              # Container primitive
├── CELL_Txt/                  # Text primitive
├── CELL_Btn/                  # Button primitive
├── CELL_Input/                # Input primitive
├── CELL_Select/               # Select primitive
├── CELL_Icon/                 # Icon primitive
└── CELL_Stack/                # Layout primitive
```

### Cell Specifications

#### CELL_Surface — Container Primitive

**Cell Code:** `CELL_Surface`  
**Purpose:** Base container component with variants  
**Industry Agnostic:** ✅ Works for all industries

**Interface:**
```typescript
interface SurfaceProps {
  variant?: 'default' | 'subtle' | 'nested' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  children: React.ReactNode;
}
```

---

#### CELL_Txt — Text Primitive

**Cell Code:** `CELL_Txt`  
**Purpose:** Typography component with semantic variants  
**Industry Agnostic:** ✅ Works for all industries

**Interface:**
```typescript
interface TxtProps {
  variant?: 'display' | 'heading' | 'subheading' | 'body' | 'small' | 'label' | 'micro';
  color?: 'primary' | 'secondary' | 'tertiary' | 'muted';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  children: React.ReactNode;
}
```

---

#### CELL_Btn — Button Primitive

**Cell Code:** `CELL_Btn`  
**Purpose:** Button component with variants and states  
**Industry Agnostic:** ✅ Works for all industries

**Interface:**
```typescript
interface BtnProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}
```

---

## Implementation Roadmap

### Phase 1: Canon Contracts (Week 1)
- [ ] Create `CONT_11_UIUXStandards.md`
- [ ] Create `CONT_12_AccessibilityStandards.md`
- [ ] Create `CONT_13_PerformanceStandards.md`
- [ ] Create `CONT_14_DesignTokens.md`

### Phase 2: Molecules (Weeks 2-5)
- [ ] Implement `MOL_EmptyState`
- [ ] Implement `MOL_CommandPalette`
- [ ] Implement `MOL_SearchFilters`
- [ ] Implement `MOL_TableExperience`
- [ ] Implement `MOL_PermissionAware`
- [ ] Implement `MOL_ActivityTimeline`
- [ ] Implement `MOL_Validation`
- [ ] Implement `MOL_Templates`
- [ ] Implement `MOL_Navigation`
- [ ] Implement `MOL_Resilience`

### Phase 3: Cells (Week 6)
- [ ] Enhance existing atoms (Surface, Txt, Btn, etc.)
- [ ] Ensure all Cells are industry-agnostic
- [ ] Document Cell interfaces

### Phase 4: Industry Adapters (Weeks 7-8)
- [ ] Create Finance adapter (maps Finance domain to Molecules)
- [ ] Create Healthcare adapter (maps Healthcare domain to Molecules)
- [ ] Create Manufacturing adapter (maps Manufacturing domain to Molecules)
- [ ] Document adapter pattern

---

## Usage Examples by Industry

### Finance (Accounts Payable)

```tsx
// apps/web/app/ap/invoices/page.tsx
import { MOL_EmptyState, MOL_TableExperience, MOL_SearchFilters } from '@aibos/bioskin';

export default function InvoicesPage() {
  const invoices = await getInvoices();
  
  if (invoices.length === 0) {
    return (
      <MOL_EmptyState
        module="ap"
        icon={FileInvoice}
        title="No invoices yet"
        description="Create your first invoice to get started"
        action={{ label: "Create Invoice", onClick: () => navigate('/ap/invoices/new') }}
        hints={["Tip: Use templates", "Import from CSV"]}
      />
    );
  }
  
  return (
    <div>
      <MOL_SearchFilters
        searchValue={search}
        onSearchChange={setSearch}
        filters={filters}
        onFilterChange={setFilters}
        shareableUrl={true}
        module="ap"
      />
      <MOL_TableExperience
        data={invoices}
        columns={invoiceColumns}
        enableCSVExport
        enableCSVImport
        enableInlineEdit
        module="ap"
      />
    </div>
  );
}
```

### Healthcare (Patients)

```tsx
// apps/web/app/patients/page.tsx
import { MOL_EmptyState, MOL_TableExperience, MOL_SearchFilters } from '@aibos/bioskin';

export default function PatientsPage() {
  const patients = await getPatients();
  
  if (patients.length === 0) {
    return (
      <MOL_EmptyState
        module="patients"
        icon={Users}
        title="No patients yet"
        description="Add your first patient to start managing records"
        action={{ label: "Add Patient", onClick: () => navigate('/patients/new') }}
        hints={["Tip: Bulk import from CSV", "Link to insurance providers"]}
      />
    );
  }
  
  return (
    <div>
      <MOL_SearchFilters
        searchValue={search}
        onSearchChange={setSearch}
        filters={filters}
        onFilterChange={setFilters}
        shareableUrl={true}
        module="patients"
      />
      <MOL_TableExperience
        data={patients}
        columns={patientColumns}
        enableCSVExport
        enableCSVImport
        module="patients"
      />
    </div>
  );
}
```

**Notice:** The same Molecules work for both industries! Only the `module` prop and domain-specific data change.

---

## Benefits

### 1. **Write Once, Use Everywhere**
- Implement Molecules once in `@aibos/bioskin`
- Reuse across Finance, Healthcare, Manufacturing, Retail, etc.
- No rewriting UI/UX for each industry

### 2. **Consistent User Experience**
- Same patterns across all industries
- Users learn once, use everywhere
- Reduced training costs

### 3. **Maintainability**
- Single source of truth for UI patterns
- Bug fixes benefit all industries
- Feature additions benefit all industries

### 4. **Scalability**
- Add new industries by creating adapters only
- No UI/UX code duplication
- Faster time-to-market for new industries

### 5. **Governance**
- Canon contracts enforce standards
- Non-negotiable principles prevent drift
- Consistent quality across industries

---

## Next Steps

1. **Review this document** with the team
2. **Approve Canon contracts** (CONT_11, CONT_12, CONT_13, CONT_14)
3. **Start Phase 1** — Create Canon contracts
4. **Start Phase 2** — Implement Molecules
5. **Test with Finance** — Validate pattern works
6. **Expand to Healthcare** — Prove industry-agnostic design

---

**Document Version:** 1.0.0  
**Last Updated:** 2025-01-XX  
**Next Review:** After Phase 1 completion
