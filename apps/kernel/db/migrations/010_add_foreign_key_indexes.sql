-- Add indexes for all foreign keys to improve join performance
-- Supabase best practice: All foreign keys should have covering indexes

-- Users table: tenant_id foreign key
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);

-- Canons table: tenant_id foreign key
CREATE INDEX IF NOT EXISTS idx_canons_tenant_id ON canons(tenant_id);

-- Routes table: tenant_id and canon_id foreign keys
CREATE INDEX IF NOT EXISTS idx_routes_tenant_id ON routes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_routes_canon_id ON routes(canon_id);

-- Composite indexes for common multi-tenant query patterns
CREATE INDEX IF NOT EXISTS idx_users_tenant_email ON users(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_canons_tenant_name ON canons(tenant_id, name);
CREATE INDEX IF NOT EXISTS idx_routes_tenant_active ON routes(tenant_id, active) WHERE active = true;
