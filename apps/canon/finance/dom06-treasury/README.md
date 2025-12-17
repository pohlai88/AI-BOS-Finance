# DOM06 — Treasury (Cash & Liquidity)

> **Cash & Liquidity Management**  
> Bank Master → Cash Pooling → FX Hedging → Intercompany Settlement → Bank Reconciliation

---

## 📊 Status Summary

| Cell | Code | PRD | Service | Migration | API | Status |
|------|------|:---:|:-------:|:---------:|:---:|:------:|
| **Bank Master** | TR-01 | ✅ | ✅ | ✅ | ✅ | 🚀 **Ready** |
| **Cash Pooling** | TR-02 | 📋 | ⬜ | ✅ | ⬜ | 📋 Planned |
| **FX Hedging** | TR-03 | 📋 | ⬜ | ⬜ | ⬜ | 📋 Planned |
| **Intercompany Settlement** | TR-04 | 📋 | ⬜ | ⬜ | ⬜ | 📋 Planned |
| **Bank Reconciliation** | TR-05 | 📋 | ⬜ | ✅ | ✅ | 📋 Planned |

**Overall Backend Completion: 40%**

---

## 🏗️ Architecture

```
dom06-treasury/
├── cells/
│   ├── tr01-bank-master/           # ✅ COMPLETE
│   │   ├── BankMasterService.ts    # ✅ Complete
│   │   ├── DashboardService.ts     # ✅ Complete
│   │   ├── errors.ts               # ✅ Complete
│   │   ├── types.ts                # ✅ Complete
│   │   ├── index.ts                # ✅ Complete
│   │   ├── ARCHITECTURE-BRIEF.md   # ✅ Complete
│   │   └── PRD-tr01-bank-master.md # ✅ Complete
│   │
│   ├── tr02-cash-pooling/          # 📋 PLANNED
│   │   └── PRD-tr02-cash-pooling.md # 📋 Placeholder
│   │
│   ├── tr03-fx-hedging/            # 📋 PLANNED
│   │   └── PRD-tr03-fx-hedging.md  # 📋 Placeholder
│   │
│   ├── tr04-intercompany-settlement/ # 📋 PLANNED
│   │   └── PRD-tr04-intercompany-settlement.md # 📋 Placeholder
│   │
│   └── tr05-bank-reconciliation/   # 📋 PLANNED
│       └── PRD-tr05-bank-reconciliation.md # 📋 Placeholder
│
├── TRManagerDashboardService.ts    # ✅ Complete (placeholder data)
└── README.md                       # This file
```

---

## 💾 Database Migrations

| Migration | Description | Status |
|-----------|-------------|:------:|
| `170_tr_bank_master.sql` | Bank accounts, signatories | ✅ |
| `171_tr_cash_pooling.sql` | Cash pools, sweep executions | ✅ |
| `172_tr_bank_reconciliation.sql` | Statements, reconciliations | ✅ |

---

## 🔌 API Routes

### Bank Accounts (TR-01)
| Method | Route | Status |
|--------|-------|:------:|
| GET | `/api/treasury/bank-accounts` | ✅ |
| POST | `/api/treasury/bank-accounts` | ✅ |
| GET | `/api/treasury/bank-accounts/:id` | ✅ |
| PATCH | `/api/treasury/bank-accounts/:id` | ✅ |
| POST | `/api/treasury/bank-accounts/:id/submit-verification` | ✅ |
| POST | `/api/treasury/bank-accounts/:id/verify` | ✅ |
| POST | `/api/treasury/bank-accounts/:id/suspend` | ✅ |
| POST | `/api/treasury/bank-accounts/:id/reactivate` | ✅ |

### Cash Position
| Method | Route | Status |
|--------|-------|:------:|
| GET | `/api/treasury/cash-position` | ✅ |

### Reconciliations (TR-05)
| Method | Route | Status |
|--------|-------|:------:|
| GET | `/api/treasury/reconciliations` | ✅ |
| POST | `/api/treasury/reconciliations` | ✅ |

### Manager Dashboard
| Method | Route | Status |
|--------|-------|:------:|
| GET | `/api/treasury/manager/dashboard` | ✅ |

---

## ✅ Control Framework (ICFR-Ready)

| Control | TR-01 | TR-02 | TR-03 | TR-04 | TR-05 |
|---------|:-----:|:-----:|:-----:|:-----:|:-----:|
| **Segregation of Duties** | ✅ | 📋 | 📋 | 📋 | 📋 |
| **Transactional Audit** | ✅ | 📋 | 📋 | 📋 | 📋 |
| **Optimistic Locking** | ✅ | 📋 | 📋 | 📋 | 📋 |
| **Period Lock (Cutoff)** | — | 📋 | 📋 | 📋 | 📋 |
| **Dual Authorization** | ✅ | 📋 | 📋 | 📋 | 📋 |
| **Tenant Isolation (RLS)** | ✅ | ✅ | 📋 | 📋 | ✅ |

---

## 🔗 Kernel Integrations

| Kernel Service | Purpose | Status |
|----------------|---------|:------:|
| **K_LOG** | Transactional audit events | ✅ Integrated |
| **K_POLICY** | SoD, signatory limits | 📋 Planned |
| **K_TIME** | Fiscal period validation | 📋 Planned |
| **K_SEQ** | Sequence generation | 📋 Planned |
| **K_FX** | FX rate service | 📋 Planned |
| **GL-03** | GL Posting Engine | 📋 Planned |

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
└────────┘   └───────────┘   └───────────┘   └───────────┘   └─────────┘
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

## 📚 Related Documents

### Cell PRDs
- [PRD-tr01-bank-master.md](./cells/tr01-bank-master/PRD-tr01-bank-master.md) — ✅ Complete
- [PRD-tr02-cash-pooling.md](./cells/tr02-cash-pooling/PRD-tr02-cash-pooling.md) — 📋 Placeholder
- [PRD-tr03-fx-hedging.md](./cells/tr03-fx-hedging/PRD-tr03-fx-hedging.md) — 📋 Placeholder
- [PRD-tr04-intercompany-settlement.md](./cells/tr04-intercompany-settlement/PRD-tr04-intercompany-settlement.md) — 📋 Placeholder
- [PRD-tr05-bank-reconciliation.md](./cells/tr05-bank-reconciliation/PRD-tr05-bank-reconciliation.md) — 📋 Placeholder

### Architecture
- [TR-01 ARCHITECTURE-BRIEF.md](./cells/tr01-bank-master/ARCHITECTURE-BRIEF.md) — ✅ Complete

---

## 🎨 TR-Specific Features

### Cash Position Dashboard
```
┌──────────────────────────────────────────────────────────────────┐
│                  DAILY CASH POSITION — Dec 18, 2024               │
├───────────────┬───────────────┬───────────────┬──────────────────┤
│    Entity     │     Bank      │   Currency    │     Balance      │
├───────────────┼───────────────┼───────────────┼──────────────────┤
│  HQ Corp      │  HSBC         │   USD         │    $2,450,000    │
│  HQ Corp      │  Citi         │   USD         │      $890,000    │
│  EU Sub       │  Deutsche     │   EUR         │    €1,200,000    │
│  APAC Sub     │  OCBC         │   SGD         │    S$750,000     │
├───────────────┼───────────────┼───────────────┼──────────────────┤
│               │               │  TOTAL (USD)  │    $5,890,000    │
└───────────────┴───────────────┴───────────────┴──────────────────┘
```

### Bank Reconciliation Status (Planned)
```
┌────────────────────────────────────────────────────────────────┐
│  RECONCILIATION STATUS — November 2024                          │
├───────────┬────────────┬────────────┬────────────┬─────────────┤
│   Bank    │  GL Balance│ Bank Balance│ Difference │   Status    │
├───────────┼────────────┼────────────┼────────────┼─────────────┤
│ HSBC      │ $2,450,000 │ $2,451,200 │    $1,200  │ 🟡 Pending  │
│ Citi      │   $890,000 │   $890,000 │        $0  │ ✅ Matched  │
│ Deutsche  │ €1,200,000 │ €1,200,000 │        €0  │ ✅ Matched  │
└───────────┴────────────┴────────────┴────────────┴─────────────┘
```

---

## 🧪 Running Tests

```bash
# Run all TR cell tests
pnpm test:vitest run apps/canon/finance/dom06-treasury/cells

# Run specific cell tests
pnpm test:vitest run apps/canon/finance/dom06-treasury/cells/tr01-bank-master
```

---

## 📅 Implementation Roadmap

| Phase | Cells | Priority | Dependencies | Status |
|-------|-------|----------|--------------|:------:|
| **Phase 1** | TR-01 Bank Master | P3 | GL-03 | ✅ Complete |
| **Phase 2** | TR-05 Bank Reconciliation | P3 | TR-01, GL-05 | 📋 Planned |
| **Phase 3** | TR-02 Cash Pooling | P3 | TR-01 | 📋 Planned |
| **Phase 4** | TR-04 Intercompany Settlement | P3 | GL-03, AR/AP | 📋 Planned |
| **Phase 5** | TR-03 FX Hedging | P3 | K_FX, GL-03 | 📋 Planned |

---

**Last Updated:** December 2025  
**Maintainer:** Finance Cell Team
