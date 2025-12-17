# AR-01 Customer Master — Architecture Brief

> **Quick Reference:** Directory structure and architectural compliance  
> **Full Details:** See `IMPLEMENTATION-DIRECTORY-STRUCTURE.md`

---

## 🎯 PRD-AR01 Summary

**Purpose:** Approved-customer registry to prevent phantom customers and protect revenue recognition.

**Key Controls:**
- ✅ SoD: Maker ≠ Checker (database constraint)
- ✅ Credit limit changes require separate approval
- ✅ 100% audit event coverage
- ✅ Immutable approved customers

**State Machine:** `draft → submitted → approved → suspended → archived`

---

## 📁 Directory Structure (Hexagonal Architecture)

```
ar01-customer-master/
│
├── Domain Services (Business Logic)
│   ├── CustomerService.ts              # CRUD, state transitions
│   ├── ApprovalService.ts              # SoD, approval workflow
│   └── CreditLimitService.ts           # Credit limit change control
│
├── Domain Primitives
│   └── CustomerStateMachine.ts         # State transitions
│
├── Errors
│   └── errors.ts                       # Cell-specific errors
│
├── Exports
│   └── index.ts                        # Public API
│
└── Tests
    └── __tests__/
        ├── Unit tests (7 files)
        └── integration/
            └── customer-cell.integration.test.ts
```

---

## 🔌 Integration Points

### Kernel Services (Required)

| Service | Port | Used By | Purpose |
|---------|------|---------|---------|
| **K_LOG** | `AuditPort` | All services | Transactional audit events |
| **K_POLICY** | `PolicyPort` | ApprovalService, CreditLimitService | Approval rules, credit policies |
| **K_AUTH** | `AuthPort` | ApprovalService | Permission checks, SoD validation |
| **K_SEQ** | `SequencePort` | CustomerService | Customer code generation |

### Infrastructure (Shared)

| Component | Location | Purpose |
|-----------|----------|---------|
| **Ports** | `packages/kernel-core/src/ports/` | Interfaces (CustomerRepositoryPort) |
| **Adapters** | `packages/kernel-adapters/src/` | Implementations (SQL, Memory) |
| **Migrations** | `apps/db/migrations/finance/` | Database schema (201, 202) |
| **API Routes** | `apps/web/app/api/ar/customers/` | HTTP endpoints |

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

## 📊 Comparison with AP-01

| Aspect | AP-01 | AR-01 | Alignment |
|--------|-------|-------|-----------|
| **Services** | 3 services | 3 services | ✅ Pattern match |
| **Ports** | kernel-core | kernel-core | ✅ Shared |
| **Adapters** | kernel-adapters | kernel-adapters | ✅ Shared |
| **Tests** | Unit + Integration | Unit + Integration | ✅ Pattern match |
| **Structure** | Hexagonal | Hexagonal | ✅ Identical |
| **State Machine** | draft → approved | draft → approved | ✅ Identical pattern |

---

## 🚀 Implementation Phases

1. **Foundation** → Errors, StateMachine, index.ts
2. **Domain Services** → CustomerService, ApprovalService, CreditLimitService
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
- ✅ Molecule organization (dom04-accounts-receivable)
- ✅ Cell boundaries (pure business logic)
- ✅ Frontend structure (apps/web/app/customers/)
- ✅ DB structure (apps/db/migrations/finance/)
- ✅ BFF structure (apps/web/app/api/ar/customers/)
- ✅ Backend structure (Cell services)
