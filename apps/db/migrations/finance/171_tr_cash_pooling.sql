-- ============================================================================
-- TR-02 Cash Pooling - Cash Concentration & Sweeping
-- Migration: 171_tr_cash_pooling.sql
-- Purpose: Intercompany cash pooling configuration and execution
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE tr_pool_type AS ENUM (
  'physical',    -- Actual fund movement
  'notional'     -- Interest optimization only
);

CREATE TYPE tr_sweep_frequency AS ENUM (
  'daily',
  'weekly',
  'monthly'
);

CREATE TYPE tr_sweep_status AS ENUM (
  'pending',
  'executing',
  'completed',
  'failed',
  'cancelled'
);

-- ============================================================================
-- POOL CONFIGURATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS tr_cash_pools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  
  pool_name VARCHAR(255) NOT NULL,
  pool_type tr_pool_type NOT NULL,
  currency VARCHAR(3) NOT NULL,
  
  -- Master Account (where funds concentrate)
  master_account_id UUID NOT NULL REFERENCES tr_bank_accounts(id),
  
  -- Configuration
  sweep_frequency tr_sweep_frequency NOT NULL DEFAULT 'daily',
  sweep_time TIME DEFAULT '18:00',
  
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Audit
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  
  CONSTRAINT uq_tr_pool_name UNIQUE (tenant_id, pool_name)
);

-- ============================================================================
-- POOL PARTICIPANTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS tr_pool_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pool_id UUID NOT NULL REFERENCES tr_cash_pools(id) ON DELETE CASCADE,
  bank_account_id UUID NOT NULL REFERENCES tr_bank_accounts(id),
  company_id UUID NOT NULL,
  
  -- Sweep Rules
  target_balance NUMERIC(15, 2) DEFAULT 0,      -- Maintain this balance
  minimum_sweep NUMERIC(15, 2) DEFAULT 0,       -- Don't sweep below this
  maximum_sweep NUMERIC(15, 2),                 -- Max per sweep (null = unlimited)
  priority INTEGER NOT NULL DEFAULT 100,        -- Lower = higher priority
  
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT uq_tr_pool_participant UNIQUE (pool_id, bank_account_id)
);

-- ============================================================================
-- SWEEP EXECUTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS tr_sweep_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pool_id UUID NOT NULL REFERENCES tr_cash_pools(id),
  
  execution_date DATE NOT NULL,
  status tr_sweep_status NOT NULL DEFAULT 'pending',
  
  -- Summary
  total_swept_in NUMERIC(15, 2) DEFAULT 0,
  total_swept_out NUMERIC(15, 2) DEFAULT 0,
  participant_count INTEGER DEFAULT 0,
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  error_message TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT uq_tr_sweep_execution UNIQUE (pool_id, execution_date)
);

-- ============================================================================
-- SWEEP TRANSACTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS tr_sweep_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sweep_execution_id UUID NOT NULL REFERENCES tr_sweep_executions(id) ON DELETE CASCADE,
  
  from_account_id UUID NOT NULL REFERENCES tr_bank_accounts(id),
  to_account_id UUID NOT NULL REFERENCES tr_bank_accounts(id),
  
  amount NUMERIC(15, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  
  -- GL Integration
  journal_entry_id UUID,
  
  status tr_sweep_status NOT NULL DEFAULT 'pending',
  error_message TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tr_pools_tenant ON tr_cash_pools(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tr_pools_master ON tr_cash_pools(master_account_id);
CREATE INDEX IF NOT EXISTS idx_tr_pool_participants_pool ON tr_pool_participants(pool_id);
CREATE INDEX IF NOT EXISTS idx_tr_pool_participants_account ON tr_pool_participants(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_tr_sweep_executions_pool ON tr_sweep_executions(pool_id);
CREATE INDEX IF NOT EXISTS idx_tr_sweep_executions_date ON tr_sweep_executions(execution_date);
CREATE INDEX IF NOT EXISTS idx_tr_sweep_transactions_execution ON tr_sweep_transactions(sweep_execution_id);

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE tr_cash_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE tr_pool_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tr_sweep_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tr_sweep_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY tr_pools_tenant_isolation ON tr_cash_pools
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::UUID);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE tr_cash_pools IS 'TR-02 Cash Pool configurations';
COMMENT ON TABLE tr_pool_participants IS 'Participating accounts in cash pools';
COMMENT ON TABLE tr_sweep_executions IS 'Daily sweep execution records';
COMMENT ON TABLE tr_sweep_transactions IS 'Individual sweep transactions';
