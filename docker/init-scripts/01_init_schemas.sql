-- ============================================================================
-- Payment Hub Standalone - Database Initialization
-- ============================================================================
-- 
-- This script runs on first container startup to initialize the database
-- with the required schemas and extensions.
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS kernel;
CREATE SCHEMA IF NOT EXISTS finance;

-- Create minimal kernel tables for standalone mode
CREATE TABLE IF NOT EXISTS kernel.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default tenant for standalone mode
INSERT INTO kernel.tenants (id, name, status)
VALUES ('00000000-0000-0000-0000-000000000001', 'Standalone Tenant', 'active')
ON CONFLICT (id) DO NOTHING;

-- Create minimal audit events table
CREATE TABLE IF NOT EXISTS kernel.audit_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES kernel.tenants(id),
    event_type VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    actor_id UUID,
    actor_type VARCHAR(20),
    payload JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_tenant ON kernel.audit_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_resource ON kernel.audit_events(resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_timestamp ON kernel.audit_events(timestamp DESC);

-- Grant permissions
GRANT ALL ON SCHEMA kernel TO aibos;
GRANT ALL ON SCHEMA finance TO aibos;
GRANT ALL ON ALL TABLES IN SCHEMA kernel TO aibos;
GRANT ALL ON ALL TABLES IN SCHEMA finance TO aibos;
