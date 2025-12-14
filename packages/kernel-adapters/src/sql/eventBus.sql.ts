/**
 * SQL Event Bus
 * 
 * PostgreSQL implementation of EventBusPort.
 * Stores events in the events table.
 */

import type { EventBusPort } from '@aibos/kernel-core';
import type { Event } from '@aibos/kernel-core';
import type { Pool } from 'pg';

export class SqlEventBus implements EventBusPort {
  constructor(private db: Pool) {}

  async publish(event: Event): Promise<void> {
    await this.db.query(
      `INSERT INTO events (id, tenant_id, event_type, payload, correlation_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        event.event_id,
        event.tenant_id,
        event.event_name,
        JSON.stringify(event.payload),
        event.correlation_id,
        event.published_at,
      ]
    );
  }

  async list(tenant_id: string, limit: number = 50): Promise<Event[]> {
    const result = await this.db.query<{
      id: string;
      tenant_id: string;
      event_type: string;
      payload: unknown;
      correlation_id: string | null;
      created_at: Date;
    }>(
      `SELECT id, tenant_id, event_type, payload, correlation_id, created_at
       FROM events
       WHERE tenant_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [tenant_id, limit]
    );

    return result.rows.map((row) => ({
      event_id: row.id,
      version: '1.0' as const,
      event_name: row.event_type,
      source: 'kernel' as const, // Default source
      tenant_id: row.tenant_id,
      actor_id: undefined,
      correlation_id: row.correlation_id || '',
      timestamp: row.created_at.toISOString(),
      published_at: row.created_at.toISOString(),
      payload: row.payload,
    }));
  }

  async listByCorrelationId(correlation_id: string): Promise<Event[]> {
    const result = await this.db.query<{
      id: string;
      tenant_id: string;
      event_type: string;
      payload: unknown;
      correlation_id: string | null;
      created_at: Date;
    }>(
      `SELECT id, tenant_id, event_type, payload, correlation_id, created_at
       FROM events
       WHERE correlation_id = $1
       ORDER BY created_at ASC`,
      [correlation_id]
    );

    return result.rows.map((row) => ({
      event_id: row.id,
      version: '1.0' as const,
      event_name: row.event_type,
      source: 'kernel' as const,
      tenant_id: row.tenant_id,
      actor_id: undefined,
      correlation_id: row.correlation_id || '',
      timestamp: row.created_at.toISOString(),
      published_at: row.created_at.toISOString(),
      payload: row.payload,
    }));
  }
}
