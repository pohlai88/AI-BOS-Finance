-- ============================================================================
-- AP-02 Invoice Entry: Create ap.invoice_lines table
-- Migration: 111_create_invoice_lines.sql
-- 
-- Purpose: Invoice line items with GL account coding
-- Controls:
--   - Line amount calculation validation
--   - Account code validation (enforced by K_COA at runtime)
-- ============================================================================

-- ============================================================================
-- 1. INVOICE LINES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ap.invoice_lines (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES ap.invoices(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,

  -- Line Details
  line_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(15, 4) NOT NULL,
  unit_price_cents BIGINT NOT NULL,
  line_amount_cents BIGINT NOT NULL,  -- quantity * unit_price

  -- GL Posting
  debit_account_code VARCHAR(50) NOT NULL,  -- Expense/Asset account
  credit_account_code VARCHAR(50) NOT NULL DEFAULT '2000',  -- AP Payable (default)

  -- Classification
  cost_center VARCHAR(50),
  project_code VARCHAR(50),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1,

  -- ============================================================================
  -- CONSTRAINTS
  -- ============================================================================
  
  -- Unique line number per invoice
  CONSTRAINT uq_invoice_line_number UNIQUE (invoice_id, line_number),
  
  -- Quantity must be positive
  CONSTRAINT chk_quantity_positive CHECK (quantity > 0),
  
  -- Unit price can be zero (for free items) but not negative
  CONSTRAINT chk_unit_price_non_negative CHECK (unit_price_cents >= 0),
  
  -- Line amount must be non-negative
  CONSTRAINT chk_line_amount_non_negative CHECK (line_amount_cents >= 0)
);

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

-- Primary query: lines by invoice
CREATE INDEX idx_invoice_lines_invoice ON ap.invoice_lines(invoice_id);

-- Tenant isolation
CREATE INDEX idx_invoice_lines_tenant ON ap.invoice_lines(tenant_id);

-- GL account analysis
CREATE INDEX idx_invoice_lines_debit_account ON ap.invoice_lines(tenant_id, debit_account_code);
CREATE INDEX idx_invoice_lines_credit_account ON ap.invoice_lines(tenant_id, credit_account_code);

-- Cost center reporting
CREATE INDEX idx_invoice_lines_cost_center ON ap.invoice_lines(tenant_id, cost_center)
  WHERE cost_center IS NOT NULL;

-- Project reporting
CREATE INDEX idx_invoice_lines_project ON ap.invoice_lines(tenant_id, project_code)
  WHERE project_code IS NOT NULL;

-- ============================================================================
-- 3. TRIGGERS
-- ============================================================================

-- Prevent modification of lines for posted invoices
CREATE OR REPLACE FUNCTION ap.prevent_posted_invoice_line_update()
RETURNS TRIGGER AS $$
DECLARE
  invoice_status VARCHAR(20);
BEGIN
  -- Get parent invoice status
  SELECT status INTO invoice_status
  FROM ap.invoices
  WHERE id = COALESCE(OLD.invoice_id, NEW.invoice_id);

  IF invoice_status IN ('posted', 'paid', 'closed', 'voided') THEN
    RAISE EXCEPTION 'Cannot modify lines for posted invoice. Invoice status: %', invoice_status;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_posted_invoice_line_update
  BEFORE INSERT OR UPDATE OR DELETE ON ap.invoice_lines
  FOR EACH ROW
  EXECUTE FUNCTION ap.prevent_posted_invoice_line_update();

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE ap.invoice_lines ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy
CREATE POLICY tenant_isolation_policy ON ap.invoice_lines
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- ============================================================================
-- 5. VIEWS (Optional: for reporting)
-- ============================================================================

-- Invoice summary view (for quick lookups)
CREATE OR REPLACE VIEW ap.v_invoice_summary AS
SELECT 
  i.id,
  i.tenant_id,
  i.company_id,
  i.invoice_number,
  i.invoice_date,
  i.due_date,
  i.vendor_id,
  i.vendor_code,
  i.vendor_name,
  i.total_amount_cents,
  i.currency,
  i.status,
  i.match_status,
  i.duplicate_flag,
  i.created_at,
  i.created_by,
  COUNT(l.id) as line_count,
  SUM(l.line_amount_cents) as line_total_cents
FROM ap.invoices i
LEFT JOIN ap.invoice_lines l ON l.invoice_id = i.id
GROUP BY i.id;

COMMENT ON VIEW ap.v_invoice_summary IS 'Invoice summary with line counts for list views';

-- Invoice aging view
CREATE OR REPLACE VIEW ap.v_invoice_aging AS
SELECT 
  i.tenant_id,
  i.company_id,
  i.vendor_id,
  i.vendor_name,
  i.id as invoice_id,
  i.invoice_number,
  i.due_date,
  i.total_amount_cents,
  i.currency,
  i.status,
  CASE 
    WHEN i.due_date >= CURRENT_DATE THEN 'current'
    WHEN i.due_date >= CURRENT_DATE - INTERVAL '30 days' THEN '1-30'
    WHEN i.due_date >= CURRENT_DATE - INTERVAL '60 days' THEN '31-60'
    WHEN i.due_date >= CURRENT_DATE - INTERVAL '90 days' THEN '61-90'
    ELSE '90+'
  END as aging_bucket,
  CURRENT_DATE - i.due_date as days_overdue
FROM ap.invoices i
WHERE i.status NOT IN ('paid', 'closed', 'voided');

COMMENT ON VIEW ap.v_invoice_aging IS 'Invoice aging buckets for AP reporting';

-- ============================================================================
-- 6. COMMENTS
-- ============================================================================

COMMENT ON TABLE ap.invoice_lines IS 'AP-02 Invoice Entry: Invoice line items with GL coding';
COMMENT ON COLUMN ap.invoice_lines.line_number IS 'Line sequence number within invoice';
COMMENT ON COLUMN ap.invoice_lines.description IS 'Line item description';
COMMENT ON COLUMN ap.invoice_lines.quantity IS 'Quantity (up to 4 decimal places)';
COMMENT ON COLUMN ap.invoice_lines.unit_price_cents IS 'Unit price in cents';
COMMENT ON COLUMN ap.invoice_lines.line_amount_cents IS 'Line total in cents (quantity * unit_price)';
COMMENT ON COLUMN ap.invoice_lines.debit_account_code IS 'GL account to debit (expense/asset)';
COMMENT ON COLUMN ap.invoice_lines.credit_account_code IS 'GL account to credit (default: AP Payable)';
COMMENT ON COLUMN ap.invoice_lines.cost_center IS 'Optional cost center code';
COMMENT ON COLUMN ap.invoice_lines.project_code IS 'Optional project code';
