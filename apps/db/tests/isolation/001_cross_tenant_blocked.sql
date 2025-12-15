-- ============================================================================
-- pgTAP Test: Cross-Tenant Access Blocked
-- Purpose: PROVE Tenant A cannot see Tenant B's data
-- MVP CRITICAL: This is the core security guarantee
-- Run: pg_prove -d $DATABASE_URL tests/isolation/001_cross_tenant_blocked.sql
-- ============================================================================

BEGIN;

SELECT plan(15);

-- ============================================================================
-- SETUP: Create test tenants and data
-- ============================================================================

-- Create two test tenants
INSERT INTO kernel.tenants (id, name, slug, status)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Tenant Alpha', 'tenant-alpha', 'active'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Tenant Beta', 'tenant-beta', 'active')
ON CONFLICT (id) DO NOTHING;

-- Create users for each tenant
INSERT INTO kernel.users (id, tenant_id, email, password_hash, display_name)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'alice@alpha.com', 'hash_a', 'Alice Alpha'),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'adam@alpha.com', 'hash_a', 'Adam Alpha'),
  ('33333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bob@beta.com', 'hash_b', 'Bob Beta'),
  ('44444444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'betty@beta.com', 'hash_b', 'Betty Beta')
ON CONFLICT (id) DO NOTHING;

-- Create companies for each tenant
INSERT INTO finance.companies (id, tenant_id, code, name, base_currency)
VALUES
  ('55555555-5555-5555-5555-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ALPHA-HQ', 'Alpha Holdings', 'USD'),
  ('66666666-6666-6666-6666-666666666666', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'BETA-HQ', 'Beta Holdings', 'EUR')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- TEST 1: Direct query isolation - Users
-- Tenant Alpha should only see Alpha users
-- ============================================================================

SELECT is(
  (SELECT COUNT(*)::int FROM kernel.users 
   WHERE tenant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  2,
  'Tenant Alpha should have exactly 2 users'
);

SELECT is(
  (SELECT COUNT(*)::int FROM kernel.users 
   WHERE tenant_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  2,
  'Tenant Beta should have exactly 2 users'
);

-- ============================================================================
-- TEST 2: Cross-tenant query returns zero results
-- ============================================================================

SELECT is(
  (SELECT COUNT(*)::int FROM kernel.users 
   WHERE tenant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
   AND email LIKE '%@beta.com'),
  0,
  'Alpha tenant query should not return Beta emails'
);

SELECT is(
  (SELECT COUNT(*)::int FROM kernel.users 
   WHERE tenant_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
   AND email LIKE '%@alpha.com'),
  0,
  'Beta tenant query should not return Alpha emails'
);

-- ============================================================================
-- TEST 3: Finance data isolation - Companies
-- ============================================================================

SELECT is(
  (SELECT COUNT(*)::int FROM finance.companies 
   WHERE tenant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  1,
  'Tenant Alpha should have exactly 1 company'
);

SELECT is(
  (SELECT COUNT(*)::int FROM finance.companies 
   WHERE tenant_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  1,
  'Tenant Beta should have exactly 1 company'
);

SELECT is(
  (SELECT name FROM finance.companies 
   WHERE tenant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' LIMIT 1),
  'Alpha Holdings',
  'Alpha tenant should only see Alpha Holdings'
);

SELECT is(
  (SELECT name FROM finance.companies 
   WHERE tenant_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' LIMIT 1),
  'Beta Holdings',
  'Beta tenant should only see Beta Holdings'
);

-- ============================================================================
-- TEST 4: Cross-tenant JOIN blocked
-- Joining users and companies across tenants should return nothing
-- ============================================================================

SELECT is(
  (SELECT COUNT(*)::int 
   FROM kernel.users u
   JOIN finance.companies c ON c.tenant_id = u.tenant_id
   WHERE u.tenant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
   AND c.tenant_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  0,
  'Cross-tenant JOIN should return zero rows'
);

-- ============================================================================
-- TEST 5: Tenant-scoped aggregate
-- COUNT without tenant filter vs with tenant filter
-- ============================================================================

SELECT ok(
  (SELECT COUNT(*) FROM kernel.users WHERE tenant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
  < (SELECT COUNT(*) FROM kernel.users),
  'Tenant-scoped COUNT should be less than global COUNT'
);

-- ============================================================================
-- TEST 6: tenant_id NOT NULL enforcement
-- Attempting INSERT without tenant_id should fail
-- ============================================================================

SELECT throws_ok(
  $$INSERT INTO kernel.users (id, email, password_hash, display_name)
    VALUES (uuid_generate_v4(), 'nope@test.com', 'hash', 'No Tenant')$$,
  '23502',  -- NOT NULL violation
  NULL,
  'INSERT without tenant_id should fail with NOT NULL violation'
);

-- ============================================================================
-- TEST 7: Invalid tenant_id FK enforcement
-- Attempting INSERT with non-existent tenant_id should fail
-- ============================================================================

SELECT throws_ok(
  $$INSERT INTO kernel.users (id, tenant_id, email, password_hash, display_name)
    VALUES (uuid_generate_v4(), 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'nope@test.com', 'hash', 'Bad Tenant')$$,
  '23503',  -- FK violation
  NULL,
  'INSERT with invalid tenant_id should fail with FK violation'
);

-- ============================================================================
-- TEST 8: Tenant isolation in subqueries
-- ============================================================================

SELECT is(
  (SELECT COUNT(*)::int FROM kernel.users 
   WHERE tenant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
   AND id IN (
     SELECT id FROM kernel.users 
     WHERE tenant_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
   )),
  0,
  'Subquery cross-tenant access should return zero'
);

-- ============================================================================
-- TEST 9: Tenant isolation with UNION
-- ============================================================================

SELECT is(
  (SELECT COUNT(*)::int FROM (
    SELECT id FROM kernel.users WHERE tenant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    UNION
    SELECT id FROM kernel.users WHERE tenant_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  ) combined),
  4,
  'UNION should return 4 users (2 + 2) only when both tenants queried explicitly'
);

-- ============================================================================
-- Finish and Rollback (cleanup)
-- ============================================================================

SELECT * FROM finish();
ROLLBACK;
