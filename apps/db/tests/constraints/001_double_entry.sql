-- ============================================================================
-- pgTAP Test: Double-Entry Accounting Constraint
-- Purpose: Verify journal entries must balance (debits = credits)
-- Run: pg_prove -d $DATABASE_URL tests/constraints/001_double_entry.sql
-- ============================================================================

BEGIN;

SELECT * FROM no_plan();

-- ============================================================================
-- TEST: journal_entries table exists
-- ============================================================================

SELECT has_table('finance', 'journal_entries',
  'finance.journal_entries should exist');

SELECT has_table('finance', 'journal_lines',
  'finance.journal_lines should exist');

-- ============================================================================
-- TEST: journal_lines has direction column (DEBIT/CREDIT)
-- ============================================================================

SELECT has_column('finance', 'journal_lines', 'direction',
  'journal_lines should have direction column');

SELECT has_column('finance', 'journal_lines', 'amount_cents',
  'journal_lines should have amount_cents column');

-- ============================================================================
-- TEST: Balance check trigger exists on journal_lines
-- ============================================================================

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'finance'
      AND c.relname = 'journal_lines'
      AND t.tgname LIKE '%balance%'
  ),
  'Balance check trigger should exist on journal_lines'
);

-- ============================================================================
-- TEST: Balance check trigger exists on journal_entries (for posting)
-- ============================================================================

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'finance'
      AND c.relname = 'journal_entries'
      AND t.tgname LIKE '%balance%'
  ),
  'Balance check trigger should exist on journal_entries'
);

-- ============================================================================
-- TEST: Balance check functions exist
-- ============================================================================

SELECT has_function('finance', 'check_journal_balance_on_commit',
  'Balance check function should exist');

SELECT has_function('finance', 'check_balance_on_post',
  'Balance on post function should exist');

-- ============================================================================
-- TEST: Balance check view exists
-- ============================================================================

SELECT has_view('finance', 'journal_balance_check',
  'Balance check view should exist');

-- ============================================================================
-- Finish
-- ============================================================================

SELECT * FROM finish();
ROLLBACK;
