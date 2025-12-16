/**
 * Outbox Dispatcher - Transactional Outbox Pattern Implementation
 * 
 * Polls the finance.payment_outbox table and publishes events.
 * Ensures exactly-once delivery using processed_at marker.
 * 
 * @file packages/kernel-adapters/src/sql/outboxDispatcher.sql.ts
 */

import type { Pool, PoolClient } from 'pg';

// ============================================================================
// 1. TYPES
// ============================================================================

/**
 * Outbox event record from database
 */
export interface OutboxEvent {
  id: string;
  tenantId: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  payload: Record<string, unknown>;
  correlationId: string | null;
  createdAt: Date;
  retryCount: number;
  lastError: string | null;
}

/**
 * Event handler function type
 */
export type EventHandler = (event: OutboxEvent) => Promise<void>;

/**
 * Dispatcher configuration
 */
export interface OutboxDispatcherConfig {
  /** Database connection pool */
  db: Pool;
  /** Polling interval in milliseconds (default: 5000) */
  pollIntervalMs?: number;
  /** Batch size for each poll (default: 100) */
  batchSize?: number;
  /** Max retry count before giving up (default: 5) */
  maxRetries?: number;
  /** Event handlers by event type */
  handlers: Map<string, EventHandler>;
  /** Default handler for unmatched events */
  defaultHandler?: EventHandler;
  /** Logger function */
  logger?: (message: string, data?: Record<string, unknown>) => void;
}

// ============================================================================
// 2. OUTBOX DISPATCHER
// ============================================================================

/**
 * OutboxDispatcher - Polls and publishes events from the transactional outbox
 * 
 * Usage:
 * ```typescript
 * const dispatcher = new OutboxDispatcher({
 *   db: pool,
 *   handlers: new Map([
 *     ['finance.ap.payment.created', async (event) => {
 *       await notificationService.notify(event);
 *     }],
 *   ]),
 * });
 * 
 * await dispatcher.start();
 * // ... later
 * await dispatcher.stop();
 * ```
 */
export class OutboxDispatcher {
  private db: Pool;
  private pollIntervalMs: number;
  private batchSize: number;
  private maxRetries: number;
  private handlers: Map<string, EventHandler>;
  private defaultHandler?: EventHandler;
  private logger: (message: string, data?: Record<string, unknown>) => void;

  private isRunning: boolean = false;
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private processingPromise: Promise<void> | null = null;

  constructor(config: OutboxDispatcherConfig) {
    this.db = config.db;
    this.pollIntervalMs = config.pollIntervalMs ?? 5000;
    this.batchSize = config.batchSize ?? 100;
    this.maxRetries = config.maxRetries ?? 5;
    this.handlers = config.handlers;
    this.defaultHandler = config.defaultHandler;
    this.logger = config.logger ?? console.log;
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  /**
   * Start the dispatcher (begins polling)
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger('[OutboxDispatcher] Already running');
      return;
    }

    this.isRunning = true;
    this.logger('[OutboxDispatcher] Starting...');

    // Initial poll
    await this.poll();

    // Schedule next poll
    this.schedulePoll();
  }

  /**
   * Stop the dispatcher (gracefully)
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    this.logger('[OutboxDispatcher] Stopping...');

    // Clear scheduled poll
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }

    // Wait for current processing to complete
    if (this.processingPromise) {
      await this.processingPromise;
    }

    this.logger('[OutboxDispatcher] Stopped');
  }

  // ==========================================================================
  // POLLING
  // ==========================================================================

  private schedulePoll(): void {
    if (!this.isRunning) return;

    this.pollTimer = setTimeout(async () => {
      await this.poll();
      this.schedulePoll();
    }, this.pollIntervalMs);
  }

  private async poll(): Promise<void> {
    if (!this.isRunning) return;

    this.processingPromise = this.processEvents();
    await this.processingPromise;
    this.processingPromise = null;
  }

  // ==========================================================================
  // EVENT PROCESSING
  // ==========================================================================

  private async processEvents(): Promise<void> {
    let client: PoolClient | null = null;

    try {
      client = await this.db.connect();

      // Fetch unprocessed events
      const result = await client.query<{
        id: string;
        tenant_id: string;
        event_type: string;
        aggregate_id: string;
        aggregate_type: string;
        payload: Record<string, unknown>;
        correlation_id: string | null;
        created_at: Date;
        retry_count: number;
        last_error: string | null;
      }>(`
        SELECT id, tenant_id, event_type, aggregate_id, aggregate_type,
               payload, correlation_id, created_at, retry_count, last_error
        FROM finance.payment_outbox
        WHERE processed_at IS NULL
          AND retry_count < $1
        ORDER BY created_at ASC
        LIMIT $2
        FOR UPDATE SKIP LOCKED
      `, [this.maxRetries, this.batchSize]);

      if (result.rows.length === 0) {
        return;
      }

      this.logger(`[OutboxDispatcher] Processing ${result.rows.length} events`);

      // Process each event
      for (const row of result.rows) {
        const event: OutboxEvent = {
          id: row.id,
          tenantId: row.tenant_id,
          eventType: row.event_type,
          aggregateId: row.aggregate_id,
          aggregateType: row.aggregate_type,
          payload: row.payload,
          correlationId: row.correlation_id,
          createdAt: row.created_at,
          retryCount: row.retry_count,
          lastError: row.last_error,
        };

        await this.processEvent(client, event);
      }
    } catch (error) {
      this.logger('[OutboxDispatcher] Error polling events', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  private async processEvent(client: PoolClient, event: OutboxEvent): Promise<void> {
    try {
      // Get handler for this event type
      const handler = this.handlers.get(event.eventType) ?? this.defaultHandler;

      if (!handler) {
        this.logger(`[OutboxDispatcher] No handler for event type: ${event.eventType}`, {
          eventId: event.id,
        });
        // Mark as processed (no handler = skip)
        await this.markAsProcessed(client, event.id);
        return;
      }

      // Execute handler
      await handler(event);

      // Mark as processed
      await this.markAsProcessed(client, event.id);

      this.logger(`[OutboxDispatcher] Event processed: ${event.eventType}`, {
        eventId: event.id,
        aggregateId: event.aggregateId,
      });
    } catch (error) {
      // Increment retry count and record error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await client.query(`
        UPDATE finance.payment_outbox
        SET retry_count = retry_count + 1,
            last_error = $2
        WHERE id = $1
      `, [event.id, errorMessage]);

      this.logger(`[OutboxDispatcher] Event failed: ${event.eventType}`, {
        eventId: event.id,
        error: errorMessage,
        retryCount: event.retryCount + 1,
      });
    }
  }

  private async markAsProcessed(client: PoolClient, eventId: string): Promise<void> {
    await client.query(`
      UPDATE finance.payment_outbox
      SET processed_at = NOW(),
          processed_by = 'outbox-dispatcher'
      WHERE id = $1
    `, [eventId]);
  }

  // ==========================================================================
  // MANUAL OPERATIONS
  // ==========================================================================

  /**
   * Manually process a single event by ID
   */
  async processById(eventId: string): Promise<boolean> {
    let client: PoolClient | null = null;

    try {
      client = await this.db.connect();

      const result = await client.query<{
        id: string;
        tenant_id: string;
        event_type: string;
        aggregate_id: string;
        aggregate_type: string;
        payload: Record<string, unknown>;
        correlation_id: string | null;
        created_at: Date;
        retry_count: number;
        last_error: string | null;
      }>(`
        SELECT id, tenant_id, event_type, aggregate_id, aggregate_type,
               payload, correlation_id, created_at, retry_count, last_error
        FROM finance.payment_outbox
        WHERE id = $1
        FOR UPDATE
      `, [eventId]);

      if (result.rows.length === 0) {
        return false;
      }

      const row = result.rows[0];
      const event: OutboxEvent = {
        id: row.id,
        tenantId: row.tenant_id,
        eventType: row.event_type,
        aggregateId: row.aggregate_id,
        aggregateType: row.aggregate_type,
        payload: row.payload,
        correlationId: row.correlation_id,
        createdAt: row.created_at,
        retryCount: row.retry_count,
        lastError: row.last_error,
      };

      await this.processEvent(client, event);
      return true;
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  /**
   * Get statistics about the outbox
   */
  async getStats(): Promise<{
    pending: number;
    processed: number;
    failed: number;
  }> {
    const result = await this.db.query<{
      status: string;
      count: string;
    }>(`
      SELECT 
        CASE 
          WHEN processed_at IS NOT NULL THEN 'processed'
          WHEN retry_count >= $1 THEN 'failed'
          ELSE 'pending'
        END as status,
        COUNT(*) as count
      FROM finance.payment_outbox
      GROUP BY 1
    `, [this.maxRetries]);

    const stats = {
      pending: 0,
      processed: 0,
      failed: 0,
    };

    for (const row of result.rows) {
      stats[row.status as keyof typeof stats] = parseInt(row.count, 10);
    }

    return stats;
  }
}

// ============================================================================
// 3. FACTORY FUNCTION
// ============================================================================

/**
 * Create an OutboxDispatcher with default configuration
 */
export function createOutboxDispatcher(
  db: Pool,
  handlers: Map<string, EventHandler>,
  options?: Partial<OutboxDispatcherConfig>
): OutboxDispatcher {
  return new OutboxDispatcher({
    db,
    handlers,
    ...options,
  });
}
