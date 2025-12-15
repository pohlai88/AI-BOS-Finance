-- ============================================================================
-- KERNEL CANONS TABLE
-- Purpose: Service registry for Canon services
-- Note: This is a GLOBAL table (not tenant-scoped)
-- ============================================================================

CREATE TABLE IF NOT EXISTS kernel.canons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) NOT NULL UNIQUE,
  name TEXT NOT NULL,
  service_url TEXT,
  healthy BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE kernel.canons IS 'Global Canon service registry (not tenant-scoped)';
