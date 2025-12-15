-- ============================================================================
-- KERNEL SCHEMA BOOTSTRAP
-- Purpose: Create kernel control plane schema and core tenant table
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create kernel schema
CREATE SCHEMA IF NOT EXISTS kernel;

-- Create tenants table in kernel schema
CREATE TABLE IF NOT EXISTS kernel.tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comment for documentation
COMMENT ON SCHEMA kernel IS 'AI-BOS Kernel Control Plane - Identity, Sessions, Audit';
COMMENT ON TABLE kernel.tenants IS 'Multi-tenant isolation - root of all tenant-scoped data';
