# DOM03 — Accounts Payable (P2P)

> **Procure to Pay Lifecycle**  
> Vendor Management → Invoice Processing → Matching → Approval → Payment Execution

---

## 📊 Status Summary

| Cell | Code | Status | Description |
|------|------|--------|-------------|
| **Vendor Master** | AP-01 | ✅ Backend Complete | Vendor registration, approval workflow, bank accounts |
| **Invoice Entry** | AP-02 | ✅ Backend Complete | Invoice creation, duplicate detection, submission |
| **3-Way Match Engine** | AP-03 | ✅ Backend Complete | PO/GRN/Invoice matching, tolerance rules, exceptions |
| **Invoice Approval** | AP-04 | ✅ Backend Complete | Multi-level approval, SoD enforcement, routing |
| **Payment Execution** | AP-05 | ✅ Backend Complete | Payment lifecycle, GL posting, bank integration |

**Overall Backend Completion: 95%**

---

## 🏗️ Architecture

```
dom03-accounts-payable/
├── canvas/                        # 🆕 Lively Layer (collaborative canvas)
│   ├── urn.ts                     # URN parser/builder for entity binding
│   ├── entityTransformers.ts      # AP entity → canvas display data
│   ├── CanvasObjectService.ts     # CRUD operations for canvas objects
│   ├── ZoneTriggerService.ts      # Zone-based workflow triggers
│   ├── PreFlightService.ts        # Pre-flight acknowledgment gate
│   ├── WebSocketTypes.ts          # Real-time message definitions
│   ├── EventBroadcaster.ts        # PubSub for WebSocket events
│   └── __tests__/                 # Unit tests
│
├── APManagerDashboardService.ts   # 🆕 Cluster-level dashboard
│
├── cells/
│   ├── ap01-vendor-master/        # Vendor lifecycle management
│   │   ├── VendorService.ts       # Core CRUD operations
│   │   ├── DashboardService.ts    # 🆕 Cell dashboard metrics
│   │   ├── ApprovalService.ts     # Maker-checker workflow
│   │   ├── BankAccountService.ts  # Bank detail management
│   │   └── VendorStateMachine.ts  # State transitions
│   │
│   ├── ap02-invoice-entry/        # Invoice processing
│   │   ├── InvoiceService.ts      # Invoice CRUD
│   │   ├── DashboardService.ts    # 🆕 Cell dashboard metrics
│   │   ├── DuplicateDetectionService.ts
│   │   ├── PostingService.ts      # GL integration
│   │   └── InvoiceStateMachine.ts
│   │
│   ├── ap03-3way-engine/          # Matching & controls
│   │   ├── MatchService.ts        # 1/2/3-way matching
│   │   ├── DashboardService.ts    # 🆕 Cell dashboard metrics
│   │   ├── ExceptionService.ts    # Variance handling
│   │   └── OverrideService.ts     # SoD-enforced overrides
│   │
│   ├── ap04-invoice-submit-approval/  # Approval workflow
│   │   ├── ApprovalService.ts     # Multi-level approval
│   │   ├── DashboardService.ts    # 🆕 Cell dashboard metrics
│   │   └── ApprovalTypes.ts       # Type definitions
│   │
│   └── ap05-payment-execution/    # Payment lifecycle
│       ├── PaymentService.ts      # Payment CRUD
│       ├── DashboardService.ts    # Cell dashboard metrics
│       ├── ApprovalService.ts     # Payment approval
│       ├── ExecutionService.ts    # Bank submission
│       └── WebhookService.ts      # Bank callbacks
│
├── types/
│   └── index.ts                   # Shared AP types
│
└── payment-hub-demo/              # Demo/MVP (legacy)
```

---

## ✅ Control Framework (ICFR-Ready)

| Control | AP-01 | AP-02 | AP-03 | AP-04 | AP-05 |
|---------|-------|-------|-------|-------|-------|
| **Segregation of Duties** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Transactional Audit** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Optimistic Locking** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Period Lock (Cutoff)** | — | ✅ | — | — | ✅ |
| **Immutability** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Tenant Isolation (RLS)** | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 🧪 Test Coverage

| Cell | Unit Tests | Control Tests | Integration Tests |
|------|------------|---------------|-------------------|
| AP-01 | ✅ VendorService | ✅ SoD | ✅ vendor-cell |
| AP-02 | ✅ InvoiceService, DuplicateDetection | ✅ Period, Audit, Immutability | ✅ invoice-cell |
| AP-03 | ✅ MatchService | ✅ SoD | ✅ match-cell |
| AP-04 | ✅ ApprovalService | ✅ SoD | ✅ approval-cell |
| AP-05 | ✅ Payment, Money, StateMachine | ✅ SoD, Period, Immutability, Concurrency | ✅ payment-cell |

**Run Tests:**
```bash
pnpm test:vitest run apps/canon/finance/dom03-accounts-payable/cells
```

---

## 🔗 Kernel Integrations

| Kernel Service | Purpose | Status |
|----------------|---------|--------|
| **K_LOG** | Transactional audit events | ✅ Integrated |
| **K_POLICY** | SoD, approval limits | ✅ Integrated |
| **K_TIME** | Fiscal period validation | ✅ Integrated |
| **K_SEQ** | Sequence generation (Vendor/Invoice/Payment numbers) | ✅ Port + Adapter |
| **K_COA** | Chart of Accounts validation | ✅ Port + Adapter |
| **GL-03** | GL Posting Engine | ✅ Port + Adapter |

---

## 📁 BFF Routes (API)

All cells have complete BFF route handlers in `apps/web/app/api/`:

### AP Cell Routes
- `/api/ap/vendors/*` — AP-01 Vendor endpoints
- `/api/ap/invoices/*` — AP-02 Invoice endpoints  
- `/api/ap/match/*` — AP-03 Matching endpoints
- `/api/ap/approvals/*` — AP-04 Approval endpoints
- `/api/ap/payments/*` — AP-05 Payment endpoints

### 🆕 Dashboard Routes
- `/api/ap/manager/dashboard` — AP Manager cluster dashboard
- `/api/ap/vendors/dashboard` — AP-01 cell dashboard
- `/api/ap/invoices/dashboard` — AP-02 cell dashboard
- `/api/ap/match/dashboard` — AP-03 cell dashboard
- `/api/ap/approvals/dashboard` — AP-04 cell dashboard

### 🆕 Canvas Routes (Lively Layer)
- `/api/canvas/objects` — Canvas object CRUD
- `/api/canvas/objects/:id/move` — Zone moves with optimistic locking
- `/api/canvas/objects/:id/reactions` — Emoji reactions
- `/api/canvas/zones` — Workflow zones
- `/api/canvas/preflight` — Pre-flight gate status
- `/api/canvas/preflight/acknowledge` — Acknowledge urgent items

---

## 📚 Related Documents

### Cell PRDs
- [PRD-ap01-vendor-master.md](./cells/ap01-vendor-master/PRD-ap01-vendor-master.md)
- [PRD-ap02-invoice-entry.md](./cells/ap02-invoice-entry/PRD-ap02-invoice-entry.md)
- [PRD-ap03-3way-engine.md](./cells/ap03-3way-engine/PRD-ap03-3way-engine.md)
- [PRD-ap04-invoice-submit-approval.md](./cells/ap04-invoice-submit-approval/PRD-ap04-invoice-submit-approval.md)
- [PRD-ap05-payment-execution.md](./cells/ap05-payment-execution/PRD-ap05-payment-execution.md)

### Domain-Level Features

| Document | Description | Status |
|----------|-------------|--------|
| [**PRD-LIVELY-LAYER.md**](./PRD-LIVELY-LAYER.md) | AP Manager Canvas & Cell Dashboards | 📋 Ready for Development |
| [COMPREHENSIVE_EVALUATION.md](./COMPREHENSIVE_EVALUATION.md) | Architecture quality assessment | ✅ Complete |

---

## 🎯 Roadmap: Lively Layer

The **Lively Layer** transforms AP Manager into a collaborative FigJam-style workspace:

| Phase | Focus | Duration | Status |
|-------|-------|----------|--------|
| **Phase 1** | Cell Dashboards + Canvas Foundation | 2 weeks | ✅ Backend Complete |
| **Phase 2** | Zone Triggers | 1 week | ✅ Backend Complete |
| **Phase 3** | Pre-Flight Gate | 1 week | ✅ Backend Complete |
| **Phase 4** | Team Collaboration (WebSocket) | 1 week | ✅ Backend Complete |
| **Phase 5** | Frontend + Polish | 2 weeks | 📋 Pending |

**Completed Backend Features:**
- ✅ Cell-level health dashboards (AP-01 to AP-05)
- ✅ AP Manager cluster dashboard
- ✅ Canvas database migration (tables, indexes, RLS)
- ✅ CanvasRepositoryPort in kernel-core
- ✅ URN parser for entity binding (Magic Link)
- ✅ Entity transformers with priority scoring
- ✅ CanvasObjectService for CRUD operations
- ✅ ZoneTriggerService with optimistic locking
- ✅ PreFlightService with acknowledgment flow
- ✅ WebSocket types and EventBroadcaster
- ✅ All API routes with mock data

**Pending (Frontend):**
- 📋 Canvas UI component
- 📋 Real-time presence cursors
- 📋 Hydrated sticky cards
- 📋 Drag-and-drop to zones
- 📋 Pre-flight modal

See [PRD-LIVELY-LAYER.md](./PRD-LIVELY-LAYER.md) for complete specification.

---

**Last Updated:** December 2025  
**Maintainer:** Finance Cell Team
