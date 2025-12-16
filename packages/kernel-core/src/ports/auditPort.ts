/**
 * Audit Port
 * 
 * Interface for audit event writing.
 * Every critical action in the system uses this port.
 * 
 * Anti-Gravity: This is a PORT, not an adapter.
 * It defines WHAT we need, not HOW it's implemented.
 * 
 * ENTERPRISE REQUIREMENT: For AP-05 material actions (submit/approve/reject/execute/complete/fail),
 * the domain mutation and the audit event **must commit in the same database transaction**;
 * if audit write fails, the action fails and **no state change is persisted**.
 */

import type { TransactionContext } from './paymentRepositoryPort';

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
 * Audit event for transactional operations
 */
export interface AuditEvent {
  eventType: string;
  entityId: string;
  entityUrn: string;
  actor: {
    userId: string;
    tenantId: string;
    sessionId?: string;
    ipAddress?: string;
  };
  payload: Record<string, unknown>;
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
   * 
   * NOTE: For transactional operations, use emitTransactional instead.
   */
  append(input: AuditWriteInput): Promise<void>;

  /**
   * Emit audit event within a database transaction (TRANSACTIONAL)
   * 
   * CRITICAL: This method MUST be called within the same database transaction
   * as the business operation. If audit write fails, the entire transaction
   * must roll back.
   * 
   * @param event - Audit event data
   * @param txContext - Transaction context (same transaction as business operation)
   * 
   * @throws Error if audit write fails (will cause transaction rollback)
   * 
   * @example
   * ```typescript
   * await paymentRepo.withTransaction(async (txContext) => {
   *   // Update payment
   *   await paymentRepo.updateStatus(paymentId, newStatus, txContext);
   *   
   *   // Emit audit (same transaction)
   *   await auditPort.emitTransactional({
   *     eventType: 'finance.ap.payment.approved',
   *     entityId: paymentId,
   *     entityUrn: `urn:finance:payment:${paymentId}`,
   *     actor: { userId, tenantId },
   *     payload: { before: oldStatus, after: newStatus }
   *   }, txContext);
   *   
   *   // Transaction commits (both payment + audit are atomic)
   * });
   * ```
   */
  emitTransactional(
    event: AuditEvent,
    txContext: TransactionContext
  ): Promise<void>;

  /**
   * Query audit events (Phase 4)
   * 
   * Supports filtering by tenant, actor, action, result, time range, etc.
   */
  query(input: AuditQueryInput): Promise<AuditQueryOutput>;
}

