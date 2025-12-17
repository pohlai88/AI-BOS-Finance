# AP-04 Invoice Approval — Architecture Brief

> **Quick Reference:** Directory structure and architectural compliance  
> **Full Details:** See `IMPLEMENTATION-DIRECTORY-STRUCTURE.md`

---

## 🎯 PRD-AP04 Summary

**Purpose:** Enforce authorization hierarchy (amount-based escalation) and Segregation of Duties (SoD). Route invoices through multi-step approval workflows, enforce maker-checker separation, and gate GL posting and payment execution.

**Key Controls:**
- ✅ SoD Enforcement: Maker ≠ Checker (database constraint)
- ✅ Multi-Step Approvals: Amount-based escalation, department/project routing
- ✅ Immutable Approval Chain: No deletion, full audit trail
- ✅ Policy-Driven Routing: Approval rules from K_POLICY
- ✅ Re-approval on Change: Invoice change invalidates approvals
- ✅ 100% audit event coverage

**State Machine:** `submitted → pending_approval → approved_level_1 → approved_level_2 → ... → approved → rejected`

---

## 📁 Directory Structure (Hexagonal Architecture)

```
ap04-invoice-submit-approval/
│
├── Domain Services (Business Logic)
│   ├── ApprovalService.ts              # Approval workflow, SoD enforcement
│   ├── RoutingService.ts               # Approval route computation
│   └── DelegationService.ts            # Delegation management
│
├── Domain Primitives
│   └── ApprovalStateMachine.ts         # Approval state transitions
│
├── Errors
│   └── errors.ts                      # Cell-specific errors
│
├── Exports
│   └── index.ts                        # Public API
│
└── Tests
    └── __tests__/
        ├── Unit tests (7 files)
        └── integration/
            └── approval-cell.integration.test.ts
```

---

## 🔌 Integration Points

### Kernel Services (Required)

| Service | Port | Used By | Purpose |
|---------|------|---------|---------|
| **K_LOG** | `AuditPort` | All services | Transactional audit events |
| **K_POLICY** | `PolicyPort` | ApprovalService, RoutingService | Approval rules, thresholds |
| **K_NOTIFY** | `EventBusPort` | ApprovalService | Publish domain events (outbox) |

### Cross-Cell Dependencies

| Cell | Port | Purpose |
|------|------|---------|
| **AP-02** | `InvoicePort` | Update invoice status |
| **GL-03** | `GLPostingPort` | Trigger GL posting on final approval |

### Infrastructure (Shared)

| Component | Location | Purpose |
|-----------|----------|---------|
| **Ports** | `packages/kernel-core/src/ports/` | Interfaces (ApprovalRepositoryPort, InvoicePort, GLPostingPort, EventBusPort) |
| **Adapters** | `packages/kernel-adapters/src/` | Implementations (SQL, Memory) |
| **Migrations** | `apps/db/migrations/finance/` | Database schema (111, 112) |
| **API Routes** | `apps/web/app/api/ap/approvals/` | HTTP endpoints |

---

## ✅ CONT_07 Compliance

| Requirement | Status | Evidence |
|-------------|--------|----------|
| **Hexagonal Architecture** | ✅ | Services → Ports → Adapters |
| **Kernel Integration** | ✅ | K_LOG, K_POLICY, K_NOTIFY |
| **SoD Enforcement** | ✅ | DB constraint + service validation |
| **Audit Trail** | ✅ | Transactional audit events |
| **Cell Boundaries** | ✅ | No direct cell dependencies (only ports) |
| **Test Coverage** | ✅ | Unit + Integration + Control tests |

---

## 📊 Comparison with AP-05

| Aspect | AP-05 | AP-04 | Alignment |
|--------|-------|-------|-----------|
| **Services** | 5 services | 3 services | ✅ Pattern match |
| **Ports** | kernel-core | kernel-core | ✅ Shared |
| **Adapters** | kernel-adapters | kernel-adapters | ✅ Shared |
| **Tests** | Unit + Integration | Unit + Integration | ✅ Pattern match |
| **Structure** | Hexagonal | Hexagonal | ✅ Identical |

---

## 🚀 Implementation Phases

1. **Foundation** → Errors, StateMachine, index.ts
2. **Domain Services** → ApprovalService, RoutingService, DelegationService
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
- ✅ Kernel integration (K_LOG, K_POLICY, K_NOTIFY)
- ✅ Canon structure (apps/canon/finance/)
- ✅ Molecule organization (dom03-accounts-payable)
- ✅ Cell boundaries (pure business logic)
- ✅ Frontend structure (apps/web/app/approvals/)
- ✅ DB structure (apps/db/migrations/finance/)
- ✅ BFF structure (apps/web/app/api/ap/approvals/)
- ✅ Backend structure (Cell services)
