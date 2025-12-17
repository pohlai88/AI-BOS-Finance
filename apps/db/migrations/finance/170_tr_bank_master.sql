-- ============================================================================
-- TR-01 Bank Master - Bank Account Management
-- Migration: 170_tr_bank_master.sql
-- Purpose: Authorized bank account registry with verification workflow
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE tr_bank_account_type AS ENUM (
  'checking',
  'savings',
  'payroll',
  'lockbox',
  'sweep',
  'imprest'
);

CREATE TYPE tr_bank_account_status AS ENUM (
  'draft',
  'verification',
  'active',
  'suspended',
  'inactive',
  'rejected',
  'cancelled'
);

CREATE TYPE tr_verification_type AS ENUM (
  'micro_deposit',
  'statement_upload',
  'external_service',
  'manual'
);

-- ============================================================================
-- PRIMARY TABLE: tr_bank_accounts
-- ============================================================================

CREATE TABLE IF NOT EXISTS tr_bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  company_id UUID NOT NULL,
  
  -- Bank Details
  bank_name VARCHAR(255) NOT NULL,
  branch_name VARCHAR(255),
  bank_address TEXT,
  bank_country VARCHAR(3) NOT NULL,           -- ISO 3166-1 alpha-3
  
  -- Account Details (sensitive - account_number encrypted at rest)
  account_number VARCHAR(100) NOT NULL,
  account_number_last4 VARCHAR(4) NOT NULL,   -- For display
  account_name VARCHAR(255) NOT NULL,         -- Legal entity name
  account_type tr_bank_account_type NOT NULL,
  currency VARCHAR(3) NOT NULL,               -- ISO 4217
  
  -- International Identifiers
  swift_code VARCHAR(11),
  iban VARCHAR(34),
  routing_number VARCHAR(9),                  -- US ABA
  sort_code VARCHAR(8),                       -- UK
  
  -- GL Mapping
  gl_account_code VARCHAR(50) NOT NULL,
  gl_account_id UUID,
  
  -- Status
  status tr_bank_account_status NOT NULL DEFAULT 'draft',
  
  -- Verification
  verification_type tr_verification_type,
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  
  -- Access Control
  authorized_users UUID[],
  approval_limit NUMERIC(15, 2),
  
  -- Workflow
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejected_by UUID,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  suspended_by UUID,
  suspended_at TIMESTAMPTZ,
  suspension_reason TEXT,
  
  -- Audit
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID,
  updated_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Constraints
  CONSTRAINT uq_tr_bank_account_number UNIQUE (tenant_id, account_number),
  CONSTRAINT chk_tr_bank_sod CHECK (approved_by IS NULL OR approved_by <> created_by),
  CONSTRAINT chk_tr_bank_currency CHECK (char_length(currency) = 3)
);

-- ============================================================================
-- SIGNATORIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS tr_bank_signatories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_account_id UUID NOT NULL REFERENCES tr_bank_accounts(id) ON DELETE CASCADE,
  
  user_id UUID NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  signature_type VARCHAR(10) NOT NULL CHECK (signature_type IN ('sole', 'joint')),
  approval_limit NUMERIC(15, 2),
  
  effective_from DATE NOT NULL,
  effective_to DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT uq_tr_signatory_account_user UNIQUE (bank_account_id, user_id, effective_from)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tr_bank_accounts_tenant ON tr_bank_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tr_bank_accounts_company ON tr_bank_accounts(tenant_id, company_id);
CREATE INDEX IF NOT EXISTS idx_tr_bank_accounts_status ON tr_bank_accounts(status);
CREATE INDEX IF NOT EXISTS idx_tr_bank_accounts_type ON tr_bank_accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_tr_bank_accounts_currency ON tr_bank_accounts(currency);
CREATE INDEX IF NOT EXISTS idx_tr_bank_accounts_gl ON tr_bank_accounts(gl_account_code);

CREATE INDEX IF NOT EXISTS idx_tr_signatories_account ON tr_bank_signatories(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_tr_signatories_user ON tr_bank_signatories(user_id);

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE tr_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tr_bank_signatories ENABLE ROW LEVEL SECURITY;

CREATE POLICY tr_bank_accounts_tenant_isolation ON tr_bank_accounts
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::UUID);

CREATE POLICY tr_signatories_tenant_isolation ON tr_bank_signatories
  FOR ALL
  USING (
    bank_account_id IN (
      SELECT id FROM tr_bank_accounts 
      WHERE tenant_id = current_setting('app.tenant_id', true)::UUID
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER trg_tr_bank_accounts_updated_at
  BEFORE UPDATE ON tr_bank_accounts
  FOR EACH ROW EXECUTE FUNCTION finance.update_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE tr_bank_accounts IS 'TR-01 Bank Master - authorized bank account registry';
COMMENT ON COLUMN tr_bank_accounts.account_number IS 'Bank account number - encrypted at rest';
COMMENT ON COLUMN tr_bank_accounts.gl_account_code IS 'Must map to a GL cash account';
COMMENT ON TABLE tr_bank_signatories IS 'Authorized signatories for bank accounts';
