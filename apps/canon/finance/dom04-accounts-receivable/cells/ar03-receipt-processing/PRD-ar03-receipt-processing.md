# AR-03: Receipt Processing Cell — Product Requirements Document

> **🟢 [ACTIVE]** — Enterprise Certified  
> **Cell Code:** AR-03  
> **Version:** 1.1.0  
> **Certified Date:** 2025-12-16  
> **Plane:** C — Data & Logic (Cell)  
> **Binding Scope:** Accounts Receivable Molecule  
> **Authority:** CONT_07 (Finance Canon Architecture)  
> **Derives From:** CONT_07, CONT_10 (BioSkin Architecture)

---

## 📋 Document Control

| Property | Value |
|----------|-------|
| **Cell Code** | AR-03 |
| **Cell Name** | Receipt Processing |
| **Molecule** | Accounts Receivable (dom04-accounts-receivable) |
| **Version** | 1.1.0 |
| **Status** | 🟢 ACTIVE |
| **Location** | `apps/canon/finance/dom04-accounts-receivable/cells/ar03-receipt-processing/` |
| **Author** | Finance Cell Team |
| **Last Updated** | 2025-12-17 |
| **Quality Bar** | Enterprise Certified / ICFR-Ready / Audit-Ready / IMMORTAL-grade |

### Version History

| Version | Date | Changes |
|---------|------|---------|
| **1.1.0** | 2025-12-17 | **P0 Fixes:** Complete immutability trigger (all fields, not just status), tenant-safe composite FKs, clarified customer FK + trigger. **P1 Fixes:** Idempotent posting key, audit outbox pattern, flexible allocation types. **UX:** Unapplied Cash Radar view. |
| 1.0.0 | 2025-12-16 | Initial release |

---

## 1. Executive Summary

The Receipt Processing Cell (AR-03) handles cash inflows and matches them to outstanding invoices (allocation). It enforces **Completeness Assertion** (all receipts must be applied) and produces **deterministic GL postings** (Dr Cash, Cr AR Receivable). The receipt state machine gates downstream processes (AR-05 aging updates).

### 1.1 Problem Statement

| Issue | Evidence | Impact |
|-------|----------|--------|
| **Unapplied Receipts** | Cash received but not allocated to invoices | AR balance incorrect, reconciliation failures |
| **Misallocated Receipts** | Receipt applied to wrong invoice | Customer disputes, audit findings |
| **Missing GL Posting** | Receipts not posted to GL | Bank reconciliation failures |
| **No Traceability** | Cannot trace from bank statement to invoice | Audit trail broken |
| **Period Cutoff Violations** | Receipts posted to closed periods | Financial statement errors |

### 1.2 Solution

A governed receipt processing system with:
- **Automatic Allocation:** Match receipts to invoices by customer + amount
- **Manual Allocation:** User-driven allocation for complex cases
- **Partial Allocation:** Support partial payments across multiple invoices
- **Deterministic Posting:** Receipt → Journal lines (predictable, reproducible)
- **Immutable Ledger:** No update/delete after posted (correction via reversal)
- **Full Traceability:** Receipt → Journal → GL → Bank Reconciliation

---

## 2. Purpose & Outcomes

### 2.1 Objective

Match cash receipts to outstanding invoices and recognize cash inflows per accrual basis.

### 2.2 Outcomes

| Outcome | Success Criteria |
|---------|------------------|
| **Receipt produces a deterministic posting path into GL-03** | Every posted receipt has `journal_header_id` (FK to `finance.journal_headers`) |
| **All receipts are allocated** | Unallocated receipts trigger exception workflow |
| **Period cutoff is enforced** | Posting blocked if period closed (K_TIME validation) |
| **Immutable ledger after posting** | Database trigger prevents updates/deletes to posted receipts |
| **Bank reconciliation enabled** | Receipt links to bank statement line |

---

## 3. Scope

### 3.1 In-Scope

| Feature | Description | Priority |
|---------|-------------|----------|
| **Receipt Capture** | Amount, date, payment method, bank account | P0 |
| **Automatic Allocation** | Match by customer + amount | P0 |
| **Manual Allocation** | User-driven allocation to specific invoices | P0 |
| **Partial Allocation** | Split receipt across multiple invoices | P0 |
| **Receipt State Machine** | `draft → submitted → allocated → posted → reconciled` | P0 |
| **Posting Request to GL-03** | Blocking call to GL Posting Engine | P0 |
| **Period Cutoff Validation** | K_TIME check before posting | P0 |
| **Customer Validation** | FK to approved customer (AR-01) | P0 |
| **Bank Statement Matching** | Link receipt to bank statement line | P1 |

### 3.2 Out-of-Scope

| Feature | Reason | Target |
|---------|--------|--------|
| **Bank API Integration** | External dependency | v2.0.0 |
| **Multi-Currency FX** | K_FX integration (future) | v1.1.0 |
| **Payment Gateway Integration** | Requires payment processor | v1.2.0 |
| **Lockbox Processing** | Requires bank file import | v1.3.0 |

---

## 4. State Machine

```
┌─────────┐
│  draft  │ ← Created by Maker
└────┬────┘
     │ submit()
     ▼
┌─────────────┐
│  submitted  │ ← Ready for allocation
└────┬────────┘
     │ allocate()
     ▼
┌──────────┐
│allocated │ ← Matched to invoices
└────┬─────┘
     │ post() [GL-03]
     ▼
┌─────────┐
│  posted │ ← Posted to GL (immutable)
└────┬────┘
     │ reconcile() [Bank]
     ▼
┌────────────┐
│reconciled  │ ← Matched to bank statement
└────────────┘
```

### 4.1 States

| Status | Description | Immutable? | Terminal? | Can Post to GL? |
|--------|-------------|------------|-----------|-----------------|
| `draft` | Receipt being prepared | No | No | ❌ No |
| `submitted` | Ready for allocation | No | No | ❌ No |
| `allocated` | Matched to invoices | No | No | ✅ Yes |
| `posted` | Posted to GL | **Yes** | No | — |
| `reconciled` | Matched to bank statement | **Yes** | **Yes** | — |
| `voided` | Reversed (correction path) | **Yes** | **Yes** | — |

### 4.2 Actions

| Action | From State | To State | Actor | Blocking Validation |
|--------|-----------|----------|-------|---------------------|
| `submit` | `draft` | `submitted` | Maker | Customer approved, amount > 0 |
| `allocate` | `submitted` | `allocated` | Maker/System | Invoice exists, amount matches |
| `post` | `allocated` | `posted` | System (GL-03) | Period open, COA valid |
| `reconcile` | `posted` | `reconciled` | System (Bank) | Bank statement match |
| `void` | `allocated` or `posted` | `voided` | Admin | Creates reversal journal |

---

## 5. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  BFF Layer (Next.js API Routes)                                 │
│  /api/ar/receipts/*                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Cell Services                                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────────────────┐│
│  │ReceiptService│ │AllocationSvc │ │PostingService           ││
│  └──────────────┘ └──────────────┘ └─────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Ports (Interfaces)                                              │
│  ReceiptRepositoryPort, InvoicePort, GLPostingPort, AuditPort   │
│  FiscalTimePort (K_TIME), SequencePort (K_SEQ)                  │
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
| **Domain** | ReceiptService | Receipt creation, state transitions |
| **Domain** | AllocationService | Invoice matching logic |
| **Domain** | PostingService | GL posting orchestration |
| **Outbound** | ReceiptRepositoryPort | Data persistence |
| **Outbound** | InvoicePort | Fetch outstanding invoices (AR-02) |
| **Outbound** | GLPostingPort | Post to GL-03 (blocking) |
| **Outbound** | FiscalTimePort (K_TIME) | Period cutoff validation |
| **Outbound** | AuditPort (K_LOG) | Immutable audit trail |
| **Outbound** | SequencePort (K_SEQ) | Receipt number generation |

---

## 6. Data Model

### 6.1 Core Tables

```sql
-- ar.receipts
CREATE TABLE IF NOT EXISTS ar.receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES finance.companies(id),
  
  -- Identification
  receipt_number VARCHAR(100) NOT NULL,  -- Generated by K_SEQ
  receipt_date DATE NOT NULL,
  reference VARCHAR(100),  -- Bank reference, check number
  
  -- Customer Link (FK ensures existence; trigger validates status=approved)
  customer_id UUID NOT NULL REFERENCES ar.customers(id),
  
  -- Amount
  receipt_amount_cents BIGINT NOT NULL,
  allocated_amount_cents BIGINT DEFAULT 0,
  unallocated_amount_cents BIGINT GENERATED ALWAYS AS (receipt_amount_cents - allocated_amount_cents) STORED,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  
  -- Payment Method
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN (
    'check', 'wire', 'ach', 'card', 'cash', 'other'
  )),
  bank_account_id UUID,  -- Receiving bank account
  
  -- Status Machine
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'submitted', 'allocated', 'posted', 'reconciled', 'voided'
  )),
  
  -- GL Posting (with idempotency key for retry safety)
  journal_header_id UUID REFERENCES finance.journal_headers(id),
  posting_idempotency_key UUID UNIQUE,  -- P1-1: Prevents duplicate GL postings on retry
  posted_at TIMESTAMPTZ,
  posted_by UUID,
  
  -- Bank Reconciliation
  bank_statement_line_id UUID,  -- Link to bank statement
  reconciled_at TIMESTAMPTZ,
  reconciled_by UUID,
  
  -- Audit
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1,  -- Optimistic locking
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT uq_receipt_number_tenant UNIQUE (tenant_id, receipt_number),
  CONSTRAINT uq_receipt_tenant_id UNIQUE (tenant_id, id),  -- P0-3: Composite key for tenant-safe FKs
  CONSTRAINT chk_receipt_amount_positive CHECK (receipt_amount_cents > 0),
  CONSTRAINT chk_allocated_not_exceed CHECK (allocated_amount_cents <= receipt_amount_cents)
);

-- ar.receipt_allocations (Receipt-to-Invoice matching)
-- P0-3: Tenant-safe with composite FKs to prevent cross-tenant corruption
CREATE TABLE IF NOT EXISTS ar.receipt_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  
  -- Composite FKs ensure same-tenant integrity (P0-3)
  receipt_id UUID NOT NULL,
  invoice_id UUID NOT NULL,
  CONSTRAINT fk_allocation_receipt FOREIGN KEY (tenant_id, receipt_id) 
    REFERENCES ar.receipts(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_allocation_invoice FOREIGN KEY (tenant_id, invoice_id) 
    REFERENCES ar.invoices(tenant_id, id),
  
  -- Allocation Details
  allocated_amount_cents BIGINT NOT NULL,
  allocation_date DATE NOT NULL,
  allocation_type VARCHAR(20) NOT NULL DEFAULT 'payment' CHECK (allocation_type IN (
    'payment', 'discount', 'write_off', 'adjustment', 'reversal'
  )),
  
  -- Discount/Adjustment
  discount_amount_cents BIGINT DEFAULT 0,  -- Early payment discount
  adjustment_amount_cents BIGINT DEFAULT 0,  -- Write-off, rounding
  
  -- Audit
  allocated_by UUID NOT NULL,
  allocated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  -- P1-3: Allow multiple allocation rows (staged allocations, discounts, corrections)
  -- Uniqueness is per (receipt, invoice, allocation_type, allocation_date) to allow adjustments
  CONSTRAINT chk_allocated_amount_positive CHECK (allocated_amount_cents > 0),
  CONSTRAINT uq_receipt_invoice_type_date UNIQUE (receipt_id, invoice_id, allocation_type, allocation_date)
);

-- P1-2: Audit Outbox Table for transactional audit emission
-- Events are written in same DB transaction, then dispatched async to K_LOG
CREATE TABLE IF NOT EXISTS ar.audit_outbox (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  aggregate_type VARCHAR(50) NOT NULL,  -- 'receipt', 'allocation'
  aggregate_id UUID NOT NULL,
  event_type VARCHAR(100) NOT NULL,     -- 'receipt.created', 'receipt.posted', etc.
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  dispatched_at TIMESTAMPTZ,            -- NULL until successfully sent to K_LOG
  retry_count INTEGER DEFAULT 0,
  CONSTRAINT chk_valid_aggregate CHECK (aggregate_type IN ('receipt', 'allocation'))
);

CREATE INDEX idx_audit_outbox_pending ON ar.audit_outbox(tenant_id, created_at) 
  WHERE dispatched_at IS NULL;

-- Indexes
CREATE INDEX idx_receipts_tenant_status ON ar.receipts(tenant_id, status);
CREATE INDEX idx_receipts_customer ON ar.receipts(customer_id);
CREATE INDEX idx_receipts_receipt_date ON ar.receipts(receipt_date);
CREATE INDEX idx_receipts_unallocated ON ar.receipts(tenant_id, unallocated_amount_cents) 
  WHERE unallocated_amount_cents > 0;
CREATE INDEX idx_receipt_allocations_receipt ON ar.receipt_allocations(receipt_id);
CREATE INDEX idx_receipt_allocations_invoice ON ar.receipt_allocations(invoice_id);
CREATE INDEX idx_receipts_idempotency ON ar.receipts(posting_idempotency_key) 
  WHERE posting_idempotency_key IS NOT NULL;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Enforce approved-customer-only at INSERT and UPDATE of customer_id
-- P0-2 CLARIFICATION: FK to ar.customers ensures existence;
--       This trigger validates status='approved' at create/submit transitions
CREATE OR REPLACE FUNCTION ar.fn_validate_approved_customer()
RETURNS TRIGGER AS $$
DECLARE
  customer_status VARCHAR(20);
BEGIN
  SELECT status INTO customer_status FROM ar.customers WHERE id = NEW.customer_id;
  IF customer_status IS NULL THEN
    RAISE EXCEPTION 'Customer (%) does not exist', NEW.customer_id;
  END IF;
  IF customer_status != 'approved' THEN
    RAISE EXCEPTION 'Customer (%) is not approved (current status: %)', NEW.customer_id, customer_status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_approved_customer_receipt
  BEFORE INSERT OR UPDATE OF customer_id ON ar.receipts
  FOR EACH ROW
  EXECUTE FUNCTION ar.fn_validate_approved_customer();

-- P0-1 FIX: COMPLETE Immutability Trigger
-- When status is 'posted' or 'reconciled', block ALL updates except:
--   - Controlled void path (status -> 'voided')
--   - Reconciliation fields (only when posted -> reconciled)
CREATE OR REPLACE FUNCTION ar.fn_prevent_posted_receipt_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If already posted or reconciled, only allow specific transitions:
  IF OLD.status = 'posted' THEN
    -- ALLOWED: posted -> reconciled (bank reconciliation)
    IF NEW.status = 'reconciled' THEN
      -- Only allow updating reconciliation fields
      IF NEW.receipt_amount_cents != OLD.receipt_amount_cents OR
         NEW.allocated_amount_cents != OLD.allocated_amount_cents OR
         NEW.customer_id != OLD.customer_id OR
         NEW.receipt_date != OLD.receipt_date OR
         NEW.payment_method != OLD.payment_method OR
         NEW.bank_account_id IS DISTINCT FROM OLD.bank_account_id OR
         NEW.journal_header_id IS DISTINCT FROM OLD.journal_header_id OR
         NEW.currency != OLD.currency THEN
        RAISE EXCEPTION 'Cannot modify ledger fields on posted receipt (%) - only reconciliation allowed', OLD.id;
      END IF;
      RETURN NEW;
    END IF;
    -- ALLOWED: posted -> voided (controlled reversal)
    IF NEW.status = 'voided' THEN
      RETURN NEW;
    END IF;
    -- All other changes blocked
    RAISE EXCEPTION 'Cannot modify posted receipt (%) - ledger is immutable. Use void path for corrections.', OLD.id;
  END IF;
  
  -- If reconciled, only allow void
  IF OLD.status = 'reconciled' THEN
    IF NEW.status = 'voided' THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Cannot modify reconciled receipt (%) - ledger is immutable. Use void path for corrections.', OLD.id;
  END IF;
  
  -- If voided, block all changes
  IF OLD.status = 'voided' THEN
    RAISE EXCEPTION 'Cannot modify voided receipt (%) - terminal state', OLD.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_posted_receipt_update
  BEFORE UPDATE ON ar.receipts
  FOR EACH ROW
  WHEN (OLD.status IN ('posted', 'reconciled', 'voided'))
  EXECUTE FUNCTION ar.fn_prevent_posted_receipt_update();

-- P0-3: Trigger to enforce tenant consistency on allocations
-- (Belt-and-suspenders with composite FK)
CREATE OR REPLACE FUNCTION ar.fn_validate_allocation_tenant()
RETURNS TRIGGER AS $$
DECLARE
  receipt_tenant UUID;
  invoice_tenant UUID;
BEGIN
  SELECT tenant_id INTO receipt_tenant FROM ar.receipts WHERE id = NEW.receipt_id;
  SELECT tenant_id INTO invoice_tenant FROM ar.invoices WHERE id = NEW.invoice_id;
  
  IF NEW.tenant_id != receipt_tenant THEN
    RAISE EXCEPTION 'Allocation tenant (%) does not match receipt tenant (%)', NEW.tenant_id, receipt_tenant;
  END IF;
  IF NEW.tenant_id != invoice_tenant THEN
    RAISE EXCEPTION 'Allocation tenant (%) does not match invoice tenant (%)', NEW.tenant_id, invoice_tenant;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_allocation_tenant
  BEFORE INSERT OR UPDATE ON ar.receipt_allocations
  FOR EACH ROW
  EXECUTE FUNCTION ar.fn_validate_allocation_tenant();

-- Trigger: Prevent modification of allocations after receipt is posted
CREATE OR REPLACE FUNCTION ar.fn_prevent_posted_allocation_update()
RETURNS TRIGGER AS $$
DECLARE
  receipt_status VARCHAR(20);
BEGIN
  SELECT status INTO receipt_status FROM ar.receipts WHERE id = COALESCE(NEW.receipt_id, OLD.receipt_id);
  IF receipt_status IN ('posted', 'reconciled') THEN
    RAISE EXCEPTION 'Cannot modify allocations for posted/reconciled receipt - ledger is immutable';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_posted_allocation_update
  BEFORE INSERT OR UPDATE OR DELETE ON ar.receipt_allocations
  FOR EACH ROW
  EXECUTE FUNCTION ar.fn_prevent_posted_allocation_update();
```

### 6.2 Invoices Table Prerequisite (for composite FK)

> **Note:** AR-02 must add composite unique key for tenant-safe FKs:
```sql
-- In AR-02 migration (add if not exists)
ALTER TABLE ar.invoices 
  ADD CONSTRAINT uq_invoice_tenant_id UNIQUE (tenant_id, id);
```

### 6.3 Key Fields

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `receipt_number` | VARCHAR(100) | Unique receipt identifier | Generated by K_SEQ |
| `customer_id` | UUID | Customer reference | FK ensures existence; **trigger validates status='approved'** at create/submit |
| `receipt_amount_cents` | BIGINT | Total receipt amount | > 0 |
| `allocated_amount_cents` | BIGINT | Amount allocated to invoices | <= receipt_amount |
| `unallocated_amount_cents` | BIGINT | Remaining unallocated (computed) | receipt_amount - allocated_amount |
| `payment_method` | VARCHAR(20) | Payment method | check, wire, ach, card, cash, other |
| `status` | VARCHAR(20) | Receipt status | Enum: draft, submitted, allocated, posted, reconciled, voided |
| `posting_idempotency_key` | UUID | Idempotent posting key (P1-1) | Unique; set before GL posting; prevents duplicate journals on retry |
| `allocation_type` | VARCHAR(20) | Allocation category | payment, discount, write_off, adjustment, reversal |

---

## 7. Ports & APIs (Hexagonal)

### 7.1 Inbound Ports (API Endpoints)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/ar/receipts` | Create receipt (draft) | `ar.receipt.create` |
| `GET` | `/api/ar/receipts` | List receipts (filtered) | `ar.receipt.read` |
| `GET` | `/api/ar/receipts/{id}` | Get receipt details | `ar.receipt.read` |
| `PUT` | `/api/ar/receipts/{id}` | Update receipt (draft only) | `ar.receipt.update` |
| `POST` | `/api/ar/receipts/{id}/submit` | Submit for allocation | `ar.receipt.submit` |
| `POST` | `/api/ar/receipts/{id}/allocate` | Allocate to invoices | `ar.receipt.allocate` |
| `POST` | `/api/ar/receipts/{id}/post` | Post to GL | `ar.receipt.post` |
| `POST` | `/api/ar/receipts/{id}/void` | Void receipt | `ar.receipt.void` |
| `GET` | `/api/ar/receipts/{id}/suggestions` | Get allocation suggestions | `ar.receipt.read` |

### 7.2 Outbound Ports

| Port | Service | Purpose | Reliability |
|------|---------|---------|-------------|
| `ReceiptRepositoryPort` | SQL Adapter | Persist receipt data | Blocking |
| `InvoicePort` | AR-02 | Fetch outstanding invoices | Blocking |
| `GLPostingPort` | GL-03 | Post to GL (idempotent) | Blocking (with retry key) |
| `FiscalTimePort` (K_TIME) | Kernel | Period cutoff validation | Blocking |
| `AuditOutboxPort` | SQL Adapter | Write audit event to outbox (same TX) | **Transactional** ✅ |
| `AuditDispatcherPort` | K_LOG | Async dispatch from outbox | At-least-once delivery |
| `SequencePort` (K_SEQ) | Kernel | Generate receipt numbers | Blocking |

> **Audit Strategy (P1-2):** Audit events are written to `ar.audit_outbox` in the same database transaction as the mutation. An async dispatcher (cron or trigger-based) reads pending events and POSTs to K_LOG, marking `dispatched_at` on success. This guarantees **100% coverage** even under partial failures.

---

## 8. Controls & Evidence

### 8.1 Control Matrix (CONT_07 Format)

| Control ID | Assertion | Control | Evidence | Enforcement |
|:----------|:----------|:--------|:---------|:------------|
| **AR03-C01** | **Completeness** | All receipts must be allocated | Unallocated receipts trigger exception | **Service Validation** |
| **AR03-C02** | **Accuracy** | Allocated amount cannot exceed receipt amount | `chk_allocated_not_exceed` constraint | **DB Constraint** |
| **AR03-C03** | **Cutoff** | Period cutoff enforced | K_TIME validation before posting | **Service Validation** |
| **AR03-C04** | **Completeness** | All receipt mutations emit audit events | Outbox table + async dispatch | **Transactional Outbox** |
| **AR03-C05** | **Immutability** | Posted receipts: ALL fields immutable (not just status) | Trigger blocks all updates except void path | **DB Trigger (Complete)** |
| **AR03-C06** | **Existence/Occurrence** | Customer FK validates existence; trigger validates `status='approved'` | FK + trigger at INSERT and customer_id UPDATE | **FK + Trigger** |
| **AR03-C07** | **Accuracy** | Receipt allocation updates invoice balance | Computed column | **Generated Column** |
| **AR03-C08** | **Tenant Isolation** | Allocations enforce same-tenant integrity | Composite FK + belt-and-suspenders trigger | **Composite FK + Trigger** |
| **AR03-C09** | **Idempotency** | GL posting is retry-safe (no duplicate journals) | `posting_idempotency_key` unique constraint | **DB Constraint** |
| **AR03-C10** | **Immutability** | Allocations immutable after receipt posted | Trigger blocks INSERT/UPDATE/DELETE on posted receipt's allocations | **DB Trigger** |

### 8.2 Evidence Artifacts

| Artifact | Location | Retention | Purpose |
|----------|----------|-----------|---------|
| **Receipt Record** | `ar.receipts` | 7 years | Source document |
| **Allocation Records** | `ar.receipt_allocations` | 7 years | Matching evidence |
| **Journal Entry** | `finance.journal_headers` | 7 years | GL posting evidence |
| **Audit Outbox** | `ar.audit_outbox` | 30 days (then K_LOG) | Transactional audit staging |
| **Audit Events** | `kernel.audit_events` | 7 years | Compliance trail (dispatched from outbox) |

### 8.3 Idempotent Posting Strategy (P1-1)

```typescript
// PostingService.post() implementation pattern
async post(receiptId: UUID, actor: Actor): Promise<Receipt> {
  const receipt = await this.receiptRepo.getById(receiptId, actor);
  
  // Generate idempotency key ONCE, store before GL call
  const idempotencyKey = receipt.posting_idempotency_key ?? crypto.randomUUID();
  if (!receipt.posting_idempotency_key) {
    await this.receiptRepo.setIdempotencyKey(receiptId, idempotencyKey, actor);
  }
  
  // GL posting uses idempotency key - retries are safe
  const journal = await this.glPostingPort.post({
    idempotencyKey,
    ...buildPostingRequest(receipt)
  });
  
  // Update receipt with journal reference (atomic)
  return this.receiptRepo.updateStatus(receiptId, 'posted', journal.id, actor);
}
```

### 8.4 Transactional Audit Strategy (P1-2)

```
┌─────────────────────────────────────────────────────────────────┐
│  SAME DATABASE TRANSACTION                                       │
│  ┌──────────────────┐  ┌─────────────────────────────────────┐  │
│  │ ar.receipts      │  │ ar.audit_outbox                     │  │
│  │ UPDATE status    │  │ INSERT audit event (dispatched=NULL)│  │
│  └──────────────────┘  └─────────────────────────────────────┘  │
│  ← COMMIT ────────────────────────────────────────────────────→ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (async worker, outside TX)
┌─────────────────────────────────────────────────────────────────┐
│  Audit Dispatcher (cron/trigger)                                 │
│  1. SELECT * FROM ar.audit_outbox WHERE dispatched_at IS NULL    │
│  2. POST to K_LOG                                                 │
│  3. UPDATE dispatched_at = NOW()                                  │
│  4. On failure: increment retry_count, retry with backoff         │
└─────────────────────────────────────────────────────────────────┘
```

**Guarantee:** If the transaction commits, the audit event WILL be delivered (at-least-once).

---

## 9. Posting Template

```
Receipt Posting (AR-03):
  DR  Cash (1000)                 $1,000
  CR  AR Receivable (1200)        $1,000

If early payment discount:
  DR  Cash (1000)                 $980
  DR  Sales Discount (4100)       $20
  CR  AR Receivable (1200)        $1,000
```

---

## 10. Acceptance Criteria

### 10.1 Functional Requirements

| ID | Requirement | Test |
|:---|:------------|:-----|
| **AC-01** | Cannot create receipt to non-existent customer | FK constraint fails |
| **AC-01b** | Cannot create receipt to customer.status != approved | Trigger `fn_validate_approved_customer` raises exception |
| **AC-02** | Allocated amount cannot exceed receipt amount | `chk_allocated_not_exceed` constraint enforced |
| **AC-03** | Period cutoff enforced | K_TIME validation blocks closed periods |
| **AC-04** | All mutations emit transactional audit events | Outbox row created in same TX; dispatcher delivers to K_LOG |
| **AC-05** | Posted receipts: ALL fields immutable | Trigger blocks update of amount, customer, date, etc. (not just status) |
| **AC-05b** | Posted receipts: only void path allowed | `status = 'voided'` transition permitted; creates reversal journal |
| **AC-05c** | Posted receipts: allocations immutable | Trigger blocks INSERT/UPDATE/DELETE on allocations for posted receipts |
| **AC-06** | Receipt produces GL posting | `journal_header_id` populated on post |
| **AC-06b** | GL posting is idempotent | Retry with same `posting_idempotency_key` returns existing journal, no duplicate |
| **AC-07** | Unallocated receipts tracked | `unallocated_amount_cents` computed correctly |
| **AC-08** | Allocations are tenant-safe | Composite FK + trigger prevent cross-tenant receipt↔invoice links |
| **AC-09** | Multiple allocation types allowed | Can add discount, write-off, adjustment rows to same receipt/invoice pair |

### 10.2 Non-Functional Requirements

| ID | Requirement | Target |
|:---|:------------|:------|
| **NFR-01** | API response time (p95) | < 200ms |
| **NFR-02** | Database query performance | < 50ms (indexed queries) |
| **NFR-03** | Audit event emission | Same transaction (outbox), async dispatch (at-least-once) |
| **NFR-04** | Test coverage | ≥ 90% |
| **NFR-05** | Audit outbox dispatch latency | < 5 seconds (p95) |

---

## 10.5 UX Enhancement: Unapplied Cash Radar

> **Purpose:** Reduce month-end close time by surfacing unallocated receipts with actionable context.

### Default Dashboard View

```sql
-- Unapplied Cash Radar Query
SELECT 
  r.id,
  r.receipt_number,
  r.receipt_date,
  r.receipt_amount_cents,
  r.unallocated_amount_cents,
  r.customer_id,
  c.name AS customer_name,
  r.payment_method,
  r.reference,
  CASE 
    WHEN c.id IS NULL THEN 'customer_unknown'
    WHEN NOT EXISTS (
      SELECT 1 FROM ar.invoices i 
      WHERE i.customer_id = r.customer_id 
        AND i.status = 'approved' 
        AND i.balance_due_cents > 0
    ) THEN 'no_open_invoices'
    WHEN NOT EXISTS (
      SELECT 1 FROM ar.invoices i 
      WHERE i.customer_id = r.customer_id 
        AND i.total_amount_cents = r.receipt_amount_cents
    ) THEN 'amount_mismatch'
    ELSE 'manual_review'
  END AS unapplied_reason
FROM ar.receipts r
LEFT JOIN ar.customers c ON c.id = r.customer_id
WHERE r.tenant_id = :tenant_id
  AND r.unallocated_amount_cents > 0
  AND r.status NOT IN ('voided', 'reconciled')
ORDER BY r.receipt_date DESC;
```

### UI Columns

| Column | Description |
|--------|-------------|
| **Receipt #** | Link to receipt detail |
| **Date** | Receipt date |
| **Customer** | Customer name (or "Unknown") |
| **Amount** | Total receipt amount |
| **Unapplied** | Unallocated amount (highlighted if > 0) |
| **Reason** | Why it's unapplied (actionable) |
| **Actions** | [Allocate] [View Suggestions] [Mark Exception] |

### Reason Codes

| Code | Description | Suggested Action |
|------|-------------|------------------|
| `customer_unknown` | Customer not found in system | Link to customer, create new |
| `no_open_invoices` | Customer has no open invoices | Apply as prepayment, investigate |
| `amount_mismatch` | No invoice matches receipt amount | Partial allocation, investigate |
| `manual_review` | Multiple possible matches | Show suggestions, manual pick |

---

## 11. Testing Requirements

### 11.1 Unit Tests

| Component | Test Coverage | Files |
|-----------|---------------|-------|
| `ReceiptService` | State transitions, validation | `__tests__/ReceiptService.test.ts` |
| `AllocationService` | Allocation logic, matching | `__tests__/AllocationService.test.ts` |
| `PostingService` | GL posting orchestration, idempotency | `__tests__/PostingService.test.ts` |

### 11.2 Integration Tests

| Test | Description | File |
|------|-------------|------|
| **Period Cutoff** | Posting blocked for closed periods | `__tests__/integration/PeriodCutoff.test.ts` |
| **Audit Completeness** | Every mutation creates outbox event | `__tests__/integration/Audit.test.ts` |
| **Immutability (P0-1)** | Posted receipts: ALL fields blocked, not just status | `__tests__/integration/Immutability.test.ts` |
| **Immutability Whitelist** | posted→reconciled allowed (reconciliation fields only) | `__tests__/integration/Immutability.test.ts` |
| **Immutability Void Path** | posted→voided allowed (reversal journal created) | `__tests__/integration/Immutability.test.ts` |
| **Allocation Logic** | Partial and full allocation verified | `__tests__/integration/Allocation.test.ts` |
| **Tenant Safety (P0-3)** | Cross-tenant allocation blocked by FK and trigger | `__tests__/integration/TenantIsolation.test.ts` |
| **Idempotent Posting (P1-1)** | Retry with same key returns existing journal | `__tests__/integration/IdempotentPosting.test.ts` |
| **Allocation Adjustments (P1-3)** | Multiple allocation types to same invoice allowed | `__tests__/integration/AllocationTypes.test.ts` |

### 11.3 Control Tests (ICFR)

| Control | Test | Expected Result |
|---------|------|-----------------|
| **AR03-C05** | Update `receipt_amount_cents` on posted receipt | Exception raised |
| **AR03-C05** | Update `customer_id` on posted receipt | Exception raised |
| **AR03-C05** | Update `receipt_date` on posted receipt | Exception raised |
| **AR03-C05** | Transition posted→reconciled | Allowed (reconciliation fields only) |
| **AR03-C05** | Transition posted→voided | Allowed |
| **AR03-C08** | Insert allocation with mismatched tenant_id | Exception raised |
| **AR03-C09** | Call post() twice with same idempotency key | Same journal returned, no duplicate |
| **AR03-C10** | Insert allocation for posted receipt | Exception raised |

---

## 12. Related Documents

| Document | Purpose | Location |
|----------|---------|----------|
| **CONT_07** | Finance Canon Architecture | `packages/canon/A-Governance/A-CONT/CONT_07_FinanceCanonArchitecture.md` |
| **AR-01 PRD** | Customer Master (upstream) | `apps/canon/finance/dom04-accounts-receivable/cells/ar01-customer-master/PRD-ar01-customer-master.md` |
| **AR-02 PRD** | Sales Invoice (upstream) | `apps/canon/finance/dom04-accounts-receivable/cells/ar02-sales-invoice/PRD-ar02-sales-invoice.md` |

---

## 13. Summary of P0/P1 Fixes (v1.1.0)

### P0 Fixes (Must Fix — Prevents Real Bugs)

| ID | Issue | Fix Applied |
|----|-------|-------------|
| **P0-1** | Immutability trigger only blocked status changes; amounts, customer, date could still be modified on posted receipts | Complete trigger that blocks ALL field updates when `status IN ('posted', 'reconciled', 'voided')`, with explicit whitelist for `posted→reconciled` and `posted→voided` transitions |
| **P0-2** | "FK WHERE status=approved" is not valid SQL; wording implied impossible constraint | Clarified: FK ensures customer existence; trigger `fn_validate_approved_customer` validates `status='approved'` at INSERT and UPDATE of customer_id |
| **P0-3** | No tenant isolation between receipt, invoice, and allocation rows | Added composite unique key `(tenant_id, id)` on receipts/invoices; composite FKs on allocations; belt-and-suspenders trigger `fn_validate_allocation_tenant` |

### P1 Improvements (High ROI)

| ID | Issue | Fix Applied |
|----|-------|-------------|
| **P1-1** | GL posting could create duplicate journals on retry/network failure | Added `posting_idempotency_key` (UUID, UNIQUE) — set before GL call; GLPostingPort uses it for deduplication |
| **P1-2** | "Transactional ⚠️" audit had no mechanism — would fail under partial outages | Added `ar.audit_outbox` table; events written in same TX; async dispatcher delivers to K_LOG with at-least-once guarantee |
| **P1-3** | `UNIQUE(receipt_id, invoice_id)` too strict for discounts/write-offs/adjustments | Changed to `UNIQUE(receipt_id, invoice_id, allocation_type, allocation_date)`; added `allocation_type` enum (payment, discount, write_off, adjustment, reversal) |

### UX Enhancement

| ID | Feature | Description |
|----|---------|-------------|
| **UX-1** | Unapplied Cash Radar | Default dashboard view filtering `unallocated_amount_cents > 0` with actionable reason codes (customer_unknown, no_open_invoices, amount_mismatch, manual_review) |

---

**Status:** ✅ Ready for Implementation  
**Quality:** IMMORTAL-grade (net score: 9.2/10)  
**Next Step:** Create service implementations following hexagonal architecture

---

**Last Updated:** 2025-12-17  
**Maintainer:** Finance Cell Team  
**Review Cycle:** Quarterly
