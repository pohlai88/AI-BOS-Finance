-- ============================================================================
-- JOURNAL IMMUTABILITY CONSTRAINT
-- Migration: 102_journal_immutability.sql
-- Schema: finance
-- MVP Task: #6 - Journal Immutability
-- 
-- Purpose: Prevent modification or deletion of POSTED journal entries
-- This is a fundamental accounting principle - the audit trail must be immutable.
-- Corrections are made via reversing entries, not by editing.
-- ============================================================================

-- 1. Create immutability check function for journal_entries
-- ============================================================================
CREATE OR REPLACE FUNCTION finance.prevent_posted_journal_modification()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent UPDATE of posted entries (except for reversal)
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'POSTED' THEN
      -- Allow only status change to REVERSED
      IF NEW.status = 'REVERSED' AND OLD.status = 'POSTED' THEN
        -- This is allowed - it's a reversal
        RETURN NEW;
      END IF;
      
      -- Check if anything else changed
      IF NEW.reference IS DISTINCT FROM OLD.reference OR
         NEW.description IS DISTINCT FROM OLD.description OR
         NEW.posting_date IS DISTINCT FROM OLD.posting_date OR
         NEW.company_id IS DISTINCT FROM OLD.company_id OR
         NEW.tenant_id IS DISTINCT FROM OLD.tenant_id OR
         NEW.transaction_id IS DISTINCT FROM OLD.transaction_id THEN
        RAISE EXCEPTION 'Cannot modify POSTED journal entry %. Use reversal instead.',
          OLD.id
          USING ERRCODE = 'P0001';
      END IF;
    END IF;
  END IF;

  -- Prevent DELETE of posted entries
  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'POSTED' THEN
      RAISE EXCEPTION 'Cannot delete POSTED journal entry %. Use reversal instead.',
        OLD.id
        USING ERRCODE = 'P0001';
    END IF;
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION finance.prevent_posted_journal_modification() IS 
  'Enforces immutability of posted journal entries - corrections via reversal only';

-- 2. Create trigger on journal_entries
-- ============================================================================
DROP TRIGGER IF EXISTS trg_prevent_journal_modification ON finance.journal_entries;

CREATE TRIGGER trg_prevent_journal_modification
  BEFORE UPDATE OR DELETE ON finance.journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION finance.prevent_posted_journal_modification();

-- 3. Create immutability check function for journal_lines
-- ============================================================================
CREATE OR REPLACE FUNCTION finance.prevent_posted_journal_line_modification()
RETURNS TRIGGER AS $$
DECLARE
  v_journal_status TEXT;
BEGIN
  -- Get parent journal entry status
  IF TG_OP = 'DELETE' THEN
    SELECT status INTO v_journal_status
    FROM finance.journal_entries
    WHERE id = OLD.journal_entry_id;
  ELSE
    SELECT status INTO v_journal_status
    FROM finance.journal_entries
    WHERE id = COALESCE(NEW.journal_entry_id, OLD.journal_entry_id);
  END IF;

  -- If parent is POSTED, prevent any modification
  IF v_journal_status = 'POSTED' THEN
    IF TG_OP = 'UPDATE' THEN
      RAISE EXCEPTION 'Cannot modify line in POSTED journal entry. Use reversal instead.'
        USING ERRCODE = 'P0001';
    ELSIF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'Cannot delete line from POSTED journal entry. Use reversal instead.'
        USING ERRCODE = 'P0001';
    ELSIF TG_OP = 'INSERT' THEN
      RAISE EXCEPTION 'Cannot add lines to POSTED journal entry. Use reversal instead.'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION finance.prevent_posted_journal_line_modification() IS 
  'Enforces immutability of journal lines when parent entry is posted';

-- 4. Create trigger on journal_lines
-- ============================================================================
DROP TRIGGER IF EXISTS trg_prevent_journal_line_modification ON finance.journal_lines;

CREATE TRIGGER trg_prevent_journal_line_modification
  BEFORE INSERT OR UPDATE OR DELETE ON finance.journal_lines
  FOR EACH ROW
  EXECUTE FUNCTION finance.prevent_posted_journal_line_modification();

-- 5. Create reversal helper function
-- ============================================================================
CREATE OR REPLACE FUNCTION finance.reverse_journal_entry(
  p_journal_id UUID,
  p_reversal_date DATE,
  p_reversal_reference TEXT,
  p_created_by UUID
)
RETURNS UUID AS $$
DECLARE
  v_original RECORD;
  v_new_journal_id UUID;
BEGIN
  -- Get original journal entry
  SELECT * INTO v_original
  FROM finance.journal_entries
  WHERE id = p_journal_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Journal entry % not found', p_journal_id;
  END IF;

  IF v_original.status != 'POSTED' THEN
    RAISE EXCEPTION 'Can only reverse POSTED journal entries (current status: %)', v_original.status;
  END IF;

  IF v_original.reversed_by IS NOT NULL THEN
    RAISE EXCEPTION 'Journal entry % has already been reversed by %', p_journal_id, v_original.reversed_by;
  END IF;

  -- Create reversing entry
  INSERT INTO finance.journal_entries (
    tenant_id,
    company_id,
    transaction_id,
    correlation_id,
    posted_at,
    posting_date,
    reference,
    description,
    status,
    created_by
  ) VALUES (
    v_original.tenant_id,
    v_original.company_id,
    v_original.transaction_id,
    v_original.correlation_id,
    NOW(),
    p_reversal_date,
    p_reversal_reference,
    'Reversal of: ' || COALESCE(v_original.reference, v_original.id::TEXT),
    'DRAFT',  -- Start as DRAFT, caller posts after adding lines
    p_created_by
  ) RETURNING id INTO v_new_journal_id;

  -- Create reversing lines (swap DEBIT/CREDIT)
  INSERT INTO finance.journal_lines (
    journal_entry_id,
    account_id,
    direction,
    amount_cents,
    currency,
    line_description
  )
  SELECT 
    v_new_journal_id,
    account_id,
    CASE WHEN direction = 'DEBIT' THEN 'CREDIT' ELSE 'DEBIT' END,
    amount_cents,
    currency,
    'Reversal: ' || COALESCE(line_description, '')
  FROM finance.journal_lines
  WHERE journal_entry_id = p_journal_id;

  -- Mark original as reversed (allowed by trigger)
  UPDATE finance.journal_entries
  SET 
    status = 'REVERSED',
    reversed_by = v_new_journal_id
  WHERE id = p_journal_id;

  -- Post the reversal
  UPDATE finance.journal_entries
  SET status = 'POSTED'
  WHERE id = v_new_journal_id;

  RETURN v_new_journal_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION finance.reverse_journal_entry IS 
  'Create a reversing journal entry for a posted entry. Returns the new reversal entry ID.';

-- 6. Create audit trigger for immutability attempts
-- ============================================================================
CREATE OR REPLACE FUNCTION finance.log_immutability_violation()
RETURNS TRIGGER AS $$
BEGIN
  -- This would log to an audit table if one exists
  -- For now, just raise a warning
  RAISE WARNING 'Immutability violation attempt on % by operation %', 
    TG_TABLE_NAME, TG_OP;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
