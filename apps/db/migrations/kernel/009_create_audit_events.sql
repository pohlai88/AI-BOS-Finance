-- ============================================================================
-- KERNEL AUDIT_EVENTS TABLE
-- Purpose: Immutable audit trail with tenant isolation
-- ============================================================================

CREATE TABLE IF NOT EXISTS kernel.audit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES kernel.tenants(id),
  actor_id TEXT,
  actor_type VARCHAR(20) CHECK (actor_type IN ('USER', 'SYSTEM', 'API')),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB,
  correlation_id UUID,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kernel_audit_tenant_time ON kernel.audit_events(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kernel_audit_actor ON kernel.audit_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_kernel_audit_resource ON kernel.audit_events(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_kernel_audit_action ON kernel.audit_events(action);

COMMENT ON TABLE kernel.audit_events IS 'Immutable audit trail for compliance and security';
