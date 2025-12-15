// metadata-studio/api/tags.routes.ts
import { Hono } from 'hono';
import type { AuthContext } from '../middleware/auth.middleware';
import { db } from '../db/client';
import { mdmTag } from '../db/schema/tags.tables';
import { and, eq } from 'drizzle-orm';
import { upsertTag, assignTagToTarget, listTagsForTarget } from '../services/tags.service';

export const tagsRouter = new Hono();

/**
 * POST /tags
 *
 * Create or update a tag.
 */
tagsRouter.post('/', async (c) => {
  const auth = c.get('auth') as AuthContext;
  const body = await c.req.json();

  const mergedBody = {
    ...body,
    tenantId: body.tenantId ?? auth.tenantId,
    createdBy: body.createdBy ?? auth.userId,
    updatedBy: body.updatedBy ?? auth.userId,
  };

  const result = await upsertTag({
    actorRole: auth.role,
    actorId: auth.userId,
    body: mergedBody,
  });

  return c.json(result, 200);
});

/**
 * GET /tags
 *
 * List tags for tenant, optionally by category/status.
 */
tagsRouter.get('/', async (c) => {
  const auth = c.get('auth') as AuthContext;
  const category = c.req.query('category');
  const status = c.req.query('status');

  let where: any = eq(mdmTag.tenantId, auth.tenantId);

  if (category) {
    where = and(where, eq(mdmTag.category, category));
  }
  if (status) {
    where = and(where, eq(mdmTag.status, status));
  }

  const tags = await db
    .select()
    .from(mdmTag)
    .where(where);

  return c.json(tags);
});

/**
 * POST /tags/assign
 *
 * Assign a tag to a target:
 * body: { tagKey, targetType, targetCanonicalKey }
 */
tagsRouter.post('/assign', async (c) => {
  const auth = c.get('auth') as AuthContext;
  const body = await c.req.json();

  const result = await assignTagToTarget({
    actorRole: auth.role,
    actorId: auth.userId,
    tenantId: auth.tenantId,
    body: {
      ...body,
      tenantId: body.tenantId ?? auth.tenantId,
      createdBy: body.createdBy ?? auth.userId,
    },
  });

  return c.json(result, 200);
});

/**
 * GET /tags/for-target?type=GLOBAL_METADATA&canonicalKey=...
 */
tagsRouter.get('/for-target', async (c) => {
  const auth = c.get('auth') as AuthContext;
  const targetType = c.req.query('type');
  const canonicalKey = c.req.query('canonicalKey');

  if (!targetType || !canonicalKey) {
    return c.json(
      { error: 'Missing type or canonicalKey' },
      400,
    );
  }

  const tags = await listTagsForTarget(
    auth.tenantId,
    targetType,
    canonicalKey,
  );

  return c.json(tags);
});

