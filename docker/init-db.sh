#!/bin/bash
# ============================================================================
# Database Initialization Script
# ============================================================================
# This script runs automatically when the PostgreSQL container starts
# for the first time.
#
# Phase 6b Enhancement: Integration Kit
# ============================================================================

set -e

echo "============================================"
echo "Initializing Payment Hub Database"
echo "============================================"

# Create kernel schema (for tenants table)
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create kernel schema
    CREATE SCHEMA IF NOT EXISTS kernel;
    
    -- Create finance schema
    CREATE SCHEMA IF NOT EXISTS finance;
    
    -- Enable UUID extension
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    
    -- Create tenants table (simplified for standalone)
    CREATE TABLE IF NOT EXISTS kernel.tenants (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(100) NOT NULL UNIQUE,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Create default tenant for standalone deployment
    INSERT INTO kernel.tenants (id, name, slug, status)
    VALUES (
        '00000000-0000-0000-0000-000000000001',
        'Default Tenant',
        'default',
        'active'
    )
    ON CONFLICT (slug) DO NOTHING;
    
    -- Set default tenant for session
    ALTER DATABASE $POSTGRES_DB SET app.current_tenant_id = '00000000-0000-0000-0000-000000000001';
    
    GRANT USAGE ON SCHEMA kernel TO $POSTGRES_USER;
    GRANT USAGE ON SCHEMA finance TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA kernel TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA finance TO $POSTGRES_USER;
    
    -- Create roles
    CREATE ROLE authenticated;
    CREATE ROLE service_role;
    GRANT authenticated TO $POSTGRES_USER;
    GRANT service_role TO $POSTGRES_USER;
EOSQL

echo "✅ Database initialized successfully"
echo "✅ Default tenant created (ID: 00000000-0000-0000-0000-000000000001)"
echo ""
echo "Next steps:"
echo "1. Run migrations: docker exec payment-hub-api pnpm db:migrate"
echo "2. (Optional) Seed data: docker exec payment-hub-api pnpm db:seed"
echo "============================================"
