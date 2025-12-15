-- ============================================================================
-- KERNEL EVENTS TABLE
-- Purpose: Event sourcing / domain events with tenant isolation
-- ============================================================================

CREATE TABLE IF NOT EXISTS kernel.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES kernel.tenants(id),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  correlation_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kernel_events_tenant ON kernel.events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kernel_events_correlation ON kernel.events(correlation_id);
CREATE INDEX IF NOT EXISTS idx_kernel_events_tenant_time ON kernel.events(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kernel_events_type ON kernel.events(event_type);

COMMENT ON TABLE kernel.events IS 'Domain events with tenant isolation for event sourcing';
