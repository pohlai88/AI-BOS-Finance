-- ============================================================================
-- TR-05 Bank Reconciliation
-- Migration: 172_tr_bank_reconciliation.sql
-- Purpose: Bank statement matching and reconciliation (PRD-compliant)
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE treasury_statement_format AS ENUM (
  'mt940',
  'bai2',
  'csv',
  'ofx'
);

CREATE TYPE treasury_reconciliation_status AS ENUM (
  'draft',
  'in_progress',
  'reconciled',
  'adjusted',
  'finalized',
  'exception',
  'cancelled'
);

CREATE TYPE treasury_statement_item_status AS ENUM (
  'unmatched',
  'matched',
  'reconciling_item'
);

CREATE TYPE treasury_reconciling_item_type AS ENUM (
  'deposit_in_transit',
  'outstanding_check',
  'bank_error',
  'book_error',
  'bank_charge',
  'interest'
);

CREATE TYPE treasury_match_type AS ENUM (
  'exact',
  'fuzzy',
  'manual',
  'many_to_one',
  'one_to_many'
);

CREATE TYPE treasury_match_status AS ENUM (
  'active',
  'unmatched',
  'superseded'
);

CREATE TYPE treasury_balance_snapshot_source AS ENUM (
  'bank_statement',
  'manual',
  'api'
);

-- ============================================================================
-- BANK STATEMENTS (treasury_bank_statements)
-- ============================================================================

CREATE TABLE IF NOT EXISTS treasury.bank_statements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  bank_account_id UUID NOT NULL REFERENCES treasury.bank_accounts(id),
  
  -- Statement Identity
  statement_number VARCHAR(50) NOT NULL,
  statement_date DATE NOT NULL,              -- Statement generation date
  
  -- Statement Period
  period_start DATE NOT NULL,                 -- First transaction date
  period_end DATE NOT NULL,                   -- Last transaction date
  opening_balance_date DATE NOT NULL,         -- Date of opening balance
  closing_balance_date DATE NOT NULL,         -- Date of closing balance
  
  -- Balances (stored as JSONB for Money type: {amount: string, currency: string})
  opening_balance JSONB NOT NULL,
  closing_balance JSONB NOT NULL,
  currency VARCHAR(3) NOT NULL,
  
  -- Reconciliation
  gl_balance JSONB,                          -- GL balance at closing_balance_date
  adjusted_gl_balance JSONB,                 -- After reconciling items
  difference JSONB,                          -- adjusted_gl_balance - closing_balance
  
  -- Status
  status treasury_reconciliation_status NOT NULL DEFAULT 'draft',
  
  -- Exception
  exception_reason TEXT,
  exception_threshold JSONB,
  escalated_to VARCHAR(50),                  -- 'ic_manager' | 'controller' | 'cfo'
  
  -- Metadata
  import_format treasury_statement_format NOT NULL,
  import_source VARCHAR(255),                 -- File name or API source
  file_hash VARCHAR(64),                      -- SHA-256 hash for deduplication
  total_items INTEGER NOT NULL DEFAULT 0,
  matched_items INTEGER NOT NULL DEFAULT 0,
  unmatched_items INTEGER NOT NULL DEFAULT 0,
  
  -- Audit Trail
  imported_by UUID NOT NULL,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finalized_by UUID,
  finalized_at TIMESTAMPTZ,
  approver1_id UUID,                          -- Dual authorization
  approver2_id UUID,                          -- Dual authorization
  notes TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Constraints
  CONSTRAINT uq_treasury_statement_keys UNIQUE (
    bank_account_id, 
    statement_number, 
    statement_date,
    opening_balance,
    closing_balance,
    period_start,
    period_end
  )
);

-- ============================================================================
-- STATEMENT ITEMS (treasury_statement_items)
-- ============================================================================

CREATE TABLE IF NOT EXISTS treasury.statement_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  statement_id UUID NOT NULL REFERENCES treasury.bank_statements(id) ON DELETE CASCADE,
  
  -- Transaction Details
  value_date DATE NOT NULL,
  entry_date DATE NOT NULL,
  amount JSONB NOT NULL,                      -- Money: {amount: string, currency: string}
  debit_credit CHAR(1) NOT NULL CHECK (debit_credit IN ('D', 'C')),
  reference VARCHAR(255),
  description TEXT NOT NULL,
  counterparty VARCHAR(255),
  
  -- Matching (status only - actual matches in treasury_recon_matches)
  status treasury_statement_item_status NOT NULL DEFAULT 'unmatched',
  
  -- Reconciling item
  reconciling_item_type treasury_reconciling_item_type,
  expected_clearing_date DATE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- RECONCILIATION MATCHES (treasury_recon_matches)
-- ============================================================================

CREATE TABLE IF NOT EXISTS treasury.recon_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  statement_id UUID NOT NULL REFERENCES treasury.bank_statements(id) ON DELETE CASCADE,
  bank_item_id UUID REFERENCES treasury.statement_items(id),  -- null for one-to-many
  gl_transaction_id UUID,                                      -- null for many-to-one (FK to GL)
  
  -- Match Details
  match_type treasury_match_type NOT NULL,
  allocated_amount JSONB NOT NULL,            -- Total allocated amount for this match
  confidence NUMERIC(3, 2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  match_reason TEXT,                          -- User-provided reason (for manual matches)
  
  -- Status
  status treasury_match_status NOT NULL DEFAULT 'active',
  unmatched_reason TEXT,
  unmatched_by UUID,
  unmatched_at TIMESTAMPTZ,
  
  -- Authorization
  matched_by UUID NOT NULL,
  matched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Idempotency
  idempotency_key VARCHAR(255),
  
  -- Versioning
  version INTEGER NOT NULL DEFAULT 1,
  superseded_by_version INTEGER
);

-- ============================================================================
-- MATCH ALLOCATIONS (treasury_recon_match_allocations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS treasury.recon_match_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES treasury.recon_matches(id) ON DELETE CASCADE,
  bank_item_id UUID REFERENCES treasury.statement_items(id),  -- for one-to-many
  gl_transaction_id UUID,                                      -- for many-to-one (FK to GL)
  allocated_amount JSONB NOT NULL,            -- Partial amount allocated
  allocation_order INTEGER NOT NULL,         -- Order in allocation sequence
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- BANK ACCOUNT BALANCE SNAPSHOTS (treasury_bank_account_balance_snapshots)
-- ============================================================================

CREATE TABLE IF NOT EXISTS treasury.bank_account_balance_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  bank_account_id UUID NOT NULL REFERENCES treasury.bank_accounts(id),
  statement_id UUID NOT NULL REFERENCES treasury.bank_statements(id),
  balance_date DATE NOT NULL,
  balance JSONB NOT NULL,                    -- Money: {amount: string, currency: string}
  source treasury_balance_snapshot_source NOT NULL,
  reconciled_at TIMESTAMPTZ NOT NULL,
  reconciled_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_treasury_statements_account ON treasury.bank_statements(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_treasury_statements_date ON treasury.bank_statements(statement_date);
CREATE INDEX IF NOT EXISTS idx_treasury_statements_status ON treasury.bank_statements(status);
CREATE INDEX IF NOT EXISTS idx_treasury_statements_file_hash ON treasury.bank_statements(file_hash) WHERE file_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_treasury_statement_items_statement ON treasury.statement_items(statement_id);
CREATE INDEX IF NOT EXISTS idx_treasury_statement_items_status ON treasury.statement_items(status);
CREATE INDEX IF NOT EXISTS idx_treasury_statement_items_date ON treasury.statement_items(value_date);

CREATE INDEX IF NOT EXISTS idx_treasury_recon_matches_statement ON treasury.recon_matches(statement_id);
CREATE INDEX IF NOT EXISTS idx_treasury_recon_matches_bank_item ON treasury.recon_matches(bank_item_id) WHERE bank_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_treasury_recon_matches_gl_txn ON treasury.recon_matches(gl_transaction_id) WHERE gl_transaction_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_treasury_recon_matches_status ON treasury.recon_matches(status);

CREATE INDEX IF NOT EXISTS idx_treasury_recon_allocations_match ON treasury.recon_match_allocations(match_id);
CREATE INDEX IF NOT EXISTS idx_treasury_recon_allocations_bank_item ON treasury.recon_match_allocations(bank_item_id) WHERE bank_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_treasury_recon_allocations_gl_txn ON treasury.recon_match_allocations(gl_transaction_id) WHERE gl_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_treasury_balance_snapshots_account ON treasury.bank_account_balance_snapshots(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_treasury_balance_snapshots_date ON treasury.bank_account_balance_snapshots(balance_date);

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================

ALTER TABLE treasury.bank_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury.statement_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury.recon_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury.recon_match_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury.bank_account_balance_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY treasury_statements_tenant_isolation ON treasury.bank_statements
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::UUID);

CREATE POLICY treasury_statement_items_tenant_isolation ON treasury.statement_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM treasury.bank_statements bs
      WHERE bs.id = statement_items.statement_id
      AND bs.tenant_id = current_setting('app.tenant_id', true)::UUID
    )
  );

CREATE POLICY treasury_recon_matches_tenant_isolation ON treasury.recon_matches
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::UUID);

CREATE POLICY treasury_recon_allocations_tenant_isolation ON treasury.recon_match_allocations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM treasury.recon_matches rm
      WHERE rm.id = recon_match_allocations.match_id
      AND rm.tenant_id = current_setting('app.tenant_id', true)::UUID
    )
  );

CREATE POLICY treasury_balance_snapshots_tenant_isolation ON treasury.bank_account_balance_snapshots
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::UUID);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE treasury.bank_statements IS 'TR-05 Bank statements imported for reconciliation';
COMMENT ON TABLE treasury.statement_items IS 'TR-05 Individual bank statement transaction items';
COMMENT ON TABLE treasury.recon_matches IS 'TR-05 Matches between bank items and GL transactions (many-to-many with allocations)';
COMMENT ON TABLE treasury.recon_match_allocations IS 'TR-05 Partial allocations for many-to-one and one-to-many matches';
COMMENT ON TABLE treasury.bank_account_balance_snapshots IS 'TR-05 Statement-derived balance snapshots (evidence, not ledger overwrite)';
