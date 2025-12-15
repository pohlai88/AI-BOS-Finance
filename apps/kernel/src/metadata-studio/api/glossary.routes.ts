// metadata-studio/api/glossary.routes.ts
import { Hono } from 'hono';
import type { AuthContext } from '../middleware/auth.middleware';
import { db } from '../db/client';
import { mdmGlossaryTerm } from '../db/schema/glossary.tables';
import { and, eq } from 'drizzle-orm';
import { applyGlossaryChange } from '../services/glossary.service';

export const glossaryRouter = new Hono();

/**
 * POST /glossary
 *
 * Create or update a glossary term (Tier-aware approval).
 */
glossaryRouter.post('/', async (c) => {
  const auth = c.get('auth') as AuthContext;
  const body = await c.req.json();

  const mergedBody = {
    ...body,
    tenantId: body.tenantId ?? auth.tenantId,
    createdBy: body.createdBy ?? auth.userId,
    updatedBy: body.updatedBy ?? auth.userId,
  };

  const result = await applyGlossaryChange({
    actorRole: auth.role,
    actorId: auth.userId,
    body: mergedBody,
  });

  const statusCode =
    (result as any).status === 'pending_approval' ? 202 : 200;

  return c.json(result, statusCode);
});

/**
 * GET /glossary
 *
 * List glossary terms with optional filters:
 * - canonicalKey
 * - domain
 * - category
 * - status
 */
glossaryRouter.get('/', async (c) => {
  const auth = c.get('auth') as AuthContext;
  const canonicalKey = c.req.query('canonicalKey');
  const domain = c.req.query('domain');
  const category = c.req.query('category');
  const status = c.req.query('status');

  let where: any = eq(mdmGlossaryTerm.tenantId, auth.tenantId);

  if (canonicalKey) {
    where = and(where, eq(mdmGlossaryTerm.canonicalKey, canonicalKey));
  }
  if (domain) {
    where = and(where, eq(mdmGlossaryTerm.domain, domain));
  }
  if (category) {
    where = and(where, eq(mdmGlossaryTerm.category, category));
  }
  if (status) {
    where = and(where, eq(mdmGlossaryTerm.status, status));
  }

  const rows = await db
    .select()
    .from(mdmGlossaryTerm)
    .where(where);

  return c.json(rows);
});

