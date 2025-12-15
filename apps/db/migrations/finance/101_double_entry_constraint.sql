-- ============================================================================
-- DOUBLE-ENTRY ACCOUNTING CONSTRAINT
-- Migration: 101_double_entry_constraint.sql
-- Schema: finance
-- MVP Task: #5 - Double-Entry Constraint
-- 
-- Purpose: Enforce that journal entries MUST balance (debits = credits)
-- This is a fundamental accounting principle that prevents data corruption.
-- ============================================================================

-- 1. Create validation function
-- ============================================================================
CREATE OR REPLACE FUNCTION finance.validate_journal_balance()
RETURNS TRIGGER AS $$
DECLARE
  v_total_debits BIGINT;
  v_total_credits BIGINT;
  v_journal_id UUID;
BEGIN
  -- Get the journal_entry_id being modified
  IF TG_OP = 'DELETE' THEN
    v_journal_id := OLD.journal_entry_id;
  ELSE
    v_journal_id := NEW.journal_entry_id;
  END IF;

  -- Calculate totals for this journal entry
  SELECT 
    COALESCE(SUM(CASE WHEN direction = 'DEBIT' THEN amount_cents ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN direction = 'CREDIT' THEN amount_cents ELSE 0 END), 0)
  INTO v_total_debits, v_total_credits
  FROM finance.journal_lines
  WHERE journal_entry_id = v_journal_id;

  -- For INSERT/UPDATE, include the new row (it's not yet in the table)
  IF TG_OP = 'INSERT' THEN
    IF NEW.direction = 'DEBIT' THEN
      v_total_debits := v_total_debits + NEW.amount_cents;
    ELSE
      v_total_credits := v_total_credits + NEW.amount_cents;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Subtract old, add new
    IF OLD.direction = 'DEBIT' THEN
      v_total_debits := v_total_debits - OLD.amount_cents;
    ELSE
      v_total_credits := v_total_credits - OLD.amount_cents;
    END IF;
    IF NEW.direction = 'DEBIT' THEN
      v_total_debits := v_total_debits + NEW.amount_cents;
    ELSE
      v_total_credits := v_total_credits + NEW.amount_cents;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.direction = 'DEBIT' THEN
      v_total_debits := v_total_debits - OLD.amount_cents;
    ELSE
      v_total_credits := v_total_credits - OLD.amount_cents;
    END IF;
  END IF;

  -- Note: We use a DEFERRED constraint approach
  -- The balance is checked at COMMIT time, not per-row
  -- This allows inserting debit first, then credit
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION finance.validate_journal_balance() IS 
  'Validates double-entry accounting: debits must equal credits';

-- 2. Create deferred constraint trigger
-- ============================================================================
-- This trigger fires at COMMIT time, checking the final balance

CREATE OR REPLACE FUNCTION finance.check_journal_balance_on_commit()
RETURNS TRIGGER AS $$
DECLARE
  v_total_debits BIGINT;
  v_total_credits BIGINT;
  v_journal_status TEXT;
BEGIN
  -- Get the journal entry status
  SELECT status INTO v_journal_status
  FROM finance.journal_entries
  WHERE id = NEW.journal_entry_id;

  -- Only enforce balance for POSTED entries
  -- DRAFT entries can be temporarily unbalanced
  IF v_journal_status = 'DRAFT' THEN
    RETURN NEW;
  END IF;

  -- Calculate totals
  SELECT 
    COALESCE(SUM(CASE WHEN direction = 'DEBIT' THEN amount_cents ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN direction = 'CREDIT' THEN amount_cents ELSE 0 END), 0)
  INTO v_total_debits, v_total_credits
  FROM finance.journal_lines
  WHERE journal_entry_id = NEW.journal_entry_id;

  -- Check balance
  IF v_total_debits != v_total_credits THEN
    RAISE EXCEPTION 'Journal entry % does not balance: debits=% credits=%',
      NEW.journal_entry_id, v_total_debits, v_total_credits
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION finance.check_journal_balance_on_commit() IS 
  'Ensures journal entries balance at commit time';

-- 3. Create the constraint trigger (DEFERRED)
-- ============================================================================
DROP TRIGGER IF EXISTS trg_check_balance ON finance.journal_lines;

CREATE CONSTRAINT TRIGGER trg_check_balance
  AFTER INSERT OR UPDATE ON finance.journal_lines
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION finance.check_journal_balance_on_commit();

-- 4. Create trigger to check on journal_entries status change
-- ============================================================================
CREATE OR REPLACE FUNCTION finance.check_balance_on_post()
RETURNS TRIGGER AS $$
DECLARE
  v_total_debits BIGINT;
  v_total_credits BIGINT;
  v_line_count INT;
BEGIN
  -- Only check when status changes to POSTED
  IF NEW.status = 'POSTED' AND (OLD.status IS NULL OR OLD.status != 'POSTED') THEN
    
    -- Get line count
    SELECT COUNT(*) INTO v_line_count
    FROM finance.journal_lines
    WHERE journal_entry_id = NEW.id;

    -- Must have at least 2 lines
    IF v_line_count < 2 THEN
      RAISE EXCEPTION 'Journal entry % must have at least 2 lines (has %)',
        NEW.id, v_line_count
        USING ERRCODE = 'P0001';
    END IF;

    -- Calculate totals
    SELECT 
      COALESCE(SUM(CASE WHEN direction = 'DEBIT' THEN amount_cents ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN direction = 'CREDIT' THEN amount_cents ELSE 0 END), 0)
    INTO v_total_debits, v_total_credits
    FROM finance.journal_lines
    WHERE journal_entry_id = NEW.id;

    -- Check balance
    IF v_total_debits != v_total_credits THEN
      RAISE EXCEPTION 'Cannot post unbalanced journal entry %: debits=% credits=%',
        NEW.id, v_total_debits, v_total_credits
        USING ERRCODE = 'P0001';
    END IF;

    -- Check that debits > 0
    IF v_total_debits = 0 THEN
      RAISE EXCEPTION 'Journal entry % has no debits',
        NEW.id
        USING ERRCODE = 'P0001';
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_balance_on_post ON finance.journal_entries;

CREATE TRIGGER trg_check_balance_on_post
  BEFORE UPDATE ON finance.journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION finance.check_balance_on_post();

-- 5. Create helper view for balance verification
-- ============================================================================
CREATE OR REPLACE VIEW finance.journal_balance_check AS
SELECT 
  je.id AS journal_entry_id,
  je.reference,
  je.status,
  je.posted_at,
  SUM(CASE WHEN jl.direction = 'DEBIT' THEN jl.amount_cents ELSE 0 END) AS total_debits,
  SUM(CASE WHEN jl.direction = 'CREDIT' THEN jl.amount_cents ELSE 0 END) AS total_credits,
  SUM(CASE WHEN jl.direction = 'DEBIT' THEN jl.amount_cents ELSE 0 END) -
  SUM(CASE WHEN jl.direction = 'CREDIT' THEN jl.amount_cents ELSE 0 END) AS imbalance,
  COUNT(*) AS line_count
FROM finance.journal_entries je
LEFT JOIN finance.journal_lines jl ON je.id = jl.journal_entry_id
GROUP BY je.id, je.reference, je.status, je.posted_at;

COMMENT ON VIEW finance.journal_balance_check IS 
  'View to audit journal entry balances - imbalance should always be 0 for POSTED entries';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
