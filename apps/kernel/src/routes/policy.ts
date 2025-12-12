/**
 * Policy Routes - The Frontal Lobe (Governance & Policy)
 * 
 * Handles policy checks, change requests, and control status
 */

import { Hono } from 'hono';
import type {
  PolicyCheckRequest,
  PolicyCheckResponse,
  ChangeRequestCreateRequest,
  ChangeRequestCreateResponse,
  ControlStatusListResponse,
} from '@aibos/schemas/kernel';

export const policyRoutes = new Hono();

/**
 * POST /policy/dataAccess/check
 * Constitution Service: policy.dataAccess.check(actor, resource, intent)
 */
policyRoutes.post('/dataAccess/check', async (c) => {
  const body = await c.req.json() as PolicyCheckRequest;

  // TODO: Implement actual policy check logic
  // For now, basic tier enforcement
  if (body.actor.type === 'orchestra' && body.actor.tier !== undefined) {
    const tier = body.actor.tier;
    
    // Tier 0: Read-only
    if (tier === 0 && body.action !== 'read') {
      return c.json({
        allowed: false,
        reason: 'Tier 0 orchestras can only perform read operations',
        tier_limit: 0,
      } as PolicyCheckResponse);
    }
    
    // Tier 1: Suggest only (no writes)
    if (tier === 1 && ['write', 'delete'].includes(body.action)) {
      return c.json({
        allowed: false,
        reason: 'Tier 1 orchestras can only suggest, not write',
        tier_limit: 1,
      } as PolicyCheckResponse);
    }
  }

  // Default: allow (will be replaced with actual policy logic)
  return c.json({
    allowed: true,
  } as PolicyCheckResponse);
});

/**
 * POST /policy/changeRequest/create
 * Constitution Service: policy.changeRequest.create(entity, proposed_change)
 */
policyRoutes.post('/changeRequest/create', async (c) => {
  const body = await c.req.json() as ChangeRequestCreateRequest;

  // TODO: Implement change request creation
  return c.json({
    change_request_id: `cr_${Date.now()}`,
    status: 'pending',
    requires_approval: true,
    approvers: [],
  } as ChangeRequestCreateResponse);
});

/**
 * GET /policy/controlStatus/list
 * Constitution Service: policy.controlStatus.list(standard, scope)
 */
policyRoutes.get('/controlStatus/list', async (c) => {
  const standard = c.req.query('standard');
  const scope = c.req.query('scope');

  // TODO: Implement control status query
  return c.json({
    controls: [],
    coverage: {
      total_controls: 0,
      compliant: 0,
      non_compliant: 0,
      unknown: 0,
    },
  } as ControlStatusListResponse);
});

/**
 * GET /policy/tiers
 * List autonomy tiers and their limits
 */
policyRoutes.get('/tiers', (c) => {
  return c.json({
    tiers: [
      {
        tier: 0,
        name: 'Read-Only Analysis',
        allowed: ['read'],
        forbidden: ['write', 'delete', 'export'],
        description: 'Can read data, logs, metadata, and produce reports. No change proposals or code generation.',
      },
      {
        tier: 1,
        name: 'Suggest',
        allowed: ['read'],
        forbidden: ['write', 'delete'],
        description: 'Can suggest changes (schema, configs, UI tweaks, policies) as recommendations. Changes must be manually implemented by humans.',
      },
      {
        tier: 2,
        name: 'Propose',
        allowed: ['read'],
        forbidden: ['delete'],
        description: 'Can generate concrete change artefacts (SQL migrations, PRs, config patches) but cannot auto-apply. Requires human approval.',
      },
      {
        tier: 3,
        name: 'Auto-Apply (Guarded)',
        allowed: ['read', 'write'],
        forbidden: ['delete'],
        description: 'Can auto-apply low-risk, well-bounded changes under explicit guardrails. All actions logged with full diff and rationale.',
      },
    ],
  });
});

/**
 * GET /policy/constraints/{actor_id}
 * Get all constraints for an actor
 */
policyRoutes.get('/constraints/:actor_id', async (c) => {
  const actorId = c.req.param('actor_id');

  // TODO: Implement constraint lookup
  return c.json({
    actor_id: actorId,
    constraints: [],
  });
});
