/**
 * Pre-Flight Service
 * 
 * Manages the "Pre-Flight Check" gatekeeper that requires users to
 * acknowledge urgent items before accessing certain AP cells.
 * 
 * Responsibilities:
 * - Calculate priority scores for canvas objects
 * - Identify hard stops vs soft stops
 * - Track acknowledgments
 * - Determine blocked routes
 * 
 * Part of the Lively Layer for AP Manager.
 */

import type {
  CanvasRepositoryPort,
  CanvasObject,
  PreFlightStatus,
  CanvasAcknowledgment,
} from '@aibos/kernel-core';
import type { ActorContext } from '@aibos/canon-governance';
import { tryParseURN, type APCellCode, CELL_DISPLAY_CODES } from './urn';

// ============================================================================
// 1. TYPES
// ============================================================================

/**
 * Priority thresholds for pre-flight classification
 */
export const PRIORITY_THRESHOLDS = {
  HARD_STOP: 80,      // Must acknowledge individually
  SOFT_STOP: 50,       // Can batch acknowledge
  INFORMATIONAL: 20,   // Optional acknowledgment
} as const;

/**
 * Detailed pre-flight item for frontend
 */
export interface PreFlightItem {
  id: string;
  sourceRef?: string;
  title: string;
  subtitle: string;
  tags: string[];
  priorityScore: number;
  priorityReasons: string[];
  createdAt: Date;
  createdBy: { id: string; name?: string };
  reactions: { emoji: string; count: number }[];
  cellCode?: string;
  cellName?: string;
  entityId?: string;
}

/**
 * Blocked route with reason
 */
export interface BlockedRoute {
  route: string;
  reason: string;
  requiredAcknowledgments: string[];
}

/**
 * Extended pre-flight response for frontend
 */
export interface ExtendedPreFlightStatus extends PreFlightStatus {
  items: {
    hardStops: PreFlightItem[];
    softStops: PreFlightItem[];
    informational: PreFlightItem[];
  };
  blockedRoutes: BlockedRoute[];
  canProceed: boolean;
}

/**
 * Acknowledgment request
 */
export interface AcknowledgmentRequest {
  objectIds: string[];
  comment?: string;
  isBatchAcknowledgment?: boolean;
}

/**
 * Acknowledgment response
 */
export interface AcknowledgmentResponse {
  success: boolean;
  acknowledged: number;
  acknowledgments: CanvasAcknowledgment[];
  errors?: { objectId: string; error: string }[];
  newPreFlightStatus?: ExtendedPreFlightStatus;
}

// ============================================================================
// 2. PRIORITY REASON BUILDERS
// ============================================================================

function buildPriorityReasons(object: CanvasObject): string[] {
  const reasons: string[] = [];
  const data = object.displayData;
  
  // Amount-based reasons
  if (data.amount) {
    const amount = parseFloat(data.amount);
    if (amount >= 100000) reasons.push('Amount > $100K');
    else if (amount >= 50000) reasons.push('Amount > $50K');
    else if (amount >= 10000) reasons.push('Amount > $10K');
  }
  
  // Urgency-based reasons
  if (data.urgency === 'overdue') reasons.push('Overdue');
  else if (data.urgency === 'critical') reasons.push('Due today');
  else if (data.urgency === 'soon') reasons.push('Due within 3 days');
  
  // Tag-based reasons
  const urgentTags = object.tags.filter(t => 
    ['#URGENT', '#CRITICAL', '#REQUIRED', '#ESCALATED'].includes(t.toUpperCase())
  );
  if (urgentTags.length > 0) {
    reasons.push(`Tagged: ${urgentTags.join(', ')}`);
  }
  
  // Status-based reasons
  if (data.status === 'failed') reasons.push('Failed status');
  else if (data.status === 'exception') reasons.push('Has exceptions');
  
  // If object requires acknowledgment but no specific reason
  if (object.requiresAcknowledgment && reasons.length === 0) {
    reasons.push('Requires acknowledgment');
  }
  
  return reasons;
}

// ============================================================================
// 3. ROUTE BLOCKING RULES
// ============================================================================

/**
 * Route blocking rules based on cell and priority
 */
const ROUTE_BLOCKING_RULES: {
  cellCode: APCellCode;
  route: string;
  minPriority: number;
  description: string;
}[] = [
  { cellCode: '05', route: '/ap-manager/ap-05', minPriority: PRIORITY_THRESHOLDS.HARD_STOP, description: 'Payment requires acknowledgment' },
  { cellCode: '04', route: '/ap-manager/ap-04', minPriority: PRIORITY_THRESHOLDS.HARD_STOP, description: 'Approval requires acknowledgment' },
  { cellCode: '02', route: '/ap-manager/ap-02', minPriority: 90, description: 'Critical invoice requires acknowledgment' },
];

function determineBlockedRoutes(items: CanvasObject[]): BlockedRoute[] {
  const blockedRoutes: BlockedRoute[] = [];
  
  for (const rule of ROUTE_BLOCKING_RULES) {
    const blockingItems = items.filter(item => {
      if (item.priorityScore < rule.minPriority) return false;
      
      const parsed = item.sourceRef ? tryParseURN(item.sourceRef) : null;
      return parsed?.cell === rule.cellCode;
    });
    
    if (blockingItems.length > 0) {
      blockedRoutes.push({
        route: rule.route,
        reason: rule.description,
        requiredAcknowledgments: blockingItems.map(i => i.id),
      });
    }
  }
  
  return blockedRoutes;
}

// ============================================================================
// 4. SERVICE
// ============================================================================

/**
 * PreFlightService — Manages urgent item acknowledgment flow
 */
export class PreFlightService {
  constructor(
    private canvasRepo: CanvasRepositoryPort
  ) {}

  /**
   * Get pre-flight status for a user
   */
  async getPreFlightStatus(actor: ActorContext): Promise<ExtendedPreFlightStatus> {
    // Get unacknowledged urgent objects
    const urgentObjects = await this.canvasRepo.getUnacknowledgedUrgentObjects(
      actor.tenantId,
      actor.userId
    );
    
    // Classify by priority
    const hardStops = urgentObjects.filter(o => o.priorityScore >= PRIORITY_THRESHOLDS.HARD_STOP);
    const softStops = urgentObjects.filter(o => 
      o.priorityScore >= PRIORITY_THRESHOLDS.SOFT_STOP && 
      o.priorityScore < PRIORITY_THRESHOLDS.HARD_STOP
    );
    const informational = urgentObjects.filter(o => 
      o.priorityScore >= PRIORITY_THRESHOLDS.INFORMATIONAL && 
      o.priorityScore < PRIORITY_THRESHOLDS.SOFT_STOP
    );
    
    // Transform to detailed items
    const transformItem = async (object: CanvasObject): Promise<PreFlightItem> => {
      const parsed = object.sourceRef ? tryParseURN(object.sourceRef) : null;
      const reactions = await this.canvasRepo.getReactionCounts(object.id);
      
      return {
        id: object.id,
        sourceRef: object.sourceRef,
        title: object.displayData.title ?? 'Untitled',
        subtitle: object.displayData.subtitle ?? '',
        tags: object.tags,
        priorityScore: object.priorityScore,
        priorityReasons: buildPriorityReasons(object),
        createdAt: object.createdAt,
        createdBy: { id: object.createdBy },
        reactions,
        cellCode: parsed?.cellDisplayCode,
        cellName: parsed ? CELL_DISPLAY_CODES[parsed.cell] : undefined,
        entityId: parsed?.entityId,
      };
    };
    
    const [hardStopItems, softStopItems, infoItems] = await Promise.all([
      Promise.all(hardStops.map(transformItem)),
      Promise.all(softStops.map(transformItem)),
      Promise.all(informational.map(transformItem)),
    ]);
    
    // Determine blocked routes
    const blockedRoutes = determineBlockedRoutes(hardStops);
    
    const totalUrgent = hardStops.length + softStops.length + informational.length;
    const highestPriority = urgentObjects.length > 0 
      ? Math.max(...urgentObjects.map(o => o.priorityScore))
      : 0;
    
    return {
      requiresAcknowledgment: hardStops.length > 0,
      hardStops,
      softStops,
      informational,
      totalUrgent,
      highestPriority,
      items: {
        hardStops: hardStopItems,
        softStops: softStopItems,
        informational: infoItems,
      },
      blockedRoutes,
      canProceed: hardStops.length === 0,
    };
  }

  /**
   * Acknowledge urgent items
   */
  async acknowledge(
    request: AcknowledgmentRequest,
    actor: ActorContext
  ): Promise<AcknowledgmentResponse> {
    const acknowledgments: CanvasAcknowledgment[] = [];
    const errors: { objectId: string; error: string }[] = [];
    
    for (const objectId of request.objectIds) {
      try {
        // Get the object
        const object = await this.canvasRepo.findObjectById(objectId, actor.tenantId);
        
        if (!object) {
          errors.push({ objectId, error: 'Object not found' });
          continue;
        }
        
        // Check if hard stop and batch acknowledgment is requested
        if (
          request.isBatchAcknowledgment && 
          object.priorityScore >= PRIORITY_THRESHOLDS.HARD_STOP
        ) {
          errors.push({ 
            objectId, 
            error: 'Hard stop items must be acknowledged individually' 
          });
          continue;
        }
        
        // Check if already acknowledged
        const existing = await this.canvasRepo.findAcknowledgment(objectId, actor.userId);
        if (existing) {
          // Already acknowledged, skip
          acknowledgments.push(existing);
          continue;
        }
        
        // Create acknowledgment
        const ack = await this.canvasRepo.createAcknowledgment({
          objectId,
          userId: actor.userId,
          comment: request.comment,
        });
        
        acknowledgments.push(ack);
        
        // Log to audit
        await this.canvasRepo.createAuditEntry({
          tenantId: actor.tenantId,
          action: 'acknowledged',
          actorId: actor.userId,
          actorName: actor.userName,
          objectId,
          objectSourceRef: object.sourceRef,
          afterState: { comment: request.comment, priorityScore: object.priorityScore },
        });
      } catch (error) {
        errors.push({ 
          objectId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
    
    // Get new pre-flight status
    const newStatus = await this.getPreFlightStatus(actor);
    
    return {
      success: errors.length === 0,
      acknowledged: acknowledgments.length,
      acknowledgments,
      errors: errors.length > 0 ? errors : undefined,
      newPreFlightStatus: newStatus,
    };
  }

  /**
   * Check if a specific route is blocked for the user
   */
  async isRouteBlocked(
    route: string,
    actor: ActorContext
  ): Promise<{ blocked: boolean; reason?: string; requiredAcknowledgments?: string[] }> {
    const status = await this.getPreFlightStatus(actor);
    
    const blockedRoute = status.blockedRoutes.find(r => r.route === route);
    
    if (blockedRoute) {
      return {
        blocked: true,
        reason: blockedRoute.reason,
        requiredAcknowledgments: blockedRoute.requiredAcknowledgments,
      };
    }
    
    return { blocked: false };
  }

  /**
   * Get acknowledgment history for an object
   */
  async getAcknowledgmentHistory(
    objectId: string,
    actor: ActorContext
  ): Promise<CanvasAcknowledgment[]> {
    return this.canvasRepo.listAcknowledgmentsForObject(objectId);
  }

  /**
   * Recalculate priority score for an object
   * Called when reactions change or time passes
   */
  async recalculatePriority(
    objectId: string,
    actor: ActorContext
  ): Promise<{ oldScore: number; newScore: number }> {
    const object = await this.canvasRepo.findObjectById(objectId, actor.tenantId);
    
    if (!object) {
      throw new Error(`Object ${objectId} not found`);
    }
    
    const oldScore = object.priorityScore;
    
    // Get reactions for scoring
    const reactions = await this.canvasRepo.listReactionsForObject(objectId);
    const hasRedFlag = reactions.some(r => r.emoji === '🚩');
    const hasUrgentTag = object.tags.some(t => 
      ['#URGENT', '#CRITICAL', '#REQUIRED'].includes(t.toUpperCase())
    );
    
    // Recalculate score
    let newScore = 0;
    
    // Amount factor
    const amount = object.displayData.amount ? parseFloat(object.displayData.amount) : 0;
    if (amount >= 100000) newScore += 30;
    else if (amount >= 50000) newScore += 25;
    else if (amount >= 10000) newScore += 15;
    else if (amount >= 1000) newScore += 5;
    
    // Urgency factor
    if (object.displayData.urgency === 'overdue') newScore += 25;
    else if (object.displayData.urgency === 'critical') newScore += 20;
    else if (object.displayData.urgency === 'soon') newScore += 10;
    
    // Reaction factor
    if (hasRedFlag) newScore += 20;
    
    // Tag factor
    if (hasUrgentTag) newScore += 15;
    
    // Status factor
    if (object.displayData.status === 'failed' || object.displayData.status === 'exception') {
      newScore += 15;
    }
    
    newScore = Math.min(newScore, 100);
    
    // Update if changed
    if (newScore !== oldScore) {
      await this.canvasRepo.updateObject(
        objectId,
        {
          priorityScore: newScore,
          requiresAcknowledgment: newScore >= PRIORITY_THRESHOLDS.INFORMATIONAL,
          updatedBy: actor.userId,
        },
        object.version
      );
    }
    
    return { oldScore, newScore };
  }
}

// ============================================================================
// 5. FACTORY
// ============================================================================

export function createPreFlightService(
  canvasRepo: CanvasRepositoryPort
): PreFlightService {
  return new PreFlightService(canvasRepo);
}
