-- ============================================================================
-- KERNEL SESSIONS TABLE
-- Purpose: User session management with tenant isolation
-- ============================================================================

CREATE TABLE IF NOT EXISTS kernel.sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES kernel.tenants(id),
  user_id UUID NOT NULL REFERENCES kernel.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_kernel_sessions_tenant ON kernel.sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kernel_sessions_user ON kernel.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_kernel_sessions_tenant_user ON kernel.sessions(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_kernel_sessions_expires ON kernel.sessions(expires_at) WHERE revoked_at IS NULL;

COMMENT ON TABLE kernel.sessions IS 'User sessions with tenant isolation and expiry tracking';
