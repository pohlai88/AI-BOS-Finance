# PRD: Lively Layer — AR Manager Canvas & Cell Dashboards

> **Document ID:** PRD-DOM04-LIVELY-LAYER  
> **Version:** 1.0.0  
> **Status:** 📋 APPROVED FOR DEVELOPMENT  
> **Author:** Finance Cell Team  
> **Date:** December 2025  
> **Target Release:** Q1 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [User Personas](#4-user-personas)
5. [User Stories](#5-user-stories)
6. [Functional Requirements](#6-functional-requirements)
7. [Technical Requirements](#7-technical-requirements)
8. [Data Model](#8-data-model)
9. [API Specifications](#9-api-specifications)
10. [UI/UX Requirements](#10-uiux-requirements)
11. [Implementation Phases](#11-implementation-phases)
12. [Acceptance Criteria](#12-acceptance-criteria)
13. [Dependencies & Risks](#13-dependencies--risks)
14. [Appendices](#14-appendices)

---

## 1. Executive Summary

### 1.1 Vision

Transform the AR Manager Dashboard from a static reporting interface into a **Revenue Command Center** — a FigJam-style collaborative canvas where customer records, invoices, receipts, and aging data become "Living Cards" that update in real-time, enabling proactive cash collection and customer relationship management.

### 1.2 The AR Revenue Flow

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   AR-01      │    │   AR-02      │    │   AR-03      │    │   AR-04      │    │   AR-05      │
│  Customer    │───▶│   Sales      │───▶│  Receipt     │───▶│  Credit      │───▶│  AR Aging    │
│   Master     │    │  Invoice     │    │ Processing   │    │   Note       │    │ & Collection │
│              │    │              │    │              │    │              │    │              │
│ Onboard →    │    │ Bill →      │    │ Collect →    │    │ Adjust →     │    │ Monitor →    │
│   Approve    │    │   Post      │    │   Allocate   │    │   Apply      │    │   Collect    │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

### 1.3 Key Features

| Feature | Description | Business Value |
|---------|-------------|----------------|
| **Cell Dashboards** | Each AR cell (01-05) gets its own health dashboard | Granular observability |
| **AR Manager Dashboard** | Cluster-level aggregate view across all cells | CFO-ready revenue insights |
| **Hydrated Stickies** | Customer/Invoice records as live canvas objects | Real-time visibility |
| **Collection Zones** | Visual workflow for aging buckets and collection actions | Accelerated cash collection |
| **Pre-Flight Gate** | Mandatory acknowledgment of overdue accounts | Revenue protection |
| **Team Collaboration** | Shared whiteboard with reactions for AR team | Coordinated collection effort |

### 1.4 Scope

| In Scope | Out of Scope |
|----------|--------------|
| AR-01 through AR-05 cell dashboards | Other finance domains (AP, GL) |
| AR Manager cluster dashboard | Mobile app (Phase 2) |
| Team layer canvas | Video/voice collaboration |
| Collection workflow zones | AI-powered collection recommendations (Phase 3) |
| Aging visualization | External CRM integrations |

---

## 2. Problem Statement

### 2.1 Current State

The existing AR system provides:
- ✅ Robust backend services (AR-01 to AR-05)
- ✅ API endpoints for CRUD operations
- ✅ Aging report generation
- ❌ **No cell-level observability** — Cannot see health of individual cells
- ❌ **No cluster-level view** — No aggregate AR domain dashboard
- ❌ **Static aging reports** — No real-time collection tracking
- ❌ **No collaborative workspace** — Team cannot coordinate collection efforts
- ❌ **No visual workflow** — Collection stages hidden in tables

### 2.2 Pain Points

| Stakeholder | Pain Point |
|-------------|------------|
| **AR Officers** | Cannot see overdue accounts across customers in one view |
| **Collection Managers** | No visibility into collection bottlenecks or team assignments |
| **CFO/Controllers** | Cannot assess DSO and cash position at a glance |
| **Auditors** | Difficult to trace credit decisions and write-off approvals |
| **Team Members** | No way to flag at-risk customers or discuss collection strategies |

### 2.3 Opportunity

By creating a "Lively Layer" that bridges static AR data with an interactive canvas, we can:
- Reduce Days Sales Outstanding (DSO) by **15%**
- Improve collection rate on 90+ day accounts by **25%**
- Provide auditors with complete credit decision trails
- Enable visual workflow for collection escalation

---

## 3. Goals & Success Metrics

### 3.1 Business Goals

| Goal | Target | Measurement |
|------|--------|-------------|
| **Reduce DSO** | -15% | Average Days Sales Outstanding |
| **Improve collection rate** | +25% | Recovery rate on 90+ day accounts |
| **Increase audit efficiency** | -50% | Time to trace credit decisions |
| **Enhance team coordination** | +40% | Cross-team collection communication |

### 3.2 Technical Goals

| Goal | Target | Measurement |
|------|--------|-------------|
| **Dashboard load time** | <500ms | P95 latency |
| **Real-time update latency** | <200ms | WebSocket message delivery |
| **Canvas render performance** | 60 FPS | With 500+ objects |
| **Zero data loss** | 100% | Audit trail completeness |

### 3.3 Success Metrics (KPIs)

| KPI | Baseline | Target | Timeline |
|-----|----------|--------|----------|
| Daily active users (canvas) | 0 | 80% of AR team | Q1 2026 |
| Items moved via collection zones | 0 | 300/week | Q1 2026 |
| Pre-flight acknowledgment rate | N/A | 95% within 1 hour | Q1 2026 |
| Overdue account flags per day | 0 | 30+ | Q2 2026 |

---

## 4. User Personas

### 4.1 AR Officer (Primary)

| Attribute | Description |
|-----------|-------------|
| **Role** | Day-to-day invoice processing and receipt allocation |
| **Goals** | Process invoices efficiently, maximize collections, meet targets |
| **Frustrations** | Switching between screens, missing overdue accounts |
| **Canvas Use** | Move items through collection zones, flag at-risk accounts |

### 4.2 Collection Manager (Primary)

| Attribute | Description |
|-----------|-------------|
| **Role** | Oversee collection team, escalate difficult accounts, approve credit notes |
| **Goals** | Minimize bad debt, optimize collection strategy, team efficiency |
| **Frustrations** | No visibility into aging trends, scattered customer information |
| **Canvas Use** | Monitor collection zones, acknowledge overdue items, assign accounts |

### 4.3 CFO/Controller (Secondary)

| Attribute | Description |
|-----------|-------------|
| **Role** | Financial oversight, cash management, revenue assurance |
| **Goals** | Accurate cash forecasting, DSO improvement, audit readiness |
| **Frustrations** | Delayed reporting, lack of real-time visibility |
| **Canvas Use** | View cluster dashboard, review collection health |

### 4.4 Auditor (Secondary)

| Attribute | Description |
|-----------|-------------|
| **Role** | Verify compliance, trace credit/write-off decisions |
| **Goals** | Complete audit trails, evidence of SoD controls |
| **Frustrations** | Missing "why" behind credit decisions |
| **Canvas Use** | Query acknowledgment history, review credit note approvals |

---

## 5. User Stories

### 5.1 Cell Dashboards (Epic: LIVELY-AR-DASH)

```
LIVELY-AR-DASH-01: View Cell Health
AS AN AR Manager
I WANT TO see health metrics for each AR cell (01-05)
SO THAT I can identify which cell needs attention

Acceptance Criteria:
- Each cell displays health score (0-100)
- Status indicator: healthy/warning/critical
- Open items count and key metric
- Click navigates to cell detail page
```

```
LIVELY-AR-DASH-02: View AR Cluster Dashboard
AS A CFO
I WANT TO see an aggregate view of all AR cells
SO THAT I can assess overall O2C (Order-to-Cash) health at a glance

Acceptance Criteria:
- Overall cluster health score
- DSO (Days Sales Outstanding) metric
- Aging distribution summary
- Collection rate indicators
- Cell health cards (clickable)
```

```
LIVELY-AR-DASH-03: View Aging Waterfall
AS AN AR Manager
I WANT TO see aging buckets visualized as a waterfall
SO THAT I can prioritize collection efforts

Acceptance Criteria:
- Buckets: Current, 1-30, 31-60, 61-90, 91-120, 120+ days
- Amount and count per bucket
- Color-coded by severity
- Drill-down to customer/invoice list
```

### 5.2 Hydrated Stickies (Epic: LIVELY-AR-STICKY)

```
LIVELY-AR-STICKY-01: Create Sticky from Customer
AS AN AR Officer
I WANT TO drag a customer record onto the canvas
SO THAT I can visually track collection status

Acceptance Criteria:
- Drag from entity list to canvas
- Sticky displays: customer code, name, outstanding balance, aging
- Sticky has unique sourceRef (URN)
- Border color matches risk level (low/medium/high)
```

```
LIVELY-AR-STICKY-02: Create Sticky from Invoice
AS AN AR Officer
I WANT TO drag an overdue invoice onto the canvas
SO THAT I can track collection progress

Acceptance Criteria:
- Sticky displays: invoice number, customer, amount, days overdue
- Due date urgency indicator (soon/overdue/critical)
- Status color matches invoice status
- Link to invoice detail page
```

```
LIVELY-AR-STICKY-03: Real-Time Payment Update
AS AN AR Officer
I WANT TO see sticky update when payment is received
SO THAT I have real-time visibility without refresh

Acceptance Criteria:
- WebSocket subscription to payment events
- Sticky pulses/glows on payment received
- Outstanding amount updates automatically
- Toast notification shows payment details
```

### 5.3 Collection Zones (Epic: LIVELY-AR-ZONE)

```
LIVELY-AR-ZONE-01: Collection Workflow Zones
AS AN AR Manager
I WANT TO have preset collection workflow zones
SO THAT my team can visualize collection stages

Acceptance Criteria:
- Default zones: Follow-Up, Reminder Sent, Escalated, Payment Promised, Disputed, Write-Off Review
- Drag invoice/customer to zone updates collection status
- Audit event logged with actor and notes
- Zone-based filtering and sorting
```

```
LIVELY-AR-ZONE-02: Aging Bucket Zones
AS A Collection Manager
I WANT TO see aging buckets as visual zones
SO THAT I can prioritize by days overdue

Acceptance Criteria:
- Auto-populated zones: Current, 1-30, 31-60, 61-90, 91-120, 120+
- Invoices auto-move as aging changes
- Color intensity increases with age
- Amount totals displayed per zone
```

```
LIVELY-AR-ZONE-03: Zone Trigger for Dunning
AS AN AR System
I WANT TO trigger dunning letter when invoice moves to zone
SO THAT collection actions are automated

Acceptance Criteria:
- Zone "Reminder Sent" triggers dunning workflow
- Configurable dunning letter template
- Audit log captures trigger event
- Customer communication history updated
```

### 5.4 Pre-Flight Gate (Epic: LIVELY-AR-GATE)

```
LIVELY-AR-GATE-01: Critical Account Alert
AS A System
I WANT TO require users to acknowledge high-risk accounts
SO THAT significant overdue amounts are not missed

Acceptance Criteria:
- Login shows critical accounts (120+ days or >$50K overdue)
- User must acknowledge each before proceeding
- Acknowledgment logged with timestamp and comment
- CFO notified of unacknowledged items after 4 hours
```

```
LIVELY-AR-GATE-02: Credit Limit Breach Alert
AS A System
I WANT TO alert when customer exceeds credit limit
SO THAT new orders can be reviewed

Acceptance Criteria:
- Customers over credit limit flagged as hard-stop
- Sales team blocked from new orders until acknowledged
- Credit review workflow initiated
- Limit increase request option available
```

### 5.5 Team Collaboration (Epic: LIVELY-AR-TEAM)

```
LIVELY-AR-TEAM-01: Collection Notes
AS AN AR Officer
I WANT TO add notes to customer stickies
SO THAT my team knows collection history

Acceptance Criteria:
- Add freeform notes to any sticky
- Notes visible to all team members
- Timestamp and author recorded
- Searchable across canvas
```

```
LIVELY-AR-TEAM-02: Risk Flagging
AS AN AR Officer
I WANT TO flag customers with risk indicators
SO THAT my team is aware of collection concerns

Acceptance Criteria:
- Available reactions: 🚩 (risk) ⚠️ (warning) 💬 (needs discussion) 💰 (payment expected) ✅ (resolved)
- 🚩 increases priority score by 25
- Reactions sync via WebSocket
- Flag history preserved for audit
```

---

## 6. Functional Requirements

### 6.1 Cell Dashboard Services

| Cell | Dashboard Service | Key Metrics |
|------|-------------------|-------------|
| **AR-01** | CustomerDashboardService | Pending approvals, credit limit utilization, risk distribution |
| **AR-02** | InvoiceDashboardService | Open invoices, posting backlog, duplicate detection |
| **AR-03** | ReceiptDashboardService | Unallocated receipts, allocation rate, bank reconciliation |
| **AR-04** | CreditNoteDashboardService | Pending approvals, unapplied credits, reversal tracking |
| **AR-05** | AgingDashboardService | DSO, aging distribution, collection rate, bad debt reserve |

### 6.2 AR Manager Dashboard

| Metric | Source | Calculation |
|--------|--------|-------------|
| Cluster Health Score | All cells | Weighted average of cell scores |
| Days Sales Outstanding | AR-05 | Receivables ÷ (Annual Revenue ÷ 365) |
| Open Receivables | AR-02 + AR-03 | Sum of outstanding invoices |
| Collection Rate | AR-03 | Receipts collected ÷ Due this period |
| Bad Debt Ratio | AR-05 | Write-offs ÷ Total billed |

### 6.3 Canvas Objects

| Object Type | Description | Properties |
|-------------|-------------|------------|
| `customer_sticky` | Bound to customer entity | sourceRef, outstandingBalance, creditLimit, riskLevel |
| `invoice_sticky` | Bound to invoice entity | sourceRef, amount, dueDate, daysOverdue |
| `receipt_sticky` | Bound to receipt entity | sourceRef, amount, unallocated |
| `aging_card` | Customer aging summary | bucketAmounts, oldestInvoice, collectionStatus |
| `zone` | Collection workflow area | bounds, triggerAction |

### 6.4 Layer Architecture

| Layer | Z-Index | Visibility | Editability |
|-------|---------|------------|-------------|
| Data | 0-50 | All users | Read-only (system) |
| Team | 100-200 | All users | Role-based |
| Personal | 300-400 | Owner only | Owner only |

### 6.5 Collection Zones

| Zone Type | Trigger Action | Backend Effect |
|-----------|----------------|----------------|
| Follow-Up | notify | Create follow-up task |
| Reminder Sent | dunning_trigger | Send dunning letter, log event |
| Escalated | escalate | Notify manager, create case |
| Payment Promised | status_update | Set promise-to-pay date |
| Disputed | status_update | Create dispute record |
| Write-Off Review | approval_required | Route to CFO for write-off approval |

### 6.6 Pre-Flight Rules (AR-Specific)

| Condition | Gate Type | User Action |
|-----------|-----------|-------------|
| Customer 120+ days overdue | Hard Stop | Must acknowledge individually |
| Invoice >$50K overdue | Hard Stop | Must acknowledge with comment |
| Customer over credit limit | Soft Stop | Can "acknowledge all" |
| Unallocated receipts >7 days | Informational | Highlighted, no gate |

---

## 7. Technical Requirements

### 7.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Next.js 15)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │  Cell Dashboard │  │  Canvas Layer   │  │  Pre-Flight     │             │
│  │  Components     │  │  Components     │  │  Gate           │             │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘             │
│           │                    │                    │                       │
│           └────────────────────┼────────────────────┘                       │
│                                │                                             │
│  ┌─────────────────────────────┴─────────────────────────────────────────┐ │
│  │                         React Hooks Layer                              │ │
│  │  useDashboard │ useCanvas │ useWebSocket │ usePreFlight │ useAging   │ │
│  └─────────────────────────────┬─────────────────────────────────────────┘ │
└────────────────────────────────┼────────────────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│   REST API      │   │   WebSocket     │   │   Canvas API    │
│   /api/ar/*     │   │   Socket.io     │   │   /api/canvas/* │
└────────┬────────┘   └────────┬────────┘   └────────┬────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────────────────────┐
│                            BACKEND SERVICES                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Cell        │  │ Canvas      │  │ Zone        │  │ Pre-Flight  │        │
│  │ Dashboard   │  │ Object      │  │ Trigger     │  │ Gate        │        │
│  │ Services    │  │ Service     │  │ Service     │  │ Service     │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │                │
│         └────────────────┴────────────────┴────────────────┘                │
│                                   │                                          │
│  ┌────────────────────────────────┴────────────────────────────────────┐   │
│  │                         Kernel Core (Ports)                          │   │
│  │  CustomerRepo │ InvoiceRepo │ ReceiptRepo │ AuditPort │ AgingRepo   │   │
│  └────────────────────────────────┬────────────────────────────────────┘   │
└───────────────────────────────────┼─────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           POSTGRESQL + REDIS                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ AR Tables    │  │ Canvas       │  │ Audit        │  │ Redis        │    │
│  │ (existing)   │  │ Tables       │  │ Tables       │  │ (WebSocket)  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Frontend Framework | Next.js | 15.x |
| UI Components | Shadcn/ui + BioSkin | Latest |
| State Management | React Query + Zustand | 5.x / 4.x |
| Canvas Rendering | React + CSS (MVP), Canvas/WebGL (Phase 5) | — |
| WebSocket | Socket.io | 4.x |
| Backend | Next.js API Routes + Cell Services | 15.x |
| Database | PostgreSQL | 15+ |
| Cache/PubSub | Redis | 7.x |
| CRDT (Phase 5) | Yjs | 13.x |

### 7.3 Performance Requirements

| Metric | Requirement | Measurement |
|--------|-------------|-------------|
| Dashboard load | <500ms | P95 cold load |
| Aging snapshot | <2s | Full regeneration |
| WebSocket latency | <200ms | Payment notification |
| API response | <200ms | P95 response time |
| Canvas FPS | 60 FPS | With 500 objects |
| Concurrent users | 100+ | Per tenant |

### 7.4 Security Requirements

| Requirement | Implementation |
|-------------|----------------|
| Authentication | Session-based (existing) |
| Authorization | RBAC per layer/action |
| Tenant Isolation | RLS on all canvas tables |
| Credit Decisions | SoD enforced in backend |
| Audit Trail | Immutable canvas_audit_log |
| PII Protection | Customer data encrypted at rest |

---

## 8. Data Model

### 8.1 URN Specification (AR Domain)

```
Format: urn:aibos:ar:{cell}:{entity}:{uuid}

Examples:
  urn:aibos:ar:01:customer:550e8400-e29b-41d4-a716-446655440001
  urn:aibos:ar:02:invoice:8f14e45f-ceea-46ed-a8b2-0ba60a3e01c3
  urn:aibos:ar:03:receipt:7c9e6679-7425-40de-944b-e07fc1f90ae7
  urn:aibos:ar:04:creditnote:a87ff679-a2f3-4c94-a1f7-d1d8e0f21f7b
  urn:aibos:ar:05:aging:e4d909c2-9022-4d1d-8b22-1f6d9c3f1c0a

Grammar:
  URN     = "urn:aibos:ar:" CELL ":" ENTITY ":" UUID
  CELL    = "01" | "02" | "03" | "04" | "05"
  ENTITY  = "customer" | "invoice" | "receipt" | "creditnote" | "aging"
  UUID    = <RFC 4122 UUID>
```

### 8.2 AR-Specific Canvas Tables

```sql
-- ============================================================================
-- AR COLLECTION ACTIONS (extension to canvas_objects)
-- ============================================================================

CREATE TABLE ar_collection_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_object_id UUID NOT NULL REFERENCES canvas_objects(id),
  customer_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  action_type VARCHAR(30) NOT NULL CHECK (action_type IN (
    'phone_call', 'email_sent', 'letter_sent', 'payment_promised',
    'dispute_opened', 'dispute_resolved', 'escalated', 'write_off_requested'
  )),
  
  action_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  follow_up_date DATE,
  promise_amount NUMERIC(15, 2),
  promise_date DATE,
  
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ar_collection_customer ON ar_collection_actions(customer_id, created_at DESC);

-- ============================================================================
-- AR AGING SNAPSHOTS (for canvas visualization)
-- ============================================================================

CREATE TABLE ar_canvas_aging_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  snapshot_date DATE NOT NULL,
  
  total_receivables NUMERIC(15, 2) NOT NULL,
  current_amount NUMERIC(15, 2) NOT NULL,
  days_1_30 NUMERIC(15, 2) NOT NULL,
  days_31_60 NUMERIC(15, 2) NOT NULL,
  days_61_90 NUMERIC(15, 2) NOT NULL,
  days_91_120 NUMERIC(15, 2) NOT NULL,
  over_120_days NUMERIC(15, 2) NOT NULL,
  
  dso_days NUMERIC(5, 1) NOT NULL,
  collection_rate NUMERIC(5, 2) NOT NULL,
  
  customer_count INTEGER NOT NULL,
  invoice_count INTEGER NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(tenant_id, snapshot_date)
);
```

---

## 9. API Specifications

### 9.1 Cell Dashboard APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ar/customers/dashboard` | GET | AR-01 customer metrics |
| `/api/ar/invoices/dashboard` | GET | AR-02 invoice metrics |
| `/api/ar/receipts/dashboard` | GET | AR-03 receipt metrics |
| `/api/ar/creditnotes/dashboard` | GET | AR-04 credit note metrics |
| `/api/ar/aging/dashboard` | GET | AR-05 aging metrics |
| `/api/ar/manager/dashboard` | GET | Cluster aggregate metrics |

### 9.2 AR-Specific Canvas APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ar/canvas/collection-actions` | POST | Log collection action |
| `/api/ar/canvas/aging-waterfall` | GET | Aging visualization data |
| `/api/ar/canvas/customer-zones` | GET | Customers by collection zone |
| `/api/ar/canvas/dunning/trigger` | POST | Trigger dunning for zone |

### 9.3 WebSocket Events (AR-Specific)

| Event | Direction | Payload |
|-------|-----------|---------|
| `payment_received` | Server → Client | `{ customerId, invoiceId, amount, receiptNumber }` |
| `invoice_posted` | Server → Client | `{ invoiceId, customerId, amount }` |
| `aging_updated` | Server → Client | `{ customerId, newBucket, oldBucket }` |
| `credit_approved` | Server → Client | `{ creditNoteId, customerId, amount }` |
| `collection_action` | Server ↔ Client | `{ customerId, actionType, notes }` |

---

## 10. UI/UX Requirements

### 10.1 AR Manager Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  HEADER: AR Manager  │  [Cluster Health: 91%]  │  DSO: 42 days  │  [Refresh]│
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  CLUSTER METRICS ROW                                                    │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐               │ │
│  │  │ Total AR │  │ DSO      │  │Collection│  │ Overdue  │               │ │
│  │  │ $2.4M    │  │ 42 days  │  │ Rate:87% │  │ $380K    │               │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘               │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  AGING WATERFALL                                                        │ │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │ │
│  │  │CURRENT │ │ 1-30   │ │ 31-60  │ │ 61-90  │ │ 91-120 │ │ 120+   │   │ │
│  │  │ $1.2M  │ │ $450K  │ │ $320K  │ │ $180K  │ │ $120K  │ │ $130K  │   │ │
│  │  │████████│ │███████ │ │██████  │ │████    │ │███     │ │███     │   │ │
│  │  │ green  │ │ yellow │ │ orange │ │  red   │ │ dark   │ │ dark   │   │ │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  CELL HEALTH CARDS (clickable)                                          │ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │ │
│  │  │ AR-01   │  │ AR-02   │  │ AR-03   │  │ AR-04   │  │ AR-05   │      │ │
│  │  │Customer │  │ Invoice │  │ Receipt │  │ Credit  │  │ Aging   │      │ │
│  │  │ ✅ 95%  │  │ ✅ 89%  │  │ ⚠️ 78%  │  │ ✅ 92%  │  │ ⚠️ 81%  │      │ │
│  │  │ 15 pend │  │ 234 open│  │ $45K un │  │ 8 pend  │  │ 28 risk │      │ │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  COLLECTION CANVAS (Lively Layer)                                       │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │ │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │   │ │
│  │  │  │FOLLOW-UP│  │REMINDER │  │ESCALATED│  │ PAYMENT │ ← Zones    │   │ │
│  │  │  │┌───────┐│  │┌───────┐│  │┌───────┐│  │┌───────┐│            │   │ │
│  │  │  ││CUST-01││  ││INV-05 ││  ││CUST-03││  ││CUST-02││ ← Stickies │   │ │
│  │  │  ││🚩$25K ││  ││⚠️$8K  ││  ││💬$45K ││  ││💰$12K ││            │   │ │
│  │  │  │└───────┘│  │└───────┘│  │└───────┘│  │└───────┘│            │   │ │
│  │  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘            │   │ │
│  │  └─────────────────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Customer Sticky Component

```
┌────────────────────────────┐
│ CUST-2024-0089        [📌] │ ← Pinned indicator
├────────────────────────────┤
│ GlobalTech Industries      │ ← Customer name
│ Outstanding: $125,000      │ ← Total outstanding
├────────────────────────────┤
│ Risk: HIGH ████████████    │ ← Risk level indicator
│ Credit Used: 85% of $150K  │ ← Credit utilization
├────────────────────────────┤
│ Aging:                     │
│ 🟢 Current  $50K           │
│ 🟡 1-30     $25K           │
│ 🟠 31-60    $20K           │
│ 🔴 61-90    $30K           │ ← Breakdown by bucket
├────────────────────────────┤
│ Last Contact: Dec 15 (2d)  │ ← Collection activity
│ 🚩2  💬1  💰0               │ ← Reaction counts
│ [+ Add Action]             │
└────────────────────────────┘
```

### 10.3 Design System Tokens (AR-Specific)

| Token | Value | Usage |
|-------|-------|-------|
| `--ar-bg-customer` | `#FEF3C7` | Customer sticky background |
| `--ar-bg-invoice` | `#DBEAFE` | Invoice sticky background |
| `--ar-bg-receipt` | `#D1FAE5` | Receipt sticky background |
| `--ar-bg-creditnote` | `#FCE7F3` | Credit note sticky background |
| `--ar-aging-current` | `#10B981` | Current bucket (green) |
| `--ar-aging-30` | `#F59E0B` | 1-30 days (amber) |
| `--ar-aging-60` | `#F97316` | 31-60 days (orange) |
| `--ar-aging-90` | `#EF4444` | 61-90 days (red) |
| `--ar-aging-120` | `#B91C1C` | 91-120 days (dark red) |
| `--ar-aging-over` | `#7F1D1D` | 120+ days (darkest red) |

---

## 11. Implementation Phases

### 11.1 Phase Overview

| Phase | Focus | Duration | Deliverables |
|-------|-------|----------|--------------|
| **Phase 1** | Foundation | 2 weeks | DB schema, CRUD API, basic UI |
| **Phase 2** | Collection Zones | 1 week | Drag-to-zone, dunning triggers |
| **Phase 3** | Pre-Flight Gate | 1 week | Overdue alerts, acknowledgment |
| **Phase 4** | Team Collaboration | 1 week | WebSocket sync, reactions |
| **Phase 5** | Polish | 2 weeks | Personal layer, aging waterfall |

### 11.2 Phase 1: Foundation (Week 1-2)

| Task | Owner | Status |
|------|-------|--------|
| Create AR canvas database tables | Backend | ✅ COMPLETE |
| Implement URN parser utility for AR | Backend | ✅ COMPLETE |
| Create entity transformers (AR-01 to AR-05) | Backend | ✅ COMPLETE |
| Canvas object CRUD API | Backend | ✅ COMPLETE |
| CustomerDashboardService (AR-01) | Backend | ✅ COMPLETE |
| InvoiceDashboardService (AR-02) | Backend | ✅ COMPLETE |
| ReceiptDashboardService (AR-03) | Backend | ✅ COMPLETE |
| CreditNoteDashboardService (AR-04) | Backend | ✅ COMPLETE |
| AgingDashboardService (AR-05) | Backend | ✅ COMPLETE |
| AR Manager cluster dashboard | Backend | ✅ COMPLETE |
| Cell health card components | Frontend | 📋 TODO |
| AR Manager page layout | Frontend | 📋 TODO |

### 11.3 Phase 2: Collection Zones (Week 3)

| Task | Owner | Status |
|------|-------|--------|
| Collection zone configuration | Backend | 📋 TODO |
| Zone trigger service for AR | Backend | 📋 TODO |
| Dunning letter integration | Backend | 📋 TODO |
| Collection action logging | Backend | 📋 TODO |
| Zone component with drop target | Frontend | 📋 TODO |
| Collection notes UI | Frontend | 📋 TODO |

### 11.4 Phase 3: Pre-Flight Gate (Week 4)

| Task | Owner | Status |
|------|-------|--------|
| Overdue priority scoring | Backend | 📋 TODO |
| Credit limit breach detection | Backend | 📋 TODO |
| Pre-flight status API | Backend | 📋 TODO |
| Pre-flight gate component | Frontend | 📋 TODO |
| Acknowledgment form | Frontend | 📋 TODO |

### 11.5 Phase 4: Team Collaboration (Week 5)

| Task | Owner | Status |
|------|-------|--------|
| WebSocket payment notifications | Backend | 📋 TODO |
| Real-time aging updates | Backend | 📋 TODO |
| Collection reaction service | Backend | 📋 TODO |
| Real-time sticky updates | Frontend | 📋 TODO |
| Risk flagging UI | Frontend | 📋 TODO |

### 11.6 Phase 5: Polish (Week 6-7)

| Task | Owner | Status |
|------|-------|--------|
| Aging waterfall visualization | Backend | 📋 TODO |
| DSO trend calculation | Backend | 📋 TODO |
| Aging waterfall component | Frontend | 📋 TODO |
| Customer detail drill-down | Frontend | 📋 TODO |
| End-to-end testing | QA | 📋 TODO |

---

## 12. Acceptance Criteria

### 12.1 Phase 1 Acceptance

- [ ] Canvas objects can be created for customers, invoices, receipts
- [ ] Objects display correctly with AR-specific data (outstanding, aging, risk)
- [ ] Cell dashboards return health metrics for all 5 cells
- [ ] AR Manager dashboard shows DSO, aging distribution, collection rate
- [ ] Cell cards are clickable and navigate to cell detail pages
- [ ] Unit tests pass with >80% coverage

### 12.2 Phase 2 Acceptance

- [ ] Collection zones display with correct names and colors
- [ ] Dragging customer/invoice to zone updates collection status
- [ ] Dunning letter triggered when entering "Reminder Sent" zone
- [ ] Audit log records all collection actions with actor and notes

### 12.3 Phase 3 Acceptance

- [ ] Pre-flight gate blocks navigation for 120+ day overdue accounts
- [ ] Credit limit breaches flagged as hard-stop items
- [ ] Acknowledgments logged with timestamp and comment
- [ ] CFO notification sent for unacknowledged items

### 12.4 Phase 4 Acceptance

- [ ] Payment received updates customer sticky in real-time
- [ ] Aging bucket changes reflected immediately
- [ ] Risk flags visible to all team members
- [ ] Collection notes sync across users

### 12.5 Phase 5 Acceptance

- [ ] Aging waterfall displays with correct bucket colors
- [ ] DSO trend shows historical comparison
- [ ] Click bucket drills into customer/invoice list
- [ ] Performance: Dashboard loads in <500ms

---

## 13. Dependencies & Risks

### 13.1 Dependencies

| Dependency | Type | Owner | Status |
|------------|------|-------|--------|
| AR-01 to AR-05 services | Backend | Finance Team | ✅ Complete |
| Canvas infrastructure (shared with AP) | Backend | Platform Team | ✅ Available |
| Kernel AuditPort | Backend | Platform Team | ✅ Available |
| Dunning letter templates | Business | AR Team | 📋 TODO |
| Design system tokens | Frontend | Design Team | 📋 TODO |

### 13.2 Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Large customer count (10K+) | Medium | Medium | Pagination, virtualization |
| Complex aging calculations | Low | Low | Snapshot-based approach |
| Dunning integration delays | Medium | Medium | Manual trigger fallback |
| User adoption | High | Low | Training, gradual rollout |

---

## 14. Appendices

### Appendix A: AR Status Colors

```typescript
export const AR_STATUS_COLORS = {
  customer: {
    draft: '#94A3B8',           // Slate
    submitted: '#3B82F6',       // Blue
    approved: '#10B981',        // Emerald
    suspended: '#6B7280',       // Gray
    archived: '#4B5563',        // Dark gray
  },
  invoice: {
    draft: '#94A3B8',           // Slate
    submitted: '#3B82F6',       // Blue
    approved: '#8B5CF6',        // Violet
    posted: '#14B8A6',          // Teal
    paid: '#22C55E',            // Green
    voided: '#EF4444',          // Red
  },
  receipt: {
    draft: '#94A3B8',           // Slate
    submitted: '#3B82F6',       // Blue
    approved: '#10B981',        // Emerald
    posted: '#14B8A6',          // Teal
    reversed: '#EF4444',        // Red
  },
  creditnote: {
    draft: '#94A3B8',           // Slate
    submitted: '#3B82F6',       // Blue
    approved: '#10B981',        // Emerald
    posted: '#14B8A6',          // Teal
    applied: '#22C55E',         // Green
  },
  collection: {
    current: '#10B981',         // Green
    follow_up: '#F59E0B',       // Amber
    escalated: '#EF4444',       // Red
    promised: '#3B82F6',        // Blue
    disputed: '#8B5CF6',        // Violet
  },
};
```

### Appendix B: AR Priority Scoring

```typescript
export function calculateARPriorityScore(factors: {
  outstandingAmountCents?: number;
  daysOverdue?: number;
  hasRedFlag?: boolean;
  isOverCreditLimit?: boolean;
  collectionActionCount?: number;
}): number {
  let score = 0;
  
  // Amount-based (0-30 points)
  const amount = factors.outstandingAmountCents ?? 0;
  if (amount >= 100_000_00) score += 30;      // $100K+
  else if (amount >= 50_000_00) score += 25;  // $50K+
  else if (amount >= 10_000_00) score += 15;  // $10K+
  else if (amount >= 1_000_00) score += 5;    // $1K+
  
  // Days overdue (0-30 points)
  const days = factors.daysOverdue ?? 0;
  if (days >= 120) score += 30;
  else if (days >= 90) score += 25;
  else if (days >= 60) score += 15;
  else if (days >= 30) score += 10;
  
  // Risk flags (0-25 points)
  if (factors.hasRedFlag) score += 20;
  if (factors.isOverCreditLimit) score += 25;
  
  // Collection history (0-15 points)
  const actions = factors.collectionActionCount ?? 0;
  if (actions === 0 && days > 30) score += 15; // No action taken
  
  return Math.min(score, 100);
}
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | Dec 2025 | Finance Team | Initial PRD |

---

**Last Updated:** December 2025  
**Maintainer:** Finance Cell Team  
**Status:** ✅ APPROVED FOR DEVELOPMENT
