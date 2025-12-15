-- ============================================================================
-- SUPABASE ADAPTER: PERFORMANCE OPTIMIZATIONS
-- Migration: 003_performance.sql
-- Purpose: Supabase-specific indexes and performance tuning
-- 
-- Based on Supabase Performance Advisors and RLS best practices
-- ============================================================================

-- ============================================================================
-- RLS PERFORMANCE: Indexes for efficient policy evaluation
-- ============================================================================
-- Supabase RLS policies are evaluated for EVERY row. These indexes make
-- the get_current_tenant_id() and user_has_permission() lookups fast.

-- Fast user lookup by auth.uid() (critical for RLS)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kernel_users_id 
  ON kernel.users(id);

-- Fast tenant lookup from user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kernel_users_id_tenant 
  ON kernel.users(id, tenant_id);

-- Fast permission check (used in RLS policies)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kernel_user_roles_user_role 
  ON kernel.user_roles(user_id, role_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kernel_role_permissions_lookup 
  ON kernel.role_permissions(role_id, permission_code);

-- ============================================================================
-- FINANCE SCHEMA: Query Optimization Indexes
-- ============================================================================

-- Transactions: Common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_finance_transactions_tenant_status 
  ON finance.transactions(tenant_id, status) 
  WHERE status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PROCESSING');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_finance_transactions_tenant_date 
  ON finance.transactions(tenant_id, value_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_finance_transactions_company_status 
  ON finance.transactions(company_id, status);

-- Journal entries: Efficient posting queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_finance_journal_entries_tenant_status 
  ON finance.journal_entries(tenant_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_finance_journal_entries_posting_date 
  ON finance.journal_entries(tenant_id, posting_date DESC);

-- Accounts: Balance queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_finance_accounts_company_currency 
  ON finance.accounts(company_id, currency);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_finance_accounts_tenant_type 
  ON finance.accounts(tenant_id, type);

-- FX Rates: Rate lookup optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_finance_fx_rates_lookup 
  ON finance.fx_rates(tenant_id, from_currency, to_currency, valid_from DESC)
  WHERE valid_to IS NULL;

-- ============================================================================
-- SUPABASE-SPECIFIC: Optimize for Supavisor Connection Pooling
-- ============================================================================

-- Set statement timeout for long-running queries (prevent connection hogging)
-- Note: This is a recommendation - actual setting is in Supabase Dashboard

-- ============================================================================
-- ENABLE EXTENSIONS FOR PERFORMANCE
-- ============================================================================

-- pg_stat_statements for query analysis (usually already enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- index_advisor for automated index recommendations
CREATE EXTENSION IF NOT EXISTS index_advisor;

-- pg_trgm for efficient text search (if needed for search features)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- PARTIAL INDEXES FOR COMMON FILTERS
-- ============================================================================

-- Active companies only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_finance_companies_active 
  ON finance.companies(tenant_id, code) 
  WHERE status = 'active';

-- Active accounts only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_finance_accounts_active 
  ON finance.accounts(tenant_id, company_id, code) 
  WHERE status = 'active';

-- Pending transactions (most commonly queried)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_finance_transactions_pending 
  ON finance.transactions(tenant_id, created_at DESC) 
  WHERE status = 'PENDING_APPROVAL';

-- Posted journal entries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_finance_journal_posted 
  ON finance.journal_entries(tenant_id, posted_at DESC) 
  WHERE status = 'POSTED';

-- Active sessions (not expired, not revoked)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kernel_sessions_active 
  ON kernel.sessions(user_id, expires_at) 
  WHERE revoked_at IS NULL AND expires_at > NOW();

-- ============================================================================
-- STATISTICS FOR QUERY PLANNER
-- ============================================================================

-- Increase statistics targets for tenant_id columns (critical for RLS)
ALTER TABLE kernel.users ALTER COLUMN tenant_id SET STATISTICS 1000;
ALTER TABLE finance.companies ALTER COLUMN tenant_id SET STATISTICS 1000;
ALTER TABLE finance.accounts ALTER COLUMN tenant_id SET STATISTICS 1000;
ALTER TABLE finance.transactions ALTER COLUMN tenant_id SET STATISTICS 1000;
ALTER TABLE finance.journal_entries ALTER COLUMN tenant_id SET STATISTICS 1000;

-- Analyze tables after creating indexes
ANALYZE kernel.users;
ANALYZE kernel.roles;
ANALYZE kernel.user_roles;
ANALYZE kernel.role_permissions;
ANALYZE finance.companies;
ANALYZE finance.accounts;
ANALYZE finance.transactions;
ANALYZE finance.journal_entries;
ANALYZE finance.journal_lines;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON INDEX idx_kernel_users_id_tenant IS 
  'Supabase RLS performance: Fast tenant lookup from user ID for policy evaluation';

COMMENT ON INDEX idx_kernel_role_permissions_lookup IS 
  'Supabase RLS performance: Fast permission checks in user_has_permission()';

COMMENT ON INDEX idx_finance_transactions_pending IS 
  'Partial index for pending transactions - most frequently queried status';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
