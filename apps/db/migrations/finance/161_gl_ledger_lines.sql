-- ============================================================================
-- GL-03 Posting Engine - Immutable Ledger
-- Migration: 161_gl_ledger_lines.sql
-- Purpose: Append-only general ledger for posted transactions
-- ============================================================================

-- Create immutable ledger table
CREATE TABLE IF NOT EXISTS gl_ledger_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  company_id UUID NOT NULL,
  
  -- Posting Identity
  posting_reference VARCHAR(100) NOT NULL,
  posting_date DATE NOT NULL,
  posting_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Source Document
  source_type VARCHAR(30) NOT NULL CHECK (source_type IN ('journal_entry', 'ap_invoice', 'ap_payment', 'ar_invoice', 'ar_receipt')),
  source_id UUID NOT NULL,
  source_line_id UUID,
  
  -- Account
  account_code VARCHAR(50) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
  
  -- Amounts (exactly one must be set)
  debit_amount NUMERIC(15, 2),
  credit_amount NUMERIC(15, 2),
  
  -- Currency
  currency VARCHAR(3) NOT NULL,
  functional_amount NUMERIC(15, 2),
  exchange_rate NUMERIC(18, 8),
  
  -- Period
  fiscal_year INTEGER NOT NULL,
  fiscal_period INTEGER NOT NULL,
  period_code VARCHAR(20) NOT NULL,
  
  -- Description
  description TEXT NOT NULL,
  
  -- Dimensions
  cost_center VARCHAR(50),
  project VARCHAR(50),
  department VARCHAR(50),
  segment VARCHAR(50),
  
  -- Reversal
  is_reversal BOOLEAN NOT NULL DEFAULT false,
  reverses_line_id UUID REFERENCES gl_ledger_lines(id),
  reversed_by_line_id UUID REFERENCES gl_ledger_lines(id),
  
  -- Audit (immutable - no updated_by)
  posted_by UUID NOT NULL,
  posted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT chk_ledger_debit_xor_credit CHECK (
    (debit_amount IS NOT NULL AND credit_amount IS NULL) OR
    (debit_amount IS NULL AND credit_amount IS NOT NULL)
  ),
  CONSTRAINT chk_ledger_positive_amount CHECK (
    (debit_amount IS NULL OR debit_amount > 0) AND
    (credit_amount IS NULL OR credit_amount > 0)
  )
);

-- ============================================================================
-- IMMUTABILITY ENFORCEMENT
-- ============================================================================

-- Prevent UPDATE on ledger lines
CREATE OR REPLACE FUNCTION gl_ledger_prevent_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow setting reversed_by_line_id (for reversal linking)
  IF OLD.reversed_by_line_id IS NULL AND NEW.reversed_by_line_id IS NOT NULL THEN
    -- Allow this specific update for reversal linking
    RETURN NEW;
  END IF;
  
  RAISE EXCEPTION 'GL Ledger is immutable: UPDATE not allowed on gl_ledger_lines';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_gl_ledger_prevent_update
  BEFORE UPDATE ON gl_ledger_lines
  FOR EACH ROW EXECUTE FUNCTION gl_ledger_prevent_update();

-- Prevent DELETE on ledger lines
CREATE OR REPLACE FUNCTION gl_ledger_prevent_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'GL Ledger is immutable: DELETE not allowed on gl_ledger_lines';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_gl_ledger_prevent_delete
  BEFORE DELETE ON gl_ledger_lines
  FOR EACH ROW EXECUTE FUNCTION gl_ledger_prevent_delete();

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_gl_ledger_tenant ON gl_ledger_lines(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gl_ledger_company ON gl_ledger_lines(tenant_id, company_id);
CREATE INDEX IF NOT EXISTS idx_gl_ledger_posting_ref ON gl_ledger_lines(posting_reference);
CREATE INDEX IF NOT EXISTS idx_gl_ledger_source ON gl_ledger_lines(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_gl_ledger_account ON gl_ledger_lines(account_code);
CREATE INDEX IF NOT EXISTS idx_gl_ledger_period ON gl_ledger_lines(fiscal_year, fiscal_period);
CREATE INDEX IF NOT EXISTS idx_gl_ledger_date ON gl_ledger_lines(posting_date);

-- Composite index for trial balance calculation
CREATE INDEX IF NOT EXISTS idx_gl_ledger_tb ON gl_ledger_lines(tenant_id, company_id, period_code, account_code);

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE gl_ledger_lines ENABLE ROW LEVEL SECURITY;

-- Read-only policy for normal users
CREATE POLICY gl_ledger_tenant_read ON gl_ledger_lines
  FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::UUID);

-- Insert-only policy for posting (no update/delete)
CREATE POLICY gl_ledger_tenant_insert ON gl_ledger_lines
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::UUID);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE gl_ledger_lines IS 'GL-03 Immutable General Ledger - append-only';
COMMENT ON COLUMN gl_ledger_lines.posting_reference IS 'Unique posting reference: POST-YYYY-MM-NNNNNN';
COMMENT ON COLUMN gl_ledger_lines.is_reversal IS 'True if this line reverses another line';
COMMENT ON CONSTRAINT chk_ledger_debit_xor_credit ON gl_ledger_lines IS 'Exactly one of debit or credit must be set';
