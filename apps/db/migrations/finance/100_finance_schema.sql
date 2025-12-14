-- ============================================================================
-- FINANCE CANON SCHEMA (Data Plane)
-- Migration: 100_finance_schema.sql
-- Purpose: Foundation for AI-BOS Finance — Accounts, Transactions, Ledger
-- ============================================================================

-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Schema Namespace
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS finance;

-- 2. Companies (Multi-Company Structure)
-- ============================================================================
-- Represents legal entities within a tenant (Holding, OpCos, Treasury Center)
CREATE TABLE IF NOT EXISTS finance.companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  
  -- Identity
  code VARCHAR(20) NOT NULL,          -- 'ACME-SG', 'ACME-TREASURY'
  name TEXT NOT NULL,                 -- 'Acme Singapore Pte Ltd'
  type VARCHAR(20) NOT NULL CHECK (type IN ('operating', 'holding', 'treasury', 'dormant')),
  
  -- Currency
  base_currency VARCHAR(3) NOT NULL,  -- ISO 4217: 'SGD', 'USD'
  
  -- Treasury Configuration
  treasury_center_id UUID REFERENCES finance.companies(id),
  pool_participation BOOLEAN DEFAULT FALSE,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'dormant')),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT uq_companies_tenant_code UNIQUE (tenant_id, code)
);

-- 3. Accounts (Chart of Accounts + Bank Accounts)
-- ============================================================================
-- Represents both internal GL accounts and external Bank Accounts
CREATE TABLE IF NOT EXISTS finance.accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  company_id UUID REFERENCES finance.companies(id),
  
  -- Identity
  code VARCHAR(20) NOT NULL,          -- '1000', 'BANK-DBS-SGD'
  name TEXT NOT NULL,                 -- 'Cash and Cash Equivalents'
  
  -- Classification
  type VARCHAR(20) NOT NULL CHECK (type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
  sub_type VARCHAR(50),               -- 'BANK', 'RECEIVABLE', 'PAYABLE', etc.
  
  -- Currency
  currency VARCHAR(3) NOT NULL,       -- ISO 4217
  
  -- Balance (stored as integer cents to avoid floating point)
  balance_cents BIGINT DEFAULT 0,
  
  -- Bank Account Details (if external)
  is_external BOOLEAN DEFAULT FALSE,
  bank_code VARCHAR(20),              -- 'DBS', 'OCBC'
  bank_account_number VARCHAR(50),
  bank_swift_code VARCHAR(11),
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'closed')),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT uq_accounts_tenant_company_code UNIQUE (tenant_id, company_id, code)
);

-- 4. Exchange Rates (FX Market Truth)
-- ============================================================================
CREATE TABLE IF NOT EXISTS finance.fx_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  
  -- Currency Pair
  from_currency VARCHAR(3) NOT NULL,
  to_currency VARCHAR(3) NOT NULL,
  
  -- Rate (high precision for FX)
  rate DECIMAL(20, 10) NOT NULL,
  
  -- Validity
  valid_from TIMESTAMPTZ NOT NULL,
  valid_to TIMESTAMPTZ,               -- NULL means "Current"
  
  -- Source
  source VARCHAR(20) DEFAULT 'MANUAL' CHECK (source IN ('MANUAL', 'TREASURY', 'MARKET', 'CONTRACTED')),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT uq_fx_rates_pair_date UNIQUE (tenant_id, from_currency, to_currency, valid_from, source)
);

-- 5. Transactions (Payment Intent)
-- ============================================================================
-- Represents a request to move money (Invoice, Payment Order, Transfer)
CREATE TABLE IF NOT EXISTS finance.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES finance.companies(id),
  
  -- Traceability
  correlation_id UUID NOT NULL,       -- Links to Kernel audit trail
  reference VARCHAR(50) NOT NULL,     -- 'PAY-2024-001', 'INV-2024-001'
  
  -- Classification
  type VARCHAR(20) NOT NULL CHECK (type IN ('VENDOR', 'INTERCOMPANY', 'TREASURY', 'PAYROLL', 'TAX', 'FX')),
  
  -- Status Machine
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
    'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PROCESSING', 
    'COMPLETED', 'FAILED', 'REJECTED', 'CANCELLED'
  )),
  
  -- Amounts (stored as cents)
  amount_cents BIGINT NOT NULL,
  currency VARCHAR(3) NOT NULL,
  
  -- FX (if cross-currency)
  fx_rate DECIMAL(20, 10),
  functional_amount_cents BIGINT,     -- In company base currency
  
  -- Beneficiary
  beneficiary_type VARCHAR(20) CHECK (beneficiary_type IN ('VENDOR', 'EMPLOYEE', 'COMPANY', 'OTHER')),
  beneficiary_id UUID,                -- Reference to vendor/employee/company
  beneficiary_name TEXT NOT NULL,
  beneficiary_bank_account VARCHAR(50),
  beneficiary_swift_code VARCHAR(11),
  
  -- Intercompany (if applicable)
  counterparty_company_id UUID REFERENCES finance.companies(id),
  
  -- Scheduling
  value_date DATE NOT NULL,
  payment_method VARCHAR(20) CHECK (payment_method IN ('WIRE', 'ACH', 'CHECK', 'INTERNAL', 'SWIFT')),
  
  -- Approval Tracking
  current_approval_level INTEGER DEFAULT 0,
  required_approval_levels INTEGER NOT NULL DEFAULT 1,
  
  -- Description
  description TEXT,
  
  -- Audit
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Transaction Approvals (Workflow)
-- ============================================================================
CREATE TABLE IF NOT EXISTS finance.transaction_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES finance.transactions(id) ON DELETE CASCADE,
  
  -- Approval Details
  level INTEGER NOT NULL,
  approver_id UUID NOT NULL,
  decision VARCHAR(20) NOT NULL CHECK (decision IN ('APPROVED', 'REJECTED')),
  comments TEXT,
  
  -- Timing
  requested_at TIMESTAMPTZ NOT NULL,
  actioned_at TIMESTAMPTZ DEFAULT NOW(),
  sla_hours INTEGER,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Approval Matrices (Rules)
-- ============================================================================
CREATE TABLE IF NOT EXISTS finance.approval_matrices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES finance.companies(id),
  
  -- Matching Criteria
  payment_type VARCHAR(20) NOT NULL,
  min_amount_cents BIGINT NOT NULL,
  max_amount_cents BIGINT,            -- NULL = unlimited
  currency VARCHAR(3) DEFAULT '*',    -- '*' = any currency
  
  -- Approval Requirements
  required_approvals INTEGER NOT NULL DEFAULT 1,
  approval_levels JSONB NOT NULL,     -- [{level: 1, roles: [...], sla_hours: 24}]
  
  -- Special Rules
  requires_cfo BOOLEAN DEFAULT FALSE,
  requires_dual_signature BOOLEAN DEFAULT FALSE,
  weekend_allowed BOOLEAN DEFAULT TRUE,
  
  -- Status
  active BOOLEAN DEFAULT TRUE,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Journal Entries (GL Headers)
-- ============================================================================
-- The General Ledger: Immutable, Double-Entry
CREATE TABLE IF NOT EXISTS finance.journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES finance.companies(id),
  
  -- Link to source
  transaction_id UUID REFERENCES finance.transactions(id),
  correlation_id UUID,
  
  -- Posting
  posted_at TIMESTAMPTZ DEFAULT NOW(),
  posting_date DATE NOT NULL,
  
  -- Reference
  reference VARCHAR(50),
  description TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'POSTED' CHECK (status IN ('DRAFT', 'POSTED', 'REVERSED')),
  reversed_by UUID REFERENCES finance.journal_entries(id),
  
  -- Audit
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Journal Lines (Debit/Credit Entries)
-- ============================================================================
CREATE TABLE IF NOT EXISTS finance.journal_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journal_entry_id UUID NOT NULL REFERENCES finance.journal_entries(id) ON DELETE CASCADE,
  
  -- Account
  account_id UUID NOT NULL REFERENCES finance.accounts(id),
  
  -- Entry
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('DEBIT', 'CREDIT')),
  amount_cents BIGINT NOT NULL CHECK (amount_cents >= 0),
  
  -- Currency at time of posting
  currency VARCHAR(3) NOT NULL,
  
  -- Description
  line_description TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Intercompany Settlements
-- ============================================================================
CREATE TABLE IF NOT EXISTS finance.intercompany_settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  
  -- Companies
  from_company_id UUID NOT NULL REFERENCES finance.companies(id),
  to_company_id UUID NOT NULL REFERENCES finance.companies(id),
  
  -- Amount
  amount_cents BIGINT NOT NULL,
  currency VARCHAR(3) NOT NULL,
  
  -- Related Transactions
  transaction_ids UUID[] NOT NULL,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SETTLED', 'CANCELLED')),
  settled_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Treasury Pool Balances (Daily Snapshot)
-- ============================================================================
CREATE TABLE IF NOT EXISTS finance.treasury_pool_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  balance_date DATE NOT NULL,
  
  -- Company
  company_id UUID NOT NULL REFERENCES finance.companies(id),
  currency VARCHAR(3) NOT NULL,
  
  -- Balances (in cents)
  opening_balance_cents BIGINT NOT NULL,
  sweep_amount_cents BIGINT DEFAULT 0,
  fund_amount_cents BIGINT DEFAULT 0,
  closing_balance_cents BIGINT NOT NULL,
  
  -- Pool Position
  pool_position_cents BIGINT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT uq_pool_balance_date UNIQUE (tenant_id, company_id, currency, balance_date)
);

-- ============================================================================
-- INDEXES for "Lite Azure" Performance
-- ============================================================================

-- Tenant isolation (critical for RLS performance)
CREATE INDEX idx_finance_companies_tenant ON finance.companies(tenant_id);
CREATE INDEX idx_finance_accounts_tenant ON finance.accounts(tenant_id);
CREATE INDEX idx_finance_accounts_company ON finance.accounts(company_id);
CREATE INDEX idx_finance_fx_rates_tenant ON finance.fx_rates(tenant_id);
CREATE INDEX idx_finance_transactions_tenant ON finance.transactions(tenant_id);
CREATE INDEX idx_finance_transactions_company ON finance.transactions(company_id);
CREATE INDEX idx_finance_journal_entries_tenant ON finance.journal_entries(tenant_id);
CREATE INDEX idx_finance_journal_entries_company ON finance.journal_entries(company_id);

-- Business lookups
CREATE INDEX idx_finance_transactions_correlation ON finance.transactions(correlation_id);
CREATE INDEX idx_finance_transactions_status ON finance.transactions(tenant_id, status);
CREATE INDEX idx_finance_transactions_value_date ON finance.transactions(tenant_id, value_date);
CREATE INDEX idx_finance_fx_lookup ON finance.fx_rates(tenant_id, from_currency, to_currency, valid_from DESC);
CREATE INDEX idx_finance_journal_entries_transaction ON finance.journal_entries(transaction_id);
CREATE INDEX idx_finance_journal_lines_entry ON finance.journal_lines(journal_entry_id);
CREATE INDEX idx_finance_approvals_transaction ON finance.transaction_approvals(transaction_id);

-- ============================================================================
-- TRIGGERS for updated_at
-- ============================================================================

-- Reuse the updated_at trigger function from kernel schema if exists
CREATE OR REPLACE FUNCTION finance.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON finance.companies
  FOR EACH ROW EXECUTE FUNCTION finance.update_updated_at();

CREATE TRIGGER trg_accounts_updated_at
  BEFORE UPDATE ON finance.accounts
  FOR EACH ROW EXECUTE FUNCTION finance.update_updated_at();

CREATE TRIGGER trg_transactions_updated_at
  BEFORE UPDATE ON finance.transactions
  FOR EACH ROW EXECUTE FUNCTION finance.update_updated_at();

CREATE TRIGGER trg_approval_matrices_updated_at
  BEFORE UPDATE ON finance.approval_matrices
  FOR EACH ROW EXECUTE FUNCTION finance.update_updated_at();

CREATE TRIGGER trg_intercompany_settlements_updated_at
  BEFORE UPDATE ON finance.intercompany_settlements
  FOR EACH ROW EXECUTE FUNCTION finance.update_updated_at();

-- ============================================================================
-- COMMENTS for Documentation
-- ============================================================================

COMMENT ON SCHEMA finance IS 'AI-BOS Finance Data Plane - Transactions, Ledger, Treasury';

COMMENT ON TABLE finance.companies IS 'Legal entities within a tenant (Holding, OpCos, Treasury)';
COMMENT ON TABLE finance.accounts IS 'Chart of Accounts + Bank Accounts (balance in cents)';
COMMENT ON TABLE finance.fx_rates IS 'Exchange rates with validity periods';
COMMENT ON TABLE finance.transactions IS 'Payment requests with status machine';
COMMENT ON TABLE finance.transaction_approvals IS 'Approval workflow tracking';
COMMENT ON TABLE finance.approval_matrices IS 'Approval rules by amount/type/company';
COMMENT ON TABLE finance.journal_entries IS 'GL posting headers (immutable)';
COMMENT ON TABLE finance.journal_lines IS 'GL debit/credit entries (double-entry)';
COMMENT ON TABLE finance.intercompany_settlements IS 'Cross-company settlement tracking';
COMMENT ON TABLE finance.treasury_pool_balances IS 'Daily treasury pool snapshots';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
