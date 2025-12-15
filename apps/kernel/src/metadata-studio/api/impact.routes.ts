// metadata-studio/api/impact.routes.ts
import { Hono } from 'hono';
import type { AuthContext } from '../middleware/auth.middleware';
import {
  getFullKpiImpactForMetadata,
} from '../services/impact.service';

export const impactRouter = new Hono();

/**
 * GET /impact/metadata-kpi?canonicalKey=...
 *
 * Returns:
 * - metadata
 * - directKpis
 * - indirectKpis (via lineage)
 * - indirectImpactedFields
 */
impactRouter.get('/metadata-kpi', async (c) => {
  const auth = c.get('auth') as AuthContext;
  const canonicalKey = c.req.query('canonicalKey');

  if (!canonicalKey) {
    return c.json(
      { error: 'Missing canonicalKey query parameter' },
      400,
    );
  }

  const impact = await getFullKpiImpactForMetadata(
    auth.tenantId,
    canonicalKey,
  );

  return c.json(impact);
});

