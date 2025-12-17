# AP-04 Invoice Approval — Implementation Directory Structure

> **Architecture Compliance:** CONT_07 (Finance Canon Architecture)  
> **Reference Pattern:** AP-05 Payment Execution Cell  
> **Status:** 📋 Planning Document  
> **Architecture Review:** See `ARCHITECTURE-REVIEW.md` for complete compliance verification

---

## Executive Brief

This document outlines the **directory structure** for implementing AP-04 Invoice Approval Workflow Cell following the **Hexagonal Architecture** pattern mandated by CONT_07. The structure ensures:

1. ✅ **Separation of Concerns** — Domain logic isolated from infrastructure
2. ✅ **Port & Adapter Pattern** — Interfaces separate from implementations
3. ✅ **Testability** — Unit and integration tests organized
4. ✅ **Kernel Integration** — Clear boundaries with Kernel services
5. ✅ **Cell Contract Compliance** — All 8-point contract requirements met

---

## Directory Structure (Complete)

```
apps/canon/finance/dom03-accounts-payable/cells/ap04-invoice-submit-approval/
│
├── 📄 PRD-ap04-invoice-submit-approval.md  # Product Requirements Document
├── 📄 README.md                             # Cell overview (optional, PRD is SSOT)
│
├── 📁 Domain Services (Core Business Logic)
│   ├── ApprovalService.ts                  # Approval workflow logic, SoD enforcement
│   ├── RoutingService.ts                    # Compute approval route (K_POLICY)
│   └── DelegationService.ts                 # Delegation management
│
├── 📁 Domain Primitives (Value Objects)
│   └── ApprovalStateMachine.ts             # Approval state transitions
│
├── 📁 Errors (Domain Exceptions)
│   └── errors.ts                           # All cell-specific errors
│
├── 📁 Exports (Public API)
│   └── index.ts                             # Public exports (services, types, errors)
│
├── 📁 Tests (Test Suite)
│   ├── __tests__/
│   │   ├── ApprovalService.test.ts          # Unit: Approval workflow, SoD enforcement
│   │   ├── RoutingService.test.ts           # Unit: Approval route computation
│   │   ├── DelegationService.test.ts         # Unit: Delegation management
│   │   ├── SoD.test.ts                       # Control: Maker ≠ Checker enforcement
│   │   ├── Immutability.test.ts              # Control: Approval chain immutability
│   │   ├── Reapproval.test.ts                # Control: Re-approval on change
│   │   ├── Audit.test.ts                     # Control: Audit event coverage
│   │   └── integration/
│   │       ├── setup.ts                      # Integration test setup (DB, adapters)
│   │       ├── approval-cell.integration.test.ts  # Integration: Full workflow
│   │       └── TEST_RESULTS.md               # Test execution results
│
└── 📁 Documentation (Optional)
    ├── IMPLEMENTATION_SUMMARY.md            # Implementation status
    └── VALIDATION_REPORT.md                 # Control validation report
```

---

## Architecture Layers (CONT_07 Compliance)

### Layer 1: **Inbound Ports** (API Routes)
**Location:** `apps/web/app/api/ap/approvals/` (NOT in cell directory)

```
apps/web/app/api/ap/approvals/
├── inbox/
│   └── route.ts                             # GET /api/ap/approvals/inbox
├── invoice/
│   └── [invoice_id]/
│       └── route.ts                         # GET /api/ap/approvals/invoice/{invoice_id}
└── [approval_id]/
    ├── approve/
    │   └── route.ts                         # POST /api/ap/approvals/{approval_id}/approve
    ├── reject/
    │   └── route.ts                         # POST /api/ap/approvals/{approval_id}/reject
    └── request-changes/
        └── route.ts                         # POST /api/ap/approvals/{approval_id}/request-changes
```

**Why Separate:** API routes are BFF (Backend for Frontend) concerns, not domain logic. They live in `apps/web/` per CONT_07.

---

### Layer 2: **Domain Services** (Business Logic)
**Location:** `apps/canon/finance/dom03-accounts-payable/cells/ap04-invoice-submit-approval/`

```
ApprovalService.ts
├── requestApproval()                        # Request approval (compute route)
├── approve()                                # Approve invoice (SoD check)
├── reject()                                 # Reject invoice (SoD check)
├── requestChanges()                         # Request changes (reset approval chain)
└── getApprovalHistory()                     # Get approval history

RoutingService.ts
├── computeApprovalRoute()                   # Compute approval route from K_POLICY
├── getApprovalLevels()                      # Get required approval levels
└── getApproversForLevel()                   # Get approvers for level

DelegationService.ts
├── createDelegation()                       # Create delegation
├── revokeDelegation()                       # Revoke delegation
└── getActiveDelegations()                   # Get active delegations
```

**Architectural Rule:** Services contain **pure business logic**. No database access, no HTTP concerns.

---

### Layer 3: **Outbound Ports** (Interfaces)
**Location:** `packages/kernel-core/src/ports/` (Shared across all cells)

```
packages/kernel-core/src/ports/
├── approvalRepositoryPort.ts               # ApprovalRepositoryPort interface
├── invoicePort.ts                           # InvoicePort (AP-02 integration)
├── glPostingPort.ts                         # GLPostingPort (GL-03 integration)
├── policyPort.ts                            # PolicyPort (K_POLICY) - already exists
├── auditPort.ts                             # AuditPort (K_LOG) - already exists
└── eventBusPort.ts                          # EventBusPort (K_NOTIFY) - already exists
```

**Why Shared:** Ports are **interfaces**, not implementations. They define contracts that multiple cells can use.

---

### Layer 4: **Adapters** (Implementations)
**Location:** `packages/kernel-adapters/src/` (Shared across all cells)

```
packages/kernel-adapters/src/
├── sql/
│   ├── approvalRepo.sql.ts                 # SqlApprovalRepository (PostgreSQL)
│   └── invoiceRepo.sql.ts                   # SqlInvoiceAdapter (AP-02)
└── memory/
    ├── approvalRepo.memory.ts              # MemoryApprovalRepository (Testing)
    └── invoiceRepo.memory.ts               # MemoryInvoiceAdapter (Testing)
```

**Why Shared:** Adapters are **reusable infrastructure**. SQL adapter for production, Memory adapter for testing.

---

### Layer 5: **Database Migrations**
**Location:** `apps/db/migrations/finance/`

```
apps/db/migrations/finance/
├── 111_create_invoice_approvals.sql        # ap.invoice_approvals table
└── 112_create_approval_routes.sql          # ap.approval_routes table
```

**Why Separate:** Database schema is **infrastructure concern**, not domain logic. Migrations live in `apps/db/`.

---

## File Responsibilities

### Domain Services

| File | Responsibility | Dependencies |
|------|---------------|--------------|
| `ApprovalService.ts` | Approval workflow logic, SoD enforcement | ApprovalRepositoryPort, InvoicePort, GLPostingPort, PolicyPort, AuditPort, EventBusPort |
| `RoutingService.ts` | Approval route computation | PolicyPort |
| `DelegationService.ts` | Delegation management | ApprovalRepositoryPort, PolicyPort |

### Domain Primitives

| File | Responsibility | Dependencies |
|------|---------------|--------------|
| `ApprovalStateMachine.ts` | Approval state transitions | None (pure logic) |

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
| **K_LOG** | `AuditPort` | Immutable audit trail | `ApprovalService`, `DelegationService` |
| **K_POLICY** | `PolicyPort` | Approval rules, thresholds | `ApprovalService`, `RoutingService` |
| **K_NOTIFY** | `EventBusPort` | Publish domain events (outbox) | `ApprovalService` |

**Integration Pattern:**
```typescript
// Services receive ports via constructor injection
export class ApprovalService {
  constructor(
    private approvalRepo: ApprovalRepositoryPort,
    private invoicePort: InvoicePort,          // AP-02
    private glPostingPort: GLPostingPort,       // GL-03
    private policyPort: PolicyPort,            // K_POLICY
    private auditPort: AuditPort,              // K_LOG
    private eventBusPort: EventBusPort         // K_NOTIFY
  ) {}
}
```

---

## Test Organization

### Unit Tests (Fast, Isolated)

| Test File | Tests | Purpose |
|-----------|-------|---------|
| `ApprovalService.test.ts` | Approval workflow, SoD enforcement | Business logic validation |
| `RoutingService.test.ts` | Approval route computation | Routing logic validation |
| `DelegationService.test.ts` | Delegation management | Delegation logic validation |
| `SoD.test.ts` | Maker ≠ Checker enforcement | **Control Test** (CONT_07 requirement) |
| `Immutability.test.ts` | Approval chain immutability | **Control Test** (CONT_07 requirement) |
| `Reapproval.test.ts` | Re-approval on change | **Control Test** (CONT_07 requirement) |
| `Audit.test.ts` | Audit event coverage | **Control Test** (CONT_07 requirement) |

### Integration Tests (Real Database)

| Test File | Tests | Purpose |
|-----------|-------|---------|
| `approval-cell.integration.test.ts` | Full workflow end-to-end | Real PostgreSQL, real adapters |

**Test Setup:**
- Uses `apps/db/migrations/finance/111_create_invoice_approvals.sql`
- Uses `apps/db/migrations/finance/112_create_approval_routes.sql`
- Uses real `SqlApprovalRepository` adapter
- Uses real `SqlAuditRepo` adapter (K_LOG)
- Uses real `SqlEventBusAdapter` (K_NOTIFY)

---

## Cross-Cell Dependencies

### Upstream (AP-04 depends on)

| Cell | Dependency | Purpose |
|------|------------|---------|
| **AP-02** (Invoice Entry) | Invoice matched check | Reads `ap.invoices` WHERE `status = 'matched'` |
| **AP-03** (3-Way Engine) | Match result check | Reads `ap.match_results` WHERE `status = 'passed'` |
| **Kernel** | K_LOG, K_POLICY, K_NOTIFY | Cross-cutting services |

### Downstream (depends on AP-04)

| Cell | Dependency | Purpose |
|------|------------|---------|
| **GL-03** (Posting Engine) | Invoice approved check | Receives posting request from `ApprovalService.approve()` on final approval |

**Architectural Rule:** Downstream cells **read** from AP-04 via service calls. GL-03 receives blocking call from `ApprovalService` on final approval.

---

## Database Schema Location

**Migrations:** `apps/db/migrations/finance/`
- `111_create_invoice_approvals.sql` — Invoice approvals table
- `112_create_approval_routes.sql` — Approval routes table

**Why Separate:** Database is **shared infrastructure**. All finance cells share the same database schema (`finance` schema).

---

## Port Definitions Location

**Ports:** `packages/kernel-core/src/ports/`
- `approvalRepositoryPort.ts` — ApprovalRepositoryPort interface
- `invoicePort.ts` — InvoicePort interface (AP-02 integration)
- `glPostingPort.ts` — GLPostingPort interface (GL-03 integration)
- `eventBusPort.ts` — EventBusPort interface (K_NOTIFY)

**Why Shared:** Ports are **contracts** that multiple cells can implement. They live in `kernel-core` for reuse.

---

## Adapter Implementations Location

**Adapters:** `packages/kernel-adapters/src/`
- `sql/approvalRepo.sql.ts` — PostgreSQL implementation
- `sql/invoiceRepo.sql.ts` — Invoice adapter (AP-02)
- `memory/approvalRepo.memory.ts` — In-memory implementation (testing)

**Why Shared:** Adapters are **reusable infrastructure**. SQL for production, Memory for testing.

---

## API Routes Location

**Routes:** `apps/web/app/api/ap/approvals/`
- All HTTP endpoints live here (Next.js App Router)

**Why Separate:** API routes are **BFF concerns**, not domain logic. They orchestrate services but don't contain business logic.

---

## Architectural Compliance Checklist

### ✅ CONT_07 Requirements Met

| Requirement | Implementation | Location |
|-------------|---------------|----------|
| **Hexagonal Architecture** | Services → Ports → Adapters | ✅ Clear separation |
| **Kernel Integration** | K_LOG, K_POLICY, K_NOTIFY | ✅ Port injection |
| **SoD Enforcement** | Database constraint + service validation | ✅ `chk_sod_approval` constraint |
| **Audit Trail** | Transactional audit events | ✅ `AuditPort.emitTransactional()` |
| **State Machine** | ApprovalStateMachine.ts | ✅ Pure domain logic |
| **Immutability** | Database trigger | ✅ Trigger prevents deletion |
| **Re-approval on Change** | Approval chain reset | ✅ State machine logic |
| **Test Coverage** | Unit + Integration + Control tests | ✅ All test types present |
| **Cell Contract** | 8-point checklist | ✅ All requirements met |

---

## Implementation Order

### Phase 1: Foundation
1. ✅ Create directory structure
2. ✅ Create `errors.ts` (error classes)
3. ✅ Create `ApprovalStateMachine.ts` (state transitions)
4. ✅ Create `index.ts` (exports)

### Phase 2: Domain Services
1. ✅ Create `ApprovalService.ts` (approval workflow, SoD)
2. ✅ Create `RoutingService.ts` (route computation)
3. ✅ Create `DelegationService.ts` (delegation management)

### Phase 3: Infrastructure
1. ✅ Create `ApprovalRepositoryPort` interface (kernel-core)
2. ✅ Create `InvoicePort` interface (kernel-core)
3. ✅ Create `GLPostingPort` interface (kernel-core)
4. ✅ Create `EventBusPort` interface (kernel-core)
5. ✅ Create `SqlApprovalRepository` adapter (kernel-adapters)
6. ✅ Create `MemoryApprovalRepository` adapter (kernel-adapters)
7. ✅ Create database migrations (apps/db)

### Phase 4: API Integration
1. ✅ Create API routes (apps/web/app/api/ap/approvals/)
2. ✅ Wire services to routes
3. ✅ Add request validation (Zod schemas)

### Phase 5: Testing
1. ✅ Write unit tests
2. ✅ Write control tests (SoD, Immutability, Reapproval, Audit)
3. ✅ Write integration tests
4. ✅ Validate all controls

---

## Key Architectural Decisions

### 1. **Services Don't Import Adapters**
✅ **Correct:** Services receive ports via constructor injection  
❌ **Wrong:** Services import SQL adapters directly

### 2. **Ports Live in kernel-core**
✅ **Correct:** `packages/kernel-core/src/ports/approvalRepositoryPort.ts`  
❌ **Wrong:** Ports in cell directory

### 3. **Adapters Live in kernel-adapters**
✅ **Correct:** `packages/kernel-adapters/src/sql/approvalRepo.sql.ts`  
❌ **Wrong:** Adapters in cell directory

### 4. **API Routes Live in apps/web**
✅ **Correct:** `apps/web/app/api/ap/approvals/route.ts`  
❌ **Wrong:** API routes in cell directory

### 5. **Database Migrations Live in apps/db**
✅ **Correct:** `apps/db/migrations/finance/111_create_invoice_approvals.sql`  
❌ **Wrong:** Migrations in cell directory

---

## Comparison with AP-05 (Reference)

| Aspect | AP-05 (Reference) | AP-04 (Planned) | Status |
|--------|-------------------|----------------|--------|
| **Services** | PaymentService, ApprovalService, ExecutionService | ApprovalService, RoutingService, DelegationService | ✅ Aligned |
| **Domain Primitives** | PaymentStateMachine, Money | ApprovalStateMachine | ✅ Aligned |
| **Errors** | errors.ts | errors.ts | ✅ Aligned |
| **Exports** | index.ts | index.ts | ✅ Aligned |
| **Tests** | Unit + Integration + Control | Unit + Integration + Control | ✅ Aligned |
| **Ports** | kernel-core | kernel-core | ✅ Aligned |
| **Adapters** | kernel-adapters | kernel-adapters | ✅ Aligned |
| **API Routes** | apps/web/app/api/payments/ | apps/web/app/api/ap/approvals/ | ✅ Aligned |
| **Migrations** | apps/db/migrations/finance/ | apps/db/migrations/finance/ | ✅ Aligned |

---

## ⚠️ Implementation Gaps

### To Be Created

The following components need to be implemented to complete the AP-04 Invoice Approval Cell:

#### 1. **BFF Routes** (`apps/web/app/api/ap/approvals/`)

**Status:** ⚠️ **TO BE CREATED**

**Required Routes:**
```
apps/web/app/api/ap/approvals/
├── inbox/
│   └── route.ts                  ⚠️ GET /api/ap/approvals/inbox
├── invoice/
│   └── [invoice_id]/
│       └── route.ts              ⚠️ GET /api/ap/approvals/invoice/{invoice_id}
└── [approval_id]/
    ├── approve/
    │   └── route.ts              ⚠️ POST /api/ap/approvals/{approval_id}/approve
    ├── reject/
    │   └── route.ts              ⚠️ POST /api/ap/approvals/{approval_id}/reject
    └── request-changes/
        └── route.ts              ⚠️ POST /api/ap/approvals/{approval_id}/request-changes
```

**Reference Pattern:** `apps/web/app/api/payments/` (AP-05 implementation)

**Requirements:**
- ✅ Use `requireAuth()` middleware (per `security-rules.mdc`)
- ✅ Validate input with Zod schemas
- ✅ Call Cell services (ApprovalService, RoutingService, DelegationService)
- ✅ Handle errors gracefully
- ✅ Return properly formatted responses

---

#### 2. **Frontend Pages** (`apps/web/app/approvals/`)

**Status:** ⚠️ **TO BE CREATED**

**Required Pages:**
```
apps/web/app/approvals/
├── page.tsx                      ⚠️ Approval inbox page
├── [approval_id]/
│   ├── page.tsx                  ⚠️ Approval detail page
│   ├── approve/
│   │   └── page.tsx              ⚠️ Approval approve page
│   └── reject/
│       └── page.tsx              ⚠️ Approval reject page
└── invoice/
    └── [invoice_id]/
        └── page.tsx              ⚠️ Invoice approval history page
```

**Requirements:**
- ✅ Use BioSkin components (BioForm, BioTable, BioObject)
- ✅ Call BFF routes (`/api/ap/approvals/*`), never backend directly
- ✅ Use Client Components for interactivity
- ✅ Follow Next.js App Router patterns

---

#### 3. **Database Migrations** (`apps/db/migrations/finance/`)

**Status:** ⚠️ **TO BE CREATED**

**Required Migrations:**
- ⚠️ `111_create_invoice_approvals.sql` — Invoice approvals table (`ap.invoice_approvals`)
- ⚠️ `112_create_approval_routes.sql` — Approval routes table (`ap.approval_routes`)

**Requirements:**
- ✅ Follow existing migration naming convention (sequential numbers)
- ✅ Include all constraints (SoD, immutability, FK constraints)
- ✅ Include indexes for performance
- ✅ Include triggers for business rules
- ✅ Reference PRD for complete schema definition

**Reference:** See `apps/db/migrations/finance/104_create_payments.sql` (AP-05)

---

#### 4. **Ports** (`packages/kernel-core/src/ports/`)

**Status:** ⚠️ **TO BE CREATED**

**Required Ports:**
- ⚠️ `approvalRepositoryPort.ts` — ApprovalRepositoryPort interface
- ⚠️ `invoicePort.ts` — InvoicePort interface (AP-02 integration)
- ⚠️ `glPostingPort.ts` — GLPostingPort interface (GL-03 integration)
- ⚠️ `eventBusPort.ts` — EventBusPort interface (K_NOTIFY)

**Requirements:**
- ✅ Define interfaces for data access and external services
- ✅ Include methods: `save()`, `findById()`, `findByInvoiceId()`, etc.
- ✅ Follow pattern from `paymentRepositoryPort.ts` (AP-05)
- ✅ Export from `packages/kernel-core/src/ports/index.ts`

---

#### 5. **Adapters** (`packages/kernel-adapters/src/`)

**Status:** ⚠️ **TO BE CREATED**

**Required Adapters:**
- ⚠️ `sql/approvalRepo.sql.ts` — SqlApprovalRepository (PostgreSQL implementation)
- ⚠️ `sql/invoiceRepo.sql.ts` — SqlInvoiceAdapter (AP-02)
- ⚠️ `memory/approvalRepo.memory.ts` — MemoryApprovalRepository (Testing implementation)

**Requirements:**
- ✅ Implement port interfaces
- ✅ SQL adapter uses PostgreSQL client
- ✅ Memory adapter for unit testing
- ✅ Follow pattern from `paymentRepo.sql.ts` and `paymentRepo.memory.ts` (AP-05)
- ✅ Export from `packages/kernel-adapters/src/index.ts`

---

#### 6. **Cell Services** (`apps/canon/finance/dom03-accounts-payable/cells/ap04-invoice-submit-approval/`)

**Status:** ⚠️ **TO BE CREATED**

**Required Services:**
- ⚠️ `ApprovalService.ts` — Approval workflow logic, SoD enforcement
- ⚠️ `RoutingService.ts` — Approval route computation
- ⚠️ `DelegationService.ts` — Delegation management
- ⚠️ `ApprovalStateMachine.ts` — Approval state transitions
- ⚠️ `errors.ts` — Cell-specific error classes
- ⚠️ `index.ts` — Public API exports

**Requirements:**
- ✅ Pure business logic (no HTTP, no DB access)
- ✅ Receive ports via constructor injection
- ✅ Follow pattern from AP-05 Payment Execution Cell
- ✅ Include comprehensive error handling

---

#### 7. **Tests** (`apps/canon/finance/dom03-accounts-payable/cells/ap04-invoice-submit-approval/__tests__/`)

**Status:** ⚠️ **TO BE CREATED**

**Required Tests:**
- ⚠️ `ApprovalService.test.ts` — Unit: Approval workflow, SoD enforcement
- ⚠️ `RoutingService.test.ts` — Unit: Approval route computation
- ⚠️ `DelegationService.test.ts` — Unit: Delegation management
- ⚠️ `SoD.test.ts` — Control: Maker ≠ Checker enforcement
- ⚠️ `Immutability.test.ts` — Control: Approval chain immutability
- ⚠️ `Reapproval.test.ts` — Control: Re-approval on change
- ⚠️ `Audit.test.ts` — Control: Audit event coverage
- ⚠️ `integration/approval-cell.integration.test.ts` — Integration: Full workflow

**Requirements:**
- ✅ Unit tests for all services
- ✅ Control tests for SoD, Immutability, Reapproval, Audit
- ✅ Integration tests with real database
- ✅ Follow pattern from AP-05 test suite

---

## Summary

### ✅ **Architectural Requirements Fulfilled**

1. **Hexagonal Architecture** — Clear separation: Services → Ports → Adapters
2. **Kernel Integration** — All required Kernel services integrated (K_LOG, K_POLICY, K_NOTIFY)
3. **Cell Boundaries** — No direct dependencies on other cells (only Kernel and AP-02/AP-03 via ports)
4. **Testability** — Unit, integration, and control tests organized
5. **Reusability** — Ports and adapters shared across cells
6. **Maintainability** — Clear directory structure, single responsibility per file

### 📋 **Implementation Checklist**

#### Phase 1: Infrastructure Setup
- [ ] Create `ApprovalRepositoryPort` interface (`packages/kernel-core/src/ports/`)
- [ ] Create `InvoicePort` interface (`packages/kernel-core/src/ports/`)
- [ ] Create `GLPostingPort` interface (`packages/kernel-core/src/ports/`)
- [ ] Create `EventBusPort` interface (`packages/kernel-core/src/ports/`)
- [ ] Create `SqlApprovalRepository` adapter (`packages/kernel-adapters/src/sql/`)
- [ ] Create `MemoryApprovalRepository` adapter (`packages/kernel-adapters/src/memory/`)
- [ ] Create database migrations (`apps/db/migrations/finance/111_*.sql`, `112_*.sql`)

#### Phase 2: Cell Implementation
- [ ] Create `errors.ts` (error classes)
- [ ] Create `ApprovalStateMachine.ts` (state transitions)
- [ ] Create `ApprovalService.ts` (approval workflow, SoD)
- [ ] Create `RoutingService.ts` (route computation)
- [ ] Create `DelegationService.ts` (delegation management)
- [ ] Create `index.ts` (exports)

#### Phase 3: BFF Integration
- [ ] Create BFF routes (`apps/web/app/api/ap/approvals/`)
- [ ] Wire services to routes
- [ ] Add request validation (Zod schemas)
- [ ] Add error handling

#### Phase 4: Frontend Integration
- [ ] Create frontend pages (`apps/web/app/approvals/`)
- [ ] Use BioSkin components (BioForm, BioTable, BioObject)
- [ ] Connect to BFF routes

#### Phase 5: Testing
- [ ] Write unit tests
- [ ] Write control tests (SoD, Immutability, Reapproval, Audit)
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
