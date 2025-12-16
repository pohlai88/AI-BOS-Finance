// metadata-studio/events.ts
// =============================================================================
// EVENT EMITTER FOR METADATA OPERATIONS
// Provides event-driven architecture for metadata changes
// =============================================================================

import { EventEmitter } from 'events';

/**
 * Metadata event types
 */
export enum MetadataEventType {
  // Entity events
  ENTITY_CREATED = 'entity:created',
  ENTITY_UPDATED = 'entity:updated',
  ENTITY_DELETED = 'entity:deleted',

  // Field events
  FIELD_CREATED = 'field:created',
  FIELD_UPDATED = 'field:updated',
  FIELD_DELETED = 'field:deleted',

  // Lineage events
  LINEAGE_NODE_CREATED = 'lineage:node:created',
  LINEAGE_EDGE_CREATED = 'lineage:edge:created',
  LINEAGE_UPDATED = 'lineage:updated',

  // Governance events
  POLICY_CREATED = 'policy:created',
  POLICY_UPDATED = 'policy:updated',
  VIOLATION_DETECTED = 'violation:detected',
  VIOLATION_RESOLVED = 'violation:resolved',

  // Approval events
  APPROVAL_REQUESTED = 'approval:requested',
  APPROVAL_GRANTED = 'approval:granted',
  APPROVAL_REJECTED = 'approval:rejected',

  // KPI events
  KPI_CREATED = 'kpi:created',
  KPI_UPDATED = 'kpi:updated',
  KPI_CALCULATED = 'kpi:calculated',
}

/**
 * Base event payload
 */
export interface BaseEventPayload {
  tenantId: string;
  userId: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Entity event payload
 */
export interface EntityEventPayload extends BaseEventPayload {
  entityId: string;
  entityUrn: string;
  domain: string;
  module: string;
}

/**
 * Field event payload
 */
export interface FieldEventPayload extends BaseEventPayload {
  fieldId: string;
  canonicalKey: string;
  entityUrn: string;
}

/**
 * Lineage event payload
 */
export interface LineageEventPayload extends BaseEventPayload {
  nodeId?: string;
  sourceNodeId?: string;
  targetNodeId?: string;
  edgeId?: string;
}

/**
 * Governance event payload
 */
export interface GovernanceEventPayload extends BaseEventPayload {
  policyId?: string;
  violationId?: string;
  severity?: string;
}

/**
 * Approval event payload
 */
export interface ApprovalEventPayload extends BaseEventPayload {
  approvalId: string;
  entityType: string;
  entityId: string;
  status: string;
}

/**
 * KPI event payload
 */
export interface KPIEventPayload extends BaseEventPayload {
  kpiId: string;
  kpiCode: string;
  value?: number;
}

/**
 * Union of all event payloads
 */
export type EventPayload =
  | EntityEventPayload
  | FieldEventPayload
  | LineageEventPayload
  | GovernanceEventPayload
  | ApprovalEventPayload
  | KPIEventPayload;

/**
 * Metadata event emitter
 */
class MetadataEventEmitter extends EventEmitter {
  /**
   * Emit a metadata event
   */
  emitMetadataEvent(type: MetadataEventType, payload: EventPayload) {
    this.emit(type, payload);
    this.emit('*', { type, payload }); // Wildcard listener
  }

  /**
   * Subscribe to a metadata event
   */
  onMetadataEvent(
    type: MetadataEventType | '*',
    handler: (payload: EventPayload) => void | Promise<void>
  ) {
    this.on(type, handler);
    return () => this.off(type, handler); // Return unsubscribe function
  }
}

// Singleton instance
export const metadataEvents = new MetadataEventEmitter();

// Helper functions
export function emitEvent(type: MetadataEventType, payload: EventPayload) {
  metadataEvents.emitMetadataEvent(type, payload);
}

export function onEvent(
  type: MetadataEventType | '*',
  handler: (payload: EventPayload) => void | Promise<void>
) {
  return metadataEvents.onMetadataEvent(type, handler);
}

/**
 * Initialize the event system
 * Sets up default handlers and logging
 */
export function initializeEventSystem() {
  // Log all events in development
  if (process.env.NODE_ENV === 'development') {
    metadataEvents.onMetadataEvent('*', (payload) => {
      console.log('[MetadataEvents]', payload);
    });
  }

  return metadataEvents;
}

// Export default
export default metadataEvents;
