-- ============================================================================
-- pgTAP Test: Database Roles
-- Purpose: Verify schema-specific roles are created (Task 1 & 2)
-- Run: pg_prove -d $DATABASE_URL tests/schema/003_roles_exist.sql
-- ============================================================================

BEGIN;

SELECT * FROM no_plan();

-- ============================================================================
-- TEST: AI-BOS roles exist
-- ============================================================================

SELECT has_role('aibos_kernel_role', 
  'aibos_kernel_role should exist');

SELECT has_role('aibos_finance_role', 
  'aibos_finance_role should exist');

SELECT has_role('aibos_config_role', 
  'aibos_config_role should exist');

-- ============================================================================
-- TEST: Roles are not superusers
-- ============================================================================

SELECT isnt(
  (SELECT rolsuper FROM pg_roles WHERE rolname = 'aibos_kernel_role'),
  true,
  'aibos_kernel_role should NOT be superuser'
);

SELECT isnt(
  (SELECT rolsuper FROM pg_roles WHERE rolname = 'aibos_finance_role'),
  true,
  'aibos_finance_role should NOT be superuser'
);

-- ============================================================================
-- TEST: Roles cannot login directly
-- ============================================================================

SELECT isnt(
  (SELECT rolcanlogin FROM pg_roles WHERE rolname = 'aibos_kernel_role'),
  true,
  'aibos_kernel_role should NOT have login capability'
);

SELECT isnt(
  (SELECT rolcanlogin FROM pg_roles WHERE rolname = 'aibos_finance_role'),
  true,
  'aibos_finance_role should NOT have login capability'
);

-- ============================================================================
-- TEST: Schema permissions (cross-schema access blocked)
-- ============================================================================

-- Kernel role should NOT have access to finance schema
SELECT isnt(
  has_schema_privilege('aibos_kernel_role', 'finance', 'USAGE'),
  true,
  'aibos_kernel_role should NOT have USAGE on finance schema'
);

-- Finance role should NOT have access to kernel schema
SELECT isnt(
  has_schema_privilege('aibos_finance_role', 'kernel', 'USAGE'),
  true,
  'aibos_finance_role should NOT have USAGE on kernel schema'
);

-- ============================================================================
-- TEST: Config read access for all roles
-- ============================================================================

SELECT ok(
  has_schema_privilege('aibos_kernel_role', 'config', 'USAGE'),
  'aibos_kernel_role should have USAGE on config schema'
);

SELECT ok(
  has_schema_privilege('aibos_finance_role', 'config', 'USAGE'),
  'aibos_finance_role should have USAGE on config schema'
);

-- ============================================================================
-- Finish
-- ============================================================================

SELECT * FROM finish();
ROLLBACK;
