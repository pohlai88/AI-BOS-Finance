# Payment Hub Cell — MVP Sprint Plan

> **The Final Guardrail Before Money Moves**  
> Proving governance, control, and audit — not execution.

---

## 📋 Document Control

| Property | Value |
|----------|-------|
| **Version** | 1.0.0 |
| **Status** | 🟡 DRAFT |
| **Sprint** | 2 weeks |
| **Owner** | Finance Cell Team |
| **Derives From** | [CONT_04_PaymentHubArchitecture.md](../../packages/canon/A-Governance/A-CONT/CONT_04_PaymentHubArchitecture.md) |

---

## 🎯 MVP Goal

> **The MVP is not about moving money.**  
> **It's about proving, with mathematical certainty, that you can control *who* can move *how much* money *when*, and have a perfect record of every attempt to do so.**

### What We're Building

A **Payment Governance Cell** that demonstrates:

1. ✅ **Segregation of Duties** — Maker ≠ Checker
2. ✅ **Approval State Machine** — Draft → Pending → Approved → Completed
3. ✅ **Immutable Audit Trail** — Every action recorded in `kernel.audit_events`
4. ✅ **Deterministic Approval Rules** — Amount-based thresholds

### What We're NOT Building (Deferred)

| Feature | Reason | Target |
|---------|--------|--------|
| Treasury & Cash Pooling | Massive scope explosion | v1.1.0 |
| Real FX Rate Integration | External dependency risk | v1.1.0 |
| Bank API Integration | Production liability | v1.2.0 |
| GL Posting Integration | Requires full ledger | v1.2.0 |
| Approval Matrix UI | Configuration complexity | v1.1.0 |

---

## 🏗️ Architecture: The "Left Side" Only

```
┌─────────────────────────────────────────────────────────────────┐
│                    MVP SCOPE (Governance)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐           │
│  │ Payment  │───►│ Multi-Level  │───►│ Audit Trail  │           │
│  │ Created  │    │ Approval     │    │ (Evidence)   │           │
│  └──────────┘    └──────────────┘    └──────────────┘           │
│       │                │                    │                    │
│       ▼                ▼                    ▼                    │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐           │
│  │  DRAFT   │───►│ PENDING_     │───►│  APPROVED    │           │
│  │          │    │ APPROVAL     │    │              │           │
│  └──────────┘    └──────────────┘    └──────────────┘           │
│                                              │                   │
├──────────────────────────────────────────────┼───────────────────┤
│                    POST-MVP (Execution)      │                   │
│                                              ▼                   │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐           │
│  │ Bank API │    │ FX Service   │    │ GL Posting   │           │
│  │ (MOCK)   │    │ (MOCK)       │    │ (MOCK)       │           │
│  └──────────┘    └──────────────┘    └──────────────┘           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ MVP Simplifications

### 1. Approval Rules (Hardcoded)

Instead of a configurable approval matrix, implement a **single hardcoded rule**:

```typescript
// MVP Approval Rule (hardcoded)
function getRequiredApprovals(amountCents: number): number {
  if (amountCents >= 1000000) return 2;  // >= $10,000: 2 approvals
  if (amountCents >= 100000) return 1;   // >= $1,000: 1 approval
  return 0;                               // < $1,000: auto-approve
}
```

### 2. FX Rates (Mocked)

```typescript
// MVP FX Adapter (null implementation)
class MockFXRateAdapter implements FXRatePort {
  async getRate(from: string, to: string): Promise<number> {
    if (from === to) return 1.0;
    // Return fixed mock rates for demo
    return 1.0;
  }
}
```

### 3. Bank Integration (Mocked)

```typescript
// MVP Bank Adapter (null implementation)
class MockBankAdapter implements BankGatewayPort {
  async submitInstruction(payment: Payment): Promise<BankResult> {
    console.log(`[MOCK] Bank instruction generated for Payment ${payment.id}`);
    return { success: true, reference: `MOCK-${Date.now()}` };
  }
}
```

### 4. GL Posting (Mocked)

```typescript
// MVP GL Adapter (null implementation)
class MockGLAdapter implements GLPostingPort {
  async postJournalEntry(payment: Payment): Promise<JournalEntry> {
    console.log(`[MOCK] GL entry posted for Payment ${payment.id}`);
    return { id: crypto.randomUUID(), status: 'POSTED' };
  }
}
```

---

## 🎬 The CFO/CTO Demo Script

**Scenario: "The $50,000 Vendor Payment"**

### Setup
- **User A**: Finance Officer (Maker role)
- **User B**: Finance Manager (Checker role)
- **Rule**: Payments ≥ $10,000 require 2 approvals

### Demo Flow

| Step | Actor | Action | Expected Result |
|------|-------|--------|-----------------|
| 1 | User A | Create payment: $50,000 to "Acme Supplies" | Status: `PENDING_APPROVAL` |
| 2 | User A | Attempt to approve own payment | ❌ **DENIED** (Maker-Checker violation) |
| 3 | User B | Login and view pending payments | Payment visible in approval queue |
| 4 | User B | Approve the payment | Status: `APPROVED` (1/2 approvals) |
| 5 | User B | Attempt second approval | ❌ **DENIED** (Already approved) |
| 6 | Admin | Assign User C as second checker | User C can now approve |
| 7 | User C | Approve the payment | Status: `APPROVED` (2/2 approvals) |
| 8 | System | Auto-trigger execution | Status: `COMPLETED` (mock) |
| 9 | Auditor | Query `kernel.audit_events` | Full immutable trail visible |

### The Pitch

> "This is the AI-BOS control plane governing a payment's lifecycle. The rules are enforced by the Kernel, the audit is immutable, and the workflow is encapsulated in a Cell. The connections to banks, FX, and treasury are ports we can plug in later without changing business logic."

---

## 📅 2-Week Sprint Plan

### Week 1: Core Payment Cell

| Day | Deliverable | Owner |
|-----|-------------|-------|
| 1-2 | Database: `finance.payments`, `finance.payment_approvals` tables | DB |
| 3 | Domain: `PaymentEntity`, `ApprovalService` with hardcoded rules | Core |
| 4 | Ports: Define interfaces for FX, Bank, GL | Core |
| 5 | Adapters: Implement Mock adapters for all ports | Adapters |

### Week 2: Integration & Demo

| Day | Deliverable | Owner |
|-----|-------------|-------|
| 6 | API: `POST /payments`, `GET /payments`, `POST /payments/:id/approve` | API |
| 7 | Kernel: Register Cell, define routes and permissions | Integration |
| 8 | Frontend: Payment creation form | UI |
| 9 | Frontend: Approval queue list | UI |
| 10 | Demo: Rehearse CFO/CTO demo script | Team |

---

## 📊 Data Model (MVP Subset)

### finance.payments (Simplified)

```sql
CREATE TABLE IF NOT EXISTS finance.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES finance.companies(id),
  
  -- Traceability
  correlation_id UUID NOT NULL,
  reference VARCHAR(50) NOT NULL,
  
  -- Classification
  type VARCHAR(20) NOT NULL DEFAULT 'VENDOR',
  
  -- Status Machine
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
    'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PROCESSING', 
    'COMPLETED', 'FAILED', 'REJECTED', 'CANCELLED'
  )),
  
  -- Amount
  amount_cents BIGINT NOT NULL,
  currency VARCHAR(3) NOT NULL,
  
  -- Beneficiary
  beneficiary_name TEXT NOT NULL,
  
  -- Approval Tracking
  current_approval_level INTEGER DEFAULT 0,
  required_approval_levels INTEGER NOT NULL DEFAULT 1,
  
  -- Audit
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### finance.payment_approvals

```sql
CREATE TABLE IF NOT EXISTS finance.payment_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID NOT NULL REFERENCES finance.payments(id) ON DELETE CASCADE,
  
  -- Approval Details
  level INTEGER NOT NULL,
  approver_id UUID NOT NULL,
  decision VARCHAR(20) NOT NULL CHECK (decision IN ('APPROVED', 'REJECTED')),
  comments TEXT,
  
  -- Timing
  actioned_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate approvals
  CONSTRAINT uq_payment_approval UNIQUE (payment_id, approver_id)
);
```

---

## 🔒 Security: Non-Negotiables

Even in MVP, these controls are **mandatory**:

| Control | Implementation |
|---------|----------------|
| **Maker ≠ Checker** | `approver_id !== payment.created_by` |
| **No Self-Approval** | Check in approval service |
| **No Double-Approval** | Unique constraint on `(payment_id, approver_id)` |
| **Role-Based Access** | Kernel RBAC: `finance.payment.create`, `finance.payment.approve` |
| **Audit Trail** | Every action → `kernel.audit_events` via Kernel |

---

## ✅ MVP Acceptance Criteria

| Criterion | Test |
|-----------|------|
| Payment can be created | `POST /payments` returns 201 |
| Status starts as PENDING | `status === 'PENDING_APPROVAL'` |
| Maker cannot approve own payment | Approval returns 403 |
| Checker can approve | Approval returns 200 |
| Approval recorded | `payment_approvals` row created |
| Status updates after final approval | `status === 'APPROVED'` |
| Audit trail complete | Query `kernel.audit_events` shows all actions |
| Mock execution works | `status === 'COMPLETED'` after trigger |

---

## 🚀 Post-MVP Roadmap

| Version | Features |
|---------|----------|
| **v1.1.0** | Configurable approval matrix, real FX rates, multi-level UI |
| **v1.2.0** | Bank API integration (sandbox), GL posting |
| **v1.3.0** | Treasury pooling, intercompany settlements |
| **v2.0.0** | Production bank rails, real-time FX, hedging |

---

## 📎 Related Documents

- [CONT_04: Payment Hub Architecture](../../packages/canon/A-Governance/A-CONT/CONT_04_PaymentHubArchitecture.md) — Full architecture specification
- [CONT_03: Database Architecture](../../packages/canon/A-Governance/A-CONT/CONT_03_DatabaseArchitecture.md) — Data Fabric standard
- [CONT_02: Kernel Architecture](../../packages/canon/A-Governance/A-CONT/CONT_02_KernelArchitecture.md) — Control plane standard

---

**End of PRD-PAYMENT-HUB-MVP v1.0.0**
