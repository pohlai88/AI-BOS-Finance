# PRD: Lively Layer — AP Manager Canvas & Cell Dashboards

> **Document ID:** PRD-DOM03-LIVELY-LAYER  
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

Transform the AP Manager Dashboard from a static reporting interface into a **State-Aware Operating Environment** — a FigJam-style collaborative canvas where database records become "Living Cards" that update in real-time and can be manipulated through drag-and-drop workflows.

### 1.2 Key Features

| Feature | Description | Business Value |
|---------|-------------|----------------|
| **Cell Dashboards** | Each AP cell (01-05) gets its own health dashboard | Granular observability |
| **AP Manager Dashboard** | Cluster-level aggregate view across all cells | CFO-ready insights |
| **Hydrated Stickies** | Database records as live canvas objects | Real-time visibility |
| **Zone Triggers** | Drag-to-zone updates backend status | Workflow efficiency |
| **Pre-Flight Gate** | Mandatory acknowledgment of urgent items | Compliance & control |
| **Team Collaboration** | Shared whiteboard with reactions | Team coordination |

### 1.3 Scope

| In Scope | Out of Scope |
|----------|--------------|
| AP-01 through AP-05 cell dashboards | Other finance domains (AR, GL) |
| AP Manager cluster dashboard | Mobile app (Phase 2) |
| Team layer canvas | Video/voice collaboration |
| Pre-flight gatekeeper | AI-powered recommendations (Phase 3) |
| Zone trigger workflows | External calendar integrations |

---

## 2. Problem Statement

### 2.1 Current State

The existing AP system provides:
- ✅ Robust backend services (AP-01 to AP-05)
- ✅ API endpoints for CRUD operations
- ✅ Payment Hub dashboard with metrics
- ❌ **No cell-level observability** — Cannot see health of individual cells
- ❌ **No cluster-level view** — No aggregate AP domain dashboard
- ❌ **Static data display** — No real-time updates
- ❌ **No collaborative workspace** — Team cannot annotate or discuss items
- ❌ **No workflow visualization** — Status changes hidden in tables

### 2.2 Pain Points

| Stakeholder | Pain Point |
|-------------|------------|
| **AP Officers** | Cannot see pending items across cells in one view |
| **AP Managers** | No visibility into bottlenecks or team workload |
| **CFO/Controllers** | Cannot assess overall AP health at a glance |
| **Auditors** | Difficult to understand "why" decisions were made |
| **Team Members** | No way to flag or discuss suspicious items visually |

### 2.3 Opportunity

By creating a "Lively Layer" that bridges static data with an interactive canvas, we can:
- Reduce time-to-action on urgent items by **40%**
- Improve team coordination with visual collaboration
- Provide auditors with complete decision trails
- Enable workflow automation through zone triggers

---

## 3. Goals & Success Metrics

### 3.1 Business Goals

| Goal | Target | Measurement |
|------|--------|-------------|
| **Reduce AP cycle time** | -20% | Days from invoice entry to payment |
| **Improve exception resolution** | -30% | Time to resolve match exceptions |
| **Increase audit efficiency** | -50% | Time to trace decision history |
| **Enhance team collaboration** | +40% | Cross-team communication on items |

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
| Daily active users (canvas) | 0 | 80% of AP team | Q1 2026 |
| Items moved via zone triggers | 0 | 500/week | Q1 2026 |
| Pre-flight acknowledgment rate | N/A | 95% within 1 hour | Q1 2026 |
| Team reactions per day | 0 | 50+ | Q2 2026 |

---

## 4. User Personas

### 4.1 AP Officer (Primary)

| Attribute | Description |
|-----------|-------------|
| **Role** | Day-to-day invoice processing and payment preparation |
| **Goals** | Process invoices efficiently, avoid errors, meet deadlines |
| **Frustrations** | Switching between screens, missing urgent items |
| **Canvas Use** | Move items through workflow zones, flag issues |

### 4.2 AP Manager (Primary)

| Attribute | Description |
|-----------|-------------|
| **Role** | Oversee AP team, approve high-value items, manage exceptions |
| **Goals** | Ensure SLA compliance, minimize exceptions, team efficiency |
| **Frustrations** | No visibility into bottlenecks, scattered information |
| **Canvas Use** | Monitor team zones, acknowledge urgent items, create notes |

### 4.3 CFO/Controller (Secondary)

| Attribute | Description |
|-----------|-------------|
| **Role** | Financial oversight, cash management, compliance |
| **Goals** | Accurate forecasting, control assurance, audit readiness |
| **Frustrations** | Delayed reporting, lack of real-time visibility |
| **Canvas Use** | View cluster dashboard, review control health |

### 4.4 Auditor (Secondary)

| Attribute | Description |
|-----------|-------------|
| **Role** | Verify compliance, trace decision history |
| **Goals** | Complete audit trails, evidence of controls |
| **Frustrations** | Missing "why" behind decisions |
| **Canvas Use** | Query acknowledgment history, review flags |

---

## 5. User Stories

### 5.1 Cell Dashboards (Epic: LIVELY-DASH)

```
LIVELY-DASH-01: View Cell Health
AS AN AP Manager
I WANT TO see health metrics for each AP cell (01-05)
SO THAT I can identify which cell needs attention

Acceptance Criteria:
- Each cell displays health score (0-100)
- Status indicator: healthy/warning/critical
- Open items count and key metric
- Click navigates to cell detail page
```

```
LIVELY-DASH-02: View AP Cluster Dashboard
AS A CFO
I WANT TO see an aggregate view of all AP cells
SO THAT I can assess overall P2P health at a glance

Acceptance Criteria:
- Overall cluster health score
- P2P cycle time metric
- Cash position summary
- Control health indicators
- Cell health cards (clickable)
```

```
LIVELY-DASH-03: Drill Down to Cell Detail
AS AN AP Manager
I WANT TO click a cell card and see detailed metrics
SO THAT I can understand the specific issues

Acceptance Criteria:
- Top half: Cell-specific dashboard metrics
- Bottom half: Actionable list of pending items
- Filters for status, age, amount
```

### 5.2 Hydrated Stickies (Epic: LIVELY-STICKY)

```
LIVELY-STICKY-01: Create Sticky from Entity
AS AN AP Officer
I WANT TO drag an invoice/payment onto the canvas
SO THAT I can visually track it in my workflow

Acceptance Criteria:
- Drag from entity list to canvas
- Sticky displays: title, vendor, amount, status
- Sticky has unique sourceRef (URN)
- Status color matches entity status
```

```
LIVELY-STICKY-02: Real-Time Status Update
AS AN AP Officer
I WANT TO see sticky status change when backend updates
SO THAT I have real-time visibility without refresh

Acceptance Criteria:
- WebSocket subscription to entity updates
- Sticky pulses/glows on status change
- Color updates to match new status
- Tooltip shows previous status
```

```
LIVELY-STICKY-03: Ghost State for Archived Records
AS AN AP Officer
I WANT TO see a visual indicator when source record is archived
SO THAT I know my annotation refers to historical data

Acceptance Criteria:
- Sticky becomes 50% opacity
- "Record Archived" icon overlay
- Annotations preserved
- Option to dismiss ghost sticky
```

### 5.3 Zone Triggers (Epic: LIVELY-ZONE)

```
LIVELY-ZONE-01: Move to Zone Updates Status
AS AN AP Officer
I WANT TO drag a payment sticky to "Done" zone
SO THAT the backend status automatically updates

Acceptance Criteria:
- Zone has configured trigger action
- Drag-drop triggers backend API call
- Audit event logged with actor and reason
- Sticky animates to confirm success
- Optimistic locking prevents race conditions
```

```
LIVELY-ZONE-02: Conflict Resolution
AS AN AP Officer
I WANT TO see when my move conflicts with another user
SO THAT I understand why my action didn't complete

Acceptance Criteria:
- Version mismatch detected
- Sticky "jiggles" to indicate failure
- Toast notification explains conflict
- Sticky returns to original position
- Can retry after refreshing state
```

```
LIVELY-ZONE-03: Zone-Based Notifications
AS AN AP Manager
I WANT TO be notified when items enter "Review" zone
SO THAT I can act on them promptly

Acceptance Criteria:
- Zone has "notify" trigger configured
- Notification sent to configured roles
- In-app notification + optional email
- Link to canvas with item highlighted
```

### 5.4 Pre-Flight Gate (Epic: LIVELY-GATE)

```
LIVELY-GATE-01: Mandatory Acknowledgment
AS A System
I WANT TO require users to acknowledge urgent items
SO THAT critical issues are not missed

Acceptance Criteria:
- Login redirects to AP Manager dashboard
- Urgent items (priority >= 80) block navigation
- User must acknowledge each hard-stop item
- Acknowledgment logged with timestamp and comment
```

```
LIVELY-GATE-02: Priority Scoring
AS A System
I WANT TO automatically calculate priority scores
SO THAT truly urgent items rise to the top

Acceptance Criteria:
- Score based on: amount, due date, flags, reactions
- Hard stop: priority >= 80
- Soft stop: priority >= 50
- Informational: priority >= 20
- Score recalculates on entity/reaction changes
```

```
LIVELY-GATE-03: Audit Trail for Acknowledgment
AS AN Auditor
I WANT TO query who acknowledged what and when
SO THAT I can verify compliance decisions

Acceptance Criteria:
- Acknowledgment table with FK to object
- Comment field for justification
- Link to kernel audit system
- Query API for audit reports
```

### 5.5 Team Collaboration (Epic: LIVELY-TEAM)

```
LIVELY-TEAM-01: Add Reactions
AS AN AP Officer
I WANT TO add emoji reactions to stickies
SO THAT I can flag items for my team

Acceptance Criteria:
- Click to open reaction picker
- Available reactions: 🚩⚠️👀✅❌💰🔥
- Reactions visible to all team members
- 🚩 increases priority score by 20
- Reactions sync via WebSocket
```

```
LIVELY-TEAM-02: Team Layer Sync
AS AN AP Team Member
I WANT TO see other users' sticky movements in real-time
SO THAT we stay coordinated

Acceptance Criteria:
- WebSocket broadcasts team layer changes
- Object creation/move/delete synced
- Optimistic UI with server confirmation
- Conflict resolution for simultaneous edits
```

```
LIVELY-TEAM-03: Personal Layer Privacy
AS AN AP Officer
I WANT TO have a private layer for my notes
SO THAT my draft thoughts are not visible to others

Acceptance Criteria:
- Personal layer filtered by user_id
- Only owner can view/edit
- Higher z-index than team layer
- Not included in team WebSocket broadcasts
```

---

## 6. Functional Requirements

### 6.1 Cell Dashboard Services

| Cell | Dashboard Service | Key Metrics |
|------|-------------------|-------------|
| **AP-01** | VendorDashboardService | Pending approvals, bank changes, risk distribution |
| **AP-02** | InvoiceDashboardService | Draft invoices, duplicate detection, period cutoff |
| **AP-03** | MatchDashboardService | Pass/fail rates, exception aging, override tracking |
| **AP-04** | ApprovalDashboardService | Approval queue, bottleneck analysis, SoD tracking |
| **AP-05** | PaymentDashboardService | Cash position, execution status, webhook health |

### 6.2 AP Manager Dashboard

| Metric | Source | Calculation |
|--------|--------|-------------|
| Cluster Health Score | All cells | Weighted average of cell scores |
| P2P Cycle Time | AP-01 → AP-05 | Median days vendor onboard to payment |
| Open Items | All cells | Sum of pending items |
| Control Violations | All cells | Count of SoD violations + exceptions |
| Cash Position | AP-05 | Scheduled outflows by period |

### 6.3 Canvas Objects

| Object Type | Description | Properties |
|-------------|-------------|------------|
| `hydrated_sticky` | Bound to database entity | sourceRef, displayData, style |
| `plain_sticky` | Unbound annotation | content, style |
| `zone` | Workflow area | bounds, triggerAction |
| `connector` | Line between objects | from, to, style |

### 6.4 Layer Architecture

| Layer | Z-Index | Visibility | Editability |
|-------|---------|------------|-------------|
| Data | 0-50 | All users | Read-only (system) |
| Team | 100-200 | All users | Role-based |
| Personal | 300-400 | Owner only | Owner only |

### 6.5 Zone Triggers

| Zone Type | Trigger Action | Backend Effect |
|-----------|----------------|----------------|
| Inbox | None | — |
| In Progress | status_update | Set to "processing" |
| Review | notify | Alert approvers |
| Done | status_update | Set to "completed" |
| Blocked | escalate | Create escalation ticket |

### 6.6 Pre-Flight Rules

| Priority Range | Gate Type | User Action |
|----------------|-----------|-------------|
| 80-100 | Hard Stop | Must acknowledge individually |
| 50-79 | Soft Stop | Can "acknowledge all" |
| 20-49 | Informational | Highlighted, no gate |
| 0-19 | Normal | No special treatment |

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
│  │  useDashboard │ useCanvas │ useWebSocket │ usePreFlight │ useReactions│ │
│  └─────────────────────────────┬─────────────────────────────────────────┘ │
└────────────────────────────────┼────────────────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│   REST API      │   │   WebSocket     │   │   Canvas API    │
│   /api/ap/*     │   │   Socket.io     │   │   /api/canvas/* │
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
│  │  PaymentRepo │ InvoiceRepo │ VendorRepo │ AuditPort │ PolicyPort    │   │
│  └────────────────────────────────┬────────────────────────────────────┘   │
└───────────────────────────────────┼─────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           POSTGRESQL + REDIS                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ AP Tables    │  │ Canvas       │  │ Audit        │  │ Redis        │    │
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
| Canvas render | <100ms | Initial paint |
| WebSocket latency | <200ms | Message round-trip |
| API response | <200ms | P95 response time |
| Canvas FPS | 60 FPS | With 500 objects |
| Concurrent users | 100+ | Per tenant |

### 7.4 Security Requirements

| Requirement | Implementation |
|-------------|----------------|
| Authentication | Session-based (existing) |
| Authorization | RBAC per layer/action |
| Tenant Isolation | RLS on all canvas tables |
| Personal Privacy | Layer filtered by user_id |
| Data Layer Protection | API rejects mutations |
| Audit Trail | Immutable canvas_audit_log |

### 7.5 Scalability Requirements

| Aspect | Strategy |
|--------|----------|
| WebSocket Connections | Redis adapter for horizontal scaling |
| Canvas State | Per-tenant sharding |
| Dashboard Queries | Materialized views + 5-min refresh |
| Entity Updates | Cell-level topic aggregation |

---

## 8. Data Model

### 8.1 Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  canvas_objects │       │  canvas_zones   │       │ canvas_connectors│
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ tenant_id (FK)  │       │ tenant_id (FK)  │       │ tenant_id (FK)  │
│ object_type     │       │ name            │       │ from_object_id  │──┐
│ layer_type      │       │ zone_type       │       │ to_object_id    │──┤
│ owner_id (FK)   │       │ position_x/y    │       │ connector_style │  │
│ source_ref      │       │ width/height    │       │ label           │  │
│ source_status   │       │ trigger_action  │       └─────────────────┘  │
│ position_x/y    │       │ trigger_config  │                            │
│ width/height    │       │ allowed_roles   │                            │
│ z_index         │       │ version         │                            │
│ display_data    │       └─────────────────┘                            │
│ style (JSONB)   │                                                      │
│ tags[]          │       ┌─────────────────┐                            │
│ zone_id (FK)    │───────│                 │                            │
│ priority_score  │       │                 │                            │
│ requires_ack    │       └─────────────────┘                            │
│ version         │                                                      │
│ created_at/by   │◄──────────────────────────────────────────────────────┘
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐       ┌─────────────────┐
│canvas_reactions │       │canvas_acknowledge│
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ object_id (FK)  │       │ object_id (FK)  │
│ user_id (FK)    │       │ user_id (FK)    │
│ emoji           │       │ acknowledged_at │
│ created_at      │       │ comment         │
└─────────────────┘       │ audit_event_id  │
                          └─────────────────┘

┌─────────────────┐
│canvas_audit_log │
├─────────────────┤
│ id (PK)         │
│ tenant_id       │
│ action          │
│ actor_id        │
│ object_id       │
│ object_source_ref│
│ zone_id         │
│ before_state    │
│ after_state     │
│ reason          │
│ correlation_id  │
│ created_at      │
└─────────────────┘
```

### 8.2 Table Definitions

See **Appendix A** for complete SQL DDL.

### 8.3 URN Specification

```
Format: urn:aibos:ap:{cell}:{entity}:{uuid}

Examples:
  urn:aibos:ap:01:vendor:550e8400-e29b-41d4-a716-446655440001
  urn:aibos:ap:02:invoice:8f14e45f-ceea-46ed-a8b2-0ba60a3e01c3
  urn:aibos:ap:03:match:7c9e6679-7425-40de-944b-e07fc1f90ae7
  urn:aibos:ap:04:approval:a87ff679-a2f3-4c94-a1f7-d1d8e0f21f7b
  urn:aibos:ap:05:payment:e4d909c2-9022-4d1d-8b22-1f6d9c3f1c0a

Grammar:
  URN     = "urn:aibos:ap:" CELL ":" ENTITY ":" UUID
  CELL    = "01" | "02" | "03" | "04" | "05"
  ENTITY  = "vendor" | "invoice" | "match" | "approval" | "payment"
  UUID    = <RFC 4122 UUID>
```

---

## 9. API Specifications

### 9.1 Cell Dashboard APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ap/vendors/dashboard` | GET | AP-01 vendor metrics |
| `/api/ap/invoices/dashboard` | GET | AP-02 invoice metrics |
| `/api/ap/match/dashboard` | GET | AP-03 match metrics |
| `/api/ap/approvals/dashboard` | GET | AP-04 approval metrics |
| `/api/payments/dashboard` | GET | AP-05 payment metrics (existing) |
| `/api/ap/manager/dashboard` | GET | Cluster aggregate metrics |

### 9.2 Canvas Object APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/canvas/objects` | GET | List objects (filtered by layer) |
| `/api/canvas/objects` | POST | Create object |
| `/api/canvas/objects/:id` | GET | Get single object |
| `/api/canvas/objects/:id` | PATCH | Update object |
| `/api/canvas/objects/:id` | DELETE | Soft delete object |
| `/api/canvas/objects/:id/move` | POST | Move to position/zone |
| `/api/canvas/objects/:id/reactions` | POST | Add reaction |
| `/api/canvas/objects/:id/reactions/:emoji` | DELETE | Remove reaction |

### 9.3 Zone APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/canvas/zones` | GET | List zones |
| `/api/canvas/zones` | POST | Create zone (manager+) |
| `/api/canvas/zones/:id` | PATCH | Update zone |
| `/api/canvas/zones/:id/objects` | GET | Objects in zone |

### 9.4 Pre-Flight APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/canvas/preflight` | GET | Get pre-flight status |
| `/api/canvas/preflight/acknowledge` | POST | Acknowledge items |

### 9.5 WebSocket Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `entity_update` | Server → Client | `{ sourceRef, changes, animation }` |
| `canvas_update` | Server ↔ Client | `{ operation, objectId, delta }` |
| `presence` | Server ↔ Client | `{ userId, cursor }` |
| `reaction` | Server ↔ Client | `{ objectId, emoji, action }` |

### 9.6 Request/Response Examples

See **Appendix B** for detailed API schemas.

---

## 10. UI/UX Requirements

### 10.1 AP Manager Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  HEADER: AP Manager  │  [Cluster Health: 94%]  │  [🔔 Alerts]  │  [Refresh] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  CLUSTER METRICS ROW                                                    │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐               │ │
│  │  │ Cycle    │  │ Open     │  │ Cash     │  │ Control  │               │ │
│  │  │ Time:4.2d│  │ Items:847│  │ Flow:$2M │  │ Health   │               │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘               │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  CELL HEALTH CARDS (clickable)                                          │ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │ │
│  │  │ AP-01   │  │ AP-02   │  │ AP-03   │  │ AP-04   │  │ AP-05   │      │ │
│  │  │ Vendor  │  │ Invoice │  │ Match   │  │ Approval│  │ Payment │      │ │
│  │  │ ✅ 98%  │  │ ⚠️ 82%  │  │ ✅ 95%  │  │ ⚠️ 78%  │  │ ✅ 96%  │      │ │
│  │  │ 23 pend │  │ 187 open│  │ 45 exc  │  │ 92 pend │  │ $1.2M   │      │ │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  CANVAS WORKSPACE (Lively Layer)                                        │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │ │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │   │ │
│  │  │  │ INBOX   │  │IN PROG  │  │ REVIEW  │  │  DONE   │ ← Zones    │   │ │
│  │  │  │┌───────┐│  │┌───────┐│  │┌───────┐│  │┌───────┐│            │   │ │
│  │  │  ││INV-01 ││  ││PAY-05 ││  ││INV-03 ││  ││PAY-02 ││ ← Stickies │   │ │
│  │  │  ││🚩 $5K ││  ││👀$15K ││  ││✅ $8K ││  ││💯$12K ││            │   │ │
│  │  │  │└───────┘│  │└───────┘│  │└───────┘│  │└───────┘│            │   │ │
│  │  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘            │   │ │
│  │  └─────────────────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Cell Dashboard Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ← Back to AP Manager  │  AP-02 Invoice Entry  │  Health: 82%  │  [Refresh] │
├─────────────────────────────────────────────────────────────────────────────┤
│  TOP HALF: Dashboard Metrics                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Open: 187    │  │ This Week:95 │  │ Duplicates:3 │  │ Period: DEC  │    │
│  │ Invoices     │  │ Received     │  │ Blocked      │  │ Closes: 5d   │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                              │
│  ┌────────────────────────────┐  ┌────────────────────────────────────────┐ │
│  │ Status Distribution        │  │ Aging Chart                            │ │
│  │ [===Draft===][Submitted]   │  │ [Bar chart by age buckets]             │ │
│  └────────────────────────────┘  └────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│  BOTTOM HALF: Actionable List                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┤
│  │ [Filter: Status ▼] [Filter: Vendor ▼] [Search...]                       │
│  ├─────────────────────────────────────────────────────────────────────────┤
│  │ Invoice #    │ Vendor        │ Amount    │ Status    │ Age  │ Actions  │
│  │ INV-2024-101 │ Acme Corp     │ $15,000   │ Submitted │ 3d   │ [View]   │
│  │ INV-2024-102 │ Tech Ltd      │ $8,500    │ Draft     │ 1d   │ [Edit]   │
│  │ ...                                                                      │
│  └─────────────────────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────────────────┘
```

### 10.3 Pre-Flight Gate Modal

```
┌─────────────────────────────────────────────────────────────────┐
│                    ⚠️ Action Required                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Please review and acknowledge 3 urgent items before            │
│  accessing sub-cell navigation.                                  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 🔴 HARD STOP (Priority: 95)                               │  │
│  │ ┌─────────────────────────────────────────────────────┐   │  │
│  │ │ PAY-2024-0089                                       │   │  │
│  │ │ Vendor: GlobalTech Ltd    Amount: $125,000          │   │  │
│  │ │ 🚩 Flagged by Alice (suspicious)                    │   │  │
│  │ │ [Comment:_______________] [Acknowledge]             │   │  │
│  │ └─────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 🟡 SOFT STOP (2 items)                                    │  │
│  │ • INV-2024-0201 - Overdue 5 days ($8,500)                 │  │
│  │ • INV-2024-0199 - High value ($45,000)                    │  │
│  │                              [Acknowledge All]             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  [Cancel - Return to Dashboard]          [Continue (disabled)]  │
└─────────────────────────────────────────────────────────────────┘
```

### 10.4 Sticky Note Component

```
┌────────────────────────────┐
│ INV-2024-0089         [📌] │ ← Pinned indicator
├────────────────────────────┤
│ GlobalTech Ltd             │ ← Vendor name
│ $125,000.00 USD            │ ← Amount
├────────────────────────────┤
│ Status: PENDING_APPROVAL   │ ← Status badge (color-coded)
│ Due: Dec 25, 2025 (3 days) │ ← Due date with urgency
├────────────────────────────┤
│ 🚩2  👀1  ✅0               │ ← Reaction counts
│ [+ Add Reaction]           │
└────────────────────────────┘

Ghost State (Archived):
┌────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░ Record Archived ░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ [View in Archive] [Dismiss]│
└────────────────────────────┘
```

### 10.5 Design System Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--sticky-bg-default` | `#FEF3C7` | Default sticky background |
| `--sticky-bg-draft` | `#F1F5F9` | Draft status |
| `--sticky-bg-pending` | `#FEF3C7` | Pending approval |
| `--sticky-bg-approved` | `#D1FAE5` | Approved |
| `--sticky-bg-rejected` | `#FEE2E2` | Rejected |
| `--sticky-bg-completed` | `#E0E7FF` | Completed |
| `--sticky-border-ghost` | `#9CA3AF` | Archived/orphaned |
| `--zone-bg-inbox` | `#F9FAFB` | Inbox zone |
| `--zone-bg-progress` | `#EFF6FF` | In progress zone |
| `--zone-bg-review` | `#FEF3C7` | Review zone |
| `--zone-bg-done` | `#ECFDF5` | Done zone |

---

## 11. Implementation Phases

### 11.1 Phase Overview

| Phase | Focus | Duration | Deliverables |
|-------|-------|----------|--------------|
| **Phase 1** | Foundation | 2 weeks | DB schema, CRUD API, basic UI |
| **Phase 2** | Zone Triggers | 1 week | Drag-to-zone, status updates, audit |
| **Phase 3** | Pre-Flight Gate | 1 week | Priority scoring, acknowledgment |
| **Phase 4** | Team Collaboration | 1 week | WebSocket sync, reactions |
| **Phase 5** | Polish | 2 weeks | Personal layer, CRDT, performance |

### 11.2 Phase 1: Foundation (Week 1-2)

| Task | Owner | Status |
|------|-------|--------|
| Create canvas database tables | Backend | 📋 TODO |
| Implement URN parser utility | Backend | 📋 TODO |
| Create entity transformers (AP-01 to AP-05) | Backend | 📋 TODO |
| Canvas object CRUD API | Backend | 📋 TODO |
| Canvas object list API with filters | Backend | 📋 TODO |
| Basic sticky note component | Frontend | 📋 TODO |
| Canvas workspace component | Frontend | 📋 TODO |
| Drag & drop positioning | Frontend | 📋 TODO |
| Cell dashboard service (AP-01) | Backend | 📋 TODO |
| Cell dashboard service (AP-02) | Backend | 📋 TODO |
| Cell dashboard service (AP-03) | Backend | 📋 TODO |
| Cell dashboard service (AP-04) | Backend | 📋 TODO |
| Enhance existing AP-05 dashboard | Backend | 📋 TODO |
| AP Manager aggregate dashboard | Backend | 📋 TODO |
| Cell health card components | Frontend | 📋 TODO |
| AP Manager page layout | Frontend | 📋 TODO |

### 11.3 Phase 2: Zone Triggers (Week 3)

| Task | Owner | Status |
|------|-------|--------|
| Zone table and CRUD API | Backend | 📋 TODO |
| Zone trigger service | Backend | 📋 TODO |
| Optimistic locking implementation | Backend | 📋 TODO |
| Cell service router (for triggers) | Backend | 📋 TODO |
| Canvas audit logging | Backend | 📋 TODO |
| Zone component with drop target | Frontend | 📋 TODO |
| Move-to-zone API integration | Frontend | 📋 TODO |
| Conflict "jiggle" animation | Frontend | 📋 TODO |
| Success/failure toast notifications | Frontend | 📋 TODO |

### 11.4 Phase 3: Pre-Flight Gate (Week 4)

| Task | Owner | Status |
|------|-------|--------|
| Priority scoring service | Backend | 📋 TODO |
| Pre-flight status API | Backend | 📋 TODO |
| Acknowledgment table and API | Backend | 📋 TODO |
| Kernel audit integration | Backend | 📋 TODO |
| Pre-flight gate component | Frontend | 📋 TODO |
| Urgent item cards | Frontend | 📋 TODO |
| Hard-stop vs soft-stop logic | Frontend | 📋 TODO |
| Acknowledgment form | Frontend | 📋 TODO |

### 11.5 Phase 4: Team Collaboration (Week 5)

| Task | Owner | Status |
|------|-------|--------|
| WebSocket server setup (Socket.io) | Backend | 📋 TODO |
| Entity update broadcasting | Backend | 📋 TODO |
| Canvas update sync service | Backend | 📋 TODO |
| Reactions API | Backend | 📋 TODO |
| Ghost state handling | Backend | 📋 TODO |
| WebSocket client integration | Frontend | 📋 TODO |
| Real-time sticky updates | Frontend | 📋 TODO |
| Pulse/glow animations | Frontend | 📋 TODO |
| Reaction picker component | Frontend | 📋 TODO |
| Ghost state overlay component | Frontend | 📋 TODO |

### 11.6 Phase 5: Polish (Week 6-7)

| Task | Owner | Status |
|------|-------|--------|
| Personal layer implementation | Backend | 📋 TODO |
| Presence service (cursors) | Backend | 📋 TODO |
| Performance optimization | Backend | 📋 TODO |
| Materialized views for dashboards | Backend | 📋 TODO |
| Personal layer UI | Frontend | 📋 TODO |
| Cursor presence display | Frontend | 📋 TODO |
| Canvas/WebGL rendering (if needed) | Frontend | 📋 TODO |
| CRDT integration (Yjs) | Full-stack | 📋 TODO |
| End-to-end testing | QA | 📋 TODO |
| Performance testing | QA | 📋 TODO |

---

## 12. Acceptance Criteria

### 12.1 Phase 1 Acceptance

- [ ] Canvas objects can be created, read, updated, deleted via API
- [ ] Objects display correctly with entity data (title, vendor, amount, status)
- [ ] Objects can be dragged and repositioned on canvas
- [ ] Cell dashboards return health metrics for all 5 cells
- [ ] AP Manager dashboard aggregates all cell metrics
- [ ] Cell cards are clickable and navigate to cell detail pages
- [ ] Unit tests pass with >80% coverage

### 12.2 Phase 2 Acceptance

- [ ] Zones can be created and configured by managers
- [ ] Dragging object to zone triggers configured action
- [ ] Status update via zone trigger updates backend entity
- [ ] Audit log records all zone trigger actions
- [ ] Version conflict shows "jiggle" animation
- [ ] Toast notifications show success/failure
- [ ] Integration tests pass for zone trigger workflows

### 12.3 Phase 3 Acceptance

- [ ] Priority scores calculate correctly based on factors
- [ ] Pre-flight gate blocks navigation for urgent items
- [ ] Hard-stop items require individual acknowledgment
- [ ] Soft-stop items allow batch acknowledgment
- [ ] Acknowledgments logged to canvas and kernel audit
- [ ] Auditor can query acknowledgment history

### 12.4 Phase 4 Acceptance

- [ ] WebSocket connects and authenticates
- [ ] Entity status changes update stickies in real-time
- [ ] Canvas changes sync between users
- [ ] Reactions appear/update in real-time
- [ ] Ghost state shows for archived/deleted entities
- [ ] Performance: <200ms latency for updates

### 12.5 Phase 5 Acceptance

- [ ] Personal layer visible only to owner
- [ ] Cursor positions visible for team members
- [ ] Simultaneous text editing resolves without conflicts
- [ ] Dashboard loads in <500ms
- [ ] Canvas renders at 60 FPS with 500 objects
- [ ] All end-to-end tests pass

---

## 13. Dependencies & Risks

### 13.1 Dependencies

| Dependency | Type | Owner | Status |
|------------|------|-------|--------|
| PostgreSQL 15+ | Infrastructure | DevOps | ✅ Available |
| Redis 7+ | Infrastructure | DevOps | ✅ Available |
| Socket.io setup | Infrastructure | DevOps | 📋 TODO |
| Existing AP-01 to AP-05 services | Backend | Finance Team | ✅ Complete |
| Kernel AuditPort | Backend | Platform Team | ✅ Available |
| Design system tokens | Frontend | Design Team | 📋 TODO |

### 13.2 Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| WebSocket scale issues | High | Medium | Use Redis adapter, cell-level topics |
| Canvas performance with many objects | Medium | Medium | Canvas/WebGL fallback in Phase 5 |
| CRDT complexity | Medium | High | Defer to Phase 5, use optimistic locking for MVP |
| User adoption | High | Low | Early user testing, training materials |
| Audit compliance gaps | High | Low | Link canvas audit to kernel audit |

### 13.3 Open Questions

| Question | Status | Decision |
|----------|--------|----------|
| Canvas framework (React vs Canvas/WebGL)? | Decided | React for MVP, Canvas/WebGL Phase 5 |
| CRDT library choice? | Decided | Yjs (Phase 5) |
| Real-time framework? | Decided | Socket.io with Redis adapter |
| Personal layer persistence? | Decided | Same DB, filtered by user_id |

---

## 14. Appendices

### Appendix A: Complete SQL DDL

```sql
-- ============================================================================
-- CANVAS OBJECTS
-- ============================================================================

CREATE TABLE canvas_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  object_type VARCHAR(30) NOT NULL CHECK (object_type IN (
    'hydrated_sticky', 'plain_sticky', 'connector', 'annotation', 'zone'
  )),
  layer_type VARCHAR(20) NOT NULL CHECK (layer_type IN ('data', 'team', 'personal')),
  
  owner_id UUID REFERENCES users(id),
  CONSTRAINT personal_layer_needs_owner CHECK (
    layer_type != 'personal' OR owner_id IS NOT NULL
  ),
  
  source_ref VARCHAR(200),
  source_status VARCHAR(20) DEFAULT 'active' CHECK (source_status IN (
    'active', 'archived', 'deleted', 'orphaned'
  )),
  source_last_sync TIMESTAMPTZ,
  
  position_x NUMERIC(10, 2) NOT NULL DEFAULT 0,
  position_y NUMERIC(10, 2) NOT NULL DEFAULT 0,
  width NUMERIC(10, 2) NOT NULL DEFAULT 280,
  height NUMERIC(10, 2) NOT NULL DEFAULT 180,
  z_index INTEGER NOT NULL DEFAULT 100,
  
  display_data JSONB NOT NULL DEFAULT '{}',
  style JSONB NOT NULL DEFAULT '{"backgroundColor": "#FEF3C7"}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  
  zone_id UUID REFERENCES canvas_zones(id),
  
  priority_score INTEGER NOT NULL DEFAULT 0,
  requires_acknowledgment BOOLEAN NOT NULL DEFAULT FALSE,
  
  version INTEGER NOT NULL DEFAULT 1,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id),
  
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id)
);

CREATE INDEX idx_canvas_objects_layer 
  ON canvas_objects(tenant_id, layer_type) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_canvas_objects_personal 
  ON canvas_objects(tenant_id, owner_id) 
  WHERE layer_type = 'personal' AND deleted_at IS NULL;

CREATE INDEX idx_canvas_objects_source 
  ON canvas_objects(source_ref) 
  WHERE source_ref IS NOT NULL;

CREATE INDEX idx_canvas_objects_preflight 
  ON canvas_objects(tenant_id, requires_acknowledgment, priority_score DESC)
  WHERE layer_type = 'team' 
    AND requires_acknowledgment = TRUE 
    AND deleted_at IS NULL;

CREATE INDEX idx_canvas_objects_tags 
  ON canvas_objects USING GIN(tags);

-- ============================================================================
-- CANVAS ZONES
-- ============================================================================

CREATE TABLE canvas_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  name VARCHAR(100) NOT NULL,
  zone_type VARCHAR(30) NOT NULL CHECK (zone_type IN (
    'inbox', 'in_progress', 'review', 'done', 'blocked', 'custom'
  )),
  
  position_x NUMERIC(10, 2) NOT NULL,
  position_y NUMERIC(10, 2) NOT NULL,
  width NUMERIC(10, 2) NOT NULL DEFAULT 300,
  height NUMERIC(10, 2) NOT NULL DEFAULT 800,
  
  background_color VARCHAR(7) DEFAULT '#F3F4F6',
  border_color VARCHAR(7) DEFAULT '#D1D5DB',
  
  trigger_action VARCHAR(30) DEFAULT 'none' CHECK (trigger_action IN (
    'none', 'status_update', 'notify', 'archive', 'escalate'
  )),
  trigger_config JSONB DEFAULT '{}',
  
  allowed_roles TEXT[] DEFAULT '{}',
  display_order INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- CANVAS CONNECTORS
-- ============================================================================

CREATE TABLE canvas_connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  from_object_id UUID NOT NULL REFERENCES canvas_objects(id) ON DELETE CASCADE,
  to_object_id UUID NOT NULL REFERENCES canvas_objects(id) ON DELETE CASCADE,
  
  connector_style VARCHAR(20) DEFAULT 'arrow' CHECK (connector_style IN (
    'arrow', 'line', 'dashed', 'double'
  )),
  label VARCHAR(200),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id)
);

-- ============================================================================
-- REACTIONS
-- ============================================================================

CREATE TABLE canvas_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id UUID NOT NULL REFERENCES canvas_objects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  
  emoji VARCHAR(10) NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(object_id, user_id, emoji)
);

CREATE INDEX idx_canvas_reactions_object ON canvas_reactions(object_id);

-- ============================================================================
-- ACKNOWLEDGMENTS
-- ============================================================================

CREATE TABLE canvas_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id UUID NOT NULL REFERENCES canvas_objects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  
  acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  comment TEXT,
  audit_event_id UUID,
  
  UNIQUE(object_id, user_id)
);

-- ============================================================================
-- AUDIT LOG
-- ============================================================================

CREATE TABLE canvas_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  action VARCHAR(50) NOT NULL CHECK (action IN (
    'object_created', 'object_moved', 'object_updated', 'object_deleted',
    'zone_enter', 'zone_exit', 'zone_trigger_fired',
    'reaction_added', 'reaction_removed',
    'acknowledged', 'tag_added', 'tag_removed',
    'source_status_changed'
  )),
  
  actor_id UUID NOT NULL REFERENCES users(id),
  actor_name VARCHAR(200),
  
  object_id UUID,
  object_source_ref VARCHAR(200),
  zone_id UUID,
  
  before_state JSONB,
  after_state JSONB,
  
  reason TEXT,
  correlation_id UUID,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_canvas_audit_object ON canvas_audit_log(object_id, created_at DESC);
CREATE INDEX idx_canvas_audit_source ON canvas_audit_log(object_source_ref, created_at DESC);
CREATE INDEX idx_canvas_audit_tenant_time ON canvas_audit_log(tenant_id, created_at DESC);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE canvas_objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON canvas_objects
  USING (tenant_id = current_setting('app.tenant_id')::UUID);

CREATE POLICY personal_layer_privacy ON canvas_objects
  USING (
    layer_type != 'personal' 
    OR owner_id = current_setting('app.user_id')::UUID
  );

CREATE POLICY data_layer_readonly ON canvas_objects
  FOR ALL
  USING (TRUE)
  WITH CHECK (layer_type != 'data');
```

### Appendix B: API Request/Response Schemas

See separate file: `API-SCHEMAS-LIVELY-LAYER.md`

### Appendix C: Entity Transformer Mappings

See separate file: `ENTITY-TRANSFORMERS.md`

### Appendix D: WebSocket Message Catalog

See separate file: `WEBSOCKET-MESSAGES.md`

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | Dec 2025 | Finance Team | Initial PRD |

---

**Last Updated:** December 2025  
**Maintainer:** Finance Cell Team  
**Status:** ✅ APPROVED FOR DEVELOPMENT
