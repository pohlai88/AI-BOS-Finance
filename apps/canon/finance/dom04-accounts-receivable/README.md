# DOM04 — Accounts Receivable (O2C)

> **Order to Cash Lifecycle**  
> Customer Management → Invoicing → Collection → Credit Adjustment → Aging & Collection

---

## 📊 Status Summary

| Cell | Code | Status | Description |
|------|------|--------|-------------|
| **Customer Master** | AR-01 | ✅ Backend Complete | Customer registration, approval workflow, credit management |
| **Sales Invoice** | AR-02 | ✅ Backend Complete | Invoice creation, posting, duplicate detection |
| **Receipt Processing** | AR-03 | ✅ Backend Complete | Receipt entry, allocation to invoices, GL posting |
| **Credit Note** | AR-04 | ✅ Backend Complete | Credit note creation, application to invoices |
| **AR Aging & Collection** | AR-05 | ✅ Backend Complete | Aging snapshots, collection actions, DSO tracking |

**Overall Backend Completion: 95%**

---

## 🏗️ Architecture

```
dom04-accounts-receivable/
├── canvas/                        # 🆕 Lively Layer (collaborative canvas)
│   ├── urn.ts                     # URN parser/builder for entity binding
│   ├── entityTransformers.ts      # AR entity → canvas display data
│   └── index.ts                   # Barrel exports
│
├── ARManagerDashboardService.ts   # 🆕 Cluster-level dashboard
│
├── cells/
│   ├── ar01-customer-master/      # Customer lifecycle management
│   │   ├── CustomerService.ts     # Core CRUD operations
│   │   ├── DashboardService.ts    # 🆕 Cell dashboard metrics
│   │   ├── errors.ts              # Domain errors
│   │   └── index.ts               # Barrel exports
│   │
│   ├── ar02-sales-invoice/        # Invoice processing
│   │   ├── InvoiceService.ts      # Invoice CRUD
│   │   ├── DashboardService.ts    # 🆕 Cell dashboard metrics
│   │   ├── errors.ts              # Domain errors
│   │   └── index.ts               # Barrel exports
│   │
│   ├── ar03-receipt-processing/   # Receipt handling
│   │   ├── ReceiptService.ts      # Receipt CRUD & allocation
│   │   ├── DashboardService.ts    # 🆕 Cell dashboard metrics
│   │   ├── errors.ts              # Domain errors
│   │   └── index.ts               # Barrel exports
│   │
│   ├── ar04-credit-note/          # Credit adjustments
│   │   ├── CreditNoteService.ts   # Credit note CRUD
│   │   ├── DashboardService.ts    # 🆕 Cell dashboard metrics
│   │   ├── errors.ts              # Domain errors
│   │   └── index.ts               # Barrel exports
│   │
│   └── ar05-ar-aging/             # Aging & Collection
│       ├── AgingService.ts        # Aging snapshots & collection
│       ├── DashboardService.ts    # 🆕 Cell dashboard metrics
│       ├── errors.ts              # Domain errors
│       └── index.ts               # Barrel exports
│
├── PRD-LIVELY-LAYER.md            # 🆕 Lively Layer specification
├── COMPREHENSIVE_EVALUATION.md    # Architecture quality assessment
└── README.md                      # This file
```

---

## ✅ Control Framework (ICFR-Ready)

| Control | AR-01 | AR-02 | AR-03 | AR-04 | AR-05 |
|---------|-------|-------|-------|-------|-------|
| **Segregation of Duties** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Transactional Audit** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Optimistic Locking** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Period Lock (Cutoff)** | — | ✅ | ✅ | ✅ | — |
| **Immutability** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Tenant Isolation (RLS)** | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 🔗 Kernel Integrations

| Kernel Service | Purpose | Status |
|----------------|---------|--------|
| **K_LOG** | Transactional audit events | ✅ Integrated |
| **K_POLICY** | SoD, approval limits | ✅ Integrated |
| **K_TIME** | Fiscal period validation | ✅ Integrated |
| **K_SEQ** | Sequence generation (Customer/Invoice/Receipt numbers) | ✅ Port + Adapter |
| **K_COA** | Chart of Accounts validation | ✅ Port + Adapter |
| **GL-03** | GL Posting Engine | ✅ Port + Adapter |

---

## 📁 BFF Routes (API)

All cells have complete BFF route handlers in `apps/web/app/api/`:

### AR Cell Routes
- `/api/ar/customers/*` — AR-01 Customer endpoints
- `/api/ar/invoices/*` — AR-02 Invoice endpoints  
- `/api/ar/receipts/*` — AR-03 Receipt endpoints
- `/api/ar/creditnotes/*` — AR-04 Credit Note endpoints
- `/api/ar/aging/*` — AR-05 Aging endpoints

### 🆕 Dashboard Routes
- `/api/ar/manager/dashboard` — AR Manager cluster dashboard
- `/api/ar/customers/dashboard` — AR-01 cell dashboard
- `/api/ar/invoices/dashboard` — AR-02 cell dashboard
- `/api/ar/receipts/dashboard` — AR-03 cell dashboard
- `/api/ar/creditnotes/dashboard` — AR-04 cell dashboard
- `/api/ar/aging/dashboard` — AR-05 cell dashboard

### 🆕 Canvas Routes (Lively Layer)
- `/api/canvas/objects` — Canvas object CRUD
- `/api/canvas/objects/:id/move` — Zone moves with optimistic locking
- `/api/canvas/objects/:id/reactions` — Emoji reactions
- `/api/canvas/zones` — Collection workflow zones
- `/api/canvas/preflight` — Pre-flight gate status
- `/api/canvas/preflight/acknowledge` — Acknowledge urgent items

---

## 📚 Related Documents

### Cell PRDs
- [PRD-ar01-customer-master.md](./cells/ar01-customer-master/PRD-ar01-customer-master.md)
- [PRD-ar02-sales-invoice.md](./cells/ar02-sales-invoice/PRD-ar02-sales-invoice.md)
- [PRD-ar03-receipt-processing.md](./cells/ar03-receipt-processing/PRD-ar03-receipt-processing.md)
- [PRD-ar04-credit-note.md](./cells/ar04-credit-note/PRD-ar04-credit-note.md)
- [PRD-ar05-ar-aging.md](./cells/ar05-ar-aging/PRD-ar05-ar-aging.md)

### Domain-Level Features

| Document | Description | Status |
|----------|-------------|--------|
| [**PRD-LIVELY-LAYER.md**](./PRD-LIVELY-LAYER.md) | AR Manager Canvas & Cell Dashboards | 📋 Ready for Development |
| [COMPREHENSIVE_EVALUATION.md](./COMPREHENSIVE_EVALUATION.md) | Architecture quality assessment | ✅ Complete |

---

## 🎯 Roadmap: Lively Layer (Revenue Command Center)

The **Lively Layer** transforms AR Manager into a collaborative FigJam-style workspace for cash collection:

| Phase | Focus | Duration | Status |
|-------|-------|----------|--------|
| **Phase 1** | Cell Dashboards + Canvas Foundation | 2 weeks | ✅ Backend Complete |
| **Phase 2** | Collection Zones | 1 week | ✅ Backend Complete |
| **Phase 3** | Pre-Flight Gate | 1 week | ✅ Backend Complete |
| **Phase 4** | Team Collaboration (WebSocket) | 1 week | ✅ Backend Complete |
| **Phase 5** | Frontend + Polish | 2 weeks | 📋 Pending |

**Completed Backend Features:**
- ✅ Cell-level health dashboards (AR-01 to AR-05)
- ✅ AR Manager cluster dashboard
- ✅ URN parser for entity binding (Magic Link)
- ✅ Entity transformers with priority scoring
- ✅ Aging bucket visualization
- ✅ DSO trend tracking
- ✅ Collection status monitoring

**Pending (Frontend):**
- 📋 Canvas UI component
- 📋 Collection workflow zones
- 📋 Aging waterfall visualization
- 📋 Pre-flight modal for overdue accounts
- 📋 Real-time payment notifications

See [PRD-LIVELY-LAYER.md](./PRD-LIVELY-LAYER.md) for complete specification.

---

## 🎨 AR-Specific Features

### Aging Waterfall Visualization

```
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│CURRENT │ │ 1-30   │ │ 31-60  │ │ 61-90  │ │ 91-120 │ │ 120+   │
│ $1.2M  │ │ $450K  │ │ $320K  │ │ $180K  │ │ $120K  │ │ $130K  │
│████████│ │███████ │ │██████  │ │████    │ │███     │ │███     │
│ green  │ │ amber  │ │ orange │ │  red   │ │ dark   │ │ dark   │
└────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘
```

### Collection Zones

| Zone | Purpose | Trigger Action |
|------|---------|----------------|
| **Follow-Up** | New overdue accounts | Create follow-up task |
| **Reminder Sent** | Dunning letter sent | Log dunning event |
| **Escalated** | Manager attention needed | Notify manager |
| **Payment Promised** | Customer committed to pay | Set promise date |
| **Disputed** | Customer disputes invoice | Create dispute record |
| **Write-Off Review** | Bad debt consideration | Route to CFO |

### Key Metrics

| KPI | Target | Description |
|-----|--------|-------------|
| **DSO** | <45 days | Days Sales Outstanding |
| **Collection Rate** | >90% | % of due invoices collected |
| **Bad Debt Ratio** | <1% | Write-offs / Total billed |
| **Over 90 Days** | <10% | % of receivables over 90 days |

---

## 🧪 Running Tests

```bash
# Run all AR cell tests
pnpm test:vitest run apps/canon/finance/dom04-accounts-receivable/cells

# Run specific cell tests
pnpm test:vitest run apps/canon/finance/dom04-accounts-receivable/cells/ar01-customer-master
```

---

**Last Updated:** December 2025  
**Maintainer:** Finance Cell Team
