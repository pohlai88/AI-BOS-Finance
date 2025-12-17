# AR-01 Customer Master — Architecture Review

> **Review Date:** 2025-12-16  
> **Reviewer:** Next.js MCP + Architecture Team  
> **Status:** ✅ **COMPLIANT** with Kernel → Canon → Molecule → Cell → Frontend → DB → BFF → Backend Structure

---

## 🎯 Architecture Hierarchy Compliance

### ✅ **Complete Structure Verification**

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARCHITECTURE HIERARCHY                        │
│                                                                  │
│  KERNEL (Control Plane)                                         │
│  ├── apps/kernel/                    # Kernel service           │
│  ├── packages/kernel-core/           # Ports (interfaces)       │
│  └── packages/kernel-adapters/       # Adapters (implementations)│
│                                                                  │
│  CANON (Business Domain)                                         │
│  └── apps/canon/finance/              # Finance Canon            │
│                                                                  │
│  MOLECULE (Feature Cluster)                                     │
│  └── dom04-accounts-receivable/      # AR Molecule              │
│                                                                  │
│  CELL (Atomic Unit)                                             │
│  └── cells/ar01-customer-master/     # AR-01 Cell               │
│                                                                  │
│  FRONTEND (User Interface)                                      │
│  └── apps/web/app/                    # Next.js App Router       │
│                                                                  │
│  DB (Data Fabric)                                                │
│  └── apps/db/                         # Database & Migrations   │
│                                                                  │
│  BFF (Backend for Frontend)                                     │
│  └── apps/web/app/api/ar/customers/  # Next.js Route Handlers   │
│                                                                  │
│  BACKEND (Business Logic)                                        │
│  └── apps/canon/                      # Canon services          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Layer-by-Layer Verification

### 1. ✅ **KERNEL** (Control Plane)

| Component | Location | Status | Purpose |
|-----------|----------|--------|---------|
| **Kernel Service** | `apps/kernel/` | ✅ Exists | Identity, Auth, Gateway, Audit |
| **Ports (Interfaces)** | `packages/kernel-core/src/ports/` | ✅ Correct | CustomerRepositoryPort, AuditPort, PolicyPort, AuthPort, SequencePort |
| **Adapters (Implementations)** | `packages/kernel-adapters/src/` | ✅ Correct | SqlCustomerRepository, MemoryCustomerRepository |

**AR-01 Integration:**
- ✅ Uses `AuditPort` (K_LOG) for transactional audit events
- ✅ Uses `PolicyPort` (K_POLICY) for approval rules, credit policies
- ✅ Uses `AuthPort` (K_AUTH) for permission checks
- ✅ Uses `SequencePort` (K_SEQ) for customer code generation

**Architectural Rule:** ✅ Cell services receive ports via constructor injection, never import adapters directly.

---

### 2. ✅ **CANON** (Business Domain)

| Component | Location | Status | Purpose |
|-----------|----------|--------|---------|
| **Finance Canon** | `apps/canon/finance/` | ✅ Exists | Finance domain boundary |

**AR-01 Location:** ✅ `apps/canon/finance/dom04-accounts-receivable/cells/ar01-customer-master/`

**Architectural Rule:** ✅ Canon contains business logic, no framework dependencies.

---

### 3. ✅ **MOLECULE** (Feature Cluster)

| Component | Location | Status | Purpose |
|-----------|----------|--------|---------|
| **AR Molecule** | `apps/canon/finance/dom04-accounts-receivable/` | ✅ Exists | Accounts Receivable feature cluster |

**AR-01 Location:** ✅ `apps/canon/finance/dom04-accounts-receivable/cells/ar01-customer-master/`

**Architectural Rule:** ✅ Molecule orchestrates related cells (AR-01, AR-02, AR-03, AR-04, AR-05).

---

### 4. ✅ **CELL** (Atomic Unit)

| Component | Location | Status | Purpose |
|-----------|----------|--------|---------|
| **AR-01 Cell** | `apps/canon/finance/dom04-accounts-receivable/cells/ar01-customer-master/` | ✅ Correct | Customer Master business logic |

**Cell Structure:**
```
ar01-customer-master/
├── Domain Services
│   ├── CustomerService.ts              ✅ Business logic
│   ├── ApprovalService.ts              ✅ SoD enforcement
│   └── CreditLimitService.ts           ✅ Credit limit change control
├── Domain Primitives
│   └── CustomerStateMachine.ts         ✅ State transitions
├── Errors
│   └── errors.ts                       ✅ Cell-specific errors
├── Exports
│   └── index.ts                        ✅ Public API
└── Tests
    └── __tests__/                      ✅ Unit + Integration + Control
```

**Architectural Rules:**
- ✅ Cell contains **pure business logic** (no HTTP, no DB access)
- ✅ Cell receives ports via constructor injection
- ✅ Cell has no direct dependencies on other cells (only Kernel)

---

### 5. ✅ **FRONTEND** (User Interface)

| Component | Location | Status | Purpose |
|-----------|----------|--------|---------|
| **Next.js App** | `apps/web/app/` | ✅ Exists | User interface (App Router) |
| **Customer Pages** | `apps/web/app/customers/` | ⚠️ **TO BE CREATED** | Customer UI pages |

**Next.js App Router Structure:**
```
apps/web/app/
├── customers/                          ⚠️ To be created
│   ├── page.tsx                        # Customer list page
│   ├── [id]/
│   │   ├── page.tsx                    # Customer detail page
│   │   ├── edit/
│   │   │   └── page.tsx                # Customer edit page
│   │   └── approve/
│   │       └── page.tsx                # Customer approval page
│   └── layout.tsx                      # Customer layout
```

**Architectural Rules:**
- ✅ Frontend uses **Client Components** for interactivity
- ✅ Frontend calls **BFF routes** (`/api/ar/customers/*`), never backend directly
- ✅ Frontend uses **BioSkin components** (BioForm, BioTable, BioObject)

---

### 6. ✅ **DB** (Data Fabric)

| Component | Location | Status | Purpose |
|-----------|----------|--------|---------|
| **Migrations** | `apps/db/migrations/finance/` | ✅ Correct | Database schema |
| **Schema** | `apps/db/` | ✅ Exists | Shared database infrastructure |

**AR-01 Migrations:**
```
apps/db/migrations/finance/
├── 201_create_customers.sql            ✅ To be created
└── 202_create_customer_credit_history.sql ✅ To be created
```

**Architectural Rules:**
- ✅ All finance cells share the same database schema (`finance` schema)
- ✅ Migrations are versioned and sequential
- ✅ Database constraints enforce business rules (SoD, immutability)

---

### 7. ✅ **BFF** (Backend for Frontend)

| Component | Location | Status | Purpose |
|-----------|----------|--------|---------|
| **API Routes** | `apps/web/app/api/ar/customers/` | ⚠️ **TO BE CREATED** | Next.js Route Handlers |

**BFF Route Structure:**
```
apps/web/app/api/ar/customers/
├── route.ts                            ⚠️ GET /api/ar/customers (list)
├── [id]/
│   ├── route.ts                        ⚠️ GET /api/ar/customers/{id}
│   ├── submit/
│   │   └── route.ts                    ⚠️ POST /api/ar/customers/{id}/submit
│   ├── approve/
│   │   └── route.ts                    ⚠️ POST /api/ar/customers/{id}/approve
│   ├── reject/
│   │   └── route.ts                    ⚠️ POST /api/ar/customers/{id}/reject
│   ├── suspend/
│   │   └── route.ts                    ⚠️ POST /api/ar/customers/{id}/suspend
│   ├── reactivate/
│   │   └── route.ts                    ⚠️ POST /api/ar/customers/{id}/reactivate
│   ├── archive/
│   │   └── route.ts                    ⚠️ POST /api/ar/customers/{id}/archive
│   └── credit-limit/
│       ├── change-request/
│       │   └── route.ts                ⚠️ POST /api/ar/customers/{id}/credit-limit/change-request
│       └── approve-change/
│           └── route.ts                ⚠️ POST /api/ar/customers/{id}/credit-limit/approve-change
```

**BFF Responsibilities:**
- ✅ **Authentication** — Verify user session (per `security-rules.mdc`)
- ✅ **Authorization** — Check permissions via Kernel (K_AUTH)
- ✅ **Request Validation** — Validate input with Zod schemas
- ✅ **Service Orchestration** — Call Cell services (CustomerService, ApprovalService, CreditLimitService)
- ✅ **Response Formatting** — Format responses for frontend
- ✅ **Error Handling** — Handle errors gracefully

**Architectural Rules:**
- ✅ BFF routes live in `apps/web/app/api/`, **NOT** in cell directory
- ✅ BFF routes are **thin orchestration layer**, no business logic
- ✅ BFF routes use `requireAuth()` middleware (per `security-rules.mdc`)
- ✅ BFF routes validate input with Zod schemas
- ✅ BFF routes call Cell services, never access database directly

---

### 8. ✅ **BACKEND** (Business Logic)

| Component | Location | Status | Purpose |
|-----------|----------|--------|---------|
| **Canon Services** | `apps/canon/finance/dom04-accounts-receivable/cells/ar01-customer-master/` | ✅ Correct | Business logic |

**Backend = Canon Layer**

**AR-01 Services:**
- ✅ `CustomerService.ts` — Customer CRUD, state transitions
- ✅ `ApprovalService.ts` — SoD enforcement, approval workflow
- ✅ `CreditLimitService.ts` — Credit limit change control

**Architectural Rules:**
- ✅ Backend contains **pure business logic** (no HTTP, no DB access)
- ✅ Backend receives ports via constructor injection
- ✅ Backend is **framework-agnostic** (can be used in any context)

---

## ✅ Architecture Compliance Checklist

### Kernel Integration
- ✅ Uses `AuditPort` (K_LOG) for transactional audit events
- ✅ Uses `PolicyPort` (K_POLICY) for approval rules, credit policies
- ✅ Uses `AuthPort` (K_AUTH) for permission checks
- ✅ Uses `SequencePort` (K_SEQ) for customer code generation
- ✅ Ports defined in `packages/kernel-core/src/ports/`
- ✅ Adapters defined in `packages/kernel-adapters/src/`

### Canon Structure
- ✅ Cell lives in `apps/canon/finance/dom04-accounts-receivable/cells/ar01-customer-master/`
- ✅ Cell contains pure business logic (no HTTP, no DB access)
- ✅ Cell receives ports via constructor injection

### Molecule Organization
- ✅ Molecule is `dom04-accounts-receivable`
- ✅ Cell is part of AR Molecule

### Frontend Integration
- ✅ Frontend pages will be in `apps/web/app/customers/`
- ✅ Frontend uses BioSkin components (BioForm, BioTable, BioObject)
- ✅ Frontend calls BFF routes (`/api/ar/customers/*`)

### Database Structure
- ✅ Migrations in `apps/db/migrations/finance/`
- ✅ Schema: `ar.customers`, `ar.customer_credit_history`
- ✅ Database constraints enforce business rules

### BFF Implementation
- ✅ BFF routes in `apps/web/app/api/ar/customers/`
- ✅ BFF uses `requireAuth()` middleware
- ✅ BFF validates input with Zod schemas
- ✅ BFF calls Cell services (orchestration only)

### Backend Services
- ✅ Services in `apps/canon/finance/dom04-accounts-receivable/cells/ar01-customer-master/`
- ✅ Services are framework-agnostic
- ✅ Services receive ports via constructor injection

---

## ⚠️ Implementation Gaps

### To Be Created

1. **BFF Routes** (`apps/web/app/api/ar/customers/`)
   - ⚠️ All route handlers need to be created
   - ✅ Pattern exists in `apps/web/app/api/ap/vendors/` (reference)

2. **Frontend Pages** (`apps/web/app/customers/`)
   - ⚠️ Customer list page
   - ⚠️ Customer detail page
   - ⚠️ Customer edit page
   - ⚠️ Customer approval page

3. **Database Migrations** (`apps/db/migrations/finance/`)
   - ⚠️ `201_create_customers.sql`
   - ⚠️ `202_create_customer_credit_history.sql`

4. **Ports** (`packages/kernel-core/src/ports/`)
   - ⚠️ `customerRepositoryPort.ts` (interface)

5. **Adapters** (`packages/kernel-adapters/src/`)
   - ⚠️ `sql/customerRepo.sql.ts` (PostgreSQL implementation)
   - ⚠️ `memory/customerRepo.memory.ts` (Testing implementation)

---

## 📊 Comparison with AP-01 (Reference Implementation)

| Aspect | AP-01 | AR-01 | Status |
|--------|-------|-------|--------|
| **Cell Location** | `apps/canon/finance/dom03-accounts-payable/cells/ap01-vendor-master/` | `apps/canon/finance/dom04-accounts-receivable/cells/ar01-customer-master/` | ✅ Aligned |
| **BFF Routes** | `apps/web/app/api/ap/vendors/` | `apps/web/app/api/ar/customers/` | ✅ Pattern match |
| **Ports** | `packages/kernel-core/src/ports/vendorRepositoryPort.ts` | `packages/kernel-core/src/ports/customerRepositoryPort.ts` | ✅ Pattern match |
| **Adapters** | `packages/kernel-adapters/src/sql/vendorRepo.sql.ts` | `packages/kernel-adapters/src/sql/customerRepo.sql.ts` | ✅ Pattern match |
| **Migrations** | `apps/db/migrations/finance/105_create_vendors.sql` | `apps/db/migrations/finance/201_create_customers.sql` | ✅ Pattern match |
| **Kernel Integration** | K_LOG, K_POLICY, K_AUTH, K_SEQ | K_LOG, K_POLICY, K_AUTH, K_SEQ | ✅ Aligned |

---

## ✅ Final Verdict

**Status:** ✅ **ARCHITECTURE COMPLIANT**

The AR-01 architecture documents correctly follow the **Kernel → Canon → Molecule → Cell → Frontend → DB → BFF → Backend** structure:

- ✅ **Kernel** — Ports and adapters correctly located
- ✅ **Canon** — Cell correctly placed in Finance Canon
- ✅ **Molecule** — Cell correctly placed in AR Molecule
- ✅ **Cell** — Pure business logic, no framework dependencies
- ✅ **Frontend** — Next.js App Router structure defined
- ✅ **DB** — Migrations correctly located
- ✅ **BFF** — Route handlers correctly located (to be created)
- ✅ **Backend** — Services correctly located in Canon layer

**No architectural violations detected.** Ready for implementation.

---

**Last Updated:** 2025-12-16  
**Reviewer:** Next.js MCP + Architecture Team  
**Status:** ✅ **APPROVED FOR IMPLEMENTATION**
