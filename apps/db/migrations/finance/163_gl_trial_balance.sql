-- ============================================================================
-- GL-05 Trial Balance - Snapshots and Verification
-- Migration: 163_gl_trial_balance.sql
-- Purpose: Immutable trial balance snapshots for period close
-- ============================================================================

-- Create trial balance snapshots table
CREATE TABLE IF NOT EXISTS gl_tb_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  company_id UUID NOT NULL,
  
  -- Period
  period_code VARCHAR(20) NOT NULL,
  fiscal_year INTEGER NOT NULL,
  fiscal_period INTEGER NOT NULL,
  
  -- Snapshot Data
  snapshot_hash VARCHAR(64) NOT NULL,   -- SHA-256 of canonical JSON
  snapshot_data JSONB NOT NULL,
  
  -- Totals
  total_opening_debit NUMERIC(15, 2) NOT NULL,
  total_opening_credit NUMERIC(15, 2) NOT NULL,
  total_period_debit NUMERIC(15, 2) NOT NULL,
  total_period_credit NUMERIC(15, 2) NOT NULL,
  total_closing_debit NUMERIC(15, 2) NOT NULL,
  total_closing_credit NUMERIC(15, 2) NOT NULL,
  is_balanced BOOLEAN NOT NULL,
  
  -- Immutability
  is_immutable BOOLEAN NOT NULL DEFAULT true,
  
  -- Audit
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT uq_gl_tb_snapshot_period UNIQUE (tenant_id, company_id, period_code),
  CONSTRAINT chk_gl_tb_balanced CHECK (
    ABS(total_closing_debit - total_closing_credit) < 0.01
  )
);

-- Snapshot access log (for audit)
CREATE TABLE IF NOT EXISTS gl_tb_snapshot_access_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  snapshot_id UUID NOT NULL REFERENCES gl_tb_snapshots(id),
  
  -- Access
  accessed_by UUID NOT NULL,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  access_type VARCHAR(20) NOT NULL CHECK (access_type IN ('view', 'export', 'verify')),
  
  -- Verification
  hash_verified BOOLEAN,
  verification_result VARCHAR(20) CHECK (verification_result IN ('valid', 'invalid', 'error')),
  
  -- Context
  ip_address VARCHAR(45),
  user_agent TEXT
);

-- ============================================================================
-- IMMUTABILITY ENFORCEMENT
-- ============================================================================

-- Prevent UPDATE on immutable snapshots
CREATE OR REPLACE FUNCTION gl_tb_prevent_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_immutable = true THEN
    RAISE EXCEPTION 'Trial Balance snapshot is immutable: UPDATE not allowed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_gl_tb_prevent_update
  BEFORE UPDATE ON gl_tb_snapshots
  FOR EACH ROW EXECUTE FUNCTION gl_tb_prevent_update();

-- Prevent DELETE on snapshots
CREATE OR REPLACE FUNCTION gl_tb_prevent_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Trial Balance snapshots cannot be deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_gl_tb_prevent_delete
  BEFORE DELETE ON gl_tb_snapshots
  FOR EACH ROW EXECUTE FUNCTION gl_tb_prevent_delete();

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_gl_tb_tenant ON gl_tb_snapshots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gl_tb_company ON gl_tb_snapshots(tenant_id, company_id);
CREATE INDEX IF NOT EXISTS idx_gl_tb_period ON gl_tb_snapshots(period_code);
CREATE INDEX IF NOT EXISTS idx_gl_tb_year ON gl_tb_snapshots(fiscal_year);

CREATE INDEX IF NOT EXISTS idx_gl_tb_access_snapshot ON gl_tb_snapshot_access_log(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_gl_tb_access_user ON gl_tb_snapshot_access_log(accessed_by);

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE gl_tb_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE gl_tb_snapshot_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY gl_tb_tenant_isolation ON gl_tb_snapshots
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::UUID);

CREATE POLICY gl_tb_access_tenant_isolation ON gl_tb_snapshot_access_log
  FOR ALL
  USING (
    snapshot_id IN (
      SELECT id FROM gl_tb_snapshots 
      WHERE tenant_id = current_setting('app.tenant_id', true)::UUID
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate trial balance for a period
CREATE OR REPLACE FUNCTION gl_calculate_trial_balance(
  p_tenant_id UUID,
  p_company_id UUID,
  p_period_code VARCHAR(20)
)
RETURNS TABLE (
  account_code VARCHAR(50),
  account_name VARCHAR(255),
  account_type VARCHAR(20),
  period_debit NUMERIC(15, 2),
  period_credit NUMERIC(15, 2),
  closing_debit NUMERIC(15, 2),
  closing_credit NUMERIC(15, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.account_code,
    l.account_name,
    l.account_type,
    COALESCE(SUM(l.debit_amount), 0) as period_debit,
    COALESCE(SUM(l.credit_amount), 0) as period_credit,
    CASE 
      WHEN COALESCE(SUM(l.debit_amount), 0) > COALESCE(SUM(l.credit_amount), 0) 
      THEN COALESCE(SUM(l.debit_amount), 0) - COALESCE(SUM(l.credit_amount), 0)
      ELSE 0
    END as closing_debit,
    CASE 
      WHEN COALESCE(SUM(l.credit_amount), 0) > COALESCE(SUM(l.debit_amount), 0) 
      THEN COALESCE(SUM(l.credit_amount), 0) - COALESCE(SUM(l.debit_amount), 0)
      ELSE 0
    END as closing_credit
  FROM gl_ledger_lines l
  WHERE l.tenant_id = p_tenant_id
    AND l.company_id = p_company_id
    AND l.period_code = p_period_code
  GROUP BY l.account_code, l.account_name, l.account_type
  ORDER BY l.account_code;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE gl_tb_snapshots IS 'GL-05 Immutable Trial Balance snapshots';
COMMENT ON COLUMN gl_tb_snapshots.snapshot_hash IS 'SHA-256 of canonical JSON for verification';
COMMENT ON COLUMN gl_tb_snapshots.snapshot_data IS 'Complete trial balance data as JSONB';
COMMENT ON TABLE gl_tb_snapshot_access_log IS 'Audit trail for snapshot access';
