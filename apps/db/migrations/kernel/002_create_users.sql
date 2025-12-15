-- ============================================================================
-- KERNEL USERS TABLE
-- Purpose: User accounts with tenant isolation
-- ============================================================================

CREATE TABLE IF NOT EXISTS kernel.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES kernel.tenants(id),
  email TEXT NOT NULL,
  display_name TEXT,
  password_hash TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_users_email_tenant UNIQUE (tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_kernel_users_tenant ON kernel.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kernel_users_email ON kernel.users(email);

COMMENT ON TABLE kernel.users IS 'User accounts with tenant isolation';
