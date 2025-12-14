/**
 * Event Domain Types
 * 
 * Pure domain types for event bus.
 * These types are framework-agnostic and used by use-cases.
 * 
 * Anti-Gravity:
 * - NO imports from Next.js, Express, or any framework
 * - NO imports from adapters
 * - ONLY pure TypeScript + contracts
 */

/**
 * Event envelope (domain representation)
 * 
 * This matches the PRD specification for event envelope.
 */
export interface Event {
  event_id: string;
  version: "1.0";
  event_name: string;
  source: "kernel" | "canon" | "molecule" | "cell";
  tenant_id: string;
  actor_id?: string;
  correlation_id: string;
  timestamp: string; // ISO 8601
  published_at: string; // ISO 8601
  payload: unknown;
}

/**
 * Event publish input (for use-case)
 */
export interface PublishEventInput {
  event_name: string;
  source: "kernel" | "canon" | "molecule" | "cell";
  tenant_id: string;
  actor_id?: string;
  correlation_id?: string; // enriched if missing
  timestamp?: string; // enriched if missing
  payload: unknown;
}

/**
 * Event publish result
 */
export interface PublishEventResult {
  event_id: string;
  correlation_id: string;
  timestamp: string;
}
