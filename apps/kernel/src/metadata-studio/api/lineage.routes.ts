// metadata-studio/api/lineage.routes.ts
import { Hono } from 'hono';
import type { AuthContext } from '../middleware/auth.middleware';
import {
  declareFieldLineage,
  getFieldLineageGraph,
  getTier1LineageCoverage,
  type LineageDirection,
} from '../services/lineage.service';

export const lineageRouter = new Hono();

/**
 * POST /lineage/field
 *
 * Declare or update a field-level lineage edge:
 *   sourceCanonicalKey → targetCanonicalKey
 */
lineageRouter.post('/field', async (c) => {
  const auth = c.get('auth') as AuthContext;
  const body = await c.req.json();

  const result = await declareFieldLineage({
    actorRole: auth.role,
    actorId: auth.userId,
    tenantId: auth.tenantId,
    body: {
      ...body,
      tenantId: body.tenantId ?? auth.tenantId,
      createdBy: body.createdBy ?? auth.userId,
      updatedBy: body.updatedBy ?? auth.userId,
    },
  });

  return c.json(result, 200);
});

/**
 * GET /lineage/field?canonicalKey=...&direction=upstream|downstream|both
 *
 * Fetch upstream/downstream graph for a given field.
 */
lineageRouter.get('/field', async (c) => {
  const auth = c.get('auth') as AuthContext;
  const canonicalKey = c.req.query('canonicalKey');
  const direction = (c.req.query('direction') ??
    'upstream') as LineageDirection;

  if (!canonicalKey) {
    return c.json(
      { error: 'Missing query parameter: canonicalKey' },
      400,
    );
  }

  const graph = await getFieldLineageGraph(
    auth.tenantId,
    canonicalKey,
    direction,
  );

  return c.json(graph);
});

/**
 * GET /lineage/tier1-coverage
 *
 * Summary of Tier 1 lineage coverage:
 * - total Tier1 fields
 * - count covered
 * - count uncovered
 * - list of uncovered canonical keys
 */
lineageRouter.get('/tier1-coverage', async (c) => {
  const auth = c.get('auth') as AuthContext;

  const coverage = await getTier1LineageCoverage(auth.tenantId);

  return c.json(coverage);
});

