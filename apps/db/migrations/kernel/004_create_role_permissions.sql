-- ============================================================================
-- KERNEL ROLE_PERMISSIONS TABLE
-- Purpose: Junction table for role-permission assignments
-- ============================================================================

CREATE TABLE IF NOT EXISTS kernel.role_permissions (
  tenant_id UUID NOT NULL REFERENCES kernel.tenants(id),
  role_id UUID NOT NULL REFERENCES kernel.roles(id) ON DELETE CASCADE,
  permission_code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (tenant_id, role_id, permission_code)
);

CREATE INDEX IF NOT EXISTS idx_kernel_role_permissions_tenant_role ON kernel.role_permissions(tenant_id, role_id);
CREATE INDEX IF NOT EXISTS idx_kernel_role_permissions_role ON kernel.role_permissions(role_id);

COMMENT ON TABLE kernel.role_permissions IS 'Junction table linking roles to permissions';
