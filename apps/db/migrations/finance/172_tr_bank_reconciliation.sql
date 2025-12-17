-- ============================================================================
-- TR-05 Bank Reconciliation
-- Migration: 172_tr_bank_reconciliation.sql
-- Purpose: Bank statement matching and reconciliation
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE tr_statement_format AS ENUM (
  'mt940',
  'bai2',
  'csv',
  'camt053'
);

CREATE TYPE tr_match_status AS ENUM (
  'unmatched',
  'auto_matched',
  'manual_matched',
  'exception'
);

CREATE TYPE tr_reconciling_item_type AS ENUM (
  'deposit_in_transit',
  'outstanding_check',
  'bank_charge',
  'bank_interest',
  'bank_error',
  'book_error',
  'timing_difference',
  'other'
);

CREATE TYPE tr_reconciliation_status AS ENUM (
  'in_progress',
  'reconciled',
  'variance',
  'approved'
);

-- ============================================================================
-- BANK STATEMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS tr_bank_statements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  bank_account_id UUID NOT NULL REFERENCES tr_bank_accounts(id),
  
  -- Statement Details
  statement_date DATE NOT NULL,
  statement_number VARCHAR(50),
  format tr_statement_format NOT NULL,
  
  -- Balances
  opening_balance NUMERIC(15, 2) NOT NULL,
  closing_balance NUMERIC(15, 2) NOT NULL,
  total_debits NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_credits NUMERIC(15, 2) NOT NULL DEFAULT 0,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  
  -- File Reference
  file_url TEXT,
  file_hash VARCHAR(64),
  
  -- Import Status
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  imported_by UUID NOT NULL,
  
  CONSTRAINT uq_tr_statement UNIQUE (bank_account_id, statement_date)
);

-- ============================================================================
-- BANK STATEMENT LINES
-- ============================================================================

CREATE TABLE IF NOT EXISTS tr_bank_statement_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  statement_id UUID NOT NULL REFERENCES tr_bank_statements(id) ON DELETE CASCADE,
  
  -- Transaction Details
  transaction_date DATE NOT NULL,
  value_date DATE,
  description TEXT NOT NULL,
  reference VARCHAR(100),
  
  -- Amount (positive = credit to bank, negative = debit from bank)
  amount NUMERIC(15, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  
  -- Bank Reference
  bank_reference VARCHAR(100),
  transaction_type VARCHAR(50),
  
  -- Matching
  match_status tr_match_status NOT NULL DEFAULT 'unmatched',
  matched_gl_transaction_id UUID,
  match_confidence NUMERIC(5, 2),
  matched_at TIMESTAMPTZ,
  matched_by UUID,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- RECONCILIATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS tr_reconciliations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  bank_account_id UUID NOT NULL REFERENCES tr_bank_accounts(id),
  
  -- Period
  period_code VARCHAR(20) NOT NULL,
  reconciliation_date DATE NOT NULL,
  
  -- GL Balance
  gl_balance NUMERIC(15, 2) NOT NULL,
  
  -- Bank Balance
  bank_statement_id UUID REFERENCES tr_bank_statements(id),
  bank_balance NUMERIC(15, 2) NOT NULL,
  
  -- Adjustments
  deposits_in_transit NUMERIC(15, 2) DEFAULT 0,
  outstanding_checks NUMERIC(15, 2) DEFAULT 0,
  other_adjustments NUMERIC(15, 2) DEFAULT 0,
  
  -- Calculated
  adjusted_gl_balance NUMERIC(15, 2),
  variance NUMERIC(15, 2),
  
  -- Status
  status tr_reconciliation_status NOT NULL DEFAULT 'in_progress',
  
  -- Workflow
  prepared_by UUID NOT NULL,
  prepared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  
  CONSTRAINT uq_tr_reconciliation UNIQUE (bank_account_id, period_code),
  CONSTRAINT chk_tr_recon_sod CHECK (approved_by IS NULL OR approved_by <> prepared_by)
);

-- ============================================================================
-- RECONCILING ITEMS
-- ============================================================================

CREATE TABLE IF NOT EXISTS tr_reconciling_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reconciliation_id UUID NOT NULL REFERENCES tr_reconciliations(id) ON DELETE CASCADE,
  
  item_type tr_reconciling_item_type NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  
  -- References
  transaction_date DATE,
  reference VARCHAR(100),
  gl_transaction_id UUID,
  bank_statement_line_id UUID REFERENCES tr_bank_statement_lines(id),
  
  -- Resolution
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  resolution_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tr_statements_account ON tr_bank_statements(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_tr_statements_date ON tr_bank_statements(statement_date);
CREATE INDEX IF NOT EXISTS idx_tr_statement_lines_statement ON tr_bank_statement_lines(statement_id);
CREATE INDEX IF NOT EXISTS idx_tr_statement_lines_status ON tr_bank_statement_lines(match_status);
CREATE INDEX IF NOT EXISTS idx_tr_statement_lines_date ON tr_bank_statement_lines(transaction_date);
CREATE INDEX IF NOT EXISTS idx_tr_reconciliations_account ON tr_reconciliations(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_tr_reconciliations_period ON tr_reconciliations(period_code);
CREATE INDEX IF NOT EXISTS idx_tr_reconciling_items_recon ON tr_reconciling_items(reconciliation_id);

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE tr_bank_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE tr_bank_statement_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE tr_reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tr_reconciling_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY tr_statements_tenant_isolation ON tr_bank_statements
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::UUID);

CREATE POLICY tr_reconciliations_tenant_isolation ON tr_reconciliations
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::UUID);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE tr_bank_statements IS 'TR-05 Imported bank statements';
COMMENT ON TABLE tr_bank_statement_lines IS 'Individual bank statement transactions';
COMMENT ON TABLE tr_reconciliations IS 'Period-end bank reconciliations';
COMMENT ON TABLE tr_reconciling_items IS 'Reconciling items (timing differences)';
