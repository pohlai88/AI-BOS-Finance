-- ============================================================================
-- SUPABASE ADAPTER: ROW LEVEL SECURITY POLICIES
-- Migration: 002_rls_policies.sql
-- Purpose: Create tenant isolation policies using Supabase auth.uid()
-- 
-- IMPORTANT: This uses SUPABASE-SPECIFIC functions (auth.uid(), auth.jwt())
-- and roles (authenticated, anon, service_role). NOT portable!
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTION: Get current user's tenant_id
-- ============================================================================
-- Uses Supabase auth.uid() to get the authenticated user's ID
-- Then looks up their tenant_id from kernel.users

CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT tenant_id 
  FROM kernel.users 
  WHERE id = (SELECT auth.uid())
  LIMIT 1
$$;

COMMENT ON FUNCTION public.get_current_tenant_id() IS 
  'Supabase-specific: Gets tenant_id for current authenticated user via auth.uid()';

-- ============================================================================
-- HELPER FUNCTION: Check if user has a specific permission
-- ============================================================================

CREATE OR REPLACE FUNCTION public.user_has_permission(p_permission_code TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM kernel.user_roles ur
    JOIN kernel.role_permissions rp ON ur.role_id = rp.role_id
    WHERE ur.user_id = (SELECT auth.uid())
      AND rp.permission_code = p_permission_code
  )
$$;

COMMENT ON FUNCTION public.user_has_permission(TEXT) IS 
  'Supabase-specific: Checks if authenticated user has a permission';

-- ============================================================================
-- KERNEL SCHEMA POLICIES
-- ============================================================================

-- TENANTS (Global table - service_role only for write, read own tenant)
CREATE POLICY "tenants_select_own" ON kernel.tenants
  FOR SELECT TO authenticated
  USING (id = public.get_current_tenant_id());

CREATE POLICY "tenants_service_role" ON kernel.tenants
  FOR ALL TO service_role
  USING (true);

-- USERS (Tenant-scoped)
CREATE POLICY "users_tenant_isolation" ON kernel.users
  FOR ALL TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "users_service_role" ON kernel.users
  FOR ALL TO service_role
  USING (true);

-- ROLES (Tenant-scoped)
CREATE POLICY "roles_tenant_isolation" ON kernel.roles
  FOR ALL TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "roles_service_role" ON kernel.roles
  FOR ALL TO service_role
  USING (true);

-- ROLE_PERMISSIONS (Tenant-scoped)
CREATE POLICY "role_permissions_tenant_isolation" ON kernel.role_permissions
  FOR ALL TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "role_permissions_service_role" ON kernel.role_permissions
  FOR ALL TO service_role
  USING (true);

-- SESSIONS (Tenant-scoped, user can only see own sessions)
CREATE POLICY "sessions_own_only" ON kernel.sessions
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()) AND tenant_id = public.get_current_tenant_id());

CREATE POLICY "sessions_service_role" ON kernel.sessions
  FOR ALL TO service_role
  USING (true);

-- USER_ROLES (Tenant-scoped)
CREATE POLICY "user_roles_tenant_isolation" ON kernel.user_roles
  FOR ALL TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "user_roles_service_role" ON kernel.user_roles
  FOR ALL TO service_role
  USING (true);

-- CANONS (Global table - read all, write service_role only)
CREATE POLICY "canons_read_all" ON kernel.canons
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "canons_service_role" ON kernel.canons
  FOR ALL TO service_role
  USING (true);

-- ROUTES (Global table - read all, write service_role only)
CREATE POLICY "routes_read_all" ON kernel.routes
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "routes_service_role" ON kernel.routes
  FOR ALL TO service_role
  USING (true);

-- EVENTS (Tenant-scoped)
CREATE POLICY "events_tenant_isolation" ON kernel.events
  FOR ALL TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "events_service_role" ON kernel.events
  FOR ALL TO service_role
  USING (true);

-- AUDIT_EVENTS (Tenant-scoped, read-only for users)
CREATE POLICY "audit_events_read_tenant" ON kernel.audit_events
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "audit_events_service_role" ON kernel.audit_events
  FOR ALL TO service_role
  USING (true);

-- PERMISSIONS (Global lookup table - read all)
CREATE POLICY "permissions_read_all" ON kernel.permissions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "permissions_service_role" ON kernel.permissions
  FOR ALL TO service_role
  USING (true);

-- ============================================================================
-- FINANCE SCHEMA POLICIES
-- ============================================================================

-- COMPANIES (Tenant-scoped)
CREATE POLICY "companies_tenant_isolation" ON finance.companies
  FOR ALL TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "companies_service_role" ON finance.companies
  FOR ALL TO service_role
  USING (true);

-- ACCOUNTS (Tenant-scoped)
CREATE POLICY "accounts_tenant_isolation" ON finance.accounts
  FOR ALL TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "accounts_service_role" ON finance.accounts
  FOR ALL TO service_role
  USING (true);

-- FX_RATES (Tenant-scoped)
CREATE POLICY "fx_rates_tenant_isolation" ON finance.fx_rates
  FOR ALL TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "fx_rates_service_role" ON finance.fx_rates
  FOR ALL TO service_role
  USING (true);

-- TRANSACTIONS (Tenant-scoped, permission-based for write)
CREATE POLICY "transactions_read" ON finance.transactions
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "transactions_insert" ON finance.transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.get_current_tenant_id()
    AND public.user_has_permission('PAYMENT_CREATE')
  );

CREATE POLICY "transactions_update" ON finance.transactions
  FOR UPDATE TO authenticated
  USING (tenant_id = public.get_current_tenant_id())
  WITH CHECK (tenant_id = public.get_current_tenant_id());

CREATE POLICY "transactions_service_role" ON finance.transactions
  FOR ALL TO service_role
  USING (true);

-- TRANSACTION_APPROVALS (Tenant-scoped via transaction)
CREATE POLICY "approvals_read" ON finance.transaction_approvals
  FOR SELECT TO authenticated
  USING (
    transaction_id IN (
      SELECT id FROM finance.transactions 
      WHERE tenant_id = public.get_current_tenant_id()
    )
  );

CREATE POLICY "approvals_insert" ON finance.transaction_approvals
  FOR INSERT TO authenticated
  WITH CHECK (
    transaction_id IN (
      SELECT id FROM finance.transactions 
      WHERE tenant_id = public.get_current_tenant_id()
    )
    AND public.user_has_permission('PAYMENT_APPROVE')
  );

CREATE POLICY "approvals_service_role" ON finance.transaction_approvals
  FOR ALL TO service_role
  USING (true);

-- APPROVAL_MATRICES (Tenant-scoped)
CREATE POLICY "approval_matrices_tenant_isolation" ON finance.approval_matrices
  FOR ALL TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "approval_matrices_service_role" ON finance.approval_matrices
  FOR ALL TO service_role
  USING (true);

-- JOURNAL_ENTRIES (Tenant-scoped, read for all, write needs permission)
CREATE POLICY "journal_entries_read" ON finance.journal_entries
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "journal_entries_insert" ON finance.journal_entries
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.get_current_tenant_id()
    AND public.user_has_permission('JOURNAL_POST')
  );

CREATE POLICY "journal_entries_service_role" ON finance.journal_entries
  FOR ALL TO service_role
  USING (true);

-- JOURNAL_LINES (Access via journal_entry)
CREATE POLICY "journal_lines_read" ON finance.journal_lines
  FOR SELECT TO authenticated
  USING (
    journal_entry_id IN (
      SELECT id FROM finance.journal_entries 
      WHERE tenant_id = public.get_current_tenant_id()
    )
  );

CREATE POLICY "journal_lines_insert" ON finance.journal_lines
  FOR INSERT TO authenticated
  WITH CHECK (
    journal_entry_id IN (
      SELECT id FROM finance.journal_entries 
      WHERE tenant_id = public.get_current_tenant_id()
      AND status = 'DRAFT'  -- Only add lines to DRAFT entries
    )
    AND public.user_has_permission('JOURNAL_POST')
  );

CREATE POLICY "journal_lines_service_role" ON finance.journal_lines
  FOR ALL TO service_role
  USING (true);

-- INTERCOMPANY_SETTLEMENTS (Tenant-scoped)
CREATE POLICY "settlements_tenant_isolation" ON finance.intercompany_settlements
  FOR ALL TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "settlements_service_role" ON finance.intercompany_settlements
  FOR ALL TO service_role
  USING (true);

-- TREASURY_POOL_BALANCES (Tenant-scoped)
CREATE POLICY "pool_balances_tenant_isolation" ON finance.treasury_pool_balances
  FOR ALL TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "pool_balances_service_role" ON finance.treasury_pool_balances
  FOR ALL TO service_role
  USING (true);

-- ============================================================================
-- CONFIG SCHEMA POLICIES (Read-only for users, write for service_role)
-- ============================================================================

-- PROVIDER_PROFILES (Global config - read all)
CREATE POLICY "provider_profiles_read_all" ON config.provider_profiles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "provider_profiles_service_role" ON config.provider_profiles
  FOR ALL TO service_role
  USING (true);

-- TENANT_PROVIDERS (Tenant-scoped)
CREATE POLICY "tenant_providers_tenant_isolation" ON config.tenant_providers
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "tenant_providers_service_role" ON config.tenant_providers
  FOR ALL TO service_role
  USING (true);

-- PROVIDER_SELECTION_RULES (Global config - read all)
CREATE POLICY "selection_rules_read_all" ON config.provider_selection_rules
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "selection_rules_service_role" ON config.provider_selection_rules
  FOR ALL TO service_role
  USING (true);

-- ============================================================================
-- ANON ROLE POLICIES (Minimal access for unauthenticated requests)
-- ============================================================================

-- By default, anon gets NO access to any tables
-- This is secure-by-default

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "users_tenant_isolation" ON kernel.users IS 
  'Supabase RLS: Users can only access data within their own tenant';

COMMENT ON POLICY "transactions_insert" ON finance.transactions IS 
  'Supabase RLS: Creating transactions requires PAYMENT_CREATE permission';

COMMENT ON POLICY "journal_entries_insert" ON finance.journal_entries IS 
  'Supabase RLS: Posting journal entries requires JOURNAL_POST permission';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
