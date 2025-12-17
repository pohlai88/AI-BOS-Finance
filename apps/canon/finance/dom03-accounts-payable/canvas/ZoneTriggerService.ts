/**
 * Zone Trigger Service
 * 
 * Handles zone-based workflow triggers when objects are moved between zones.
 * 
 * Responsibilities:
 * - Execute zone trigger actions (status updates, notifications)
 * - Enforce optimistic locking for race condition prevention
 * - Validate role permissions for zone moves
 * - Audit all zone transitions
 * 
 * Part of the Lively Layer for AP Manager.
 */

import type {
  CanvasRepositoryPort,
  CanvasObject,
  CanvasZone,
  MoveResult,
  ZoneTriggerAction,
} from '@aibos/kernel-core';
import type { ActorContext } from '@aibos/canon-governance';
import { parseURN, tryParseURN, type APCellCode } from './urn';
import { 
  CanvasServiceError, 
  ObjectNotFoundError, 
  LayerPermissionError,
} from './CanvasObjectService';

// ============================================================================
// 1. TYPES
// ============================================================================

/**
 * Zone trigger execution result
 */
export interface ZoneTriggerResult {
  success: boolean;
  triggerId?: string;
  action: ZoneTriggerAction;
  executedAt?: Date;
  error?: string;
  sourceStatusUpdate?: {
    cell: APCellCode;
    entityId: string;
    oldStatus?: string;
    newStatus: string;
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
  cellCode: APCellCode;
  targetStatus: string;
}

// ============================================================================
// 2. STATUS MAPPINGS
// ============================================================================

/**
 * Default status mappings per zone type and cell
 */
const DEFAULT_STATUS_MAPPINGS: StatusMapping[] = [
  // Invoice (AP-02)
  { zoneType: 'inbox', cellCode: '02', targetStatus: 'draft' },
  { zoneType: 'in_progress', cellCode: '02', targetStatus: 'submitted' },
  { zoneType: 'review', cellCode: '02', targetStatus: 'pending_approval' },
  { zoneType: 'done', cellCode: '02', targetStatus: 'approved' },
  
  // Match (AP-03)
  { zoneType: 'inbox', cellCode: '03', targetStatus: 'pending' },
  { zoneType: 'in_progress', cellCode: '03', targetStatus: 'pending' },
  { zoneType: 'review', cellCode: '03', targetStatus: 'exception' },
  { zoneType: 'done', cellCode: '03', targetStatus: 'passed' },
  
  // Approval (AP-04)
  { zoneType: 'inbox', cellCode: '04', targetStatus: 'pending' },
  { zoneType: 'in_progress', cellCode: '04', targetStatus: 'pending' },
  { zoneType: 'review', cellCode: '04', targetStatus: 'changes_requested' },
  { zoneType: 'done', cellCode: '04', targetStatus: 'approved' },
  
  // Payment (AP-05)
  { zoneType: 'inbox', cellCode: '05', targetStatus: 'draft' },
  { zoneType: 'in_progress', cellCode: '05', targetStatus: 'pending_approval' },
  { zoneType: 'review', cellCode: '05', targetStatus: 'approved' },
  { zoneType: 'done', cellCode: '05', targetStatus: 'processing' },
];

// ============================================================================
// 3. TRIGGER EXECUTORS
// ============================================================================

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

// ============================================================================
// 4. SERVICE
// ============================================================================

/**
 * ZoneTriggerService — Handles zone-based workflow triggers
 */
export class ZoneTriggerService {
  private statusMappings: StatusMapping[];
  
  constructor(
    private canvasRepo: CanvasRepositoryPort,
    private cellUpdaters?: Map<APCellCode, CellStatusUpdater>,
    private notificationService?: NotificationService,
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
        request.reason
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
    reason?: string
  ): Promise<ZoneTriggerResult> {
    const triggerId = crypto.randomUUID();
    const executedAt = new Date();
    
    switch (zone.triggerAction) {
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
        
      case 'archive':
        return this.executeArchive(
          triggerId,
          zone,
          object,
          actor,
          executedAt
        );
        
      case 'escalate':
        return this.executeEscalate(
          triggerId,
          zone,
          object,
          actor,
          executedAt,
          reason
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
   * Execute archive trigger
   */
  private async executeArchive(
    triggerId: string,
    zone: CanvasZone,
    object: CanvasObject,
    actor: ActorContext,
    executedAt: Date
  ): Promise<ZoneTriggerResult> {
    // Soft delete the object
    await this.canvasRepo.softDeleteObject(
      object.id,
      actor.userId,
      actor.tenantId
    );
    
    return {
      success: true,
      triggerId,
      action: 'archive',
      executedAt,
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
        priorityScore: Math.min(object.priorityScore + 20, 100),
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
   * Register a cell status updater
   */
  registerCellUpdater(cell: APCellCode, updater: CellStatusUpdater): void {
    if (!this.cellUpdaters) {
      this.cellUpdaters = new Map();
    }
    this.cellUpdaters.set(cell, updater);
  }
}

// ============================================================================
// 5. FACTORY
// ============================================================================

export function createZoneTriggerService(
  canvasRepo: CanvasRepositoryPort,
  cellUpdaters?: Map<APCellCode, CellStatusUpdater>,
  notificationService?: NotificationService,
  customMappings?: StatusMapping[]
): ZoneTriggerService {
  return new ZoneTriggerService(
    canvasRepo,
    cellUpdaters,
    notificationService,
    customMappings
  );
}
