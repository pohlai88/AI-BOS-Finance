/**
 * Event Bus Port
 * 
 * Interface for event bus adapter.
 * Implementations can be in-memory, Redis, NATS, RabbitMQ, etc.
 * 
 * Anti-Gravity:
 * - This is a port (interface only)
 * - NO implementation details
 * - NO framework imports
 * 
 * CRITICAL: This port writes to an outbox table within the same database transaction.
 * A separate dispatcher process publishes events from the outbox after commit.
 * 
 * This ensures: (1) Events are never lost, (2) Events are published exactly-once,
 * (3) Domain mutation and event write are atomic.
 */

import type { Event } from "../domain/event.ts";
import type { TransactionContext } from './paymentRepositoryPort';

/**
 * Event Bus Port
 * 
 * Responsibilities:
 * - Write events to transactional outbox (same DB transaction)
 * - Provide basic querying (for debugging)
 * - Support tenant isolation
 */
export interface EventBusPort {
  /**
   * Publish (store) an event (legacy method - use writeToOutbox for transactional operations)
   * 
   * @param event - Event to publish
   * @returns Promise<void>
   */
  publish(event: Event): Promise<void>;

  /**
   * Write event to transactional outbox (same DB transaction)
   * 
   * CRITICAL: This method writes to an outbox table within the same database transaction
   * as the business operation. A separate dispatcher process publishes events from the
   * outbox after commit.
   * 
   * This ensures:
   * - Events are never lost (even if dispatcher is down)
   * - Events are published exactly-once (idempotent)
   * - Domain mutation and event write are atomic (same transaction)
   * 
   * @param eventType - Event type (e.g., 'finance.ap.payment.approved')
   * @param payload - Event payload (JSON-serializable)
   * @param txContext - Transaction context (same transaction as business operation)
   * 
   * @throws Error if outbox write fails (will cause transaction rollback)
   * 
   * @example
   * ```typescript
   * await paymentRepo.withTransaction(async (txContext) => {
   *   // Update payment
   *   await paymentRepo.updateStatus(paymentId, newStatus, txContext);
   *   
   *   // Write event to outbox (same transaction)
   *   await eventBus.writeToOutbox(
   *     'finance.ap.payment.approved',
   *     { paymentId, approvedBy: userId },
   *     txContext
   *   );
   *   
   *   // Transaction commits (both payment + outbox are atomic)
   *   // Dispatcher will publish outbox events after commit
   * });
   * ```
   */
  writeToOutbox(
    eventType: string,
    payload: Record<string, unknown>,
    txContext: TransactionContext
  ): Promise<void>;

  /**
   * List events for a tenant (for debugging/audit)
   * 
   * @param tenant_id - Tenant ID
   * @param limit - Maximum number of events to return (default: 50)
   * @returns Promise<Event[]>
   */
  list(tenant_id: string, limit?: number): Promise<Event[]>;

  /**
   * Get events by correlation ID (for tracing)
   * 
   * @param correlation_id - Correlation ID
   * @returns Promise<Event[]>
   */
  listByCorrelationId(correlation_id: string): Promise<Event[]>;
}
