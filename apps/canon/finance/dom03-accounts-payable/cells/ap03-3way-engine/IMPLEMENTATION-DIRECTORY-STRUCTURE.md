# AP-03 3-Way Engine — Implementation Directory Structure

> **Architecture Compliance:** CONT_07 (Finance Canon Architecture)  
> **Reference Pattern:** AP-05 Payment Execution Cell  
> **Status:** 📋 Planning Document  
> **Architecture Review:** See `ARCHITECTURE-REVIEW.md` for complete compliance verification

---

## Executive Brief

This document outlines the **directory structure** for implementing AP-03 3-Way Match & Controls Engine Cell following the **Hexagonal Architecture** pattern mandated by CONT_07. The structure ensures:

1. ✅ **Separation of Concerns** — Domain logic isolated from infrastructure
2. ✅ **Port & Adapter Pattern** — Interfaces separate from implementations
3. ✅ **Testability** — Unit and integration tests organized
4. ✅ **Kernel Integration** — Clear boundaries with Kernel services
5. ✅ **Cell Contract Compliance** — All 8-point contract requirements met

---

## Directory Structure (Complete)

```
apps/canon/finance/dom03-accounts-payable/cells/ap03-3way-engine/
│
├── 📄 PRD-ap03-3way-engine.md             # Product Requirements Document
├── 📄 README.md                           # Cell overview (optional, PRD is SSOT)
│
├── 📁 Domain Services (Core Business Logic)
│   ├── MatchService.ts                    # Match evaluation logic
│   ├── ToleranceService.ts                # Tolerance rule evaluation
│   └── ExceptionService.ts               # Exception queue management
│
├── 📁 Domain Primitives (Value Objects)
│   └── MatchResult.ts                     # Match result value object
│
├── 📁 Errors (Domain Exceptions)
│   └── errors.ts                          # All cell-specific errors
│
├── 📁 Exports (Public API)
│   └── index.ts                           # Public exports (services, types, errors)
│
├── 📁 Tests (Test Suite)
│   ├── __tests__/
│   │   ├── MatchService.test.ts           # Unit: Match evaluation logic
│   │   ├── ToleranceService.test.ts       # Unit: Tolerance rule evaluation
│   │   ├── ExceptionService.test.ts       # Unit: Exception queue management
│   │   ├── SoD.test.ts                    # Control: Override SoD enforcement
│   │   ├── Immutability.test.ts            # Control: Posted match result immutability
│   │   ├── PolicyConfiguration.test.ts   # Control: Policy-driven configuration
│   │   ├── Audit.test.ts                  # Control: Audit event coverage
│   │   └── integration/
│   │       ├── setup.ts                   # Integration test setup (DB, adapters)
│   │       ├── match-cell.integration.test.ts  # Integration: Full workflow
│   │       └── TEST_RESULTS.md            # Test execution results
│
└── 📁 Documentation (Optional)
    ├── IMPLEMENTATION_SUMMARY.md          # Implementation status
    └── VALIDATION_REPORT.md               # Control validation report
```

---

## Architecture Layers (CONT_07 Compliance)

### Layer 1: **Inbound Ports** (API Routes)
**Location:** `apps/web/app/api/ap/match/` (NOT in cell directory)

```
apps/web/app/api/ap/match/
├── evaluate/
│   └── route.ts                           # POST /api/ap/match/evaluate
├── [invoice_id]/
│   ├── route.ts                           # GET /api/ap/match/{invoice_id}
│   └── override/
│       └── route.ts                       # POST /api/ap/match/{invoice_id}/override
└── exceptions/
    ├── route.ts                           # GET /api/ap/match/exceptions
    └── [id]/
        └── resolve/
            └── route.ts                   # POST /api/ap/match/exceptions/{id}/resolve
```

**Why Separate:** API routes are BFF (Backend for Frontend) concerns, not domain logic. They live in `apps/web/` per CONT_07.

---

### Layer 2: **Domain Services** (Business Logic)
**Location:** `apps/canon/finance/dom03-accounts-payable/cells/ap03-3way-engine/`

```
MatchService.ts
├── evaluateMatch()                        # Evaluate invoice match (1/2/3-way)
├── getMatchMode()                         # Get match mode from K_POLICY
├── perform1WayMatch()                     # 1-way: Invoice-only validation
├── perform2WayMatch()                     # 2-way: PO ↔ Invoice
└── perform3WayMatch()                     # 3-way: PO ↔ GRN ↔ Invoice

ToleranceService.ts
├── checkPriceTolerance()                  # Price variance tolerance check
├── checkQtyTolerance()                    # Quantity variance tolerance check
├── checkAmountTolerance()                 # Amount variance tolerance check
└── getToleranceRules()                    # Get tolerance rules from K_POLICY

ExceptionService.ts
├── createException()                      # Create match exception
├── resolveException()                     # Resolve exception
├── overrideMatch()                        # Override match (SoD check)
└── listExceptions()                       # List exception queue
```

**Architectural Rule:** Services contain **pure business logic**. No database access, no HTTP concerns.

---

### Layer 3: **Outbound Ports** (Interfaces)
**Location:** `packages/kernel-core/src/ports/` (Shared across all cells)

```
packages/kernel-core/src/ports/
├── matchRepositoryPort.ts                 # MatchRepositoryPort interface
├── purchaseOrderPort.ts                   # PurchaseOrderPort interface (external/internal)
├── goodsReceiptPort.ts                    # GoodsReceiptPort interface (external/internal)
├── policyPort.ts                          # PolicyPort (K_POLICY) - already exists
└── auditPort.ts                           # AuditPort (K_LOG) - already exists
```

**Why Shared:** Ports are **interfaces**, not implementations. They define contracts that multiple cells can use.

---

### Layer 4: **Adapters** (Implementations)
**Location:** `packages/kernel-adapters/src/` (Shared across all cells)

```
packages/kernel-adapters/src/
├── sql/
│   ├── matchRepo.sql.ts                   # SqlMatchRepository (PostgreSQL)
│   └── external/
│       ├── purchaseOrderAdapter.ts         # External PO adapter (if needed)
│       └── goodsReceiptAdapter.ts          # External GRN adapter (if needed)
└── memory/
    ├── matchRepo.memory.ts                # MemoryMatchRepository (Testing)
    └── mock/
        ├── purchaseOrderMock.ts            # Mock PO adapter (Testing)
        └── goodsReceiptMock.ts             # Mock GRN adapter (Testing)
```

**Why Shared:** Adapters are **reusable infrastructure**. SQL adapter for production, Memory adapter for testing.

---

### Layer 5: **Database Migrations**
**Location:** `apps/db/migrations/finance/`

```
apps/db/migrations/finance/
├── 109_create_match_results.sql           # ap.match_results table
└── 110_create_match_exceptions.sql        # ap.match_exceptions table
```

**Why Separate:** Database schema is **infrastructure concern**, not domain logic. Migrations live in `apps/db/`.

---

## File Responsibilities

### Domain Services

| File | Responsibility | Dependencies |
|------|---------------|--------------|
| `MatchService.ts` | Match evaluation logic | MatchRepositoryPort, PurchaseOrderPort, GoodsReceiptPort, PolicyPort, AuditPort |
| `ToleranceService.ts` | Tolerance rule evaluation | PolicyPort |
| `ExceptionService.ts` | Exception queue management | MatchRepositoryPort, AuditPort, PolicyPort |

### Domain Primitives

| File | Responsibility | Dependencies |
|------|---------------|--------------|
| `MatchResult.ts` | Match result value object | None (pure logic) |

### Errors

| File | Responsibility | Dependencies |
|------|---------------|--------------|
| `errors.ts` | Cell-specific error classes | None (base errors) |

### Exports

| File | Responsibility | Dependencies |
|------|---------------|--------------|
| `index.ts` | Public API exports | All services, errors, types |

---

## Kernel Integration Points

### Required Kernel Services (CONT_07)

| Service | Symbol | Purpose | Integration Point |
|---------|--------|---------|------------------|
| **K_LOG** | `AuditPort` | Immutable audit trail | `MatchService`, `ExceptionService` |
| **K_POLICY** | `PolicyPort` | Match mode, tolerance rules | `MatchService`, `ToleranceService` |

**Integration Pattern:**
```typescript
// Services receive ports via constructor injection
export class MatchService {
  constructor(
    private matchRepo: MatchRepositoryPort,
    private poPort: PurchaseOrderPort,        // External/Internal PO
    private grnPort: GoodsReceiptPort,       // External/Internal GRN
    private policyPort: PolicyPort,          // K_POLICY
    private auditPort: AuditPort              // K_LOG
  ) {}
}
```

---

## Test Organization

### Unit Tests (Fast, Isolated)

| Test File | Tests | Purpose |
|-----------|-------|---------|
| `MatchService.test.ts` | Match evaluation logic | Business logic validation |
| `ToleranceService.test.ts` | Tolerance rule evaluation | Tolerance logic validation |
| `ExceptionService.test.ts` | Exception queue management | Exception logic validation |
| `SoD.test.ts` | Override SoD enforcement | **Control Test** (CONT_07 requirement) |
| `Immutability.test.ts` | Posted match result immutability | **Control Test** (CONT_07 requirement) |
| `PolicyConfiguration.test.ts` | Policy-driven configuration | **Control Test** (CONT_07 requirement) |
| `Audit.test.ts` | Audit event coverage | **Control Test** (CONT_07 requirement) |

### Integration Tests (Real Database)

| Test File | Tests | Purpose |
|-----------|-------|---------|
| `match-cell.integration.test.ts` | Full workflow end-to-end | Real PostgreSQL, real adapters |

**Test Setup:**
- Uses `apps/db/migrations/finance/109_create_match_results.sql`
- Uses `apps/db/migrations/finance/110_create_match_exceptions.sql`
- Uses real `SqlMatchRepository` adapter
- Uses real `SqlAuditRepo` adapter (K_LOG)
- Uses mock PO/GRN adapters for testing

---

## Cross-Cell Dependencies

### Upstream (AP-03 depends on)

| Cell | Dependency | Purpose |
|------|------------|---------|
| **AP-02** (Invoice Entry) | Invoice submitted check | Reads `ap.invoices` WHERE `status = 'submitted'` |
| **Kernel** | K_LOG, K_POLICY | Cross-cutting services |
| **External/Internal** | PO/GRN data | Purchase orders and goods receipts |

### Downstream (depends on AP-03)

| Cell | Dependency | Purpose |
|------|------------|---------|
| **AP-04** (Invoice Approval) | Match result check | Reads `ap.match_results` WHERE `status = 'passed'` or `'exception'` |

**Architectural Rule:** Downstream cells **read** from AP-03 via FK constraints. Match result stored in `ap.invoices.match_status`.

---

## Database Schema Location

**Migrations:** `apps/db/migrations/finance/`
- `109_create_match_results.sql` — Match results table
- `110_create_match_exceptions.sql` — Match exceptions table

**Why Separate:** Database is **shared infrastructure**. All finance cells share the same database schema (`finance` schema).

---

## Port Definitions Location

**Ports:** `packages/kernel-core/src/ports/`
- `matchRepositoryPort.ts` — MatchRepositoryPort interface
- `purchaseOrderPort.ts` — PurchaseOrderPort interface (external/internal)
- `goodsReceiptPort.ts` — GoodsReceiptPort interface (external/internal)

**Why Shared:** Ports are **contracts** that multiple cells can implement. They live in `kernel-core` for reuse.

---

## Adapter Implementations Location

**Adapters:** `packages/kernel-adapters/src/`
- `sql/matchRepo.sql.ts` — PostgreSQL implementation
- `sql/external/purchaseOrderAdapter.ts` — External PO adapter (if needed)
- `sql/external/goodsReceiptAdapter.ts` — External GRN adapter (if needed)
- `memory/matchRepo.memory.ts` — In-memory implementation (testing)
- `memory/mock/purchaseOrderMock.ts` — Mock PO adapter (testing)
- `memory/mock/goodsReceiptMock.ts` — Mock GRN adapter (testing)

**Why Shared:** Adapters are **reusable infrastructure**. SQL for production, Memory for testing.

---

## API Routes Location

**Routes:** `apps/web/app/api/ap/match/`
- All HTTP endpoints live here (Next.js App Router)

**Why Separate:** API routes are **BFF concerns**, not domain logic. They orchestrate services but don't contain business logic.

---

## Architectural Compliance Checklist

### ✅ CONT_07 Requirements Met

| Requirement | Implementation | Location |
|-------------|---------------|----------|
| **Hexagonal Architecture** | Services → Ports → Adapters | ✅ Clear separation |
| **Kernel Integration** | K_LOG, K_POLICY | ✅ Port injection |
| **SoD Enforcement** | Override requires separate approval | ✅ `chk_sod_override` constraint |
| **Audit Trail** | Transactional audit events | ✅ `AuditPort.emitTransactional()` |
| **Immutability** | Database trigger | ✅ Trigger prevents updates |
| **Policy-Driven Configuration** | Match mode from K_POLICY | ✅ Policy source tracked |
| **Test Coverage** | Unit + Integration + Control tests | ✅ All test types present |
| **Cell Contract** | 8-point checklist | ✅ All requirements met |

---

## Implementation Order

### Phase 1: Foundation
1. ✅ Create directory structure
2. ✅ Create `errors.ts` (error classes)
3. ✅ Create `MatchResult.ts` (value object)
4. ✅ Create `index.ts` (exports)

### Phase 2: Domain Services
1. ✅ Create `MatchService.ts` (match evaluation)
2. ✅ Create `ToleranceService.ts` (tolerance rules)
3. ✅ Create `ExceptionService.ts` (exception queue)

### Phase 3: Infrastructure
1. ✅ Create `MatchRepositoryPort` interface (kernel-core)
2. ✅ Create `PurchaseOrderPort` interface (kernel-core)
3. ✅ Create `GoodsReceiptPort` interface (kernel-core)
4. ✅ Create `SqlMatchRepository` adapter (kernel-adapters)
5. ✅ Create `MemoryMatchRepository` adapter (kernel-adapters)
6. ✅ Create database migrations (apps/db)

### Phase 4: API Integration
1. ✅ Create API routes (apps/web/app/api/ap/match/)
2. ✅ Wire services to routes
3. ✅ Add request validation (Zod schemas)

### Phase 5: Testing
1. ✅ Write unit tests
2. ✅ Write control tests (SoD, Immutability, Policy Configuration, Audit)
3. ✅ Write integration tests
4. ✅ Validate all controls

---

## Key Architectural Decisions

### 1. **Services Don't Import Adapters**
✅ **Correct:** Services receive ports via constructor injection  
❌ **Wrong:** Services import SQL adapters directly

### 2. **Ports Live in kernel-core**
✅ **Correct:** `packages/kernel-core/src/ports/matchRepositoryPort.ts`  
❌ **Wrong:** Ports in cell directory

### 3. **Adapters Live in kernel-adapters**
✅ **Correct:** `packages/kernel-adapters/src/sql/matchRepo.sql.ts`  
❌ **Wrong:** Adapters in cell directory

### 4. **API Routes Live in apps/web**
✅ **Correct:** `apps/web/app/api/ap/match/route.ts`  
❌ **Wrong:** API routes in cell directory

### 5. **Database Migrations Live in apps/db**
✅ **Correct:** `apps/db/migrations/finance/109_create_match_results.sql`  
❌ **Wrong:** Migrations in cell directory

---

## Comparison with AP-05 (Reference)

| Aspect | AP-05 (Reference) | AP-03 (Planned) | Status |
|--------|-------------------|-----------------|--------|
| **Services** | PaymentService, ApprovalService, ExecutionService | MatchService, ToleranceService, ExceptionService | ✅ Aligned |
| **Domain Primitives** | PaymentStateMachine, Money | MatchResult | ✅ Aligned |
| **Errors** | errors.ts | errors.ts | ✅ Aligned |
| **Exports** | index.ts | index.ts | ✅ Aligned |
| **Tests** | Unit + Integration + Control | Unit + Integration + Control | ✅ Aligned |
| **Ports** | kernel-core | kernel-core | ✅ Aligned |
| **Adapters** | kernel-adapters | kernel-adapters | ✅ Aligned |
| **API Routes** | apps/web/app/api/payments/ | apps/web/app/api/ap/match/ | ✅ Aligned |
| **Migrations** | apps/db/migrations/finance/ | apps/db/migrations/finance/ | ✅ Aligned |

---

## ⚠️ Implementation Gaps

### To Be Created

The following components need to be implemented to complete the AP-03 3-Way Engine Cell:

#### 1. **BFF Routes** (`apps/web/app/api/ap/match/`)

**Status:** ⚠️ **TO BE CREATED**

**Required Routes:**
```
apps/web/app/api/ap/match/
├── evaluate/
│   └── route.ts                  ⚠️ POST /api/ap/match/evaluate
├── [invoice_id]/
│   ├── route.ts                  ⚠️ GET /api/ap/match/{invoice_id}
│   └── override/
│       └── route.ts              ⚠️ POST /api/ap/match/{invoice_id}/override
└── exceptions/
    ├── route.ts                  ⚠️ GET /api/ap/match/exceptions
    └── [id]/
        └── resolve/
            └── route.ts          ⚠️ POST /api/ap/match/exceptions/{id}/resolve
```

**Reference Pattern:** `apps/web/app/api/payments/` (AP-05 implementation)

**Requirements:**
- ✅ Use `requireAuth()` middleware (per `security-rules.mdc`)
- ✅ Validate input with Zod schemas
- ✅ Call Cell services (MatchService, ToleranceService, ExceptionService)
- ✅ Handle errors gracefully
- ✅ Return properly formatted responses

---

#### 2. **Frontend Pages** (`apps/web/app/match/`)

**Status:** ⚠️ **TO BE CREATED**

**Required Pages:**
```
apps/web/app/match/
├── page.tsx                      ⚠️ Match results list page
├── [invoice_id]/
│   ├── page.tsx                  ⚠️ Match result detail page
│   └── override/
│       └── page.tsx               ⚠️ Match override page
└── exceptions/
    ├── page.tsx                  ⚠️ Exception queue page
    └── [id]/
        └── resolve/
            └── page.tsx          ⚠️ Exception resolve page
```

**Requirements:**
- ✅ Use BioSkin components (BioForm, BioTable, BioObject)
- ✅ Call BFF routes (`/api/ap/match/*`), never backend directly
- ✅ Use Client Components for interactivity
- ✅ Follow Next.js App Router patterns

---

#### 3. **Database Migrations** (`apps/db/migrations/finance/`)

**Status:** ⚠️ **TO BE CREATED**

**Required Migrations:**
- ⚠️ `109_create_match_results.sql` — Match results table (`ap.match_results`)
- ⚠️ `110_create_match_exceptions.sql` — Match exceptions table (`ap.match_exceptions`)

**Requirements:**
- ✅ Follow existing migration naming convention (sequential numbers)
- ✅ Include all constraints (SoD override, immutability, FK constraints)
- ✅ Include indexes for performance
- ✅ Include triggers for business rules
- ✅ Reference PRD for complete schema definition

**Reference:** See `apps/db/migrations/finance/104_create_payments.sql` (AP-05)

---

#### 4. **Ports** (`packages/kernel-core/src/ports/`)

**Status:** ⚠️ **TO BE CREATED**

**Required Ports:**
- ⚠️ `matchRepositoryPort.ts` — MatchRepositoryPort interface
- ⚠️ `purchaseOrderPort.ts` — PurchaseOrderPort interface (external/internal)
- ⚠️ `goodsReceiptPort.ts` — GoodsReceiptPort interface (external/internal)

**Requirements:**
- ✅ Define interfaces for data access and external services
- ✅ Include methods: `save()`, `findById()`, `findByInvoiceId()`, etc.
- ✅ Follow pattern from `paymentRepositoryPort.ts` (AP-05)
- ✅ Export from `packages/kernel-core/src/ports/index.ts`

---

#### 5. **Adapters** (`packages/kernel-adapters/src/`)

**Status:** ⚠️ **TO BE CREATED**

**Required Adapters:**
- ⚠️ `sql/matchRepo.sql.ts` — SqlMatchRepository (PostgreSQL implementation)
- ⚠️ `sql/external/purchaseOrderAdapter.ts` — External PO adapter (if needed)
- ⚠️ `sql/external/goodsReceiptAdapter.ts` — External GRN adapter (if needed)
- ⚠️ `memory/matchRepo.memory.ts` — MemoryMatchRepository (Testing implementation)
- ⚠️ `memory/mock/purchaseOrderMock.ts` — Mock PO adapter (Testing)
- ⚠️ `memory/mock/goodsReceiptMock.ts` — Mock GRN adapter (Testing)

**Requirements:**
- ✅ Implement port interfaces
- ✅ SQL adapter uses PostgreSQL client
- ✅ Memory adapter for unit testing
- ✅ Follow pattern from `paymentRepo.sql.ts` and `paymentRepo.memory.ts` (AP-05)
- ✅ Export from `packages/kernel-adapters/src/index.ts`

---

#### 6. **Cell Services** (`apps/canon/finance/dom03-accounts-payable/cells/ap03-3way-engine/`)

**Status:** ⚠️ **TO BE CREATED**

**Required Services:**
- ⚠️ `MatchService.ts` — Match evaluation logic
- ⚠️ `ToleranceService.ts` — Tolerance rule evaluation
- ⚠️ `ExceptionService.ts` — Exception queue management
- ⚠️ `MatchResult.ts` — Match result value object
- ⚠️ `errors.ts` — Cell-specific error classes
- ⚠️ `index.ts` — Public API exports

**Requirements:**
- ✅ Pure business logic (no HTTP, no DB access)
- ✅ Receive ports via constructor injection
- ✅ Follow pattern from AP-05 Payment Execution Cell
- ✅ Include comprehensive error handling

---

#### 7. **Tests** (`apps/canon/finance/dom03-accounts-payable/cells/ap03-3way-engine/__tests__/`)

**Status:** ⚠️ **TO BE CREATED**

**Required Tests:**
- ⚠️ `MatchService.test.ts` — Unit: Match evaluation logic
- ⚠️ `ToleranceService.test.ts` — Unit: Tolerance rule evaluation
- ⚠️ `ExceptionService.test.ts` — Unit: Exception queue management
- ⚠️ `SoD.test.ts` — Control: Override SoD enforcement
- ⚠️ `Immutability.test.ts` — Control: Posted match result immutability
- ⚠️ `PolicyConfiguration.test.ts` — Control: Policy-driven configuration
- ⚠️ `Audit.test.ts` — Control: Audit event coverage
- ⚠️ `integration/match-cell.integration.test.ts` — Integration: Full workflow

**Requirements:**
- ✅ Unit tests for all services
- ✅ Control tests for SoD, Immutability, Policy Configuration, Audit
- ✅ Integration tests with real database
- ✅ Follow pattern from AP-05 test suite

---

## Summary

### ✅ **Architectural Requirements Fulfilled**

1. **Hexagonal Architecture** — Clear separation: Services → Ports → Adapters
2. **Kernel Integration** — All required Kernel services integrated (K_LOG, K_POLICY)
3. **Cell Boundaries** — No direct dependencies on other cells (only Kernel and AP-02 via port)
4. **Testability** — Unit, integration, and control tests organized
5. **Reusability** — Ports and adapters shared across cells
6. **Maintainability** — Clear directory structure, single responsibility per file

### 📋 **Implementation Checklist**

#### Phase 1: Infrastructure Setup
- [ ] Create `MatchRepositoryPort` interface (`packages/kernel-core/src/ports/`)
- [ ] Create `PurchaseOrderPort` interface (`packages/kernel-core/src/ports/`)
- [ ] Create `GoodsReceiptPort` interface (`packages/kernel-core/src/ports/`)
- [ ] Create `SqlMatchRepository` adapter (`packages/kernel-adapters/src/sql/`)
- [ ] Create `MemoryMatchRepository` adapter (`packages/kernel-adapters/src/memory/`)
- [ ] Create database migrations (`apps/db/migrations/finance/109_*.sql`, `110_*.sql`)

#### Phase 2: Cell Implementation
- [ ] Create `errors.ts` (error classes)
- [ ] Create `MatchResult.ts` (value object)
- [ ] Create `MatchService.ts` (match evaluation)
- [ ] Create `ToleranceService.ts` (tolerance rules)
- [ ] Create `ExceptionService.ts` (exception queue)
- [ ] Create `index.ts` (exports)

#### Phase 3: BFF Integration
- [ ] Create BFF routes (`apps/web/app/api/ap/match/`)
- [ ] Wire services to routes
- [ ] Add request validation (Zod schemas)
- [ ] Add error handling

#### Phase 4: Frontend Integration
- [ ] Create frontend pages (`apps/web/app/match/`)
- [ ] Use BioSkin components (BioForm, BioTable, BioObject)
- [ ] Connect to BFF routes

#### Phase 5: Testing
- [ ] Write unit tests
- [ ] Write control tests (SoD, Immutability, Policy Configuration, Audit)
- [ ] Write integration tests
- [ ] Validate all controls

---

**Status:** ✅ Ready for Implementation  
**Architecture Compliance:** ✅ CONT_07 Compliant  
**Reference Pattern:** ✅ AP-05 Payment Execution

---

**Last Updated:** 2025-12-16  
**Author:** Finance Cell Team  
**Review:** Architecture Team
