/**
 * Kernel Audit Contracts
 * 
 * Schema-first definition for audit events.
 * Every critical action in the system writes an audit event.
 */

import { z } from "zod";

// ============================================================================
// AUDIT TENANT ID SCHEMA
// ============================================================================

/**
 * Tenant ID validation for audit events
 * 
 * **Invariant (enforced at API boundary, not schema):**
 * - Tenant-scoped business operations MUST use UUID (enforced by x-tenant-id header validation)
 * - System/health events use "system" or "health-check"
 * 
 * **Why `.string()` and not union:**
 * Zod's union with UUID causes validation issues when optional fields are involved.
 * The invariant is enforced at the API route level (requireTenantId helper).
 * 
 * **For Build 3.2:** Consider separating SYSTEM events into a different table/scope
 * to restore strict UUID typing here.
 */
export const AuditTenantIdSchema = z.string();

export type AuditTenantId = z.infer<typeof AuditTenantIdSchema>;

// ============================================================================
// AUDIT EVENT SCHEMA
// ============================================================================

export const AuditEvent = z.object({
  id: z.string().uuid(),
  tenant_id: AuditTenantIdSchema.optional(),
  actor_id: z.string().optional(), // Can be UUID or system identifier
  action: z.string(), // e.g., "kernel.tenant.create"
  resource: z.string(), // e.g., "kernel_tenant"
  result: z.enum(["OK", "FAIL", "ALLOW", "DENY"]),
  correlation_id: z.string(),
  payload: z.unknown().optional(),
  created_at: z.string(), // ISO 8601

  // Enhanced metadata (Phase 4 improvements)
  event_type: z.string().optional(), // e.g., "audit.write", "event.publish"
  source: z.string().optional(), // e.g., "kernel", "canon"
  http_method: z.string().optional(), // e.g., "POST", "GET"
  http_path: z.string().optional(), // e.g., "/api/kernel/registry/canons"
  http_status: z.number().int().optional(), // e.g., 201, 400
  ip_address: z.string().optional(), // Client IP (security)
  user_agent: z.string().optional(), // Client UA (security)
});

// ============================================================================
// TYPE EXPORTS (inferred from schema)
// ============================================================================

export type AuditEvent = z.infer<typeof AuditEvent>;

// ============================================================================
// AUDIT RESULT ENUM (for use in code)
// ============================================================================

export const AuditResult = {
  OK: "OK",
  FAIL: "FAIL",
  ALLOW: "ALLOW",
  DENY: "DENY",
} as const;

export type AuditResultType = (typeof AuditResult)[keyof typeof AuditResult];

// ============================================================================
// AUDIT QUERY SCHEMAS (Phase 4)
// ============================================================================

/**
 * Audit query filters
 * 
 * Supports filtering by:
 * - tenant_id (required via header, not in query params)
 * - correlation_id (trace all events for a request)
 * - actor_id (who performed actions)
 * - action (what action was performed)
 * - result (OK, FAIL, ALLOW, DENY)
 * - time range (start_time, end_time)
 * - pagination (limit, offset)
 */
export const AuditQueryFilters = z.object({
  correlation_id: z.string().optional(),
  actor_id: z.string().optional(),
  action: z.string().optional(),
  resource: z.string().optional(),
  result: z.enum(["OK", "FAIL", "ALLOW", "DENY"]).optional(),
  start_time: z.string().datetime().optional(), // ISO 8601
  end_time: z.string().datetime().optional(), // ISO 8601
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type AuditQueryFilters = z.infer<typeof AuditQueryFilters>;

/**
 * Audit query response
 * 
 * Returns paginated audit events with total count
 */
export const AuditQueryResponse = z.object({
  ok: z.literal(true),
  data: z.object({
    events: z.array(AuditEvent),
    total: z.number().int().min(0),
    limit: z.number().int(),
    offset: z.number().int(),
  }),
  correlation_id: z.string(),
});

export type AuditQueryResponse = z.infer<typeof AuditQueryResponse>;

