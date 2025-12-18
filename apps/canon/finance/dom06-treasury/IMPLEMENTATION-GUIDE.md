# DOM06 — Treasury Implementation Guide

> **Architecture Compliance:** CONT_07 (Finance Canon Architecture)  
> **Reference Pattern:** DOM-03 Accounts Payable  
> **Status:** 📋 Planning Document  
> **Purpose:** Directory structure and implementation roadmap for all Treasury cells

---

## Executive Brief

This document outlines the **implementation structure** for DOM-06 Treasury following the **Hexagonal Architecture** pattern mandated by CONT_07. The structure ensures:

1. ✅ **Separation of Concerns** — Domain logic isolated from infrastructure
2. ✅ **Port & Adapter Pattern** — Interfaces separate from implementations
3. ✅ **Testability** — Unit and integration tests organized
4. ✅ **Kernel Integration** — Clear boundaries with Kernel services
5. ✅ **Cell Contract Compliance** — All 8-point contract requirements met
6. ✅ **Treasury-Specific Controls** — Dual authorization, IC netting, FX compliance

---

## Domain-Level Directory Structure

```
apps/canon/finance/dom06-treasury/
│
├── 📄 ARCHITECTURE-BRIEF.md          # Domain architecture overview
├── 📄 IMPLEMENTATION-GUIDE.md        # This file
├── 📄 README.md                      # Domain status summary
│
├── 📁 Manager Dashboard
│   └── TRManagerDashboardService.ts  # Cluster-level dashboard aggregating all cells
│
└── 📁 Cells (Atomic Units)
    ├── tr01-bank-master/             # ✅ COMPLETE (Reference)
    ├── tr02-cash-pooling/            # 📋 PLANNED
    ├── tr03-fx-hedging/              # 📋 PLANNED
    ├── tr04-intercompany-settlement/ # 📋 PLANNED
    └── tr05-bank-reconciliation/     # 📋 PLANNED
```

---

## Standard Cell Structure (Per Cell)

Each Treasury cell follows this structure (reference: AP-01, AP-05):

```
trXX-cell-name/
│
├── 📄 PRD-trXX-cell-name.md          # Product Requirements Document (SSOT)
├── 📄 ARCHITECTURE-BRIEF.md          # Cell architecture compliance
│
├── 📁 Domain Services (Core Business Logic)
│   ├── CellNameService.ts            # CRUD, state transitions
│   ├── ApprovalService.ts             # Dual authorization, approval workflow (if applicable)
│   └── [AdditionalService].ts         # Cell-specific services
│
├── 📁 Domain Primitives (Value Objects)
│   └── CellNameStateMachine.ts       # State transition logic
│
├── 📁 Errors (Domain Exceptions)
│   └── errors.ts                     # All cell-specific errors
│
├── 📁 Exports (Public API)
│   └── index.ts                      # Public exports (services, types, errors)
│
└── 📁 Tests (Test Suite)
    └── __tests__/
        ├── CellNameService.test.ts   # Unit: CRUD, state transitions
        ├── ApprovalService.test.ts   # Unit: Dual authorization, approval logic
        ├── DualAuth.test.ts          # Control: Dual authorization enforcement
        ├── Audit.test.ts             # Control: Audit event coverage
        ├── PeriodLock.test.ts        # Control: Period cutoff enforcement (if applicable)
        └── integration/
            ├── setup.ts              # Integration test setup (DB, adapters)
            └── cell-name.integration.test.ts # Integration: Full workflow
```

---

## Architecture Layers (CONT_07 Compliance)

### Layer 1: **Inbound Ports** (API Routes)
**Location:** `apps/web/app/api/treasury/` (NOT in cell directory)

```
apps/web/app/api/treasury/
├── bank-accounts/                    # TR-01 routes
│   ├── route.ts                      # GET /api/treasury/bank-accounts (list)
│   └── [id]/
│       ├── route.ts                  # GET /api/treasury/bank-accounts/{id}
│       ├── submit-verification/
│       │   └── route.ts              # POST /api/treasury/bank-accounts/{id}/submit-verification
│       └── verify/
│           └── route.ts              # POST /api/treasury/bank-accounts/{id}/verify
│
├── cash-pools/                       # TR-02 routes (planned)
│   ├── route.ts                      # GET /api/treasury/cash-pools
│   └── [id]/
│       ├── execute-sweep/
│       │   └── route.ts              # POST /api/treasury/cash-pools/{id}/execute-sweep
│       └── allocate-interest/
│           └── route.ts              # POST /api/treasury/cash-pools/{id}/allocate-interest
│
├── fx-contracts/                     # TR-03 routes (planned)
│   ├── route.ts                      # GET /api/treasury/fx-contracts
│   └── [id]/
│       ├── revalue/
│       │   └── route.ts              # POST /api/treasury/fx-contracts/{id}/revalue
│       └── settle/
│           └── route.ts              # POST /api/treasury/fx-contracts/{id}/settle
│
├── intercompany-settlements/         # TR-04 routes (planned)
│   ├── route.ts                      # GET /api/treasury/intercompany-settlements
│   └── [id]/
│       ├── net/
│       │   └── route.ts              # POST /api/treasury/intercompany-settlements/{id}/net
│       └── settle/
│           └── route.ts              # POST /api/treasury/intercompany-settlements/{id}/settle
│
├── reconciliations/                  # TR-05 routes (planned)
│   ├── route.ts                      # GET /api/treasury/reconciliations
│   └── [id]/
│       ├── import-statement/
│       │   └── route.ts              # POST /api/treasury/reconciliations/{id}/import-statement
│       ├── match/
│       │   └── route.ts              # POST /api/treasury/reconciliations/{id}/match
│       └── finalize/
│           └── route.ts              # POST /api/treasury/reconciliations/{id}/finalize
│
└── manager/
    └── dashboard/
        └── route.ts                  # GET /api/treasury/manager/dashboard
```

**Why Separate:** API routes are BFF (Backend for Frontend) concerns, not domain logic. They live in `apps/web/` per CONT_07.

---

### Layer 2: **Domain Services** (Business Logic)
**Location:** `apps/canon/finance/dom06-treasury/cells/trXX-cell-name/`

**Example: TR-02 Cash Pooling**
```
CashPoolingService.ts
├── createPool()                      # Create cash pool configuration
├── executeSweep()                    # Execute sweep (with dual authorization)
├── executeFund()                     # Execute fund (with dual authorization)
├── allocateInterest()                # Allocate interest to participants
└── validatePool()                     # Business validation

ApprovalService.ts (if applicable)
├── approveSweep()                    # Approve sweep (dual auth check)
├── approveFund()                     # Approve fund (dual auth check)
└── checkDualAuthorization()          # Verify two distinct approvers
```

**Architectural Rule:** Services contain **pure business logic**. No database access, no HTTP concerns.

---

### Layer 3: **Outbound Ports** (Interfaces)
**Location:** `packages/kernel-core/src/ports/` (Shared across all cells)

```
packages/kernel-core/src/ports/
├── bankRepositoryPort.ts              # BankRepositoryPort interface (TR-01)
├── cashPoolRepositoryPort.ts          # CashPoolRepositoryPort interface (TR-02)
├── fxContractRepositoryPort.ts       # FXContractRepositoryPort interface (TR-03)
├── intercompanyRepositoryPort.ts     # IntercompanyRepositoryPort interface (TR-04)
├── reconciliationRepositoryPort.ts    # ReconciliationRepositoryPort interface (TR-05)
├── fxPort.ts                          # FXPort (K_FX) - already exists
├── auditPort.ts                       # AuditPort (K_LOG) - already exists
├── policyPort.ts                      # PolicyPort (K_POLICY) - already exists
├── authPort.ts                        # AuthPort (K_AUTH) - already exists
├── fiscalTimePort.ts                  # FiscalTimePort (K_TIME) - already exists
└── sequencePort.ts                    # SequencePort (K_SEQ) - already exists
```

**Why Shared:** Ports are **interfaces**, not implementations. They define contracts that multiple cells can use.

---

### Layer 4: **Adapters** (Implementations)
**Location:** `packages/kernel-adapters/src/` (Shared across all cells)

```
packages/kernel-adapters/src/
├── sql/
│   ├── bankRepo.sql.ts                # SqlBankRepository (PostgreSQL) - ✅ Complete
│   ├── cashPoolRepo.sql.ts            # SqlCashPoolRepository (PostgreSQL) - 📋 Planned
│   ├── fxContractRepo.sql.ts          # SqlFXContractRepository (PostgreSQL) - 📋 Planned
│   ├── intercompanyRepo.sql.ts        # SqlIntercompanyRepository (PostgreSQL) - 📋 Planned
│   └── reconciliationRepo.sql.ts      # SqlReconciliationRepository (PostgreSQL) - 📋 Planned
└── memory/
    ├── bankRepo.memory.ts             # MemoryBankRepository (Testing) - ✅ Complete
    ├── cashPoolRepo.memory.ts         # MemoryCashPoolRepository (Testing) - 📋 Planned
    ├── fxContractRepo.memory.ts       # MemoryFXContractRepository (Testing) - 📋 Planned
    ├── intercompanyRepo.memory.ts      # MemoryIntercompanyRepository (Testing) - 📋 Planned
    └── reconciliationRepo.memory.ts    # MemoryReconciliationRepository (Testing) - 📋 Planned
```

**Why Shared:** Adapters are **reusable infrastructure**. SQL adapter for production, Memory adapter for testing.

---

### Layer 5: **Database Migrations**
**Location:** `apps/db/migrations/finance/`

```
apps/db/migrations/finance/
├── 170_tr_bank_master.sql             # ✅ Complete - Bank accounts, signatories
├── 171_tr_cash_pooling.sql            # 📋 Planned - Cash pools, sweep executions
├── 172_tr_bank_reconciliation.sql     # 📋 Planned - Statements, reconciliations
├── 173_tr_fx_hedging.sql              # 📋 Planned - FX contracts, hedge accounting
└── 174_tr_intercompany_settlement.sql # 📋 Planned - IC balances, netting
```

**Why Separate:** Database schema is **infrastructure concern**, not domain logic. Migrations live in `apps/db/`.

---

## Kernel Integration Points

### Required Kernel Services (CONT_07)

| Service | Symbol | Purpose | Used By |
|---------|--------|---------|---------|
| **K_LOG** | `AuditPort` | Immutable audit trail | All cells |
| **K_POLICY** | `PolicyPort` | Dual authorization rules, limits | TR-01, TR-02, TR-03 |
| **K_AUTH** | `AuthPort` | Permission checks, SoD validation | All cells |
| **K_TIME** | `FiscalTimePort` | Period cutoff, reconciliation periods | TR-05, TR-04 |
| **K_FX** | `FXPort` | FX rates, revaluation | TR-03, TR-02 (multi-currency) |
| **K_SEQ** | `SequencePort` | Sequence generation | All cells |
| **K_NOTIFY** | `EventBusPort` | Cross-cell coordination | All cells |

**Integration Pattern:**
```typescript
// Services receive ports via constructor injection
export class CashPoolingService {
  constructor(
    private cashPoolRepo: CashPoolRepositoryPort,
    private auditPort: AuditPort,        // K_LOG
    private policyPort: PolicyPort,       // K_POLICY
    private fxPort: FXPort,               // K_FX
    private fiscalTimePort: FiscalTimePort // K_TIME
  ) {}
}
```

---

## Treasury-Specific Controls

### 1. Dual Authorization (Treasury Non-Negotiable)

**Requirement:** All cash movements require two distinct approvers.

**Enforcement:**
```typescript
// In ApprovalService
async approveCashMovement(
  movementId: string,
  approver1: ActorContext,
  approver2: ActorContext
): Promise<void> {
  // Verify two distinct approvers
  if (approver1.userId === approver2.userId) {
    throw new SoDViolationError('Dual authorization requires two distinct approvers');
  }
  
  // Verify both have approval permission
  await this.authPort.verifyPermission(approver1, 'treasury.cash.approve');
  await this.authPort.verifyPermission(approver2, 'treasury.cash.approve');
  
  // Record both approvals in audit
  await this.auditPort.emitTransactional({
    event: 'CASH_MOVEMENT_APPROVED',
    actor: approver1,
    metadata: { approver2: approver2.userId }
  });
}
```

**Database Constraint:**
```sql
-- Example: Cash sweep requires two approvals
ALTER TABLE treasury.cash_sweeps
  ADD CONSTRAINT chk_dual_approval
  CHECK (
    (initiator_id IS NOT NULL) AND
    (approver1_id IS NOT NULL) AND
    (approver2_id IS NOT NULL) AND
    (approver1_id != approver2_id) AND
    (initiator_id != approver1_id) AND
    (initiator_id != approver2_id)
  );
```

---

### 2. IC Balance Netting (Treasury Non-Negotiable)

**Requirement:** Intercompany balances must net to zero on period close.

**Enforcement:**
```typescript
// In IntercompanyService
async validateICNetting(tenantId: string, periodCode: string): Promise<void> {
  const balances = await this.intercompanyRepo.getICBalances(tenantId, periodCode);
  
  const netBalance = balances.reduce((sum, b) => {
    return sum + (b.receivableAmount - b.payableAmount);
  }, 0);
  
  if (Math.abs(netBalance) > 0.01) { // Tolerance for rounding
    throw new ICNettingError(
      `IC balances do not net to zero. Net balance: ${netBalance}`,
      { balances, periodCode }
    );
  }
}
```

**Database Trigger:**
```sql
-- Trigger on period close
CREATE OR REPLACE FUNCTION finance.validate_ic_netting()
RETURNS TRIGGER AS $$
DECLARE
  net_balance NUMERIC;
BEGIN
  IF NEW.status = 'closed' THEN
    SELECT SUM(receivable_amount - payable_amount) INTO net_balance
    FROM treasury.intercompany_balances
    WHERE tenant_id = NEW.tenant_id AND period_code = NEW.period_code;
    
    IF ABS(net_balance) > 0.01 THEN
      RAISE EXCEPTION 'IC balances do not net to zero. Net: %', net_balance;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### 3. FX Compliance (Treasury Non-Negotiable)

**Requirement:** FX gains/losses recognized per IAS 21/IFRS 9.

**Enforcement:**
```typescript
// In FXHedgingService
async revalueFXContract(
  contractId: string,
  valuationDate: Date,
  actor: ActorContext
): Promise<FXRevaluationResult> {
  const contract = await this.fxContractRepo.findById(contractId);
  const spotRate = await this.fxPort.getRate(
    contract.baseCurrency,
    contract.quoteCurrency,
    valuationDate
  );
  
  // Calculate unrealized gain/loss per IAS 21
  const unrealizedGainLoss = this.calculateUnrealizedGainLoss(
    contract,
    spotRate,
    valuationDate
  );
  
  // Post to GL per IFRS 9 hedge accounting rules
  await this.glPostingPort.postJournal({
    sourceType: 'FX_REVALUATION',
    sourceId: contractId,
    lines: [
      {
        accountCode: contract.hedgeAccount,
        debitAmount: unrealizedGainLoss > 0 ? { amount: String(unrealizedGainLoss), currency: contract.quoteCurrency } : undefined,
        creditAmount: unrealizedGainLoss < 0 ? { amount: String(Math.abs(unrealizedGainLoss)), currency: contract.quoteCurrency } : undefined,
      },
      {
        accountCode: contract.pnlAccount,
        debitAmount: unrealizedGainLoss < 0 ? { amount: String(Math.abs(unrealizedGainLoss)), currency: contract.quoteCurrency } : undefined,
        creditAmount: unrealizedGainLoss > 0 ? { amount: String(unrealizedGainLoss), currency: contract.quoteCurrency } : undefined,
      }
    ],
    postedBy: actor.userId,
    correlationId: actor.correlationId
  });
  
  return { contractId, unrealizedGainLoss, spotRate };
}
```

---

## Test Organization

### Unit Tests (Fast, Isolated)

| Test File | Tests | Purpose |
|-----------|-------|---------|
| `CashPoolingService.test.ts` | Pool CRUD, sweep logic | Business logic validation |
| `ApprovalService.test.ts` | Dual authorization, approval workflow | Control validation |
| `DualAuth.test.ts` | Two distinct approvers required | **Control Test** (CONT_07 requirement) |
| `Audit.test.ts` | Audit event coverage | **Control Test** (CONT_07 requirement) |
| `PeriodLock.test.ts` | Period cutoff enforcement | **Control Test** (CONT_07 requirement) |
| `ICNetting.test.ts` | IC balance netting validation | **Control Test** (Treasury-specific) |
| `FXCompliance.test.ts` | IAS 21/IFRS 9 compliance | **Control Test** (Treasury-specific) |

### Integration Tests (Real Database)

| Test File | Tests | Purpose |
|-----------|-------|---------|
| `cash-pooling-cell.integration.test.ts` | Full workflow end-to-end | Real PostgreSQL, real adapters |
| `fx-hedging-cell.integration.test.ts` | FX contract lifecycle | Real PostgreSQL, real adapters |
| `intercompany-cell.integration.test.ts` | IC settlement workflow | Real PostgreSQL, real adapters |
| `reconciliation-cell.integration.test.ts` | Bank reconciliation workflow | Real PostgreSQL, real adapters |

**Test Setup:**
- Uses `apps/db/migrations/finance/170-174_tr_*.sql`
- Uses real `Sql*Repository` adapters
- Uses real `SqlAuditRepo` adapter (K_LOG)

---

## Cross-Cell Dependencies

### Upstream (Treasury cells depend on)

| Cell | Dependency | Purpose |
|------|------------|---------|
| **Kernel** | K_LOG, K_POLICY, K_AUTH, K_TIME, K_FX, K_SEQ | Cross-cutting services |
| **TR-01** | Bank account registry | All cash movements require approved bank accounts |
| **GL-03** | Posting Engine | All treasury transactions post to GL |
| **GL-05** | Trial Balance | Bank reconciliation requires GL balances |

### Downstream (depends on Treasury)

| Cell | Dependency | Purpose |
|------|------------|---------|
| **AP-05** (Payment Execution) | TR-01 Bank accounts | Payments require approved bank accounts |
| **AR-03** (Receipt Processing) | TR-01 Bank accounts | Receipts require approved bank accounts |
| **GL-04** (Period Close) | TR-04 IC netting | Period close validates IC balances net to zero |

**Architectural Rule:** Downstream cells **read** from Treasury via FK constraints or ports. No direct service calls.

---

## Implementation Order (Phased Approach)

### Phase 1: Foundation (TR-01) ✅ COMPLETE
1. ✅ Create `BankRepositoryPort` interface
2. ✅ Create `SqlBankRepository` adapter
3. ✅ Create `MemoryBankRepository` adapter
4. ✅ Create database migration (170_tr_bank_master.sql)
5. ✅ Create `BankMasterService`
6. ✅ Create `DashboardService`
7. ✅ Create API routes
8. ✅ Write tests

### Phase 2: Reconciliation (TR-05) 📋 NEXT
1. Create `ReconciliationRepositoryPort` interface
2. Create `SqlReconciliationRepository` adapter
3. Create database migration (172_tr_bank_reconciliation.sql)
4. Create `ReconciliationService`
5. Create `DashboardService`
6. Create API routes
7. Write tests

### Phase 3: Cash Optimization (TR-02) 📋 PLANNED
1. Create `CashPoolRepositoryPort` interface
2. Create `SqlCashPoolRepository` adapter
3. Create database migration (171_tr_cash_pooling.sql)
4. Create `CashPoolingService`
5. Create `ApprovalService` (dual authorization)
6. Create `DashboardService`
7. Create API routes
8. Write tests

### Phase 4: Risk Management (TR-03, TR-04) 📋 PLANNED
1. Create `FXContractRepositoryPort` and `IntercompanyRepositoryPort` interfaces
2. Create SQL adapters
3. Create database migrations (173, 174)
4. Create services
5. Create API routes
6. Write tests

---

## Key Architectural Decisions

### 1. **Services Don't Import Adapters**
✅ **Correct:** Services receive ports via constructor injection  
❌ **Wrong:** Services import SQL adapters directly

### 2. **Ports Live in kernel-core**
✅ **Correct:** `packages/kernel-core/src/ports/bankRepositoryPort.ts`  
❌ **Wrong:** Ports in cell directory

### 3. **Adapters Live in kernel-adapters**
✅ **Correct:** `packages/kernel-adapters/src/sql/bankRepo.sql.ts`  
❌ **Wrong:** Adapters in cell directory

### 4. **API Routes Live in apps/web**
✅ **Correct:** `apps/web/app/api/treasury/bank-accounts/route.ts`  
❌ **Wrong:** API routes in cell directory

### 5. **Database Migrations Live in apps/db**
✅ **Correct:** `apps/db/migrations/finance/170_tr_bank_master.sql`  
❌ **Wrong:** Migrations in cell directory

### 6. **Dual Authorization is Treasury-Specific**
✅ **Correct:** Two distinct approvers required for all cash movements  
❌ **Wrong:** Single approver for cash movements

---

## Comparison with DOM-03 (Reference Pattern)

| Aspect | DOM-03 (AP) | DOM-06 (TR) | Status |
|--------|-------------|-------------|--------|
| **Cell Count** | 5 cells | 5 cells | ✅ Same structure |
| **Services Pattern** | VendorService, InvoiceService, PaymentService | BankMasterService, CashPoolingService, etc. | ✅ Pattern match |
| **Domain Primitives** | StateMachine, Money | StateMachine, Money, FXRate | ✅ Extended |
| **Errors** | errors.ts | errors.ts | ✅ Pattern match |
| **Exports** | index.ts | index.ts | ✅ Pattern match |
| **Tests** | Unit + Integration + Control | Unit + Integration + Control | ✅ Pattern match |
| **Ports** | kernel-core | kernel-core | ✅ Shared |
| **Adapters** | kernel-adapters | kernel-adapters | ✅ Shared |
| **API Routes** | apps/web/app/api/ap/ | apps/web/app/api/treasury/ | ✅ Pattern match |
| **Migrations** | apps/db/migrations/finance/ | apps/db/migrations/finance/ | ✅ Shared |
| **Kernel Integration** | K_LOG, K_POLICY, K_AUTH, K_TIME, K_SEQ | K_LOG, K_POLICY, K_AUTH, K_TIME, K_FX, K_SEQ | ✅ Extended (K_FX) |
| **Control Framework** | SoD, Audit, Period Lock | Dual Auth, Audit, Period Lock, IC Netting, FX Compliance | ✅ Treasury-specific |

---

## ⚠️ Implementation Gaps

### To Be Created

The following components need to be implemented to complete the Treasury domain:

#### 1. **Cell Services** (4 cells remaining)
- ⚠️ TR-02: `CashPoolingService`, `ApprovalService`
- ⚠️ TR-03: `FXHedgingService`
- ⚠️ TR-04: `IntercompanyService`
- ⚠️ TR-05: `ReconciliationService`

#### 2. **Ports** (`packages/kernel-core/src/ports/`)
- ⚠️ `cashPoolRepositoryPort.ts`
- ⚠️ `fxContractRepositoryPort.ts`
- ⚠️ `intercompanyRepositoryPort.ts`
- ⚠️ `reconciliationRepositoryPort.ts`

#### 3. **Adapters** (`packages/kernel-adapters/src/`)
- ⚠️ SQL adapters for all 4 remaining cells
- ⚠️ Memory adapters for all 4 remaining cells

#### 4. **Database Migrations** (`apps/db/migrations/finance/`)
- ⚠️ `171_tr_cash_pooling.sql`
- ⚠️ `172_tr_bank_reconciliation.sql`
- ⚠️ `173_tr_fx_hedging.sql`
- ⚠️ `174_tr_intercompany_settlement.sql`

#### 5. **BFF Routes** (`apps/web/app/api/treasury/`)
- ⚠️ Routes for TR-02, TR-03, TR-04, TR-05

#### 6. **Tests** (All cells)
- ⚠️ Unit tests
- ⚠️ Control tests (Dual Auth, IC Netting, FX Compliance)
- ⚠️ Integration tests

---

## Summary

### ✅ **Architectural Requirements Fulfilled**

1. **Hexagonal Architecture** — Clear separation: Services → Ports → Adapters
2. **Kernel Integration** — All required Kernel services integrated (K_LOG, K_POLICY, K_AUTH, K_TIME, K_FX, K_SEQ)
3. **Cell Boundaries** — No direct dependencies on other cells (only Kernel)
4. **Testability** — Unit, integration, and control tests organized
5. **Reusability** — Ports and adapters shared across cells
6. **Maintainability** — Clear directory structure, single responsibility per file
7. **Treasury-Specific Controls** — Dual authorization, IC netting, FX compliance

### 📋 **Implementation Checklist**

#### Phase 1: Foundation (TR-01) ✅ COMPLETE
- [x] Create `BankRepositoryPort` interface ✅
- [x] Create `SqlBankRepository` adapter ✅
- [x] Create `MemoryBankRepository` adapter ✅
- [x] Create database migration (170_tr_bank_master.sql) ✅
- [x] Create `BankMasterService` ✅
- [x] Create `DashboardService` ✅
- [x] Create API routes ✅
- [x] Write tests ✅

#### Phase 2: Reconciliation (TR-05) 📋 NEXT
- [ ] Create `ReconciliationRepositoryPort` interface
- [ ] Create `SqlReconciliationRepository` adapter
- [ ] Create database migration (172_tr_bank_reconciliation.sql)
- [ ] Create `ReconciliationService`
- [ ] Create `DashboardService`
- [ ] Create API routes
- [ ] Write tests

#### Phase 3: Cash Optimization (TR-02) 📋 PLANNED
- [ ] Create `CashPoolRepositoryPort` interface
- [ ] Create `SqlCashPoolRepository` adapter
- [ ] Create database migration (171_tr_cash_pooling.sql)
- [ ] Create `CashPoolingService`
- [ ] Create `ApprovalService` (dual authorization)
- [ ] Create `DashboardService`
- [ ] Create API routes
- [ ] Write tests

#### Phase 4: Risk Management (TR-03, TR-04) 📋 PLANNED
- [ ] Create `FXContractRepositoryPort` and `IntercompanyRepositoryPort` interfaces
- [ ] Create SQL adapters
- [ ] Create database migrations (173, 174)
- [ ] Create services
- [ ] Create API routes
- [ ] Write tests

---

**Status:** ✅ Implementation Guide Complete  
**Architecture Compliance:** ✅ CONT_07 Compliant  
**Reference Pattern:** ✅ DOM-03 Accounts Payable  
**Completion:** ~20% (1/5 cells complete - TR-01)

**See:** Individual cell PRDs for detailed requirements

---

**Last Updated:** December 2025  
**Author:** Finance Cell Team  
**Review:** Architecture Team
