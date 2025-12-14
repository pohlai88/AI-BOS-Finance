/**
 * Publish Event Use-Case
 * 
 * Application logic for publishing events to the event bus.
 * Enriches event envelope with missing fields (correlation_id, timestamp).
 * 
 * Anti-Gravity:
 * - No framework imports
 * - No adapter imports
 * - Dependencies injected via `deps` parameter
 */

import { randomUUID } from "node:crypto";
import type { EventBusPort } from "../ports/eventBusPort.ts";
import type { AuditPort } from "../ports/auditPort.ts";
import type { Event, PublishEventInput, PublishEventResult } from "../domain/event.ts";

export interface PublishEventDeps {
  eventBus: EventBusPort;
  audit: AuditPort;
}

/**
 * Publish an event to the event bus
 * 
 * Flow:
 * 1. Enrich event with missing fields (event_id, correlation_id, timestamp)
 * 2. Publish to event bus
 * 3. Write audit event
 * 4. Return result
 * 
 * @param deps - Dependencies (eventBus, audit)
 * @param input - Event data
 * @returns PublishEventResult
 */
export async function publishEvent(
  deps: PublishEventDeps,
  input: PublishEventInput
): Promise<PublishEventResult> {
  // Generate event ID
  const event_id = randomUUID();

  // Enrich correlation ID if missing
  const correlation_id = input.correlation_id ?? randomUUID();

  // Enrich timestamp if missing
  const timestamp = input.timestamp ?? new Date().toISOString();
  const published_at = new Date().toISOString();

  // Build event
  const event: Event = {
    event_id,
    version: "1.0",
    event_name: input.event_name,
    source: input.source,
    tenant_id: input.tenant_id,
    actor_id: input.actor_id,
    correlation_id,
    timestamp,
    published_at,
    payload: input.payload,
  };

  // Publish to event bus
  await deps.eventBus.publish(event);

  // Append audit event (immutable)
  await deps.audit.append({
    tenant_id: input.tenant_id,
    actor_id: input.actor_id,
    action: "EVENT_PUBLISHED",
    resource: `event:${input.event_name}`,
    result: "OK",
    correlation_id,
    payload: { event_id, event_name: input.event_name },
  });

  return {
    event_id,
    correlation_id,
    timestamp: published_at,
  };
}
