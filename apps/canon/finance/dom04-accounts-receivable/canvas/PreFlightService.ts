/**
 * Pre-Flight Service
 * 
 * Manages the "Pre-Flight Check" gatekeeper that requires users to
 * acknowledge urgent items before accessing certain AR cells.
 * 
 * AR-specific focus:
 * - Overdue accounts (120+ days)
 * - High-value overdue invoices (>$50K)
 * - Customers over credit limit
 * - Write-off pending items
 * 
 * Part of the Lively Layer for AR Manager.
 * 
 * @module AR-Canvas
 */

import type {
  CanvasRepositoryPort,
  CanvasObject,
  PreFlightStatus,
  CanvasAcknowledgment,
} from '@aibos/kernel-core';
import type { ActorContext } from '@aibos/canon-governance';
import { tryParseURN, type ARCellCode, CELL_DISPLAY_CODES } from './urn';

// =============================================================================
// 1. TYPES
// =============================================================================

/**
 * Priority thresholds for pre-flight classification
 */
export const PRIORITY_THRESHOLDS = {
  HARD_STOP: 80,       // Must acknowledge individually
  SOFT_STOP: 50,       // Can batch acknowledge
  INFORMATIONAL: 20,   // Optional acknowledgment
} as const;

/**
 * AR-specific priority factors
 */
export const AR_PRIORITY_FACTORS = {
  OVER_120_DAYS: 35,
  OVER_90_DAYS: 25,
  OVER_60_DAYS: 15,
  OVER_30_DAYS: 10,
  OVER_CREDIT_LIMIT: 30,
  HIGH_VALUE_50K: 25,
  HIGH_VALUE_100K: 30,
  WRITE_OFF_PENDING: 40,
  RED_FLAG: 25,
  NO_CONTACT_30_DAYS: 20,
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
  /** AR-specific: days overdue */
  daysOverdue?: number;
  /** AR-specific: outstanding amount */
  outstandingAmount?: number;
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
  /** AR-specific: total amount at risk */
  totalAmountAtRisk: number;
  /** AR-specific: count of 120+ day accounts */
  criticalAccountCount: number;
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

// =============================================================================
// 2. PRIORITY REASON BUILDERS
// =============================================================================

function buildPriorityReasons(object: CanvasObject): string[] {
  const reasons: string[] = [];
  const data = object.displayData;
  const metadata = data.metadata ?? {};
  
  // Days overdue reasons
  const daysOverdue = metadata.daysOverdue as number | undefined;
  if (daysOverdue !== undefined) {
    if (daysOverdue >= 120) reasons.push('120+ days overdue');
    else if (daysOverdue >= 90) reasons.push('90+ days overdue');
    else if (daysOverdue >= 60) reasons.push('60+ days overdue');
    else if (daysOverdue >= 30) reasons.push('30+ days overdue');
  }
  
  // Amount-based reasons
  if (data.amount) {
    const amount = parseFloat(data.amount);
    if (amount >= 100000) reasons.push('Amount > $100K');
    else if (amount >= 50000) reasons.push('Amount > $50K');
    else if (amount >= 10000) reasons.push('Amount > $10K');
  }
  
  // Credit limit breach
  if (metadata.creditUtilization && (metadata.creditUtilization as number) > 100) {
    reasons.push('Over credit limit');
  }
  
  // Collection status
  if (metadata.collectionStatus === 'COLLECTION') {
    reasons.push('In collection');
  }
  
  // Risk level
  if (metadata.riskLevel === 'HIGH') {
    reasons.push('High risk customer');
  }
  
  // Tag-based reasons
  const urgentTags = object.tags.filter(t => 
    ['#RISK', '#OVERDUE', '#COLLECTION', '#WRITEOFF', '#ESCALATED', '#CRITICAL'].includes(t.toUpperCase())
  );
  if (urgentTags.length > 0) {
    reasons.push(`Tagged: ${urgentTags.join(', ')}`);
  }
  
  // Write-off pending
  if (object.tags.includes('#WRITEOFF_REVIEW')) {
    reasons.push('Pending write-off approval');
  }
  
  // No recent contact
  const lastContactDate = metadata.lastContactDate as string | undefined;
  if (lastContactDate) {
    const daysSinceContact = Math.floor(
      (Date.now() - new Date(lastContactDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceContact > 30) {
      reasons.push(`No contact in ${daysSinceContact} days`);
    }
  }
  
  // Urgency-based reasons
  if (data.urgency === 'overdue') reasons.push('Overdue');
  else if (data.urgency === 'critical') reasons.push('Critical urgency');
  
  // If object requires acknowledgment but no specific reason
  if (object.requiresAcknowledgment && reasons.length === 0) {
    reasons.push('Requires acknowledgment');
  }
  
  return reasons;
}

// =============================================================================
// 3. ROUTE BLOCKING RULES
// =============================================================================

/**
 * Route blocking rules based on cell and priority
 */
const ROUTE_BLOCKING_RULES: {
  cellCode: ARCellCode;
  route: string;
  minPriority: number;
  description: string;
}[] = [
  { cellCode: '05', route: '/ar-manager/ar-05', minPriority: PRIORITY_THRESHOLDS.HARD_STOP, description: 'Critical aging item requires acknowledgment' },
  { cellCode: '01', route: '/ar-manager/ar-01', minPriority: 90, description: 'High-risk customer requires acknowledgment' },
  { cellCode: '02', route: '/ar-manager/ar-02', minPriority: PRIORITY_THRESHOLDS.HARD_STOP, description: 'Critical overdue invoice requires acknowledgment' },
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

// =============================================================================
// 4. SERVICE
// =============================================================================

/**
 * PreFlightService — Manages urgent item acknowledgment flow for AR
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
      const metadata = object.displayData.metadata ?? {};
      
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
        daysOverdue: metadata.daysOverdue as number | undefined,
        outstandingAmount: object.displayData.amount ? parseFloat(object.displayData.amount) : undefined,
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
    
    // Calculate AR-specific metrics
    const totalAmountAtRisk = urgentObjects.reduce((sum, o) => {
      const amount = o.displayData.amount ? parseFloat(o.displayData.amount) : 0;
      return sum + amount;
    }, 0);
    
    const criticalAccountCount = hardStops.filter(o => {
      const daysOverdue = (o.displayData.metadata?.daysOverdue as number) ?? 0;
      return daysOverdue >= 120;
    }).length;
    
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
      totalAmountAtRisk,
      criticalAccountCount,
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
          afterState: { 
            comment: request.comment, 
            priorityScore: object.priorityScore,
            daysOverdue: object.displayData.metadata?.daysOverdue,
            amount: object.displayData.amount,
          },
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
   * Recalculate priority score for an AR object
   * Called when aging changes, payments received, or reactions change
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
    const metadata = object.displayData.metadata ?? {};
    
    // Get reactions for scoring
    const reactions = await this.canvasRepo.listReactionsForObject(objectId);
    const hasRedFlag = reactions.some(r => r.emoji === '🚩');
    const hasRiskTag = object.tags.some(t => 
      ['#RISK', '#COLLECTION', '#WRITEOFF'].includes(t.toUpperCase())
    );
    
    // Recalculate score based on AR factors
    let newScore = 0;
    
    // Days overdue factor (major weight for AR)
    const daysOverdue = metadata.daysOverdue as number | undefined ?? 0;
    if (daysOverdue >= 120) newScore += AR_PRIORITY_FACTORS.OVER_120_DAYS;
    else if (daysOverdue >= 90) newScore += AR_PRIORITY_FACTORS.OVER_90_DAYS;
    else if (daysOverdue >= 60) newScore += AR_PRIORITY_FACTORS.OVER_60_DAYS;
    else if (daysOverdue >= 30) newScore += AR_PRIORITY_FACTORS.OVER_30_DAYS;
    
    // Amount factor
    const amount = object.displayData.amount ? parseFloat(object.displayData.amount) : 0;
    if (amount >= 100000) newScore += AR_PRIORITY_FACTORS.HIGH_VALUE_100K;
    else if (amount >= 50000) newScore += AR_PRIORITY_FACTORS.HIGH_VALUE_50K;
    else if (amount >= 10000) newScore += 10;
    
    // Credit limit factor
    const creditUtilization = metadata.creditUtilization as number | undefined;
    if (creditUtilization && creditUtilization > 100) {
      newScore += AR_PRIORITY_FACTORS.OVER_CREDIT_LIMIT;
    }
    
    // Write-off pending
    if (object.tags.includes('#WRITEOFF_REVIEW')) {
      newScore += AR_PRIORITY_FACTORS.WRITE_OFF_PENDING;
    }
    
    // Red flag from team
    if (hasRedFlag) newScore += AR_PRIORITY_FACTORS.RED_FLAG;
    
    // Risk tags
    if (hasRiskTag) newScore += 15;
    
    // No contact factor
    const lastContactDate = metadata.lastContactDate as string | undefined;
    if (lastContactDate) {
      const daysSinceContact = Math.floor(
        (Date.now() - new Date(lastContactDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceContact > 30 && daysOverdue > 0) {
        newScore += AR_PRIORITY_FACTORS.NO_CONTACT_30_DAYS;
      }
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

// =============================================================================
// 5. FACTORY
// =============================================================================

export function createPreFlightService(
  canvasRepo: CanvasRepositoryPort
): PreFlightService {
  return new PreFlightService(canvasRepo);
}
