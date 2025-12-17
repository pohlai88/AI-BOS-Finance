-- ============================================================================
-- GL-02 Journal Entry - Database Schema
-- ============================================================================
-- Purpose: Implement journal entry tables with invariant constraints
-- Author: AI-BOS Architecture Team
-- Version: 1.0
-- Date: 2025-12-17
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE journal_entry_type AS ENUM (
  'adjusting',
  'accrual',
  'reclassification',
  'opening',
  'closing',
  'reversal',
  'correction'
);

CREATE TYPE journal_entry_status AS ENUM (
  'draft',
  'submitted',
  'approved',
  'rejected',
  'posted',
  'cancelled',
  'closed'
);

-- ============================================================================
-- PRIMARY TABLE: gl_journal_entries
-- ============================================================================

CREATE TABLE gl_journal_entries (
  -- ══════════════════════════════════════════════════════════════════════
  -- IDENTITY
  -- ══════════════════════════════════════════════════════════════════════
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  company_id UUID NOT NULL,
  
  -- ══════════════════════════════════════════════════════════════════════
  -- ENTRY METADATA
  -- ══════════════════════════════════════════════════════════════════════
  entry_number VARCHAR(50) NOT NULL,
  entry_date DATE NOT NULL,
  entry_type journal_entry_type NOT NULL,
  reference VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  
  -- ══════════════════════════════════════════════════════════════════════
  -- AMOUNTS (stored as string to avoid float issues, per CONT_07 §4.1)
  -- ══════════════════════════════════════════════════════════════════════
  total_debit NUMERIC(15, 2) NOT NULL,
  total_credit NUMERIC(15, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  is_balanced BOOLEAN NOT NULL DEFAULT false,
  
  -- ══════════════════════════════════════════════════════════════════════
  -- LIFECYCLE
  -- ══════════════════════════════════════════════════════════════════════
  status journal_entry_status NOT NULL DEFAULT 'draft',
  
  -- ══════════════════════════════════════════════════════════════════════
  -- REVERSAL HANDLING
  -- ══════════════════════════════════════════════════════════════════════
  auto_reverse BOOLEAN NOT NULL DEFAULT false,
  reverse_date DATE,
  original_entry_id UUID REFERENCES gl_journal_entries(id),
  has_reversal BOOLEAN NOT NULL DEFAULT false,
  reversal_entry_id UUID REFERENCES gl_journal_entries(id),
  
  -- ══════════════════════════════════════════════════════════════════════
  -- RECURRING
  -- ══════════════════════════════════════════════════════════════════════
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurring_frequency VARCHAR(20),
  recurring_start_date DATE,
  recurring_end_date DATE,
  
  -- ══════════════════════════════════════════════════════════════════════
  -- WORKFLOW
  -- ══════════════════════════════════════════════════════════════════════
  submitted_at TIMESTAMPTZ,
  submitted_by UUID,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  rejected_at TIMESTAMPTZ,
  rejected_by UUID,
  rejection_reason TEXT,
  posted_at TIMESTAMPTZ,
  posted_by UUID,
  gl_posting_reference VARCHAR(100),
  
  -- ══════════════════════════════════════════════════════════════════════
  -- AUDIT TRAIL
  -- ══════════════════════════════════════════════════════════════════════
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID,
  updated_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  
  -- ══════════════════════════════════════════════════════════════════════
  -- CONSTRAINTS (Invariants)
  -- ══════════════════════════════════════════════════════════════════════
  
  -- 🔒 BALANCED ENTRY (total_debit = total_credit)
  CONSTRAINT chk_je_balanced 
    CHECK (total_debit = total_credit),
  
  -- 🔒 SOD: Approver ≠ Creator
  CONSTRAINT chk_je_sod 
    CHECK (approved_by IS NULL OR approved_by <> created_by),
  
  -- 🔒 AUTO-REVERSE + RECURRING CONFLICT
  CONSTRAINT chk_je_auto_reverse_recurring 
    CHECK (NOT (auto_reverse = true AND is_recurring = true)),
  
  -- 🔒 DESCRIPTION REQUIRED
  CONSTRAINT chk_je_description_required 
    CHECK (char_length(description) > 0),
  
  -- 🔒 REFERENCE REQUIRED
  CONSTRAINT chk_je_reference_required 
    CHECK (char_length(reference) > 0),
  
  -- ⚠️ CRITICAL FIX #9: UNIQUE REFERENCE PER COMPANY
  CONSTRAINT uq_je_company_reference 
    UNIQUE (company_id, reference),
  
  -- ⚠️ CRITICAL FIX #8a: Status-field invariants (APPROVED must have approver)
  CONSTRAINT chk_je_approved_fields
    CHECK (
      status <> 'approved' OR 
      (approved_by IS NOT NULL AND approved_at IS NOT NULL)
    ),
  
  -- ⚠️ CRITICAL FIX #8b: Status-field invariants (POSTED must have posting reference)
  CONSTRAINT chk_je_posted_fields
    CHECK (
      status <> 'posted' OR 
      (posted_by IS NOT NULL AND posted_at IS NOT NULL AND gl_posting_reference IS NOT NULL)
    ),
  
  -- ⚠️ CRITICAL FIX #8c: Status-field invariants (SUBMITTED must have submitter)
  CONSTRAINT chk_je_submitted_fields
    CHECK (
      status <> 'submitted' OR 
      (submitted_by IS NOT NULL AND submitted_at IS NOT NULL)
    ),
  
  -- ⚠️ CRITICAL FIX #8d: Status-field invariants (REJECTED must have rejector + reason)
  CONSTRAINT chk_je_rejected_fields
    CHECK (
      status <> 'rejected' OR 
      (rejected_by IS NOT NULL AND rejected_at IS NOT NULL AND rejection_reason IS NOT NULL)
    )
);

-- ============================================================================
-- CHILD TABLE: gl_journal_lines
-- ============================================================================

CREATE TABLE gl_journal_lines (
  -- ══════════════════════════════════════════════════════════════════════
  -- IDENTITY
  -- ══════════════════════════════════════════════════════════════════════
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journal_entry_id UUID NOT NULL REFERENCES gl_journal_entries(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  
  -- ══════════════════════════════════════════════════════════════════════
  -- ACCOUNT & AMOUNTS
  -- ══════════════════════════════════════════════════════════════════════
  account_code VARCHAR(50) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  
  debit_amount NUMERIC(15, 2),
  credit_amount NUMERIC(15, 2),
  
  -- ══════════════════════════════════════════════════════════════════════
  -- DIMENSIONS (Optional)
  -- ══════════════════════════════════════════════════════════════════════
  cost_center VARCHAR(50),
  department VARCHAR(50),
  project VARCHAR(50),
  
  memo TEXT,
  
  -- ══════════════════════════════════════════════════════════════════════
  -- AUDIT
  -- ══════════════════════════════════════════════════════════════════════
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- ══════════════════════════════════════════════════════════════════════
  -- CONSTRAINTS (Invariants)
  -- ══════════════════════════════════════════════════════════════════════
  
  -- 🔒 DEBIT XOR CREDIT (exactly one must be set)
  CONSTRAINT chk_jel_debit_xor_credit 
    CHECK (
      (debit_amount IS NOT NULL AND credit_amount IS NULL) OR
      (debit_amount IS NULL AND credit_amount IS NOT NULL)
    ),
  
  -- 🔒 UNIQUE LINE NUMBER PER ENTRY
  CONSTRAINT uq_jel_entry_line_number 
    UNIQUE (journal_entry_id, line_number)
);

-- ============================================================================
-- ATTACHMENT TABLE: gl_journal_attachments
-- ============================================================================

CREATE TABLE gl_journal_attachments (
  -- ══════════════════════════════════════════════════════════════════════
  -- IDENTITY
  -- ══════════════════════════════════════════════════════════════════════
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journal_entry_id UUID NOT NULL REFERENCES gl_journal_entries(id) ON DELETE CASCADE,
  
  -- ══════════════════════════════════════════════════════════════════════
  -- FILE METADATA
  -- ══════════════════════════════════════════════════════════════════════
  filename VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  
  -- ══════════════════════════════════════════════════════════════════════
  -- AUDIT
  -- ══════════════════════════════════════════════════════════════════════
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- ══════════════════════════════════════════════════════════════════════
  -- CONSTRAINTS
  -- ══════════════════════════════════════════════════════════════════════
  
  -- 🔒 MAX FILE SIZE: 10MB
  CONSTRAINT chk_jea_file_size 
    CHECK (file_size_bytes <= 10485760)
);

-- ============================================================================
-- INDEXES (Performance)
-- ============================================================================

-- Primary lookups
CREATE INDEX idx_je_company_date ON gl_journal_entries(company_id, entry_date);
CREATE INDEX idx_je_status ON gl_journal_entries(status);
CREATE INDEX idx_je_created_by ON gl_journal_entries(created_by);
CREATE INDEX idx_je_approved_by ON gl_journal_entries(approved_by);
CREATE INDEX idx_je_entry_number ON gl_journal_entries(entry_number);

-- Reversal tracking
CREATE INDEX idx_je_original_entry ON gl_journal_entries(original_entry_id) 
  WHERE original_entry_id IS NOT NULL;
CREATE INDEX idx_je_reversal_entry ON gl_journal_entries(reversal_entry_id) 
  WHERE reversal_entry_id IS NOT NULL;

-- Lines
CREATE INDEX idx_jel_journal_entry ON gl_journal_lines(journal_entry_id);
CREATE INDEX idx_jel_account_code ON gl_journal_lines(account_code);

-- Attachments
CREATE INDEX idx_jea_journal_entry ON gl_journal_attachments(journal_entry_id);

-- Multi-tenancy isolation
CREATE INDEX idx_je_tenant ON gl_journal_entries(tenant_id);

-- ============================================================================
-- RLS (Row-Level Security) - Tenant Isolation
-- ============================================================================

ALTER TABLE gl_journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE gl_journal_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE gl_journal_attachments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access entries in their tenant
CREATE POLICY je_tenant_isolation ON gl_journal_entries
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id')::UUID);

CREATE POLICY jel_tenant_isolation ON gl_journal_lines
  FOR ALL
  USING (
    journal_entry_id IN (
      SELECT id FROM gl_journal_entries 
      WHERE tenant_id = current_setting('app.tenant_id')::UUID
    )
  );

CREATE POLICY jea_tenant_isolation ON gl_journal_attachments
  FOR ALL
  USING (
    journal_entry_id IN (
      SELECT id FROM gl_journal_entries 
      WHERE tenant_id = current_setting('app.tenant_id')::UUID
    )
  );

-- ============================================================================
-- TRIGGERS (Audit & Validation)
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_je_updated_at
BEFORE UPDATE ON gl_journal_entries
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE gl_journal_entries IS 'GL-02 Journal Entry master table';
COMMENT ON COLUMN gl_journal_entries.is_balanced IS 'Computed: total_debit = total_credit';
COMMENT ON CONSTRAINT chk_je_balanced ON gl_journal_entries IS 'Invariant: Entry must be balanced';
COMMENT ON CONSTRAINT chk_je_sod ON gl_journal_entries IS 'Invariant: SoD - Approver cannot be creator';
COMMENT ON CONSTRAINT chk_jel_debit_xor_credit ON gl_journal_lines IS 'Invariant: Line must have debit XOR credit';

-- ============================================================================
-- GRANTS (Security)
-- ============================================================================

-- Application role (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE ON gl_journal_entries TO app_user;
-- GRANT SELECT, INSERT ON gl_journal_lines TO app_user;
-- GRANT SELECT, INSERT ON gl_journal_attachments TO app_user;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
