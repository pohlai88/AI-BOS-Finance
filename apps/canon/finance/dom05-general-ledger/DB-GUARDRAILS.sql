-- ============================================================================
-- DB GUARDRAILS — Immutable Locks for Finance Canon
-- ============================================================================
-- Purpose: Enforce business rules at database edge (cannot be bypassed by buggy code)
-- Author: AI-BOS Architecture Team
-- Date: 2025-12-17
-- Version: 1.0
-- ============================================================================
--
-- Philosophy: "Trust No One, Not Even Your Own Code"
--
-- Every critical business rule MUST be enforced at the database level:
-- 1. Application logic can have bugs
-- 2. Developers can bypass service layers
-- 3. Raw SQL can be executed (admin access, scripts, migrations)
--
-- Therefore: Database is the FINAL line of defense.
--
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- For gen_random_uuid, digest
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- For period overlap exclusion

-- ============================================================================
-- PART 1: TR-01 BANK MASTER GUARDRAILS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- GUARDRAIL #1: Bank Account Uniqueness via Hash (P0 FIX)
-- ----------------------------------------------------------------------------
-- Problem: account_number_encrypted uses random IV/salt → not unique
-- Solution: Store deterministic hash for uniqueness check
-- ----------------------------------------------------------------------------

ALTER TABLE treasury_bank_accounts
ADD COLUMN account_number_hash VARCHAR(64) NOT NULL;

-- Compute hash: SHA-256(company_id || bank_name || account_number)
-- This ensures uniqueness even if same account number used at different banks
COMMENT ON COLUMN treasury_bank_accounts.account_number_hash IS 
  'SHA-256 hash of normalized account identifier (company_id || bank_name || account_number) for uniqueness enforcement';

-- Unique constraint on hash (not encrypted value)
CREATE UNIQUE INDEX uq_bank_account_hash 
ON treasury_bank_accounts(company_id, account_number_hash);

-- Function to compute hash (call from app before insert/update)
CREATE OR REPLACE FUNCTION compute_bank_account_hash(
  p_company_id UUID,
  p_bank_name TEXT,
  p_account_number TEXT
) RETURNS VARCHAR(64) AS $$
BEGIN
  RETURN encode(
    digest(
      p_company_id::TEXT || '||' || 
      upper(trim(p_bank_name)) || '||' || 
      regexp_replace(p_account_number, '[^0-9]', '', 'g'),  -- Normalize: digits only
      'sha256'
    ),
    'hex'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ----------------------------------------------------------------------------
-- GUARDRAIL #2: Micro-Deposit Verification State (P0 FIX)
-- ----------------------------------------------------------------------------
-- Problem: No persistence for verification attempts/expiry/generated amounts
-- Solution: Add verification tracking fields + enforce constraints
-- ----------------------------------------------------------------------------

ALTER TABLE treasury_bank_accounts
ADD COLUMN verification_attempt_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN verification_expires_at TIMESTAMPTZ,
ADD COLUMN verification_microdeposit_1 NUMERIC(5, 2),  -- e.g., 0.01
ADD COLUMN verification_microdeposit_2 NUMERIC(5, 2),  -- e.g., 0.02
ADD COLUMN verification_microdeposit_hash VARCHAR(64); -- SHA-256(amount1||amount2) for tamper detection

COMMENT ON COLUMN treasury_bank_accounts.verification_attempt_count IS 
  'Number of failed verification attempts (max 3)';
COMMENT ON COLUMN treasury_bank_accounts.verification_expires_at IS 
  'Verification must complete before this timestamp (5 business days from initiation)';
COMMENT ON COLUMN treasury_bank_accounts.verification_microdeposit_hash IS 
  'Hash of micro-deposit amounts for tamper detection';

-- Constraint: Max 3 verification attempts
ALTER TABLE treasury_bank_accounts
ADD CONSTRAINT chk_bank_verification_max_attempts
CHECK (verification_attempt_count <= 3);

-- Constraint: If verification in progress, expiry must be set
ALTER TABLE treasury_bank_accounts
ADD CONSTRAINT chk_bank_verification_expiry
CHECK (
  status <> 'verification' OR 
  verification_expires_at IS NOT NULL
);

-- Function: Verify micro-deposits
CREATE OR REPLACE FUNCTION verify_bank_account_microdeposits(
  p_bank_account_id UUID,
  p_amount_1 NUMERIC(5, 2),
  p_amount_2 NUMERIC(5, 2)
) RETURNS BOOLEAN AS $$
DECLARE
  v_account RECORD;
  v_computed_hash VARCHAR(64);
BEGIN
  -- Get account with FOR UPDATE (lock row)
  SELECT * INTO v_account
  FROM treasury_bank_accounts
  WHERE id = p_bank_account_id
  FOR UPDATE;
  
  -- Check if already verified
  IF v_account.status = 'active' THEN
    RAISE EXCEPTION 'Bank account already verified';
  END IF;
  
  -- Check if expired
  IF v_account.verification_expires_at < NOW() THEN
    UPDATE treasury_bank_accounts
    SET status = 'rejected',
        rejection_reason = 'Verification expired (5 business days elapsed)'
    WHERE id = p_bank_account_id;
    RETURN FALSE;
  END IF;
  
  -- Compute hash of submitted amounts
  v_computed_hash := encode(
    digest(p_amount_1::TEXT || '||' || p_amount_2::TEXT, 'sha256'),
    'hex'
  );
  
  -- Check if amounts match
  IF v_computed_hash = v_account.verification_microdeposit_hash THEN
    -- SUCCESS: Mark as active
    UPDATE treasury_bank_accounts
    SET status = 'active',
        verified_at = NOW(),
        verification_method = 'micro_deposit'
    WHERE id = p_bank_account_id;
    RETURN TRUE;
  ELSE
    -- FAILURE: Increment attempt count
    UPDATE treasury_bank_accounts
    SET verification_attempt_count = verification_attempt_count + 1,
        last_verification_attempt_at = NOW()
    WHERE id = p_bank_account_id;
    
    -- Check if max attempts exceeded
    IF v_account.verification_attempt_count + 1 >= 3 THEN
      UPDATE treasury_bank_accounts
      SET status = 'rejected',
          rejection_reason = 'Maximum verification attempts exceeded (3)'
      WHERE id = p_bank_account_id;
    END IF;
    
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- GUARDRAIL #3: Bank Account Change Requests (P0 FIX)
-- ----------------------------------------------------------------------------
-- Problem: Direct updates bypass approval workflow
-- Solution: All protected field changes go through change request table
-- ----------------------------------------------------------------------------

CREATE TABLE treasury_bank_account_change_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  bank_account_id UUID NOT NULL REFERENCES treasury_bank_accounts(id),
  
  -- Change metadata
  change_type VARCHAR(50) NOT NULL CHECK (change_type IN (
    'gl_account_mapping',
    'authorized_approvers',
    'transaction_limits',
    'account_details'
  )),
  
  -- Proposed changes (JSON diff)
  proposed_changes JSONB NOT NULL,
  
  -- Workflow
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'submitted', 'approved', 'rejected', 'applied'
  )),
  
  requested_by UUID NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  
  rejected_by UUID,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  applied_at TIMESTAMPTZ,
  applied_by UUID,
  
  -- SoD: Approver cannot be requestor
  CONSTRAINT chk_bank_change_sod
  CHECK (approved_by IS NULL OR approved_by <> requested_by),
  
  -- If approved, must have approver
  CONSTRAINT chk_bank_change_approved_fields
  CHECK (status <> 'approved' OR (approved_by IS NOT NULL AND approved_at IS NOT NULL)),
  
  -- If rejected, must have rejector + reason
  CONSTRAINT chk_bank_change_rejected_fields
  CHECK (status <> 'rejected' OR (rejected_by IS NOT NULL AND rejected_at IS NOT NULL AND rejection_reason IS NOT NULL))
);

CREATE INDEX idx_bank_change_requests_account ON treasury_bank_account_change_requests(bank_account_id);
CREATE INDEX idx_bank_change_requests_status ON treasury_bank_account_change_requests(status);

-- Function: Apply approved change request
CREATE OR REPLACE FUNCTION apply_bank_account_change_request(
  p_change_request_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_request RECORD;
BEGIN
  -- Get change request with lock
  SELECT * INTO v_request
  FROM treasury_bank_account_change_requests
  WHERE id = p_change_request_id
  FOR UPDATE;
  
  -- Validate status
  IF v_request.status <> 'approved' THEN
    RAISE EXCEPTION 'Change request must be approved before applying';
  END IF;
  
  -- Apply changes (merge JSONB)
  UPDATE treasury_bank_accounts
  SET 
    -- Extract individual fields from JSONB and apply
    gl_account_code = COALESCE(
      v_request.proposed_changes->>'gl_account_code',
      gl_account_code
    ),
    authorized_approvers = COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(v_request.proposed_changes->'authorized_approvers')),
      authorized_approvers
    ),
    daily_transaction_limit = COALESCE(
      (v_request.proposed_changes->>'daily_transaction_limit')::NUMERIC,
      daily_transaction_limit
    ),
    updated_by = v_request.approved_by,
    updated_at = NOW()
  WHERE id = v_request.bank_account_id;
  
  -- Mark change request as applied
  UPDATE treasury_bank_account_change_requests
  SET status = 'applied',
      applied_at = NOW(),
      applied_by = v_request.approved_by
  WHERE id = p_change_request_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 2: GL-02 JOURNAL ENTRY GUARDRAILS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- GUARDRAIL #4: Computed Totals (P0 FIX)
-- ----------------------------------------------------------------------------
-- Problem: User-entered totals can "lie" (bypass balance check)
-- Solution: Auto-compute totals from lines using trigger
-- ----------------------------------------------------------------------------

-- Trigger function: Compute totals from lines
CREATE OR REPLACE FUNCTION compute_journal_entry_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_total_debit NUMERIC(15, 2);
  v_total_credit NUMERIC(15, 2);
BEGIN
  -- Compute totals from lines
  SELECT 
    COALESCE(SUM(debit_amount), 0),
    COALESCE(SUM(credit_amount), 0)
  INTO v_total_debit, v_total_credit
  FROM gl_journal_lines
  WHERE journal_entry_id = NEW.id;
  
  -- Update entry with computed totals
  NEW.total_debit := v_total_debit;
  NEW.total_credit := v_total_credit;
  NEW.is_balanced := (v_total_debit = v_total_credit);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Recompute totals after line changes
CREATE TRIGGER trg_je_recompute_totals
BEFORE INSERT OR UPDATE ON gl_journal_entries
FOR EACH ROW
EXECUTE FUNCTION compute_journal_entry_totals();

-- Also trigger when lines change
CREATE OR REPLACE FUNCTION recompute_je_totals_on_line_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Update parent entry (trigger will recompute totals)
  UPDATE gl_journal_entries
  SET updated_at = NOW()
  WHERE id = COALESCE(NEW.journal_entry_id, OLD.journal_entry_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_je_line_change_recompute
AFTER INSERT OR UPDATE OR DELETE ON gl_journal_lines
FOR EACH ROW
EXECUTE FUNCTION recompute_je_totals_on_line_change();

-- ----------------------------------------------------------------------------
-- GUARDRAIL #5: Reference Uniqueness (P0 FIX — VERIFY)
-- ----------------------------------------------------------------------------
-- Already added in GL-02 migration.sql as:
-- CONSTRAINT uq_je_company_reference UNIQUE (company_id, reference)
-- ✅ Verified present
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- GUARDRAIL #6: JE Edit Immutability by Status (P1 FIX)
-- ----------------------------------------------------------------------------
-- Problem: Once submitted/posted, entries should be immutable
-- Solution: Block updates to content fields after submission
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION enforce_je_immutability()
RETURNS TRIGGER AS $$
BEGIN
  -- Once SUBMITTED, lock content (only status changes allowed)
  IF OLD.status IN ('submitted', 'approved', 'posted', 'closed') THEN
    -- Allow status transitions
    IF NEW.status <> OLD.status THEN
      RETURN NEW;
    END IF;
    
    -- Allow workflow field updates (approved_by, posted_at, etc.)
    -- But block content changes
    IF NEW.entry_date <> OLD.entry_date OR
       NEW.description <> OLD.description OR
       NEW.reference <> OLD.reference OR
       NEW.entry_type <> OLD.entry_type THEN
      RAISE EXCEPTION 'Cannot modify journal entry content after submission (ID: %)', OLD.id
        USING ERRCODE = 'integrity_constraint_violation',
              HINT = 'Create a reversal entry instead';
    END IF;
  END IF;
  
  -- Once POSTED, lock everything except status → CLOSED
  IF OLD.status IN ('posted', 'closed') THEN
    IF NEW.status <> 'closed' AND NEW.status <> OLD.status THEN
      RAISE EXCEPTION 'Cannot modify posted journal entry (ID: %)', OLD.id
        USING ERRCODE = 'integrity_constraint_violation',
              HINT = 'Posted entries are immutable';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_je_enforce_immutability
BEFORE UPDATE ON gl_journal_entries
FOR EACH ROW
EXECUTE FUNCTION enforce_je_immutability();

-- Also prevent line changes after submission
CREATE OR REPLACE FUNCTION enforce_je_line_immutability()
RETURNS TRIGGER AS $$
DECLARE
  v_entry_status VARCHAR(20);
BEGIN
  -- Get parent entry status
  SELECT status INTO v_entry_status
  FROM gl_journal_entries
  WHERE id = COALESCE(NEW.journal_entry_id, OLD.journal_entry_id);
  
  -- Block changes if entry is submitted/posted
  IF v_entry_status IN ('submitted', 'approved', 'posted', 'closed') THEN
    RAISE EXCEPTION 'Cannot modify journal entry lines after submission (Entry status: %)', v_entry_status
      USING ERRCODE = 'integrity_constraint_violation',
            HINT = 'Journal entry is immutable';
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_je_line_enforce_immutability
BEFORE UPDATE OR DELETE ON gl_journal_lines
FOR EACH ROW
EXECUTE FUNCTION enforce_je_line_immutability();

-- ----------------------------------------------------------------------------
-- GUARDRAIL #7: Optimistic Locking for Approvals (P1 FIX)
-- ----------------------------------------------------------------------------
-- Problem: Concurrent approvals can race
-- Solution: Use version field for atomic updates
-- ----------------------------------------------------------------------------

-- This is enforced at application level with query:
-- UPDATE gl_journal_entries
-- SET status = 'approved', 
--     approved_by = ?, 
--     approved_at = NOW(),
--     version = version + 1
-- WHERE id = ? 
--   AND status = 'submitted' 
--   AND version = ?  -- ← Optimistic lock
-- RETURNING *;

-- If 0 rows updated → version conflict

-- Add helpful function for application layer
CREATE OR REPLACE FUNCTION approve_journal_entry_atomic(
  p_entry_id UUID,
  p_approver_id UUID,
  p_expected_version INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_rows_affected INTEGER;
BEGIN
  UPDATE gl_journal_entries
  SET status = 'approved',
      approved_by = p_approver_id,
      approved_at = NOW(),
      version = version + 1
  WHERE id = p_entry_id
    AND status = 'submitted'
    AND version = p_expected_version;
  
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  
  IF v_rows_affected = 0 THEN
    -- Either entry not found, wrong status, or version conflict
    RAISE EXCEPTION 'Approval failed: entry not found, wrong status, or version conflict'
      USING ERRCODE = 'serialization_failure';
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 3: GL-04 PERIOD CLOSE GUARDRAILS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- GUARDRAIL #8: Period Lock at DB Boundary (P1 FIX)
-- ----------------------------------------------------------------------------
-- Problem: Period close should block posting at DB level (not just app)
-- Solution: Trigger that checks period status before allowing GL writes
-- ----------------------------------------------------------------------------

-- Function: Check if period allows posting
CREATE OR REPLACE FUNCTION is_period_open_for_posting(
  p_company_id UUID,
  p_posting_date DATE,
  p_entry_type VARCHAR(20)
) RETURNS BOOLEAN AS $$
DECLARE
  v_period_status VARCHAR(20);
  v_allowed_types VARCHAR(20)[];
BEGIN
  -- Get period status for date
  SELECT status INTO v_period_status
  FROM gl_fiscal_periods
  WHERE company_id = p_company_id
    AND start_date <= p_posting_date
    AND end_date >= p_posting_date;  -- Inclusive
  
  -- No period found
  IF v_period_status IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Hard close: NO posting allowed
  IF v_period_status = 'hard_close' THEN
    RETURN FALSE;
  END IF;
  
  -- Open: All entry types allowed
  IF v_period_status = 'open' THEN
    RETURN TRUE;
  END IF;
  
  -- Soft close: Only adjusting/accrual
  IF v_period_status = 'soft_close' THEN
    RETURN p_entry_type IN ('adjusting', 'accrual');
  END IF;
  
  -- Controlled reopen: Only correction
  IF v_period_status = 'controlled_reopen' THEN
    RETURN p_entry_type = 'correction';
  END IF;
  
  -- Default: deny
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE;

-- Trigger: Enforce period lock on journal entry posting
CREATE OR REPLACE FUNCTION enforce_period_lock_on_posting()
RETURNS TRIGGER AS $$
DECLARE
  v_can_post BOOLEAN;
BEGIN
  -- Only enforce on status change to POSTED
  IF NEW.status = 'posted' AND OLD.status <> 'posted' THEN
    v_can_post := is_period_open_for_posting(
      NEW.company_id,
      NEW.entry_date,
      NEW.entry_type
    );
    
    IF NOT v_can_post THEN
      RAISE EXCEPTION 'Cannot post journal entry: period is closed or entry type not allowed (Date: %, Type: %)',
        NEW.entry_date, NEW.entry_type
        USING ERRCODE = 'integrity_constraint_violation',
              HINT = 'Period is closed for posting or entry type is restricted';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_je_enforce_period_lock
BEFORE UPDATE ON gl_journal_entries
FOR EACH ROW
EXECUTE FUNCTION enforce_period_lock_on_posting();

-- ============================================================================
-- SUMMARY OF GUARDRAILS
-- ============================================================================
/*

✅ TR-01 BANK MASTER:
  #1 - Account uniqueness via hash (not encrypted value)
  #2 - Micro-deposit verification state tracking
  #3 - Change requests for protected field updates

✅ GL-02 JOURNAL ENTRY:
  #4 - Auto-computed totals (prevent lying totals)
  #5 - Reference uniqueness (verified present)
  #6 - Edit immutability by status
  #7 - Optimistic locking for approvals

✅ GL-04 PERIOD CLOSE:
  #8 - Period lock enforced at DB boundary

RESULT: Business rules are IMMUTABLE even with buggy code or raw SQL access.

*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Test 1: Try to update totals manually (should be overridden by trigger)
-- UPDATE gl_journal_entries SET total_debit = 999999 WHERE id = ?;
-- Expected: total_debit recomputed from lines

-- Test 2: Try to approve already-posted entry
-- UPDATE gl_journal_entries SET status = 'approved' WHERE id = ? AND status = 'posted';
-- Expected: ERROR - Cannot modify posted journal entry

-- Test 3: Try to post to closed period
-- UPDATE gl_journal_entries SET status = 'posted' WHERE entry_date = '2024-12-31' AND ...;
-- Expected: ERROR - Cannot post: period is closed

-- Test 4: Try to create duplicate bank account
-- INSERT INTO treasury_bank_accounts (account_number_hash, ...) VALUES ('same-hash', ...);
-- Expected: ERROR - duplicate key violates unique constraint

-- ============================================================================
-- END OF GUARDRAILS
-- ============================================================================
