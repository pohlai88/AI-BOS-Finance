-- ============================================================================
-- KERNEL FOREIGN KEY INDEXES
-- Purpose: Add covering indexes for all foreign keys (performance best practice)
-- ============================================================================

-- Note: Most indexes are already created in individual table migrations
-- This migration ensures comprehensive coverage

-- Additional composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_kernel_users_tenant_status ON kernel.users(tenant_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_kernel_roles_tenant_name ON kernel.roles(tenant_id, name);
CREATE INDEX IF NOT EXISTS idx_kernel_sessions_active ON kernel.sessions(tenant_id, user_id, expires_at) WHERE revoked_at IS NULL;
