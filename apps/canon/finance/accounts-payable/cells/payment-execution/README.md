# AP-05: Payment Execution Cell

**Version:** 1.1.0  
**Status:** Implementation Complete  
**Cell Code:** AP-05  
**Molecule:** Accounts Payable (P2P)

---

## Overview

The Payment Execution Cell (AP-05) handles the complete payment lifecycle from creation through bank confirmation and GL posting. It enforces enterprise-grade controls including:

- **Segregation of Duties (SoD):** Maker cannot approve their own payment
- **Transactional Audit:** Business mutation + audit event in same DB transaction
- **Idempotency:** Duplicate payment creation prevention via unique keys
- **Optimistic Locking:** Concurrent modification detection via version column
- **Period Lock:** Fiscal period validation before posting
- **Immutability:** Approved payments cannot be edited (DB trigger enforced)
- **Tenant Isolation:** Row Level Security (RLS) on all tables

---

## State Machine

```
draft → pending_approval → approved → processing → completed
              ↓                          ↓
          rejected                    failed → (retry) → pending_approval
```

### States

| Status | Description | Immutable? | Terminal? |
|--------|-------------|------------|-----------|
| `draft` | Payment being prepared | No | No |
| `pending_approval` | Waiting for approver | No | No |
| `approved` | Ready for execution | **Yes** | No |
| `rejected` | Payment rejected | No | **Yes** |
| `processing` | Sent to bank | **Yes** | No |
| `completed` | Bank confirmed, GL posted | **Yes** | **Yes** |
| `failed` | Bank rejected | No | No |

### Actions

- `submit`: draft → pending_approval
- `approve`: pending_approval → approved
- `reject`: pending_approval → rejected
- `execute`: approved → processing
- `complete`: processing → completed
- `fail`: processing → failed
- `retry`: failed → pending_approval

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  BFF Layer (Next.js API Routes)                              │
│  /api/payments/*                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Cell Services                                               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │PaymentService│ │ApprovalService│ │ExecutionService       ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Ports (Interfaces)                                          │
│  PaymentRepositoryPort, AuditPort, PolicyPort, FiscalTimePort│
│  GLPostingPort, EventBusPort                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Adapters                                                    │
│  ┌───────────────────┐ ┌────────────────┐                   │
│  │ SQL (Production)  │ │ Memory (Test)  │                   │
│  └───────────────────┘ └────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Files

### Services
- `PaymentService.ts` - Payment creation, period validation
- `ApprovalService.ts` - Approve/reject with SoD enforcement
- `ExecutionService.ts` - Execute, complete, fail, retry lifecycle

### Database
- `apps/db/migrations/finance/104_create_payments.sql`
  - `finance.payments` - Core payment table
  - `finance.payment_approvals` - Approval audit trail
  - `finance.payment_outbox` - Transactional event outbox

### Ports
- `packages/kernel-core/src/ports/paymentRepositoryPort.ts`
- `packages/kernel-core/src/ports/fiscalTimePort.ts`
- `packages/kernel-core/src/ports/policyPort.ts`
- `packages/kernel-core/src/ports/glPostingPort.ts`

### Adapters
- `packages/kernel-adapters/src/sql/paymentRepo.sql.ts` (Production)
- `packages/kernel-adapters/src/memory/paymentRepo.memory.ts` (Test)

### Domain Primitives
- `packages/canon/primitives/Money.ts` - Immutable money value object
- `packages/canon/state-machines/PaymentStateMachine.ts` - State transitions

---

## Enterprise Controls

### 1. Segregation of Duties (SoD)

```sql
-- DB Constraint
CONSTRAINT chk_sod_approved CHECK (
    (status NOT IN ('approved', 'processing', 'completed')) OR
    (approved_by IS NOT NULL AND approved_by <> created_by)
)
```

### 2. Optimistic Locking

```sql
-- Version auto-increment trigger
CREATE TRIGGER trg_payment_version
BEFORE UPDATE ON finance.payments
FOR EACH ROW EXECUTE FUNCTION finance.increment_payment_version();
```

### 3. Immutability

```sql
-- Block edits on approved payments
CREATE TRIGGER trg_immutable_approved_payments
BEFORE DELETE OR UPDATE ON finance.payments
FOR EACH ROW WHEN (OLD.status IN ('approved', 'processing', 'completed'))
EXECUTE FUNCTION finance.prevent_payment_modification();
```

### 4. Tenant Isolation (RLS)

```sql
ALTER TABLE finance.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY payments_tenant_isolation ON finance.payments
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

---

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/payments` | Create payment |
| GET | `/api/payments` | List payments |
| GET | `/api/payments/[id]` | Get payment |
| POST | `/api/payments/[id]/submit` | Submit for approval |
| POST | `/api/payments/[id]/approve` | Approve payment |
| POST | `/api/payments/[id]/reject` | Reject payment |
| POST | `/api/payments/[id]/execute` | Execute payment |
| POST | `/api/payments/[id]/complete` | Complete (bank confirmed) |
| POST | `/api/payments/[id]/fail` | Mark as failed |
| POST | `/api/payments/[id]/retry` | Retry failed payment |

All mutation endpoints require:
- `X-Idempotency-Key` header
- `version` in request body (optimistic locking)

---

## Success Criteria (KPIs)

| Metric | Target | Test |
|--------|--------|------|
| SoD Violations | 0 | `SoD.test.ts` |
| Concurrency Conflicts Handled | 100% | `Concurrency.test.ts` |
| Idempotent Creates | 100% | `Concurrency.test.ts` |
| Period Lock Enforcement | 100% | `PeriodLock.test.ts` |
| Audit Completeness | 100% | `Audit.test.ts` |
| Money Precision | 0.0001 | `Money.test.ts` |
| Immutability | 100% | `Immutability.test.ts` |
| Tenant Isolation | 100% | `Concurrency.test.ts` |

---

## Running Tests

```bash
# Run all AP-05 tests
pnpm test apps/canon/finance/accounts-payable/cells/payment-execution

# Run specific test file
pnpm test apps/canon/finance/accounts-payable/cells/payment-execution/__tests__/SoD.test.ts
```

---

## References

- **PRD:** `.cursor/plans/ap-05_payment_cell_prd_e398e2cc.plan.md`
- **Architecture Contract:** `packages/canon/A-Governance/A-CONT/CONT_07_FinanceCanonArchitecture.md`
- **Security ADR:** `packages/canon/A-Governance/A-ADR/ADR_002_CanonSecurity.md`
