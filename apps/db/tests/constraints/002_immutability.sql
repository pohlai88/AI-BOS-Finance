-- ============================================================================
-- pgTAP Test: Journal Immutability
-- Purpose: Verify posted journal entries cannot be modified or deleted
-- Run: pg_prove -d $DATABASE_URL tests/constraints/002_immutability.sql
-- ============================================================================

BEGIN;

SELECT * FROM no_plan();

-- ============================================================================
-- TEST: journal_entries table exists
-- ============================================================================

SELECT has_table('finance', 'journal_entries',
  'finance.journal_entries should exist');

-- ============================================================================
-- TEST: Status column exists for immutability tracking
-- ============================================================================

SELECT has_column('finance', 'journal_entries', 'status',
  'journal_entries should have status column');

SELECT has_column('finance', 'journal_entries', 'reversed_by',
  'journal_entries should have reversed_by column for tracking reversals');

-- ============================================================================
-- TEST: Immutability trigger exists on journal_entries
-- ============================================================================

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'finance'
      AND c.relname = 'journal_entries'
      AND t.tgname LIKE '%prevent%modification%'
  ),
  'Immutability trigger should exist on journal_entries'
);

-- ============================================================================
-- TEST: Immutability trigger exists on journal_lines
-- ============================================================================

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'finance'
      AND c.relname = 'journal_lines'
      AND t.tgname LIKE '%prevent%modification%'
  ),
  'Immutability trigger should exist on journal_lines'
);

-- ============================================================================
-- TEST: Immutability functions exist
-- ============================================================================

SELECT has_function('finance', 'prevent_posted_journal_modification',
  'prevent_posted_journal_modification function should exist');

SELECT has_function('finance', 'prevent_posted_journal_line_modification',
  'prevent_posted_journal_line_modification function should exist');

-- ============================================================================
-- TEST: Reversal helper function exists
-- ============================================================================

SELECT has_function('finance', 'reverse_journal_entry',
  'reverse_journal_entry helper function should exist');

-- ============================================================================
-- Finish
-- ============================================================================

SELECT * FROM finish();
ROLLBACK;
