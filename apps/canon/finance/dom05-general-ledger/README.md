# DOM05 — General Ledger (R2R)

> **Record to Report Lifecycle**  
> Chart of Accounts → Journal Entry → Posting → Period Close → Trial Balance

---

## 📊 Status Summary

| Cell | Code | Status | Description |
|------|------|--------|-------------|
| **Chart of Accounts** | GL-01 | ✅ Backend Complete | Account hierarchy, segments, validation rules |
| **Journal Entry** | GL-02 | ✅ Backend Complete | Manual/auto entries, approval workflow, reversals |
| **Posting Engine** | GL-03 | ✅ Backend Complete | Central posting, immutable ledger, invariant validation |
| **Period Close** | GL-04 | ✅ Backend Complete | Period status management, cutoff enforcement, TB snapshot |
| **Trial Balance** | GL-05 | ✅ Backend Complete | Balance snapshots, variance analysis, drill-down |

**Overall Backend Completion: 95%**

---

## 🏗️ Architecture

```
dom05-general-ledger/
├── cells/
│   ├── gl01-chart-of-accounts/      # Account master data
│   │   ├── AccountService.ts        # Account CRUD operations
│   │   ├── DashboardService.ts      # Cell dashboard metrics
│   │   ├── errors.ts                # Domain errors
│   │   ├── index.ts                 # Barrel exports
│   │   ├── ARCHITECTURE-BRIEF.md    # Architecture summary
│   │   └── PRD-gl01-chart-of-accounts.md
│   │
│   ├── gl02-journal-entry/          # Journal entry management
│   │   ├── JournalEntryService.ts   # Entry CRUD & workflow
│   │   ├── DashboardService.ts      # Cell dashboard metrics
│   │   ├── types.ts                 # Type definitions
│   │   ├── errors.ts                # Domain errors
│   │   ├── index.ts                 # Barrel exports
│   │   ├── migration.sql            # DB schema
│   │   ├── api-route-example.ts     # Route handler example
│   │   ├── ARCHITECTURE-BRIEF.md    # Architecture summary
│   │   └── PRD-gl02-journal-entry.md
│   │
│   ├── gl03-posting-engine/         # Central posting hub
│   │   ├── PostingEngineService.ts  # Posting orchestration
│   │   ├── DashboardService.ts      # Cell dashboard metrics
│   │   ├── errors.ts                # Domain errors
│   │   ├── index.ts                 # Barrel exports
│   │   ├── ARCHITECTURE-BRIEF.md    # Architecture summary
│   │   └── PRD-gl03-posting-engine.md
│   │
│   ├── gl04-period-close/           # Period lifecycle
│   │   ├── PeriodCloseService.ts    # Period management
│   │   ├── DashboardService.ts      # Cell dashboard metrics
│   │   ├── errors.ts                # Domain errors
│   │   ├── index.ts                 # Barrel exports
│   │   ├── ARCHITECTURE-BRIEF.md    # Architecture summary
│   │   └── PRD-gl04-period-close.md
│   │
│   └── gl05-trial-balance/          # Reporting & analysis
│       ├── TrialBalanceService.ts   # TB generation & analysis
│       ├── DashboardService.ts      # Cell dashboard metrics
│       ├── errors.ts                # Domain errors
│       ├── index.ts                 # Barrel exports
│       ├── ARCHITECTURE-BRIEF.md    # Architecture summary
│       └── PRD-gl05-trial-balance.md
│
├── CRITICAL-FIXES-SUMMARY.md        # 9 critical bug fixes documented
├── DB-GUARDRAILS.sql                # 800 lines of DB enforcement
├── DB-LOCK-RECIPE.md                # 3-lock system documentation
└── README.md                        # This file
```

---

## ✅ Control Framework (ICFR-Ready)

| Control | GL-01 | GL-02 | GL-03 | GL-04 | GL-05 |
|---------|-------|-------|-------|-------|-------|
| **Segregation of Duties** | ✅ | ✅ | ✅ | ✅ | — |
| **Transactional Audit** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Optimistic Locking** | ✅ | ✅ | — | ✅ | — |
| **Period Lock (Cutoff)** | — | ✅ | ✅ | ✅ | ✅ |
| **Immutability** | — | — | ✅ | ✅ | ✅ |
| **Tenant Isolation (RLS)** | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 🔐 GL-Specific Controls

### Double-Entry Enforcement
```
INVARIANT: SUM(debit_amount) = SUM(credit_amount) per journal entry
ENFORCED BY: GL-03 Posting Engine (database constraint + service validation)
```

### Immutable Ledger
```
TABLE: gl_ledger_lines
CONSTRAINT: INSERT-only (no UPDATE/DELETE allowed)
ENFORCED BY: Database triggers + RLS policies
```

### 3-Lock System (Period Close)
```
SOFT LOCK  → Warning only, all entries allowed
HARD LOCK  → Adjusting entries only (requires approval)
FINAL LOCK → No changes allowed (period sealed)
```

---

## 🔗 Kernel Integrations

| Kernel Service | Purpose | Status |
|----------------|---------|--------|
| **K_LOG** | Transactional audit events | ✅ Integrated |
| **K_POLICY** | SoD, approval limits, role checks | ✅ Integrated |
| **K_TIME** | Fiscal period validation | ✅ Integrated |
| **K_SEQ** | Sequence generation (JE numbers, posting refs) | ✅ Port + Adapter |
| **K_COA** | Chart of Accounts validation | ✅ Port + Adapter |

---

## 📁 BFF Routes (API)

### GL Cell Routes (Planned)
- `/api/gl/accounts/*` — GL-01 Account endpoints
- `/api/gl/journal-entries/*` — GL-02 Journal Entry endpoints  
- `/api/gl/posting/*` — GL-03 Posting endpoints
- `/api/gl/periods/*` — GL-04 Period endpoints
- `/api/gl/trial-balance/*` — GL-05 Trial Balance endpoints

### Dashboard Routes (Planned)
- `/api/gl/manager/dashboard` — GL Manager cluster dashboard
- `/api/gl/accounts/dashboard` — GL-01 cell dashboard
- `/api/gl/journal-entries/dashboard` — GL-02 cell dashboard
- `/api/gl/posting/dashboard` — GL-03 cell dashboard
- `/api/gl/periods/dashboard` — GL-04 cell dashboard
- `/api/gl/trial-balance/dashboard` — GL-05 cell dashboard

---

## 📚 Related Documents

### Cell PRDs
- [PRD-gl01-chart-of-accounts.md](./cells/gl01-chart-of-accounts/PRD-gl01-chart-of-accounts.md)
- [PRD-gl02-journal-entry.md](./cells/gl02-journal-entry/PRD-gl02-journal-entry.md)
- [PRD-gl03-posting-engine.md](./cells/gl03-posting-engine/PRD-gl03-posting-engine.md)
- [PRD-gl04-period-close.md](./cells/gl04-period-close/PRD-gl04-period-close.md)
- [PRD-gl05-trial-balance.md](./cells/gl05-trial-balance/PRD-gl05-trial-balance.md)

### Domain-Level Documentation

| Document | Description | Status |
|----------|-------------|--------|
| [CRITICAL-FIXES-SUMMARY.md](./CRITICAL-FIXES-SUMMARY.md) | 9 critical bug fixes | ✅ Complete |
| [DB-GUARDRAILS.sql](./DB-GUARDRAILS.sql) | Database enforcement (800 lines) | ✅ Complete |
| [DB-LOCK-RECIPE.md](./DB-LOCK-RECIPE.md) | 3-lock system documentation | ✅ Complete |

---

## 🎯 GL Role in Finance Canon

**GL-03 (Posting Engine) is the central hub** — all financial transactions flow through it:

```
                  ┌─────────────────────────────────────┐
                  │           GL-03 POSTING ENGINE       │
                  │  (Immutable Ledger, Invariants)      │
                  └──────────────┬──────────────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
   ┌────▼────┐              ┌────▼────┐              ┌────▼────┐
   │  AP-02  │              │  AR-02  │              │  GL-02  │
   │ Invoice │              │ Invoice │              │ Manual  │
   │ Posting │              │ Posting │              │  Entry  │
   └─────────┘              └─────────┘              └─────────┘
        │                        │                        │
   ┌────▼────┐              ┌────▼────┐
   │  AP-05  │              │  AR-03  │
   │ Payment │              │ Receipt │
   │ Posting │              │ Posting │
   └─────────┘              └─────────┘
```

---

## 🧪 Running Tests

```bash
# Run all GL cell tests
pnpm test:vitest run apps/canon/finance/dom05-general-ledger/cells

# Run specific cell tests
pnpm test:vitest run apps/canon/finance/dom05-general-ledger/cells/gl02-journal-entry
```

---

## 🎨 GL-Specific Features

### Trial Balance View
```
┌──────────────────────────────────────────────────────────────────┐
│                    TRIAL BALANCE — December 2024                  │
├───────────┬─────────────────────────┬───────────┬───────────────┤
│  Account  │  Description            │   Debit   │    Credit     │
├───────────┼─────────────────────────┼───────────┼───────────────┤
│  1000     │  Cash                   │  $125,000 │               │
│  1100     │  Accounts Receivable    │  $245,000 │               │
│  2000     │  Accounts Payable       │           │      $85,000  │
│  3000     │  Equity                 │           │     $200,000  │
│  4000     │  Revenue                │           │     $180,000  │
│  5000     │  Expenses               │   $95,000 │               │
├───────────┼─────────────────────────┼───────────┼───────────────┤
│           │  TOTALS                 │  $465,000 │    $465,000   │
└───────────┴─────────────────────────┴───────────┴───────────────┘
                              ✅ BALANCED
```

### Period Status Dashboard
```
┌────────────────────────────────────────────────────────────┐
│  FISCAL YEAR 2024                                          │
├──────────┬──────────┬──────────┬──────────┬───────────────┤
│   Q1     │    Q2    │    Q3    │    Q4    │    Status     │
├──────────┼──────────┼──────────┼──────────┼───────────────┤
│ Jan ⬛   │ Apr ⬛   │ Jul ⬛   │ Oct 🟡   │ ⬛ = Closed   │
│ Feb ⬛   │ May ⬛   │ Aug ⬛   │ Nov 🟢   │ 🟡 = Soft Lock│
│ Mar ⬛   │ Jun ⬛   │ Sep ⬛   │ Dec 🟢   │ 🟢 = Open     │
└──────────┴──────────┴──────────┴──────────┴───────────────┘
```

---

**Last Updated:** December 2025  
**Maintainer:** Finance Cell Team
