-- ============================================================================
-- SCHEMA PERMISSION GRANTS
-- Purpose: Enforce "no cross-schema access" at database level
-- Migration: 015_grant_schema_permissions.sql
-- Schema: kernel
-- ============================================================================

-- Kernel role: kernel schema ONLY
GRANT USAGE ON SCHEMA kernel TO aibos_kernel_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA kernel TO aibos_kernel_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA kernel 
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO aibos_kernel_role;

-- Explicitly REVOKE cross-schema access
REVOKE ALL ON SCHEMA finance FROM aibos_kernel_role;
REVOKE ALL ON ALL TABLES IN SCHEMA finance FROM aibos_kernel_role;

-- Finance role: finance schema ONLY
GRANT USAGE ON SCHEMA finance TO aibos_finance_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA finance TO aibos_finance_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA finance 
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO aibos_finance_role;

-- Explicitly REVOKE cross-schema access
REVOKE ALL ON SCHEMA kernel FROM aibos_finance_role;
REVOKE ALL ON ALL TABLES IN SCHEMA kernel FROM aibos_finance_role;

-- Config role: config schema READ-ONLY
GRANT USAGE ON SCHEMA config TO aibos_config_role;
GRANT SELECT ON ALL TABLES IN SCHEMA config TO aibos_config_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA config 
  GRANT SELECT ON TABLES TO aibos_config_role;

-- Both kernel and finance can READ config (for provider profiles, etc.)
GRANT USAGE ON SCHEMA config TO aibos_kernel_role;
GRANT SELECT ON ALL TABLES IN SCHEMA config TO aibos_kernel_role;
GRANT USAGE ON SCHEMA config TO aibos_finance_role;
GRANT SELECT ON ALL TABLES IN SCHEMA config TO aibos_finance_role;
