> **🟢 [ACTIVE]** — Certified for Production  
> **Canon Code:** CONT_11  
> **Version:** 1.0.0  
> **Certified Date:** 2025-01-XX  
> **Plane:** A — Governance (Contract)  
> **Binding Scope:** All AI-BOS UI/UX implementations across all industries  
> **Authority:** UI/UX Architecture Team  
> **Derives From:** CONT_10 BioSkin Architecture

---

# CONT_11: UI/UX Governance Standards
## Testable Contracts for Industry-Agnostic UI

**Purpose:** Define **enforceable, testable** UI/UX contracts that ensure consistent user experience across all AI-BOS industry deployments.

---

## 1. Executive Summary

This contract defines **four foundational UI/UX contracts** that are:

1. **Testable** — Can be validated via automated tests
2. **Enforceable** — CI/CD pipelines reject violations
3. **Industry-Agnostic** — Apply equally to Finance, Healthcare, Manufacturing, etc.
4. **Non-Negotiable** — Cannot be bypassed without contract amendment

### The Four Contracts

| Contract | Purpose | Key Guarantee |
|----------|---------|---------------|
| **TRUST** | Every write action is auditable | Before/after diffs + who/what/when |
| **CORRECTNESS** | Prevent impossible states | Validation + business rules enforced |
| **EXCEPTION** | Surface what needs attention | Every module has exception cockpit |
| **PERFORMANCE** | Meet latency/render budgets | Virtualization + loading states |

---

## 2. TRUST Contract

### 2.1 Definition

> **Every state-changing action MUST emit an audit trail with before/after diff (where applicable).**

### 2.2 Requirements

| Requirement | Description | Testable |
|-------------|-------------|----------|
| **TRUST-01** | Every `create`, `update`, `delete` action MUST call `useAudit().log()` | ✅ |
| **TRUST-02** | Audit log MUST capture: `userId`, `action`, `entityType`, `entityId`, `timestamp` | ✅ |
| **TRUST-03** | `update` actions MUST include `before` and `after` state snapshots | ✅ |
| **TRUST-04** | BioTimeline MUST be able to render any entity's audit trail | ✅ |
| **TRUST-05** | Audit logs MUST be immutable (no delete/edit capability in UI) | ✅ |

### 2.3 Implementation Pattern

```typescript
// ✅ CORRECT - Every mutation uses audit hook
function useUpdateInvoice() {
  const { log } = useAudit();
  
  return useMutation({
    mutationFn: async (data) => {
      const before = await getInvoice(data.id);
      const after = await updateInvoice(data);
      
      // TRUST-03: Emit before/after diff
      await log({
        action: 'update',
        entityType: 'invoice',
        entityId: data.id,
        before,
        after,
      });
      
      return after;
    },
  });
}

// ❌ VIOLATION - Mutation without audit
function useUpdateInvoice() {
  return useMutation({
    mutationFn: (data) => updateInvoice(data), // No audit!
  });
}
```

### 2.4 Test Assertion

```typescript
// __tests__/governance/trust-contract.test.tsx
describe('TRUST Contract', () => {
  it('TRUST-01: update action emits audit log', async () => {
    const auditSpy = vi.spyOn(auditService, 'log');
    
    await updateInvoice({ id: '123', amount: 1000 });
    
    expect(auditSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'update',
        entityType: 'invoice',
        entityId: '123',
      })
    );
  });
  
  it('TRUST-03: update audit includes before/after', async () => {
    const auditSpy = vi.spyOn(auditService, 'log');
    
    await updateInvoice({ id: '123', amount: 1000 });
    
    expect(auditSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        before: expect.any(Object),
        after: expect.any(Object),
      })
    );
  });
});
```

---

## 3. CORRECTNESS Contract

### 3.1 Definition

> **The UI MUST prevent users from entering impossible states through validation and business rule enforcement.**

### 3.2 Requirements

| Requirement | Description | Testable |
|-------------|-------------|----------|
| **CORR-01** | Every form MUST use Zod schema validation | ✅ |
| **CORR-02** | Validation MUST run on `onChange` or `onBlur` (real-time) | ✅ |
| **CORR-03** | Error messages MUST be in plain language (not codes) | ✅ |
| **CORR-04** | Form submission MUST be blocked until all validations pass | ✅ |
| **CORR-05** | Period-locked entities MUST prevent edit UI (not just server reject) | ✅ |
| **CORR-06** | Entity context rules MUST disable invalid options (e.g., wrong account type) | ✅ |
| **CORR-07** | Auto-repair suggestions MUST be provided for correctable errors | ✅ |

### 3.3 Implementation Pattern

```typescript
// ✅ CORRECT - Schema-driven validation with plain language
const InvoiceSchema = z.object({
  vendorId: z.string().min(1, 'Please select a vendor'),
  amount: z.number()
    .positive('Amount must be greater than zero')
    .max(1000000, 'Amount exceeds approval limit'),
  dueDate: z.date()
    .min(new Date(), 'Due date cannot be in the past'),
});

// BioForm automatically enforces CORR-01 through CORR-04
<BioForm
  schema={InvoiceSchema}
  mode="create"
  onSubmit={handleSubmit}
/>

// ❌ VIOLATION - Manual validation with codes
<form onSubmit={(e) => {
  if (!vendorId) {
    setError('ERR_001'); // CORR-03 violation!
  }
}}>
```

### 3.4 Period Lock Pattern (CORR-05)

```typescript
// Period lock enforcement in UI
function InvoiceEditPage({ invoiceId }: Props) {
  const invoice = useInvoice(invoiceId);
  const period = usePeriod(invoice.periodId);
  
  // CORR-05: Prevent edit UI for locked periods
  if (period.status === 'closed') {
    return (
      <ErrorState
        title="Period Closed"
        description="This invoice belongs to a closed period and cannot be edited."
        action={{ label: 'View Only', onClick: () => setMode('view') }}
      />
    );
  }
  
  return <BioForm mode="edit" ... />;
}
```

### 3.5 Test Assertion

```typescript
describe('CORRECTNESS Contract', () => {
  it('CORR-04: submit blocked until validation passes', async () => {
    render(<BioForm schema={InvoiceSchema} onSubmit={onSubmit} />);
    
    // Submit without filling required fields
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Please select a vendor')).toBeInTheDocument();
  });
  
  it('CORR-05: edit disabled for closed period', async () => {
    render(<InvoiceEditPage invoiceId="123" />);
    
    // Assume period is closed
    expect(screen.getByText('Period Closed')).toBeInTheDocument();
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
  });
});
```

---

## 4. EXCEPTION Contract

### 4.1 Definition

> **Every module MUST have an exception cockpit that surfaces what needs attention NOW.**

### 4.2 Requirements

| Requirement | Description | Testable |
|-------------|-------------|----------|
| **EXCP-01** | Every module MUST have a `BioExceptionDashboard` component | ✅ |
| **EXCP-02** | Exceptions MUST be categorized: `critical`, `warning`, `info` | ✅ |
| **EXCP-03** | Exceptions MUST show count badges in navigation | ✅ |
| **EXCP-04** | Each exception MUST have a clear resolution action | ✅ |
| **EXCP-05** | Resolved exceptions MUST be auto-cleared from dashboard | ✅ |
| **EXCP-06** | Exceptions MUST be role-aware (show only actionable items) | ✅ |

### 4.3 Exception Categories by Industry

| Industry | Critical | Warning | Info |
|----------|----------|---------|------|
| **Finance** | Payment failed, Balance mismatch | Pending approval, Overdue | New vendor, Batch ready |
| **Healthcare** | Prescription conflict, Critical lab | Appointment reminder | Insurance update |
| **Supply Chain** | Temperature breach, Stock out | FEFO alert, Reorder point | Delivery scheduled |
| **Manufacturing** | Machine stop, Quality fail | Maintenance due | Batch complete |

### 4.4 Implementation Pattern

```typescript
// ✅ CORRECT - Every module has exception dashboard
function APModulePage() {
  const exceptions = useExceptions('ap');
  
  return (
    <div>
      {/* EXCP-01: Exception dashboard at module level */}
      <BioExceptionDashboard
        exceptions={exceptions}
        onResolve={handleResolve}
        onDismiss={handleDismiss}
      />
      
      {/* Module content */}
      <APInvoiceList />
    </div>
  );
}

// Navigation with exception badges (EXCP-03)
<BioNavItem 
  label="Accounts Payable"
  href="/ap"
  badge={apExceptions.critical > 0 ? apExceptions.critical : undefined}
  badgeVariant="danger"
/>
```

### 4.5 Test Assertion

```typescript
describe('EXCEPTION Contract', () => {
  it('EXCP-01: module has exception dashboard', async () => {
    render(<APModulePage />);
    
    expect(screen.getByTestId('bio-exception-dashboard')).toBeInTheDocument();
  });
  
  it('EXCP-03: nav shows exception count', async () => {
    render(<BioSidebar exceptions={{ ap: { critical: 3 } }} />);
    
    expect(screen.getByText('3')).toBeInTheDocument();
  });
  
  it('EXCP-04: exception has resolution action', async () => {
    render(<BioExceptionDashboard exceptions={[mockException]} />);
    
    expect(screen.getByRole('button', { name: /resolve/i })).toBeInTheDocument();
  });
});
```

---

## 5. PERFORMANCE Contract

### 5.1 Definition

> **The UI MUST meet latency and render budgets to ensure responsive user experience.**

### 5.2 Requirements

| Requirement | Description | Target | Testable |
|-------------|-------------|--------|----------|
| **PERF-01** | Table render (100 rows) | <100ms | ✅ |
| **PERF-02** | Table render (10k rows, virtualized) | <200ms | ✅ |
| **PERF-03** | Form initial render | <50ms | ✅ |
| **PERF-04** | Navigation (client-side) | <100ms | ✅ |
| **PERF-05** | Tables >100 rows MUST use virtualization | Required | ✅ |
| **PERF-06** | Loading states MUST appear within 100ms of action | Required | ✅ |
| **PERF-07** | Skeleton loaders MUST be used (not spinners) for data grids | Required | ✅ |
| **PERF-08** | Optimistic UI MUST be used for non-critical mutations | Required | ✅ |

### 5.3 Virtualization Threshold

| Component | Threshold | Action |
|-----------|-----------|--------|
| BioTable | >100 rows | Auto-enable BioTableVirtual |
| BioKanban | >50 cards/column | Virtualize column |
| BioTree | >200 nodes | Lazy-load children |
| BioTimeline | >50 items | Infinite scroll |

### 5.4 Implementation Pattern

```typescript
// ✅ CORRECT - Auto-virtualization based on data size
function BioTable({ data, ...props }) {
  // PERF-05: Auto-switch to virtualized table
  if (data.length > 100) {
    return <BioTableVirtual data={data} {...props} />;
  }
  return <BioTableStandard data={data} {...props} />;
}

// ✅ CORRECT - Optimistic update for mutations
function useUpdateStatus() {
  const { mutateOptimistically } = useOptimisticMutation({
    mutationFn: updateStatus,
    onMutate: (variables) => {
      // Optimistically update UI immediately
      queryClient.setQueryData(['invoice', variables.id], (old) => ({
        ...old,
        status: variables.status,
      }));
    },
  });
}
```

### 5.5 Test Assertion

```typescript
describe('PERFORMANCE Contract', () => {
  it('PERF-01: 100 rows renders under 100ms', async () => {
    const start = performance.now();
    render(<BioTable data={generate100Rows()} columns={columns} />);
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(100);
  });
  
  it('PERF-05: >100 rows uses virtualization', async () => {
    render(<BioTable data={generate500Rows()} columns={columns} />);
    
    // Should render virtual wrapper, not all 500 DOM nodes
    expect(screen.getByTestId('bio-table-virtual')).toBeInTheDocument();
    expect(document.querySelectorAll('tr').length).toBeLessThan(50);
  });
  
  it('PERF-06: loading appears within 100ms', async () => {
    const { rerender } = render(<BioTable data={[]} loading={false} />);
    
    const start = performance.now();
    rerender(<BioTable data={[]} loading={true} />);
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(100);
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });
});
```

---

## 6. Contract Enforcement

### 6.1 CI/CD Pipeline Gates

```yaml
# .github/workflows/ui-governance.yml
name: UI Governance Validation

on: [push, pull_request]

jobs:
  trust-contract:
    runs-on: ubuntu-latest
    steps:
      - name: TRUST - All mutations use audit
        run: pnpm test --grep "TRUST Contract"
        
  correctness-contract:
    runs-on: ubuntu-latest
    steps:
      - name: CORR - Schema validation enforced
        run: pnpm test --grep "CORRECTNESS Contract"
        
  exception-contract:
    runs-on: ubuntu-latest
    steps:
      - name: EXCP - Exception dashboards present
        run: pnpm test --grep "EXCEPTION Contract"
        
  performance-contract:
    runs-on: ubuntu-latest
    steps:
      - name: PERF - Render budgets met
        run: pnpm test --grep "PERFORMANCE Contract"
```

### 6.2 Contract Violation Response

| Severity | Response | Timeline |
|----------|----------|----------|
| **Critical** (TRUST, CORR) | Block merge, alert team | Immediate |
| **Major** (EXCP, PERF) | Block merge, log issue | 24 hours |
| **Minor** | Warning, track debt | Sprint planning |

---

## 7. Contract Registry

### 7.1 Active Contracts

| Code | Name | Version | Status |
|------|------|---------|--------|
| TRUST | Trust Contract | 1.0.0 | ✅ Active |
| CORR | Correctness Contract | 1.0.0 | ✅ Active |
| EXCP | Exception Contract | 1.0.0 | ✅ Active |
| PERF | Performance Contract | 1.0.0 | ✅ Active |

### 7.2 Contract Dependencies

```
CONT_11 (UI/UX Governance)
├── TRUST → requires: useAudit (from BioPermissionProvider)
├── CORR → requires: BioForm (from bioskin/organisms)
├── EXCP → requires: BioExceptionDashboard (from bioskin/molecules)
└── PERF → requires: BioTableVirtual (from bioskin/organisms)
```

---

## 8. Summary

### The Four Guarantees

1. **TRUST:** Every write is auditable with before/after diffs
2. **CORRECTNESS:** Impossible states are prevented in UI
3. **EXCEPTION:** Every module surfaces what needs attention
4. **PERFORMANCE:** Render budgets are met with virtualization

### Enforcement

- All contracts are **testable** via automated tests
- CI/CD **blocks merge** on contract violations
- Contracts apply **equally to all industries**

---

**Status:** ✅ ACTIVE  
**Supersedes:** None (New Contract)  
**Depends On:** CONT_10 BioSkin Architecture  
**Last Updated:** 2025-01-XX  
**Maintainer:** AI-BOS UI/UX Architecture Team  
**Review Cycle:** Quarterly
