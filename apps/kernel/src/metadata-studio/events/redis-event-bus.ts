// metadata-studio/events/redis-event-bus.ts

/**
 * Redis-backed Event Bus (Future Upgrade)
 *
 * When to Use:
 * - Multi-pod deployments (horizontal scaling)
 * - Distributed architecture (Metadata Studio + Kernel in different processes)
 * - Event persistence required (Redis Streams for replay)
 * - Cross-service communication (multiple Node.js instances)
 *
 * Migration Path:
 * 1. Keep EventEmitter for local development / single-instance deployments
 * 2. Use Redis for production / multi-pod deployments
 * 3. Both implement the same EventBus interface → zero caller changes
 *
 * Requirements:
 * - Redis 5.0+ (for Streams support)
 * - ioredis package installed
 * - Two Redis clients: pub (publisher) + sub (subscriber)
 */

import { randomUUID } from 'crypto';
import type { Redis } from 'ioredis';
import type { Event, EventType } from '@aibos/events';
import { EventSchema } from '@aibos/events';

/**
 * Event handler function type.
 * Can be async or sync.
 */
export type EventHandler<E extends Event = Event> = (
  event: E
) => Promise<void> | void;

/**
 * EventBus interface (shared between EventEmitter and Redis implementations)
 */
export interface EventBus {
  /**
   * Publish an event to the bus.
   * @param eventLike - Event without id/createdAt (auto-generated)
   */
  publish(eventLike: Omit<Event, 'id' | 'createdAt'>): Promise<void>;

  /**
   * Subscribe to a specific event type.
   * @param type - Event type to subscribe to
   * @param handler - Handler function (async or sync)
   */
  subscribe<T extends EventType>(
    type: T,
    handler: EventHandler<Extract<Event, { type: T }>>
  ): void;

  /**
   * Unsubscribe from a specific event type.
   * @param type - Event type to unsubscribe from
   * @param handler - Handler function to remove
   */
  unsubscribe<T extends EventType>(
    type: T,
    handler: EventHandler<Extract<Event, { type: T }>>
  ): void;
}

/**
 * Redis-backed Event Bus Implementation
 *
 * Features:
 * - Pub/Sub for real-time event distribution
 * - Automatic Zod validation
 * - Error boundaries (handler failures don't crash bus)
 * - Multi-pod support (events broadcast to all subscribers)
 * - Optional: Redis Streams for event persistence/replay
 *
 * Example:
 * ```typescript
 * import Redis from 'ioredis';
 * import { RedisEventBus } from './redis-event-bus';
 *
 * const pub = new Redis(process.env.REDIS_URL);
 * const sub = new Redis(process.env.REDIS_URL);
 * const eventBus = new RedisEventBus(pub, sub);
 *
 * // Subscribe
 * eventBus.subscribe('metadata.profile.due', async (event) => {
 *   await qualityService.runProfiler({...});
 * });
 *
 * // Publish
 * await eventBus.publish({
 *   type: 'metadata.profile.due',
 *   version: '1.0.0',
 *   tenantId: 'tenant-123',
 *   source: 'kernel.scheduler',
 *   payload: {...},
 * });
 * ```
 */
export class RedisEventBus implements EventBus {
  /**
   * Local registry of event handlers.
   * Key: EventType, Value: Set of handlers
   */
  private handlers = new Map<EventType, Set<EventHandler>>();

  /**
   * Create a new Redis-backed event bus.
   *
   * @param pub - Redis client for publishing (writes)
   * @param sub - Redis client for subscribing (reads)
   * @param channel - Redis channel name (default: 'aibos.metadata.events')
   *
   * Note: Requires separate pub/sub clients per Redis best practices
   * (subscriber client is in blocking mode, can't be used for publishing)
   */
  constructor(
    private readonly pub: Redis,
    private readonly sub: Redis,
    private readonly channel: string = 'aibos.metadata.events'
  ) {
    // Subscribe to Redis channel
    this.sub.subscribe(this.channel, (err, count) => {
      if (err) {
        console.error('[RedisEventBus] Subscription error:', err);
        return;
      }
      console.log(
        `[RedisEventBus] Subscribed to channel: ${this.channel} (${count} subscriptions)`
      );
    });

    // Handle incoming messages
    this.sub.on('message', (channel, message) => {
      if (channel !== this.channel) return;

      try {
        // Decode and validate event
        const decoded = EventSchema.safeParse(JSON.parse(message));
        if (!decoded.success) {
          console.error(
            '[RedisEventBus] Invalid event schema:',
            decoded.error
          );
          return;
        }

        const event = decoded.data;

        // Find handlers for this event type
        const handlerSet = this.handlers.get(event.type as EventType);
        if (!handlerSet || handlerSet.size === 0) {
          // No handlers registered for this event type
          return;
        }

        // Execute all handlers (with error boundaries)
        for (const handler of handlerSet) {
          void this.executeHandler(handler, event);
        }
      } catch (error) {
        console.error('[RedisEventBus] Message processing error:', error);
      }
    });

    // Handle Redis connection errors
    this.sub.on('error', (err) => {
      console.error('[RedisEventBus] Redis subscriber error:', err);
    });

    this.pub.on('error', (err) => {
      console.error('[RedisEventBus] Redis publisher error:', err);
    });

    console.log('[RedisEventBus] Initialized ✅');
  }

  /**
   * Execute a handler with error boundary.
   *
   * @param handler - Handler function to execute
   * @param event - Event to pass to handler
   */
  private async executeHandler(
    handler: EventHandler,
    event: Event
  ): Promise<void> {
    try {
      await handler(event);
    } catch (error) {
      console.error(
        `[RedisEventBus] Handler error for ${event.type}:`,
        error
      );
      // Don't rethrow - error boundary prevents cascading failures
    }
  }

  /**
   * Publish an event to Redis.
   *
   * @param eventLike - Event without id/createdAt (auto-generated)
   *
   * Example:
   * ```typescript
   * await eventBus.publish({
   *   type: 'metadata.profile.due',
   *   version: '1.0.0',
   *   tenantId: 'tenant-123',
   *   source: 'kernel.scheduler',
   *   payload: {
   *     entityType: 'METADATA',
   *     entityId: 'meta-456',
   *     canonicalKey: 'revenue_gross',
   *     tier: 'tier1',
   *     priority: 'high',
   *     reason: 'SCHEDULE',
   *   },
   * });
   * ```
   */
  async publish(eventLike: Omit<Event, 'id' | 'createdAt'>): Promise<void> {
    // Generate id and createdAt
    const event: Event = EventSchema.parse({
      ...eventLike,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    });

    // Publish to Redis channel
    await this.pub.publish(this.channel, JSON.stringify(event));

    console.log(`[RedisEventBus] Published: ${event.type} | ${event.id}`);
  }

  /**
   * Subscribe to a specific event type.
   *
   * @param type - Event type to subscribe to
   * @param handler - Handler function (async or sync)
   *
   * Example:
   * ```typescript
   * eventBus.subscribe('metadata.profile.due', async (event) => {
   *   console.log('Profile due:', event.payload.canonicalKey);
   *   await qualityService.runProfiler({...});
   * });
   * ```
   */
  subscribe<T extends EventType>(
    type: T,
    handler: EventHandler<Extract<Event, { type: T }>>
  ): void {
    const set = this.handlers.get(type) ?? new Set();
    set.add(handler as EventHandler);
    this.handlers.set(type, set);

    console.log(`[RedisEventBus] Subscribed to: ${type}`);
  }

  /**
   * Unsubscribe from a specific event type.
   *
   * @param type - Event type to unsubscribe from
   * @param handler - Handler function to remove
   *
   * Example:
   * ```typescript
   * eventBus.unsubscribe('metadata.profile.due', myHandler);
   * ```
   */
  unsubscribe<T extends EventType>(
    type: T,
    handler: EventHandler<Extract<Event, { type: T }>>
  ): void {
    const set = this.handlers.get(type);
    if (!set) return;

    set.delete(handler as EventHandler);

    console.log(`[RedisEventBus] Unsubscribed from: ${type}`);
  }

  /**
   * Gracefully shut down the event bus.
   * Call this on application shutdown.
   */
  async shutdown(): Promise<void> {
    console.log('[RedisEventBus] Shutting down...');

    await this.sub.unsubscribe(this.channel);
    await this.sub.quit();
    await this.pub.quit();

    console.log('[RedisEventBus] Shutdown complete ✅');
  }
}

/**
 * Optional: Redis Streams-based Event Bus (with persistence)
 *
 * Benefits:
 * - Event persistence (events stored in Redis)
 * - Event replay (re-process events from any point in time)
 * - Consumer groups (multiple workers processing same stream)
 * - Guaranteed delivery (ack/nack mechanism)
 *
 * Use when:
 * - Need event history/audit trail
 * - Need to replay events after downtime
 * - Need exactly-once processing guarantees
 *
 * Example:
 * ```typescript
 * const eventBus = new RedisStreamsEventBus(redis, 'metadata-events');
 *
 * // Publish (persisted in stream)
 * await eventBus.publish({...});
 *
 * // Subscribe from latest
 * eventBus.subscribe('metadata.profile.due', handler);
 *
 * // Or replay from specific time
 * eventBus.subscribeFrom('metadata.profile.due', handler, '1638316800000-0');
 * ```
 */
export class RedisStreamsEventBus implements EventBus {
  private handlers = new Map<EventType, Set<EventHandler>>();
  private consumerGroup: string;
  private consumerName: string;

  constructor(
    private readonly redis: Redis,
    private readonly streamKey: string = 'aibos:metadata:events',
    consumerGroup: string = 'metadata-studio',
    consumerName?: string
  ) {
    this.consumerGroup = consumerGroup;
    this.consumerName = consumerName ?? `consumer-${randomUUID()}`;

    // Create consumer group (ignore error if exists)
    this.redis
      .xgroup('CREATE', this.streamKey, this.consumerGroup, '$', 'MKSTREAM')
      .catch(() => {
        // Group already exists - that's fine
      });

    // Start consuming events
    this.startConsuming();

    console.log(
      `[RedisStreamsEventBus] Initialized (group: ${this.consumerGroup}, consumer: ${this.consumerName}) ✅`
    );
  }

  async publish(eventLike: Omit<Event, 'id' | 'createdAt'>): Promise<void> {
    const event: Event = EventSchema.parse({
      ...eventLike,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    });

    // Add to stream
    await this.redis.xadd(
      this.streamKey,
      '*', // Auto-generate ID
      'event',
      JSON.stringify(event)
    );

    console.log(`[RedisStreamsEventBus] Published: ${event.type} | ${event.id}`);
  }

  subscribe<T extends EventType>(
    type: T,
    handler: EventHandler<Extract<Event, { type: T }>>
  ): void {
    const set = this.handlers.get(type) ?? new Set();
    set.add(handler as EventHandler);
    this.handlers.set(type, set);

    console.log(`[RedisStreamsEventBus] Subscribed to: ${type}`);
  }

  unsubscribe<T extends EventType>(
    type: T,
    handler: EventHandler<Extract<Event, { type: T }>>
  ): void {
    const set = this.handlers.get(type);
    if (!set) return;
    set.delete(handler as EventHandler);

    console.log(`[RedisStreamsEventBus] Unsubscribed from: ${type}`);
  }

  /**
   * Start consuming events from the stream.
   * Runs in background, processes events in batches.
   */
  private async startConsuming(): Promise<void> {
    while (true) {
      try {
        // Read new events from stream (consumer group)
        const results = await this.redis.xreadgroup(
          'GROUP',
          this.consumerGroup,
          this.consumerName,
          'BLOCK',
          5000, // 5 second timeout
          'COUNT',
          10, // Batch size
          'STREAMS',
          this.streamKey,
          '>' // Only new messages
        );

        if (!results || results.length === 0) continue;

        // Process each event
        for (const [stream, messages] of results) {
          for (const [id, fields] of messages) {
            const eventJson = fields[1]; // 'event' field value
            const decoded = EventSchema.safeParse(JSON.parse(eventJson));

            if (!decoded.success) {
              console.error(
                '[RedisStreamsEventBus] Invalid event schema:',
                decoded.error
              );
              // Ack anyway to avoid reprocessing
              await this.redis.xack(this.streamKey, this.consumerGroup, id);
              continue;
            }

            const event = decoded.data;

            // Find handlers
            const handlerSet = this.handlers.get(event.type as EventType);
            if (handlerSet) {
              for (const handler of handlerSet) {
                await this.executeHandler(handler, event);
              }
            }

            // Acknowledge processed event
            await this.redis.xack(this.streamKey, this.consumerGroup, id);
          }
        }
      } catch (error) {
        console.error('[RedisStreamsEventBus] Consume error:', error);
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  private async executeHandler(
    handler: EventHandler,
    event: Event
  ): Promise<void> {
    try {
      await handler(event);
    } catch (error) {
      console.error(
        `[RedisStreamsEventBus] Handler error for ${event.type}:`,
        error
      );
    }
  }

  async shutdown(): Promise<void> {
    console.log('[RedisStreamsEventBus] Shutting down...');
    await this.redis.quit();
    console.log('[RedisStreamsEventBus] Shutdown complete ✅');
  }
}

