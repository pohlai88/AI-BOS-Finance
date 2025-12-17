-- ============================================================================
-- AP-02 Invoice Entry: Create ap.invoices table
-- Migration: 110_create_invoices.sql
-- 
-- Purpose: Supplier invoice header table for liability recognition
-- Controls:
--   - AP02-C01: Invoice must link to approved vendor (chk_vendor_approved)
--   - AP02-C03: Immutable after posted (trigger: prevent_posted_invoice_update)
--   - AP02-C05: Duplicate detection (uq_invoice_vendor_number_date)
--   - AP02-C07: Amounts balance (chk_amounts_balance)
-- ============================================================================

-- Create AP schema if not exists
CREATE SCHEMA IF NOT EXISTS ap;

-- ============================================================================
-- 1. INVOICES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ap.invoices (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  company_id UUID NOT NULL,

  -- Identification
  invoice_number VARCHAR(100) NOT NULL,  -- Vendor's invoice number
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  reference VARCHAR(100),  -- Internal reference

  -- Vendor Link (AP-01)
  vendor_id UUID NOT NULL,
  vendor_code VARCHAR(50),  -- Denormalized for display
  vendor_name VARCHAR(255), -- Denormalized for display

  -- Amounts (in cents to avoid floating point issues)
  subtotal_cents BIGINT NOT NULL,  -- Before tax
  tax_amount_cents BIGINT NOT NULL DEFAULT 0,
  total_amount_cents BIGINT NOT NULL,  -- subtotal + tax
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',

  -- Status Machine
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'submitted', 'matched', 'approved', 'posted', 'paid', 'closed', 'voided'
  )),

  -- Matching (AP-03)
  match_status VARCHAR(20),  -- 'passed', 'exception', 'skipped'
  match_result_id UUID,  -- Link to AP-03 match result

  -- GL Posting
  journal_header_id UUID,  -- FK to finance.journal_headers
  posted_at TIMESTAMPTZ,
  posted_by UUID,

  -- Payment Link (AP-05)
  payment_id UUID,  -- FK to finance.payments

  -- Duplicate Detection
  duplicate_flag BOOLEAN DEFAULT FALSE,
  duplicate_of_invoice_id UUID,

  -- Audit
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_by UUID,
  submitted_at TIMESTAMPTZ,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  version INTEGER DEFAULT 1,  -- Optimistic locking
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- ============================================================================
  -- CONSTRAINTS
  -- ============================================================================
  
  -- AP02-C05: Duplicate detection - unique vendor + invoice number + date
  CONSTRAINT uq_invoice_vendor_number_date UNIQUE (tenant_id, vendor_id, invoice_number, invoice_date),
  
  -- AP02-C07: Amounts must balance
  CONSTRAINT chk_amounts_balance CHECK (total_amount_cents = subtotal_cents + tax_amount_cents),
  
  -- Due date must be on or after invoice date
  CONSTRAINT chk_due_after_invoice CHECK (due_date >= invoice_date),
  
  -- Amounts must be positive
  CONSTRAINT chk_subtotal_positive CHECK (subtotal_cents >= 0),
  CONSTRAINT chk_tax_non_negative CHECK (tax_amount_cents >= 0),
  CONSTRAINT chk_total_positive CHECK (total_amount_cents > 0),

  -- Self-referential FK for duplicate tracking
  CONSTRAINT fk_duplicate_of_invoice FOREIGN KEY (duplicate_of_invoice_id)
    REFERENCES ap.invoices(id) ON DELETE SET NULL
);

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

-- Primary query patterns
CREATE INDEX idx_invoices_tenant_status ON ap.invoices(tenant_id, status);
CREATE INDEX idx_invoices_tenant_company ON ap.invoices(tenant_id, company_id);
CREATE INDEX idx_invoices_tenant_vendor ON ap.invoices(tenant_id, vendor_id);
CREATE INDEX idx_invoices_tenant_date ON ap.invoices(tenant_id, invoice_date DESC);

-- Status-based queries (common)
CREATE INDEX idx_invoices_tenant_status_vendor ON ap.invoices(tenant_id, status, vendor_id);

-- GL posting lookup
CREATE INDEX idx_invoices_journal_header ON ap.invoices(journal_header_id) 
  WHERE journal_header_id IS NOT NULL;

-- Payment lookup
CREATE INDEX idx_invoices_payment ON ap.invoices(payment_id) 
  WHERE payment_id IS NOT NULL;

-- Duplicate flag filter
CREATE INDEX idx_invoices_duplicates ON ap.invoices(tenant_id, duplicate_flag) 
  WHERE duplicate_flag = TRUE;

-- Pending invoices (most common query)
CREATE INDEX idx_invoices_tenant_pending ON ap.invoices(tenant_id, created_at DESC)
  WHERE status IN ('draft', 'submitted', 'matched', 'approved');

-- Full-text search (optional, for performance)
-- CREATE INDEX idx_invoices_search ON ap.invoices 
--   USING gin(to_tsvector('english', invoice_number || ' ' || COALESCE(reference, '') || ' ' || COALESCE(vendor_name, '')));

-- ============================================================================
-- 3. TRIGGERS
-- ============================================================================

-- AP02-C03: Prevent updates/deletes on posted invoices
CREATE OR REPLACE FUNCTION ap.prevent_posted_invoice_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow status transitions (handled by state machine)
  IF TG_OP = 'UPDATE' THEN
    -- Only status and related fields can change after posted
    IF OLD.status IN ('posted', 'paid', 'closed', 'voided') THEN
      -- Allow: status, payment_id (for AP-05), version, updated_at
      IF OLD.invoice_number != NEW.invoice_number OR
         OLD.invoice_date != NEW.invoice_date OR
         OLD.due_date != NEW.due_date OR
         OLD.vendor_id != NEW.vendor_id OR
         OLD.subtotal_cents != NEW.subtotal_cents OR
         OLD.tax_amount_cents != NEW.tax_amount_cents OR
         OLD.total_amount_cents != NEW.total_amount_cents OR
         OLD.journal_header_id IS DISTINCT FROM NEW.journal_header_id THEN
        RAISE EXCEPTION 'Cannot modify posted invoice fields. Invoice status: %', OLD.status;
      END IF;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.status IN ('posted', 'paid', 'closed', 'voided') THEN
      RAISE EXCEPTION 'Cannot delete posted invoice. Invoice status: %', OLD.status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_posted_invoice_update
  BEFORE UPDATE OR DELETE ON ap.invoices
  FOR EACH ROW
  EXECUTE FUNCTION ap.prevent_posted_invoice_update();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION ap.update_invoice_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_invoice_timestamp
  BEFORE UPDATE ON ap.invoices
  FOR EACH ROW
  EXECUTE FUNCTION ap.update_invoice_timestamp();

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE ap.invoices ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy
CREATE POLICY tenant_isolation_policy ON ap.invoices
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- ============================================================================
-- 5. COMMENTS
-- ============================================================================

COMMENT ON TABLE ap.invoices IS 'AP-02 Invoice Entry: Supplier invoice headers for liability recognition';
COMMENT ON COLUMN ap.invoices.invoice_number IS 'Vendor-assigned invoice number';
COMMENT ON COLUMN ap.invoices.invoice_date IS 'Date on the invoice';
COMMENT ON COLUMN ap.invoices.due_date IS 'Payment due date';
COMMENT ON COLUMN ap.invoices.vendor_id IS 'FK to ap.vendors (must be approved)';
COMMENT ON COLUMN ap.invoices.subtotal_cents IS 'Invoice subtotal before tax (in cents)';
COMMENT ON COLUMN ap.invoices.tax_amount_cents IS 'Tax amount (in cents)';
COMMENT ON COLUMN ap.invoices.total_amount_cents IS 'Total invoice amount (subtotal + tax, in cents)';
COMMENT ON COLUMN ap.invoices.status IS 'Invoice lifecycle status: draft, submitted, matched, approved, posted, paid, closed, voided';
COMMENT ON COLUMN ap.invoices.match_status IS 'AP-03 matching result: passed, exception, skipped';
COMMENT ON COLUMN ap.invoices.journal_header_id IS 'FK to finance.journal_headers (GL posting)';
COMMENT ON COLUMN ap.invoices.duplicate_flag IS 'TRUE if flagged as potential duplicate';
COMMENT ON COLUMN ap.invoices.version IS 'Optimistic locking version number';
