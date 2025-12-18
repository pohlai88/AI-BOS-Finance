# DOM06 — Treasury Architecture Brief

> **Quick Reference:** Treasury domain architecture and compliance  
> **Full Details:** See individual cell PRDs and Implementation Guide  
> **Reference Pattern:** DOM-03 Accounts Payable (AP)

---

## 🎯 Treasury Domain Summary

**Purpose:** Optimize liquidity, manage cash risk, and ensure accurate bank reconciliation across all entities.

**Key Controls:**
- ✅ Dual Authorization: All cash movements require two distinct approvers
- ✅ Bank Confirmation: Cash movements require bank reconciliation
- ✅ IC Balance Netting: Intercompany balances must net to zero on close
- ✅ FX Compliance: FX gains/losses recognized per IAS 21/IFRS 9
- ✅ 100% audit event coverage
- ✅ Period Cutoff: Bank reconciliation tied to fiscal periods

**Risk Profile:** HIGH — Unauthorized fund movements, currency exposure, liquidity risk

---

## 📁 Domain Structure (Hexagonal Architecture)

```
dom06-treasury/
│
├── 📄 ARCHITECTURE-BRIEF.md          # This file
├── 📄 IMPLEMENTATION-GUIDE.md        # Implementation directory structure
├── 📄 README.md                      # Domain overview
│
├── 📁 Manager Dashboard
│   └── TRManagerDashboardService.ts # Cluster-level dashboard aggregating all cells
│
├── 📁 Cells (Atomic Units)
│   ├── tr01-bank-master/             # ✅ COMPLETE
│   │   ├── BankMasterService.ts      # Bank account CRUD, verification
│   │   ├── DashboardService.ts      # Cell dashboard metrics
│   │   ├── errors.ts                 # Cell-specific errors
│   │   ├── types.ts                  # Type definitions
│   │   ├── index.ts                  # Public API
│   │   ├── ARCHITECTURE-BRIEF.md     # Cell architecture
│   │   └── PRD-tr01-bank-master.md   # Product requirements
│   │
│   ├── tr02-cash-pooling/            # 📋 PLANNED
│   │   ├── CashPoolingService.ts     # Sweep/fund logic, interest allocation
│   │   ├── DashboardService.ts       # Cell dashboard metrics
│   │   ├── errors.ts                 # Cell-specific errors
│   │   ├── index.ts                  # Public API
│   │   ├── ARCHITECTURE-BRIEF.md     # Cell architecture
│   │   └── PRD-tr02-cash-pooling.md  # Product requirements
│   │
│   ├── tr03-fx-hedging/              # 📋 PLANNED
│   │   ├── FXHedgingService.ts       # Forward contracts, hedge accounting
│   │   ├── DashboardService.ts       # Cell dashboard metrics
│   │   ├── errors.ts                 # Cell-specific errors
│   │   ├── index.ts                  # Public API
│   │   ├── ARCHITECTURE-BRIEF.md     # Cell architecture
│   │   └── PRD-tr03-fx-hedging.md    # Product requirements
│   │
│   ├── tr04-intercompany-settlement/ # 📋 PLANNED
│   │   ├── IntercompanyService.ts    # IC balance netting, settlement
│   │   ├── DashboardService.ts       # Cell dashboard metrics
│   │   ├── errors.ts                 # Cell-specific errors
│   │   ├── index.ts                  # Public API
│   │   ├── ARCHITECTURE-BRIEF.md     # Cell architecture
│   │   └── PRD-tr04-intercompany-settlement.md # Product requirements
│   │
│   └── tr05-bank-reconciliation/     # 📋 PLANNED
│       ├── ReconciliationService.ts  # Statement import, matching, tie-out
│       ├── DashboardService.ts       # Cell dashboard metrics
│       ├── errors.ts                 # Cell-specific errors
│       ├── index.ts                  # Public API
│       ├── ARCHITECTURE-BRIEF.md     # Cell architecture
│       └── PRD-tr05-bank-reconciliation.md # Product requirements
│
└── 📁 Canvas (Lively Layer - Future)
    └── (To be implemented following DOM-03 pattern)
```

---

## 🔌 Integration Points

### Kernel Services (Required)

| Service | Symbol | Purpose | Used By |
|---------|--------|---------|---------|
| **K_LOG** | `AuditPort` | Transactional audit events | All cells |
| **K_POLICY** | `PolicyPort` | Dual authorization rules, limits | TR-01, TR-02, TR-03 |
| **K_AUTH** | `AuthPort` | Permission checks, SoD validation | All cells |
| **K_TIME** | `FiscalTimePort` | Period cutoff, reconciliation periods | TR-05, TR-04 |
| **K_FX** | `FXPort` | FX rates, revaluation | TR-03, TR-02 (multi-currency) |
| **K_SEQ** | `SequencePort` | Sequence generation | All cells |
| **K_NOTIFY** | `EventBusPort` | Cross-cell coordination | All cells |

### Cross-Cell Dependencies

| Cell | Dependency | Purpose |
|------|------------|---------|
| **TR-01** | None (foundation) | Bank account registry |
| **TR-02** | TR-01 | Source/target bank accounts |
| **TR-03** | K_FX, GL-03 | FX rates, hedge accounting entries |
| **TR-04** | GL-03, AR/AP | IC receivable/payable balances |
| **TR-05** | TR-01, GL-05 | Bank accounts, GL balances |

### Infrastructure (Shared)

| Component | Location | Purpose |
|-----------|----------|---------|
| **Ports** | `packages/kernel-core/src/ports/` | Interfaces (BankRepositoryPort, FXPort, etc.) |
| **Adapters** | `packages/kernel-adapters/src/` | Implementations (SQL, Memory) |
| **Migrations** | `apps/db/migrations/finance/` | Database schema (170-172) |
| **API Routes** | `apps/web/app/api/treasury/` | HTTP endpoints |

---

## ✅ CONT_07 Compliance

| Requirement | Status | Evidence |
|-------------|--------|----------|
| **Hexagonal Architecture** | ✅ | Services → Ports → Adapters |
| **Kernel Integration** | ✅ | K_LOG, K_POLICY, K_AUTH, K_TIME, K_FX, K_SEQ |
| **Dual Authorization** | ✅ | TR-01 implemented, others planned |
| **Audit Trail** | ✅ | Transactional audit events |
| **Cell Boundaries** | ✅ | No direct cell dependencies (only ports) |
| **Period Cutoff** | ✅ | K_TIME validation for reconciliation |
| **IC Balance Netting** | ✅ | TR-04 validation trigger |
| **FX Compliance** | ✅ | TR-03 IAS 21/IFRS 9 compliance |

---

## 📊 Control Framework (ICFR-Ready)

| Control | TR-01 | TR-02 | TR-03 | TR-04 | TR-05 |
|---------|:-----:|:-----:|:-----:|:-----:|:-----:|
| **Segregation of Duties** | ✅ | 📋 | 📋 | 📋 | 📋 |
| **Dual Authorization** | ✅ | 📋 | 📋 | 📋 | 📋 |
| **Transactional Audit** | ✅ | 📋 | 📋 | 📋 | 📋 |
| **Optimistic Locking** | ✅ | 📋 | 📋 | 📋 | 📋 |
| **Period Lock (Cutoff)** | — | 📋 | 📋 | ✅ | ✅ |
| **Bank Confirmation** | ✅ | 📋 | — | — | ✅ |
| **IC Balance Netting** | — | — | — | ✅ | — |
| **FX Compliance** | — | — | ✅ | — | — |
| **Tenant Isolation (RLS)** | ✅ | 📋 | 📋 | 📋 | ✅ |

**Legend:** ✅ Complete | 📋 Planned | — Not Applicable

---

## 🎯 Treasury Role in Finance Canon

**Treasury (DOM06) manages liquidity and cash operations:**

```
                    ┌─────────────────────────────────┐
                    │        TREASURY MANAGER          │
                    │    (Cash Command Center)         │
                    └──────────────┬──────────────────┘
                                   │
    ┌──────────────────────────────┼──────────────────────────────┐
    │              │               │               │              │
┌───▼────┐   ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐   ┌────▼────┐
│ TR-01  │   │   TR-02   │   │   TR-03   │   │   TR-04   │   │  TR-05  │
│  Bank  │   │   Cash    │   │    FX     │   │   Inter-  │   │  Bank   │
│ Master │◄──┤  Pooling  │   │  Hedging  │   │  company  │   │ Recon   │
│   ✅   │   │    📋     │   │    📋     │   │    📋     │   │   📋    │
└───┬────┘   └─────┬─────┘   └─────┬─────┘   └─────┬─────┘   └────┬────┘
    │              │               │               │              │
    │              │               │               │              │
    └──────────────┴───────────────┴───────────────┴──────────────┘
                                   │
                    ┌──────────────▼──────────────────┐
                    │       GL-03 POSTING ENGINE       │
                    │    (All Treasury → GL posts)     │
                    └─────────────────────────────────┘
```

---

## 📋 Treasury Non-Negotiables (CONT_07 Section 3.5.2)

| Rule | Enforcement | Justification |
|:-----|:------------|:--------------|
| **Cash movements require bank confirmation** | Async reconciliation process | Existence Assertion |
| **IC balances must net to zero** | Validation trigger on close | Elimination Accuracy |
| **Every cash movement produces audit trail** | K_LOG emit (transactional) | Evidence Requirement |
| **FX gains/losses recognized per IAS 21** | Revaluation engine | Standard Compliance |
| **Dual authorization for all cash movements** | Two distinct approvers required | Authorization Control |
| **Bank accounts must be verified before use** | TR-01 verification workflow | Asset Control |

---

## 🚀 Implementation Phases

### Phase 1: Foundation (TR-01) ✅ COMPLETE
- Bank Master registry
- Bank account verification
- Dual authorization
- Database migration (170_tr_bank_master.sql)

### Phase 2: Reconciliation (TR-05) 📋 PLANNED
- Bank statement import
- Matching engine
- Reconciliation workflow
- Database migration (172_tr_bank_reconciliation.sql)

### Phase 3: Cash Optimization (TR-02) 📋 PLANNED
- Cash pooling configuration
- Sweep/fund execution
- Interest allocation
- Database migration (171_tr_cash_pooling.sql)

### Phase 4: Risk Management (TR-03, TR-04) 📋 PLANNED
- FX hedging contracts
- Intercompany settlement
- IC balance netting
- FX revaluation

---

## 📚 Related Documents

### Cell PRDs
- [PRD-tr01-bank-master.md](./cells/tr01-bank-master/PRD-tr01-bank-master.md) — ✅ Complete
- [PRD-tr02-cash-pooling.md](./cells/tr02-cash-pooling/PRD-tr02-cash-pooling.md) — 📋 To be expanded
- [PRD-tr03-fx-hedging.md](./cells/tr03-fx-hedging/PRD-tr03-fx-hedging.md) — 📋 To be expanded
- [PRD-tr04-intercompany-settlement.md](./cells/tr04-intercompany-settlement/PRD-tr04-intercompany-settlement.md) — 📋 To be expanded
- [PRD-tr05-bank-reconciliation.md](./cells/tr05-bank-reconciliation/PRD-tr05-bank-reconciliation.md) — 📋 To be expanded

### Architecture Documents
- [IMPLEMENTATION-GUIDE.md](./IMPLEMENTATION-GUIDE.md) — 📋 Implementation directory structure
- [README.md](./README.md) — Domain overview

### Reference Pattern
- [DOM-03 Accounts Payable](../dom03-accounts-payable/README.md) — ✅ Complete reference

---

## 🔍 Comparison with DOM-03 (Reference Pattern)

| Aspect | DOM-03 (AP) | DOM-06 (TR) | Alignment |
|--------|-------------|-------------|-----------|
| **Cell Count** | 5 cells | 5 cells | ✅ Same structure |
| **Architecture** | Hexagonal | Hexagonal | ✅ Identical |
| **Kernel Integration** | K_LOG, K_POLICY, K_AUTH, K_TIME, K_SEQ | K_LOG, K_POLICY, K_AUTH, K_TIME, K_FX, K_SEQ | ✅ Extended (K_FX) |
| **Control Framework** | SoD, Audit, Period Lock | Dual Auth, Audit, Period Lock, IC Netting | ✅ Treasury-specific |
| **State Machines** | Vendor, Invoice, Payment | Bank Account, Reconciliation | ✅ Pattern match |
| **Dashboard Services** | Cell + Manager | Cell + Manager | ✅ Pattern match |
| **Canvas (Lively Layer)** | ✅ Complete | 📋 Planned | ✅ To be replicated |

---

## ⚠️ Planning Gaps Identified (CONT_07 Section 3.5)

**Issue:** CONT_07 Section 3.5 Treasury is too brief and lacks:
- ❌ Detailed architecture briefs
- ❌ Implementation guides
- ❌ Full PRDs for each cell
- ❌ Integration point specifications
- ❌ State machine definitions
- ❌ Control framework details

**Resolution:** This Architecture Brief and Implementation Guide address these gaps by following the proven DOM-03 pattern.

---

**Status:** ✅ Architecture Brief Complete  
**Ready for:** Implementation Guide and expanded PRDs  
**Reference Pattern:** DOM-03 Accounts Payable

---

**Last Updated:** December 2025  
**Maintainer:** Finance Cell Team  
**Review:** Architecture Team
