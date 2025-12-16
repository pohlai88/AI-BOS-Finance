/**
 * In-Memory Event Bus Adapter
 * 
 * MVP implementation of EventBusPort using in-memory storage.
 * 
 * Features:
 * - Per-tenant event storage
 * - Retention cap (last N events per tenant)
 * - Correlation ID indexing for tracing
 * - Transactional outbox simulation (in-memory)
 * 
 * Later: Swap to Redis/NATS/RabbitMQ without changing kernel-core.
 */

import { v4 as uuidv4 } from 'uuid';
import type { EventBusPort, TransactionContext } from "@aibos/kernel-core";
import type { Event } from "@aibos/kernel-core";

/**
 * In-Memory Outbox Entry (simulates transactional outbox table)
 */
interface OutboxEntry {
  id: string;
  eventType: string;
  payload: Record<string, unknown>;
  correlationId: string;
  tenantId?: string;
  createdAt: Date;
  published: boolean;
  publishedAt?: Date;
}

/**
 * In-Memory Event Bus
 * 
 * Storage structure:
 * - events: Map<tenant_id, Event[]>
 * - correlationIndex: Map<correlation_id, Event[]>
 * - outbox: OutboxEntry[] (simulates transactional outbox table)
 * 
 * Retention: Keep last MAX_EVENTS_PER_TENANT events per tenant
 */
export class InMemoryEventBus implements EventBusPort {
  private events: Map<string, Event[]> = new Map();
  private correlationIndex: Map<string, Event[]> = new Map();
  private outbox: OutboxEntry[] = [];
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
   * Write event to transactional outbox (same DB transaction)
   * 
   * In-memory implementation: Stores in outbox array (simulates outbox table).
   * In production, this would INSERT into kernel.event_outbox within the same transaction.
   * 
   * A separate dispatcher process would read from outbox and publish events.
   */
  async writeToOutbox(
    eventType: string,
    payload: Record<string, unknown>,
    txContext: TransactionContext
  ): Promise<void> {
    const entry: OutboxEntry = {
      id: uuidv4(),
      eventType,
      payload,
      correlationId: txContext.correlationId,
      tenantId: (payload as { tenantId?: string }).tenantId,
      createdAt: new Date(),
      published: false,
    };

    this.outbox.push(entry);

    // Simulate dispatcher: immediately publish (in production, dispatcher does this)
    // In real implementation, dispatcher reads from outbox after commit
    await this.publishFromOutbox(entry);
  }

  /**
   * Publish event from outbox entry (simulates dispatcher)
   */
  private async publishFromOutbox(entry: OutboxEntry): Promise<void> {
    // Convert outbox entry to Event format
    const event: Event = {
      event_id: entry.id,
      event_name: entry.eventType,
      tenant_id: entry.tenantId || '',
      correlation_id: entry.correlationId,
      causation_id: undefined,
      payload: entry.payload,
      created_at: entry.createdAt.toISOString(),
    };

    await this.publish(event);

    // Mark as published
    entry.published = true;
    entry.publishedAt = new Date();
  }

  /**
   * Get outbox entries (for testing/debugging)
   */
  getOutboxEntries(): OutboxEntry[] {
    return [...this.outbox];
  }

  /**
   * Get unpublished outbox entries (for dispatcher simulation)
   */
  getUnpublishedOutboxEntries(): OutboxEntry[] {
    return this.outbox.filter(e => !e.published);
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
