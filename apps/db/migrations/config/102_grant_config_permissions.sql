-- ============================================================================
-- CONFIG SCHEMA PERMISSION GRANTS
-- Purpose: Config role gets read-only, kernel and finance can read config
-- Migration: 102_grant_config_permissions.sql
-- Schema: config
-- ============================================================================

-- Config role: config schema READ-ONLY
GRANT USAGE ON SCHEMA config TO aibos_config_role;
GRANT SELECT ON ALL TABLES IN SCHEMA config TO aibos_config_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA config 
  GRANT SELECT ON TABLES TO aibos_config_role;

-- Kernel role can READ config (for provider profiles, etc.)
GRANT USAGE ON SCHEMA config TO aibos_kernel_role;
GRANT SELECT ON ALL TABLES IN SCHEMA config TO aibos_kernel_role;

-- Finance role can READ config (for provider profiles, etc.)
GRANT USAGE ON SCHEMA config TO aibos_finance_role;
GRANT SELECT ON ALL TABLES IN SCHEMA config TO aibos_finance_role;

COMMENT ON SCHEMA config IS 'AI-BOS Platform Configuration - Read by all, write by config role only';
