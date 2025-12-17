/**
 * Event Broadcaster for Lively Layer
 * 
 * Publishes canvas events to the WebSocket PubSub system.
 * Integrates with the existing Kernel EventBus for persistence.
 * 
 * Part of the Lively Layer for AP Manager.
 */

import type { EventBusPort } from '@aibos/kernel-core';
import type { CanvasObject, CanvasZone, CanvasReaction } from '@aibos/kernel-core';
import { 
  createWSMessage,
  TOPIC_PATTERNS,
  generateUserColor,
  type WSMessage,
  type WSMessageType,
  type WSMessagePayloadMap,
} from './WebSocketTypes';
import { tryParseURN, type APCellCode } from './urn';

// ============================================================================
// 1. TYPES
// ============================================================================

/**
 * PubSub adapter interface
 * Can be implemented with Redis, Socket.io, etc.
 */
export interface PubSubAdapter {
  publish(topic: string, message: string): Promise<void>;
  publishMany(topicMessages: Array<{ topic: string; message: string }>): Promise<void>;
}

/**
 * Actor context for event attribution
 */
export interface EventActor {
  userId: string;
  userName?: string;
  tenantId: string;
}

// ============================================================================
// 2. SERVICE
// ============================================================================

/**
 * EventBroadcaster — Publishes canvas events to WebSocket subscribers
 */
export class EventBroadcaster {
  constructor(
    private pubSub: PubSubAdapter,
    private eventBus?: EventBusPort // Optional for persistent events
  ) {}

  // -------------------------------------------------------------------------
  // OBJECT EVENTS
  // -------------------------------------------------------------------------

  /**
   * Broadcast object creation
   */
  async objectCreated(object: CanvasObject, actor: EventActor): Promise<void> {
    const message = createWSMessage('object:created', actor.tenantId, {
      object,
      createdByName: actor.userName,
    });
    
    await this.broadcastToRelevantTopics(message, object.sourceRef, actor.tenantId);
    await this.persistEvent('canvas.object.created', { objectId: object.id }, actor);
  }

  /**
   * Broadcast object update
   */
  async objectUpdated(
    objectId: string,
    changes: Partial<CanvasObject>,
    newVersion: number,
    sourceRef: string | undefined,
    actor: EventActor
  ): Promise<void> {
    const message = createWSMessage('object:updated', actor.tenantId, {
      objectId,
      changes,
      newVersion,
      updatedByName: actor.userName,
    });
    
    await this.broadcastToRelevantTopics(message, sourceRef, actor.tenantId);
    await this.persistEvent('canvas.object.updated', { objectId, changes }, actor);
  }

  /**
   * Broadcast object move
   */
  async objectMoved(
    objectId: string,
    fromZoneId: string | undefined,
    toZoneId: string | undefined,
    positionX: number,
    positionY: number,
    newVersion: number,
    sourceRef: string | undefined,
    actor: EventActor
  ): Promise<void> {
    const message = createWSMessage('object:moved', actor.tenantId, {
      objectId,
      fromZoneId,
      toZoneId,
      positionX,
      positionY,
      newVersion,
      movedByName: actor.userName,
    });
    
    const topics: string[] = [TOPIC_PATTERNS.TENANT_CANVAS(actor.tenantId)];
    
    // Include both zone topics if applicable
    if (fromZoneId) {
      topics.push(TOPIC_PATTERNS.ZONE(actor.tenantId, fromZoneId));
    }
    if (toZoneId) {
      topics.push(TOPIC_PATTERNS.ZONE(actor.tenantId, toZoneId));
    }
    
    // Include cell topic if source ref exists
    const parsed = sourceRef ? tryParseURN(sourceRef) : null;
    if (parsed) {
      topics.push(TOPIC_PATTERNS.CELL(actor.tenantId, parsed.cell));
    }
    
    await this.broadcastToTopics(topics, message);
    await this.persistEvent('canvas.object.moved', { objectId, fromZoneId, toZoneId }, actor);
  }

  /**
   * Broadcast object deletion
   */
  async objectDeleted(
    objectId: string,
    sourceRef: string | undefined,
    actor: EventActor
  ): Promise<void> {
    const message = createWSMessage('object:deleted', actor.tenantId, {
      objectId,
      deletedByName: actor.userName,
    });
    
    await this.broadcastToRelevantTopics(message, sourceRef, actor.tenantId);
    await this.persistEvent('canvas.object.deleted', { objectId }, actor);
  }

  // -------------------------------------------------------------------------
  // ZONE EVENTS
  // -------------------------------------------------------------------------

  /**
   * Broadcast zone entry
   */
  async zoneEntered(
    objectId: string,
    zone: CanvasZone,
    actor: EventActor
  ): Promise<void> {
    const message = createWSMessage('zone:entered', actor.tenantId, {
      objectId,
      zoneId: zone.id,
      zoneName: zone.name,
      actorName: actor.userName,
    });
    
    const topics = [
      TOPIC_PATTERNS.TENANT_CANVAS(actor.tenantId),
      TOPIC_PATTERNS.ZONE(actor.tenantId, zone.id),
    ];
    
    await this.broadcastToTopics(topics, message);
  }

  /**
   * Broadcast zone exit
   */
  async zoneExited(
    objectId: string,
    zone: CanvasZone,
    actor: EventActor
  ): Promise<void> {
    const message = createWSMessage('zone:exited', actor.tenantId, {
      objectId,
      zoneId: zone.id,
      zoneName: zone.name,
      actorName: actor.userName,
    });
    
    const topics = [
      TOPIC_PATTERNS.TENANT_CANVAS(actor.tenantId),
      TOPIC_PATTERNS.ZONE(actor.tenantId, zone.id),
    ];
    
    await this.broadcastToTopics(topics, message);
  }

  /**
   * Broadcast zone trigger fired
   */
  async zoneTriggerFired(
    objectId: string,
    zone: CanvasZone,
    success: boolean,
    result: {
      sourceStatusUpdate?: { cell: APCellCode; entityId: string; oldStatus?: string; newStatus: string };
      notifications?: { recipientCount: number };
    },
    actor: EventActor
  ): Promise<void> {
    const message = createWSMessage('zone:trigger_fired', actor.tenantId, {
      objectId,
      zoneId: zone.id,
      zoneName: zone.name,
      triggerAction: zone.triggerAction,
      success,
      result,
    });
    
    const topics = [
      TOPIC_PATTERNS.TENANT_CANVAS(actor.tenantId),
      TOPIC_PATTERNS.ZONE(actor.tenantId, zone.id),
    ];
    
    if (result.sourceStatusUpdate) {
      topics.push(TOPIC_PATTERNS.CELL(actor.tenantId, result.sourceStatusUpdate.cell));
    }
    
    await this.broadcastToTopics(topics, message);
    await this.persistEvent('canvas.zone.trigger', { objectId, zoneId: zone.id, success }, actor);
  }

  // -------------------------------------------------------------------------
  // REACTION EVENTS
  // -------------------------------------------------------------------------

  /**
   * Broadcast reaction added
   */
  async reactionAdded(
    objectId: string,
    emoji: string,
    newCounts: { emoji: string; count: number }[],
    sourceRef: string | undefined,
    actor: EventActor
  ): Promise<void> {
    const message = createWSMessage('reaction:added', actor.tenantId, {
      objectId,
      reaction: {
        emoji,
        userId: actor.userId,
        userName: actor.userName,
      },
      newCounts,
    });
    
    await this.broadcastToRelevantTopics(message, sourceRef, actor.tenantId);
  }

  /**
   * Broadcast reaction removed
   */
  async reactionRemoved(
    objectId: string,
    emoji: string,
    newCounts: { emoji: string; count: number }[],
    sourceRef: string | undefined,
    actor: EventActor
  ): Promise<void> {
    const message = createWSMessage('reaction:removed', actor.tenantId, {
      objectId,
      reaction: {
        emoji,
        userId: actor.userId,
      },
      newCounts,
    });
    
    await this.broadcastToRelevantTopics(message, sourceRef, actor.tenantId);
  }

  // -------------------------------------------------------------------------
  // ACKNOWLEDGMENT EVENTS
  // -------------------------------------------------------------------------

  /**
   * Broadcast acknowledgment created
   */
  async acknowledgmentCreated(
    objectId: string,
    totalAcknowledgments: number,
    comment: string | undefined,
    sourceRef: string | undefined,
    actor: EventActor
  ): Promise<void> {
    const message = createWSMessage('acknowledgment:created', actor.tenantId, {
      objectId,
      userId: actor.userId,
      userName: actor.userName,
      comment,
      totalAcknowledgments,
    });
    
    await this.broadcastToRelevantTopics(message, sourceRef, actor.tenantId);
    await this.persistEvent('canvas.acknowledgment.created', { objectId }, actor);
  }

  // -------------------------------------------------------------------------
  // SOURCE ENTITY EVENTS
  // -------------------------------------------------------------------------

  /**
   * Broadcast source status change
   */
  async sourceStatusChanged(
    sourceRef: string,
    oldStatus: string,
    newStatus: string,
    affectedObjectIds: string[],
    tenantId: string
  ): Promise<void> {
    const parsed = tryParseURN(sourceRef);
    if (!parsed) return;
    
    const message = createWSMessage('source:status_changed', tenantId, {
      sourceRef,
      cell: parsed.cell,
      entityId: parsed.entityId,
      oldStatus,
      newStatus,
      affectedObjects: affectedObjectIds,
    });
    
    const topics = [
      TOPIC_PATTERNS.TENANT_CANVAS(tenantId),
      TOPIC_PATTERNS.CELL(tenantId, parsed.cell),
    ];
    
    await this.broadcastToTopics(topics, message);
  }

  /**
   * Broadcast source archived (ghost state)
   */
  async sourceArchived(
    sourceRef: string,
    affectedObjectIds: string[],
    tenantId: string
  ): Promise<void> {
    const parsed = tryParseURN(sourceRef);
    if (!parsed) return;
    
    const message = createWSMessage('source:archived', tenantId, {
      sourceRef,
      cell: parsed.cell,
      entityId: parsed.entityId,
      affectedObjects: affectedObjectIds,
    });
    
    const topics = [
      TOPIC_PATTERNS.TENANT_CANVAS(tenantId),
      TOPIC_PATTERNS.CELL(tenantId, parsed.cell),
    ];
    
    await this.broadcastToTopics(topics, message);
  }

  // -------------------------------------------------------------------------
  // PRESENCE EVENTS
  // -------------------------------------------------------------------------

  /**
   * Broadcast user joined canvas
   */
  async presenceJoined(actor: EventActor): Promise<void> {
    const message = createWSMessage('presence:joined', actor.tenantId, {
      userId: actor.userId,
      userName: actor.userName,
      userColor: generateUserColor(actor.userId),
      timestamp: new Date().toISOString(),
    });
    
    await this.pubSub.publish(
      TOPIC_PATTERNS.PRESENCE(actor.tenantId),
      JSON.stringify(message)
    );
  }

  /**
   * Broadcast user left canvas
   */
  async presenceLeft(actor: EventActor): Promise<void> {
    const message = createWSMessage('presence:left', actor.tenantId, {
      userId: actor.userId,
      timestamp: new Date().toISOString(),
    });
    
    await this.pubSub.publish(
      TOPIC_PATTERNS.PRESENCE(actor.tenantId),
      JSON.stringify(message)
    );
  }

  /**
   * Broadcast cursor movement (rate-limited by caller)
   */
  async presenceCursorMoved(
    position: { x: number; y: number },
    viewportBounds: { x: number; y: number; width: number; height: number } | undefined,
    actor: EventActor
  ): Promise<void> {
    const message = createWSMessage('presence:cursor_moved', actor.tenantId, {
      userId: actor.userId,
      userName: actor.userName,
      userColor: generateUserColor(actor.userId),
      position,
      viewportBounds,
    });
    
    await this.pubSub.publish(
      TOPIC_PATTERNS.PRESENCE(actor.tenantId),
      JSON.stringify(message)
    );
  }

  // -------------------------------------------------------------------------
  // HELPERS
  // -------------------------------------------------------------------------

  /**
   * Broadcast to all relevant topics based on source ref
   */
  private async broadcastToRelevantTopics(
    message: WSMessage,
    sourceRef: string | undefined,
    tenantId: string
  ): Promise<void> {
    const topics: string[] = [TOPIC_PATTERNS.TENANT_CANVAS(tenantId)];
    
    if (sourceRef) {
      const parsed = tryParseURN(sourceRef);
      if (parsed) {
        topics.push(TOPIC_PATTERNS.CELL(tenantId, parsed.cell));
      }
    }
    
    await this.broadcastToTopics(topics, message);
  }

  /**
   * Broadcast to multiple topics
   */
  private async broadcastToTopics(
    topics: string[],
    message: WSMessage
  ): Promise<void> {
    const messageStr = JSON.stringify(message);
    
    await this.pubSub.publishMany(
      topics.map(topic => ({ topic, message: messageStr }))
    );
  }

  /**
   * Persist event to kernel event bus
   */
  private async persistEvent(
    eventType: string,
    payload: Record<string, unknown>,
    actor: EventActor
  ): Promise<void> {
    if (!this.eventBus) return;
    
    try {
      await this.eventBus.publish({
        type: eventType as 'audit.entry.created', // Type assertion for kernel compatibility
        tenantId: actor.tenantId,
        payload: {
          ...payload,
          actorId: actor.userId,
          actorName: actor.userName,
        },
        source: 'canvas',
        timestamp: new Date(),
      });
    } catch (error) {
      // Log but don't fail - WebSocket broadcast is more important
      console.error('Failed to persist canvas event:', error);
    }
  }
}

// ============================================================================
// 3. FACTORY
// ============================================================================

export function createEventBroadcaster(
  pubSub: PubSubAdapter,
  eventBus?: EventBusPort
): EventBroadcaster {
  return new EventBroadcaster(pubSub, eventBus);
}
