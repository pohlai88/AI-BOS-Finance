-- ============================================================================
-- FINANCE SCHEMA PERMISSION GRANTS
-- Purpose: Grant finance role access to finance schema, enforce cross-schema isolation
-- Migration: 103_grant_finance_permissions.sql
-- Schema: finance
-- ============================================================================

-- Finance role: finance schema ONLY
GRANT USAGE ON SCHEMA finance TO aibos_finance_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA finance TO aibos_finance_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA finance TO aibos_finance_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA finance 
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO aibos_finance_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA finance 
  GRANT USAGE, SELECT ON SEQUENCES TO aibos_finance_role;

-- Explicitly REVOKE cross-schema access (kernel cannot access finance)
REVOKE ALL ON SCHEMA finance FROM aibos_kernel_role;
REVOKE ALL ON ALL TABLES IN SCHEMA finance FROM aibos_kernel_role;

-- Explicitly REVOKE cross-schema access (finance cannot access kernel)
REVOKE ALL ON SCHEMA kernel FROM aibos_finance_role;
REVOKE ALL ON ALL TABLES IN SCHEMA kernel FROM aibos_finance_role;

COMMENT ON SCHEMA finance IS 'AI-BOS Finance Data Plane - Transactions, Ledger, Treasury (isolated from kernel)';
