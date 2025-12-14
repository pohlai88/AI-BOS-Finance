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
 */

import type { Event } from "../domain/event.ts";

/**
 * Event Bus Port
 * 
 * Responsibilities:
 * - Persist events
 * - Provide basic querying (for debugging)
 * - Support tenant isolation
 */
export interface EventBusPort {
  /**
   * Publish (store) an event
   * 
   * @param event - Event to publish
   * @returns Promise<void>
   */
  publish(event: Event): Promise<void>;

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
