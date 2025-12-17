# DOM06 — Treasury (Cash & Liquidity)

> **Cash & Liquidity Management**  
> Bank Master → Cash Pooling → FX Hedging → Intercompany Settlement → Bank Reconciliation

---

## 📊 Status Summary

| Cell | Code | Status | Description |
|------|------|--------|-------------|
| **Bank Master** | TR-01 | ✅ PRD Complete | Bank accounts, signatories, payment rails |
| **Cash Pooling** | TR-02 | 📋 Planned | Intercompany cash concentration/sweeping |
| **FX Hedging** | TR-03 | 📋 Planned | Forward contracts, currency risk management |
| **Intercompany Settlement** | TR-04 | 📋 Planned | IC netting, elimination entries |
| **Bank Reconciliation** | TR-05 | 📋 Planned | GL ↔ Bank statement tie-out |

**Overall Backend Completion: 20%**

---

## 🏗️ Architecture

```
dom06-treasury/
├── cells/
│   ├── tr01-bank-master/           # Bank account management
│   │   ├── BankMasterService.ts    # 📋 Planned
│   │   ├── DashboardService.ts     # 📋 Planned
│   │   ├── errors.ts               # 📋 Planned
│   │   ├── index.ts                # 📋 Planned
│   │   ├── ARCHITECTURE-BRIEF.md   # 📋 Planned
│   │   └── PRD-tr01-bank-master.md # ✅ Complete
│   │
│   ├── tr02-cash-pooling/          # Cash concentration
│   │   └── PRD-tr02-cash-pooling.md # 📋 Planned
│   │
│   ├── tr03-fx-hedging/            # FX risk management
│   │   └── PRD-tr03-fx-hedging.md  # 📋 Planned
│   │
│   ├── tr04-intercompany-settlement/ # IC netting
│   │   └── PRD-tr04-intercompany-settlement.md # 📋 Planned
│   │
│   └── tr05-bank-reconciliation/   # Bank reconciliation
│       └── PRD-tr05-bank-reconciliation.md # 📋 Planned
│
└── README.md                        # This file
```

---

## ✅ Control Framework (ICFR-Ready)

| Control | TR-01 | TR-02 | TR-03 | TR-04 | TR-05 |
|---------|-------|-------|-------|-------|-------|
| **Segregation of Duties** | ✅ | 📋 | 📋 | 📋 | 📋 |
| **Transactional Audit** | ✅ | 📋 | 📋 | 📋 | 📋 |
| **Optimistic Locking** | ✅ | 📋 | 📋 | 📋 | 📋 |
| **Period Lock (Cutoff)** | — | 📋 | 📋 | 📋 | 📋 |
| **Dual Authorization** | ✅ | 📋 | 📋 | 📋 | 📋 |
| **Tenant Isolation (RLS)** | ✅ | 📋 | 📋 | 📋 | 📋 |

---

## 🔗 Kernel Integrations

| Kernel Service | Purpose | Status |
|----------------|---------|--------|
| **K_LOG** | Transactional audit events | 📋 Planned |
| **K_POLICY** | SoD, signatory limits | 📋 Planned |
| **K_TIME** | Fiscal period validation | 📋 Planned |
| **K_SEQ** | Sequence generation | 📋 Planned |
| **K_FX** | FX rate service | 📋 Planned |
| **GL-03** | GL Posting Engine | 📋 Planned |

---

## 📁 BFF Routes (API) — Planned

### TR Cell Routes
- `/api/tr/banks/*` — TR-01 Bank Master endpoints
- `/api/tr/pooling/*` — TR-02 Cash Pooling endpoints  
- `/api/tr/hedging/*` — TR-03 FX Hedging endpoints
- `/api/tr/intercompany/*` — TR-04 Intercompany endpoints
- `/api/tr/reconciliation/*` — TR-05 Reconciliation endpoints

### Dashboard Routes
- `/api/tr/manager/dashboard` — Treasury Manager cluster dashboard
- `/api/tr/banks/dashboard` — TR-01 cell dashboard
- `/api/tr/pooling/dashboard` — TR-02 cell dashboard
- `/api/tr/hedging/dashboard` — TR-03 cell dashboard
- `/api/tr/intercompany/dashboard` — TR-04 cell dashboard
- `/api/tr/reconciliation/dashboard` — TR-05 cell dashboard

---

## 📚 Related Documents

### Cell PRDs
- [PRD-tr01-bank-master.md](./cells/tr01-bank-master/PRD-tr01-bank-master.md) — ✅ Complete
- PRD-tr02-cash-pooling.md — 📋 Planned
- PRD-tr03-fx-hedging.md — 📋 Planned
- PRD-tr04-intercompany-settlement.md — 📋 Planned
- PRD-tr05-bank-reconciliation.md — 📋 Planned

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
│ Master │   │  Pooling  │   │  Hedging  │   │  company  │   │ Recon   │
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

## 🎨 TR-Specific Features

### Cash Position Dashboard (Planned)
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
# Run all TR cell tests (when implemented)
pnpm test:vitest run apps/canon/finance/dom06-treasury/cells

# Run specific cell tests
pnpm test:vitest run apps/canon/finance/dom06-treasury/cells/tr01-bank-master
```

---

## 📅 Implementation Roadmap

| Phase | Cells | Priority | Dependencies |
|-------|-------|----------|--------------|
| **Phase 1** | TR-01 Bank Master | P3 | GL-03 |
| **Phase 2** | TR-05 Bank Reconciliation | P3 | TR-01, GL-05 |
| **Phase 3** | TR-02 Cash Pooling | P3 | TR-01 |
| **Phase 4** | TR-04 Intercompany Settlement | P3 | GL-03, AR/AP |
| **Phase 5** | TR-03 FX Hedging | P3 | K_FX, GL-03 |

---

**Last Updated:** December 2025  
**Maintainer:** Finance Cell Team
