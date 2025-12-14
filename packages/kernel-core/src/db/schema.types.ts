/**
 * Database Schema Types - Derived from SQL Migrations
 * 
 * These types represent the EXACT shape of rows in PostgreSQL.
 * They are the SSOT for database interactions.
 * 
 * IMPORTANT: When you change db/migrations/*.sql, update these types!
 * 
 * @see apps/kernel/db/migrations/*.sql
 */

// ============================================================================
// 001_create_tenants.sql
// ============================================================================

export interface DbTenantRow {
  id: string;              // UUID PRIMARY KEY
  name: string;            // TEXT NOT NULL
  status: string;          // TEXT DEFAULT 'ACTIVE'
  created_at: Date;        // TIMESTAMPTZ DEFAULT NOW()
  updated_at: Date;        // TIMESTAMPTZ DEFAULT NOW()
}

// ============================================================================
// 002_create_users.sql
// ============================================================================

export interface DbUserRow {
  id: string;              // UUID PRIMARY KEY
  tenant_id: string;       // UUID REFERENCES tenants(id)
  email: string;           // TEXT NOT NULL
  name: string;            // TEXT NOT NULL
  password_hash: string | null; // TEXT (nullable until set)
  created_at: Date;        // TIMESTAMPTZ DEFAULT NOW()
  updated_at: Date;        // TIMESTAMPTZ DEFAULT NOW()
}

// ============================================================================
// 003_create_roles.sql
// ============================================================================

export interface DbRoleRow {
  id: string;              // UUID PRIMARY KEY
  tenant_id: string;       // UUID REFERENCES tenants(id)
  name: string;            // TEXT NOT NULL
  description: string | null; // TEXT
  created_at: Date;        // TIMESTAMPTZ DEFAULT NOW()
  updated_at: Date;        // TIMESTAMPTZ DEFAULT NOW()
}

// ============================================================================
// 004_create_role_permissions.sql
// ============================================================================

export interface DbRolePermissionRow {
  tenant_id: string;       // UUID REFERENCES tenants(id)
  role_id: string;         // UUID REFERENCES roles(id)
  permission_code: string; // TEXT REFERENCES permissions(permission_code)
  // Composite PK: (tenant_id, role_id, permission_code)
}

// ============================================================================
// 005_create_sessions.sql
// ============================================================================

export interface DbSessionRow {
  id: string;              // UUID PRIMARY KEY
  tenant_id: string;       // UUID REFERENCES tenants(id)
  user_id: string;         // UUID REFERENCES users(id)
  expires_at: Date;        // TIMESTAMPTZ NOT NULL
  created_at: Date;        // TIMESTAMPTZ DEFAULT NOW()
}

// ============================================================================
// 006_create_canons.sql
// ============================================================================

export interface DbCanonRow {
  id: string;              // UUID PRIMARY KEY
  tenant_id: string;       // UUID REFERENCES tenants(id)
  code: string;            // TEXT NOT NULL
  name: string;            // TEXT NOT NULL
  version: string;         // TEXT NOT NULL
  status: string;          // TEXT DEFAULT 'ACTIVE'
  manifest: unknown;       // JSONB
  created_at: Date;        // TIMESTAMPTZ DEFAULT NOW()
  updated_at: Date;        // TIMESTAMPTZ DEFAULT NOW()
}

// ============================================================================
// 007_create_routes.sql
// ============================================================================

export interface DbRouteRow {
  id: string;              // UUID PRIMARY KEY
  tenant_id: string;       // UUID REFERENCES tenants(id)
  path: string;            // TEXT NOT NULL
  canon_id: string;        // UUID REFERENCES canons(id)
  created_at: Date;        // TIMESTAMPTZ DEFAULT NOW()
}

// ============================================================================
// 008_create_events.sql
// ============================================================================

export interface DbEventRow {
  id: string;              // UUID PRIMARY KEY
  tenant_id: string;       // UUID REFERENCES tenants(id)
  event_name: string;      // TEXT NOT NULL
  source: string;          // TEXT NOT NULL
  actor_id: string | null; // UUID (nullable)
  correlation_id: string | null; // UUID (nullable)
  timestamp: Date;         // TIMESTAMPTZ NOT NULL
  payload: unknown;        // JSONB
}

// ============================================================================
// 009_create_audit_events.sql
// ============================================================================

export interface DbAuditEventRow {
  id: string;              // UUID PRIMARY KEY
  tenant_id: string | null; // UUID (nullable for system events)
  actor_id: string | null; // TEXT (nullable)
  action: string;          // TEXT NOT NULL
  resource: string | null; // TEXT
  details: unknown;        // JSONB (NOT "payload" or "result"!)
  correlation_id: string | null; // UUID
  ip_address: string | null; // TEXT
  created_at: Date;        // TIMESTAMPTZ DEFAULT NOW()
}

// ============================================================================
// 012_create_permissions.sql
// ============================================================================

export interface DbPermissionRow {
  permission_code: string; // TEXT PRIMARY KEY
  description: string | null; // TEXT
}

// ============================================================================
// 013_create_user_roles.sql
// ============================================================================

export interface DbUserRoleRow {
  tenant_id: string;       // UUID REFERENCES tenants(id)
  user_id: string;         // UUID REFERENCES users(id)
  role_id: string;         // UUID REFERENCES roles(id)
  // Composite PK: (tenant_id, user_id, role_id)
}

// ============================================================================
// INSERT/UPDATE TYPES (optional fields excluded)
// ============================================================================

export type DbTenantInsert = Omit<DbTenantRow, 'created_at' | 'updated_at'> & {
  status?: string;
};

export type DbUserInsert = Omit<DbUserRow, 'created_at' | 'updated_at' | 'password_hash'>;

export type DbRoleInsert = Omit<DbRoleRow, 'created_at' | 'updated_at'>;

export type DbCanonInsert = Omit<DbCanonRow, 'created_at' | 'updated_at'> & {
  status?: string;
};

export type DbEventInsert = Omit<DbEventRow, 'id'> & {
  id?: string;
};

export type DbAuditEventInsert = Omit<DbAuditEventRow, 'id' | 'created_at'>;
