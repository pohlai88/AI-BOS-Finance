/**
 * SQL Audit Repository
 * 
 * PostgreSQL implementation of AuditPort.
 * Stores audit events in the audit_events table.
 * 
 * @see apps/kernel/db/migrations/009_create_audit_events.sql
 */

import type {
  AuditPort,
  AuditWriteInput,
  AuditQueryInput,
  AuditQueryOutput,
  DbAuditEventRow,
  AuditEvent,
  TransactionContext,
} from '@aibos/kernel-core';
import { TABLES, COLUMNS } from '@aibos/kernel-core';
import type { Pool, PoolClient } from 'pg';

// Type-safe table/column references
const TABLE = `kernel.${TABLES.AUDIT_EVENTS}`; // Include schema prefix
const COL = COLUMNS.audit_events;

export class SqlAuditRepo implements AuditPort {
  constructor(private db: Pool) { }

  async append(input: AuditWriteInput): Promise<void> {
    // Parse resource to extract type and id if it's a URN, otherwise use as resource_id
    let resourceType: string | null = null;
    let resourceId: string | null = null;

    if (input.resource) {
      if (input.resource.startsWith('urn:')) {
        // URN format: urn:<domain>:<type>:<id>
        const parts = input.resource.split(':');
        if (parts.length >= 4) {
          resourceType = parts[2];
          resourceId = parts.slice(3).join(':'); // Handle IDs that might contain colons
        } else {
          resourceId = input.resource;
        }
      } else {
        // Plain ID, try to infer type from action or use 'unknown'
        resourceId = input.resource;
        resourceType = 'unknown';
      }
    }

    await this.db.query(
      `INSERT INTO ${TABLE} (
         tenant_id, actor_id, action, resource_type, resource_id,
         details, correlation_id, ip_address, created_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        input.tenant_id || null,
        input.actor_id || null,
        input.action,
        resourceType,
        resourceId,
        JSON.stringify({
          result: input.result,
          event_type: input.event_type,
          source: input.source,
          http_method: input.http_method,
          http_path: input.http_path,
          http_status: input.http_status,
          user_agent: input.user_agent,
          payload: input.payload,
        }),
        input.correlation_id,
        input.ip_address || null,
      ]
    );
  }

  /**
   * Emit audit event within a database transaction (TRANSACTIONAL)
   * 
   * CRITICAL: This method writes to the same database transaction as the business operation.
   * If audit write fails, the entire transaction will roll back.
   */
  async emitTransactional(
    event: AuditEvent,
    txContext: TransactionContext
  ): Promise<void> {
    const client = txContext.tx as PoolClient;

    // Extract resource_type from entityUrn (e.g., "urn:finance:payment:123" -> "payment")
    // Format: urn:<domain>:<resource_type>:<id>
    const urnParts = event.entityUrn.split(':');
    const resourceType = urnParts.length >= 3 ? urnParts[2] : 'unknown';
    const resourceId = event.entityId;

    // Insert into audit_events using the same transaction
    await client.query(
      `INSERT INTO ${TABLE} (
         tenant_id, actor_id, action, resource_type, resource_id,
         details, correlation_id, ip_address, created_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        event.actor.tenantId || null,
        event.actor.userId || null,
        event.eventType,
        resourceType,
        resourceId,
        JSON.stringify({
          result: 'OK',
          event_type: event.eventType,
          source: 'canon',
          payload: event.payload,
        }),
        txContext.correlationId,
        event.actor.ipAddress || null,
      ]
    );
  }

  async query(input: AuditQueryInput): Promise<AuditQueryOutput> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    // Build WHERE conditions
    if (input.tenant_id) {
      conditions.push(`tenant_id = $${paramIndex++}`);
      params.push(input.tenant_id);
    }

    if (input.correlation_id) {
      conditions.push(`correlation_id = $${paramIndex++}`);
      params.push(input.correlation_id);
    }

    if (input.actor_id) {
      conditions.push(`actor_id = $${paramIndex++}`);
      params.push(input.actor_id);
    }

    if (input.action) {
      conditions.push(`action = $${paramIndex++}`);
      params.push(input.action);
    }

    if (input.resource) {
      // Support both resource_id and resource_type matching
      conditions.push(`(resource_id = $${paramIndex} OR resource_type = $${paramIndex})`);
      params.push(input.resource);
      paramIndex++;
    }

    if (input.start_time) {
      conditions.push(`created_at >= $${paramIndex++}`);
      params.push(input.start_time);
    }

    if (input.end_time) {
      conditions.push(`created_at <= $${paramIndex++}`);
      params.push(input.end_time);
    }

    // Filter by result (stored in details JSONB)
    if (input.result) {
      conditions.push(`details->>'result' = $${paramIndex++}`);
      params.push(input.result);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await this.db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${TABLE} ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated results
    const limit = input.limit || 50;
    const offset = input.offset || 0;

    const result = await this.db.query<{
      id: string;
      tenant_id: string | null;
      actor_id: string | null;
      action: string;
      resource_type: string | null;
      resource_id: string | null;
      details: unknown;
      correlation_id: string | null;
      ip_address: string | null;
      created_at: Date;
    }>(
      `SELECT id, tenant_id, actor_id, action, resource_type, resource_id, details, correlation_id, ip_address, created_at
       FROM ${TABLE}
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, offset]
    );

    const events = result.rows.map((row) => {
      const details = row.details as Record<string, unknown>;
      // Reconstruct resource from resource_type and resource_id
      const resource = row.resource_type && row.resource_id
        ? `urn:${row.resource_type}:${row.resource_id}`
        : row.resource_id || '';

      return {
        tenant_id: row.tenant_id || undefined,
        actor_id: row.actor_id || undefined,
        action: row.action,
        resource,
        result: (details.result as 'OK' | 'FAIL' | 'ALLOW' | 'DENY') || 'OK',
        correlation_id: row.correlation_id || '',
        payload: details.payload,
        event_type: details.event_type as string | undefined,
        source: details.source as string | undefined,
        http_method: details.http_method as string | undefined,
        http_path: details.http_path as string | undefined,
        http_status: details.http_status as number | undefined,
        ip_address: row.ip_address || undefined,
        user_agent: details.user_agent as string | undefined,
        id: row.id,
        created_at: row.created_at.toISOString(),
      };
    });

    return { events, total };
  }
}
