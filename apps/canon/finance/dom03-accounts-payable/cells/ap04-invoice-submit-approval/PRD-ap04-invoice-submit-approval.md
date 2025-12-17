# AP-04: Invoice Approval Workflow Cell — Product Requirements Document

> **🟢 [ACTIVE]** — Enterprise Certified  
> **Cell Code:** AP-04  
> **Version:** 1.0.0  
> **Certified Date:** 2025-12-16  
> **Plane:** C — Data & Logic (Cell)  
> **Binding Scope:** Accounts Payable Molecule  
> **Authority:** CONT_07 (Finance Canon Architecture)  
> **Derives From:** CONT_07, CONT_10 (BioSkin Architecture)

---

## 📋 Document Control

| Property | Value |
|----------|-------|
| **Cell Code** | AP-04 |
| **Cell Name** | Invoice Approval Workflow |
| **Molecule** | Accounts Payable (dom03-accounts-payable) |
| **Version** | 1.0.0 |
| **Status** | 🟢 ACTIVE |
| **Location** | `apps/canon/finance/dom03-accounts-payable/cells/ap04-invoice-submit-approval/` |
| **Author** | Finance Cell Team |
| **Last Updated** | 2025-12-16 |
| **Quality Bar** | Enterprise Certified / ICFR-Ready / Audit-Ready |

---

## 1. Executive Summary

The Invoice Approval Workflow Cell (AP-04) enforces **authorization hierarchy** (amount-based escalation) and **Segregation of Duties (SoD)**. It routes invoices through multi-step approval workflows, enforces maker-checker separation, and gates GL posting (AP-02) and payment execution (AP-05).

### 1.1 Problem Statement

| Issue | Evidence | Impact |
|-------|----------|--------|
| **Unauthorized Approvals** | Same user creates and approves invoices | Internal control violation, fraud risk |
| **No Approval Hierarchy** | All invoices require same approval level | Inefficient, high-value items not escalated |
| **Missing Audit Trail** | Approval decisions not tracked | Compliance failure |
| **Approval Chain Mutable** | Approvals can be deleted/modified | Evidence tampering |

### 1.2 Solution

A governed approval workflow with:
- **Multi-Step Approvals:** Amount-based escalation, department/project routing
- **SoD Enforcement:** Maker ≠ Checker (database constraint)
- **Immutable Approval Chain:** No deletion, full audit trail
- **Policy-Driven Routing:** Approval rules from K_POLICY
- **Delegation Support:** Temporary delegation, re-approval on change

---

## 2. Purpose & Outcomes

### 2.1 Objective

Enforce authorization hierarchy (amount-based escalation) and SoD.

### 2.2 Outcomes

| Outcome | Success Criteria |
|---------|------------------|
| **Invoice approval gates GL posting and payment execution** | Invoice status = 'approved' required for posting/payment |
| **SoD is architecturally enforced** | Database constraint: `approver_id != created_by` |
| **Approval chain is immutable** | No deletion, full audit trail in `kernel.audit_events` |
| **Any change to invoice after submission invalidates approvals** | Approval chain reset, re-routing required |

---

## 3. Scope

### 3.1 In-Scope

| Feature | Description | Priority |
|---------|-------------|----------|
| **Approval Routing Rules** | Thresholds, departments, projects (K_POLICY) | P0 |
| **Multi-Step Approvals** | Sequential approval levels | P0 |
| **Delegation** | Temporary delegation, re-approval on change | P1 |
| **Approval Inbox** | List pending approvals per user | P0 |
| **Audit-Ready Evidence Trail** | Full approval history | P0 |
| **Re-approval on Change** | Invoice change invalidates approvals | P0 |

### 3.2 Out-of-Scope

| Feature | Reason | Target |
|---------|--------|--------|
| **Enterprise-Wide Workflow Designer** | Complex configuration UI | v2.0.0 |
| **Parallel Approvals** | Complex routing logic | v1.1.0 |
| **Conditional Routing** | Advanced business rules | v1.2.0 |
| **Approval Notifications** | K_NOTIFY integration (future) | v1.1.0 |

---

## 4. State Machine

```
┌─────────────┐
│  submitted  │ ← From AP-02 (after matching)
└──────┬──────┘
       │ request-approval()
       ▼
┌─────────────────┐
│ pending_approval│ ← Waiting for approver(s)
└──────┬──────────┘
       │ approve() [Level 1]
       ▼
┌─────────────────┐
│ approved_level_1│ ← 1/N approvals complete
└──────┬──────────┘
       │ approve() [Level 2]
       ▼
┌─────────────────┐
│ approved_level_2│ ← 2/N approvals complete
└──────┬──────────┘
       │ ... (continue until all levels)
       ▼
┌──────────┐
│ approved │ ← All approvals complete → GL posting
└──────┬───┘
       │ reject()
       ▼
┌──────────┐
│ rejected │ ← Terminal state
└──────────┘
```

### 4.1 States

| Status | Description | Immutable? | Terminal? | Can Post to GL? |
|--------|-------------|------------|-----------|-----------------|
| `submitted` | Invoice submitted (from AP-02) | No | No | ❌ No |
| `pending_approval` | Waiting for approver(s) | No | No | ❌ No |
| `approved_level_1` | First approval level complete | No | No | ❌ No |
| `approved_level_2` | Second approval level complete | No | No | ❌ No |
| `approved` | All approval levels complete | No | No | ✅ Yes |
| `rejected` | Invoice rejected | **Yes** | **Yes** | ❌ No |

### 4.2 Actions

| Action | From State | To State | Actor | SoD Required? |
|--------|-----------|----------|-------|---------------|
| `request-approval` | `submitted` | `pending_approval` | System | No |
| `approve` | `pending_approval` or `approved_level_N` | `approved_level_N+1` or `approved` | Checker | **Yes** (Maker ≠ Checker) |
| `reject` | `pending_approval` or `approved_level_N` | `rejected` | Checker | **Yes** |
| `request-changes` | `pending_approval` | `submitted` (reset) | Checker | **Yes** |

---

## 5. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  BFF Layer (Next.js API Routes)                                 │
│  /api/ap/approvals/*                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Cell Services                                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────────────────┐│
│  │ApprovalService│ │RoutingService│ │DelegationService         ││
│  └──────────────┘ └──────────────┘ └─────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Ports (Interfaces)                                              │
│  ApprovalRepositoryPort, InvoicePort, GLPostingPort            │
│  PolicyPort (K_POLICY), AuditPort (K_LOG), EventBusPort (K_NOTIFY)│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Adapters                                                        │
│  ┌───────────────────┐ ┌────────────────┐                       │
│  │ SQL (Production)  │ │ Memory (Test)  │                       │
│  └───────────────────┘ └────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

### 5.1 Hexagonal Architecture

| Layer | Component | Responsibility |
|-------|-----------|----------------|
| **Inbound** | API Routes | HTTP endpoints, request validation |
| **Domain** | ApprovalService | Approval workflow logic, SoD enforcement |
| **Domain** | RoutingService | Compute approval route (K_POLICY) |
| **Domain** | DelegationService | Delegation management |
| **Outbound** | ApprovalRepositoryPort | Persist approval records |
| **Outbound** | InvoicePort | Update invoice status |
| **Outbound** | GLPostingPort | Trigger GL posting on final approval |
| **Outbound** | PolicyPort (K_POLICY) | Get approval rules, thresholds |
| **Outbound** | AuditPort (K_LOG) | Immutable audit trail |
| **Outbound** | EventBusPort (K_NOTIFY) | Publish domain events (outbox) |

---

## 6. Data Model

### 6.1 Core Tables

```sql
-- ap.invoice_approvals
CREATE TABLE IF NOT EXISTS ap.invoice_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES ap.invoices(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  -- Approval Level
  approval_level INTEGER NOT NULL,  -- 1, 2, 3, ...
  total_levels INTEGER NOT NULL,  -- Total levels required
  
  -- Approver
  approver_id UUID NOT NULL,
  approver_role VARCHAR(50),  -- 'finance_manager', 'department_head', etc.
  
  -- Decision
  decision VARCHAR(20) NOT NULL CHECK (decision IN ('approved', 'rejected', 'request_changes')),
  comments TEXT,
  
  -- Delegation
  is_delegated BOOLEAN DEFAULT FALSE,
  delegated_from_user_id UUID,
  delegation_reason TEXT,
  
  -- Timing
  actioned_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT uq_invoice_approval_level UNIQUE (invoice_id, approval_level, approver_id),
  CONSTRAINT chk_sod_approval CHECK (
    NOT EXISTS (
      SELECT 1 FROM ap.invoices 
      WHERE id = invoice_id AND created_by = approver_id
    )
  )
);

-- ap.approval_routes (computed, cached)
CREATE TABLE IF NOT EXISTS ap.approval_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES ap.invoices(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  -- Route Configuration
  total_levels INTEGER NOT NULL,
  route_policy_source VARCHAR(50),  -- 'tenant', 'vendor', 'category', 'amount'
  
  -- Route Details (JSON)
  route_config JSONB NOT NULL,  -- {levels: [{level: 1, role: 'finance_manager', amount_threshold: 10000}, ...]}
  
  -- Status
  is_complete BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_invoice_approvals_invoice ON ap.invoice_approvals(invoice_id);
CREATE INDEX idx_invoice_approvals_approver ON ap.invoice_approvals(tenant_id, approver_id, decision) 
  WHERE decision = 'approved';
CREATE INDEX idx_approval_routes_invoice ON ap.approval_routes(invoice_id);
```

### 6.2 Approval Routing Rules (K_POLICY)

| Rule Type | Example | Source |
|-----------|---------|--------|
| **Amount-Based** | `amount >= $10,000 → 2 approvals` | K_POLICY |
| **Department-Based** | `department = 'IT' → IT manager approval` | K_POLICY |
| **Project-Based** | `project_code = 'PROJ-001' → project lead approval` | K_POLICY |
| **Vendor-Based** | `vendor.risk_level = 'HIGH' → CFO approval` | K_POLICY |

---

## 7. Ports & APIs (Hexagonal)

### 7.1 Inbound Ports (API Endpoints)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/ap/invoices/{id}/request-approval` | Request approval (compute route) | `ap.approval.request` |
| `POST` | `/api/ap/approvals/{approval_id}/approve` | Approve invoice | `ap.approval.approve` |
| `POST` | `/api/ap/approvals/{approval_id}/reject` | Reject invoice | `ap.approval.approve` |
| `POST` | `/api/ap/approvals/{approval_id}/request-changes` | Request changes (reset) | `ap.approval.approve` |
| `GET` | `/api/ap/approvals/inbox` | List pending approvals | `ap.approval.read` |
| `GET` | `/api/ap/approvals/invoice/{invoice_id}` | Get approval history | `ap.approval.read` |

### 7.2 Outbound Ports

| Port | Service | Purpose | Reliability |
|------|---------|---------|-------------|
| `ApprovalRepositoryPort` | SQL Adapter | Persist approval records | Blocking |
| `InvoicePort` | AP-02 | Update invoice status | Blocking |
| `GLPostingPort` | GL-03 | Trigger GL posting on final approval | **Blocking** |
| `PolicyPort` (K_POLICY) | Kernel | Get approval rules, thresholds | Blocking |
| `AuditPort` (K_LOG) | Kernel | Immutable audit trail | **Transactional** ⚠️ |
| `EventBusPort` (K_NOTIFY) | Kernel | Publish domain events | **Async (Outbox)** |

---

## 8. Controls & Evidence

### 8.1 Control Matrix (CONT_07 Format)

| Control ID | Assertion | Control | Evidence | Enforcement |
|:----------|:----------|:--------|:---------|:------------|
| **AP04-C01** | **Authorization** | Maker ≠ Checker enforced (DB constraint) | `chk_sod_approval` constraint | **DB Constraint** |
| **AP04-C02** | **Completeness** | Approval chain immutable; no deletion | Database trigger prevents deletion | **DB Trigger** |
| **AP04-C03** | **Completeness** | Full audit envelope (who/when/what/why/where) | `kernel.audit_events` coverage = 100% | **Transactional Audit** |
| **AP04-C04** | **Authorization** | Cannot approve own invoice (hard fail) | `chk_sod_approval` constraint fails | **DB Constraint** |
| **AP04-C05** | **Completeness** | Any change to invoice after submission invalidates approvals | Approval chain reset, re-routing | **State Machine** |
| **AP04-C06** | **Authorization** | Approval routing from K_POLICY (governed, not hardcoded) | Policy source tracked in `route_policy_source` | **Policy-Driven** |

### 8.2 Evidence Artifacts

| Artifact | Location | Retention | Purpose |
|----------|----------|-----------|---------|
| **Approval Record** | `ap.invoice_approvals` | 7 years | Approval evidence |
| **Approval Route** | `ap.approval_routes` | 7 years | Routing evidence |
| **Audit Events** | `kernel.audit_events` | 7 years | Compliance trail |
| **Domain Events** | `finance.approval_outbox` | 7 years | Integration evidence |

---

## 9. UI/UX (BioSkin Architecture)

### 9.1 Component Requirements (CONT_10)

| Component | Type | Schema-Driven? | Location |
|-----------|------|----------------|----------|
| **ApprovalInbox** | `BioTable` | ✅ Yes | `apps/web/src/features/approval/components/ApprovalInbox.tsx` |
| **ApprovalForm** | `BioForm` | ✅ Yes | `apps/web/src/features/approval/components/ApprovalForm.tsx` |
| **ApprovalHistory** | `BioObject` | ✅ Yes | `apps/web/src/features/approval/components/ApprovalHistory.tsx` |
| **DelegationForm** | `BioForm` | ✅ Yes | `apps/web/src/features/approval/components/DelegationForm.tsx` |

### 9.2 Schema Definition

```typescript
// packages/schemas/src/approval.schema.ts
import { z } from 'zod';

export const ApprovalSchema = z.object({
  id: z.string().uuid().optional(),
  invoice_id: z.string().uuid(),
  approval_level: z.number().int().positive(),
  total_levels: z.number().int().positive(),
  approver_id: z.string().uuid(),
  decision: z.enum(['approved', 'rejected', 'request_changes']),
  comments: z.string().optional(),
  is_delegated: z.boolean().default(false),
  actioned_at: z.date(),
});

export type Approval = z.infer<typeof ApprovalSchema>;
```

---

## 10. Acceptance Criteria

### 10.1 Functional Requirements

| ID | Requirement | Test |
|:---|:------------|:-----|
| **AC-01** | Any invoice approval emits audit event in the same transaction | Coverage = 100% |
| **AC-02** | Cannot approve own invoice (hard fail) | `chk_sod_approval` constraint fails |
| **AC-03** | Any change to invoice after submission invalidates approvals and restarts routing | Approval chain reset |
| **AC-04** | Approval routing from K_POLICY (not hardcoded) | Policy source tracked |
| **AC-05** | On final approval: call GL-03 posting (blocking) | GL posting triggered |
| **AC-06** | Publish domain event (K_NOTIFY outbox) | Event published to outbox |
| **AC-07** | Approval chain immutable; no deletion | Database trigger prevents deletion |

### 10.2 Non-Functional Requirements

| ID | Requirement | Target |
|:---|:------------|:------|
| **NFR-01** | API response time (p95) | < 300ms |
| **NFR-02** | Approval routing computation | < 200ms |
| **NFR-03** | Test coverage | ≥ 90% |

---

## 11. Testing Requirements

### 11.1 Unit Tests

| Component | Test Coverage | Files |
|-----------|---------------|-------|
| `ApprovalService` | Approval workflow, SoD enforcement | `__tests__/ApprovalService.test.ts` |
| `RoutingService` | Approval route computation | `__tests__/RoutingService.test.ts` |
| `DelegationService` | Delegation management | `__tests__/DelegationService.test.ts` |

### 11.2 Integration Tests

| Test | Description | File |
|------|-------------|------|
| **SoD Enforcement** | Creator cannot approve own invoice | `__tests__/integration/SoD.test.ts` |
| **Multi-Step Approval** | Sequential approval levels | `__tests__/integration/MultiStepApproval.test.ts` |
| **Re-approval on Change** | Invoice change invalidates approvals | `__tests__/integration/Reapproval.test.ts` |
| **GL Posting Trigger** | Final approval triggers GL posting | `__tests__/integration/GLPostingTrigger.test.ts` |
| **Immutability** | Approval chain cannot be deleted | `__tests__/integration/Immutability.test.ts` |

---

## 12. Implementation Optimization Notes

> **📌 Optimization Learnings from AP-01 Implementation**  
> Apply these optimizations during AP-04 implementation to avoid performance issues.

### 12.1 Database Query Optimizations

#### ✅ **List Query Optimization (CRITICAL)**
**Pattern:** Use window function `COUNT(*) OVER()` instead of separate COUNT query.

**Before (Two Queries):**
```typescript
const countResult = await pool.query(`SELECT COUNT(*) FROM ...`);
const dataResult = await pool.query(`SELECT * FROM ... LIMIT ...`);
```

**After (Single Query):**
```typescript
const result = await pool.query(`
  SELECT *, COUNT(*) OVER() as total
  FROM ap.approval_requests 
  WHERE ... 
  ORDER BY ... 
  LIMIT ... OFFSET ...
`);
const total = result.rows[0]?.total || 0;
```

**Impact:** 50% reduction in database round-trips, ~20-30ms faster.

#### ✅ **Composite Indexes for Approval Queries**
Add composite indexes for common approval query patterns:
```sql
-- For invoice_id + approval_status (most common query)
CREATE INDEX idx_approval_requests_invoice_status 
  ON ap.approval_requests(invoice_id, approval_status);

-- For approver queue queries
CREATE INDEX idx_approval_requests_tenant_approver 
  ON ap.approval_requests(tenant_id, approver_id, created_at ASC) 
  WHERE approval_status = 'pending';
```

#### ✅ **Partial Indexes for Status Filters**
```sql
-- For pending approvals (approver's queue)
CREATE INDEX idx_approval_requests_tenant_pending 
  ON ap.approval_requests(tenant_id, created_at ASC) 
  WHERE approval_status = 'pending';

-- For approved invoices (history)
CREATE INDEX idx_approval_requests_tenant_approved 
  ON ap.approval_requests(tenant_id, approved_at DESC) 
  WHERE approval_status = 'approved';
```

### 12.2 Error Handling Best Practices

#### ✅ **Use Domain-Specific Errors**
**Pattern:** Replace generic `Error` with domain-specific error classes.

**Before:**
```typescript
if (result.rows.length === 0) {
  throw new Error(`Approval request not found: ${id}`);
}
```

**After:**
```typescript
import { ApprovalRequestNotFoundError } from './errors';

if (result.rows.length === 0) {
  throw new ApprovalRequestNotFoundError(id);
}
```

**Impact:** Better API error messages, proper HTTP status codes.

### 12.3 Performance Considerations for Approval Workflow

#### ⚠️ **Optimize Approval Queue Queries**
Approval queue is frequently accessed - optimize with proper indexes:
```sql
-- Composite index for approver's pending queue
CREATE INDEX idx_approval_requests_approver_pending 
  ON ap.approval_requests(tenant_id, approver_id, level, created_at ASC) 
  WHERE approval_status = 'pending';
```

#### ⚠️ **Cache Approval Rules**
Cache approval rules from K_POLICY (they don't change frequently):
```typescript
// Cache approval rules for 10 minutes
const cacheKey = `approval_rules:${tenantId}:${amount}:${currency}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);
```

### 12.4 Database Statistics

#### ✅ **Set Statistics Targets**
```sql
ALTER TABLE ap.approval_requests ALTER COLUMN tenant_id SET STATISTICS 1000;
ALTER TABLE ap.approval_requests ALTER COLUMN approval_status SET STATISTICS 500;
ALTER TABLE ap.approval_requests ALTER COLUMN approver_id SET STATISTICS 500;

ANALYZE ap.approval_requests;
```

### 12.5 Reference Implementation

See AP-01 optimized implementation:
- **SQL Adapter:** `packages/kernel-adapters/src/sql/vendorRepo.sql.ts` (list query optimization)
- **Migration:** `apps/db/migrations/finance/105_create_vendors.sql` (indexes)
- **Audit Report:** `apps/canon/finance/dom03-accounts-payable/cells/ap01-vendor-master/AUDIT_OPTIMIZATION_REPORT.md`

---

## 13. Related Documents

| Document | Purpose | Location |
|----------|---------|----------|
| **CONT_07** | Finance Canon Architecture | `packages/canon/A-Governance/A-CONT/CONT_07_FinanceCanonArchitecture.md` |
| **CONT_10** | BioSkin Architecture | `packages/canon/A-Governance/A-CONT/CONT_10_BioSkinArchitecture.md` |
| **AP-02 PRD** | Invoice Entry (upstream) | `apps/canon/finance/dom03-accounts-payable/cells/ap02-invoice-entry/PRD-ap02-invoice-entry.md` |
| **AP-03 PRD** | 3-Way Engine (upstream) | `apps/canon/finance/dom03-accounts-payable/cells/ap03-3way-engine/PRD-ap03-3way-engine.md` |
| **AP-05 PRD** | Payment Execution (downstream) | `apps/canon/finance/dom03-accounts-payable/cells/ap05-payment-execution/README.md` |

---

**Status:** ✅ Ready for Implementation  
**Next Step:** Create service implementations following hexagonal architecture

---

**Last Updated:** 2025-12-16  
**Maintainer:** Finance Cell Team  
**Review Cycle:** Quarterly
