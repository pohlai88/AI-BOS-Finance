-- ============================================================================
-- KERNEL ROLES TABLE
-- Purpose: Role definitions with tenant isolation
-- ============================================================================

CREATE TABLE IF NOT EXISTS kernel.roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES kernel.tenants(id),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_roles_name_tenant UNIQUE (tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_kernel_roles_tenant ON kernel.roles(tenant_id);

COMMENT ON TABLE kernel.roles IS 'Role definitions for RBAC with tenant isolation';
