// metadata-studio/events/index.ts

/**
 * Event System - Singleton Export
 *
 * Provides a singleton event bus instance that automatically adapts based on environment:
 * - Local development: EventEmitter (in-process)
 * - Production: Redis Pub/Sub or Redis Streams (distributed)
 *
 * Hexagonal Architecture Note:
 * ================================
 * - **Single-process (monorepo):** Use this shared singleton
 *   - Kernel and Metadata Studio in same Node.js process → share eventBus
 *   - Events propagate in-memory (EventEmitter)
 *
 * - **Multi-process (distributed):** Each component creates its own instance
 *   - Kernel (separate service) → new RedisEventBus(pub, sub)
 *   - Metadata Studio (separate service) → new RedisEventBus(pub, sub)
 *   - Both connect to same Redis → events propagate via Redis
 *
 * Environment Variables:
 * - EVENT_BUS_TYPE: 'local' | 'redis' | 'redis-streams' (default: 'local')
 * - REDIS_URL: Redis connection URL (required for 'redis' | 'redis-streams')
 *
 * Usage:
 * ```typescript
 * import { eventBus } from '@aibos/metadata-studio/events';
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

import { eventBus as localEventBus } from './event-bus';
import type { EventBus } from './redis-event-bus';

/**
 * Singleton event bus instance.
 *
 * Environment-based:
 * - EVENT_BUS_TYPE=local → EventEmitter (default)
 * - EVENT_BUS_TYPE=redis → Redis Pub/Sub
 * - EVENT_BUS_TYPE=redis-streams → Redis Streams
 *
 * For distributed deployments, use createEventBus() instead:
 * ```typescript
 * import { createEventBus } from '@aibos/metadata-studio/events';
 * const eventBus = await createEventBus({ type: 'redis', redisUrl: '...' });
 * ```
 */
export let eventBus: EventBus;

/**
 * Initialize the event bus singleton.
 * Call this once at application startup.
 *
 * @param config - Optional config override (defaults to environment)
 *
 * @example
 * ```typescript
 * // Use environment config
 * await initializeEventBus();
 *
 * // Or override
 * await initializeEventBus({ type: 'redis', redisUrl: 'redis://localhost:6379' });
 * ```
 */
export async function initializeEventBus(config?: {
  type?: 'local' | 'redis' | 'redis-streams';
  redisUrl?: string;
}): Promise<void> {
  const type = config?.type ?? process.env.EVENT_BUS_TYPE ?? 'local';

  console.log(`[EventSystem] Initializing event bus: ${type}`);

  if (type === 'local') {
    // Use the existing EventEmitter singleton
    // We need to wrap it to match the EventBus interface
    eventBus = {
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

    console.log('[EventSystem] Event bus initialized (local) ✅');
  } else if (type === 'redis' || type === 'redis-streams') {
    // For Redis, use the factory
    const { createEventBus } = await import('./event-bus-factory');
    eventBus = await createEventBus(config);

    console.log(`[EventSystem] Event bus initialized (${type}) ✅`);
  } else {
    throw new Error(`Unknown EVENT_BUS_TYPE: ${type}`);
  }
}

/**
 * Import subscriber registration functions
 */
import { registerProfileSubscribers } from './profile.subscriber';

/**
 * Re-export for external use
 */
export { registerProfileSubscribers };

// TODO: Add more subscribers as we build them
// export { registerMetadataSubscribers } from './metadata.subscriber';
// export { registerApprovalSubscribers } from './approval.subscriber';

/**
 * Initialize the complete event system:
 * 1. Initialize event bus (local or Redis)
 * 2. Register all subscribers
 *
 * Call this once during application bootstrap.
 *
 * @example
 * ```typescript
 * // index.ts
 * await initializeEventSystem();
 * ```
 */
export async function initializeEventSystem(): Promise<void> {
  console.log('[EventSystem] Initializing event system...');

  // 1. Initialize event bus
  await initializeEventBus();

  // 2. Register subscribers
  registerProfileSubscribers();

  // TODO: Register other subscribers
  // registerMetadataSubscribers();
  // registerApprovalSubscribers();

  console.log('[EventSystem] Event system initialized ✅');
}

/**
 * Re-export event bus factory for advanced use cases
 */
export { createEventBus, shutdownEventBus } from './event-bus-factory';
export type { EventBus, EventBusConfig, EventBusType } from './event-bus-factory';

