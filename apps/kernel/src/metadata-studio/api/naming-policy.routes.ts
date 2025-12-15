// metadata-studio/api/naming-policy.routes.ts

/**
 * Naming Policy API
 * 
 * GRCD Phase 2: Naming Policy Enforcement
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { AuthContext } from '../middleware/auth.middleware';
import {
  validateName,
  listPolicies,
  createPolicy,
  seedDefaultPolicies,
} from '../services/naming-policy.service';

export const namingPolicyRouter = new Hono();

const ContextEnum = z.enum(['canonical_key', 'db_column', 'typescript', 'api_path', 'graphql', 'const']);
const TierEnum = z.enum(['tier1', 'tier2', 'tier3', 'tier4', 'tier5']);
const EnforcementEnum = z.enum(['error', 'warning', 'info']);

/**
 * POST /naming-policy/validate
 * 
 * Validate a name against all applicable policies
 */
namingPolicyRouter.post(
  '/validate',
  zValidator(
    'json',
    z.object({
      name: z.string().min(1),
      context: ContextEnum,
      domain: z.string().optional(),
    }),
  ),
  async (c) => {
    const auth = c.get('auth') as AuthContext;
    const { name, context, domain } = c.req.valid('json');

    const result = await validateName(name, context, domain ?? null, auth.tenantId);

    return c.json(result);
  },
);

/**
 * POST /naming-policy/validate/batch
 * 
 * Validate multiple names at once
 */
namingPolicyRouter.post(
  '/validate/batch',
  zValidator(
    'json',
    z.object({
      names: z.array(z.object({
        name: z.string().min(1),
        context: ContextEnum,
        domain: z.string().optional(),
      })).min(1).max(100),
    }),
  ),
  async (c) => {
    const auth = c.get('auth') as AuthContext;
    const { names } = c.req.valid('json');

    const results = await Promise.all(
      names.map(({ name, context, domain }) =>
        validateName(name, context, domain ?? null, auth.tenantId),
      ),
    );

    const valid = results.filter(r => r.isValid).length;
    const invalid = results.filter(r => !r.isValid).length;

    return c.json({
      total: results.length,
      valid,
      invalid,
      results,
    });
  },
);

/**
 * GET /naming-policy
 * 
 * List all naming policies for the tenant
 */
namingPolicyRouter.get('/', async (c) => {
  const auth = c.get('auth') as AuthContext;
  const policies = await listPolicies(auth.tenantId);
  return c.json(policies);
});

/**
 * POST /naming-policy
 * 
 * Create a new naming policy
 */
namingPolicyRouter.post(
  '/',
  zValidator(
    'json',
    z.object({
      policyKey: z.string().min(1).max(100),
      label: z.string().min(1).max(255),
      description: z.string().optional(),
      appliesTo: ContextEnum,
      domain: z.string().optional(),
      rules: z.object({
        pattern: z.string().optional(),
        patternDescription: z.string().optional(),
        minLength: z.number().min(1).optional(),
        maxLength: z.number().min(1).optional(),
        requiredPrefix: z.string().optional(),
        requiredSuffix: z.string().optional(),
        forbiddenPatterns: z.array(z.string()).optional(),
        reservedWords: z.array(z.string()).optional(),
        requiredWords: z.array(z.string()).optional(),
        caseStyle: z.enum(['snake_case', 'camelCase', 'PascalCase', 'UPPER_SNAKE', 'kebab-case']).optional(),
      }),
      tier: TierEnum.optional(),
      enforcement: EnforcementEnum.optional(),
    }),
  ),
  async (c) => {
    const auth = c.get('auth') as AuthContext;
    const body = c.req.valid('json');

    const policy = await createPolicy({
      tenantId: auth.tenantId,
      createdBy: auth.userId,
      ...body,
    });

    return c.json(policy, 201);
  },
);

/**
 * POST /naming-policy/seed-defaults
 * 
 * Seed default naming policies for the tenant
 */
namingPolicyRouter.post('/seed-defaults', async (c) => {
  const auth = c.get('auth') as AuthContext;

  await seedDefaultPolicies(auth.tenantId, auth.userId);

  return c.json({
    message: 'Default naming policies seeded successfully',
  });
});

