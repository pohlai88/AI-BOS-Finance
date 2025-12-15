-- ============================================================================
-- GOVERNANCE OBSERVABILITY CONTRACT
-- Migration: 016_governance_views.sql
-- Schema: kernel
-- Purpose: Provide stable, read-only views for external monitoring tools
-- 
-- These views are the "observability contract" - they expose governance
-- metrics without requiring custom SQL from Metabase/Grafana/pgAdmin.
-- ============================================================================

-- ============================================================================
-- 1. CREATE MONITORING ROLE (Read-Only)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'aibos_monitor_role') THEN
    CREATE ROLE aibos_monitor_role NOLOGIN;
  END IF;
END
$$;

COMMENT ON ROLE aibos_monitor_role IS 
  'Read-only monitoring role for external tools (Metabase, Grafana, pgAdmin)';

-- Grant schema usage
GRANT USAGE ON SCHEMA kernel TO aibos_monitor_role;
GRANT USAGE ON SCHEMA finance TO aibos_monitor_role;
GRANT USAGE ON SCHEMA config TO aibos_monitor_role;

-- ============================================================================
-- 2. TENANT HEALTH VIEW
-- ============================================================================

CREATE OR REPLACE VIEW kernel.v_tenant_health AS
WITH tenant_stats AS (
  SELECT 
    t.id AS tenant_id,
    t.name AS tenant_name,
    t.status AS tenant_status,
    (SELECT COUNT(*) FROM kernel.users u WHERE u.tenant_id = t.id) AS user_count,
    (SELECT COUNT(*) FROM kernel.sessions s 
     WHERE s.user_id IN (SELECT id FROM kernel.users WHERE tenant_id = t.id)
     AND s.expires_at > NOW()) AS active_sessions,
    (SELECT COUNT(*) FROM kernel.audit_events ae WHERE ae.tenant_id = t.id) AS audit_event_count
  FROM kernel.tenants t
),
finance_stats AS (
  SELECT 
    t.id AS tenant_id,
    (SELECT COUNT(*) FROM finance.companies c WHERE c.tenant_id = t.id) AS company_count,
    (SELECT COUNT(*) FROM finance.journal_entries je WHERE je.tenant_id = t.id) AS journal_count,
    (SELECT COUNT(*) FROM finance.journal_entries je 
     WHERE je.tenant_id = t.id AND je.status = 'POSTED') AS posted_journal_count,
    (SELECT COUNT(*) FROM finance.transactions tx WHERE tx.tenant_id = t.id) AS transaction_count
  FROM kernel.tenants t
)
SELECT 
  ts.tenant_id,
  ts.tenant_name,
  ts.tenant_status,
  ts.user_count,
  ts.active_sessions,
  ts.audit_event_count,
  COALESCE(fs.company_count, 0) AS company_count,
  COALESCE(fs.journal_count, 0) AS journal_count,
  COALESCE(fs.posted_journal_count, 0) AS posted_journal_count,
  COALESCE(fs.transaction_count, 0) AS transaction_count,
  -- Health score (simple heuristic)
  CASE 
    WHEN ts.tenant_status != 'active' THEN 'INACTIVE'
    WHEN ts.user_count = 0 THEN 'NO_USERS'
    ELSE 'HEALTHY'
  END AS health_status,
  NOW() AS checked_at
FROM tenant_stats ts
LEFT JOIN finance_stats fs ON ts.tenant_id = fs.tenant_id;

COMMENT ON VIEW kernel.v_tenant_health IS 
  'Governance view: Tenant health metrics for monitoring dashboards';

GRANT SELECT ON kernel.v_tenant_health TO aibos_monitor_role;

-- ============================================================================
-- 3. JOURNAL INTEGRITY VIEW
-- ============================================================================

CREATE OR REPLACE VIEW finance.v_journal_integrity AS
SELECT 
  je.tenant_id,
  je.id AS journal_entry_id,
  je.reference,
  je.status,
  je.posted_at,
  COALESCE(SUM(CASE WHEN jl.direction = 'DEBIT' THEN jl.amount_cents ELSE 0 END), 0) AS total_debits,
  COALESCE(SUM(CASE WHEN jl.direction = 'CREDIT' THEN jl.amount_cents ELSE 0 END), 0) AS total_credits,
  COALESCE(SUM(CASE WHEN jl.direction = 'DEBIT' THEN jl.amount_cents ELSE 0 END), 0) -
  COALESCE(SUM(CASE WHEN jl.direction = 'CREDIT' THEN jl.amount_cents ELSE 0 END), 0) AS imbalance,
  COUNT(jl.id) AS line_count,
  CASE 
    WHEN COALESCE(SUM(CASE WHEN jl.direction = 'DEBIT' THEN jl.amount_cents ELSE 0 END), 0) =
         COALESCE(SUM(CASE WHEN jl.direction = 'CREDIT' THEN jl.amount_cents ELSE 0 END), 0) 
    THEN 'BALANCED'
    ELSE 'IMBALANCED'
  END AS balance_status,
  CASE 
    WHEN je.status = 'POSTED' AND 
         COALESCE(SUM(CASE WHEN jl.direction = 'DEBIT' THEN jl.amount_cents ELSE 0 END), 0) !=
         COALESCE(SUM(CASE WHEN jl.direction = 'CREDIT' THEN jl.amount_cents ELSE 0 END), 0)
    THEN 'CRITICAL_VIOLATION'
    WHEN je.status = 'DRAFT' AND
         COALESCE(SUM(CASE WHEN jl.direction = 'DEBIT' THEN jl.amount_cents ELSE 0 END), 0) !=
         COALESCE(SUM(CASE WHEN jl.direction = 'CREDIT' THEN jl.amount_cents ELSE 0 END), 0)
    THEN 'DRAFT_IMBALANCED'
    ELSE 'OK'
  END AS integrity_status
FROM finance.journal_entries je
LEFT JOIN finance.journal_lines jl ON je.id = jl.journal_entry_id
GROUP BY je.id, je.tenant_id, je.reference, je.status, je.posted_at;

COMMENT ON VIEW finance.v_journal_integrity IS 
  'Governance view: Double-entry integrity check for all journal entries';

GRANT SELECT ON finance.v_journal_integrity TO aibos_monitor_role;

-- ============================================================================
-- 4. JOURNAL INTEGRITY SUMMARY VIEW
-- ============================================================================

CREATE OR REPLACE VIEW finance.v_journal_integrity_summary AS
SELECT 
  tenant_id,
  COUNT(*) AS total_journals,
  COUNT(*) FILTER (WHERE status = 'POSTED') AS posted_count,
  COUNT(*) FILTER (WHERE status = 'DRAFT') AS draft_count,
  COUNT(*) FILTER (WHERE status = 'REVERSED') AS reversed_count,
  COUNT(*) FILTER (WHERE balance_status = 'BALANCED') AS balanced_count,
  COUNT(*) FILTER (WHERE balance_status = 'IMBALANCED') AS imbalanced_count,
  COUNT(*) FILTER (WHERE integrity_status = 'CRITICAL_VIOLATION') AS critical_violations,
  CASE 
    WHEN COUNT(*) FILTER (WHERE integrity_status = 'CRITICAL_VIOLATION') > 0 THEN 'CRITICAL'
    WHEN COUNT(*) FILTER (WHERE balance_status = 'IMBALANCED') > 0 THEN 'WARNING'
    ELSE 'HEALTHY'
  END AS overall_status,
  NOW() AS checked_at
FROM finance.v_journal_integrity
GROUP BY tenant_id;

COMMENT ON VIEW finance.v_journal_integrity_summary IS 
  'Governance view: Summary of journal integrity by tenant';

GRANT SELECT ON finance.v_journal_integrity_summary TO aibos_monitor_role;

-- ============================================================================
-- 5. SCHEMA BOUNDARY CHECK VIEW
-- ============================================================================

CREATE OR REPLACE VIEW kernel.v_schema_boundary_check AS
SELECT 
  r.rolname AS role_name,
  n.nspname AS schema_name,
  CASE 
    WHEN has_schema_privilege(r.rolname, n.nspname, 'USAGE') THEN 'GRANTED'
    ELSE 'DENIED'
  END AS usage_privilege,
  CASE 
    WHEN has_schema_privilege(r.rolname, n.nspname, 'CREATE') THEN 'GRANTED'
    ELSE 'DENIED'
  END AS create_privilege,
  -- Expected state based on our security model
  CASE 
    WHEN r.rolname = 'aibos_kernel_role' AND n.nspname = 'kernel' THEN 'GRANTED'
    WHEN r.rolname = 'aibos_kernel_role' AND n.nspname = 'config' THEN 'GRANTED'
    WHEN r.rolname = 'aibos_kernel_role' AND n.nspname = 'finance' THEN 'DENIED'
    WHEN r.rolname = 'aibos_finance_role' AND n.nspname = 'finance' THEN 'GRANTED'
    WHEN r.rolname = 'aibos_finance_role' AND n.nspname = 'config' THEN 'GRANTED'
    WHEN r.rolname = 'aibos_finance_role' AND n.nspname = 'kernel' THEN 'DENIED'
    WHEN r.rolname = 'aibos_config_role' AND n.nspname = 'config' THEN 'GRANTED'
    ELSE 'N/A'
  END AS expected_usage,
  -- Pass/Fail status
  CASE 
    WHEN r.rolname = 'aibos_kernel_role' AND n.nspname = 'finance' 
         AND has_schema_privilege(r.rolname, n.nspname, 'USAGE') THEN 'FAIL_BOUNDARY_VIOLATION'
    WHEN r.rolname = 'aibos_finance_role' AND n.nspname = 'kernel' 
         AND has_schema_privilege(r.rolname, n.nspname, 'USAGE') THEN 'FAIL_BOUNDARY_VIOLATION'
    ELSE 'PASS'
  END AS boundary_status,
  NOW() AS checked_at
FROM pg_roles r
CROSS JOIN pg_namespace n
WHERE r.rolname IN ('aibos_kernel_role', 'aibos_finance_role', 'aibos_config_role')
  AND n.nspname IN ('kernel', 'finance', 'config');

COMMENT ON VIEW kernel.v_schema_boundary_check IS 
  'Governance view: Verifies hexagonal schema boundary enforcement';

GRANT SELECT ON kernel.v_schema_boundary_check TO aibos_monitor_role;

-- ============================================================================
-- 6. TENANT ISOLATION CHECK VIEW
-- ============================================================================

CREATE OR REPLACE VIEW kernel.v_tenant_isolation_check AS
SELECT 
  schemaname,
  tablename,
  -- Check if tenant_id column exists
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_schema = t.schemaname 
        AND c.table_name = t.tablename 
        AND c.column_name = 'tenant_id'
    ) THEN 'HAS_TENANT_ID'
    ELSE 'MISSING_TENANT_ID'
  END AS tenant_column_status,
  -- Check if it's a global table (expected to not have tenant_id)
  -- Updated to include child tables that inherit isolation from parent
  CASE 
    WHEN t.tablename IN ('tenants', 'permissions', 'canons', 'routes', 'events') THEN 'GLOBAL'
    WHEN t.tablename IN ('provider_profiles', 'provider_selection_rules') THEN 'GLOBAL'
    WHEN t.tablename IN ('journal_lines', 'transaction_approvals') THEN 'CHILD_TABLE'
    ELSE 'TENANT_SCOPED'
  END AS expected_scope,
  -- Pass child tables as they inherit isolation from parent
  CASE 
    WHEN t.tablename IN ('tenants', 'permissions', 'canons', 'routes', 'events',
                         'provider_profiles', 'provider_selection_rules') THEN 'PASS_GLOBAL'
    WHEN t.tablename IN ('journal_lines', 'transaction_approvals') THEN 'PASS_CHILD_INHERITS'
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_schema = t.schemaname 
        AND c.table_name = t.tablename 
        AND c.column_name = 'tenant_id'
    ) THEN 'PASS'
    ELSE 'FAIL_MISSING_ISOLATION'
  END AS isolation_status,
  NOW() AS checked_at
FROM pg_tables t
WHERE t.schemaname IN ('kernel', 'finance', 'config')
  AND t.tablename NOT LIKE 'pg_%'
ORDER BY schemaname, tablename;

COMMENT ON VIEW kernel.v_tenant_isolation_check IS 
  'Governance view: Verifies all tenant-scoped tables have tenant_id column';

GRANT SELECT ON kernel.v_tenant_isolation_check TO aibos_monitor_role;

-- ============================================================================
-- 7. IMMUTABILITY VIOLATION CHECK VIEW
-- ============================================================================

CREATE OR REPLACE VIEW finance.v_immutability_check AS
SELECT 
  je.tenant_id,
  je.id AS journal_entry_id,
  je.reference,
  je.status,
  je.posted_at,
  je.created_at,
  -- Detect potential violations (created_at after posted_at would indicate data anomaly)
  CASE 
    WHEN je.status = 'POSTED' AND je.created_at > je.posted_at THEN 'POTENTIAL_VIOLATION'
    ELSE 'OK'
  END AS immutability_status,
  -- Check if reversed
  je.reversed_by,
  CASE 
    WHEN je.reversed_by IS NOT NULL THEN 'REVERSED'
    ELSE 'ACTIVE'
  END AS reversal_status,
  NOW() AS checked_at
FROM finance.journal_entries je
WHERE je.status = 'POSTED';

COMMENT ON VIEW finance.v_immutability_check IS 
  'Governance view: Checks for potential immutability violations in posted journals';

GRANT SELECT ON finance.v_immutability_check TO aibos_monitor_role;

-- ============================================================================
-- 8. GOVERNANCE SUMMARY VIEW (All-in-One)
-- ============================================================================

CREATE OR REPLACE VIEW kernel.v_governance_summary AS
SELECT 
  'tenant_isolation' AS check_type,
  (SELECT COUNT(*) FILTER (WHERE isolation_status IN ('PASS', 'PASS_GLOBAL', 'PASS_CHILD_INHERITS')) 
   FROM kernel.v_tenant_isolation_check) AS pass_count,
  (SELECT COUNT(*) FILTER (WHERE isolation_status = 'FAIL_MISSING_ISOLATION') 
   FROM kernel.v_tenant_isolation_check) AS fail_count,
  (SELECT COUNT(*) FROM kernel.v_tenant_isolation_check) AS total_count,
  CASE 
    WHEN (SELECT COUNT(*) FILTER (WHERE isolation_status = 'FAIL_MISSING_ISOLATION') 
          FROM kernel.v_tenant_isolation_check) = 0 THEN 'PASS'
    ELSE 'FAIL'
  END AS overall_status,
  NOW() AS checked_at

UNION ALL

SELECT 
  'schema_boundary' AS check_type,
  (SELECT COUNT(*) FILTER (WHERE boundary_status = 'PASS') 
   FROM kernel.v_schema_boundary_check) AS pass_count,
  (SELECT COUNT(*) FILTER (WHERE boundary_status = 'FAIL_BOUNDARY_VIOLATION') 
   FROM kernel.v_schema_boundary_check) AS fail_count,
  (SELECT COUNT(*) FROM kernel.v_schema_boundary_check) AS total_count,
  CASE 
    WHEN (SELECT COUNT(*) FILTER (WHERE boundary_status = 'FAIL_BOUNDARY_VIOLATION') 
          FROM kernel.v_schema_boundary_check) = 0 THEN 'PASS'
    ELSE 'FAIL'
  END AS overall_status,
  NOW() AS checked_at

UNION ALL

SELECT 
  'journal_integrity' AS check_type,
  (SELECT COALESCE(SUM(balanced_count), 0) FROM finance.v_journal_integrity_summary) AS pass_count,
  (SELECT COALESCE(SUM(critical_violations), 0) FROM finance.v_journal_integrity_summary) AS fail_count,
  (SELECT COALESCE(SUM(total_journals), 0) FROM finance.v_journal_integrity_summary) AS total_count,
  CASE 
    WHEN (SELECT COALESCE(SUM(critical_violations), 0) FROM finance.v_journal_integrity_summary) = 0 THEN 'PASS'
    ELSE 'FAIL'
  END AS overall_status,
  NOW() AS checked_at

UNION ALL

SELECT 
  'immutability' AS check_type,
  (SELECT COUNT(*) FILTER (WHERE immutability_status = 'OK') 
   FROM finance.v_immutability_check) AS pass_count,
  (SELECT COUNT(*) FILTER (WHERE immutability_status = 'POTENTIAL_VIOLATION') 
   FROM finance.v_immutability_check) AS fail_count,
  (SELECT COUNT(*) FROM finance.v_immutability_check) AS total_count,
  CASE 
    WHEN (SELECT COUNT(*) FILTER (WHERE immutability_status = 'POTENTIAL_VIOLATION') 
          FROM finance.v_immutability_check) = 0 THEN 'PASS'
    ELSE 'WARN'
  END AS overall_status,
  NOW() AS checked_at;

COMMENT ON VIEW kernel.v_governance_summary IS 
  'Master governance view: All pass/fail checks in one view for auditor evidence';

GRANT SELECT ON kernel.v_governance_summary TO aibos_monitor_role;

-- ============================================================================
-- 9. GRANT SELECT ON ALL VIEWS TO MONITOR ROLE
-- ============================================================================

-- Ensure future views are also accessible
ALTER DEFAULT PRIVILEGES IN SCHEMA kernel 
  GRANT SELECT ON TABLES TO aibos_monitor_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA finance 
  GRANT SELECT ON TABLES TO aibos_monitor_role;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

COMMENT ON SCHEMA kernel IS 'Control Plane - Governance views available via aibos_monitor_role';
