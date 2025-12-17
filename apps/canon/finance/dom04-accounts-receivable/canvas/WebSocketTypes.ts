/**
 * WebSocket Types for Lively Layer
 * 
 * Defines message types and protocols for real-time canvas synchronization.
 * Uses a cell-level aggregation strategy to prevent topic explosion.
 * 
 * Part of the Lively Layer for AR Manager.
 * 
 * @module AR-Canvas
 */

import type { CanvasObject, CanvasZone, CanvasReaction } from '@aibos/kernel-core';
import type { ARCellCode } from './urn';

// =============================================================================
// 1. MESSAGE TYPES
// =============================================================================

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
  // AR-specific events
  | 'payment:received'
  | 'aging:updated'
  | 'collection:action'
  // Presence events
  | 'presence:joined'
  | 'presence:left'
  | 'presence:cursor_moved'
  // System events
  | 'connection:established'
  | 'connection:ping'
  | 'connection:pong'
  | 'error';

// =============================================================================
// 2. BASE MESSAGE STRUCTURE
// =============================================================================

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

// =============================================================================
// 3. OBJECT EVENT PAYLOADS
// =============================================================================

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

// =============================================================================
// 4. ZONE EVENT PAYLOADS
// =============================================================================

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
      cell: ARCellCode;
      entityId: string;
      oldStatus?: string;
      newStatus: string;
    };
    notifications?: {
      recipientCount: number;
    };
    dunningTriggered?: boolean;
    collectionActionCreated?: boolean;
  };
}

// =============================================================================
// 5. REACTION EVENT PAYLOADS
// =============================================================================

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

// =============================================================================
// 6. ACKNOWLEDGMENT EVENT PAYLOADS
// =============================================================================

export interface AcknowledgmentCreatedPayload {
  objectId: string;
  userId: string;
  userName?: string;
  comment?: string;
  totalAcknowledgments: number;
}

// =============================================================================
// 7. SOURCE ENTITY EVENT PAYLOADS
// =============================================================================

export interface SourceStatusChangedPayload {
  sourceRef: string;
  cell: ARCellCode;
  entityId: string;
  oldStatus: string;
  newStatus: string;
  affectedObjects: string[];
}

export interface SourceArchivedPayload {
  sourceRef: string;
  cell: ARCellCode;
  entityId: string;
  affectedObjects: string[];
}

export interface SourceDeletedPayload {
  sourceRef: string;
  cell: ARCellCode;
  entityId: string;
  affectedObjects: string[];
}

// =============================================================================
// 8. AR-SPECIFIC EVENT PAYLOADS
// =============================================================================

export interface PaymentReceivedPayload {
  customerId: string;
  customerName?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  receiptId: string;
  receiptNumber: string;
  amount: number;
  currency: string;
  remainingBalance: number;
  affectedObjects: string[];
}

export interface AgingUpdatedPayload {
  customerId: string;
  customerCode: string;
  oldBucket: string;
  newBucket: string;
  amount: number;
  daysOverdue: number;
  affectedObjects: string[];
}

export interface CollectionActionPayload {
  customerId: string;
  customerCode: string;
  actionType: 'phone_call' | 'email_sent' | 'letter_sent' | 'payment_promised' | 'dispute_opened' | 'escalated';
  notes?: string;
  followUpDate?: string;
  promiseDate?: string;
  promiseAmount?: number;
  actorName?: string;
}

// =============================================================================
// 9. PRESENCE EVENT PAYLOADS
// =============================================================================

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

// =============================================================================
// 10. SYSTEM EVENT PAYLOADS
// =============================================================================

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

// =============================================================================
// 11. MESSAGE TYPE MAP
// =============================================================================

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
  'payment:received': PaymentReceivedPayload;
  'aging:updated': AgingUpdatedPayload;
  'collection:action': CollectionActionPayload;
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

// =============================================================================
// 12. SUBSCRIPTION TOPICS
// =============================================================================

/**
 * Topic structure for PubSub
 * Uses cell-level aggregation to prevent topic explosion
 */
export const TOPIC_PATTERNS = {
  /** Tenant-wide canvas events */
  TENANT_CANVAS: (tenantId: string) => `ar-canvas:${tenantId}`,
  
  /** Cell-specific events (aggregates objects in that cell) */
  CELL: (tenantId: string, cell: ARCellCode) => `ar-canvas:${tenantId}:cell:${cell}`,
  
  /** Zone-specific events (collection workflow) */
  ZONE: (tenantId: string, zoneId: string) => `ar-canvas:${tenantId}:zone:${zoneId}`,
  
  /** Aging bucket events */
  AGING_BUCKET: (tenantId: string, bucket: string) => `ar-canvas:${tenantId}:aging:${bucket}`,
  
  /** Customer-specific events */
  CUSTOMER: (tenantId: string, customerId: string) => `ar-canvas:${tenantId}:customer:${customerId}`,
  
  /** Presence updates (high-frequency, separate channel) */
  PRESENCE: (tenantId: string) => `ar-presence:${tenantId}`,
  
  /** User-specific events (for pre-flight updates) */
  USER: (tenantId: string, userId: string) => `ar-user:${tenantId}:${userId}`,
} as const;

// =============================================================================
// 13. CLIENT COMMANDS
// =============================================================================

/**
 * Commands sent from client to server
 */
export type WSClientCommandType =
  | 'subscribe'
  | 'unsubscribe'
  | 'presence:update'
  | 'object:move'
  | 'reaction:toggle'
  | 'collection:log';

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

export interface CollectionLogPayload {
  customerId: string;
  actionType: string;
  notes?: string;
  followUpDate?: string;
}

// =============================================================================
// 14. HELPERS
// =============================================================================

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

/**
 * Get aging bucket topic from days overdue
 */
export function getAgingBucketTopic(tenantId: string, daysOverdue: number): string {
  let bucket: string;
  if (daysOverdue <= 0) bucket = 'current';
  else if (daysOverdue <= 30) bucket = '1-30';
  else if (daysOverdue <= 60) bucket = '31-60';
  else if (daysOverdue <= 90) bucket = '61-90';
  else if (daysOverdue <= 120) bucket = '91-120';
  else bucket = '120+';
  
  return TOPIC_PATTERNS.AGING_BUCKET(tenantId, bucket);
}
