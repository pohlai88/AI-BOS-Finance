-- ============================================================================
-- SCHEMA PERMISSION GRANTS (Kernel Only)
-- Purpose: Grant kernel role access to kernel schema only
-- Note: Finance and config grants are in their respective schema migrations
-- Migration: 015_grant_schema_permissions.sql
-- Schema: kernel
-- ============================================================================

-- Kernel role: kernel schema ONLY
GRANT USAGE ON SCHEMA kernel TO aibos_kernel_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA kernel TO aibos_kernel_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA kernel TO aibos_kernel_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA kernel 
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO aibos_kernel_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA kernel 
  GRANT USAGE, SELECT ON SEQUENCES TO aibos_kernel_role;
