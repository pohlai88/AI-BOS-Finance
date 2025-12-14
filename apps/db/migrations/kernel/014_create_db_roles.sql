-- ============================================================================
-- DB ROLE SEPARATION
-- Purpose: Enforce hexagonal boundaries at database level
-- Migration: 014_create_db_roles.sql
-- Schema: kernel
-- ============================================================================

-- Create schema-specific roles
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'aibos_kernel_role') THEN
    CREATE ROLE aibos_kernel_role;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'aibos_finance_role') THEN
    CREATE ROLE aibos_finance_role;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'aibos_config_role') THEN
    CREATE ROLE aibos_config_role;
  END IF;
END
$$;

COMMENT ON ROLE aibos_kernel_role IS 'Kernel Control Plane - kernel schema only';
COMMENT ON ROLE aibos_finance_role IS 'Finance Cells - finance schema only';
COMMENT ON ROLE aibos_config_role IS 'Platform Config - config schema read-only';
