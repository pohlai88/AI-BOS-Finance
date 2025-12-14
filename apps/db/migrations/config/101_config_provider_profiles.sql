-- ============================================================================
-- CONFIG SCHEMA: Provider Profiles (Data Fabric Portability)
-- Migration: 101_config_provider_profiles.sql
-- Purpose: Enable provider portability for AI-BOS Data Fabric
-- ============================================================================

-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Config Schema Namespace
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS config;

-- 2. Provider Profiles (Where data lives)
-- ============================================================================
-- Defines available database providers and their capabilities
CREATE TABLE IF NOT EXISTS config.provider_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identity
  provider_code VARCHAR(50) NOT NULL UNIQUE,  -- 'local-docker', 'neon-free', 'aws-rds-prod'
  display_name TEXT NOT NULL,                  -- 'Local Docker Postgres'
  
  -- Provider Type
  provider_type VARCHAR(20) NOT NULL CHECK (provider_type IN (
    'docker',      -- Local development
    'neon',        -- Neon serverless
    'supabase',    -- Supabase
    'aws_rds',     -- AWS RDS
    'gcp_sql',     -- Google Cloud SQL
    'azure_pg',    -- Azure Database for PostgreSQL
    'self_hosted'  -- Self-managed Postgres
  )),
  
  -- Connection Template
  connection_template JSONB NOT NULL,          -- {"host": "...", "port": 5432, "ssl": true}
  
  -- Capabilities Profile
  capabilities JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- {
  --   "storage_gb": 10,
  --   "compute_class": "shared",
  --   "read_replicas": false,
  --   "branching": false,
  --   "pooling": "built-in",
  --   "backup_retention_days": 7,
  --   "geo_regions": ["us-east-1"]
  -- }
  
  -- Constraints
  constraints JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- {
  --   "max_connections": 100,
  --   "max_storage_gb": 10,
  --   "cpu_hours_per_month": null,
  --   "egress_gb_per_month": null
  -- }
  
  -- Tier Mapping (which tenant tiers can use this provider)
  allowed_tiers VARCHAR(20)[] NOT NULL DEFAULT ARRAY['free', 'pro', 'enterprise'],
  
  -- Geographic Availability
  available_regions VARCHAR(50)[] NOT NULL DEFAULT ARRAY['global'],
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'maintenance')),
  
  -- Priority (for auto-selection: lower = preferred)
  priority INTEGER DEFAULT 100,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tenant Provider Mapping
-- ============================================================================
-- Maps tenants to their assigned provider
CREATE TABLE IF NOT EXISTS config.tenant_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  
  -- Schema Assignment
  schema_name VARCHAR(50) NOT NULL,            -- 'kernel', 'finance'
  provider_profile_id UUID NOT NULL REFERENCES config.provider_profiles(id),
  
  -- Override connection (for BYOS mode)
  connection_override JSONB,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'migrating', 'inactive')),
  
  -- Audit
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  migrated_at TIMESTAMPTZ,
  
  CONSTRAINT uq_tenant_schema UNIQUE (tenant_id, schema_name)
);

-- 4. Provider Selection Rules
-- ============================================================================
-- Static rule-based provider selection (MVP approach)
CREATE TABLE IF NOT EXISTS config.provider_selection_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Rule Identity
  rule_name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Matching Criteria
  tenant_tier VARCHAR(20),                     -- NULL = any tier
  region VARCHAR(50),                          -- NULL = any region
  schema_name VARCHAR(50),                     -- NULL = any schema
  
  -- Selected Provider
  provider_profile_id UUID NOT NULL REFERENCES config.provider_profiles(id),
  
  -- Priority (lower = matches first)
  priority INTEGER NOT NULL DEFAULT 100,
  
  -- Status
  active BOOLEAN DEFAULT TRUE,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_config_tenant_providers_tenant ON config.tenant_providers(tenant_id);
CREATE INDEX idx_config_selection_rules_priority ON config.provider_selection_rules(priority) WHERE active = TRUE;

-- ============================================================================
-- TRIGGERS for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION config.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_provider_profiles_updated_at
  BEFORE UPDATE ON config.provider_profiles
  FOR EACH ROW EXECUTE FUNCTION config.update_updated_at();

CREATE TRIGGER trg_provider_selection_rules_updated_at
  BEFORE UPDATE ON config.provider_selection_rules
  FOR EACH ROW EXECUTE FUNCTION config.update_updated_at();

-- ============================================================================
-- SEED: MVP Provider Profile (Local Docker)
-- ============================================================================

INSERT INTO config.provider_profiles (
  provider_code,
  display_name,
  provider_type,
  connection_template,
  capabilities,
  constraints,
  allowed_tiers,
  available_regions,
  priority
) VALUES (
  'local-docker',
  'Local Docker Postgres (Development)',
  'docker',
  '{"host": "localhost", "port": 5433, "database": "aibos_kernel", "ssl": false}'::jsonb,
  '{"storage_gb": null, "compute_class": "local", "read_replicas": false, "branching": false, "pooling": "none", "backup_retention_days": 0}'::jsonb,
  '{"max_connections": 100, "max_storage_gb": null}'::jsonb,
  ARRAY['free', 'pro', 'enterprise'],
  ARRAY['local'],
  1
) ON CONFLICT (provider_code) DO NOTHING;

-- Default selection rule: Everyone uses local-docker in MVP
INSERT INTO config.provider_selection_rules (
  rule_name,
  description,
  tenant_tier,
  region,
  schema_name,
  provider_profile_id,
  priority
) SELECT
  'mvp-default',
  'MVP: All tenants use local Docker Postgres',
  NULL, -- any tier
  NULL, -- any region
  NULL, -- any schema
  id,
  1
FROM config.provider_profiles 
WHERE provider_code = 'local-docker'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMMENTS for Documentation
-- ============================================================================

COMMENT ON SCHEMA config IS 'AI-BOS Platform Configuration - Provider Profiles, Selection Rules';
COMMENT ON TABLE config.provider_profiles IS 'Available database providers with capabilities';
COMMENT ON TABLE config.tenant_providers IS 'Tenant-to-provider assignments per schema';
COMMENT ON TABLE config.provider_selection_rules IS 'Static rules for automatic provider selection';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
