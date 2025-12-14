CREATE TABLE IF NOT EXISTS canons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  service_url TEXT NOT NULL,
  healthy BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_canons_name_tenant UNIQUE (tenant_id, name)
);
