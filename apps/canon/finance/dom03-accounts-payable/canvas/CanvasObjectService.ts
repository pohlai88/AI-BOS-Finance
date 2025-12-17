/**
 * Canvas Object Service
 * 
 * Core service for managing canvas objects (hydrated stickies, annotations).
 * 
 * Responsibilities:
 * - CRUD operations for canvas objects
 * - Source binding (URN) management
 * - Layer enforcement (data/team/personal)
 * - Audit logging
 * 
 * Part of the Lively Layer for AP Manager.
 */

import type {
  CanvasRepositoryPort,
  CanvasObject,
  CanvasObjectWithAggregates,
  CreateObjectInput,
  UpdateObjectInput,
  MoveObjectInput,
  ObjectQueryFilters,
  MoveResult,
  CanvasDisplayData,
  CanvasStyle,
  CanvasLayerType,
  SourceStatus,
} from '@aibos/kernel-core';
import type { ActorContext } from '@aibos/canon-governance';
import { 
  parseURN, 
  isValidURN,
  type APCellCode,
  type VendorEntity,
  type InvoiceEntity,
  type MatchEntity,
  type ApprovalEntity,
  type PaymentEntity,
  transformEntity,
  calculatePriorityScore,
} from './index';

// ============================================================================
// 1. TYPES
// ============================================================================

/**
 * Create hydrated sticky input
 */
export interface CreateHydratedStickyInput {
  /** Source entity for binding */
  cell: APCellCode;
  entity: VendorEntity | InvoiceEntity | MatchEntity | ApprovalEntity | PaymentEntity;
  
  /** Position on canvas */
  positionX: number;
  positionY: number;
  
  /** Optional zone placement */
  zoneId?: string;
  
  /** Optional tags */
  tags?: string[];
  
  /** Whether this requires acknowledgment */
  requiresAcknowledgment?: boolean;
}

/**
 * Create plain sticky input
 */
export interface CreatePlainStickyInput {
  /** Layer (team or personal) */
  layerType: 'team' | 'personal';
  
  /** Content */
  content: string;
  
  /** Position on canvas */
  positionX: number;
  positionY: number;
  
  /** Optional style */
  backgroundColor?: string;
  
  /** Optional tags */
  tags?: string[];
  
  /** Optional zone placement */
  zoneId?: string;
}

/**
 * Service errors
 */
export class CanvasServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly httpStatus: number = 400
  ) {
    super(message);
    this.name = 'CanvasServiceError';
  }
}

export class ObjectNotFoundError extends CanvasServiceError {
  constructor(objectId: string) {
    super(`Canvas object not found: ${objectId}`, 'OBJECT_NOT_FOUND', 404);
  }
}

export class LayerPermissionError extends CanvasServiceError {
  constructor(message: string) {
    super(message, 'LAYER_PERMISSION_DENIED', 403);
  }
}

export class VersionConflictError extends CanvasServiceError {
  constructor(objectId: string, expectedVersion: number, actualVersion: number) {
    super(
      `Version conflict for object ${objectId}: expected ${expectedVersion}, actual ${actualVersion}`,
      'VERSION_CONFLICT',
      409
    );
  }
}

// ============================================================================
// 2. PERMISSION HELPERS
// ============================================================================

const LAYER_PERMISSIONS = {
  data: {
    canCreate: [] as string[],
    canEdit: [] as string[],
    canDelete: [] as string[],
  },
  team: {
    canCreate: ['officer', 'manager', 'admin'],
    canEdit: ['officer', 'manager', 'admin'],
    canDelete: ['manager', 'admin'],
  },
  personal: {
    canCreate: ['viewer', 'officer', 'manager', 'admin'],
    canEdit: ['viewer', 'officer', 'manager', 'admin'],
    canDelete: ['viewer', 'officer', 'manager', 'admin'],
  },
};

function canCreateInLayer(role: string, layer: CanvasLayerType): boolean {
  return LAYER_PERMISSIONS[layer].canCreate.includes(role);
}

function canEditInLayer(role: string, layer: CanvasLayerType, ownerId?: string, userId?: string): boolean {
  if (layer === 'personal') {
    return ownerId === userId;
  }
  return LAYER_PERMISSIONS[layer].canEdit.includes(role);
}

function canDeleteInLayer(role: string, layer: CanvasLayerType, ownerId?: string, userId?: string): boolean {
  if (layer === 'personal') {
    return ownerId === userId;
  }
  return LAYER_PERMISSIONS[layer].canDelete.includes(role);
}

// ============================================================================
// 3. SERVICE
// ============================================================================

/**
 * CanvasObjectService — Manages canvas objects
 */
export class CanvasObjectService {
  constructor(
    private canvasRepo: CanvasRepositoryPort
  ) {}

  // -------------------------------------------------------------------------
  // CREATE OPERATIONS
  // -------------------------------------------------------------------------

  /**
   * Create a hydrated sticky from an AP entity
   */
  async createHydratedSticky(
    input: CreateHydratedStickyInput,
    actor: ActorContext
  ): Promise<CanvasObject> {
    // Transform entity to display data
    const { displayData, style, sourceRef, priorityScore } = transformEntity(
      input.cell,
      input.entity
    );
    
    // Hydrated stickies go to team layer by default
    const createInput: CreateObjectInput = {
      tenantId: actor.tenantId,
      objectType: 'hydrated_sticky',
      layerType: 'team',
      sourceRef,
      positionX: input.positionX,
      positionY: input.positionY,
      displayData,
      style,
      tags: input.tags ?? [],
      zoneId: input.zoneId,
      priorityScore: input.requiresAcknowledgment 
        ? Math.max(priorityScore, 50) // Ensure minimum score for acknowledgment
        : priorityScore,
      requiresAcknowledgment: input.requiresAcknowledgment ?? false,
      createdBy: actor.userId,
    };
    
    const object = await this.canvasRepo.createObject(createInput);
    
    // Log creation
    await this.canvasRepo.createAuditEntry({
      tenantId: actor.tenantId,
      action: 'object_created',
      actorId: actor.userId,
      actorName: actor.userName,
      objectId: object.id,
      objectSourceRef: sourceRef,
      afterState: { displayData, style, priorityScore },
    });
    
    return object;
  }

  /**
   * Create a plain sticky (no entity binding)
   */
  async createPlainSticky(
    input: CreatePlainStickyInput,
    actor: ActorContext
  ): Promise<CanvasObject> {
    // Check permissions
    if (!canCreateInLayer(actor.role ?? 'viewer', input.layerType)) {
      throw new LayerPermissionError(`Cannot create objects in ${input.layerType} layer`);
    }
    
    const displayData: CanvasDisplayData = {
      content: input.content,
    };
    
    const style: CanvasStyle = {
      backgroundColor: input.backgroundColor ?? '#FEF3C7',
    };
    
    const createInput: CreateObjectInput = {
      tenantId: actor.tenantId,
      objectType: 'plain_sticky',
      layerType: input.layerType,
      ownerId: input.layerType === 'personal' ? actor.userId : undefined,
      positionX: input.positionX,
      positionY: input.positionY,
      displayData,
      style,
      tags: input.tags ?? [],
      zoneId: input.zoneId,
      priorityScore: 0,
      requiresAcknowledgment: false,
      createdBy: actor.userId,
    };
    
    const object = await this.canvasRepo.createObject(createInput);
    
    // Log creation
    await this.canvasRepo.createAuditEntry({
      tenantId: actor.tenantId,
      action: 'object_created',
      actorId: actor.userId,
      actorName: actor.userName,
      objectId: object.id,
      afterState: { displayData, style },
    });
    
    return object;
  }

  // -------------------------------------------------------------------------
  // READ OPERATIONS
  // -------------------------------------------------------------------------

  /**
   * Get a single object by ID
   */
  async getObject(objectId: string, actor: ActorContext): Promise<CanvasObject> {
    const object = await this.canvasRepo.findObjectById(objectId, actor.tenantId);
    
    if (!object) {
      throw new ObjectNotFoundError(objectId);
    }
    
    // Check personal layer access
    if (object.layerType === 'personal' && object.ownerId !== actor.userId) {
      throw new LayerPermissionError('Cannot access other users\' personal objects');
    }
    
    return object;
  }

  /**
   * Get object with aggregates (reactions, acknowledgments)
   */
  async getObjectWithAggregates(
    objectId: string, 
    actor: ActorContext
  ): Promise<CanvasObjectWithAggregates> {
    const object = await this.canvasRepo.findObjectByIdWithAggregates(objectId, actor.tenantId);
    
    if (!object) {
      throw new ObjectNotFoundError(objectId);
    }
    
    // Check personal layer access
    if (object.layerType === 'personal' && object.ownerId !== actor.userId) {
      throw new LayerPermissionError('Cannot access other users\' personal objects');
    }
    
    return object;
  }

  /**
   * List objects by layer
   */
  async listObjects(
    filters: Omit<ObjectQueryFilters, 'tenantId'>,
    actor: ActorContext
  ): Promise<{ objects: CanvasObject[]; total: number }> {
    const queryFilters: ObjectQueryFilters = {
      ...filters,
      tenantId: actor.tenantId,
    };
    
    // For personal layer, enforce owner filter
    if (filters.layerType === 'personal') {
      queryFilters.ownerId = actor.userId;
    }
    
    return this.canvasRepo.listObjects(queryFilters);
  }

  /**
   * Get objects bound to a specific entity
   */
  async getObjectsBySourceRef(
    sourceRef: string,
    actor: ActorContext
  ): Promise<CanvasObject[]> {
    if (!isValidURN(sourceRef)) {
      throw new CanvasServiceError('Invalid source reference (URN)', 'INVALID_URN');
    }
    
    return this.canvasRepo.findObjectsBySourceRef(sourceRef, actor.tenantId);
  }

  // -------------------------------------------------------------------------
  // UPDATE OPERATIONS
  // -------------------------------------------------------------------------

  /**
   * Update object position
   */
  async updatePosition(
    objectId: string,
    positionX: number,
    positionY: number,
    expectedVersion: number,
    actor: ActorContext
  ): Promise<CanvasObject> {
    const object = await this.getObject(objectId, actor);
    
    // Check permissions
    if (!canEditInLayer(actor.role ?? 'viewer', object.layerType, object.ownerId, actor.userId)) {
      throw new LayerPermissionError(`Cannot edit objects in ${object.layerType} layer`);
    }
    
    const beforeState = { positionX: object.positionX, positionY: object.positionY };
    
    const updated = await this.canvasRepo.updateObject(
      objectId,
      { positionX, positionY, updatedBy: actor.userId },
      expectedVersion
    );
    
    // Log update
    await this.canvasRepo.createAuditEntry({
      tenantId: actor.tenantId,
      action: 'object_moved',
      actorId: actor.userId,
      actorName: actor.userName,
      objectId,
      objectSourceRef: object.sourceRef,
      beforeState,
      afterState: { positionX, positionY },
    });
    
    return updated;
  }

  /**
   * Update object style
   */
  async updateStyle(
    objectId: string,
    style: Partial<CanvasStyle>,
    expectedVersion: number,
    actor: ActorContext
  ): Promise<CanvasObject> {
    const object = await this.getObject(objectId, actor);
    
    // Check permissions
    if (!canEditInLayer(actor.role ?? 'viewer', object.layerType, object.ownerId, actor.userId)) {
      throw new LayerPermissionError(`Cannot edit objects in ${object.layerType} layer`);
    }
    
    const beforeState = { style: object.style };
    const newStyle = { ...object.style, ...style };
    
    const updated = await this.canvasRepo.updateObject(
      objectId,
      { style: newStyle, updatedBy: actor.userId },
      expectedVersion
    );
    
    // Log update
    await this.canvasRepo.createAuditEntry({
      tenantId: actor.tenantId,
      action: 'object_updated',
      actorId: actor.userId,
      actorName: actor.userName,
      objectId,
      objectSourceRef: object.sourceRef,
      beforeState,
      afterState: { style: newStyle },
    });
    
    return updated;
  }

  /**
   * Add tag to object
   */
  async addTag(
    objectId: string,
    tag: string,
    expectedVersion: number,
    actor: ActorContext
  ): Promise<CanvasObject> {
    const object = await this.getObject(objectId, actor);
    
    // Check permissions - urgent tags require manager+
    const isUrgentTag = ['#URGENT', '#REQUIRED', '#CRITICAL'].includes(tag.toUpperCase());
    if (isUrgentTag && !['manager', 'admin'].includes(actor.role ?? '')) {
      throw new LayerPermissionError('Only managers can add urgent tags');
    }
    
    if (!canEditInLayer(actor.role ?? 'viewer', object.layerType, object.ownerId, actor.userId)) {
      throw new LayerPermissionError(`Cannot edit objects in ${object.layerType} layer`);
    }
    
    const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`;
    
    if (object.tags.includes(normalizedTag)) {
      return object; // Already has tag
    }
    
    const newTags = [...object.tags, normalizedTag];
    
    // Recalculate priority if urgent tag added
    let newPriorityScore = object.priorityScore;
    let requiresAcknowledgment = object.requiresAcknowledgment;
    if (isUrgentTag) {
      newPriorityScore = Math.min(object.priorityScore + 15, 100);
      requiresAcknowledgment = true;
    }
    
    const updated = await this.canvasRepo.updateObject(
      objectId,
      { 
        tags: newTags, 
        priorityScore: newPriorityScore,
        requiresAcknowledgment,
        updatedBy: actor.userId 
      },
      expectedVersion
    );
    
    // Log update
    await this.canvasRepo.createAuditEntry({
      tenantId: actor.tenantId,
      action: 'tag_added',
      actorId: actor.userId,
      actorName: actor.userName,
      objectId,
      objectSourceRef: object.sourceRef,
      beforeState: { tags: object.tags },
      afterState: { tags: newTags, addedTag: normalizedTag },
    });
    
    return updated;
  }

  /**
   * Remove tag from object
   */
  async removeTag(
    objectId: string,
    tag: string,
    expectedVersion: number,
    actor: ActorContext
  ): Promise<CanvasObject> {
    const object = await this.getObject(objectId, actor);
    
    if (!canEditInLayer(actor.role ?? 'viewer', object.layerType, object.ownerId, actor.userId)) {
      throw new LayerPermissionError(`Cannot edit objects in ${object.layerType} layer`);
    }
    
    const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`;
    const newTags = object.tags.filter(t => t !== normalizedTag);
    
    if (newTags.length === object.tags.length) {
      return object; // Tag not present
    }
    
    const updated = await this.canvasRepo.updateObject(
      objectId,
      { tags: newTags, updatedBy: actor.userId },
      expectedVersion
    );
    
    // Log update
    await this.canvasRepo.createAuditEntry({
      tenantId: actor.tenantId,
      action: 'tag_removed',
      actorId: actor.userId,
      actorName: actor.userName,
      objectId,
      objectSourceRef: object.sourceRef,
      beforeState: { tags: object.tags },
      afterState: { tags: newTags, removedTag: normalizedTag },
    });
    
    return updated;
  }

  // -------------------------------------------------------------------------
  // MOVE TO ZONE (with optimistic locking)
  // -------------------------------------------------------------------------

  /**
   * Move object to a zone
   */
  async moveToZone(
    objectId: string,
    zoneId: string | null,
    expectedVersion: number,
    actor: ActorContext
  ): Promise<MoveResult> {
    const object = await this.getObject(objectId, actor);
    
    if (!canEditInLayer(actor.role ?? 'viewer', object.layerType, object.ownerId, actor.userId)) {
      return {
        success: false,
        error: 'PERMISSION_DENIED',
      };
    }
    
    const beforeZoneId = object.zoneId;
    
    const result = await this.canvasRepo.moveObject(objectId, {
      zoneId,
      expectedVersion,
      updatedBy: actor.userId,
    });
    
    if (result.success) {
      // Log zone transition
      if (beforeZoneId) {
        await this.canvasRepo.createAuditEntry({
          tenantId: actor.tenantId,
          action: 'zone_exit',
          actorId: actor.userId,
          actorName: actor.userName,
          objectId,
          objectSourceRef: object.sourceRef,
          zoneId: beforeZoneId,
          beforeState: { zoneId: beforeZoneId },
        });
      }
      
      if (zoneId) {
        await this.canvasRepo.createAuditEntry({
          tenantId: actor.tenantId,
          action: 'zone_enter',
          actorId: actor.userId,
          actorName: actor.userName,
          objectId,
          objectSourceRef: object.sourceRef,
          zoneId,
          afterState: { zoneId },
        });
      }
    }
    
    return result;
  }

  // -------------------------------------------------------------------------
  // DELETE OPERATIONS
  // -------------------------------------------------------------------------

  /**
   * Soft delete an object
   */
  async deleteObject(objectId: string, actor: ActorContext): Promise<void> {
    const object = await this.getObject(objectId, actor);
    
    if (!canDeleteInLayer(actor.role ?? 'viewer', object.layerType, object.ownerId, actor.userId)) {
      throw new LayerPermissionError(`Cannot delete objects in ${object.layerType} layer`);
    }
    
    await this.canvasRepo.softDeleteObject(objectId, actor.userId, actor.tenantId);
    
    // Log deletion
    await this.canvasRepo.createAuditEntry({
      tenantId: actor.tenantId,
      action: 'object_deleted',
      actorId: actor.userId,
      actorName: actor.userName,
      objectId,
      objectSourceRef: object.sourceRef,
      beforeState: { displayData: object.displayData },
    });
  }

  // -------------------------------------------------------------------------
  // SOURCE STATUS MANAGEMENT
  // -------------------------------------------------------------------------

  /**
   * Update source status for all objects bound to an entity
   * Called when the source entity is archived/deleted
   */
  async updateSourceStatus(
    sourceRef: string,
    status: SourceStatus,
    reason: string
  ): Promise<number> {
    if (!isValidURN(sourceRef)) {
      throw new CanvasServiceError('Invalid source reference (URN)', 'INVALID_URN');
    }
    
    const count = await this.canvasRepo.updateObjectsSourceStatus(sourceRef, status);
    
    // Log the status change (system-level, no actor)
    const { cell, entityId } = parseURN(sourceRef);
    await this.canvasRepo.createAuditEntry({
      tenantId: 'system',
      action: 'source_status_changed',
      actorId: 'system',
      actorName: 'System',
      objectSourceRef: sourceRef,
      afterState: { status, reason, affectedCount: count },
    });
    
    return count;
  }
}

// ============================================================================
// 4. FACTORY
// ============================================================================

export function createCanvasObjectService(
  canvasRepo: CanvasRepositoryPort
): CanvasObjectService {
  return new CanvasObjectService(canvasRepo);
}
