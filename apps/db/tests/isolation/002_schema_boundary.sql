-- ============================================================================
-- pgTAP Test: Schema Boundary Enforcement
-- Purpose: PROVE kernel cannot access finance, and vice versa
-- MVP CRITICAL: Database-level hexagonal architecture enforcement
-- Run: pg_prove -d $DATABASE_URL tests/isolation/002_schema_boundary.sql
-- ============================================================================

BEGIN;

SELECT plan(12);

-- ============================================================================
-- TEST 1: Verify roles exist (prerequisite)
-- ============================================================================

SELECT ok(
  EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'aibos_kernel_role'),
  'aibos_kernel_role should exist'
);

SELECT ok(
  EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'aibos_finance_role'),
  'aibos_finance_role should exist'
);

SELECT ok(
  EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'aibos_config_role'),
  'aibos_config_role should exist'
);

-- ============================================================================
-- TEST 2: Kernel role schema access
-- ============================================================================

SELECT ok(
  has_schema_privilege('aibos_kernel_role', 'kernel', 'USAGE'),
  'aibos_kernel_role should have USAGE on kernel schema'
);

SELECT ok(
  NOT has_schema_privilege('aibos_kernel_role', 'finance', 'USAGE'),
  'aibos_kernel_role should NOT have USAGE on finance schema'
);

-- ============================================================================
-- TEST 3: Finance role schema access
-- ============================================================================

SELECT ok(
  has_schema_privilege('aibos_finance_role', 'finance', 'USAGE'),
  'aibos_finance_role should have USAGE on finance schema'
);

SELECT ok(
  NOT has_schema_privilege('aibos_finance_role', 'kernel', 'USAGE'),
  'aibos_finance_role should NOT have USAGE on kernel schema'
);

-- ============================================================================
-- TEST 4: Config role is read-only
-- ============================================================================

SELECT ok(
  has_schema_privilege('aibos_config_role', 'config', 'USAGE'),
  'aibos_config_role should have USAGE on config schema'
);

-- Config role should only have SELECT (read-only)
-- We can't easily test INSERT/UPDATE/DELETE denial without actually connecting as the role

-- ============================================================================
-- TEST 5: Cross-schema read access (allowed for config)
-- Both kernel and finance roles can READ config (for provider profiles, etc.)
-- ============================================================================

SELECT ok(
  has_schema_privilege('aibos_kernel_role', 'config', 'USAGE'),
  'aibos_kernel_role should have USAGE on config schema (read-only access)'
);

SELECT ok(
  has_schema_privilege('aibos_finance_role', 'config', 'USAGE'),
  'aibos_finance_role should have USAGE on config schema (read-only access)'
);

-- ============================================================================
-- TEST 6: No PUBLIC access to schemas
-- ============================================================================

SELECT ok(
  NOT has_schema_privilege('public', 'kernel', 'CREATE'),
  'PUBLIC should NOT have CREATE on kernel schema'
);

SELECT ok(
  NOT has_schema_privilege('public', 'finance', 'CREATE'),
  'PUBLIC should NOT have CREATE on finance schema'
);

-- ============================================================================
-- Finish and Rollback
-- ============================================================================

SELECT * FROM finish();
ROLLBACK;
