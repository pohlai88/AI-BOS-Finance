# AP-02 Invoice Entry — Implementation Directory Structure

> **Architecture Compliance:** CONT_07 (Finance Canon Architecture)  
> **Reference Pattern:** AP-05 Payment Execution Cell  
> **Status:** 📋 Planning Document  
> **Architecture Review:** See `ARCHITECTURE-REVIEW.md` for complete compliance verification

---

## Executive Brief

This document outlines the **directory structure** for implementing AP-02 Invoice Entry Cell following the **Hexagonal Architecture** pattern mandated by CONT_07. The structure ensures:

1. ✅ **Separation of Concerns** — Domain logic isolated from infrastructure
2. ✅ **Port & Adapter Pattern** — Interfaces separate from implementations
3. ✅ **Testability** — Unit and integration tests organized
4. ✅ **Kernel Integration** — Clear boundaries with Kernel services
5. ✅ **Cell Contract Compliance** — All 8-point contract requirements met

---

## Directory Structure (Complete)

```
apps/canon/finance/dom03-accounts-payable/cells/ap02-invoice-entry/
│
├── 📄 PRD-ap02-invoice-entry.md          # Product Requirements Document
├── 📄 README.md                           # Cell overview (optional, PRD is SSOT)
│
├── 📁 Domain Services (Core Business Logic)
│   ├── InvoiceService.ts                  # Invoice CRUD, state transitions
│   ├── PostingService.ts                  # GL posting orchestration
│   └── DuplicateDetectionService.ts      # Duplicate detection logic
│
├── 📁 Domain Primitives (Value Objects)
│   ├── InvoiceStateMachine.ts             # State transition logic
│   └── InvoiceAmount.ts                   # Money value object (if needed)
│
├── 📁 Errors (Domain Exceptions)
│   └── errors.ts                          # All cell-specific errors
│
├── 📁 Exports (Public API)
│   └── index.ts                           # Public exports (services, types, errors)
│
├── 📁 Tests (Test Suite)
│   ├── __tests__/
│   │   ├── InvoiceService.test.ts         # Unit: Invoice CRUD, state transitions
│   │   ├── PostingService.test.ts         # Unit: GL posting orchestration
│   │   ├── DuplicateDetectionService.test.ts  # Unit: Duplicate detection
│   │   ├── InvoiceStateMachine.test.ts   # Unit: State machine transitions
│   │   ├── PeriodCutoff.test.ts           # Control: Period cutoff enforcement
│   │   ├── Immutability.test.ts           # Control: Posted invoice immutability
│   │   ├── DuplicateDetection.test.ts     # Control: Duplicate invoice blocking
│   │   ├── Audit.test.ts                  # Control: Audit event coverage
│   │   └── integration/
│   │       ├── setup.ts                   # Integration test setup (DB, adapters)
│   │       ├── invoice-cell.integration.test.ts  # Integration: Full workflow
│   │       └── TEST_RESULTS.md            # Test execution results
│
└── 📁 Documentation (Optional)
    ├── IMPLEMENTATION_SUMMARY.md          # Implementation status
    └── VALIDATION_REPORT.md               # Control validation report
```

---

## Architecture Layers (CONT_07 Compliance)

### Layer 1: **Inbound Ports** (API Routes)
**Location:** `apps/web/app/api/ap/invoices/` (NOT in cell directory)

```
apps/web/app/api/ap/invoices/
├── route.ts                               # GET /api/ap/invoices (list), POST (create)
├── [id]/
│   ├── route.ts                           # GET /api/ap/invoices/{id}, PUT (update)
│   ├── submit/
│   │   └── route.ts                       # POST /api/ap/invoices/{id}/submit
│   └── void/
│       └── route.ts                      # POST /api/ap/invoices/{id}/void
```

**Why Separate:** API routes are BFF (Backend for Frontend) concerns, not domain logic. They live in `apps/web/` per CONT_07.

---

### Layer 2: **Domain Services** (Business Logic)
**Location:** `apps/canon/finance/dom03-accounts-payable/cells/ap02-invoice-entry/`

```
InvoiceService.ts
├── createInvoice()                        # Create invoice (draft)
├── updateInvoice()                        # Update invoice (draft only)
├── submitInvoice()                        # Submit for matching/approval
├── voidInvoice()                          # Void invoice (creates reversal)
└── validateInvoice()                      # Business validation

PostingService.ts
├── postToGL()                             # Post invoice to GL-03 (blocking)
├── validatePeriodOpen()                   # K_TIME period cutoff check
├── validateCOA()                          # K_COA account validation
└── generateJournalLines()                 # Deterministic journal line generation

DuplicateDetectionService.ts
├── detectDuplicate()                      # Check for duplicate invoices
├── checkVendorInvoiceNumber()             # Vendor + invoice number check
└── checkAmountTolerance()                 # Amount/date tolerance check
```

**Architectural Rule:** Services contain **pure business logic**. No database access, no HTTP concerns.

---

### Layer 3: **Outbound Ports** (Interfaces)
**Location:** `packages/kernel-core/src/ports/` (Shared across all cells)

```
packages/kernel-core/src/ports/
├── invoiceRepositoryPort.ts               # InvoiceRepositoryPort interface
├── vendorPort.ts                          # VendorPort (AP-01 integration)
├── glPostingPort.ts                       # GLPostingPort (GL-03 integration)
├── fiscalTimePort.ts                      # FiscalTimePort (K_TIME)
├── coaPort.ts                             # COAPort (K_COA)
├── auditPort.ts                           # AuditPort (K_LOG) - already exists
└── sequencePort.ts                       # SequencePort (K_SEQ) - already exists
```

**Why Shared:** Ports are **interfaces**, not implementations. They define contracts that multiple cells can use.

---

### Layer 4: **Adapters** (Implementations)
**Location:** `packages/kernel-adapters/src/` (Shared across all cells)

```
packages/kernel-adapters/src/
├── sql/
│   ├── invoiceRepo.sql.ts                 # SqlInvoiceRepository (PostgreSQL)
│   └── vendorRepo.sql.ts                  # SqlVendorAdapter (AP-01)
└── memory/
    ├── invoiceRepo.memory.ts              # MemoryInvoiceRepository (Testing)
    └── vendorRepo.memory.ts                # MemoryVendorAdapter (Testing)
```

**Why Shared:** Adapters are **reusable infrastructure**. SQL adapter for production, Memory adapter for testing.

---

### Layer 5: **Database Migrations**
**Location:** `apps/db/migrations/finance/`

```
apps/db/migrations/finance/
├── 107_create_invoices.sql                # ap.invoices table
└── 108_create_invoice_lines.sql           # ap.invoice_lines table
```

**Why Separate:** Database schema is **infrastructure concern**, not domain logic. Migrations live in `apps/db/`.

---

## File Responsibilities

### Domain Services

| File | Responsibility | Dependencies |
|------|---------------|--------------|
| `InvoiceService.ts` | Invoice CRUD, state transitions | InvoiceRepositoryPort, AuditPort, SequencePort, VendorPort |
| `PostingService.ts` | GL posting orchestration | InvoiceRepositoryPort, GLPostingPort, FiscalTimePort, COAPort, AuditPort |
| `DuplicateDetectionService.ts` | Duplicate detection logic | InvoiceRepositoryPort |

### Domain Primitives

| File | Responsibility | Dependencies |
|------|---------------|--------------|
| `InvoiceStateMachine.ts` | State transition validation | None (pure logic) |

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
| **K_LOG** | `AuditPort` | Immutable audit trail | `InvoiceService`, `PostingService` |
| **K_POLICY** | `PolicyPort` | Approval rules, risk policies | `InvoiceService` (future) |
| **K_TIME** | `FiscalTimePort` | Period cutoff validation | `PostingService` |
| **K_COA** | `COAPort` | Chart of Accounts validation | `PostingService` |
| **K_SEQ** | `SequencePort` | Invoice number generation | `InvoiceService` |

**Integration Pattern:**
```typescript
// Services receive ports via constructor injection
export class PostingService {
  constructor(
    private invoiceRepo: InvoiceRepositoryPort,
    private glPostingPort: GLPostingPort,      // GL-03
    private fiscalTimePort: FiscalTimePort,     // K_TIME
    private coaPort: COAPort,                   // K_COA
    private auditPort: AuditPort                // K_LOG
  ) {}
}
```

---

## Test Organization

### Unit Tests (Fast, Isolated)

| Test File | Tests | Purpose |
|-----------|-------|---------|
| `InvoiceService.test.ts` | Invoice CRUD, validation | Business logic validation |
| `PostingService.test.ts` | GL posting orchestration | Posting logic validation |
| `DuplicateDetectionService.test.ts` | Duplicate detection | Duplicate logic validation |
| `InvoiceStateMachine.test.ts` | State transitions | State machine validation |
| `PeriodCutoff.test.ts` | Period cutoff enforcement | **Control Test** (CONT_07 requirement) |
| `Immutability.test.ts` | Posted invoice immutability | **Control Test** (CONT_07 requirement) |
| `DuplicateDetection.test.ts` | Duplicate invoice blocking | **Control Test** (CONT_07 requirement) |
| `Audit.test.ts` | Audit event coverage | **Control Test** (CONT_07 requirement) |

### Integration Tests (Real Database)

| Test File | Tests | Purpose |
|-----------|-------|---------|
| `invoice-cell.integration.test.ts` | Full workflow end-to-end | Real PostgreSQL, real adapters |

**Test Setup:**
- Uses `apps/db/migrations/finance/107_create_invoices.sql`
- Uses `apps/db/migrations/finance/108_create_invoice_lines.sql`
- Uses real `SqlInvoiceRepository` adapter
- Uses real `SqlAuditRepo` adapter (K_LOG)
- Uses real `SqlGLPostingAdapter` (GL-03)

---

## Cross-Cell Dependencies

### Upstream (AP-02 depends on)

| Cell | Dependency | Purpose |
|------|------------|---------|
| **AP-01** (Vendor Master) | Vendor approved check | FK constraint: `ap.invoices.vendor_id` → `ap.vendors.id` WHERE `status = 'approved'` |
| **Kernel** | K_LOG, K_TIME, K_COA, K_SEQ | Cross-cutting services |

### Downstream (depends on AP-02)

| Cell | Dependency | Purpose |
|------|------------|---------|
| **AP-03** (3-Way Engine) | Invoice submitted check | Reads `ap.invoices` WHERE `status = 'submitted'` |
| **AP-04** (Invoice Approval) | Invoice matched check | Reads `ap.invoices` WHERE `status = 'matched'` |
| **GL-03** (Posting Engine) | Invoice approved check | Receives posting request from `PostingService.postToGL()` |

**Architectural Rule:** Downstream cells **read** from AP-02 via FK constraints or service calls. GL-03 receives blocking call from `PostingService`.

---

## Database Schema Location

**Migrations:** `apps/db/migrations/finance/`
- `107_create_invoices.sql` — Core invoice table
- `108_create_invoice_lines.sql` — Invoice line items table

**Why Separate:** Database is **shared infrastructure**. All finance cells share the same database schema (`finance` schema).

---

## Port Definitions Location

**Ports:** `packages/kernel-core/src/ports/`
- `invoiceRepositoryPort.ts` — InvoiceRepositoryPort interface
- `vendorPort.ts` — VendorPort interface (AP-01 integration)
- `glPostingPort.ts` — GLPostingPort interface (GL-03 integration)
- `fiscalTimePort.ts` — FiscalTimePort interface (K_TIME)
- `coaPort.ts` — COAPort interface (K_COA)

**Why Shared:** Ports are **contracts** that multiple cells can implement. They live in `kernel-core` for reuse.

---

## Adapter Implementations Location

**Adapters:** `packages/kernel-adapters/src/`
- `sql/invoiceRepo.sql.ts` — PostgreSQL implementation
- `sql/vendorRepo.sql.ts` — Vendor adapter (AP-01)
- `sql/glPosting.sql.ts` — GL posting adapter (GL-03)
- `memory/invoiceRepo.memory.ts` — In-memory implementation (testing)

**Why Shared:** Adapters are **reusable infrastructure**. SQL for production, Memory for testing.

---

## API Routes Location

**Routes:** `apps/web/app/api/ap/invoices/`
- All HTTP endpoints live here (Next.js App Router)

**Why Separate:** API routes are **BFF concerns**, not domain logic. They orchestrate services but don't contain business logic.

---

## Architectural Compliance Checklist

### ✅ CONT_07 Requirements Met

| Requirement | Implementation | Location |
|-------------|---------------|----------|
| **Hexagonal Architecture** | Services → Ports → Adapters | ✅ Clear separation |
| **Kernel Integration** | K_LOG, K_TIME, K_COA, K_SEQ | ✅ Port injection |
| **Period Cutoff Enforcement** | K_TIME validation before posting | ✅ `PostingService.validatePeriodOpen()` |
| **Audit Trail** | Transactional audit events | ✅ `AuditPort.emitTransactional()` |
| **State Machine** | InvoiceStateMachine.ts | ✅ Pure domain logic |
| **Immutability** | Database trigger | ✅ Trigger prevents updates |
| **Duplicate Detection** | Unique constraint + service validation | ✅ `uq_invoice_vendor_number_date` constraint |
| **Test Coverage** | Unit + Integration + Control tests | ✅ All test types present |
| **Cell Contract** | 8-point checklist | ✅ All requirements met |

---

## Implementation Order

### Phase 1: Foundation
1. ✅ Create directory structure
2. ✅ Create `errors.ts` (error classes)
3. ✅ Create `InvoiceStateMachine.ts` (state transitions)
4. ✅ Create `index.ts` (exports)

### Phase 2: Domain Services
1. ✅ Create `InvoiceService.ts` (CRUD, validation)
2. ✅ Create `PostingService.ts` (GL posting orchestration)
3. ✅ Create `DuplicateDetectionService.ts` (duplicate detection)

### Phase 3: Infrastructure
1. ✅ Create `InvoiceRepositoryPort` interface (kernel-core)
2. ✅ Create `VendorPort` interface (kernel-core)
3. ✅ Create `GLPostingPort` interface (kernel-core)
4. ✅ Create `FiscalTimePort` interface (kernel-core)
5. ✅ Create `COAPort` interface (kernel-core)
6. ✅ Create `SqlInvoiceRepository` adapter (kernel-adapters)
7. ✅ Create `MemoryInvoiceRepository` adapter (kernel-adapters)
8. ✅ Create database migrations (apps/db)

### Phase 4: API Integration
1. ✅ Create API routes (apps/web/app/api/ap/invoices/)
2. ✅ Wire services to routes
3. ✅ Add request validation (Zod schemas)

### Phase 5: Testing
1. ✅ Write unit tests
2. ✅ Write control tests (Period Cutoff, Immutability, Duplicate Detection, Audit)
3. ✅ Write integration tests
4. ✅ Validate all controls

---

## Key Architectural Decisions

### 1. **Services Don't Import Adapters**
✅ **Correct:** Services receive ports via constructor injection  
❌ **Wrong:** Services import SQL adapters directly

### 2. **Ports Live in kernel-core**
✅ **Correct:** `packages/kernel-core/src/ports/invoiceRepositoryPort.ts`  
❌ **Wrong:** Ports in cell directory

### 3. **Adapters Live in kernel-adapters**
✅ **Correct:** `packages/kernel-adapters/src/sql/invoiceRepo.sql.ts`  
❌ **Wrong:** Adapters in cell directory

### 4. **API Routes Live in apps/web**
✅ **Correct:** `apps/web/app/api/ap/invoices/route.ts`  
❌ **Wrong:** API routes in cell directory

### 5. **Database Migrations Live in apps/db**
✅ **Correct:** `apps/db/migrations/finance/107_create_invoices.sql`  
❌ **Wrong:** Migrations in cell directory

---

## Comparison with AP-05 (Reference)

| Aspect | AP-05 (Reference) | AP-02 (Planned) | Status |
|--------|-------------------|-----------------|--------|
| **Services** | PaymentService, ApprovalService, ExecutionService | InvoiceService, PostingService, DuplicateDetectionService | ✅ Aligned |
| **Domain Primitives** | PaymentStateMachine, Money | InvoiceStateMachine, InvoiceAmount | ✅ Aligned |
| **Errors** | errors.ts | errors.ts | ✅ Aligned |
| **Exports** | index.ts | index.ts | ✅ Aligned |
| **Tests** | Unit + Integration + Control | Unit + Integration + Control | ✅ Aligned |
| **Ports** | kernel-core | kernel-core | ✅ Aligned |
| **Adapters** | kernel-adapters | kernel-adapters | ✅ Aligned |
| **API Routes** | apps/web/app/api/payments/ | apps/web/app/api/ap/invoices/ | ✅ Aligned |
| **Migrations** | apps/db/migrations/finance/ | apps/db/migrations/finance/ | ✅ Aligned |

---

## ⚠️ Implementation Gaps

### To Be Created

The following components need to be implemented to complete the AP-02 Invoice Entry Cell:

#### 1. **BFF Routes** (`apps/web/app/api/ap/invoices/`)

**Status:** ⚠️ **TO BE CREATED**

**Required Routes:**
```
apps/web/app/api/ap/invoices/
├── route.ts                          ⚠️ GET /api/ap/invoices (list), POST (create)
├── [id]/
│   ├── route.ts                      ⚠️ GET /api/ap/invoices/{id}, PUT (update)
│   ├── submit/
│   │   └── route.ts                  ⚠️ POST /api/ap/invoices/{id}/submit
│   └── void/
│       └── route.ts                  ⚠️ POST /api/ap/invoices/{id}/void
```

**Reference Pattern:** `apps/web/app/api/payments/` (AP-05 implementation)

**Requirements:**
- ✅ Use `requireAuth()` middleware (per `security-rules.mdc`)
- ✅ Validate input with Zod schemas
- ✅ Call Cell services (InvoiceService, PostingService, DuplicateDetectionService)
- ✅ Handle errors gracefully
- ✅ Return properly formatted responses

---

#### 2. **Frontend Pages** (`apps/web/app/invoices/`)

**Status:** ⚠️ **TO BE CREATED**

**Required Pages:**
```
apps/web/app/invoices/
├── page.tsx                          ⚠️ Invoice list page
├── [id]/
│   ├── page.tsx                      ⚠️ Invoice detail page
│   ├── edit/
│   │   └── page.tsx                  ⚠️ Invoice edit page
│   └── submit/
│       └── page.tsx                  ⚠️ Invoice submit page
└── layout.tsx                         ⚠️ Invoice layout (optional)
```

**Requirements:**
- ✅ Use BioSkin components (BioForm, BioTable, BioObject)
- ✅ Call BFF routes (`/api/ap/invoices/*`), never backend directly
- ✅ Use Client Components for interactivity
- ✅ Follow Next.js App Router patterns

---

#### 3. **Database Migrations** (`apps/db/migrations/finance/`)

**Status:** ⚠️ **TO BE CREATED**

**Required Migrations:**
- ⚠️ `107_create_invoices.sql` — Core invoice table (`ap.invoices`)
- ⚠️ `108_create_invoice_lines.sql` — Invoice line items table (`ap.invoice_lines`)

**Requirements:**
- ✅ Follow existing migration naming convention (sequential numbers)
- ✅ Include all constraints (vendor FK, duplicate detection, immutability, FK constraints)
- ✅ Include indexes for performance
- ✅ Include triggers for business rules
- ✅ Reference PRD for complete schema definition

**Reference:** See `apps/db/migrations/finance/104_create_payments.sql` (AP-05)

---

#### 4. **Ports** (`packages/kernel-core/src/ports/`)

**Status:** ⚠️ **TO BE CREATED**

**Required Ports:**
- ⚠️ `invoiceRepositoryPort.ts` — InvoiceRepositoryPort interface
- ⚠️ `vendorPort.ts` — VendorPort interface (AP-01 integration)
- ⚠️ `glPostingPort.ts` — GLPostingPort interface (GL-03 integration)
- ⚠️ `fiscalTimePort.ts` — FiscalTimePort interface (K_TIME)
- ⚠️ `coaPort.ts` — COAPort interface (K_COA)

**Requirements:**
- ✅ Define interfaces for data access and external services
- ✅ Include methods: `save()`, `findById()`, `findByTenantId()`, etc.
- ✅ Follow pattern from `paymentRepositoryPort.ts` (AP-05)
- ✅ Export from `packages/kernel-core/src/ports/index.ts`

---

#### 5. **Adapters** (`packages/kernel-adapters/src/`)

**Status:** ⚠️ **TO BE CREATED**

**Required Adapters:**
- ⚠️ `sql/invoiceRepo.sql.ts` — SqlInvoiceRepository (PostgreSQL implementation)
- ⚠️ `sql/vendorRepo.sql.ts` — SqlVendorAdapter (AP-01)
- ⚠️ `sql/glPosting.sql.ts` — SqlGLPostingAdapter (GL-03)
- ⚠️ `memory/invoiceRepo.memory.ts` — MemoryInvoiceRepository (Testing implementation)

**Requirements:**
- ✅ Implement port interfaces
- ✅ SQL adapter uses PostgreSQL client
- ✅ Memory adapter for unit testing
- ✅ Follow pattern from `paymentRepo.sql.ts` and `paymentRepo.memory.ts` (AP-05)
- ✅ Export from `packages/kernel-adapters/src/index.ts`

---

#### 6. **Cell Services** (`apps/canon/finance/dom03-accounts-payable/cells/ap02-invoice-entry/`)

**Status:** ⚠️ **TO BE CREATED**

**Required Services:**
- ⚠️ `InvoiceService.ts` — Invoice CRUD, state transitions
- ⚠️ `PostingService.ts` — GL posting orchestration
- ⚠️ `DuplicateDetectionService.ts` — Duplicate detection logic
- ⚠️ `InvoiceStateMachine.ts` — State transition validation
- ⚠️ `errors.ts` — Cell-specific error classes
- ⚠️ `index.ts` — Public API exports

**Requirements:**
- ✅ Pure business logic (no HTTP, no DB access)
- ✅ Receive ports via constructor injection
- ✅ Follow pattern from AP-05 Payment Execution Cell
- ✅ Include comprehensive error handling

---

#### 7. **Tests** (`apps/canon/finance/dom03-accounts-payable/cells/ap02-invoice-entry/__tests__/`)

**Status:** ⚠️ **TO BE CREATED**

**Required Tests:**
- ⚠️ `InvoiceService.test.ts` — Unit: Invoice CRUD, state transitions
- ⚠️ `PostingService.test.ts` — Unit: GL posting orchestration
- ⚠️ `DuplicateDetectionService.test.ts` — Unit: Duplicate detection
- ⚠️ `InvoiceStateMachine.test.ts` — Unit: State machine transitions
- ⚠️ `PeriodCutoff.test.ts` — Control: Period cutoff enforcement
- ⚠️ `Immutability.test.ts` — Control: Posted invoice immutability
- ⚠️ `DuplicateDetection.test.ts` — Control: Duplicate invoice blocking
- ⚠️ `Audit.test.ts` — Control: Audit event coverage
- ⚠️ `integration/invoice-cell.integration.test.ts` — Integration: Full workflow

**Requirements:**
- ✅ Unit tests for all services
- ✅ Control tests for Period Cutoff, Immutability, Duplicate Detection, Audit
- ✅ Integration tests with real database
- ✅ Follow pattern from AP-05 test suite

---

## Summary

### ✅ **Architectural Requirements Fulfilled**

1. **Hexagonal Architecture** — Clear separation: Services → Ports → Adapters
2. **Kernel Integration** — All required Kernel services integrated (K_LOG, K_TIME, K_COA, K_SEQ)
3. **Cell Boundaries** — No direct dependencies on other cells (only Kernel and AP-01 via port)
4. **Testability** — Unit, integration, and control tests organized
5. **Reusability** — Ports and adapters shared across cells
6. **Maintainability** — Clear directory structure, single responsibility per file

### 📋 **Implementation Checklist**

#### Phase 1: Infrastructure Setup
- [ ] Create `InvoiceRepositoryPort` interface (`packages/kernel-core/src/ports/`)
- [ ] Create `VendorPort` interface (`packages/kernel-core/src/ports/`)
- [ ] Create `GLPostingPort` interface (`packages/kernel-core/src/ports/`)
- [ ] Create `FiscalTimePort` interface (`packages/kernel-core/src/ports/`)
- [ ] Create `COAPort` interface (`packages/kernel-core/src/ports/`)
- [ ] Create `SqlInvoiceRepository` adapter (`packages/kernel-adapters/src/sql/`)
- [ ] Create `MemoryInvoiceRepository` adapter (`packages/kernel-adapters/src/memory/`)
- [ ] Create database migrations (`apps/db/migrations/finance/107_*.sql`, `108_*.sql`)

#### Phase 2: Cell Implementation
- [ ] Create `errors.ts` (error classes)
- [ ] Create `InvoiceStateMachine.ts` (state transitions)
- [ ] Create `InvoiceService.ts` (CRUD, validation)
- [ ] Create `PostingService.ts` (GL posting orchestration)
- [ ] Create `DuplicateDetectionService.ts` (duplicate detection)
- [ ] Create `index.ts` (exports)

#### Phase 3: BFF Integration
- [ ] Create BFF routes (`apps/web/app/api/ap/invoices/`)
- [ ] Wire services to routes
- [ ] Add request validation (Zod schemas)
- [ ] Add error handling

#### Phase 4: Frontend Integration
- [ ] Create frontend pages (`apps/web/app/invoices/`)
- [ ] Use BioSkin components (BioForm, BioTable, BioObject)
- [ ] Connect to BFF routes

#### Phase 5: Testing
- [ ] Write unit tests
- [ ] Write control tests (Period Cutoff, Immutability, Duplicate Detection, Audit)
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
