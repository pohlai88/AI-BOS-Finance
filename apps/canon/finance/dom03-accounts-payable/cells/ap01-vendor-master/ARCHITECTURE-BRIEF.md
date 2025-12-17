# AP-01 Vendor Master — Architecture Brief

> **Quick Reference:** Directory structure and architectural compliance  
> **Full Details:** See `IMPLEMENTATION-DIRECTORY-STRUCTURE.md`

---

## 🎯 PRD-AP01 Summary

**Purpose:** Approved-vendor registry to prevent phantom vendors and protect cash outflows.

**Key Controls:**
- ✅ SoD: Maker ≠ Checker (database constraint)
- ✅ Bank account changes require separate approval
- ✅ 100% audit event coverage
- ✅ Immutable approved vendors

**State Machine:** `draft → submitted → approved → suspended → archived`

---

## 📁 Directory Structure (Hexagonal Architecture)

```
ap01-vendor-master/
│
├── Domain Services (Business Logic)
│   ├── VendorService.ts              # CRUD, state transitions
│   ├── ApprovalService.ts            # SoD, approval workflow
│   └── BankAccountService.ts         # Bank change control
│
├── Domain Primitives
│   └── VendorStateMachine.ts         # State transitions
│
├── Errors
│   └── errors.ts                     # Cell-specific errors
│
├── Exports
│   └── index.ts                      # Public API
│
└── Tests
    └── __tests__/
        ├── Unit tests (7 files)
        └── integration/
            └── vendor-cell.integration.test.ts
```

---

## 🔌 Integration Points

### Kernel Services (Required)

| Service | Port | Used By | Purpose |
|---------|------|---------|---------|
| **K_LOG** | `AuditPort` | All services | Transactional audit events |
| **K_POLICY** | `PolicyPort` | ApprovalService, BankAccountService | Approval rules, risk policies |
| **K_AUTH** | `AuthPort` | ApprovalService | Permission checks, SoD validation |
| **K_SEQ** | `SequencePort` | VendorService | Vendor code generation |

### Infrastructure (Shared)

| Component | Location | Purpose |
|-----------|----------|---------|
| **Ports** | `packages/kernel-core/src/ports/` | Interfaces (VendorRepositoryPort) |
| **Adapters** | `packages/kernel-adapters/src/` | Implementations (SQL, Memory) |
| **Migrations** | `apps/db/migrations/finance/` | Database schema (105, 106) |
| **API Routes** | `apps/web/app/api/ap/vendors/` | HTTP endpoints |

---

## ✅ CONT_07 Compliance

| Requirement | Status | Evidence |
|-------------|--------|----------|
| **Hexagonal Architecture** | ✅ | Services → Ports → Adapters |
| **Kernel Integration** | ✅ | K_LOG, K_POLICY, K_AUTH, K_SEQ |
| **SoD Enforcement** | ✅ | DB constraint + service validation |
| **Audit Trail** | ✅ | Transactional audit events |
| **Cell Boundaries** | ✅ | No direct cell dependencies |
| **Test Coverage** | ✅ | Unit + Integration + Control tests |

---

## 📊 Comparison with AP-05

| Aspect | AP-05 | AP-01 | Alignment |
|--------|-------|-------|-----------|
| **Services** | 5 services | 3 services | ✅ Pattern match |
| **Ports** | kernel-core | kernel-core | ✅ Shared |
| **Adapters** | kernel-adapters | kernel-adapters | ✅ Shared |
| **Tests** | Unit + Integration | Unit + Integration | ✅ Pattern match |
| **Structure** | Hexagonal | Hexagonal | ✅ Identical |

---

## 🚀 Implementation Phases

1. **Foundation** → Errors, StateMachine, index.ts
2. **Domain Services** → VendorService, ApprovalService, BankAccountService
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
- ✅ Kernel integration (K_LOG, K_POLICY, K_AUTH, K_SEQ)
- ✅ Canon structure (apps/canon/finance/)
- ✅ Molecule organization (dom03-accounts-payable)
- ✅ Cell boundaries (pure business logic)
- ✅ Frontend structure (apps/web/app/vendors/)
- ✅ DB structure (apps/db/migrations/finance/)
- ✅ BFF structure (apps/web/app/api/ap/vendors/)
- ✅ Backend structure (Cell services)
