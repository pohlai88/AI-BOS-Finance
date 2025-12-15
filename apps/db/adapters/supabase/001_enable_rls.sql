-- ============================================================================
-- SUPABASE ADAPTER: ENABLE ROW LEVEL SECURITY
-- Migration: 001_enable_rls.sql
-- Purpose: Enable RLS on all tables for Supabase Data API security
-- 
-- IMPORTANT: This is SUPABASE-SPECIFIC and NOT portable to other providers!
-- Run AFTER core migrations have been applied.
-- ============================================================================

-- ============================================================================
-- KERNEL SCHEMA - Enable RLS
-- ============================================================================

ALTER TABLE kernel.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE kernel.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE kernel.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kernel.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kernel.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kernel.canons ENABLE ROW LEVEL SECURITY;
ALTER TABLE kernel.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE kernel.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE kernel.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE kernel.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kernel.user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FINANCE SCHEMA - Enable RLS
-- ============================================================================

ALTER TABLE finance.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.fx_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.transaction_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.approval_matrices ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.journal_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.intercompany_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.treasury_pool_balances ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CONFIG SCHEMA - Enable RLS
-- ============================================================================

ALTER TABLE config.provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE config.tenant_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE config.provider_selection_rules ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON SCHEMA kernel IS 'AI-BOS Kernel Control Plane - RLS Enabled for Supabase';
COMMENT ON SCHEMA finance IS 'AI-BOS Finance Data Plane - RLS Enabled for Supabase';
COMMENT ON SCHEMA config IS 'AI-BOS Platform Configuration - RLS Enabled for Supabase';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
