/**
 * Kernel Event Bus Contracts
 * 
 * Schema-first definition for Event Bus (publish events with standard envelope).
 * Based on PRD Section 10 (Event Envelope specification).
 */

import { z } from "zod";

// ============================================================================
// EVENT ENVELOPE (from PRD)
// ============================================================================

/**
 * Standard event envelope for all published events
 * 
 * Required fields:
 * - version: "1.0" (envelope version for future evolution)
 * - event_name: Event type identifier (e.g., "invoice.created", "user.invited")
 * - source: Origin of the event (kernel, canon, molecule, cell)
 * - tenant_id: Tenant isolation
 * - correlation_id: Request tracing
 * - timestamp: ISO 8601 timestamp (when event occurred)
 * - payload: Event-specific data
 * 
 * Optional fields:
 * - actor_id: User/system that triggered the event
 */
export const KernelEventEnvelope = z.object({
  version: z.literal("1.0"),
  event_name: z.string().min(1).max(128), // e.g., "invoice.created"
  source: z.enum(["kernel", "canon", "molecule", "cell"]),
  tenant_id: z.string().uuid(),
  actor_id: z.string().uuid().optional(), // optional: may be system event
  correlation_id: z.string().uuid(),
  timestamp: z.string().datetime(), // ISO 8601
  payload: z.unknown(), // event-specific data
});

// ============================================================================
// PUBLISH EVENT REQUEST/RESPONSE
// ============================================================================

/**
 * Request to publish an event
 * 
 * Fields enriched by the service:
 * - correlation_id: Generated if not provided
 * - timestamp: Generated if not provided
 */
export const EventPublishRequest = z.object({
  event_name: z.string().min(1).max(128),
  source: z.enum(["kernel", "canon", "molecule", "cell"]),
  tenant_id: z.string().uuid(),
  actor_id: z.string().uuid().optional(),
  correlation_id: z.string().uuid().optional(), // enriched if missing
  timestamp: z.string().datetime().optional(), // enriched if missing
  payload: z.unknown(),
});

/**
 * Response after successful event publish
 */
export const EventPublishResponse = z.object({
  ok: z.literal(true),
  event_id: z.string().uuid(), // unique ID for this event instance
  correlation_id: z.string().uuid(),
  timestamp: z.string().datetime(), // when event was published
});

// ============================================================================
// STORED EVENT (for in-memory adapter)
// ============================================================================

/**
 * Event as stored in event store (envelope + metadata)
 */
export const StoredEvent = z.object({
  event_id: z.string().uuid(),
  version: z.literal("1.0"),
  event_name: z.string(),
  source: z.enum(["kernel", "canon", "molecule", "cell"]),
  tenant_id: z.string().uuid(),
  actor_id: z.string().uuid().optional(),
  correlation_id: z.string().uuid(),
  timestamp: z.string().datetime(),
  published_at: z.string().datetime(), // when event was stored
  payload: z.unknown(),
});

// ============================================================================
// TYPE EXPORTS (inferred from schemas)
// ============================================================================

export type KernelEventEnvelope = z.infer<typeof KernelEventEnvelope>;
export type EventPublishRequest = z.infer<typeof EventPublishRequest>;
export type EventPublishResponse = z.infer<typeof EventPublishResponse>;
export type StoredEvent = z.infer<typeof StoredEvent>;
