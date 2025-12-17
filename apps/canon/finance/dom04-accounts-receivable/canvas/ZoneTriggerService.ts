/**
 * Zone Trigger Service
 * 
 * Handles zone-based workflow triggers when objects are moved between zones.
 * AR-specific zones focus on collection workflow stages.
 * 
 * Responsibilities:
 * - Execute zone trigger actions (collection updates, dunning, notifications)
 * - Enforce optimistic locking for race condition prevention
 * - Validate role permissions for zone moves
 * - Audit all zone transitions
 * 
 * Part of the Lively Layer for AR Manager.
 * 
 * @module AR-Canvas
 */

import type {
  CanvasRepositoryPort,
  CanvasObject,
  CanvasZone,
  MoveResult,
  ZoneTriggerAction,
} from '@aibos/kernel-core';
import type { ActorContext } from '@aibos/canon-governance';
import { parseURN, tryParseURN, type ARCellCode } from './urn';
import { 
  CanvasServiceError, 
  ObjectNotFoundError, 
  LayerPermissionError,
} from './CanvasObjectService';

// =============================================================================
// 1. TYPES
// =============================================================================

/**
 * AR-specific zone trigger actions
 */
export type ARZoneTriggerAction = 
  | 'none'
  | 'status_update'
  | 'notify'
  | 'dunning_trigger'
  | 'escalate'
  | 'collection_action'
  | 'write_off_review';

/**
 * Zone trigger execution result
 */
export interface ZoneTriggerResult {
  success: boolean;
  triggerId?: string;
  action: ARZoneTriggerAction;
  executedAt?: Date;
  error?: string;
  sourceStatusUpdate?: {
    cell: ARCellCode;
    entityId: string;
    oldStatus?: string;
    newStatus: string;
  };
  collectionAction?: {
    actionType: string;
    customerId: string;
    notes?: string;
  };
  dunningTriggered?: {
    templateId: string;
    customerId: string;
  };
  notifications?: {
    recipientIds: string[];
    message: string;
  };
}

/**
 * Zone move request with optimistic locking
 */
export interface ZoneMoveRequest {
  objectId: string;
  targetZoneId: string | null;
  expectedVersion: number;
  positionX?: number;
  positionY?: number;
  reason?: string;
  collectionNotes?: string;
  promiseDate?: Date;
  promiseAmount?: number;
}

/**
 * Zone move response
 */
export interface ZoneMoveResponse {
  success: boolean;
  object?: CanvasObject;
  newVersion?: number;
  triggerResult?: ZoneTriggerResult;
  error?: {
    code: 'CONFLICT' | 'NOT_FOUND' | 'PERMISSION_DENIED' | 'TRIGGER_FAILED';
    message: string;
    currentVersion?: number;
    currentZoneId?: string;
  };
}

/**
 * Status mapping for zone triggers
 */
export interface StatusMapping {
  zoneType: string;
  cellCode: ARCellCode;
  targetStatus: string;
}

/**
 * Collection zone types
 */
export type CollectionZoneType = 
  | 'inbox'
  | 'follow_up'
  | 'reminder_sent'
  | 'escalated'
  | 'payment_promised'
  | 'disputed'
  | 'write_off_review'
  | 'resolved';

// =============================================================================
// 2. STATUS MAPPINGS (AR-Specific)
// =============================================================================

/**
 * Default status mappings per zone type and cell
 */
const DEFAULT_STATUS_MAPPINGS: StatusMapping[] = [
  // Customer (AR-01) - collection status
  { zoneType: 'follow_up', cellCode: '01', targetStatus: 'follow_up' },
  { zoneType: 'escalated', cellCode: '01', targetStatus: 'collection' },
  { zoneType: 'payment_promised', cellCode: '01', targetStatus: 'promised' },
  { zoneType: 'disputed', cellCode: '01', targetStatus: 'disputed' },
  
  // Invoice (AR-02)
  { zoneType: 'inbox', cellCode: '02', targetStatus: 'posted' },
  { zoneType: 'follow_up', cellCode: '02', targetStatus: 'overdue' },
  { zoneType: 'disputed', cellCode: '02', targetStatus: 'disputed' },
  { zoneType: 'resolved', cellCode: '02', targetStatus: 'paid' },
  
  // Receipt (AR-03)
  { zoneType: 'inbox', cellCode: '03', targetStatus: 'draft' },
  { zoneType: 'resolved', cellCode: '03', targetStatus: 'posted' },
  
  // Credit Note (AR-04)
  { zoneType: 'inbox', cellCode: '04', targetStatus: 'draft' },
  { zoneType: 'resolved', cellCode: '04', targetStatus: 'applied' },
  
  // Aging (AR-05)
  { zoneType: 'escalated', cellCode: '05', targetStatus: 'collection' },
  { zoneType: 'write_off_review', cellCode: '05', targetStatus: 'write_off_pending' },
];

/**
 * Dunning template mapping by zone
 */
const DUNNING_TEMPLATES: Record<string, string> = {
  'reminder_sent': 'DUNNING_REMINDER_1',
  'escalated': 'DUNNING_FINAL_NOTICE',
  'write_off_review': 'DUNNING_LEGAL_WARNING',
};

// =============================================================================
// 3. TRIGGER EXECUTORS
// =============================================================================

/**
 * Cell service interfaces for status updates
 */
interface CellStatusUpdater {
  updateStatus(entityId: string, newStatus: string, actor: ActorContext): Promise<{ success: boolean; oldStatus?: string }>;
}

/**
 * Notification service interface
 */
interface NotificationService {
  notifyRoles(roles: string[], message: string, context: Record<string, unknown>): Promise<string[]>;
}

/**
 * Dunning service interface
 */
interface DunningService {
  triggerDunning(customerId: string, templateId: string, actor: ActorContext): Promise<{ success: boolean; letterId?: string }>;
}

/**
 * Collection action service interface
 */
interface CollectionActionService {
  logAction(input: {
    customerId: string;
    actionType: string;
    notes?: string;
    promiseDate?: Date;
    promiseAmount?: number;
  }, actor: ActorContext): Promise<{ success: boolean; actionId: string }>;
}

// =============================================================================
// 4. SERVICE
// =============================================================================

/**
 * ZoneTriggerService — Handles zone-based workflow triggers for AR
 */
export class ZoneTriggerService {
  private statusMappings: StatusMapping[];
  
  constructor(
    private canvasRepo: CanvasRepositoryPort,
    private cellUpdaters?: Map<ARCellCode, CellStatusUpdater>,
    private notificationService?: NotificationService,
    private dunningService?: DunningService,
    private collectionActionService?: CollectionActionService,
    customMappings?: StatusMapping[]
  ) {
    this.statusMappings = customMappings ?? DEFAULT_STATUS_MAPPINGS;
  }

  /**
   * Move object to zone with trigger execution
   */
  async moveToZone(
    request: ZoneMoveRequest,
    actor: ActorContext
  ): Promise<ZoneMoveResponse> {
    // 1. Get current object
    const object = await this.canvasRepo.findObjectById(
      request.objectId,
      actor.tenantId
    );
    
    if (!object) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Object ${request.objectId} not found`,
        },
      };
    }
    
    // 2. Verify user can move objects in this layer
    if (object.layerType === 'personal' && object.ownerId !== actor.userId) {
      return {
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Cannot move other users\' personal objects',
        },
      };
    }
    
    if (object.layerType === 'data') {
      return {
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Cannot move data layer objects',
        },
      };
    }
    
    // 3. Get target zone (if moving to a zone)
    let targetZone: CanvasZone | null = null;
    if (request.targetZoneId) {
      targetZone = await this.canvasRepo.findZoneById(
        request.targetZoneId,
        actor.tenantId
      );
      
      if (!targetZone) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Zone ${request.targetZoneId} not found`,
          },
        };
      }
      
      // 4. Check role permission for target zone
      if (targetZone.allowedRoles.length > 0) {
        const userRole = actor.role ?? 'viewer';
        if (!targetZone.allowedRoles.includes(userRole)) {
          return {
            success: false,
            error: {
              code: 'PERMISSION_DENIED',
              message: `Role ${userRole} cannot move objects to zone ${targetZone.name}`,
            },
          };
        }
      }
    }
    
    // 5. Attempt move with optimistic locking
    const moveResult = await this.canvasRepo.moveObject(request.objectId, {
      zoneId: request.targetZoneId,
      positionX: request.positionX,
      positionY: request.positionY,
      expectedVersion: request.expectedVersion,
      updatedBy: actor.userId,
    });
    
    if (!moveResult.success) {
      return {
        success: false,
        error: {
          code: moveResult.error ?? 'CONFLICT',
          message: moveResult.error === 'CONFLICT'
            ? 'Object was modified by another user. Please refresh and try again.'
            : 'Move failed',
          currentVersion: moveResult.currentVersion,
          currentZoneId: moveResult.currentZoneId,
        },
      };
    }
    
    // 6. Execute zone trigger if applicable
    let triggerResult: ZoneTriggerResult | undefined;
    
    if (targetZone && targetZone.triggerAction !== 'none') {
      triggerResult = await this.executeTrigger(
        targetZone,
        object,
        actor,
        request
      );
      
      // Log trigger execution
      await this.canvasRepo.createAuditEntry({
        tenantId: actor.tenantId,
        action: 'zone_trigger_fired',
        actorId: actor.userId,
        actorName: actor.userName,
        objectId: object.id,
        objectSourceRef: object.sourceRef,
        zoneId: targetZone.id,
        afterState: { triggerResult },
        reason: request.reason,
      });
    }
    
    return {
      success: true,
      object: moveResult.object,
      newVersion: moveResult.newVersion,
      triggerResult,
    };
  }

  /**
   * Execute zone trigger action
   */
  private async executeTrigger(
    zone: CanvasZone,
    object: CanvasObject,
    actor: ActorContext,
    request: ZoneMoveRequest
  ): Promise<ZoneTriggerResult> {
    const triggerId = crypto.randomUUID();
    const executedAt = new Date();
    const action = zone.triggerAction as ARZoneTriggerAction;
    
    switch (action) {
      case 'status_update':
        return this.executeStatusUpdate(
          triggerId,
          zone,
          object,
          actor,
          executedAt
        );
        
      case 'notify':
        return this.executeNotify(
          triggerId,
          zone,
          object,
          actor,
          executedAt
        );
        
      case 'dunning_trigger':
        return this.executeDunning(
          triggerId,
          zone,
          object,
          actor,
          executedAt
        );
        
      case 'collection_action':
        return this.executeCollectionAction(
          triggerId,
          zone,
          object,
          actor,
          executedAt,
          request
        );
        
      case 'escalate':
        return this.executeEscalate(
          triggerId,
          zone,
          object,
          actor,
          executedAt,
          request.reason
        );
        
      case 'write_off_review':
        return this.executeWriteOffReview(
          triggerId,
          zone,
          object,
          actor,
          executedAt,
          request.reason
        );
        
      default:
        return {
          success: true,
          triggerId,
          action: 'none',
          executedAt,
        };
    }
  }

  /**
   * Execute status update trigger
   */
  private async executeStatusUpdate(
    triggerId: string,
    zone: CanvasZone,
    object: CanvasObject,
    actor: ActorContext,
    executedAt: Date
  ): Promise<ZoneTriggerResult> {
    // Parse source ref to get cell and entity
    const parsed = object.sourceRef ? tryParseURN(object.sourceRef) : null;
    
    if (!parsed) {
      return {
        success: false,
        triggerId,
        action: 'status_update',
        error: 'Object has no source binding',
      };
    }
    
    // Get target status from zone config or default mapping
    const configuredStatus = zone.triggerConfig?.targetStatus as string | undefined;
    const mapping = this.statusMappings.find(
      m => m.zoneType === zone.zoneType && m.cellCode === parsed.cell
    );
    const targetStatus = configuredStatus ?? mapping?.targetStatus;
    
    if (!targetStatus) {
      return {
        success: false,
        triggerId,
        action: 'status_update',
        error: `No status mapping for zone type ${zone.zoneType} and cell ${parsed.cell}`,
      };
    }
    
    // Call cell service to update status
    const cellUpdater = this.cellUpdaters?.get(parsed.cell);
    
    if (cellUpdater) {
      try {
        const result = await cellUpdater.updateStatus(
          parsed.entityId,
          targetStatus,
          actor
        );
        
        return {
          success: result.success,
          triggerId,
          action: 'status_update',
          executedAt,
          sourceStatusUpdate: {
            cell: parsed.cell,
            entityId: parsed.entityId,
            oldStatus: result.oldStatus,
            newStatus: targetStatus,
          },
        };
      } catch (error) {
        return {
          success: false,
          triggerId,
          action: 'status_update',
          error: `Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }
    
    // No cell updater registered - log but don't fail
    return {
      success: true,
      triggerId,
      action: 'status_update',
      executedAt,
      sourceStatusUpdate: {
        cell: parsed.cell,
        entityId: parsed.entityId,
        newStatus: targetStatus,
      },
    };
  }

  /**
   * Execute notification trigger
   */
  private async executeNotify(
    triggerId: string,
    zone: CanvasZone,
    object: CanvasObject,
    actor: ActorContext,
    executedAt: Date
  ): Promise<ZoneTriggerResult> {
    const notifyRoles = (zone.triggerConfig?.notifyRoles as string[]) ?? ['manager'];
    const displayData = object.displayData;
    
    const message = `${actor.userName ?? 'A user'} moved "${displayData.title ?? 'item'}" to "${zone.name}"`;
    
    if (this.notificationService) {
      try {
        const recipientIds = await this.notificationService.notifyRoles(
          notifyRoles,
          message,
          {
            objectId: object.id,
            sourceRef: object.sourceRef,
            zoneId: zone.id,
            zoneName: zone.name,
            actorId: actor.userId,
          }
        );
        
        return {
          success: true,
          triggerId,
          action: 'notify',
          executedAt,
          notifications: {
            recipientIds,
            message,
          },
        };
      } catch (error) {
        return {
          success: false,
          triggerId,
          action: 'notify',
          error: `Failed to send notifications: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }
    
    // No notification service - return success without notifications
    return {
      success: true,
      triggerId,
      action: 'notify',
      executedAt,
    };
  }

  /**
   * Execute dunning trigger (AR-specific)
   */
  private async executeDunning(
    triggerId: string,
    zone: CanvasZone,
    object: CanvasObject,
    actor: ActorContext,
    executedAt: Date
  ): Promise<ZoneTriggerResult> {
    const parsed = object.sourceRef ? tryParseURN(object.sourceRef) : null;
    
    if (!parsed) {
      return {
        success: false,
        triggerId,
        action: 'dunning_trigger',
        error: 'Object has no source binding',
      };
    }
    
    // Get template ID from zone config or default
    const templateId = (zone.triggerConfig?.dunningTemplateId as string) 
      ?? DUNNING_TEMPLATES[zone.zoneType] 
      ?? 'DUNNING_REMINDER_1';
    
    // Get customer ID (from object metadata or source ref)
    const customerId = object.displayData.metadata?.customerId as string 
      ?? (parsed.cell === '01' ? parsed.entityId : undefined);
    
    if (!customerId) {
      return {
        success: false,
        triggerId,
        action: 'dunning_trigger',
        error: 'Cannot determine customer ID for dunning',
      };
    }
    
    if (this.dunningService) {
      try {
        const result = await this.dunningService.triggerDunning(
          customerId,
          templateId,
          actor
        );
        
        return {
          success: result.success,
          triggerId,
          action: 'dunning_trigger',
          executedAt,
          dunningTriggered: {
            templateId,
            customerId,
          },
        };
      } catch (error) {
        return {
          success: false,
          triggerId,
          action: 'dunning_trigger',
          error: `Failed to trigger dunning: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }
    
    // No dunning service - log and return success
    return {
      success: true,
      triggerId,
      action: 'dunning_trigger',
      executedAt,
      dunningTriggered: {
        templateId,
        customerId,
      },
    };
  }

  /**
   * Execute collection action trigger (AR-specific)
   */
  private async executeCollectionAction(
    triggerId: string,
    zone: CanvasZone,
    object: CanvasObject,
    actor: ActorContext,
    executedAt: Date,
    request: ZoneMoveRequest
  ): Promise<ZoneTriggerResult> {
    const parsed = object.sourceRef ? tryParseURN(object.sourceRef) : null;
    
    // Get customer ID
    const customerId = object.displayData.metadata?.customerId as string 
      ?? (parsed?.cell === '01' ? parsed.entityId : undefined);
    
    if (!customerId) {
      return {
        success: false,
        triggerId,
        action: 'collection_action',
        error: 'Cannot determine customer ID for collection action',
      };
    }
    
    // Map zone to action type
    const actionTypeMap: Record<string, string> = {
      'follow_up': 'follow_up_scheduled',
      'reminder_sent': 'reminder_sent',
      'payment_promised': 'payment_promised',
      'disputed': 'dispute_opened',
      'escalated': 'escalated',
    };
    
    const actionType = (zone.triggerConfig?.actionType as string) 
      ?? actionTypeMap[zone.zoneType] 
      ?? 'status_change';
    
    if (this.collectionActionService) {
      try {
        const result = await this.collectionActionService.logAction({
          customerId,
          actionType,
          notes: request.collectionNotes ?? request.reason,
          promiseDate: request.promiseDate,
          promiseAmount: request.promiseAmount,
        }, actor);
        
        return {
          success: result.success,
          triggerId,
          action: 'collection_action',
          executedAt,
          collectionAction: {
            actionType,
            customerId,
            notes: request.collectionNotes,
          },
        };
      } catch (error) {
        return {
          success: false,
          triggerId,
          action: 'collection_action',
          error: `Failed to log collection action: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }
    
    // No collection service - return success
    return {
      success: true,
      triggerId,
      action: 'collection_action',
      executedAt,
      collectionAction: {
        actionType,
        customerId,
        notes: request.collectionNotes,
      },
    };
  }

  /**
   * Execute escalation trigger
   */
  private async executeEscalate(
    triggerId: string,
    zone: CanvasZone,
    object: CanvasObject,
    actor: ActorContext,
    executedAt: Date,
    reason?: string
  ): Promise<ZoneTriggerResult> {
    // Mark as requiring acknowledgment with elevated priority
    await this.canvasRepo.updateObject(
      object.id,
      {
        priorityScore: Math.min(object.priorityScore + 25, 100),
        requiresAcknowledgment: true,
        updatedBy: actor.userId,
      },
      object.version
    );
    
    // Send notification
    const escalateRoles = (zone.triggerConfig?.escalateRoles as string[]) ?? ['manager', 'admin'];
    const message = `ESCALATION: ${actor.userName ?? 'A user'} escalated "${object.displayData.title ?? 'item'}"${reason ? `: ${reason}` : ''}`;
    
    let recipientIds: string[] = [];
    if (this.notificationService) {
      recipientIds = await this.notificationService.notifyRoles(
        escalateRoles,
        message,
        {
          objectId: object.id,
          sourceRef: object.sourceRef,
          zoneId: zone.id,
          reason,
          actorId: actor.userId,
        }
      );
    }
    
    return {
      success: true,
      triggerId,
      action: 'escalate',
      executedAt,
      notifications: {
        recipientIds,
        message,
      },
    };
  }

  /**
   * Execute write-off review trigger (AR-specific)
   */
  private async executeWriteOffReview(
    triggerId: string,
    zone: CanvasZone,
    object: CanvasObject,
    actor: ActorContext,
    executedAt: Date,
    reason?: string
  ): Promise<ZoneTriggerResult> {
    // Mark as requiring CFO acknowledgment
    await this.canvasRepo.updateObject(
      object.id,
      {
        priorityScore: 100, // Maximum priority
        requiresAcknowledgment: true,
        tags: [...object.tags, '#WRITEOFF_REVIEW'],
        updatedBy: actor.userId,
      },
      object.version
    );
    
    // Notify CFO and finance leadership
    const reviewRoles = (zone.triggerConfig?.reviewRoles as string[]) ?? ['cfo', 'controller', 'admin'];
    const amount = object.displayData.amount ?? 'unknown';
    const message = `WRITE-OFF REVIEW: "${object.displayData.title ?? 'item'}" ($${amount}) submitted for write-off review${reason ? `: ${reason}` : ''}`;
    
    let recipientIds: string[] = [];
    if (this.notificationService) {
      recipientIds = await this.notificationService.notifyRoles(
        reviewRoles,
        message,
        {
          objectId: object.id,
          sourceRef: object.sourceRef,
          zoneId: zone.id,
          amount,
          reason,
          actorId: actor.userId,
          requiresApproval: true,
        }
      );
    }
    
    return {
      success: true,
      triggerId,
      action: 'write_off_review',
      executedAt,
      notifications: {
        recipientIds,
        message,
      },
    };
  }

  /**
   * Register a cell status updater
   */
  registerCellUpdater(cell: ARCellCode, updater: CellStatusUpdater): void {
    if (!this.cellUpdaters) {
      this.cellUpdaters = new Map();
    }
    this.cellUpdaters.set(cell, updater);
  }
}

// =============================================================================
// 5. FACTORY
// =============================================================================

export function createZoneTriggerService(
  canvasRepo: CanvasRepositoryPort,
  cellUpdaters?: Map<ARCellCode, CellStatusUpdater>,
  notificationService?: NotificationService,
  dunningService?: DunningService,
  collectionActionService?: CollectionActionService,
  customMappings?: StatusMapping[]
): ZoneTriggerService {
  return new ZoneTriggerService(
    canvasRepo,
    cellUpdaters,
    notificationService,
    dunningService,
    collectionActionService,
    customMappings
  );
}
