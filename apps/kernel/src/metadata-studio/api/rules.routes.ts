// metadata-studio/api/rules.routes.ts
import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/client';
import { mdmBusinessRule } from '../db/schema/business-rule.tables';
import { applyBusinessRuleChange } from '../services/business-rule.service';
import type { AuthContext } from '../middleware/auth.middleware';

export const rulesRouter = new Hono();

/**
 * POST /rules
 *
 * Creates or updates a business rule.
 * Uses the "traffic cop" to decide:
 * - immediate apply vs
 * - create approval request (pending_approval)
 */
rulesRouter.post('/', async (c) => {
  const auth = c.get('auth') as AuthContext;
  const body = await c.req.json();

  const mergedBody = {
    ...body,
    tenantId: body.tenantId ?? auth.tenantId,
    createdBy: body.createdBy ?? auth.userId,
    updatedBy: body.updatedBy ?? auth.userId,
  };

  const result = await applyBusinessRuleChange({
    actorRole: auth.role,
    actorId: auth.userId,
    body: mergedBody,
  });

  const statusCode =
    (result as any).status === 'pending_approval' ? 202 : 200;

  return c.json(result, statusCode);
});

/**
 * GET /rules
 *
 * List rules for the current tenant, optionally filtered by:
 * - ruleType
 * - environment (default: 'live')
 */
rulesRouter.get('/', async (c) => {
  const auth = c.get('auth') as AuthContext;
  const ruleType = c.req.query('ruleType');
  const environment = c.req.query('environment') ?? 'live';

  let rows;

  if (ruleType) {
    rows = await db
      .select()
      .from(mdmBusinessRule)
      .where(
        and(
          eq(mdmBusinessRule.tenantId, auth.tenantId),
          eq(mdmBusinessRule.ruleType, ruleType),
          eq(mdmBusinessRule.environment, environment),
        ),
      );
  } else {
    rows = await db
      .select()
      .from(mdmBusinessRule)
      .where(
        and(
          eq(mdmBusinessRule.tenantId, auth.tenantId),
          eq(mdmBusinessRule.environment, environment),
        ),
      );
  }

  return c.json(rows);
});

