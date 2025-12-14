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
} from '@aibos/kernel-core';
import { TABLES, COLUMNS } from '@aibos/kernel-core';
import type { Pool } from 'pg';

// Type-safe table/column references
const TABLE = TABLES.AUDIT_EVENTS;
const COL = COLUMNS.audit_events;

export class SqlAuditRepo implements AuditPort {
  constructor(private db: Pool) { }

  async append(input: AuditWriteInput): Promise<void> {
    // Uses SSOT column names from @aibos/kernel-core
    await this.db.query(
      `INSERT INTO ${TABLE} (
         ${COL.tenant_id}, ${COL.actor_id}, ${COL.action}, ${COL.resource}, 
         ${COL.details}, ${COL.correlation_id}, ${COL.ip_address}, ${COL.created_at}
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        input.tenant_id || null,
        input.actor_id || null,
        input.action,
        input.resource,
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
      conditions.push(`resource = $${paramIndex++}`);
      params.push(input.resource);
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
      `SELECT COUNT(*) as count FROM audit_events ${whereClause}`,
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
      resource: string | null;
      details: unknown;
      correlation_id: string | null;
      ip_address: string | null;
      created_at: Date;
    }>(
      `SELECT id, tenant_id, actor_id, action, resource, details, correlation_id, ip_address, created_at
       FROM audit_events
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, offset]
    );

    const events = result.rows.map((row) => {
      const details = row.details as Record<string, unknown>;
      return {
        tenant_id: row.tenant_id || undefined,
        actor_id: row.actor_id || undefined,
        action: row.action,
        resource: row.resource || '',
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
