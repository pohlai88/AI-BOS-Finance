-- ============================================================================
-- GL-01 Chart of Accounts - Enhanced Schema
-- Migration: 160_gl_chart_of_accounts.sql
-- Purpose: Full COA hierarchy with approval workflow
-- ============================================================================

-- Extend finance.accounts with GL-01 requirements
ALTER TABLE finance.accounts 
  ADD COLUMN IF NOT EXISTS account_code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS account_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS account_type VARCHAR(20),
  ADD COLUMN IF NOT EXISTS normal_balance VARCHAR(10) CHECK (normal_balance IN ('DEBIT', 'CREDIT')),
  ADD COLUMN IF NOT EXISTS parent_account_id UUID REFERENCES finance.accounts(id),
  ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_postable BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS effective_date DATE,
  ADD COLUMN IF NOT EXISTS end_date DATE,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS approved_by UUID,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_by UUID,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Create accounts table if not exists with full GL-01 structure
CREATE TABLE IF NOT EXISTS gl_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  company_id UUID NOT NULL,
  
  -- Identity
  account_code VARCHAR(50) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  
  -- Classification
  account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
  normal_balance VARCHAR(10) NOT NULL CHECK (normal_balance IN ('DEBIT', 'CREDIT')),
  
  -- Hierarchy
  parent_account_id UUID REFERENCES gl_accounts(id),
  level INTEGER NOT NULL DEFAULT 1,
  is_postable BOOLEAN NOT NULL DEFAULT true,
  
  -- Currency
  currency VARCHAR(3),
  
  -- Lifecycle
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'active', 'rejected', 'inactive', 'cancelled')),
  effective_date DATE,
  end_date DATE,
  
  -- Description
  description TEXT,
  
  -- Workflow
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejected_by UUID,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Audit
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID,
  updated_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Constraints
  CONSTRAINT uq_gl_accounts_tenant_company_code UNIQUE (tenant_id, company_id, account_code),
  CONSTRAINT chk_gl_accounts_sod CHECK (approved_by IS NULL OR approved_by <> created_by)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gl_accounts_tenant ON gl_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gl_accounts_company ON gl_accounts(tenant_id, company_id);
CREATE INDEX IF NOT EXISTS idx_gl_accounts_parent ON gl_accounts(parent_account_id);
CREATE INDEX IF NOT EXISTS idx_gl_accounts_type ON gl_accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_gl_accounts_status ON gl_accounts(status);
CREATE INDEX IF NOT EXISTS idx_gl_accounts_code ON gl_accounts(account_code);

-- RLS
ALTER TABLE gl_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY gl_accounts_tenant_isolation ON gl_accounts
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::UUID);

-- Trigger
CREATE TRIGGER trg_gl_accounts_updated_at
  BEFORE UPDATE ON gl_accounts
  FOR EACH ROW EXECUTE FUNCTION finance.update_updated_at();

-- Comments
COMMENT ON TABLE gl_accounts IS 'GL-01 Chart of Accounts with approval workflow';
COMMENT ON COLUMN gl_accounts.is_postable IS 'True = leaf account, False = summary account';
COMMENT ON COLUMN gl_accounts.normal_balance IS 'Debit or Credit as normal balance';
