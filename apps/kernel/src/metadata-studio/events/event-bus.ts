// metadata-studio/events/event-bus.ts

/**
 * Internal Event Bus for Metadata Studio.
 *
 * Simple EventEmitter-based event bus for monorepo deployments.
 * Can be replaced with Redis Pub/Sub or Kafka for distributed deployments.
 *
 * Design:
 * - In-process event bus (single Node.js instance)
 * - Type-safe event emissions using @aibos/events schemas
 * - Automatic Zod validation
 * - Error boundaries (one subscriber failure doesn't crash others)
 */

import { EventEmitter } from 'events';
import type { Event, EventType } from '@aibos/events';
import { EventSchema } from '@aibos/events';

class MetadataEventBus extends EventEmitter {
    constructor() {
        super();
        // Increase max listeners (default is 10)
        this.setMaxListeners(50);
    }

    /**
     * Emit a typed, validated event.
     *
     * @param event - Event to emit (will be validated against EventSchema)
     * @throws {Error} If event validation fails
     */
    async emitEvent(event: Event): Promise<void> {
        // Validate event before emitting
        const validated = EventSchema.parse(event);

        // Emit on the specific event type channel
        this.emit(validated.type, validated);

        // Also emit on wildcard channel for global listeners
        this.emit('*', validated);

        console.log(`[EventBus] Emitted: ${validated.type} | ${validated.id}`);
    }

    /**
     * Subscribe to a specific event type.
     *
     * @param eventType - Event type to subscribe to
     * @param handler - Async handler function
     */
    subscribe(
        eventType: EventType | '*',
        handler: (event: Event) => Promise<void> | void
    ): void {
        this.on(eventType, async (event: Event) => {
            try {
                await handler(event);
            } catch (error) {
                console.error(
                    `[EventBus] Handler error for ${eventType}:`,
                    error
                );
                // Don't rethrow - error boundary
            }
        });

        console.log(`[EventBus] Subscribed to: ${eventType}`);
    }

    /**
     * Unsubscribe from a specific event type.
     *
     * @param eventType - Event type to unsubscribe from
     * @param handler - Handler function to remove
     */
    unsubscribe(
        eventType: EventType | '*',
        handler: (event: Event) => Promise<void> | void
    ): void {
        this.off(eventType, handler as any);
        console.log(`[EventBus] Unsubscribed from: ${eventType}`);
    }

    /**
     * Subscribe once to an event type (auto-unsubscribe after first emission).
     *
     * @param eventType - Event type to subscribe to
     * @param handler - Async handler function
     */
    subscribeOnce(
        eventType: EventType | '*',
        handler: (event: Event) => Promise<void> | void
    ): void {
        this.once(eventType, async (event: Event) => {
            try {
                await handler(event);
            } catch (error) {
                console.error(
                    `[EventBus] Once-handler error for ${eventType}:`,
                    error
                );
            }
        });

        console.log(`[EventBus] Subscribed once to: ${eventType}`);
    }
}

/**
 * Singleton event bus instance.
 * Shared across the entire Metadata Studio application.
 */
export const eventBus = new MetadataEventBus();

