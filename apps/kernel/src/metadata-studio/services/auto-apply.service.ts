// metadata-studio/services/auto-apply.service.ts

/**
 * Auto-Apply Service
 * 
 * GRCD Phase 3: Guarded Auto-Apply
 * 
 * Evaluates proposals against guardrails and auto-applies
 * low-risk, high-confidence changes without human intervention.
 */

import { db } from '../db/client';
import {
  mdmAutoApplyConfig,
  mdmChangeHistory,
  mdmAgentPerformance,
} from '../db/schema/auto-apply.tables';
import { mdmAgentProposal } from '../db/schema/naming-policy.tables';
import { mdmApproval } from '../db/schema/approval.tables';
import { eq, and, gte, sql } from 'drizzle-orm';

// ============================================================================
// Types
// ============================================================================

export interface AutoApplyEvaluation {
  canAutoApply: boolean;
  reasons: string[];
  guardrailsPassed: string[];
  guardrailsFailed: string[];
  recommendation: 'auto_apply' | 'require_approval' | 'reject';
}

export interface AutoApplyResult {
  success: boolean;
  applied: boolean;
  changeHistoryId?: string;
  error?: string;
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Evaluate if a proposal can be auto-applied
 */
export async function evaluateAutoApply(
  proposalId: string,
  tenantId: string,
): Promise<AutoApplyEvaluation> {
  const guardrailsPassed: string[] = [];
  const guardrailsFailed: string[] = [];
  const reasons: string[] = [];

  // 1. Get proposal and approval
  const [proposal] = await db
    .select()
    .from(mdmAgentProposal)
    .innerJoin(mdmApproval, eq(mdmAgentProposal.approvalId, mdmApproval.id))
    .where(eq(mdmAgentProposal.id, proposalId))
    .limit(1);

  if (!proposal) {
    return {
      canAutoApply: false,
      reasons: ['Proposal not found'],
      guardrailsPassed: [],
      guardrailsFailed: ['proposal_exists'],
      recommendation: 'reject',
    };
  }

  const { mdm_agent_proposal: agentProposal, mdm_approval: approval } = proposal;

  // 2. Get auto-apply config
  const config = await getAutoApplyConfig(
    tenantId,
    approval.entityType,
    agentProposal.agentType,
  );

  if (!config || !config.enabled) {
    return {
      canAutoApply: false,
      reasons: ['Auto-apply is not enabled for this entity/agent combination'],
      guardrailsPassed: [],
      guardrailsFailed: ['auto_apply_enabled'],
      recommendation: 'require_approval',
    };
  }

  // 3. Check confidence score
  const confidenceScore = agentProposal.confidenceScore 
    ? parseInt(agentProposal.confidenceScore, 10) 
    : getConfidenceValue(agentProposal.confidence);

  if (confidenceScore >= config.minConfidenceScore) {
    guardrailsPassed.push('confidence_threshold');
  } else {
    guardrailsFailed.push('confidence_threshold');
    reasons.push(`Confidence ${confidenceScore}% below threshold ${config.minConfidenceScore}%`);
  }

  // 4. Check risk level
  const riskOrder = ['minimal', 'low', 'medium', 'high', 'critical'];
  const proposalRiskIndex = riskOrder.indexOf(agentProposal.riskLevel);
  const maxRiskIndex = riskOrder.indexOf(config.maxRiskLevel);

  if (proposalRiskIndex <= maxRiskIndex) {
    guardrailsPassed.push('risk_level');
  } else {
    guardrailsFailed.push('risk_level');
    reasons.push(`Risk level "${agentProposal.riskLevel}" exceeds max "${config.maxRiskLevel}"`);
  }

  // 5. Check tier
  const allowedTiers = config.allowedTiers as string[];
  if (allowedTiers.includes(approval.tier)) {
    guardrailsPassed.push('tier_allowed');
  } else {
    guardrailsFailed.push('tier_allowed');
    reasons.push(`Tier "${approval.tier}" not in allowed tiers: ${allowedTiers.join(', ')}`);
  }

  // 6. Check action
  const allowedActions = config.allowedActions as string[];
  if (allowedActions.includes(agentProposal.suggestedAction)) {
    guardrailsPassed.push('action_allowed');
  } else {
    guardrailsFailed.push('action_allowed');
    reasons.push(`Action "${agentProposal.suggestedAction}" not in allowed actions`);
  }

  // 7. Check rate limits
  const rateLimitOk = await checkRateLimits(tenantId, agentProposal.agentType, config);
  if (rateLimitOk) {
    guardrailsPassed.push('rate_limits');
  } else {
    guardrailsFailed.push('rate_limits');
    reasons.push('Rate limit exceeded for auto-applies');
  }

  // 8. Check agent performance (no consecutive errors)
  const performance = await getAgentPerformance(tenantId, agentProposal.agentType);
  if (!performance || performance.consecutiveErrors < 3) {
    guardrailsPassed.push('agent_health');
  } else {
    guardrailsFailed.push('agent_health');
    reasons.push(`Agent has ${performance.consecutiveErrors} consecutive errors`);
  }

  // Determine recommendation
  const canAutoApply = guardrailsFailed.length === 0;
  
  return {
    canAutoApply,
    reasons,
    guardrailsPassed,
    guardrailsFailed,
    recommendation: canAutoApply ? 'auto_apply' : 'require_approval',
  };
}

/**
 * Auto-apply a proposal after passing guardrails
 */
export async function autoApplyProposal(
  proposalId: string,
  tenantId: string,
): Promise<AutoApplyResult> {
  // 1. Evaluate guardrails
  const evaluation = await evaluateAutoApply(proposalId, tenantId);

  if (!evaluation.canAutoApply) {
    return {
      success: false,
      applied: false,
      error: `Cannot auto-apply: ${evaluation.reasons.join('; ')}`,
    };
  }

  // 2. Get proposal details
  const [proposal] = await db
    .select()
    .from(mdmAgentProposal)
    .innerJoin(mdmApproval, eq(mdmAgentProposal.approvalId, mdmApproval.id))
    .where(eq(mdmAgentProposal.id, proposalId))
    .limit(1);

  if (!proposal) {
    return { success: false, applied: false, error: 'Proposal not found' };
  }

  const { mdm_agent_proposal: agentProposal, mdm_approval: approval } = proposal;

  try {
    // 3. Record change history (for rollback)
    const [changeHistory] = await db
      .insert(mdmChangeHistory)
      .values({
        tenantId,
        entityType: approval.entityType as any,
        entityId: approval.entityId ?? crypto.randomUUID(),
        entityKey: approval.entityKey,
        changeType: mapActionToChangeType(agentProposal.suggestedAction),
        previousState: approval.currentState,
        newState: approval.payload,
        changedBy: `agent:${agentProposal.agentType}`,
        changeSource: 'agent_auto',
        agentType: agentProposal.agentType,
        proposalId: agentProposal.id,
      })
      .returning();

    // 4. Update approval status
    await db
      .update(mdmApproval)
      .set({
        status: 'approved',
        decidedBy: 'system:auto_apply',
        decidedAt: new Date(),
        decisionReason: 'Auto-applied by guardrails evaluation',
      })
      .where(eq(mdmApproval.id, approval.id));

    // 5. Update agent performance
    await updateAgentPerformance(tenantId, agentProposal.agentType, {
      autoApplied: true,
      success: true,
    });

    return {
      success: true,
      applied: true,
      changeHistoryId: changeHistory.id,
    };
  } catch (error) {
    // Record error in agent performance
    await updateAgentPerformance(tenantId, agentProposal.agentType, {
      autoApplied: false,
      success: false,
    });

    return {
      success: false,
      applied: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

async function getAutoApplyConfig(
  tenantId: string,
  entityType: string,
  agentType: string,
): Promise<typeof mdmAutoApplyConfig.$inferSelect | null> {
  // Try specific config first
  const [specific] = await db
    .select()
    .from(mdmAutoApplyConfig)
    .where(
      and(
        eq(mdmAutoApplyConfig.tenantId, tenantId),
        eq(mdmAutoApplyConfig.entityType, entityType as any),
        eq(mdmAutoApplyConfig.agentType, agentType),
      ),
    )
    .limit(1);

  if (specific) return specific;

  // Fall back to entity-wide config
  const [entityWide] = await db
    .select()
    .from(mdmAutoApplyConfig)
    .where(
      and(
        eq(mdmAutoApplyConfig.tenantId, tenantId),
        eq(mdmAutoApplyConfig.entityType, entityType as any),
        sql`${mdmAutoApplyConfig.agentType} IS NULL`,
      ),
    )
    .limit(1);

  if (entityWide) return entityWide;

  // Fall back to global config
  const [global] = await db
    .select()
    .from(mdmAutoApplyConfig)
    .where(
      and(
        eq(mdmAutoApplyConfig.tenantId, tenantId),
        eq(mdmAutoApplyConfig.entityType, 'ALL'),
      ),
    )
    .limit(1);

  return global ?? null;
}

async function checkRateLimits(
  tenantId: string,
  agentType: string,
  config: typeof mdmAutoApplyConfig.$inferSelect,
): Promise<boolean> {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Count auto-applies in last hour
  const hourlyCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(mdmChangeHistory)
    .where(
      and(
        eq(mdmChangeHistory.tenantId, tenantId),
        eq(mdmChangeHistory.changeSource, 'agent_auto'),
        eq(mdmChangeHistory.agentType, agentType),
        gte(mdmChangeHistory.createdAt, hourAgo),
      ),
    );

  if ((hourlyCount[0]?.count ?? 0) >= config.maxAutoAppliesPerHour) {
    return false;
  }

  // Count auto-applies in last day
  const dailyCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(mdmChangeHistory)
    .where(
      and(
        eq(mdmChangeHistory.tenantId, tenantId),
        eq(mdmChangeHistory.changeSource, 'agent_auto'),
        eq(mdmChangeHistory.agentType, agentType),
        gte(mdmChangeHistory.createdAt, dayAgo),
      ),
    );

  return (dailyCount[0]?.count ?? 0) < config.maxAutoAppliesPerDay;
}

async function getAgentPerformance(
  tenantId: string,
  agentType: string,
): Promise<typeof mdmAgentPerformance.$inferSelect | null> {
  const [perf] = await db
    .select()
    .from(mdmAgentPerformance)
    .where(
      and(
        eq(mdmAgentPerformance.tenantId, tenantId),
        eq(mdmAgentPerformance.agentType, agentType as any),
      ),
    )
    .limit(1);

  return perf ?? null;
}

async function updateAgentPerformance(
  tenantId: string,
  agentType: string,
  update: { autoApplied: boolean; success: boolean },
): Promise<void> {
  const existing = await getAgentPerformance(tenantId, agentType);

  if (existing) {
    await db
      .update(mdmAgentPerformance)
      .set({
        autoAppliedChanges: update.autoApplied && update.success 
          ? sql`${mdmAgentPerformance.autoAppliedChanges} + 1` 
          : mdmAgentPerformance.autoAppliedChanges,
        consecutiveErrors: update.success ? 0 : sql`${mdmAgentPerformance.consecutiveErrors} + 1`,
        lastErrorAt: update.success ? undefined : new Date(),
        updatedAt: new Date(),
      })
      .where(eq(mdmAgentPerformance.id, existing.id));
  } else {
    await db.insert(mdmAgentPerformance).values({
      tenantId,
      agentType: agentType as any,
      autoAppliedChanges: update.autoApplied && update.success ? 1 : 0,
      consecutiveErrors: update.success ? 0 : 1,
      lastErrorAt: update.success ? undefined : new Date(),
    });
  }
}

function getConfidenceValue(confidence: string): number {
  switch (confidence) {
    case 'high': return 90;
    case 'medium': return 70;
    case 'low': return 50;
    default: return 0;
  }
}

function mapActionToChangeType(action: string): 'create' | 'update' | 'delete' {
  switch (action) {
    case 'create': return 'create';
    case 'delete': return 'delete';
    default: return 'update';
  }
}

/**
 * Seed default auto-apply config for a tenant
 */
export async function seedDefaultAutoApplyConfig(
  tenantId: string,
  createdBy: string,
): Promise<void> {
  // Conservative defaults - only enable for tier4/tier5 with high confidence
  await db.insert(mdmAutoApplyConfig).values({
    tenantId,
    entityType: 'ALL',
    enabled: false, // Disabled by default - must be explicitly enabled
    minConfidenceScore: 95,
    maxRiskLevel: 'minimal',
    allowedTiers: ['tier4', 'tier5'],
    allowedActions: ['flag'],
    maxAutoAppliesPerHour: 5,
    maxAutoAppliesPerDay: 20,
    cooldownMinutesOnError: 120,
    requireReversible: true,
    requireNoActiveViolations: true,
    createdBy,
    updatedBy: createdBy,
  });
}

