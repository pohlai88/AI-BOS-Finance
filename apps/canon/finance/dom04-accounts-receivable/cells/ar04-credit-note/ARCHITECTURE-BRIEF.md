# AR-04 Credit Note — Architecture Brief

> **Quick Reference:** Directory structure and architectural compliance

---

## 🎯 PRD-AR04 Summary

**Purpose:** Handle returns, allowances, and revenue adjustments with proper authorization controls.

**Key Controls:**
- ✅ Separate approval permission (anti-fraud)
- ✅ SoD: Maker ≠ Checker (database constraint)
- ✅ Every credit note links to original invoice
- ✅ 100% audit event coverage
- ✅ Immutable posted credit notes

**State Machine:** `draft → submitted → approved → posted → applied`

---

## 📁 Directory Structure (Hexagonal Architecture)

```
ar04-credit-note/
│
├── Domain Services (Business Logic)
│   ├── CreditNoteService.ts           # CRUD, state transitions
│   ├── ApprovalService.ts             # SoD, approval workflow
│   └── PostingService.ts              # GL posting orchestration
│
├── Domain Primitives
│   └── CreditNoteStateMachine.ts      # State transitions
│
├── Errors
│   └── errors.ts                      # Cell-specific errors
│
├── Exports
│   └── index.ts                       # Public API
│
└── Tests
    └── __tests__/
        ├── Unit tests (5 files)
        └── integration/
            └── credit-note-cell.integration.test.ts
```

---

## ✅ CONT_07 Compliance

| Requirement | Status | Evidence |
|-------------|--------|----------|
| **Hexagonal Architecture** | ✅ | Services → Ports → Adapters |
| **Kernel Integration** | ✅ | K_LOG, K_TIME, K_AUTH, K_SEQ |
| **SoD Enforcement** | ✅ | DB constraint + service validation |
| **Audit Trail** | ✅ | Transactional audit events |
| **Cell Boundaries** | ✅ | No direct cell dependencies |

---

**Status:** ✅ Architecture Compliant  
**Ready for:** Implementation

---

**Last Updated:** 2025-12-16  
**Status:** ✅ **APPROVED FOR IMPLEMENTATION**
