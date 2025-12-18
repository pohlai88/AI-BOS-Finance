-- ============================================================================
-- TR-02 Cash Pooling - Cash Concentration & Sweeping
-- Migration: 171_tr_cash_pooling.sql
-- Purpose: Intercompany cash pooling configuration and execution (PRD-compliant)
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE treasury_pool_type AS ENUM (
  'physical',
  'notional',
  'zero_balance'
);

CREATE TYPE treasury_pool_status AS ENUM (
  'draft',
  'active',
  'suspended',
  'inactive',
  'cancelled'
);

CREATE TYPE treasury_sweep_frequency AS ENUM (
  'daily',
  'weekly',
  'monthly'
);

CREATE TYPE treasury_interest_calculation_method AS ENUM (
  'daily_balance',
  'average_balance'
);

CREATE TYPE treasury_interest_allocation_frequency AS ENUM (
  'monthly',
  'quarterly'
);

CREATE TYPE treasury_day_count_convention AS ENUM (
  'ACT_365',
  'ACT_360'
);

CREATE TYPE treasury_compounding AS ENUM (
  'simple',
  'compound'
);

CREATE TYPE treasury_sweep_type AS ENUM (
  'sweep',
  'fund'
);

CREATE TYPE treasury_sweep_status AS ENUM (
  'pending',
  'executing',
  'executed',
  'failed',
  'needs_reconciliation',
  'reconciled',
  'cancelled'
);

CREATE TYPE treasury_balance_source AS ENUM (
  'reconciled',
  'bank_api',
  'gl_ledger'
);

CREATE TYPE treasury_interest_allocation_status AS ENUM (
  'calculated',
  'allocated',
  'posted',
  'failed'
);

CREATE TYPE treasury_pool_config_change_type AS ENUM (
  'add_participant',
  'remove_participant',
  'update_threshold',
  'update_rate',
  'change_master',
  'update_frequency',
  'update_legal'
);

CREATE TYPE treasury_pool_config_change_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'effective',
  'cancelled'
);

-- ============================================================================
-- CASH POOLS (treasury_cash_pools)
-- ============================================================================

CREATE TABLE IF NOT EXISTS treasury.cash_pools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  pool_code VARCHAR(50) NOT NULL,        -- Generated: POOL-2024-001
  pool_name VARCHAR(255) NOT NULL,
  
  -- Configuration
  pool_type treasury_pool_type NOT NULL,
  master_account_id UUID NOT NULL REFERENCES treasury.bank_accounts(id),
  master_company_id UUID NOT NULL,
  master_gl_account_code VARCHAR(50) NOT NULL,
  interest_income_account VARCHAR(50),
  
  -- Participants (stored as JSONB array)
  participants JSONB NOT NULL,            -- Array<ParticipantConfig>
  
  -- Sweep Configuration
  sweep_frequency treasury_sweep_frequency NOT NULL,
  sweep_time VARCHAR(5) NOT NULL,         -- HH:MM
  dual_authorization_required BOOLEAN NOT NULL DEFAULT true,
  
  -- Interest Configuration
  interest_rate NUMERIC(10, 6) NOT NULL,  -- Annual rate (e.g., 0.025)
  interest_calculation_method treasury_interest_calculation_method NOT NULL,
  interest_allocation_frequency treasury_interest_allocation_frequency NOT NULL,
  day_count_convention treasury_day_count_convention NOT NULL DEFAULT 'ACT_365',
  compounding treasury_compounding NOT NULL DEFAULT 'simple',
  skip_non_business_days BOOLEAN NOT NULL DEFAULT false,
  
  -- Legal & Compliance (stored as JSONB)
  agreement_reference VARCHAR(255) NOT NULL,
  agreement_date DATE NOT NULL,
  jurisdictions VARCHAR(3)[],           -- Array of ISO country codes
  interest_benchmark JSONB NOT NULL,     -- InterestBenchmark
  withholding_tax_rules JSONB,            -- Array<WithholdingTaxRule>
  entity_limits JSONB,                    -- Array<EntityLimit>
  
  -- Lifecycle
  status treasury_pool_status NOT NULL DEFAULT 'draft',
  effective_date DATE,
  deactivation_date DATE,
  
  -- Audit Trail
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID,
  updated_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  
  CONSTRAINT uq_treasury_pool_code UNIQUE (tenant_id, pool_code)
);

-- ============================================================================
-- CASH SWEEPS (treasury_cash_sweeps)
-- ============================================================================

CREATE TABLE IF NOT EXISTS treasury.cash_sweeps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  pool_id UUID NOT NULL REFERENCES treasury.cash_pools(id),
  execution_date DATE NOT NULL,
  sweep_type treasury_sweep_type NOT NULL,
  
  -- Participant details
  participant_account_id UUID NOT NULL REFERENCES treasury.bank_accounts(id),
  participant_company_id UUID NOT NULL,
  master_account_id UUID NOT NULL REFERENCES treasury.bank_accounts(id),
  
  -- Amounts (stored as JSONB for Money type)
  amount JSONB NOT NULL,
  currency VARCHAR(3) NOT NULL,
  
  -- Authorization
  initiator_id UUID NOT NULL,
  approver1_id UUID NOT NULL,
  approver2_id UUID NOT NULL,
  
  -- GL Posting
  participant_journal_entry_id UUID,     -- FK to GL-02 (participant entity)
  master_journal_entry_id UUID,         -- FK to GL-02 (master entity)
  ic_loan_id UUID,                      -- FK to TR-04
  
  -- Idempotency & Retry
  idempotency_key VARCHAR(255) NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  
  -- Status
  status treasury_sweep_status NOT NULL DEFAULT 'pending',
  error_message TEXT,
  payment_id UUID,                       -- FK to AP-05 payment
  payment_status VARCHAR(50),            -- From AP-05 webhook
  
  -- Balance Source
  balance_source treasury_balance_source NOT NULL,
  balance_as_of TIMESTAMPTZ NOT NULL,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  executed_at TIMESTAMPTZ,
  reconciled_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  
  CONSTRAINT uq_treasury_sweep_key UNIQUE (idempotency_key),
  CONSTRAINT chk_treasury_sweep_dual_auth CHECK (
    approver1_id IS NOT NULL AND
    approver2_id IS NOT NULL AND
    approver1_id != approver2_id AND
    initiator_id != approver1_id AND
    initiator_id != approver2_id
  )
);

-- ============================================================================
-- INTEREST ALLOCATIONS (treasury_interest_allocations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS treasury.interest_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  pool_id UUID NOT NULL REFERENCES treasury.cash_pools(id),
  participant_account_id UUID NOT NULL REFERENCES treasury.bank_accounts(id),
  participant_company_id UUID NOT NULL,
  master_company_id UUID NOT NULL,
  
  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Interest Calculation
  interest_amount JSONB NOT NULL,        -- Money
  calculation_method treasury_interest_calculation_method NOT NULL,
  day_count_convention treasury_day_count_convention NOT NULL,
  compounding treasury_compounding NOT NULL,
  
  -- Daily balances (for audit trail)
  daily_balances JSONB,                  -- Array<{date: Date, balance: Money}>
  
  -- GL Posting
  participant_journal_entry_id UUID,     -- FK to GL-02 (participant entity)
  master_journal_entry_id UUID,         -- FK to GL-02 (master entity)
  ic_loan_id UUID,                      -- FK to TR-04
  
  -- Authorization
  allocated_by UUID NOT NULL,
  approver1_id UUID NOT NULL,
  approver2_id UUID NOT NULL,
  
  -- Status
  status treasury_interest_allocation_status NOT NULL DEFAULT 'calculated',
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  allocated_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  
  CONSTRAINT chk_treasury_interest_dual_auth CHECK (
    approver1_id IS NOT NULL AND
    approver2_id IS NOT NULL AND
    approver1_id != approver2_id
  )
);

-- ============================================================================
-- POOL CONFIG CHANGES (treasury_pool_config_changes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS treasury.pool_config_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  pool_id UUID NOT NULL REFERENCES treasury.cash_pools(id),
  change_type treasury_pool_config_change_type NOT NULL,
  
  -- Before/After State
  before_value JSONB NOT NULL,
  after_value JSONB NOT NULL,
  diff JSONB,                            -- Array<{field, before, after}>
  
  -- Workflow
  requested_by UUID NOT NULL,
  approved_by UUID,
  rejected_by UUID,
  rejection_reason TEXT,
  
  -- Effective Date
  effective_date DATE,
  
  -- Status
  status treasury_pool_config_change_status NOT NULL DEFAULT 'pending',
  
  -- Versioning
  pool_version_before INTEGER NOT NULL,
  pool_version_after INTEGER,
  
  -- Audit
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  effective_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1
);

-- ============================================================================
-- POOL CONFIG HISTORY (treasury_pool_config_history)
-- ============================================================================

CREATE TABLE IF NOT EXISTS treasury.pool_config_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  pool_id UUID NOT NULL REFERENCES treasury.cash_pools(id),
  version INTEGER NOT NULL,
  
  -- Full Configuration Snapshot
  configuration JSONB NOT NULL,          -- Complete CashPool at this version
  
  -- Change Tracking
  change_request_id UUID REFERENCES treasury.pool_config_changes(id),
  changed_by UUID NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  change_reason TEXT,
  
  -- Rollback Support
  is_current BOOLEAN NOT NULL DEFAULT false,
  rolled_back_from_version INTEGER,
  
  CONSTRAINT uq_treasury_pool_config_history UNIQUE (pool_id, version)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_treasury_pools_tenant ON treasury.cash_pools(tenant_id);
CREATE INDEX IF NOT EXISTS idx_treasury_pools_status ON treasury.cash_pools(status);
CREATE INDEX IF NOT EXISTS idx_treasury_pools_master_account ON treasury.cash_pools(master_account_id);

CREATE INDEX IF NOT EXISTS idx_treasury_sweeps_pool ON treasury.cash_sweeps(pool_id);
CREATE INDEX IF NOT EXISTS idx_treasury_sweeps_execution_date ON treasury.cash_sweeps(execution_date);
CREATE INDEX IF NOT EXISTS idx_treasury_sweeps_status ON treasury.cash_sweeps(status);
CREATE INDEX IF NOT EXISTS idx_treasury_sweeps_idempotency_key ON treasury.cash_sweeps(idempotency_key);

CREATE INDEX IF NOT EXISTS idx_treasury_interest_allocations_pool ON treasury.interest_allocations(pool_id);
CREATE INDEX IF NOT EXISTS idx_treasury_interest_allocations_period ON treasury.interest_allocations(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_treasury_config_changes_pool ON treasury.pool_config_changes(pool_id);
CREATE INDEX IF NOT EXISTS idx_treasury_config_changes_status ON treasury.pool_config_changes(status);

CREATE INDEX IF NOT EXISTS idx_treasury_config_history_pool ON treasury.pool_config_history(pool_id);
CREATE INDEX IF NOT EXISTS idx_treasury_config_history_current ON treasury.pool_config_history(pool_id, is_current) WHERE is_current = true;

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================

ALTER TABLE treasury.cash_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury.cash_sweeps ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury.interest_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury.pool_config_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury.pool_config_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY treasury_pools_tenant_isolation ON treasury.cash_pools
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::UUID);

CREATE POLICY treasury_sweeps_tenant_isolation ON treasury.cash_sweeps
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::UUID);

CREATE POLICY treasury_interest_allocations_tenant_isolation ON treasury.interest_allocations
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::UUID);

CREATE POLICY treasury_config_changes_tenant_isolation ON treasury.pool_config_changes
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::UUID);

CREATE POLICY treasury_config_history_tenant_isolation ON treasury.pool_config_history
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::UUID);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE treasury.cash_pools IS 'TR-02 Cash pool configurations';
COMMENT ON TABLE treasury.cash_sweeps IS 'TR-02 Sweep and fund execution records';
COMMENT ON TABLE treasury.interest_allocations IS 'TR-02 Interest allocation records';
COMMENT ON TABLE treasury.pool_config_changes IS 'TR-02 Pool configuration change requests (maker-checker)';
COMMENT ON TABLE treasury.pool_config_history IS 'TR-02 Pool configuration version history (for rollback)';
