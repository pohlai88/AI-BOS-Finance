/**
 * AP-03: 3-Way Match & Controls Engine — Match Results Table
 * 
 * Migration: 120_create_match_results.sql
 * 
 * Creates the match results and exceptions tables.
 * 
 * Key Features:
 * - Match mode tracking (1-way, 2-way, 3-way)
 * - Policy source tracking (tenant, vendor, category)
 * - SoD enforcement via constraint
 * - Immutability after invoice posted (trigger)
 */

-- Ensure ap schema exists
CREATE SCHEMA IF NOT EXISTS ap;

-- ============================================================================
-- 1. MATCH RESULTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ap.match_results (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Foreign Key to Invoice
  invoice_id UUID NOT NULL REFERENCES ap.invoices(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  -- Match Configuration
  match_mode VARCHAR(10) NOT NULL CHECK (match_mode IN ('1-way', '2-way', '3-way')),
  match_policy_source VARCHAR(50) CHECK (match_policy_source IN ('tenant', 'vendor', 'category', 'default')),
  
  -- Match Status
  status VARCHAR(20) NOT NULL CHECK (status IN ('passed', 'exception', 'skipped')),
  
  -- Evidence Links (external PO/GRN references)
  purchase_order_id VARCHAR(100),
  goods_receipt_id VARCHAR(100),
  
  -- Tolerance Results
  price_variance_percent DECIMAL(10, 4),
  qty_variance_percent DECIMAL(10, 4),
  amount_variance_cents BIGINT,
  within_tolerance BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Exception Details (summary)
  exception_reason TEXT,
  exception_code VARCHAR(50),
  
  -- Override (AP03-C02: SoD enforcement)
  is_overridden BOOLEAN NOT NULL DEFAULT FALSE,
  override_approved_by UUID,
  override_approved_at TIMESTAMPTZ,
  override_reason TEXT,
  
  -- Audit
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- ============================================================================
  -- CONSTRAINTS
  -- ============================================================================
  
  -- AP03-C02: SoD for override - approver must be different from creator
  CONSTRAINT chk_sod_override CHECK (
    (is_overridden = FALSE) OR
    (is_overridden = TRUE AND override_approved_by IS NOT NULL AND override_approved_by != created_by)
  ),
  
  -- One match result per invoice
  CONSTRAINT uq_match_result_invoice UNIQUE (invoice_id)
);

-- ============================================================================
-- 2. MATCH EXCEPTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ap.match_exceptions (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Foreign Key to Match Result
  match_result_id UUID NOT NULL REFERENCES ap.match_results(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  -- Exception Details
  exception_type VARCHAR(50) NOT NULL CHECK (exception_type IN (
    'price_mismatch', 'qty_mismatch', 'amount_mismatch',
    'missing_po', 'missing_grn', 'insufficient_receipt',
    'po_closed', 'grn_closed', 'vendor_mismatch',
    'currency_mismatch', 'date_mismatch', 'other'
  )),
  severity VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  
  -- Resolution
  resolution_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (resolution_status IN ('pending', 'resolved', 'overridden')),
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- ============================================================================
  -- CONSTRAINTS
  -- ============================================================================
  
  -- Resolution requires resolver
  CONSTRAINT chk_resolution CHECK (
    (resolution_status = 'pending') OR
    (resolution_status IN ('resolved', 'overridden') AND resolved_by IS NOT NULL)
  )
);

-- ============================================================================
-- 3. INDEXES
-- ============================================================================

-- Match result lookups
CREATE INDEX IF NOT EXISTS idx_match_results_invoice ON ap.match_results(invoice_id);
CREATE INDEX IF NOT EXISTS idx_match_results_tenant_status ON ap.match_results(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_match_results_tenant_created ON ap.match_results(tenant_id, created_at DESC);

-- Exception queue (pending exceptions)
CREATE INDEX IF NOT EXISTS idx_match_results_tenant_exceptions ON ap.match_results(tenant_id, created_at DESC) 
  WHERE status = 'exception' AND is_overridden = FALSE;

-- Exception lookups
CREATE INDEX IF NOT EXISTS idx_match_exceptions_match ON ap.match_exceptions(match_result_id);
CREATE INDEX IF NOT EXISTS idx_match_exceptions_tenant_status ON ap.match_exceptions(tenant_id, resolution_status);
CREATE INDEX IF NOT EXISTS idx_match_exceptions_pending ON ap.match_exceptions(tenant_id, created_at ASC) 
  WHERE resolution_status = 'pending';

-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE ap.match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE ap.match_exceptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_match_results ON ap.match_results
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_match_exceptions ON ap.match_exceptions
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION ap.update_match_result_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_match_results_updated
  BEFORE UPDATE ON ap.match_results
  FOR EACH ROW
  EXECUTE FUNCTION ap.update_match_result_timestamp();

-- ============================================================================
-- 6. IMMUTABILITY (AP03-C03)
-- ============================================================================

-- Prevent updates to match results for posted invoices
CREATE OR REPLACE FUNCTION ap.prevent_posted_match_update()
RETURNS TRIGGER AS $$
DECLARE
  invoice_status VARCHAR(20);
BEGIN
  -- Get invoice status
  SELECT status INTO invoice_status
  FROM ap.invoices
  WHERE id = OLD.invoice_id;
  
  -- Block updates if invoice is posted/paid/closed
  IF invoice_status IN ('posted', 'paid', 'closed') THEN
    RAISE EXCEPTION 'Cannot modify match result for invoice in % status', invoice_status
      USING ERRCODE = 'P0001';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_posted_match_update
  BEFORE UPDATE ON ap.match_results
  FOR EACH ROW
  EXECUTE FUNCTION ap.prevent_posted_match_update();

-- ============================================================================
-- 7. STATISTICS
-- ============================================================================

ALTER TABLE ap.match_results ALTER COLUMN tenant_id SET STATISTICS 1000;
ALTER TABLE ap.match_results ALTER COLUMN status SET STATISTICS 500;
ALTER TABLE ap.match_results ALTER COLUMN invoice_id SET STATISTICS 500;
ALTER TABLE ap.match_exceptions ALTER COLUMN tenant_id SET STATISTICS 1000;
ALTER TABLE ap.match_exceptions ALTER COLUMN resolution_status SET STATISTICS 500;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE ap.match_results IS 'AP-03: Match evaluation results for invoices';
COMMENT ON TABLE ap.match_exceptions IS 'AP-03: Individual match exceptions/failures';
COMMENT ON COLUMN ap.match_results.match_mode IS 'Match mode: 1-way (invoice only), 2-way (PO+Invoice), 3-way (PO+GRN+Invoice)';
COMMENT ON COLUMN ap.match_results.match_policy_source IS 'Where the match mode configuration came from';
COMMENT ON COLUMN ap.match_results.is_overridden IS 'Whether the match exception was overridden (requires SoD)';
COMMENT ON CONSTRAINT chk_sod_override ON ap.match_results IS 'AP03-C02: SoD enforcement - override approver must differ from creator';
