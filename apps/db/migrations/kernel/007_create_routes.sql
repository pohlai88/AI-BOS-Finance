-- ============================================================================
-- KERNEL ROUTES TABLE
-- Purpose: API route registry for Canon services
-- Note: This is a GLOBAL table (not tenant-scoped)
-- ============================================================================

CREATE TABLE IF NOT EXISTS kernel.routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  canon_id UUID NOT NULL REFERENCES kernel.canons(id) ON DELETE CASCADE,
  method VARCHAR(10) NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
  path TEXT NOT NULL,
  required_permissions TEXT[],
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_routes_path_method UNIQUE (canon_id, path, method)
);

CREATE INDEX IF NOT EXISTS idx_kernel_routes_canon ON kernel.routes(canon_id);
CREATE INDEX IF NOT EXISTS idx_kernel_routes_active ON kernel.routes(active) WHERE active = TRUE;

COMMENT ON TABLE kernel.routes IS 'API route registry for Canon services (global)';
