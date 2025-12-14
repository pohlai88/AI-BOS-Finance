CREATE TABLE IF NOT EXISTS role_permissions (
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (tenant_id, role_id, permission_code)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_tenant_role ON role_permissions(tenant_id, role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
