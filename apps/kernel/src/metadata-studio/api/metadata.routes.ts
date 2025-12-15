// metadata-studio/api/metadata.routes.ts
import { Hono } from 'hono';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { mdmGlobalMetadata } from '../db/schema/metadata.tables';
import type { AuthContext } from '../middleware/auth.middleware';
import {
  applyMetadataChange,
} from '../services/metadata.service';

export const metadataRouter = new Hono();

/**
 * POST /metadata
 *
 * Create or update global metadata definition.
 * Uses applyMetadataChange to decide:
 * - immediate upsert vs
 * - pending approval
 */
metadataRouter.post('/', async (c) => {
  const auth = c.get('auth') as AuthContext;
  const body = await c.req.json();

  const mergedBody = {
    ...body,
    tenantId: body.tenantId ?? auth.tenantId,
    createdBy: body.createdBy ?? auth.userId,
    updatedBy: body.updatedBy ?? auth.userId,
  };

  const result = await applyMetadataChange({
    actorRole: auth.role,
    actorId: auth.userId,
    body: mergedBody,
  });

  const statusCode =
    (result as any).status === 'pending_approval' ? 202 : 200;

  return c.json(result, statusCode);
});

/**
 * GET /metadata
 *
 * List metadata for the current tenant.
 * Optional filters:
 * - canonicalKey
 * - domain
 * - module
 */
metadataRouter.get('/', async (c) => {
  const auth = c.get('auth') as AuthContext;
  const canonicalKey = c.req.query('canonicalKey');
  const domain = c.req.query('domain');
  const moduleFilter = c.req.query('module');

  let where = eq(mdmGlobalMetadata.tenantId, auth.tenantId);

  if (canonicalKey) {
    where = and(where, eq(mdmGlobalMetadata.canonicalKey, canonicalKey));
  }

  if (domain) {
    where = and(where, eq(mdmGlobalMetadata.domain, domain));
  }

  if (moduleFilter) {
    where = and(where, eq(mdmGlobalMetadata.module, moduleFilter));
  }

  const rows = await db
    .select()
    .from(mdmGlobalMetadata)
    .where(where);

  return c.json(rows);
});

