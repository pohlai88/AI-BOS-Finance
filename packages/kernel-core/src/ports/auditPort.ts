/**
 * Audit Port
 * 
 * Interface for audit event writing.
 * Every critical action in the system uses this port.
 * 
 * Anti-Gravity: This is a PORT, not an adapter.
 * It defines WHAT we need, not HOW it's implemented.
 */

export interface AuditWriteInput {
  tenant_id?: string;
  actor_id?: string;
  action: string;
  resource: string;
  result: "OK" | "FAIL" | "ALLOW" | "DENY";
  correlation_id: string;
  payload?: unknown;

  // Enhanced metadata (for forensics and security)
  event_type?: string;      // e.g., "audit.write", "event.publish"
  source?: string;          // e.g., "kernel", "canon"
  http_method?: string;     // e.g., "POST", "GET"
  http_path?: string;       // e.g., "/api/kernel/registry/canons"
  http_status?: number;     // e.g., 201, 400
  ip_address?: string;      // Client IP (security)
  user_agent?: string;      // Client UA (security)
}

/**
 * Audit query input (Phase 4)
 */
export interface AuditQueryInput {
  tenant_id?: string;
  correlation_id?: string;
  actor_id?: string;
  action?: string;
  resource?: string;
  result?: "OK" | "FAIL" | "ALLOW" | "DENY";
  start_time?: string; // ISO 8601
  end_time?: string; // ISO 8601
  limit: number;
  offset: number;
}

/**
 * Audit query output (Phase 4)
 */
export interface AuditQueryOutput {
  events: Array<AuditWriteInput & { id: string; created_at: string }>;
  total: number;
}

export interface AuditPort {
  /**
   * Append an audit event (append-only, immutable)
   * 
   * Audit events are immutable and cannot be modified or deleted.
   * This ensures audit trail integrity for compliance and security.
   */
  append(input: AuditWriteInput): Promise<void>;

  /**
   * Query audit events (Phase 4)
   * 
   * Supports filtering by tenant, actor, action, result, time range, etc.
   */
  query(input: AuditQueryInput): Promise<AuditQueryOutput>;
}

