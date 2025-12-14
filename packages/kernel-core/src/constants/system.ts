/**
 * System Constants - Single Source of Truth
 * 
 * All system-level UUIDs, identifiers, and constants.
 * NEVER hardcode these values elsewhere - import from here.
 * 
 * @see db/migrations/*.sql for database schema
 */

// ============================================================================
// SYSTEM TENANT
// ============================================================================

/**
 * The system tenant UUID used for kernel-internal operations.
 * This tenant is created by db/seed/001_system_tenant.sql
 */
export const SYSTEM_TENANT_ID = "00000000-0000-0000-0000-000000000000" as const;

/**
 * A null/placeholder UUID for health checks and non-existent lookups.
 * Used when we need to query without a real entity ID.
 */
export const NULL_UUID = "00000000-0000-0000-0000-000000000001" as const;

// ============================================================================
// TABLE NAMES (must match db/migrations/*.sql)
// ============================================================================

export const TABLES = {
  TENANTS: "tenants",
  USERS: "users",
  ROLES: "roles",
  ROLE_PERMISSIONS: "role_permissions",
  SESSIONS: "sessions",
  CANONS: "canons",
  ROUTES: "routes",
  EVENTS: "events",
  AUDIT_EVENTS: "audit_events",
  PERMISSIONS: "permissions",
  USER_ROLES: "user_roles",
} as const;

// ============================================================================
// COLUMN NAMES BY TABLE (must match db/migrations/*.sql)
// ============================================================================

/**
 * Column definitions derived from SQL migrations.
 * These ensure type-safe column references in SQL queries.
 */
export const COLUMNS = {
  // 001_create_tenants.sql
  tenants: {
    id: "id",
    name: "name",
    status: "status",
    created_at: "created_at",
    updated_at: "updated_at",
  },

  // 002_create_users.sql
  users: {
    id: "id",
    tenant_id: "tenant_id",
    email: "email",
    name: "name",
    password_hash: "password_hash",
    created_at: "created_at",
    updated_at: "updated_at",
  },

  // 003_create_roles.sql
  roles: {
    id: "id",
    tenant_id: "tenant_id",
    name: "name",
    description: "description",
    created_at: "created_at",
    updated_at: "updated_at",
  },

  // 004_create_role_permissions.sql
  role_permissions: {
    tenant_id: "tenant_id",
    role_id: "role_id",
    permission_code: "permission_code",
  },

  // 005_create_sessions.sql
  sessions: {
    id: "id",
    tenant_id: "tenant_id",
    user_id: "user_id",
    expires_at: "expires_at",
    created_at: "created_at",
  },

  // 006_create_canons.sql
  canons: {
    id: "id",
    tenant_id: "tenant_id",
    code: "code",
    name: "name",
    version: "version",
    status: "status",
    manifest: "manifest",
    created_at: "created_at",
    updated_at: "updated_at",
  },

  // 007_create_routes.sql
  routes: {
    id: "id",
    tenant_id: "tenant_id",
    path: "path",
    canon_id: "canon_id",
    created_at: "created_at",
  },

  // 008_create_events.sql
  events: {
    id: "id",
    tenant_id: "tenant_id",
    event_name: "event_name",
    source: "source",
    actor_id: "actor_id",
    correlation_id: "correlation_id",
    timestamp: "timestamp",
    payload: "payload",
  },

  // 009_create_audit_events.sql
  audit_events: {
    id: "id",
    tenant_id: "tenant_id",
    actor_id: "actor_id",
    action: "action",
    resource: "resource",
    details: "details", // NOT "payload" or "result"
    correlation_id: "correlation_id",
    ip_address: "ip_address",
    created_at: "created_at",
  },

  // 012_create_permissions.sql
  permissions: {
    permission_code: "permission_code",
    description: "description",
  },

  // 013_create_user_roles.sql
  user_roles: {
    tenant_id: "tenant_id",
    user_id: "user_id",
    role_id: "role_id",
  },
} as const;

// ============================================================================
// TYPE HELPERS
// ============================================================================

export type TableName = (typeof TABLES)[keyof typeof TABLES];
export type TenantColumns = keyof typeof COLUMNS.tenants;
export type UserColumns = keyof typeof COLUMNS.users;
export type AuditColumns = keyof typeof COLUMNS.audit_events;
