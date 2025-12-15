// metadata-studio/api/agent-proposal.routes.ts

/**
 * Agent Proposal API
 * 
 * GRCD Phase 2: AI Agent Proposal Management
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { AuthContext } from '../middleware/auth.middleware';
import {
  listAgentProposals,
  recordFeedback,
  getProposalStats,
} from '../services/agent-proposal.service';
import { DataQualitySentinel } from '../agents/data-quality-sentinel';

export const agentProposalRouter = new Hono();

const AgentTypeEnum = z.enum(['data_quality_sentinel', 'schema_drift_detector', 'lineage_analyzer', 'naming_validator']);
const ConfidenceEnum = z.enum(['high', 'medium', 'low']);
const RiskLevelEnum = z.enum(['critical', 'high', 'medium', 'low', 'minimal']);
const StatusEnum = z.enum(['pending', 'approved', 'rejected']);

/**
 * GET /agent-proposals
 * 
 * List agent proposals with optional filters
 */
agentProposalRouter.get(
  '/',
  zValidator(
    'query',
    z.object({
      agentType: AgentTypeEnum.optional(),
      confidence: ConfidenceEnum.optional(),
      riskLevel: RiskLevelEnum.optional(),
      status: StatusEnum.optional(),
    }),
  ),
  async (c) => {
    const auth = c.get('auth') as AuthContext;
    const filters = c.req.valid('query');

    const proposals = await listAgentProposals(auth.tenantId, filters);

    return c.json({
      count: proposals.length,
      proposals,
    });
  },
);

/**
 * GET /agent-proposals/stats
 * 
 * Get proposal statistics for dashboard
 */
agentProposalRouter.get('/stats', async (c) => {
  const auth = c.get('auth') as AuthContext;
  const stats = await getProposalStats(auth.tenantId);
  return c.json(stats);
});

/**
 * POST /agent-proposals/:id/feedback
 * 
 * Record human feedback on a proposal
 */
agentProposalRouter.post(
  '/:id/feedback',
  zValidator(
    'json',
    z.object({
      humanFeedback: z.string().min(1).max(1000),
      wasHelpful: z.boolean(),
    }),
  ),
  async (c) => {
    const { id } = c.req.param();
    const feedback = c.req.valid('json');

    await recordFeedback(id, feedback);

    return c.json({ message: 'Feedback recorded' });
  },
);

/**
 * POST /agent-proposals/scan/quality
 * 
 * Run a data quality scan (DataQualitySentinel agent)
 */
agentProposalRouter.post('/scan/quality', async (c) => {
  const auth = c.get('auth') as AuthContext;

  const result = await DataQualitySentinel.runQualityScan(auth.tenantId);

  return c.json(result);
});

/**
 * POST /agent-proposals/scan/quality-with-proposals
 * 
 * Run a data quality scan and create proposals for issues
 */
agentProposalRouter.post('/scan/quality-with-proposals', async (c) => {
  const auth = c.get('auth') as AuthContext;

  const result = await DataQualitySentinel.runQualityScanWithProposals(auth.tenantId);

  return c.json(result);
});

