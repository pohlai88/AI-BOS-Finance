// metadata-studio/events/event-bus-factory.ts

/**
 * Event Bus Factory
 *
 * Creates the appropriate event bus implementation based on environment configuration.
 *
 * Supports:
 * - EventEmitter (local, single-instance)
 * - Redis Pub/Sub (distributed, multi-pod)
 * - Redis Streams (distributed + persistence)
 *
 * Usage:
 * ```typescript
 * // .env
 * EVENT_BUS_TYPE=redis  # or 'local' or 'redis-streams'
 * REDIS_URL=redis://localhost:6379
 *
 * // index.ts
 * import { createEventBus } from './events/event-bus-factory';
 *
 * const eventBus = await createEventBus();
 * eventBus.subscribe('metadata.profile.due', handler);
 * await eventBus.publish({...});
 * ```
 *
 * This is the **hexagonal architecture** in action:
 * - Interface (port) stays the same
 * - Implementation (adapter) can be swapped
 * - Callers don't change
 */

import Redis from 'ioredis';
import type { EventBus } from './redis-event-bus';
import { eventBus as localEventBus } from './event-bus';
import { RedisEventBus, RedisStreamsEventBus } from './redis-event-bus';

/**
 * Event bus type (from environment or config).
 */
export type EventBusType = 'local' | 'redis' | 'redis-streams';

/**
 * Event bus configuration.
 */
export interface EventBusConfig {
  /**
   * Event bus type.
   * - 'local': EventEmitter (in-process, single instance)
   * - 'redis': Redis Pub/Sub (distributed, multi-pod)
   * - 'redis-streams': Redis Streams (distributed + persistence)
   */
  type: EventBusType;

  /**
   * Redis connection URL (required for 'redis' and 'redis-streams').
   * Example: redis://localhost:6379
   */
  redisUrl?: string;

  /**
   * Redis channel name (for Pub/Sub).
   * Default: 'aibos.metadata.events'
   */
  redisChannel?: string;

  /**
   * Redis stream key (for Streams).
   * Default: 'aibos:metadata:events'
   */
  redisStreamKey?: string;

  /**
   * Consumer group name (for Streams).
   * Default: 'metadata-studio'
   */
  consumerGroup?: string;

  /**
   * Consumer name (for Streams).
   * Default: auto-generated UUID
   */
  consumerName?: string;
}

/**
 * Get event bus configuration from environment.
 *
 * Environment variables:
 * - EVENT_BUS_TYPE: 'local' | 'redis' | 'redis-streams'
 * - REDIS_URL: Redis connection URL
 * - REDIS_CHANNEL: Redis channel name (Pub/Sub)
 * - REDIS_STREAM_KEY: Redis stream key (Streams)
 * - CONSUMER_GROUP: Consumer group name (Streams)
 * - CONSUMER_NAME: Consumer name (Streams)
 */
export function getEventBusConfig(): EventBusConfig {
  const type = (process.env.EVENT_BUS_TYPE ?? 'local') as EventBusType;

  return {
    type,
    redisUrl: process.env.REDIS_URL,
    redisChannel: process.env.REDIS_CHANNEL ?? 'aibos.metadata.events',
    redisStreamKey: process.env.REDIS_STREAM_KEY ?? 'aibos:metadata:events',
    consumerGroup: process.env.CONSUMER_GROUP ?? 'metadata-studio',
    consumerName: process.env.CONSUMER_NAME, // Auto-generated if not provided
  };
}

/**
 * Create an event bus instance based on configuration.
 *
 * @param config - Event bus configuration (defaults to environment config)
 * @returns EventBus instance
 *
 * @example
 * ```typescript
 * // Use environment config
 * const eventBus = await createEventBus();
 *
 * // Or explicit config
 * const eventBus = await createEventBus({
 *   type: 'redis',
 *   redisUrl: 'redis://localhost:6379',
 * });
 * ```
 */
export async function createEventBus(
  config?: Partial<EventBusConfig>
): Promise<EventBus> {
  const fullConfig: EventBusConfig = {
    ...getEventBusConfig(),
    ...config,
  };

  console.log(`[EventBusFactory] Creating event bus: ${fullConfig.type}`);

  switch (fullConfig.type) {
    case 'local':
      return createLocalEventBus();

    case 'redis':
      return createRedisEventBus(fullConfig);

    case 'redis-streams':
      return createRedisStreamsEventBus(fullConfig);

    default:
      throw new Error(`Unknown event bus type: ${fullConfig.type}`);
  }
}

/**
 * Create a local EventEmitter-based event bus.
 *
 * Use when:
 * - Single Node.js instance
 * - Local development
 * - No need for event persistence
 *
 * Benefits:
 * - Zero dependencies (Node.js native)
 * - Fast (in-process)
 * - Simple
 *
 * Limitations:
 * - Single instance only
 * - No event persistence
 * - Events lost on restart
 */
function createLocalEventBus(): EventBus {
  console.log('[EventBusFactory] Using local EventEmitter ✅');

  // Return the singleton instance from event-bus.ts
  // We need to wrap it to match the EventBus interface
  return {
    async publish(eventLike) {
      const event = {
        ...eventLike,
        id: eventLike.id ?? crypto.randomUUID(),
        createdAt: eventLike.createdAt ?? new Date().toISOString(),
      } as any;
      await localEventBus.emitEvent(event);
    },
    subscribe(type, handler) {
      localEventBus.subscribe(type, handler as any);
    },
    unsubscribe(type, handler) {
      localEventBus.unsubscribe(type, handler as any);
    },
  };
}

/**
 * Create a Redis Pub/Sub-based event bus.
 *
 * Use when:
 * - Multi-pod deployments (horizontal scaling)
 * - Distributed architecture
 * - Cross-service communication
 *
 * Benefits:
 * - Multi-instance support
 * - Real-time event distribution
 * - Lightweight
 *
 * Limitations:
 * - No event persistence (events lost if no subscribers)
 * - At-most-once delivery (fire-and-forget)
 */
function createRedisEventBus(config: EventBusConfig): EventBus {
  if (!config.redisUrl) {
    throw new Error('REDIS_URL is required for redis event bus');
  }

  console.log(`[EventBusFactory] Connecting to Redis: ${config.redisUrl}`);

  // Create separate clients for pub and sub (Redis best practice)
  const pub = new Redis(config.redisUrl, {
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      console.log(`[EventBusFactory] Redis pub retry in ${delay}ms...`);
      return delay;
    },
  });

  const sub = new Redis(config.redisUrl, {
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      console.log(`[EventBusFactory] Redis sub retry in ${delay}ms...`);
      return delay;
    },
  });

  // Handle connection events
  pub.on('connect', () => {
    console.log('[EventBusFactory] Redis publisher connected ✅');
  });

  sub.on('connect', () => {
    console.log('[EventBusFactory] Redis subscriber connected ✅');
  });

  return new RedisEventBus(pub, sub, config.redisChannel);
}

/**
 * Create a Redis Streams-based event bus.
 *
 * Use when:
 * - Need event persistence
 * - Need event replay capability
 * - Need exactly-once processing
 * - Need consumer groups (multiple workers)
 *
 * Benefits:
 * - Event persistence (stored in Redis)
 * - Event replay (from any point in time)
 * - Consumer groups (load balancing)
 * - Guaranteed delivery (ack/nack)
 *
 * Limitations:
 * - More complex than Pub/Sub
 * - Higher Redis memory usage
 * - Requires stream management (trimming old events)
 */
function createRedisStreamsEventBus(config: EventBusConfig): EventBus {
  if (!config.redisUrl) {
    throw new Error('REDIS_URL is required for redis-streams event bus');
  }

  console.log(`[EventBusFactory] Connecting to Redis: ${config.redisUrl}`);

  const redis = new Redis(config.redisUrl, {
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      console.log(`[EventBusFactory] Redis retry in ${delay}ms...`);
      return delay;
    },
  });

  redis.on('connect', () => {
    console.log('[EventBusFactory] Redis Streams connected ✅');
  });

  return new RedisStreamsEventBus(
    redis,
    config.redisStreamKey,
    config.consumerGroup,
    config.consumerName
  );
}

/**
 * Gracefully shut down the event bus.
 * Call this on application shutdown (SIGTERM, SIGINT).
 *
 * @param eventBus - Event bus instance to shut down
 *
 * @example
 * ```typescript
 * const eventBus = await createEventBus();
 *
 * process.on('SIGTERM', async () => {
 *   await shutdownEventBus(eventBus);
 *   process.exit(0);
 * });
 * ```
 */
export async function shutdownEventBus(eventBus: EventBus): Promise<void> {
  console.log('[EventBusFactory] Shutting down event bus...');

  if ('shutdown' in eventBus && typeof eventBus.shutdown === 'function') {
    await eventBus.shutdown();
  }

  console.log('[EventBusFactory] Event bus shutdown complete ✅');
}

