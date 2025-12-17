# AP-03 3-Way Engine — Architecture Brief

> **Quick Reference:** Directory structure and architectural compliance  
> **Full Details:** See `IMPLEMENTATION-DIRECTORY-STRUCTURE.md`

---

## 🎯 PRD-AP03 Summary

**Purpose:** Prevent paying for undelivered/unauthorized items using validity assertions (PO/GRN matching). Supports 1-Way, 2-Way, and 3-Way match modes, configurable via K_POLICY.

**Key Controls:**
- ✅ Policy-Driven Configuration: Match mode from K_POLICY (governed, not hardcoded)
- ✅ SoD Override: Override requires separate approval (database constraint)
- ✅ Immutable Match Results: No update/delete after invoice posted
- ✅ Exception Queue: Failed matches route to exception workflow
- ✅ 100% audit event coverage

**Match Modes:** `1-way` (invoice-only), `2-way` (PO ↔ Invoice), `3-way` (PO ↔ GRN ↔ Invoice)

---

## 📁 Directory Structure (Hexagonal Architecture)

```
ap03-3way-engine/
│
├── Domain Services (Business Logic)
│   ├── MatchService.ts              # Match evaluation logic
│   ├── ToleranceService.ts          # Tolerance rule evaluation
│   └── ExceptionService.ts          # Exception queue management
│
├── Domain Primitives
│   └── MatchResult.ts                # Match result value object
│
├── Errors
│   └── errors.ts                    # Cell-specific errors
│
├── Exports
│   └── index.ts                      # Public API
│
└── Tests
    └── __tests__/
        ├── Unit tests (7 files)
        └── integration/
            └── match-cell.integration.test.ts
```

---

## 🔌 Integration Points

### Kernel Services (Required)

| Service | Port | Used By | Purpose |
|---------|------|---------|---------|
| **K_LOG** | `AuditPort` | All services | Transactional audit events |
| **K_POLICY** | `PolicyPort` | MatchService, ToleranceService | Match mode, tolerance rules |

### Cross-Cell Dependencies

| Cell | Port | Purpose |
|------|------|---------|
| **AP-02** | Invoice data | Read submitted invoices |

### External Dependencies

| Component | Port | Purpose |
|-----------|------|---------|
| **PO System** | `PurchaseOrderPort` | Fetch PO data (external/internal) |
| **GRN System** | `GoodsReceiptPort` | Fetch GRN data (external/internal) |

### Infrastructure (Shared)

| Component | Location | Purpose |
|-----------|----------|---------|
| **Ports** | `packages/kernel-core/src/ports/` | Interfaces (MatchRepositoryPort, PurchaseOrderPort, GoodsReceiptPort) |
| **Adapters** | `packages/kernel-adapters/src/` | Implementations (SQL, Memory, External) |
| **Migrations** | `apps/db/migrations/finance/` | Database schema (109, 110) |
| **API Routes** | `apps/web/app/api/ap/match/` | HTTP endpoints |

---

## ✅ CONT_07 Compliance

| Requirement | Status | Evidence |
|-------------|--------|----------|
| **Hexagonal Architecture** | ✅ | Services → Ports → Adapters |
| **Kernel Integration** | ✅ | K_LOG, K_POLICY |
| **SoD Enforcement** | ✅ | Override requires separate approval |
| **Audit Trail** | ✅ | Transactional audit events |
| **Cell Boundaries** | ✅ | No direct cell dependencies (only ports) |
| **Policy-Driven Configuration** | ✅ | Match mode from K_POLICY |
| **Test Coverage** | ✅ | Unit + Integration + Control tests |

---

## 📊 Comparison with AP-05

| Aspect | AP-05 | AP-03 | Alignment |
|--------|-------|-------|-----------|
| **Services** | 5 services | 3 services | ✅ Pattern match |
| **Ports** | kernel-core | kernel-core | ✅ Shared |
| **Adapters** | kernel-adapters | kernel-adapters | ✅ Shared |
| **Tests** | Unit + Integration | Unit + Integration | ✅ Pattern match |
| **Structure** | Hexagonal | Hexagonal | ✅ Identical |

---

## 🚀 Implementation Phases

1. **Foundation** → Errors, MatchResult, index.ts
2. **Domain Services** → MatchService, ToleranceService, ExceptionService
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
- ✅ Kernel integration (K_LOG, K_POLICY)
- ✅ Canon structure (apps/canon/finance/)
- ✅ Molecule organization (dom03-accounts-payable)
- ✅ Cell boundaries (pure business logic)
- ✅ Frontend structure (apps/web/app/match/)
- ✅ DB structure (apps/db/migrations/finance/)
- ✅ BFF structure (apps/web/app/api/ap/match/)
- ✅ Backend structure (Cell services)
