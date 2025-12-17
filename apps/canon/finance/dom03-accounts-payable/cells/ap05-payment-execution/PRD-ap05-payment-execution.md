# AP-05: Payment Execution Cell — Product Requirements Document

> **🟢 [ACTIVE]** — Enterprise Certified  
> **Cell Code:** AP-05  
> **Version:** 1.1.0  
> **Certified Date:** 2025-12-16  
> **Plane:** C — Data & Logic (Cell)  
> **Binding Scope:** Accounts Payable Molecule  
> **Authority:** CONT_07 (Finance Canon Architecture)  
> **Derives From:** CONT_07, CONT_10 (BioSkin Architecture)

---

## 📋 Document Control

| Property | Value |
|----------|-------|
| **Cell Code** | AP-05 |
| **Cell Name** | Payment Execution |
| **Molecule** | Accounts Payable (dom03-accounts-payable) |
| **Version** | 1.1.0 |
| **Status** | 🟢 ACTIVE |
| **Location** | `apps/canon/finance/dom03-accounts-payable/cells/ap05-payment-execution/` |
| **Author** | Finance Cell Team |
| **Last Updated** | 2025-12-16 |
| **Quality Bar** | Enterprise Certified / ICFR-Ready / Audit-Ready |

---

## 1. Executive Summary

The Payment Execution Cell (AP-05) handles the complete payment lifecycle from creation through bank confirmation and GL posting. It enforces enterprise-grade controls including **Segregation of Duties (SoD)**, **Transactional Audit**, **Idempotency**, **Optimistic Locking**, **Period Lock**, and **Immutability**. This is the final guardrail before money moves—the last control point in the P2P cycle.

### 1.1 Problem Statement

| Issue | Evidence | Impact |
|-------|----------|--------|
| **Unauthorized Payments** | Same user creates and approves payments | Internal control violation, fraud risk |
| **Duplicate Payments** | Same payment created multiple times | Financial loss, reconciliation issues |
| **Concurrent Modifications** | Race conditions in approval workflow | Data corruption, control bypass |
| **Period Cutoff Violations** | Payments posted to closed periods | Financial statement errors |
| **Missing Audit Trail** | Payment mutations not tracked | Compliance failure |
| **Immutability Gaps** | Approved payments can be edited | Evidence tampering |

### 1.2 Solution

A governed payment execution system with:
- **State Machine:** `draft → pending_approval → approved → processing → completed`
- **SoD Enforcement:** Maker ≠ Checker (database constraint)
- **Idempotency:** Duplicate payment creation prevention via unique keys
- **Optimistic Locking:** Concurrent modification detection via version column
- **Period Lock:** Fiscal period validation before posting (K_TIME)
- **Immutability:** Approved payments cannot be edited (DB trigger enforced)
- **Transactional Audit:** Business mutation + audit event in same DB transaction
- **Tenant Isolation:** Row Level Security (RLS) on all tables

---

## 2. Purpose & Outcomes

### 2.1 Objective

Execute approved payments with enterprise-grade controls, ensuring money moves only after all guardrails are satisfied.

### 2.2 Outcomes

| Outcome | Success Criteria |
|---------|------------------|
| **Payments execute only after approval (SoD enforced)** | Database constraint: `approved_by != created_by` |
| **No duplicate payments** | Unique constraint on `idempotency_key` |
| **Period cutoff enforced** | K_TIME validation blocks closed periods |
| **All mutations are auditable** | 100% audit event coverage in `kernel.audit_events` |
| **Approved payments are immutable** | Database trigger prevents updates/deletes |
| **Concurrent modifications detected** | Optimistic locking via `version` column |
| **GL posting on completion** | `journal_header_id` populated after successful execution |

---

## 3. Scope

### 3.1 In-Scope

| Feature | Description | Priority |
|---------|-------------|----------|
| **Payment Creation** | Create payment (draft), validate period open | P0 |
| **Approval Workflow** | Submit, approve, reject with SoD enforcement | P0 |
| **Payment Execution** | Execute, complete, fail, retry lifecycle | P0 |
| **Idempotency** | Duplicate payment prevention via unique keys | P0 |
| **Optimistic Locking** | Version-based concurrency control | P0 |
| **Period Validation** | K_TIME check before posting | P0 |
| **GL Posting** | Post to GL on completion (GL-03) | P0 |
| **Transactional Audit** | Audit events in same DB transaction | P0 |
| **Beneficiary Snapshot** | Capture bank details at execution time | P0 |

### 3.2 Out-of-Scope

| Feature | Reason | Target |
|---------|--------|--------|
| **Bank API Integration** | External dependency, production liability | v1.2.0 |
| **FX Rate Integration** | K_FX integration (future) | v1.1.0 |
| **Treasury & Cash Pooling** | Massive scope explosion | v1.3.0 |
| **Payment Scheduling** | Future enhancement | v1.2.0 |
| **Multi-Currency Payments** | Requires K_FX integration | v1.1.0 |

---

## 4. State Machine

```
┌─────────┐
│  draft  │ ← Created by Maker
└────┬────┘
     │ submit()
     ▼
┌─────────────────┐
│pending_approval │ ← Waiting for Checker approval
└────┬────────────┘
     │ approve()
     ▼
┌──────────┐
│ approved │ ← Ready for execution (immutable)
└────┬─────┘
     │ execute()
     ▼
┌────────────┐
│ processing │ ← Sent to bank (immutable)
└────┬───────┘
     │ complete()
     ▼
┌──────────┐
│completed │ ← Bank confirmed, GL posted (terminal)
└──────────┘
     │
     ├─→ reject() [from pending_approval]
     ▼
┌──────────┐
│ rejected │ ← Terminal state
└──────────┘
     │
     ├─→ fail() [from processing]
     ▼
┌────────┐
│ failed │ ← Bank rejected
└────┬───┘
     │ retry()
     ▼
┌─────────────────┐
│pending_approval │ ← Retry workflow
└─────────────────┘
```

### 4.1 States

| Status | Description | Immutable? | Terminal? | Can Execute? |
|--------|-------------|------------|-----------|--------------|
| `draft` | Payment being prepared | No | No | ❌ No |
| `pending_approval` | Waiting for approver | No | No | ❌ No |
| `approved` | Ready for execution | **Yes** | No | ✅ Yes |
| `rejected` | Payment rejected | **Yes** | **Yes** | ❌ No |
| `processing` | Sent to bank | **Yes** | No | — |
| `completed` | Bank confirmed, GL posted | **Yes** | **Yes** | — |
| `failed` | Bank rejected | No | No | ❌ No (retry allowed) |

### 4.2 Actions

| Action | From State | To State | Actor | Blocking Validation |
|--------|-----------|----------|-------|---------------------|
| `submit` | `draft` | `pending_approval` | Maker | Period open, vendor approved |
| `approve` | `pending_approval` | `approved` | Checker | **SoD (Maker ≠ Checker)** |
| `reject` | `pending_approval` | `rejected` | Checker | **SoD** |
| `execute` | `approved` | `processing` | System | Period open, beneficiary validated |
| `complete` | `processing` | `completed` | System | Bank confirmation, GL posting |
| `fail` | `processing` | `failed` | System | Bank rejection |
| `retry` | `failed` | `pending_approval` | System | Re-approval required |

---

## 5. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  BFF Layer (Next.js API Routes)                                 │
│  /api/payments/*                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Cell Services                                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────────────────┐│
│  │PaymentService│ │ApprovalService│ │ExecutionService         ││
│  └──────────────┘ └──────────────┘ └─────────────────────────┘│
│  ┌──────────────┐ ┌──────────────┐                            │
│  │ExceptionService│ │WebhookService│                            │
│  └──────────────┘ └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Ports (Interfaces)                                              │
│  PaymentRepositoryPort, AuditPort, PolicyPort, FiscalTimePort   │
│  GLPostingPort, EventBusPort, VendorPort                       │
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
| **Inbound** | API Routes | HTTP endpoints, request validation, idempotency handling |
| **Domain** | PaymentService | Payment creation, period validation, idempotency |
| **Domain** | ApprovalService | Approve/reject with SoD enforcement |
| **Domain** | ExecutionService | Execute, complete, fail, retry lifecycle |
| **Domain** | ExceptionService | Exception detection and handling |
| **Domain** | WebhookService | Webhook trigger management |
| **Outbound** | PaymentRepositoryPort | Persist payment data |
| **Outbound** | VendorPort | Validate vendor approved (AP-01) |
| **Outbound** | GLPostingPort | Post to GL-03 on completion |
| **Outbound** | FiscalTimePort (K_TIME) | Period cutoff validation |
| **Outbound** | PolicyPort (K_POLICY) | Approval rules, limits |
| **Outbound** | AuditPort (K_LOG) | Immutable audit trail |
| **Outbound** | EventBusPort (K_NOTIFY) | Publish domain events (outbox) |

---

## 6. Data Model

### 6.1 Core Tables

```sql
-- finance.payments
CREATE TABLE IF NOT EXISTS finance.payments (
    -- Identity
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    company_id UUID NOT NULL,
    payment_number VARCHAR(50) NOT NULL,
    
    -- Vendor Reference
    vendor_id UUID NOT NULL,
    vendor_name VARCHAR(255) NOT NULL,
    
    -- Beneficiary Snapshot (captured at execution time - audit-proof)
    beneficiary_account_number VARCHAR(50),
    beneficiary_routing_number VARCHAR(50),
    beneficiary_bank_name VARCHAR(255),
    beneficiary_account_name VARCHAR(255),
    beneficiary_swift_code VARCHAR(11),
    beneficiary_snapshot_at TIMESTAMPTZ,
    
    -- Money (NUMERIC, never FLOAT)
    amount NUMERIC(19,4) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    functional_currency CHAR(3) NOT NULL DEFAULT 'USD',
    fx_rate NUMERIC(19,6),
    functional_amount NUMERIC(19,4),
    
    -- Dates
    payment_date DATE NOT NULL,
    due_date DATE,
    
    -- Status Machine
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'pending_approval', 'approved', 
                          'rejected', 'processing', 'completed', 'failed')),
    
    -- Actors
    created_by UUID NOT NULL,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    executed_by UUID,
    executed_at TIMESTAMPTZ,
    
    -- Traceability
    source_document_id UUID,
    source_document_type VARCHAR(50) 
        CHECK (source_document_type IN ('invoice', 'tax', 'payroll', 'bank_fee', 'deposit', 'prepayment', 'other')),
    journal_header_id UUID, -- GL posting reference
    
    -- Concurrency Control
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Idempotency
    idempotency_key UUID,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT uq_payment_number_tenant UNIQUE (tenant_id, payment_number),
    CONSTRAINT uq_idempotency_key UNIQUE (tenant_id, idempotency_key) WHERE idempotency_key IS NOT NULL,
    CONSTRAINT chk_sod_approved CHECK (
        (status NOT IN ('approved', 'processing', 'completed')) OR
        (approved_by IS NOT NULL AND approved_by <> created_by)
    ),
    CONSTRAINT chk_source_document CHECK (
        (source_document_id IS NULL AND source_document_type IS NULL) OR
        (source_document_id IS NOT NULL AND source_document_type IS NOT NULL)
    ),
    CONSTRAINT chk_amount_positive CHECK (amount > 0),
    CONSTRAINT chk_due_after_payment CHECK (due_date IS NULL OR due_date >= payment_date)
);

-- finance.payment_approvals
CREATE TABLE IF NOT EXISTS finance.payment_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES finance.payments(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    
    -- Approval Details
    approver_id UUID NOT NULL,
    decision VARCHAR(20) NOT NULL CHECK (decision IN ('approved', 'rejected')),
    comments TEXT,
    
    -- Timing
    actioned_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT uq_payment_approval UNIQUE (payment_id, approver_id)
);

-- finance.payment_outbox (Transactional Event Outbox)
CREATE TABLE IF NOT EXISTS finance.payment_outbox (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    payment_id UUID NOT NULL REFERENCES finance.payments(id) ON DELETE CASCADE,
    
    -- Event Details
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    correlation_id UUID NOT NULL,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    retry_count INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    error_message TEXT,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_payments_tenant_status ON finance.payments(tenant_id, status);
CREATE INDEX idx_payments_vendor ON finance.payments(vendor_id);
CREATE INDEX idx_payments_journal ON finance.payments(journal_header_id) WHERE journal_header_id IS NOT NULL;
CREATE INDEX idx_payment_approvals_payment ON finance.payment_approvals(payment_id);
CREATE INDEX idx_payment_outbox_pending ON finance.payment_outbox(tenant_id, status) WHERE status = 'pending';
```

### 6.2 Key Fields

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `payment_number` | VARCHAR(50) | Unique payment identifier | Generated by K_SEQ |
| `amount` | NUMERIC(19,4) | Payment amount | > 0, 4 decimal precision |
| `currency` | CHAR(3) | ISO 4217 currency code | Required, valid currency |
| `status` | VARCHAR(20) | Payment status | Enum: draft, pending_approval, approved, rejected, processing, completed, failed |
| `version` | INTEGER | Optimistic locking version | Auto-incremented on update |
| `idempotency_key` | UUID | Idempotency key | Unique per tenant |
| `journal_header_id` | UUID | GL posting reference | FK to `finance.journal_headers` |

---

## 7. Ports & APIs (Hexagonal)

### 7.1 Inbound Ports (API Endpoints)

| Method | Endpoint | Description | Auth Required | Idempotency |
|--------|----------|-------------|---------------|-------------|
| `POST` | `/api/payments` | Create payment (draft) | `ap.payment.create` | ✅ Required |
| `GET` | `/api/payments` | List payments (filtered) | `ap.payment.read` | — |
| `GET` | `/api/payments/{id}` | Get payment details | `ap.payment.read` | — |
| `POST` | `/api/payments/{id}/submit` | Submit for approval | `ap.payment.submit` | ✅ Required |
| `POST` | `/api/payments/{id}/approve` | Approve payment | `ap.payment.approve` | ✅ Required |
| `POST` | `/api/payments/{id}/reject` | Reject payment | `ap.payment.approve` | ✅ Required |
| `POST` | `/api/payments/{id}/execute` | Execute payment | `ap.payment.execute` | ✅ Required |
| `POST` | `/api/payments/{id}/complete` | Complete (bank confirmed) | `ap.payment.complete` | ✅ Required |
| `POST` | `/api/payments/{id}/fail` | Mark as failed | `ap.payment.execute` | ✅ Required |
| `POST` | `/api/payments/{id}/retry` | Retry failed payment | `ap.payment.retry` | ✅ Required |

**All mutation endpoints require:**
- `X-Idempotency-Key` header (UUID)
- `version` in request body (optimistic locking)

### 7.2 Outbound Ports

| Port | Service | Purpose | Reliability |
|------|---------|---------|-------------|
| `PaymentRepositoryPort` | SQL Adapter | Persist payment data | Blocking |
| `VendorPort` | AP-01 | Validate vendor approved | Blocking |
| `GLPostingPort` | GL-03 | Post to GL on completion | **Blocking** |
| `FiscalTimePort` (K_TIME) | Kernel | Period cutoff validation | Blocking |
| `PolicyPort` (K_POLICY) | Kernel | Approval rules, limits | Blocking |
| `AuditPort` (K_LOG) | Kernel | Immutable audit trail | **Transactional** ⚠️ |
| `EventBusPort` (K_NOTIFY) | Kernel | Publish domain events | **Async (Outbox)** |
| `SequencePort` (K_SEQ) | Kernel | Generate payment numbers | Blocking |

---

## 8. Controls & Evidence

### 8.1 Control Matrix (CONT_07 Format)

| Control ID | Assertion | Control | Evidence | Enforcement |
|:----------|:----------|:--------|:---------|:------------|
| **AP05-C01** | **Authorization** | SoD: Maker cannot approve own payment | `chk_sod_approved` constraint | **DB Constraint** |
| **AP05-C02** | **Completeness** | All mutations emit transactional audit events | `kernel.audit_events` coverage = 100% | **Transactional Audit** |
| **AP05-C03** | **Accuracy** | Idempotency: Duplicate payment creation prevented | `uq_idempotency_key` constraint | **Unique Constraint** |
| **AP05-C04** | **Completeness** | Concurrency: Optimistic locking prevents race conditions | `version` column + validation | **Optimistic Locking** |
| **AP05-C05** | **Cutoff** | Period lock: Posting blocked if period closed | K_TIME validation before posting | **Blocking Validation** |
| **AP05-C06** | **Completeness** | Immutability: Approved payments cannot be edited | Database trigger prevents updates | **DB Trigger** |
| **AP05-C07** | **Completeness** | GL posting: Completed payments have journal reference | `journal_header_id` NOT NULL after completion | **FK Constraint** |
| **AP05-C08** | **Completeness** | Beneficiary snapshot: Bank details captured at execution | `beneficiary_snapshot_at` populated | **Business Logic** |
| **AP05-C09** | **Completeness** | Tenant isolation: RLS prevents cross-tenant access | RLS policies on all tables | **RLS Policy** |

### 8.2 Evidence Artifacts

| Artifact | Location | Retention | Purpose |
|----------|----------|-----------|---------|
| **Payment Record** | `finance.payments` | 7 years | Payment evidence |
| **Approval Record** | `finance.payment_approvals` | 7 years | Approval evidence |
| **Journal Entry** | `finance.journal_headers` + `finance.journal_lines` | 7 years | GL posting evidence |
| **Audit Events** | `kernel.audit_events` | 7 years | Compliance trail |
| **Event Outbox** | `finance.payment_outbox` | 7 years | Integration evidence |
| **Beneficiary Snapshot** | `finance.payments` (beneficiary_* fields) | 7 years | Execution-time evidence |

---

## 9. UI/UX (BioSkin Architecture)

### 9.1 Component Requirements (CONT_10)

| Component | Type | Schema-Driven? | Location |
|-----------|------|----------------|----------|
| **PaymentForm** | `BioForm` | ✅ Yes | `apps/web/src/features/payment/components/PaymentForm.tsx` |
| **PaymentTable** | `BioTable` | ✅ Yes | `apps/web/src/features/payment/components/PaymentTable.tsx` |
| **PaymentDetail** | `BioObject` | ✅ Yes | `apps/web/src/features/payment/components/PaymentDetail.tsx` |
| **ApprovalQueue** | `BioTable` | ✅ Yes | `apps/web/src/features/payment/components/ApprovalQueue.tsx` |
| **PaymentStatusBadge** | `StatusBadge` | ✅ Yes | `apps/web/src/features/payment/components/PaymentStatusBadge.tsx` |

### 9.2 Schema Definition

```typescript
// packages/schemas/src/payment.schema.ts
import { z } from 'zod';

export const PaymentSchema = z.object({
  id: z.string().uuid().optional(),
  payment_number: z.string().describe('Payment number (auto-generated)'),
  vendor_id: z.string().uuid().describe('Vendor UUID'),
  vendor_name: z.string().describe('Vendor display name'),
  amount: z.string().describe('Payment amount (string for precision)'),
  currency: z.string().length(3).describe('ISO 4217 currency code'),
  payment_date: z.date().describe('Payment date'),
  due_date: z.date().optional().describe('Due date'),
  status: z.enum(['draft', 'pending_approval', 'approved', 'rejected', 'processing', 'completed', 'failed']).default('draft'),
  source_document_id: z.string().uuid().optional().describe('Source document UUID'),
  source_document_type: z.enum(['invoice', 'tax', 'payroll', 'bank_fee', 'deposit', 'prepayment', 'other']).optional(),
  version: z.number().int().positive().describe('Optimistic locking version'),
});

export type Payment = z.infer<typeof PaymentSchema>;
```

### 9.3 Design Tokens (CONT_10)

| Element | Token | Usage |
|---------|-------|-------|
| **Card Background** | `bg-surface-card` | Payment detail cards |
| **Primary Text** | `text-text-primary` | Payment amounts, vendor names |
| **Status Badge** | `text-status-*` | Status indicators (approved, processing, completed) |
| **Border** | `border-default` | Card borders, form fields |
| **Spacing** | `p-layout-md` | Card padding, form spacing |

---

## 10. Acceptance Criteria

### 10.1 Functional Requirements

| ID | Requirement | Test |
|:---|:------------|:-----|
| **AC-01** | SoD violations = 0 (Maker cannot approve own payment) | `chk_sod_approved` constraint fails |
| **AC-02** | Concurrency conflicts handled = 100% (optimistic locking) | `Concurrency.test.ts` |
| **AC-03** | Idempotent creates = 100% (duplicate prevention) | `Concurrency.test.ts` |
| **AC-04** | Period lock enforcement = 100% (closed periods blocked) | `PeriodLock.test.ts` |
| **AC-05** | Audit completeness = 100% (every mutation logged) | `Audit.test.ts` |
| **AC-06** | Money precision = 0.0001 (4 decimal places) | `Money.test.ts` |
| **AC-07** | Immutability = 100% (approved payments cannot be edited) | `Immutability.test.ts` |
| **AC-08** | Tenant isolation = 100% (RLS enforced) | `Concurrency.test.ts` |
| **AC-09** | GL posting on completion (journal_header_id populated) | Integration test |
| **AC-10** | Beneficiary snapshot captured at execution | Business logic validation |

### 10.2 Non-Functional Requirements

| ID | Requirement | Target |
|:---|:------------|:------|
| **NFR-01** | API response time (p95) | < 300ms |
| **NFR-02** | GL posting latency | < 500ms |
| **NFR-03** | Idempotency check performance | < 50ms |
| **NFR-04** | Test coverage | ≥ 90% |
| **NFR-05** | Concurrent approval handling | No race conditions |

---

## 11. Testing Requirements

### 11.1 Unit Tests

| Component | Test Coverage | Files |
|-----------|---------------|-------|
| `PaymentService` | Payment creation, period validation, idempotency | `__tests__/PaymentService.test.ts` |
| `ApprovalService` | SoD enforcement, approval workflow | `__tests__/SoD.test.ts` |
| `ExecutionService` | Execute, complete, fail, retry lifecycle | `__tests__/PaymentStateMachine.test.ts` |
| `Money` | Money precision, currency validation | `__tests__/Money.test.ts` |
| `PaymentStateMachine` | State transitions, validation | `__tests__/PaymentStateMachine.test.ts` |

### 11.2 Integration Tests

| Test | Description | File |
|------|-------------|------|
| **SoD Enforcement** | Creator cannot approve own payment | `__tests__/integration/payment-cell.integration.test.ts` |
| **Concurrency Control** | Stale version returns 409 | `__tests__/integration/payment-cell.integration.test.ts` |
| **Idempotency** | Duplicate key returns original | `__tests__/integration/payment-cell.integration.test.ts` |
| **Period Lock** | Closed period payment rejected | `__tests__/integration/payment-cell.integration.test.ts` |
| **Audit Completeness** | Every mutation has audit event | `__tests__/integration/payment-cell.integration.test.ts` |
| **Money Precision** | Money addition preserves precision | `__tests__/integration/payment-cell.integration.test.ts` |
| **Immutability** | Approved payment update throws | `__tests__/integration/payment-cell.integration.test.ts` |
| **GL Posting** | Completed payment has journal reference | `__tests__/integration/payment-cell.integration.test.ts` |

---

## 12. Success Criteria (KPIs)

| Metric | Target | Measurement | Test File |
|--------|--------|-------------|-----------|
| **SoD Violations** | 0 | Constraint failures | `SoD.test.ts` |
| **Concurrency Conflicts Handled** | 100% | Optimistic locking | `Concurrency.test.ts` |
| **Idempotent Creates** | 100% | Duplicate prevention | `Concurrency.test.ts` |
| **Period Lock Enforcement** | 100% | K_TIME validation | `PeriodLock.test.ts` |
| **Audit Completeness** | 100% | Audit event coverage | `Audit.test.ts` |
| **Money Precision** | 0.0001 | 4 decimal places | `Money.test.ts` |
| **Immutability** | 100% | Trigger enforcement | `Immutability.test.ts` |
| **Tenant Isolation** | 100% | RLS enforcement | `Concurrency.test.ts` |

---

## 13. Related Documents

| Document | Purpose | Location |
|----------|---------|----------|
| **CONT_07** | Finance Canon Architecture | `packages/canon/A-Governance/A-CONT/CONT_07_FinanceCanonArchitecture.md` |
| **CONT_10** | BioSkin Architecture | `packages/canon/A-Governance/A-CONT/CONT_10_BioSkinArchitecture.md` |
| **CONT_00** | Constitution | `packages/canon/A-Governance/A-CONT/CONT_00_Constitution.md` |
| **ADR_002** | Canon Security | `packages/canon/A-Governance/A-ADR/ADR_002_CanonSecurity.md` |
| **AP-01 PRD** | Vendor Master (upstream) | `apps/canon/finance/dom03-accounts-payable/cells/ap01-vendor-master/PRD-ap01-vendor-master.md` |
| **AP-02 PRD** | Invoice Entry (upstream) | `apps/canon/finance/dom03-accounts-payable/cells/ap02-invoice-entry/PRD-ap02-invoice-entry.md` |
| **AP-04 PRD** | Invoice Approval (upstream) | `apps/canon/finance/dom03-accounts-payable/cells/ap04-invoice-submit-approval/PRD-ap04-invoice-submit-approval.md` |

---

**Status:** ✅ Ready for Implementation  
**Implementation Status:** ✅ Complete (v1.1.0)  
**Next Step:** Production deployment readiness review

---

**Last Updated:** 2025-12-16  
**Maintainer:** Finance Cell Team  
**Review Cycle:** Quarterly
