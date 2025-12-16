/**
 * SQL Event Bus
 * 
 * PostgreSQL implementation of EventBusPort.
 * Stores events in the events table.
 */

import type { EventBusPort, TransactionContext } from '@aibos/kernel-core';
import type { Event } from '@aibos/kernel-core';
import type { Pool, PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';

export class SqlEventBus implements EventBusPort {
  constructor(private db: Pool) { }

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

  /**
   * Write event to transactional outbox (same DB transaction)
   * 
   * CRITICAL: This method writes to an outbox table within the same database transaction
   * as the business operation. A separate dispatcher process publishes events from the
   * outbox after commit.
   * 
   * For payment events, uses finance.payment_outbox.
   * For other events, uses kernel.event_outbox (if exists) or events table with unpublished flag.
   */
  async writeToOutbox(
    eventType: string,
    payload: Record<string, unknown>,
    txContext: TransactionContext
  ): Promise<void> {
    const client = txContext.tx as PoolClient;
    const id = uuidv4();
    const tenantId = (payload as { tenantId?: string }).tenantId ||
      (payload as { tenant_id?: string }).tenant_id ||
      null;

    // Determine which outbox table to use based on event type
    // Payment events go to finance.payment_outbox
    // Other events go to kernel.event_outbox (or events table if outbox doesn't exist)
    if (eventType.startsWith('finance.ap.payment.')) {
      // Use finance.payment_outbox for payment events
      const paymentId = (payload as { paymentId?: string }).paymentId ||
        (payload as { payment_id?: string }).payment_id;

      if (!paymentId) {
        throw new Error(`Payment event ${eventType} must include paymentId in payload`);
      }

      await client.query(
        `INSERT INTO finance.payment_outbox (
          id, tenant_id, event_type, aggregate_id, aggregate_type,
          payload, correlation_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          id,
          tenantId,
          eventType,
          paymentId,
          'payment',
          JSON.stringify(payload),
          txContext.correlationId,
        ]
      );
    } else {
      // For non-payment events, write to kernel.events table
      // The dispatcher will read from this table and publish events
      // Note: In a future migration, we may add an event_outbox table with published flag
      await client.query(
        `INSERT INTO kernel.events (
          id, tenant_id, event_type, payload, correlation_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          id,
          tenantId || '',
          eventType,
          JSON.stringify(payload),
          txContext.correlationId,
        ]
      );
    }
  }
}
