-- ============================================================================
-- pgTAP Test: Schema Existence
-- Purpose: Verify core schemas are created
-- Run: pg_prove -d $DATABASE_URL tests/schema/001_schemas_exist.sql
-- ============================================================================

BEGIN;

-- Load pgTAP
SELECT * FROM no_plan();

-- ============================================================================
-- TEST: Core schemas exist
-- ============================================================================

SELECT has_schema('kernel', 'Kernel schema should exist');
SELECT has_schema('finance', 'Finance schema should exist');
SELECT has_schema('config', 'Config schema should exist');

-- ============================================================================
-- TEST: Core tables exist in kernel schema
-- ============================================================================

SELECT has_table('kernel', 'tenants', 'kernel.tenants should exist');
SELECT has_table('kernel', 'users', 'kernel.users should exist');

-- ============================================================================
-- TEST: Core tables exist in finance schema
-- ============================================================================

SELECT has_table('finance', 'companies', 'finance.companies should exist');
SELECT has_table('finance', 'accounts', 'finance.accounts should exist');

-- ============================================================================
-- TEST: Primary keys exist
-- ============================================================================

SELECT has_pk('kernel', 'tenants', 'tenants should have primary key');
SELECT has_pk('kernel', 'users', 'users should have primary key');
SELECT has_pk('finance', 'companies', 'companies should have primary key');

-- ============================================================================
-- Finish
-- ============================================================================

SELECT * FROM finish();
ROLLBACK;
