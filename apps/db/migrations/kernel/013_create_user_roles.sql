-- ============================================================================
-- KERNEL USER_ROLES TABLE
-- Purpose: Junction table for user-role assignments with tenant isolation
-- ============================================================================

CREATE TABLE IF NOT EXISTS kernel.user_roles (
  tenant_id UUID NOT NULL REFERENCES kernel.tenants(id),
  user_id UUID NOT NULL REFERENCES kernel.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES kernel.roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (tenant_id, user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_kernel_user_roles_tenant_user ON kernel.user_roles(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_kernel_user_roles_role ON kernel.user_roles(role_id);

COMMENT ON TABLE kernel.user_roles IS 'Junction table linking users to roles with tenant isolation';
