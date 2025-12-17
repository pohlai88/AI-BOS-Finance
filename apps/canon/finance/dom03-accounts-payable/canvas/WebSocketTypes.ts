/**
 * WebSocket Types for Lively Layer
 * 
 * Defines message types and protocols for real-time canvas synchronization.
 * Uses a cell-level aggregation strategy to prevent topic explosion.
 * 
 * Part of the Lively Layer for AP Manager.
 */

import type { CanvasObject, CanvasZone, CanvasReaction } from '@aibos/kernel-core';
import type { APCellCode } from './urn';

// ============================================================================
// 1. MESSAGE TYPES
// ============================================================================

/**
 * All possible WebSocket message types
 */
export type WSMessageType =
  // Object events
  | 'object:created'
  | 'object:updated'
  | 'object:moved'
  | 'object:deleted'
  // Zone events
  | 'zone:entered'
  | 'zone:exited'
  | 'zone:trigger_fired'
  // Reaction events
  | 'reaction:added'
  | 'reaction:removed'
  // Acknowledgment events
  | 'acknowledgment:created'
  // Source entity events
  | 'source:status_changed'
  | 'source:archived'
  | 'source:deleted'
  // Presence events
  | 'presence:joined'
  | 'presence:left'
  | 'presence:cursor_moved'
  // System events
  | 'connection:established'
  | 'connection:ping'
  | 'connection:pong'
  | 'error';

// ============================================================================
// 2. BASE MESSAGE STRUCTURE
// ============================================================================

/**
 * Base WebSocket message structure
 */
export interface WSBaseMessage<T extends WSMessageType, P = unknown> {
  /** Message type */
  type: T;
  /** Unique message ID for deduplication */
  messageId: string;
  /** Tenant ID for RLS filtering */
  tenantId: string;
  /** Timestamp of event */
  timestamp: string;
  /** Payload data */
  payload: P;
  /** Correlation ID for tracing */
  correlationId?: string;
}

// ============================================================================
// 3. OBJECT EVENT PAYLOADS
// ============================================================================

export interface ObjectCreatedPayload {
  object: CanvasObject;
  createdByName?: string;
}

export interface ObjectUpdatedPayload {
  objectId: string;
  changes: Partial<CanvasObject>;
  newVersion: number;
  updatedByName?: string;
}

export interface ObjectMovedPayload {
  objectId: string;
  fromZoneId?: string;
  toZoneId?: string;
  positionX: number;
  positionY: number;
  newVersion: number;
  movedByName?: string;
}

export interface ObjectDeletedPayload {
  objectId: string;
  deletedByName?: string;
}

// ============================================================================
// 4. ZONE EVENT PAYLOADS
// ============================================================================

export interface ZoneEnteredPayload {
  objectId: string;
  zoneId: string;
  zoneName: string;
  actorName?: string;
}

export interface ZoneExitedPayload {
  objectId: string;
  zoneId: string;
  zoneName: string;
  actorName?: string;
}

export interface ZoneTriggerFiredPayload {
  objectId: string;
  zoneId: string;
  zoneName: string;
  triggerAction: string;
  success: boolean;
  result?: {
    sourceStatusUpdate?: {
      cell: APCellCode;
      entityId: string;
      oldStatus?: string;
      newStatus: string;
    };
    notifications?: {
      recipientCount: number;
    };
  };
}

// ============================================================================
// 5. REACTION EVENT PAYLOADS
// ============================================================================

export interface ReactionAddedPayload {
  objectId: string;
  reaction: {
    emoji: string;
    userId: string;
    userName?: string;
  };
  newCounts: { emoji: string; count: number }[];
}

export interface ReactionRemovedPayload {
  objectId: string;
  reaction: {
    emoji: string;
    userId: string;
  };
  newCounts: { emoji: string; count: number }[];
}

// ============================================================================
// 6. ACKNOWLEDGMENT EVENT PAYLOADS
// ============================================================================

export interface AcknowledgmentCreatedPayload {
  objectId: string;
  userId: string;
  userName?: string;
  comment?: string;
  totalAcknowledgments: number;
}

// ============================================================================
// 7. SOURCE ENTITY EVENT PAYLOADS
// ============================================================================

export interface SourceStatusChangedPayload {
  sourceRef: string;
  cell: APCellCode;
  entityId: string;
  oldStatus: string;
  newStatus: string;
  affectedObjects: string[];
}

export interface SourceArchivedPayload {
  sourceRef: string;
  cell: APCellCode;
  entityId: string;
  affectedObjects: string[];
}

export interface SourceDeletedPayload {
  sourceRef: string;
  cell: APCellCode;
  entityId: string;
  affectedObjects: string[];
}

// ============================================================================
// 8. PRESENCE EVENT PAYLOADS
// ============================================================================

export interface PresenceJoinedPayload {
  userId: string;
  userName?: string;
  userColor: string;  // Hex color for cursor
  timestamp: string;
}

export interface PresenceLeftPayload {
  userId: string;
  timestamp: string;
}

export interface PresenceCursorMovedPayload {
  userId: string;
  userName?: string;
  userColor: string;
  position: {
    x: number;
    y: number;
  };
  viewportBounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// ============================================================================
// 9. SYSTEM EVENT PAYLOADS
// ============================================================================

export interface ConnectionEstablishedPayload {
  connectionId: string;
  serverTime: string;
  features: string[];
}

export interface ErrorPayload {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// 10. MESSAGE TYPE MAP
// ============================================================================

export interface WSMessagePayloadMap {
  'object:created': ObjectCreatedPayload;
  'object:updated': ObjectUpdatedPayload;
  'object:moved': ObjectMovedPayload;
  'object:deleted': ObjectDeletedPayload;
  'zone:entered': ZoneEnteredPayload;
  'zone:exited': ZoneExitedPayload;
  'zone:trigger_fired': ZoneTriggerFiredPayload;
  'reaction:added': ReactionAddedPayload;
  'reaction:removed': ReactionRemovedPayload;
  'acknowledgment:created': AcknowledgmentCreatedPayload;
  'source:status_changed': SourceStatusChangedPayload;
  'source:archived': SourceArchivedPayload;
  'source:deleted': SourceDeletedPayload;
  'presence:joined': PresenceJoinedPayload;
  'presence:left': PresenceLeftPayload;
  'presence:cursor_moved': PresenceCursorMovedPayload;
  'connection:established': ConnectionEstablishedPayload;
  'connection:ping': Record<string, never>;
  'connection:pong': Record<string, never>;
  'error': ErrorPayload;
}

/**
 * Typed WebSocket message
 */
export type WSMessage<T extends WSMessageType = WSMessageType> = 
  T extends keyof WSMessagePayloadMap 
    ? WSBaseMessage<T, WSMessagePayloadMap[T]>
    : never;

// ============================================================================
// 11. SUBSCRIPTION TOPICS
// ============================================================================

/**
 * Topic structure for PubSub
 * Uses cell-level aggregation to prevent topic explosion
 */
export const TOPIC_PATTERNS = {
  /** Tenant-wide canvas events */
  TENANT_CANVAS: (tenantId: string) => `canvas:${tenantId}`,
  
  /** Cell-specific events (aggregates objects in that cell) */
  CELL: (tenantId: string, cell: APCellCode) => `canvas:${tenantId}:cell:${cell}`,
  
  /** Zone-specific events */
  ZONE: (tenantId: string, zoneId: string) => `canvas:${tenantId}:zone:${zoneId}`,
  
  /** Presence updates (high-frequency, separate channel) */
  PRESENCE: (tenantId: string) => `presence:${tenantId}`,
  
  /** User-specific events (for pre-flight updates) */
  USER: (tenantId: string, userId: string) => `user:${tenantId}:${userId}`,
} as const;

// ============================================================================
// 12. CLIENT COMMANDS
// ============================================================================

/**
 * Commands sent from client to server
 */
export type WSClientCommandType =
  | 'subscribe'
  | 'unsubscribe'
  | 'presence:update'
  | 'object:move'
  | 'reaction:toggle';

export interface WSClientCommand<T extends WSClientCommandType, P = unknown> {
  type: T;
  messageId: string;
  payload: P;
}

export interface SubscribePayload {
  topics: string[];
}

export interface UnsubscribePayload {
  topics: string[];
}

export interface PresenceUpdatePayload {
  position: { x: number; y: number };
  viewportBounds?: { x: number; y: number; width: number; height: number };
}

export interface ObjectMovePayload {
  objectId: string;
  zoneId?: string | null;
  positionX: number;
  positionY: number;
  expectedVersion: number;
}

export interface ReactionTogglePayload {
  objectId: string;
  emoji: string;
  action: 'add' | 'remove';
}

// ============================================================================
// 13. HELPERS
// ============================================================================

/**
 * Create a WebSocket message
 */
export function createWSMessage<T extends WSMessageType>(
  type: T,
  tenantId: string,
  payload: WSMessagePayloadMap[T],
  correlationId?: string
): WSMessage<T> {
  return {
    type,
    messageId: crypto.randomUUID(),
    tenantId,
    timestamp: new Date().toISOString(),
    payload,
    correlationId,
  } as WSMessage<T>;
}

/**
 * Generate a user color for presence
 */
export function generateUserColor(userId: string): string {
  const colors = [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
    '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
  ];
  
  // Simple hash based on userId
  let hash = 0;
  for (const char of userId) {
    hash = ((hash << 5) - hash) + char.charCodeAt(0);
    hash = hash & hash;
  }
  
  return colors[Math.abs(hash) % colors.length];
}
