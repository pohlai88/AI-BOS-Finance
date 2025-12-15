-- ============================================================================
-- pgTAP Test: Tenant Isolation Columns
-- Purpose: Verify all multi-tenant tables have tenant_id
-- Run: pg_prove -d $DATABASE_URL tests/schema/002_tenant_isolation_columns.sql
-- ============================================================================

BEGIN;

SELECT * FROM no_plan();

-- ============================================================================
-- TEST: Kernel tables have tenant_id
-- ============================================================================

SELECT has_column('kernel', 'users', 'tenant_id', 
  'kernel.users should have tenant_id column');

SELECT col_not_null('kernel', 'users', 'tenant_id',
  'kernel.users.tenant_id should be NOT NULL');

SELECT col_type_is('kernel', 'users', 'tenant_id', 'uuid',
  'kernel.users.tenant_id should be UUID type');

-- ============================================================================
-- TEST: Finance tables have tenant_id
-- ============================================================================

SELECT has_column('finance', 'companies', 'tenant_id',
  'finance.companies should have tenant_id column');

SELECT col_not_null('finance', 'companies', 'tenant_id',
  'finance.companies.tenant_id should be NOT NULL');

SELECT has_column('finance', 'accounts', 'tenant_id',
  'finance.accounts should have tenant_id column');

SELECT col_not_null('finance', 'accounts', 'tenant_id',
  'finance.accounts.tenant_id should be NOT NULL');

-- ============================================================================
-- TEST: Foreign key to tenants exists
-- ============================================================================

SELECT has_fk('kernel', 'users',
  'kernel.users should have foreign key (to tenants)');

SELECT has_fk('finance', 'companies',
  'finance.companies should have foreign key (to tenants)');

-- ============================================================================
-- Finish
-- ============================================================================

SELECT * FROM finish();
ROLLBACK;
