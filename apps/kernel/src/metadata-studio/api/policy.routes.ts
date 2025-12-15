// metadata-studio/api/policy.routes.ts

/**
 * Policy & Governance API
 * 
 * Implements GRCD Section 2.3 Mandatory Services:
 * - policy.dataAccess.check(actor, resource, intent)
 * - policy.controlStatus.list(standard, scope)
 * 
 * These endpoints enable governance enforcement across the platform.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { AuthContext } from '../middleware/auth.middleware';
import { checkDataAccess, listControlStatus, canAutoApply } from '../services/policy.service';
import { GovernanceTierEnum } from '../schemas/business-rule.schema';

export const policyRouter = new Hono();

const ResourceTypeEnum = z.enum(['METADATA', 'KPI', 'GLOSSARY', 'BUSINESS_RULE', 'LINEAGE', 'TAG']);
const IntentEnum = z.enum(['read', 'write', 'delete', 'approve', 'create']);

/**
 * POST /policy/access/check
 * 
 * GRCD Service: policy.dataAccess.check(actor, resource, intent)
 * 
 * Check if the current user can perform an action on a resource.
 * 
 * Request Body:
 * {
 *   "resourceType": "METADATA",
 *   "resourceId": "uuid-here",       // Optional
 *   "canonicalKey": "revenue_core",  // Optional (for METADATA)
 *   "intent": "write"
 * }
 * 
 * Response:
 * {
 *   "allowed": true,
 *   "tier": "tier2",
 *   "reason": "Access granted for 'write' on tier2 resource",
 *   "requiresApproval": true,
 *   "requiredApprovalRole": "metadata_steward",
 *   "policies": ["Resource tier: tier2", "Role 'business_admin' can 'write' on tier2"]
 * }
 */
policyRouter.post(
  '/access/check',
  zValidator(
    'json',
    z.object({
      resourceType: ResourceTypeEnum,
      resourceId: z.string().uuid().optional(),
      canonicalKey: z.string().min(1).optional(),
      intent: IntentEnum,
    }),
  ),
  async (c) => {
    const auth = c.get('auth') as AuthContext;
    const { resourceType, resourceId, canonicalKey, intent } = c.req.valid('json');

    const result = await checkDataAccess({
      actorId: auth.userId,
      actorRole: auth.role,
      resourceType,
      resourceId,
      canonicalKey,
      intent,
      tenantId: auth.tenantId,
    });

    // Return 403 if not allowed
    if (!result.allowed) {
      return c.json(result, 403);
    }

    return c.json(result);
  },
);

/**
 * POST /policy/access/batch
 * 
 * Check multiple access requests at once (useful for UI rendering).
 * 
 * Request Body:
 * {
 *   "checks": [
 *     { "resourceType": "METADATA", "canonicalKey": "revenue_core", "intent": "write" },
 *     { "resourceType": "KPI", "resourceId": "...", "intent": "delete" }
 *   ]
 * }
 * 
 * Response:
 * {
 *   "results": [
 *     { "allowed": true, ... },
 *     { "allowed": false, ... }
 *   ]
 * }
 */
policyRouter.post(
  '/access/batch',
  zValidator(
    'json',
    z.object({
      checks: z.array(
        z.object({
          resourceType: ResourceTypeEnum,
          resourceId: z.string().uuid().optional(),
          canonicalKey: z.string().min(1).optional(),
          intent: IntentEnum,
        }),
      ).min(1).max(50),
    }),
  ),
  async (c) => {
    const auth = c.get('auth') as AuthContext;
    const { checks } = c.req.valid('json');

    const results = await Promise.all(
      checks.map((check) =>
        checkDataAccess({
          actorId: auth.userId,
          actorRole: auth.role,
          resourceType: check.resourceType,
          resourceId: check.resourceId,
          canonicalKey: check.canonicalKey,
          intent: check.intent,
          tenantId: auth.tenantId,
        }),
      ),
    );

    return c.json({
      count: checks.length,
      allowed: results.filter((r) => r.allowed).length,
      denied: results.filter((r) => !r.allowed).length,
      results,
    });
  },
);

/**
 * GET /policy/controls
 * 
 * GRCD Service: policy.controlStatus.list(standard, scope)
 * 
 * List control compliance status for a standard.
 * 
 * Query Parameters:
 * - standard: MFRS | IFRS | GDPR | PDPA | SOC2 | ISO27001
 * - scope: FINANCE | HR | OPERATIONS | ALL
 * 
 * Response:
 * {
 *   "controls": [
 *     {
 *       "standard": "MFRS",
 *       "scope": "FINANCE",
 *       "status": "compliant",
 *       "coverage": 95,
 *       "lastChecked": "2025-12-02T...",
 *       "findings": []
 *     }
 *   ]
 * }
 */
policyRouter.get(
  '/controls',
  zValidator(
    'query',
    z.object({
      standard: z.enum(['MFRS', 'IFRS', 'GDPR', 'PDPA', 'SOC2', 'ISO27001']),
      scope: z.enum(['FINANCE', 'HR', 'OPERATIONS', 'ALL']).default('ALL'),
    }),
  ),
  async (c) => {
    const auth = c.get('auth') as AuthContext;
    const { standard, scope } = c.req.valid('query');

    const controls = await listControlStatus(standard, scope, auth.tenantId);

    return c.json({
      standard,
      scope,
      controls,
    });
  },
);

/**
 * GET /policy/autonomy/:tier
 * 
 * Check what actions can be auto-applied for a given tier.
 * 
 * Response:
 * {
 *   "tier": "tier3",
 *   "role": "metadata_steward",
 *   "autoApply": {
 *     "read": true,
 *     "write": true,
 *     "delete": false,
 *     "create": true,
 *     "approve": false
 *   }
 * }
 */
policyRouter.get(
  '/autonomy/:tier',
  zValidator(
    'param',
    z.object({
      tier: GovernanceTierEnum,
    }),
  ),
  async (c) => {
    const auth = c.get('auth') as AuthContext;
    const { tier } = c.req.valid('param');

    const intents = ['read', 'write', 'delete', 'create', 'approve'] as const;
    const autoApply: Record<string, boolean> = {};

    for (const intent of intents) {
      autoApply[intent] = canAutoApply(tier, auth.role, intent);
    }

    return c.json({
      tier,
      role: auth.role,
      autoApply,
    });
  },
);

/**
 * GET /policy/matrix
 * 
 * Get the full access control matrix for documentation/UI purposes.
 */
policyRouter.get('/matrix', (c) => {
  return c.json({
    tiers: ['tier1', 'tier2', 'tier3', 'tier4', 'tier5'],
    roles: ['kernel_architect', 'metadata_steward', 'business_admin', 'user'],
    intents: ['read', 'write', 'delete', 'create', 'approve'],
    description: {
      tier1: 'Critical business rules (MFRS/IFRS core) - Highest governance',
      tier2: 'Important business rules - Standard governance',
      tier3: 'Operational rules - Moderate governance',
      tier4: 'Low-risk rules - Light governance',
      tier5: 'Informational rules - Minimal governance',
    },
    roleDescriptions: {
      kernel_architect: 'Full system access, can approve all changes',
      metadata_steward: 'Governance oversight, can approve tier2+ changes',
      business_admin: 'Business domain management, limited approval rights',
      user: 'Standard user, read-heavy access',
    },
  });
});

