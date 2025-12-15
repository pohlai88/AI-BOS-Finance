// metadata-studio/services/tier-promotion.service.ts

/**
 * Tier Promotion Service
 * 
 * GRCD Phase 3: Agent Autonomy Management
 * 
 * Tracks agent performance and manages autonomy tier promotions/demotions.
 */

import { db } from '../db/client';
import { mdmAgentPerformance } from '../db/schema/auto-apply.tables';
import { eq, and } from 'drizzle-orm';

// ============================================================================
// Types
// ============================================================================

export type AutonomyTier = 'tier0' | 'tier1' | 'tier2' | 'tier3';
export type AgentType = 'data_quality_sentinel' | 'schema_drift_detector' | 'lineage_analyzer' | 'naming_validator';

export interface PromotionCriteria {
  minApprovalRate: number;      // % of proposals approved
  minProposals: number;         // Minimum proposals to consider
  minHelpfulRate: number;       // % of feedback marked helpful
  maxRollbackRate: number;      // Max % of changes rolled back
  minDaysSinceLastPromotion: number;
  consecutiveErrorsThreshold: number;
}

export interface PromotionEvaluation {
  agentType: AgentType;
  currentTier: AutonomyTier;
  eligible: boolean;
  targetTier?: AutonomyTier;
  reasons: string[];
  metrics: {
    approvalRate: number;
    helpfulRate: number;
    rollbackRate: number;
    totalProposals: number;
    consecutiveErrors: number;
  };
}

// ============================================================================
// Promotion Criteria by Target Tier
// ============================================================================

const PROMOTION_CRITERIA: Record<AutonomyTier, PromotionCriteria> = {
  tier0: {
    // Cannot be promoted to tier0 - this is the starting tier
    minApprovalRate: 0,
    minProposals: 0,
    minHelpfulRate: 0,
    maxRollbackRate: 100,
    minDaysSinceLastPromotion: 0,
    consecutiveErrorsThreshold: 999,
  },
  tier1: {
    // Basic observation tier - easy to achieve
    minApprovalRate: 50,
    minProposals: 5,
    minHelpfulRate: 40,
    maxRollbackRate: 30,
    minDaysSinceLastPromotion: 7,
    consecutiveErrorsThreshold: 5,
  },
  tier2: {
    // Proposal tier - moderate requirements
    minApprovalRate: 70,
    minProposals: 20,
    minHelpfulRate: 60,
    maxRollbackRate: 15,
    minDaysSinceLastPromotion: 14,
    consecutiveErrorsThreshold: 3,
  },
  tier3: {
    // Auto-apply tier - strict requirements
    minApprovalRate: 90,
    minProposals: 50,
    minHelpfulRate: 80,
    maxRollbackRate: 5,
    minDaysSinceLastPromotion: 30,
    consecutiveErrorsThreshold: 1,
  },
};

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Evaluate if an agent is eligible for promotion
 */
export async function evaluatePromotion(
  tenantId: string,
  agentType: AgentType,
): Promise<PromotionEvaluation> {
  const performance = await getOrCreatePerformance(tenantId, agentType);
  
  const currentTier = performance.currentTier as AutonomyTier;
  const nextTier = getNextTier(currentTier);
  
  // Calculate metrics
  const approvalRate = performance.totalProposals > 0
    ? (performance.approvedProposals / performance.totalProposals) * 100
    : 0;
  
  const helpfulRate = (performance.helpfulFeedbackCount + performance.notHelpfulFeedbackCount) > 0
    ? (performance.helpfulFeedbackCount / (performance.helpfulFeedbackCount + performance.notHelpfulFeedbackCount)) * 100
    : 0;
  
  const rollbackRate = performance.autoAppliedChanges > 0
    ? (performance.rolledBackChanges / performance.autoAppliedChanges) * 100
    : 0;

  const metrics = {
    approvalRate: Math.round(approvalRate),
    helpfulRate: Math.round(helpfulRate),
    rollbackRate: Math.round(rollbackRate),
    totalProposals: performance.totalProposals,
    consecutiveErrors: performance.consecutiveErrors,
  };

  // Check if at max tier
  if (!nextTier) {
    return {
      agentType,
      currentTier,
      eligible: false,
      reasons: ['Already at maximum autonomy tier'],
      metrics,
    };
  }

  const criteria = PROMOTION_CRITERIA[nextTier];
  const reasons: string[] = [];
  let eligible = true;

  // Check each criterion
  if (performance.totalProposals < criteria.minProposals) {
    eligible = false;
    reasons.push(`Insufficient proposals: ${performance.totalProposals}/${criteria.minProposals}`);
  }

  if (approvalRate < criteria.minApprovalRate) {
    eligible = false;
    reasons.push(`Approval rate too low: ${metrics.approvalRate}%/${criteria.minApprovalRate}%`);
  }

  if (helpfulRate < criteria.minHelpfulRate) {
    eligible = false;
    reasons.push(`Helpful rate too low: ${metrics.helpfulRate}%/${criteria.minHelpfulRate}%`);
  }

  if (rollbackRate > criteria.maxRollbackRate) {
    eligible = false;
    reasons.push(`Rollback rate too high: ${metrics.rollbackRate}%/${criteria.maxRollbackRate}%`);
  }

  if (performance.consecutiveErrors >= criteria.consecutiveErrorsThreshold) {
    eligible = false;
    reasons.push(`Too many consecutive errors: ${performance.consecutiveErrors}`);
  }

  // Check time since last promotion
  if (performance.lastPromotionAt) {
    const daysSincePromotion = Math.floor(
      (Date.now() - performance.lastPromotionAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSincePromotion < criteria.minDaysSinceLastPromotion) {
      eligible = false;
      reasons.push(`Too soon since last promotion: ${daysSincePromotion}/${criteria.minDaysSinceLastPromotion} days`);
    }
  }

  if (eligible) {
    reasons.push('All promotion criteria met');
  }

  return {
    agentType,
    currentTier,
    eligible,
    targetTier: eligible ? nextTier : undefined,
    reasons,
    metrics,
  };
}

/**
 * Promote an agent to the next tier
 */
export async function promoteAgent(
  tenantId: string,
  agentType: AgentType,
): Promise<{ success: boolean; newTier?: AutonomyTier; error?: string }> {
  const evaluation = await evaluatePromotion(tenantId, agentType);

  if (!evaluation.eligible || !evaluation.targetTier) {
    return {
      success: false,
      error: `Agent not eligible for promotion: ${evaluation.reasons.join('; ')}`,
    };
  }

  const performance = await getOrCreatePerformance(tenantId, agentType);

  await db
    .update(mdmAgentPerformance)
    .set({
      currentTier: evaluation.targetTier,
      lastPromotionAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(mdmAgentPerformance.id, performance.id));

  return {
    success: true,
    newTier: evaluation.targetTier,
  };
}

/**
 * Demote an agent (usually after rollbacks or errors)
 */
export async function demoteAgent(
  tenantId: string,
  agentType: AgentType,
  reason: string,
): Promise<{ success: boolean; newTier: AutonomyTier }> {
  const performance = await getOrCreatePerformance(tenantId, agentType);
  const currentTier = performance.currentTier as AutonomyTier;
  const previousTier = getPreviousTier(currentTier);

  await db
    .update(mdmAgentPerformance)
    .set({
      currentTier: previousTier,
      lastDemotionAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(mdmAgentPerformance.id, performance.id));

  return {
    success: true,
    newTier: previousTier,
  };
}

/**
 * Record a proposal outcome for an agent
 */
export async function recordProposalOutcome(
  tenantId: string,
  agentType: AgentType,
  outcome: 'approved' | 'rejected',
  confidenceScore?: number,
): Promise<void> {
  const performance = await getOrCreatePerformance(tenantId, agentType);

  await db
    .update(mdmAgentPerformance)
    .set({
      totalProposals: performance.totalProposals + 1,
      approvedProposals: outcome === 'approved' 
        ? performance.approvedProposals + 1 
        : performance.approvedProposals,
      rejectedProposals: outcome === 'rejected'
        ? performance.rejectedProposals + 1
        : performance.rejectedProposals,
      avgConfidenceScore: confidenceScore
        ? Math.round((performance.avgConfidenceScore ?? 0 + confidenceScore) / 2)
        : performance.avgConfidenceScore,
      updatedAt: new Date(),
    })
    .where(eq(mdmAgentPerformance.id, performance.id));
}

/**
 * Record feedback for an agent's proposal
 */
export async function recordFeedback(
  tenantId: string,
  agentType: AgentType,
  wasHelpful: boolean,
): Promise<void> {
  const performance = await getOrCreatePerformance(tenantId, agentType);

  await db
    .update(mdmAgentPerformance)
    .set({
      helpfulFeedbackCount: wasHelpful
        ? performance.helpfulFeedbackCount + 1
        : performance.helpfulFeedbackCount,
      notHelpfulFeedbackCount: !wasHelpful
        ? performance.notHelpfulFeedbackCount + 1
        : performance.notHelpfulFeedbackCount,
      updatedAt: new Date(),
    })
    .where(eq(mdmAgentPerformance.id, performance.id));
}

/**
 * Get performance dashboard for all agents
 */
export async function getAgentDashboard(
  tenantId: string,
): Promise<Array<{
  agentType: AgentType;
  currentTier: AutonomyTier;
  metrics: PromotionEvaluation['metrics'];
  promotionEligible: boolean;
}>> {
  const agents: AgentType[] = [
    'data_quality_sentinel',
    'schema_drift_detector',
    'lineage_analyzer',
    'naming_validator',
  ];

  const results = [];

  for (const agentType of agents) {
    const evaluation = await evaluatePromotion(tenantId, agentType);
    results.push({
      agentType,
      currentTier: evaluation.currentTier,
      metrics: evaluation.metrics,
      promotionEligible: evaluation.eligible,
    });
  }

  return results;
}

// ============================================================================
// Helper Functions
// ============================================================================

async function getOrCreatePerformance(
  tenantId: string,
  agentType: AgentType,
): Promise<typeof mdmAgentPerformance.$inferSelect> {
  const [existing] = await db
    .select()
    .from(mdmAgentPerformance)
    .where(
      and(
        eq(mdmAgentPerformance.tenantId, tenantId),
        eq(mdmAgentPerformance.agentType, agentType),
      ),
    )
    .limit(1);

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(mdmAgentPerformance)
    .values({
      tenantId,
      agentType,
      currentTier: 'tier1', // Start at observation tier
    })
    .returning();

  return created;
}

function getNextTier(current: AutonomyTier): AutonomyTier | null {
  const tiers: AutonomyTier[] = ['tier0', 'tier1', 'tier2', 'tier3'];
  const currentIndex = tiers.indexOf(current);
  return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
}

function getPreviousTier(current: AutonomyTier): AutonomyTier {
  const tiers: AutonomyTier[] = ['tier0', 'tier1', 'tier2', 'tier3'];
  const currentIndex = tiers.indexOf(current);
  return currentIndex > 0 ? tiers[currentIndex - 1] : 'tier0';
}

