// metadata-studio/api/auto-apply.routes.ts

/**
 * Auto-Apply & Governance API
 * 
 * GRCD Phase 3: Guarded Auto-Apply
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { AuthContext } from '../middleware/auth.middleware';
import { evaluateAutoApply, autoApplyProposal, seedDefaultAutoApplyConfig } from '../services/auto-apply.service';
import { getChangeHistory, rollbackChange, getRollbackEligibleChanges } from '../services/rollback.service';
import { runComplianceCheck, getComplianceDashboard } from '../services/compliance.service';
import { evaluatePromotion, promoteAgent, demoteAgent, getAgentDashboard } from '../services/tier-promotion.service';

export const autoApplyRouter = new Hono();

// ============================================================================
// Auto-Apply Endpoints
// ============================================================================

/**
 * POST /auto-apply/evaluate/:proposalId
 * 
 * Evaluate if a proposal can be auto-applied
 */
autoApplyRouter.post('/evaluate/:proposalId', async (c) => {
  const auth = c.get('auth') as AuthContext;
  const { proposalId } = c.req.param();

  const evaluation = await evaluateAutoApply(proposalId, auth.tenantId);

  return c.json(evaluation);
});

/**
 * POST /auto-apply/apply/:proposalId
 * 
 * Auto-apply a proposal (if guardrails pass)
 */
autoApplyRouter.post('/apply/:proposalId', async (c) => {
  const auth = c.get('auth') as AuthContext;
  const { proposalId } = c.req.param();

  // Only kernel_architect can trigger auto-apply
  if (auth.role !== 'kernel_architect' && auth.role !== 'metadata_steward') {
    return c.json({ error: 'Insufficient permissions to trigger auto-apply' }, 403);
  }

  const result = await autoApplyProposal(proposalId, auth.tenantId);

  if (!result.success) {
    return c.json(result, 400);
  }

  return c.json(result);
});

/**
 * POST /auto-apply/config/seed
 * 
 * Seed default auto-apply configuration
 */
autoApplyRouter.post('/config/seed', async (c) => {
  const auth = c.get('auth') as AuthContext;

  if (auth.role !== 'kernel_architect') {
    return c.json({ error: 'Only kernel_architect can configure auto-apply' }, 403);
  }

  await seedDefaultAutoApplyConfig(auth.tenantId, auth.userId);

  return c.json({ message: 'Default auto-apply configuration seeded' });
});

// ============================================================================
// Rollback Endpoints
// ============================================================================

/**
 * GET /auto-apply/history/:entityType/:entityId
 * 
 * Get change history for an entity
 */
autoApplyRouter.get('/history/:entityType/:entityId', async (c) => {
  const auth = c.get('auth') as AuthContext;
  const { entityType, entityId } = c.req.param();

  const history = await getChangeHistory(auth.tenantId, entityType, entityId);

  return c.json({ history });
});

/**
 * GET /auto-apply/rollback-eligible
 * 
 * Get changes that can be rolled back
 */
autoApplyRouter.get('/rollback-eligible', async (c) => {
  const auth = c.get('auth') as AuthContext;

  const changes = await getRollbackEligibleChanges(auth.tenantId);

  return c.json({ changes });
});

/**
 * POST /auto-apply/rollback/:changeHistoryId
 * 
 * Rollback a specific change
 */
autoApplyRouter.post(
  '/rollback/:changeHistoryId',
  zValidator(
    'json',
    z.object({
      reason: z.string().min(1).max(500),
    }),
  ),
  async (c) => {
    const auth = c.get('auth') as AuthContext;
    const { changeHistoryId } = c.req.param();
    const { reason } = c.req.valid('json');

    // Only elevated roles can rollback
    if (auth.role !== 'kernel_architect' && auth.role !== 'metadata_steward') {
      return c.json({ error: 'Insufficient permissions to rollback' }, 403);
    }

    const result = await rollbackChange(changeHistoryId, auth.userId, reason);

    if (!result.success) {
      return c.json(result, 400);
    }

    return c.json(result);
  },
);

// ============================================================================
// Compliance Endpoints
// ============================================================================

/**
 * POST /auto-apply/compliance/check
 * 
 * Run a compliance check for a standard
 */
autoApplyRouter.post(
  '/compliance/check',
  zValidator(
    'json',
    z.object({
      standard: z.enum(['MFRS', 'IFRS', 'GDPR', 'PDPA', 'SOC2', 'ISO27001']),
      scope: z.string().default('ALL'),
    }),
  ),
  async (c) => {
    const auth = c.get('auth') as AuthContext;
    const { standard, scope } = c.req.valid('json');

    const result = await runComplianceCheck(auth.tenantId, standard, scope, auth.userId);

    return c.json(result);
  },
);

/**
 * GET /auto-apply/compliance/dashboard
 * 
 * Get compliance dashboard for all standards
 */
autoApplyRouter.get('/compliance/dashboard', async (c) => {
  const auth = c.get('auth') as AuthContext;

  const dashboard = await getComplianceDashboard(auth.tenantId);

  return c.json(dashboard);
});

// ============================================================================
// Agent Tier Management Endpoints
// ============================================================================

/**
 * GET /auto-apply/agents
 * 
 * Get agent performance dashboard
 */
autoApplyRouter.get('/agents', async (c) => {
  const auth = c.get('auth') as AuthContext;

  const dashboard = await getAgentDashboard(auth.tenantId);

  return c.json({ agents: dashboard });
});

/**
 * GET /auto-apply/agents/:agentType/evaluate
 * 
 * Evaluate if an agent is eligible for promotion
 */
autoApplyRouter.get('/agents/:agentType/evaluate', async (c) => {
  const auth = c.get('auth') as AuthContext;
  const { agentType } = c.req.param();

  const evaluation = await evaluatePromotion(auth.tenantId, agentType as any);

  return c.json(evaluation);
});

/**
 * POST /auto-apply/agents/:agentType/promote
 * 
 * Promote an agent to the next tier
 */
autoApplyRouter.post('/agents/:agentType/promote', async (c) => {
  const auth = c.get('auth') as AuthContext;
  const { agentType } = c.req.param();

  if (auth.role !== 'kernel_architect') {
    return c.json({ error: 'Only kernel_architect can promote agents' }, 403);
  }

  const result = await promoteAgent(auth.tenantId, agentType as any);

  if (!result.success) {
    return c.json(result, 400);
  }

  return c.json(result);
});

/**
 * POST /auto-apply/agents/:agentType/demote
 * 
 * Demote an agent to the previous tier
 */
autoApplyRouter.post(
  '/agents/:agentType/demote',
  zValidator(
    'json',
    z.object({
      reason: z.string().min(1).max(500),
    }),
  ),
  async (c) => {
    const auth = c.get('auth') as AuthContext;
    const { agentType } = c.req.param();
    const { reason } = c.req.valid('json');

    if (auth.role !== 'kernel_architect') {
      return c.json({ error: 'Only kernel_architect can demote agents' }, 403);
    }

    const result = await demoteAgent(auth.tenantId, agentType as any, reason);

    return c.json(result);
  },
);

