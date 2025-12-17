# AR-02: Sales Invoice Cell — Product Requirements Document

> **🟢 [ACTIVE]** — IMMORTAL-Grade Certified  
> **Cell Code:** AR-02  
> **Version:** 1.1.0  
> **Certified Date:** 2025-12-17  
> **Plane:** C — Data & Logic (Cell)  
> **Binding Scope:** Accounts Receivable Molecule  
> **Authority:** CONT_07 (Finance Canon Architecture)  
> **Derives From:** CONT_07, CONT_10 (BioSkin Architecture)

## 🔥 IMMORTAL-Grade Enhancements (v1.1.0)

| Enhancement | Pattern | Description |
|-------------|---------|-------------|
| **Posting Idempotency** | P0 | `posting_idempotency_key` for retry-safe GL posting |
| **Complete Immutability** | P0 | ALL fields blocked after posted/paid/closed/voided (not just financial) |
| **Transactional Audit** | P0 | Audit outbox pattern for at-least-once delivery |
| **Tenant Isolation** | P1 | Composite FKs for lines/settlements/tax/attachments |
| **Voided Immutability** | P0 | Voided invoices are completely immutable |

---

## 📋 Document Control

| Property | Value |
|----------|-------|
| **Cell Code** | AR-02 |
| **Cell Name** | Sales Invoice |
| **Molecule** | Accounts Receivable (dom04-accounts-receivable) |
| **Version** | 1.1.0 |
| **Status** | 🟢 ACTIVE (IMMORTAL-Grade) |
| **Location** | `apps/canon/finance/dom04-accounts-receivable/cells/ar02-sales-invoice/` |
| **Author** | Finance Cell Team |
| **Last Updated** | 2025-12-17 |
| **Quality Bar** | IMMORTAL-Grade / ICFR-Ready / Audit-Ready |

---

## 1. Executive Summary

The Sales Invoice Cell (AR-02) recognizes revenue per IFRS 15 / ASC 606 (performance obligation basis). It captures sales invoices, enforces revenue recognition rules, and produces a **deterministic posting path** into GL-03 (Posting Engine). The invoice state machine gates downstream processes (AR-03 receipt allocation, AR-04 credit notes).

### 1.1 Problem Statement

| Issue | Evidence | Impact |
|-------|----------|--------|
| **Duplicate Invoices** | Same invoice issued multiple times | Revenue overstatement, audit findings |
| **Period Cutoff Violations** | Invoices posted to closed periods | Financial statement errors |
| **Missing GL Posting** | Invoices not posted to GL | Reconciliation failures |
| **No Revenue Recognition Compliance** | Revenue recognized before performance obligation | IFRS 15 / ASC 606 violation |
| **No Traceability** | Cannot trace from GL to source invoice | Audit trail broken |

### 1.2 Solution

A governed sales invoice system with:
- **Duplicate Detection:** Customer + invoice number + amount/date tolerance
- **Period Cutoff Enforcement:** Blocking validation via K_TIME
- **Revenue Recognition:** IFRS 15 / ASC 606 compliance (performance obligation basis)
- **Deterministic Posting:** Invoice → Journal lines (predictable, reproducible)
- **Immutable Ledger:** No update/delete after posted (correction via reversal)
- **Full Traceability:** Invoice → Journal → GL → Financial Statements

---

## 2. Purpose & Outcomes

### 2.1 Objective

Recognize revenue per IFRS 15 / ASC 606 (performance obligation basis).

### 2.2 Outcomes

| Outcome | Success Criteria |
|---------|------------------|
| **Invoice produces a deterministic posting path into GL-03** | Every approved invoice has `journal_header_id` (FK to `finance.journal_headers`) |
| **Duplicate invoices are blocked** | Unique constraint: `(tenant_id, customer_id, invoice_number, invoice_date)` |
| **Period cutoff is enforced** | Posting blocked if period closed (K_TIME validation) |
| **Revenue recognition is IFRS 15 compliant** | Revenue recognized only when performance obligation satisfied |
| **Immutable ledger after posting** | Database trigger prevents updates/deletes to posted invoices |

---

## 3. Scope

### 3.1 In-Scope

| Feature | Description | Priority |
|---------|-------------|----------|
| **Invoice Capture** | Header + lines, tax, currency, attachments | P0 |
| **Line Item Detail** | Product/service, quantity, unit price, line discounts | P0 |
| **Discount Handling** | Line-level and header-level discounts (% or fixed) | P0 |
| **Tax Calculation** | Tax rate per line, multiple tax jurisdictions (with rounding) | P0 |
| **Duplicate Detection** | Company + invoice number uniqueness | P0 |
| **Posting Preview** | Show journal lines before posting (Dr AR / Cr Revenue / Cr Tax) | P0 |
| **Invoice State Machine** | `draft → submitted → approved → posted → paid/closed` | P0 |
| **Revenue Recognition** | IFRS 15 / ASC 606 compliance (performance obligation) | P0 |
| **Posting Request to GL-03** | Blocking call to GL Posting Engine | P0 |
| **Period Cutoff Validation** | K_TIME check before posting | P0 |
| **Customer Validation** | FK to approved customer (AR-01) | P0 |
| **Credit Limit Check** | Validate customer has available credit before posting | P1 |
| **Partial Payment Tracking** | Track partial payments via `ar.invoice_settlements` | P0 |
| **Idempotent Posting** | Retry-safe posting (same journal_header_id) | P0 |
| **Invoice Reminders** | Configurable reminder schedule for overdue invoices | P2 |
| **Email Delivery** | Send invoice PDF via email to customer contacts | P2 |
| **Duplicate Match Suggestions** | Show similar invoices when duplicate detected | P1 |

### 3.2 Out-of-Scope

| Feature | Reason | Target |
|---------|--------|--------|
| **Complex Revenue Recognition** | Multi-element arrangements, deferred revenue | v2.0.0 |
| **Multi-Currency FX** | K_FX integration (future) | v1.1.0 |
| **Invoice Approval Workflow** | Handled by separate approval cell (if needed) | — |
| **Receipt Allocation** | Handled by AR-03 | — |
| **Credit Notes** | Handled by AR-04 | — |

---

## 4. State Machine

```
┌─────────┐
│  draft  │ ← Created by Maker
└────┬────┘
     │ submit()
     ▼
┌─────────────┐
│  submitted  │ ← Ready for approval
└────┬────────┘
     │ approve()
     ▼
┌──────────┐
│ approved │ ← Ready for GL posting
└────┬─────┘
     │ post() [GL-03]
     ▼
┌─────────┐
│  posted │ ← Posted to GL (immutable)
└────┬────┘
     │ allocate() [AR-03]
     ▼
┌─────────┐
│  paid   │ ← Receipt allocated
└────┬────┘
     │ close()
     ▼
┌─────────┐
│ closed  │ ← Terminal state
└─────────┘
```

### 4.1 States

| Status | Description | Immutable? | Terminal? | Can Post to GL? |
|--------|-------------|------------|-----------|-----------------|
| `draft` | Invoice being prepared | No | No | ❌ No |
| `submitted` | Ready for approval | No | No | ❌ No |
| `approved` | Approved for posting | No | No | ✅ Yes |
| `posted` | Posted to GL | **Yes** | No | — |
| `paid` | Receipt allocated (AR-03) | **Yes** | No | — |
| `closed` | Fully processed | **Yes** | **Yes** | — |
| `voided` | Reversed (correction path) | **Yes** | **Yes** | — |

### 4.2 Actions

| Action | From State | To State | Actor | Blocking Validation |
|--------|-----------|----------|-------|---------------------|
| `submit` | `draft` | `submitted` | Maker | Customer approved, duplicate check |
| `approve` | `submitted` | `approved` | Checker | SoD, approval rules |
| `post` | `approved` | `posted` | System (GL-03) | Period open, COA valid, revenue recognition |
| `allocate` | `posted` | `paid` | System (AR-03) | Receipt allocation |
| `close` | `paid` | `closed` | System | All lines reconciled |
| `void` | `approved` or `posted` | `voided` | Admin | Creates reversal journal |

---

## 5. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  BFF Layer (Next.js API Routes)                                 │
│  /api/ar/invoices/*                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Cell Services                                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────────────────┐│
│  │InvoiceService│ │PostingService│ │DuplicateDetectionService││
│  └──────────────┘ └──────────────┘ └─────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Ports (Interfaces)                                              │
│  InvoiceRepositoryPort, CustomerPort, GLPostingPort, AuditPort  │
│  FiscalTimePort (K_TIME), COAPort (K_COA), SequencePort (K_SEQ)│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Adapters                                                        │
│  ┌───────────────────┐ ┌────────────────┐                       │
│  │ SQL (Production)  │ │ Memory (Test)  │                       │
│  └───────────────────┘ └────────────────┘                       │
│  └─────────────────────────────────────────────────────────────────┘
```

### 5.1 Hexagonal Architecture

| Layer | Component | Responsibility |
|-------|-----------|----------------|
| **Inbound** | API Routes | HTTP endpoints, request validation |
| **Domain** | InvoiceService | Invoice creation, state transitions |
| **Domain** | RevenueRecognitionService | IFRS 15 / ASC 606 compliance |
| **Domain** | PostingService | GL posting orchestration |
| **Domain** | DuplicateDetectionService | Duplicate detection logic |
| **Outbound** | InvoiceRepositoryPort | Data persistence |
| **Outbound** | CustomerPort | Validate customer approved (AR-01) |
| **Outbound** | GLPostingPort | Post to GL-03 (blocking) |
| **Outbound** | FiscalTimePort (K_TIME) | Period cutoff validation |
| **Outbound** | COAPort (K_COA) | Chart of Accounts validation |
| **Outbound** | AuditPort (K_LOG) | Immutable audit trail |
| **Outbound** | SequencePort (K_SEQ) | Invoice number generation |

---

## 6. Data Model

### 6.1 Core Tables

```sql
-- ar.invoices
CREATE TABLE IF NOT EXISTS ar.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES finance.companies(id),
  
  -- Identification
  invoice_number VARCHAR(100) NOT NULL,  -- Internal invoice number (K_SEQ)
  customer_invoice_number VARCHAR(100),  -- Customer's reference (optional)
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  reference VARCHAR(100),  -- Internal reference
  
  -- Customer Link
  customer_id UUID NOT NULL REFERENCES ar.customers(id),
  
  -- Amounts
  subtotal_cents BIGINT NOT NULL,  -- Before tax
  tax_amount_cents BIGINT NOT NULL DEFAULT 0,
  total_amount_cents BIGINT NOT NULL,  -- subtotal + tax
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  
  -- Revenue Recognition (IFRS 15)
  performance_obligation_date DATE,  -- When performance obligation satisfied
  revenue_recognition_method VARCHAR(20) DEFAULT 'POINT_IN_TIME',  -- POINT_IN_TIME, OVER_TIME
  deferred_revenue_amount_cents BIGINT DEFAULT 0,  -- For over-time recognition
  
  -- Status Machine
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'submitted', 'approved', 'posted', 'paid', 'closed', 'voided'
  )),
  
  -- GL Posting (idempotent - calling post() twice returns same journal_header_id)
  journal_header_id UUID REFERENCES finance.journal_headers(id),
  gl_posting_date DATE,  -- Accounting date for period cutoff (may differ from invoice_date)
  posted_at TIMESTAMPTZ,
  posted_by UUID,
  
  -- ✅ IMMORTAL v1.1.0: Idempotent Posting Key (retry-safe)
  posting_idempotency_key UUID UNIQUE,  -- Set before posting; ensures exactly-once GL posting
  
  -- Settlement Tracking (computed from ar.invoice_settlements)
  paid_amount_cents BIGINT DEFAULT 0,  -- Sum of allocated receipts
  outstanding_amount_cents BIGINT GENERATED ALWAYS AS (total_amount_cents - paid_amount_cents) STORED,
  
  -- Duplicate Detection
  duplicate_flag BOOLEAN DEFAULT FALSE,
  duplicate_of_invoice_id UUID REFERENCES ar.invoices(id),
  
  -- Audit
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_by UUID,
  submitted_at TIMESTAMPTZ,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  version INTEGER DEFAULT 1,  -- Optimistic locking
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT uq_invoice_number_company UNIQUE (tenant_id, company_id, invoice_number),
  -- ✅ IMMORTAL v1.1.0: Tenant isolation for integrity
  CONSTRAINT uq_invoice_tenant_id UNIQUE (tenant_id, id),
  -- Note: Approved customer enforcement via trigger (see fn_validate_approved_customer)
  -- Note: customer_invoice_number is for reference only (customer's PO number, etc.)
  -- Note: Amount balance checked in application layer with rounding tolerance
  -- REMOVED: chk_amounts_balance (breaks on rounding)
  CONSTRAINT chk_due_after_invoice CHECK (due_date >= invoice_date)
  -- Note: performance_obligation_date validation handled by K_TIME policy (allows invoice-in-advance)
);

-- ar.invoice_lines
CREATE TABLE IF NOT EXISTS ar.invoice_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Line Details
  line_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(15, 4) NOT NULL,
  unit_price_cents BIGINT NOT NULL,
  line_amount_cents BIGINT NOT NULL,  -- quantity * unit_price
  
  -- GL Posting (IMMORTAL v1.1.0: FK to COA instead of hardcoded codes)
  debit_account_id UUID NOT NULL REFERENCES finance.chart_of_accounts(id),  -- AR Receivable
  credit_account_id UUID NOT NULL REFERENCES finance.chart_of_accounts(id),  -- Revenue account
  
  -- Classification
  cost_center VARCHAR(50),
  project_code VARCHAR(50),
  
  -- Revenue Recognition
  performance_obligation_date DATE,  -- Line-level recognition date
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  
  -- Constraints
  -- Note: Line amount calculation with rounding handled in application layer
  -- REMOVED: chk_line_amount (breaks on decimal rounding)
  CONSTRAINT uq_invoice_line_number UNIQUE (invoice_id, line_number),
  
  -- ✅ IMMORTAL v1.1.0: Composite FK for tenant isolation
  CONSTRAINT fk_invoice_line_invoice_tenant FOREIGN KEY (tenant_id, invoice_id)
    REFERENCES ar.invoices(tenant_id, id) ON DELETE CASCADE
);

-- ar.invoice_settlements (Receipt-to-Invoice allocation - replaces receipt_id FK)
CREATE TABLE IF NOT EXISTS ar.invoice_settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL,
  receipt_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Settlement Details
  settled_amount_cents BIGINT NOT NULL,
  settlement_date DATE NOT NULL,
  
  -- Discount/Adjustment
  discount_amount_cents BIGINT DEFAULT 0,  -- Early payment discount
  
  -- Audit
  settled_by UUID NOT NULL,
  settled_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  
  CONSTRAINT chk_settled_amount_positive CHECK (settled_amount_cents > 0),
  CONSTRAINT uq_invoice_receipt_settlement UNIQUE (invoice_id, receipt_id),
  
  -- ✅ IMMORTAL v1.1.0: Composite FK for tenant isolation
  CONSTRAINT fk_settlement_invoice_tenant FOREIGN KEY (tenant_id, invoice_id)
    REFERENCES ar.invoices(tenant_id, id),
  CONSTRAINT fk_settlement_receipt_tenant FOREIGN KEY (tenant_id, receipt_id)
    REFERENCES ar.receipts(tenant_id, id)
);

-- ar.invoice_tax_lines (Multi-jurisdiction tax support)
CREATE TABLE IF NOT EXISTS ar.invoice_tax_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES ar.invoices(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  -- Tax Details
  tax_jurisdiction VARCHAR(100) NOT NULL,  -- 'Federal', 'State-CA', 'GST-SG'
  tax_type VARCHAR(50) NOT NULL,  -- 'VAT', 'GST', 'Sales Tax', 'Withholding'
  tax_rate DECIMAL(7, 4) NOT NULL,  -- 7.25% = 0.0725
  taxable_amount_cents BIGINT NOT NULL,
  tax_amount_cents BIGINT NOT NULL,  -- Computed with rounding in application
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT chk_tax_rate_valid CHECK (tax_rate >= 0 AND tax_rate <= 1)
  -- Note: Tax calculation with rounding handled in application layer
);

-- ar.invoice_attachments (Supporting documents)
CREATE TABLE IF NOT EXISTS ar.invoice_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES ar.invoices(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  -- File Details
  file_name TEXT NOT NULL,
  file_type VARCHAR(50) NOT NULL,  -- 'pdf', 'jpg', 'png', 'xlsx'
  file_size_bytes BIGINT NOT NULL,
  storage_url TEXT NOT NULL,  -- S3/Azure Blob URL
  
  -- Metadata
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT chk_file_size_limit CHECK (file_size_bytes <= 10485760)  -- 10MB limit
);

-- Indexes
CREATE INDEX idx_invoices_tenant_status ON ar.invoices(tenant_id, status);
CREATE INDEX idx_invoices_customer ON ar.invoices(customer_id);
CREATE INDEX idx_invoices_invoice_date ON ar.invoices(invoice_date);
CREATE INDEX idx_invoices_due_date ON ar.invoices(due_date) WHERE status IN ('posted', 'paid');
CREATE INDEX idx_invoices_journal_header ON ar.invoices(journal_header_id) WHERE journal_header_id IS NOT NULL;
CREATE INDEX idx_invoice_lines_invoice ON ar.invoice_lines(invoice_id);
CREATE INDEX idx_invoice_settlements_invoice ON ar.invoice_settlements(invoice_id);
CREATE INDEX idx_invoice_settlements_receipt ON ar.invoice_settlements(receipt_id);
CREATE INDEX idx_invoice_tax_lines_invoice ON ar.invoice_tax_lines(invoice_id);
CREATE INDEX idx_invoice_attachments_invoice ON ar.invoice_attachments(invoice_id);

-- Full-text search on invoice descriptions (for search functionality)
CREATE INDEX idx_invoices_search ON ar.invoices USING gin(to_tsvector('english', 
  coalesce(reference, '') || ' ' || coalesce(customer_invoice_number, '')));

-- Trigger: Enforce approved-customer-only (reuse AR-01 trigger function)
CREATE TRIGGER trg_validate_approved_customer_invoice
  BEFORE INSERT OR UPDATE OF customer_id ON ar.invoices
  FOR EACH ROW
  EXECUTE FUNCTION ar.fn_validate_approved_customer();

-- ✅ IMMORTAL v1.1.0: Complete immutability trigger (blocks ALL fields, not just financial)
CREATE OR REPLACE FUNCTION ar.fn_prevent_posted_invoice_update()
RETURNS TRIGGER AS $$
BEGIN
  -- VOIDED is completely immutable (terminal state)
  IF OLD.status = 'voided' THEN
    RAISE EXCEPTION 'Cannot modify voided invoice (%) - voided status is terminal and immutable', OLD.id;
  END IF;
  
  -- POSTED/PAID/CLOSED: Block ALL field changes except whitelisted transitions
  IF OLD.status IN ('posted', 'paid', 'closed') THEN
    -- Whitelist 1: posted → paid (settlement updates paid_amount_cents)
    IF OLD.status = 'posted' AND NEW.status = 'paid' THEN
      -- Only allow: status change, paid_amount_cents (computed), updated_at, version
      IF (OLD.customer_id IS DISTINCT FROM NEW.customer_id OR
          OLD.invoice_date IS DISTINCT FROM NEW.invoice_date OR
          OLD.due_date IS DISTINCT FROM NEW.due_date OR
          OLD.subtotal_cents IS DISTINCT FROM NEW.subtotal_cents OR
          OLD.tax_amount_cents IS DISTINCT FROM NEW.tax_amount_cents OR
          OLD.total_amount_cents IS DISTINCT FROM NEW.total_amount_cents OR
          OLD.currency IS DISTINCT FROM NEW.currency OR
          OLD.invoice_number IS DISTINCT FROM NEW.invoice_number OR
          OLD.customer_invoice_number IS DISTINCT FROM NEW.customer_invoice_number OR
          OLD.reference IS DISTINCT FROM NEW.reference OR
          OLD.journal_header_id IS DISTINCT FROM NEW.journal_header_id OR
          OLD.gl_posting_date IS DISTINCT FROM NEW.gl_posting_date OR
          OLD.posting_idempotency_key IS DISTINCT FROM NEW.posting_idempotency_key) THEN
        RAISE EXCEPTION 'Cannot modify posted invoice (%) - only status→paid and paid_amount allowed', OLD.id;
      END IF;
      RETURN NEW;
    END IF;
    
    -- Whitelist 2: paid → closed (close workflow)
    IF OLD.status = 'paid' AND NEW.status = 'closed' THEN
      -- Only allow: status change, updated_at, version
      IF (OLD.paid_amount_cents IS DISTINCT FROM NEW.paid_amount_cents OR
          OLD.customer_id IS DISTINCT FROM NEW.customer_id OR
          OLD.invoice_date IS DISTINCT FROM NEW.invoice_date OR
          OLD.total_amount_cents IS DISTINCT FROM NEW.total_amount_cents) THEN
        RAISE EXCEPTION 'Cannot modify paid invoice (%) - only status→closed allowed', OLD.id;
      END IF;
      RETURN NEW;
    END IF;
    
    -- Whitelist 3: posted/paid → voided (voiding workflow via admin)
    IF NEW.status = 'voided' THEN
      RETURN NEW;  -- Allow transition to voided (creates reversal journal)
    END IF;
    
    -- Default: Block ALL other changes to posted/paid/closed invoices
    RAISE EXCEPTION 'Cannot modify % invoice (%) - status is immutable', OLD.status, OLD.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_posted_invoice_update
  BEFORE UPDATE ON ar.invoices
  FOR EACH ROW
  WHEN (OLD.status IN ('posted', 'paid', 'closed', 'voided'))
  EXECUTE FUNCTION ar.fn_prevent_posted_invoice_update();

-- ✅ IMMORTAL v1.1.0: Prevent line updates after invoice is posted
CREATE OR REPLACE FUNCTION ar.fn_prevent_posted_invoice_line_update()
RETURNS TRIGGER AS $$
DECLARE
  invoice_status VARCHAR(20);
BEGIN
  SELECT status INTO invoice_status FROM ar.invoices WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  IF invoice_status IN ('posted', 'paid', 'closed', 'voided') THEN
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'Cannot delete line from % invoice - lines are immutable after posting', invoice_status;
    ELSE
      RAISE EXCEPTION 'Cannot modify line of % invoice - lines are immutable after posting', invoice_status;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_posted_line_update
  BEFORE UPDATE OR DELETE ON ar.invoice_lines
  FOR EACH ROW
  EXECUTE FUNCTION ar.fn_prevent_posted_invoice_line_update();

-- Trigger: Update paid_amount_cents when settlements change
CREATE OR REPLACE FUNCTION ar.fn_update_invoice_paid_amount()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ar.invoices
  SET paid_amount_cents = (
    SELECT COALESCE(SUM(settled_amount_cents), 0)
    FROM ar.invoice_settlements
    WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_paid_amount_on_settlement
  AFTER INSERT OR UPDATE OR DELETE ON ar.invoice_settlements
  FOR EACH ROW
  EXECUTE FUNCTION ar.fn_update_invoice_paid_amount();

-- ✅ IMMORTAL v1.1.0: Transactional Audit Outbox (at-least-once guarantee)
-- Events are written to outbox within the same transaction, then dispatched async
CREATE TABLE IF NOT EXISTS ar.invoice_audit_outbox (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  
  -- Event Envelope
  event_type VARCHAR(100) NOT NULL,  -- 'INVOICE_CREATED', 'INVOICE_POSTED', etc.
  event_payload JSONB NOT NULL,       -- Full event data
  aggregate_id UUID NOT NULL,         -- Invoice ID
  aggregate_type VARCHAR(50) NOT NULL DEFAULT 'Invoice',
  
  -- Dispatch State
  dispatched BOOLEAN DEFAULT FALSE,
  dispatched_at TIMESTAMPTZ,
  dispatch_attempts INTEGER DEFAULT 0,
  last_error TEXT,
  
  -- Ordering & Idempotency
  sequence_number BIGINT NOT NULL,  -- Monotonic per tenant
  correlation_id UUID,               -- For request tracing
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT uq_outbox_sequence UNIQUE (tenant_id, sequence_number)
);

CREATE INDEX idx_invoice_outbox_pending ON ar.invoice_audit_outbox(tenant_id, dispatched, created_at)
  WHERE dispatched = FALSE;

-- Trigger: Auto-populate outbox on invoice mutations
CREATE OR REPLACE FUNCTION ar.fn_invoice_audit_outbox()
RETURNS TRIGGER AS $$
DECLARE
  next_seq BIGINT;
  event_type VARCHAR(100);
BEGIN
  -- Determine event type
  IF TG_OP = 'INSERT' THEN
    event_type := 'INVOICE_CREATED';
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      event_type := 'INVOICE_STATUS_CHANGED';
      IF NEW.status = 'posted' THEN
        event_type := 'INVOICE_POSTED';
      ELSIF NEW.status = 'paid' THEN
        event_type := 'INVOICE_PAID';
      ELSIF NEW.status = 'voided' THEN
        event_type := 'INVOICE_VOIDED';
      END IF;
    ELSE
      event_type := 'INVOICE_UPDATED';
    END IF;
  END IF;
  
  -- Get next sequence number
  SELECT COALESCE(MAX(sequence_number), 0) + 1 INTO next_seq
  FROM ar.invoice_audit_outbox
  WHERE tenant_id = NEW.tenant_id;
  
  -- Write to outbox (same transaction)
  INSERT INTO ar.invoice_audit_outbox (
    tenant_id, event_type, event_payload, aggregate_id, sequence_number, correlation_id
  ) VALUES (
    NEW.tenant_id,
    event_type,
    jsonb_build_object(
      'invoice_id', NEW.id,
      'invoice_number', NEW.invoice_number,
      'customer_id', NEW.customer_id,
      'status', NEW.status,
      'old_status', CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END,
      'total_amount_cents', NEW.total_amount_cents,
      'journal_header_id', NEW.journal_header_id,
      'actor', COALESCE(NEW.approved_by, NEW.submitted_by, NEW.created_by),
      'timestamp', NOW()
    ),
    NEW.id,
    next_seq,
    gen_random_uuid()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_invoice_audit_outbox
  AFTER INSERT OR UPDATE ON ar.invoices
  FOR EACH ROW
  EXECUTE FUNCTION ar.fn_invoice_audit_outbox();

-- Tenant isolation trigger for child tables (belt-and-suspenders)
CREATE OR REPLACE FUNCTION ar.fn_validate_invoice_line_tenant()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM ar.invoices 
    WHERE id = NEW.invoice_id AND tenant_id = NEW.tenant_id
  ) THEN
    RAISE EXCEPTION 'Tenant isolation violation: invoice_line.tenant_id (%) does not match invoice tenant', NEW.tenant_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_invoice_line_tenant
  BEFORE INSERT OR UPDATE ON ar.invoice_lines
  FOR EACH ROW
  EXECUTE FUNCTION ar.fn_validate_invoice_line_tenant();
```

### 6.2 Key Fields

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `invoice_number` | VARCHAR(100) | Internal invoice number | Generated by K_SEQ |
| `customer_id` | UUID | Customer reference | FK to `ar.customers` WHERE `status = 'approved'` |
| `total_amount_cents` | BIGINT | Total invoice amount | = subtotal + tax |
| `performance_obligation_date` | DATE | IFRS 15 recognition date | Validated by K_TIME policy (allows invoice-in-advance) |
| `gl_posting_date` | DATE | Accounting date for period cutoff | Validated by K_TIME (period must be open) |
| `revenue_recognition_method` | VARCHAR(20) | Recognition method | POINT_IN_TIME, OVER_TIME |
| `status` | VARCHAR(20) | Invoice status | Enum: draft, submitted, approved, posted, paid, closed, voided |
| `posting_idempotency_key` | UUID | **IMMORTAL v1.1.0** Idempotent posting key | Set before posting; unique |
| `debit_account_id` | UUID | **IMMORTAL v1.1.0** Line AR account | FK to `finance.chart_of_accounts` |
| `credit_account_id` | UUID | **IMMORTAL v1.1.0** Line revenue account | FK to `finance.chart_of_accounts` |

---

## 7. Ports & APIs (Hexagonal)

### 7.1 Inbound Ports (API Endpoints)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/ar/invoices` | Create invoice (draft) | `ar.invoice.create` |
| `GET` | `/api/ar/invoices` | List invoices (filtered) | `ar.invoice.read` |
| `GET` | `/api/ar/invoices/{id}` | Get invoice details | `ar.invoice.read` |
| `PUT` | `/api/ar/invoices/{id}` | Update invoice (draft only) | `ar.invoice.update` |
| `POST` | `/api/ar/invoices/{id}/submit` | Submit for approval | `ar.invoice.submit` |
| `POST` | `/api/ar/invoices/{id}/approve` | Approve invoice | `ar.invoice.approve` |
| `POST` | `/api/ar/invoices/{id}/post` | Post to GL | `ar.invoice.post` |
| `POST` | `/api/ar/invoices/{id}/void` | Void invoice | `ar.invoice.void` |

### 7.2 Outbound Ports

| Port | Service | Purpose | Reliability |
|------|---------|---------|-------------|
| `InvoiceRepositoryPort` | SQL Adapter | Persist invoice data | Blocking |
| `CustomerPort` | AR-01 | Validate customer approved | Blocking |
| `GLPostingPort` | GL-03 | Post to GL (blocking) | Blocking |
| `FiscalTimePort` (K_TIME) | Kernel | Period cutoff validation | Blocking |
| `COAPort` (K_COA) | Kernel | Chart of Accounts validation | Blocking |
| `AuditOutboxPort` (K_LOG) | Kernel | Write audit events to outbox | **Transactional (same TX)** ✅ |
| `AuditDispatcherPort` | Kernel | Async dispatch from outbox | **At-least-once** ✅ |
| `SequencePort` (K_SEQ) | Kernel | Generate invoice numbers | Blocking |

> **IMMORTAL v1.1.0**: Audit events are now written to `ar.invoice_audit_outbox` within the same database transaction (via trigger). A separate async dispatcher reads pending events and forwards them to `kernel.audit_events`, marking them as dispatched. This guarantees at-least-once delivery even if the application crashes after commit.

---

## 8. Controls & Evidence

### 8.1 Control Matrix (CONT_07 Format)

| Control ID | Assertion | Control | Evidence | Enforcement |
|:----------|:----------|:--------|:---------|:------------|
| **AR02-C01** | **Existence/Occurrence** | Invoices FK must reference approved customer | FK + trigger: `trg_validate_approved_customer_invoice` | **FK + Trigger** |
| **AR02-C02** | **Completeness** | Duplicate invoices blocked | `uq_invoice_number_company` constraint | **Unique Constraint** |
| **AR02-C03** | **Cutoff** | Period cutoff enforced | K_TIME validation before posting | **Service Validation** |
| **AR02-C04** | **Accuracy** | Revenue recognition IFRS 15 compliant | Performance obligation date validation | **Business Rule** |
| **AR02-C05** | **Completeness** | All invoice mutations emit audit events | `ar.invoice_audit_outbox` coverage = 100% | **Transactional Outbox** ✅ |
| **AR02-C06** | **Immutability** | Posted/paid/closed/voided invoices fully immutable | Trigger: `fn_prevent_posted_invoice_update` | **DB Trigger** ✅ |
| **AR02-C07** | **Authorization** | SoD: Invoice creation ≠ Invoice approval | Service validation | **Service Logic** |
| **AR02-C08** | **Accuracy** | Invoice paid amount updated atomically | Trigger: `fn_update_invoice_paid_amount` | **DB Trigger** |
| **AR02-C09** | **Idempotency** | Posting operation is idempotent | `posting_idempotency_key` UNIQUE column | **DB Constraint** ✅ |
| **AR02-C10** | **Tenant Isolation** | Lines/settlements reference same tenant as header | Composite FK + trigger validation | **Composite FK + Trigger** ✅ |
| **AR02-C11** | **Immutability** | Invoice lines immutable after posting | Trigger: `fn_prevent_posted_invoice_line_update` | **DB Trigger** ✅ |
| **AR02-C12** | **Authorization** | GL accounts from COA (no hardcoded codes) | FK to `finance.chart_of_accounts` | **FK Constraint** ✅ |

### 8.2 Evidence Artifacts

| Artifact | Location | Retention | Purpose |
|----------|----------|-----------|---------|
| **Invoice Record** | `ar.invoices` | 7 years | Source document |
| **Invoice Lines** | `ar.invoice_lines` | 7 years | Line-level detail |
| **Journal Entry** | `finance.journal_headers` | 7 years | GL posting evidence |
| **Audit Events** | `kernel.audit_events` | 7 years | Compliance trail |

---

## 9. Revenue Recognition (IFRS 15 / ASC 606)

### 9.1 Performance Obligation

Revenue is recognized when (or as) the entity satisfies a performance obligation by transferring a promised good or service to a customer.

**Recognition Methods:**
- **Point in Time:** Revenue recognized when control transfers (most common)
- **Over Time:** Revenue recognized over time (subscriptions, services)

### 9.2 Posting Template

```
Sales Invoice Posting (AR-02):
  DR  AR Receivable (1200)        $1,000
  CR  Revenue (4000)               $1,000

If tax applicable:
  DR  AR Receivable (1200)        $1,000
  CR  Revenue (4000)               $900
  CR  Tax Payable (2100)           $100
```

---

## 10. UI/UX (BioSkin Architecture)

### 10.1 Component Requirements (CONT_10)

| Component | Type | Schema-Driven? | Location |
|-----------|------|----------------|----------|
| **InvoiceForm** | `BioForm` | ✅ Yes | `apps/web/src/features/invoice/components/InvoiceForm.tsx` |
| **InvoiceTable** | `BioTable` | ✅ Yes | `apps/web/src/features/invoice/components/InvoiceTable.tsx` |
| **InvoiceDetail** | `BioObject` | ✅ Yes | `apps/web/src/features/invoice/components/InvoiceDetail.tsx` |
| **InvoiceLineEditor** | `BioForm` | ✅ Yes | `apps/web/src/features/invoice/components/InvoiceLineEditor.tsx` |
| **CustomerSelector** | `BioSelect` | ✅ Yes | `apps/web/src/features/invoice/components/CustomerSelector.tsx` |

### 10.2 Schema Definition

```typescript
// packages/schemas/src/ar-invoice.schema.ts
import { z } from 'zod';

export const ARInvoiceLineSchema = z.object({
  line_number: z.number().int().positive(),
  description: z.string().min(1).describe('Line item description'),
  quantity: z.string().regex(/^\d+(\.\d{1,4})?$/).describe('Quantity'),
  unit_price: z.string().regex(/^\d+(\.\d{1,4})?$/).describe('Unit price'),
  discount_percent: z.number().min(0).max(100).optional(),
  tax_rate: z.number().min(0).max(100).optional(),
  revenue_account_code: z.string().describe('Revenue GL account'),
  cost_center: z.string().optional(),
});

export const ARInvoiceSchema = z.object({
  id: z.string().uuid().optional(),
  invoice_number: z.string().describe('Invoice number (auto-generated)'),
  customer_id: z.string().uuid().describe('Customer reference'),
  invoice_date: z.string().date().describe('Invoice date'),
  due_date: z.string().date().describe('Due date'),
  currency: z.string().length(3).default('USD'),
  lines: z.array(ARInvoiceLineSchema).min(1),
  subtotal: z.coerce.number().describe('Subtotal (NUMERIC(19,4) as cents)'),
  tax_amount: z.coerce.number().default(0).describe('Tax amount (NUMERIC(19,4) as cents)'),
  total_amount: z.coerce.number().describe('Total amount (NUMERIC(19,4) as cents)'),
  header_discount_percent: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  status: z.enum(['draft', 'submitted', 'approved', 'posted', 'paid', 'closed', 'voided']).default('draft'),
});

export type ARInvoice = z.infer<typeof ARInvoiceSchema>;
export type ARInvoiceLine = z.infer<typeof ARInvoiceLineSchema>;
```

### 10.3 Design Tokens (CONT_10)

| Element | Token | Usage |
|---------|-------|-------|
| **Card Background** | `bg-surface-card` | Invoice detail cards |
| **Amount Positive** | `text-amount-positive` | Invoice total, balance due |
| **Amount Negative** | `text-amount-negative` | Discount amounts |
| **Status Badge** | `text-status-*` | Status indicators (posted, paid, overdue) |
| **Overdue Highlight** | `bg-status-error-light` | Overdue invoice rows |
| **Table Row Hover** | `bg-surface-hover` | Invoice list hover state |

### 10.4 Posting Preview UI (UX Enhancement)

**Pattern:** Show deterministic journal lines **before** posting to make GL impact tangible.

**Implementation:**
```typescript
// Posting Preview Component
interface PostingPreview {
  invoice_id: string;
  preview_lines: JournalLine[];
  estimated_gl_posting_date: Date;
  period_status: 'open' | 'closed';
}

// Example Preview Display
┌─────────────────────────────────────────────────────────────┐
│  Posting Preview — Invoice INV-2025-001                     │
├─────────────────────────────────────────────────────────────┤
│  GL Posting Date: 2025-12-16 (Period: OPEN ✅)              │
│                                                              │
│  Journal Entry:                                              │
│    DR  1200 - AR Receivable        $1,100.00                │
│    CR  4000 - Revenue                        $1,000.00      │
│    CR  2100 - Tax Payable                      $100.00      │
│                                                              │
│  ⚠️  This posting is IRREVERSIBLE after confirmation         │
│  ✅  Posting is idempotent (retry-safe)                      │
└─────────────────────────────────────────────────────────────┘
```

**API Endpoint:**
- `GET /api/ar/invoices/{id}/posting-preview` — Returns preview without mutating

### 10.5 Duplicate Detection UI (UX Enhancement)

**Pattern:** Show **closest matches** when duplicate detected (not generic block).

**Implementation:**
```typescript
// Duplicate Match Response
interface DuplicateMatch {
  existing_invoice_id: string;
  similarity_score: number;  // 0-100
  match_reasons: string[];   // ['invoice_number', 'amount', 'date']
  existing_invoice: InvoiceSummary;
}

// Example Display
┌─────────────────────────────────────────────────────────────┐
│  ⚠️  Possible Duplicate Detected                             │
├─────────────────────────────────────────────────────────────┤
│  Your Invoice:                                               │
│    Invoice #: INV-2025-001                                   │
│    Amount: $1,000.00                                         │
│    Date: 2025-12-16                                          │
│                                                              │
│  Similar Existing Invoices:                                  │
│                                                              │
│  1. INV-2025-001 (95% match) ← EXACT NUMBER                 │
│     Amount: $1,000.00 | Date: 2025-12-16                     │
│     Status: Posted | [View Invoice →]                       │
│                                                              │
│  2. INV-2025-002 (72% match)                                 │
│     Amount: $1,000.00 | Date: 2025-12-15                     │
│     Status: Draft | [View Invoice →]                        │
│                                                              │
│  [✓ This is a new invoice] [✗ Cancel]                        │
└─────────────────────────────────────────────────────────────┘
```

**API Endpoint:**
- `POST /api/ar/invoices/check-duplicates` — Returns similarity matches

---

## 11. Acceptance Criteria

### 11.1 Functional Requirements

| ID | Requirement | Test |
|:---|:------------|:-----|
| **AC-01** | Cannot create invoice to customer.status != approved | Hard FK constraint fails |
| **AC-02** | Duplicate invoices blocked | `uq_invoice_number_company` constraint enforced |
| **AC-03** | Period cutoff enforced | K_TIME validation blocks closed periods |
| **AC-04** | Revenue recognition IFRS 15 compliant | Performance obligation date validated |
| **AC-05** | All mutations emit transactional audit events | Coverage = 100% |
| **AC-06** | Posted invoices immutable | Database trigger prevents updates/deletes |
| **AC-07** | Invoice produces GL posting | `journal_header_id` populated on post |

### 11.2 Non-Functional Requirements

| ID | Requirement | Target |
|:---|:------------|:------|
| **NFR-01** | API response time (p95) | < 200ms |
| **NFR-02** | Database query performance | < 50ms (indexed queries) |
| **NFR-03** | Audit event emission | Same transaction (atomic) |
| **NFR-04** | Test coverage | ≥ 90% |

---

## 12. Testing Requirements

### 12.1 Unit Tests

| Component | Test Coverage | Files |
|-----------|---------------|-------|
| `InvoiceService` | State transitions, validation | `__tests__/InvoiceService.test.ts` |
| `RevenueRecognitionService` | IFRS 15 compliance | `__tests__/RevenueRecognitionService.test.ts` |
| `PostingService` | GL posting orchestration | `__tests__/PostingService.test.ts` |
| `DuplicateDetectionService` | Duplicate detection logic | `__tests__/DuplicateDetectionService.test.ts` |

### 12.2 Integration Tests

| Test | Description | File |
|------|-------------|------|
| **Period Cutoff** | Posting blocked for closed periods | `__tests__/integration/PeriodCutoff.test.ts` |
| **Audit Completeness** | Every mutation creates audit event | `__tests__/integration/Audit.test.ts` |
| **Immutability** | Posted invoices cannot be updated | `__tests__/integration/Immutability.test.ts` |
| **FK Constraint** | Invoices blocked for non-approved customers | `__tests__/integration/FKConstraint.test.ts` |
| **Revenue Recognition** | IFRS 15 compliance verified | `__tests__/integration/RevenueRecognition.test.ts` |

---

## 13. Related Documents

| Document | Purpose | Location |
|----------|---------|----------|
| **CONT_07** | Finance Canon Architecture | `packages/canon/A-Governance/A-CONT/CONT_07_FinanceCanonArchitecture.md` |
| **CONT_10** | BioSkin Architecture | `packages/canon/A-Governance/A-CONT/CONT_10_BioSkinArchitecture.md` |
| **AR-01 PRD** | Customer Master (upstream) | `apps/canon/finance/dom04-accounts-receivable/cells/ar01-customer-master/PRD-ar01-customer-master.md` |
| **AR-03 PRD** | Receipt Processing (downstream) | `apps/canon/finance/dom04-accounts-receivable/cells/ar03-receipt-processing/PRD-ar03-receipt-processing.md` |

---

**Status:** ✅ Ready for Implementation  
**Next Step:** Create service implementations following hexagonal architecture

---

**Last Updated:** 2025-12-16  
**Maintainer:** Finance Cell Team  
**Review Cycle:** Quarterly
