# AR-02 Sales Invoice — Architecture Brief

> **Quick Reference:** Directory structure and architectural compliance  
> **Full Details:** See `IMPLEMENTATION-DIRECTORY-STRUCTURE.md`

---

## 🎯 PRD-AR02 Summary

**Purpose:** Sales invoice processing with IFRS 15 / ASC 606 revenue recognition compliance.

**Key Controls:**
- ✅ SoD: Maker ≠ Checker (database constraint)
- ✅ Period cutoff enforcement (K_TIME)
- ✅ IFRS 15 revenue recognition compliance
- ✅ 100% audit event coverage
- ✅ Immutable posted invoices

**State Machine:** `draft → submitted → approved → posted → paid → closed`

---

## 📁 Directory Structure (Hexagonal Architecture)

```
ar02-sales-invoice/
│
├── Domain Services (Business Logic)
│   ├── InvoiceService.ts              # CRUD, state transitions
│   ├── RevenueRecognitionService.ts   # IFRS 15 compliance
│   ├── PostingService.ts               # GL posting orchestration
│   └── DuplicateDetectionService.ts    # Duplicate detection
│
├── Domain Primitives
│   └── InvoiceStateMachine.ts         # State transitions
│
├── Errors
│   └── errors.ts                       # Cell-specific errors
│
├── Exports
│   └── index.ts                        # Public API
│
└── Tests
    └── __tests__/
        ├── Unit tests (8 files)
        └── integration/
            └── invoice-cell.integration.test.ts
```

---

## 🔌 Integration Points

### Kernel Services (Required)

| Service | Port | Used By | Purpose |
|---------|------|---------|---------|
| **K_LOG** | `AuditPort` | All services | Transactional audit events |
| **K_TIME** | `FiscalTimePort` | PostingService | Period cutoff validation |
| **K_COA** | `COAPort` | PostingService | Chart of Accounts validation |
| **K_AUTH** | `AuthPort` | InvoiceService | Permission checks, SoD validation |
| **K_SEQ** | `SequencePort` | InvoiceService | Invoice number generation |

### Infrastructure (Shared)

| Component | Location | Purpose |
|-----------|----------|---------|
| **Ports** | `packages/kernel-core/src/ports/` | Interfaces (InvoiceRepositoryPort, CustomerPort, GLPostingPort) |
| **Adapters** | `packages/kernel-adapters/src/` | Implementations (SQL, Memory) |
| **Migrations** | `apps/db/migrations/finance/` | Database schema (210, 211) |
| **API Routes** | `apps/web/app/api/ar/invoices/` | HTTP endpoints |

---

## ✅ CONT_07 Compliance

| Requirement | Status | Evidence |
|-------------|--------|----------|
| **Hexagonal Architecture** | ✅ | Services → Ports → Adapters |
| **Kernel Integration** | ✅ | K_LOG, K_TIME, K_COA, K_AUTH, K_SEQ |
| **SoD Enforcement** | ✅ | Service validation |
| **Audit Trail** | ✅ | Transactional audit events |
| **Cell Boundaries** | ✅ | No direct cell dependencies |
| **Test Coverage** | ✅ | Unit + Integration + Control tests |
| **IFRS 15 Compliance** | ✅ | Revenue recognition service |

---

## 📊 Comparison with AP-02

| Aspect | AP-02 | AR-02 | Alignment |
|--------|-------|-------|-----------|
| **Services** | 3 services | 4 services | ✅ Pattern match (+ Revenue Recognition) |
| **Ports** | kernel-core | kernel-core | ✅ Shared |
| **Adapters** | kernel-adapters | kernel-adapters | ✅ Shared |
| **Tests** | Unit + Integration | Unit + Integration | ✅ Pattern match |
| **Structure** | Hexagonal | Hexagonal | ✅ Identical |
| **State Machine** | draft → posted | draft → posted | ✅ Identical pattern |
| **GL Posting** | GL-03 integration | GL-03 integration | ✅ Shared |

---

## 🚀 Implementation Phases

1. **Foundation** → Errors, StateMachine, index.ts
2. **Domain Services** → InvoiceService, RevenueRecognitionService, PostingService, DuplicateDetectionService
3. **Infrastructure** → Ports, Adapters, Migrations
4. **API Integration** → Routes, validation
5. **Testing** → Unit → Integration → Control tests

---

**Status:** ✅ Architecture Compliant  
**Ready for:** Implementation

---

## 📋 Architecture Review

**Full Review:** See `ARCHITECTURE-REVIEW.md` for complete architecture compliance verification.

**Compliance Status:** ✅ **APPROVED** — Follows Kernel → Canon → Molecule → Cell → Frontend → DB → BFF → Backend structure

**Key Verification:**
- ✅ Kernel integration (K_LOG, K_TIME, K_COA, K_AUTH, K_SEQ)
- ✅ Canon structure (apps/canon/finance/)
- ✅ Molecule organization (dom04-accounts-receivable)
- ✅ Cell boundaries (pure business logic)
- ✅ Frontend structure (apps/web/app/invoices/)
- ✅ DB structure (apps/db/migrations/finance/)
- ✅ BFF structure (apps/web/app/api/ar/invoices/)
- ✅ Backend structure (Cell services)
