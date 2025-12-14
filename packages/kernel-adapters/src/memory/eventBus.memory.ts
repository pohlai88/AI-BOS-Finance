/**
 * In-Memory Event Bus Adapter
 * 
 * MVP implementation of EventBusPort using in-memory storage.
 * 
 * Features:
 * - Per-tenant event storage
 * - Retention cap (last N events per tenant)
 * - Correlation ID indexing for tracing
 * 
 * Later: Swap to Redis/NATS/RabbitMQ without changing kernel-core.
 */

import type { EventBusPort } from "@aibos/kernel-core";
import type { Event } from "@aibos/kernel-core";

/**
 * In-Memory Event Bus
 * 
 * Storage structure:
 * - events: Map<tenant_id, Event[]>
 * - correlationIndex: Map<correlation_id, Event[]>
 * 
 * Retention: Keep last MAX_EVENTS_PER_TENANT events per tenant
 */
export class InMemoryEventBus implements EventBusPort {
  private events: Map<string, Event[]> = new Map();
  private correlationIndex: Map<string, Event[]> = new Map();
  private readonly maxEventsPerTenant: number;

  constructor(maxEventsPerTenant: number = 1000) {
    this.maxEventsPerTenant = maxEventsPerTenant;
  }

  /**
   * Publish (store) an event
   */
  async publish(event: Event): Promise<void> {
    // Store in tenant partition
    const tenantEvents = this.events.get(event.tenant_id) ?? [];
    tenantEvents.push(event);

    // Apply retention cap (FIFO)
    if (tenantEvents.length > this.maxEventsPerTenant) {
      tenantEvents.shift(); // remove oldest
    }

    this.events.set(event.tenant_id, tenantEvents);

    // Index by correlation ID
    const correlationEvents = this.correlationIndex.get(event.correlation_id) ?? [];
    correlationEvents.push(event);
    this.correlationIndex.set(event.correlation_id, correlationEvents);

    console.log("[EventBus] Event published:", {
      event_id: event.event_id,
      event_name: event.event_name,
      tenant_id: event.tenant_id,
      correlation_id: event.correlation_id,
    });
  }

  /**
   * List events for a tenant
   * 
   * Returns events in reverse chronological order (newest first)
   */
  async list(tenant_id: string, limit: number = 50): Promise<Event[]> {
    const tenantEvents = this.events.get(tenant_id) ?? [];
    return tenantEvents
      .slice(-limit) // get last N events
      .reverse(); // newest first
  }

  /**
   * List events by correlation ID (for tracing)
   */
  async listByCorrelationId(correlation_id: string): Promise<Event[]> {
    return this.correlationIndex.get(correlation_id) ?? [];
  }

  /**
   * Get total event count (for testing/debugging)
   */
  getTotalEventCount(): number {
    let total = 0;
    for (const events of this.events.values()) {
      total += events.length;
    }
    return total;
  }

  /**
   * Reset (for testing)
   */
  reset(): void {
    this.events.clear();
    this.correlationIndex.clear();
  }
}
