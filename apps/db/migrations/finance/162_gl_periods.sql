-- ============================================================================
-- GL-04 Period Close - Fiscal Period Management
-- Migration: 162_gl_periods.sql
-- Purpose: Fiscal period lifecycle with 3-lock system
-- ============================================================================

-- Create fiscal periods table
CREATE TABLE IF NOT EXISTS gl_fiscal_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  company_id UUID NOT NULL,
  
  -- Period Identity
  period_code VARCHAR(20) NOT NULL,       -- '2024-12'
  fiscal_year INTEGER NOT NULL,
  fiscal_period INTEGER NOT NULL,         -- 1-12 for monthly
  
  -- Dates
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Status (3-lock system)
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'soft_close', 'hard_close', 'controlled_reopen')),
  
  -- Soft Close
  soft_closed_by UUID,
  soft_closed_at TIMESTAMPTZ,
  
  -- Hard Close
  hard_closed_by UUID,
  hard_closed_at TIMESTAMPTZ,
  hard_close_approved_by UUID,
  hard_close_approved_at TIMESTAMPTZ,
  
  -- Controlled Reopen
  reopen_requested_by UUID,
  reopen_requested_at TIMESTAMPTZ,
  reopen_approved_by UUID,
  reopen_approved_at TIMESTAMPTZ,
  reopen_expires_at TIMESTAMPTZ,
  reopen_reason TEXT,
  
  -- Trial Balance Snapshot
  tb_snapshot_id UUID,
  tb_snapshot_hash VARCHAR(64),
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Constraints
  CONSTRAINT uq_gl_periods_tenant_company_code UNIQUE (tenant_id, company_id, period_code),
  CONSTRAINT chk_gl_periods_dates CHECK (start_date <= end_date),
  CONSTRAINT chk_gl_periods_hard_close_sod CHECK (hard_close_approved_by IS NULL OR hard_close_approved_by <> hard_closed_by),
  CONSTRAINT chk_gl_periods_reopen_sod CHECK (reopen_approved_by IS NULL OR reopen_approved_by <> reopen_requested_by)
);

-- Period close checklist
CREATE TABLE IF NOT EXISTS gl_period_close_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period_id UUID NOT NULL REFERENCES gl_fiscal_periods(id) ON DELETE CASCADE,
  
  -- Task
  task_code VARCHAR(50) NOT NULL,
  task_name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Severity
  severity VARCHAR(20) NOT NULL DEFAULT 'optional' CHECK (severity IN ('blocking', 'warning', 'optional')),
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),
  
  -- Completion
  completed_by UUID,
  completed_at TIMESTAMPTZ,
  skipped_by UUID,
  skipped_at TIMESTAMPTZ,
  skipped_reason TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT uq_gl_period_task UNIQUE (period_id, task_code)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_gl_periods_tenant ON gl_fiscal_periods(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gl_periods_company ON gl_fiscal_periods(tenant_id, company_id);
CREATE INDEX IF NOT EXISTS idx_gl_periods_status ON gl_fiscal_periods(status);
CREATE INDEX IF NOT EXISTS idx_gl_periods_dates ON gl_fiscal_periods(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_gl_periods_year ON gl_fiscal_periods(fiscal_year);

CREATE INDEX IF NOT EXISTS idx_gl_period_tasks_period ON gl_period_close_tasks(period_id);

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE gl_fiscal_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE gl_period_close_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY gl_periods_tenant_isolation ON gl_fiscal_periods
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::UUID);

CREATE POLICY gl_period_tasks_tenant_isolation ON gl_period_close_tasks
  FOR ALL
  USING (
    period_id IN (
      SELECT id FROM gl_fiscal_periods 
      WHERE tenant_id = current_setting('app.tenant_id', true)::UUID
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER trg_gl_periods_updated_at
  BEFORE UPDATE ON gl_fiscal_periods
  FOR EACH ROW EXECUTE FUNCTION finance.update_updated_at();

-- ============================================================================
-- DEFAULT CLOSE TASKS
-- ============================================================================

-- Function to initialize default tasks for a period
CREATE OR REPLACE FUNCTION gl_init_period_close_tasks(p_period_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO gl_period_close_tasks (period_id, task_code, task_name, severity)
  VALUES
    (p_period_id, 'RECONCILE_BANK', 'Complete bank reconciliations', 'blocking'),
    (p_period_id, 'POST_ACCRUALS', 'Post all accrual entries', 'blocking'),
    (p_period_id, 'REVIEW_UNPOSTED', 'Review unposted journal entries', 'blocking'),
    (p_period_id, 'VERIFY_SUBLEDGER', 'Verify subledger to GL reconciliation', 'blocking'),
    (p_period_id, 'REVIEW_TB', 'Review trial balance', 'warning'),
    (p_period_id, 'VARIANCE_ANALYSIS', 'Complete variance analysis', 'warning'),
    (p_period_id, 'MANAGER_SIGNOFF', 'Obtain manager sign-off', 'optional')
  ON CONFLICT (period_id, task_code) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE gl_fiscal_periods IS 'GL-04 Fiscal Period lifecycle with 3-lock system';
COMMENT ON COLUMN gl_fiscal_periods.status IS 'open -> soft_close -> hard_close (-> controlled_reopen -> hard_close)';
COMMENT ON COLUMN gl_fiscal_periods.tb_snapshot_hash IS 'SHA-256 hash of trial balance at hard close';
COMMENT ON TABLE gl_period_close_tasks IS 'Checklist items for period close';
