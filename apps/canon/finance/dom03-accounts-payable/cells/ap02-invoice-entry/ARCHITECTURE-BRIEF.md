# AP-02 Invoice Entry — Architecture Brief

> **Quick Reference:** Directory structure and architectural compliance  
> **Full Details:** See `IMPLEMENTATION-DIRECTORY-STRUCTURE.md`

---

## 🎯 PRD-AP02 Summary

**Purpose:** Recognize liabilities per accrual basis (incurred, not paid). Capture invoices, enforce duplicate detection, and produce a deterministic posting path into GL-03.

**Key Controls:**
- ✅ Duplicate Detection: Vendor + invoice number + amount/date tolerance
- ✅ Period Cutoff: Blocking validation via K_TIME
- ✅ Immutable Ledger: No update/delete after posted
- ✅ Deterministic Posting: Invoice → Journal lines (predictable, reproducible)
- ✅ 100% audit event coverage

**State Machine:** `draft → submitted → matched? → approved → posted → paid/closed`

---

## 📁 Directory Structure (Hexagonal Architecture)

```
ap02-invoice-entry/
│
├── Domain Services (Business Logic)
│   ├── InvoiceService.ts              # CRUD, state transitions
│   ├── PostingService.ts              # GL posting orchestration
│   └── DuplicateDetectionService.ts  # Duplicate detection
│
├── Domain Primitives
│   └── InvoiceStateMachine.ts         # State transitions
│
├── Errors
│   └── errors.ts                     # Cell-specific errors
│
├── Exports
│   └── index.ts                      # Public API
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
| **K_SEQ** | `SequencePort` | InvoiceService | Invoice number generation |

### Cross-Cell Dependencies

| Cell | Port | Purpose |
|------|------|---------|
| **AP-01** | `VendorPort` | Validate vendor approved |
| **GL-03** | `GLPostingPort` | Post journal entries (blocking) |

### Infrastructure (Shared)

| Component | Location | Purpose |
|-----------|----------|---------|
| **Ports** | `packages/kernel-core/src/ports/` | Interfaces (InvoiceRepositoryPort, VendorPort, GLPostingPort, FiscalTimePort, COAPort) |
| **Adapters** | `packages/kernel-adapters/src/` | Implementations (SQL, Memory) |
| **Migrations** | `apps/db/migrations/finance/` | Database schema (107, 108) |
| **API Routes** | `apps/web/app/api/ap/invoices/` | HTTP endpoints |

---

## ✅ CONT_07 Compliance

| Requirement | Status | Evidence |
|-------------|--------|----------|
| **Hexagonal Architecture** | ✅ | Services → Ports → Adapters |
| **Kernel Integration** | ✅ | K_LOG, K_TIME, K_COA, K_SEQ |
| **Period Cutoff Enforcement** | ✅ | K_TIME validation before posting |
| **Audit Trail** | ✅ | Transactional audit events |
| **Cell Boundaries** | ✅ | No direct cell dependencies (only ports) |
| **Test Coverage** | ✅ | Unit + Integration + Control tests |

---

## 📊 Comparison with AP-05

| Aspect | AP-05 | AP-02 | Alignment |
|--------|-------|-------|-----------|
| **Services** | 5 services | 3 services | ✅ Pattern match |
| **Ports** | kernel-core | kernel-core | ✅ Shared |
| **Adapters** | kernel-adapters | kernel-adapters | ✅ Shared |
| **Tests** | Unit + Integration | Unit + Integration | ✅ Pattern match |
| **Structure** | Hexagonal | Hexagonal | ✅ Identical |

---

## 🚀 Implementation Phases

1. **Foundation** → Errors, StateMachine, index.ts
2. **Domain Services** → InvoiceService, PostingService, DuplicateDetectionService
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
- ✅ Kernel integration (K_LOG, K_TIME, K_COA, K_SEQ)
- ✅ Canon structure (apps/canon/finance/)
- ✅ Molecule organization (dom03-accounts-payable)
- ✅ Cell boundaries (pure business logic)
- ✅ Frontend structure (apps/web/app/invoices/)
- ✅ DB structure (apps/db/migrations/finance/)
- ✅ BFF structure (apps/web/app/api/ap/invoices/)
- ✅ Backend structure (Cell services)
