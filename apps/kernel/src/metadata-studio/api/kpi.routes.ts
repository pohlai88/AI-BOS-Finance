// metadata-studio/api/kpi.routes.ts
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { AuthContext } from '../middleware/auth.middleware';
import {
  getKPIDashboard,
  getTier1LineageCoverage,
  getSchemaDriftKPI,
  getAIReviewKPI,
} from '../services/kpi-metrics.service';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/client';
import {
  mdmKpiDefinition,
  mdmKpiComponent,
} from '../db/schema/kpi.tables';
import { applyKpiChange } from '../services/kpi.service';

export const kpiRouter = new Hono();

/**
 * POST /kpi
 *
 * Create or update a KPI (definition + components).
 * Body must follow MdmKpiDefinitionWithComponentsSchema.
 */
kpiRouter.post('/', async (c) => {
  const auth = c.get('auth') as AuthContext;
  const body = await c.req.json();

  const mergedBody = {
    ...body,
    definition: {
      ...body.definition,
      tenantId: body.definition?.tenantId ?? auth.tenantId,
      createdBy: body.definition?.createdBy ?? auth.userId,
      updatedBy: body.definition?.updatedBy ?? auth.userId,
    },
  };

  const result = await applyKpiChange({
    actorRole: auth.role,
    actorId: auth.userId,
    body: mergedBody,
  });

  const statusCode =
    (result as any).status === 'pending_approval' ? 202 : 200;

  return c.json(result, statusCode);
});

/**
 * GET /kpi
 *
 * List KPIs for tenant, optional filters:
 * - canonicalKey
 * - domain
 * - category
 * - status
 */
kpiRouter.get('/', async (c) => {
  const auth = c.get('auth') as AuthContext;
  const canonicalKey = c.req.query('canonicalKey');
  const domain = c.req.query('domain');
  const category = c.req.query('category');
  const status = c.req.query('status');

  let where: any = eq(mdmKpiDefinition.tenantId, auth.tenantId);

  if (canonicalKey) {
    where = and(where, eq(mdmKpiDefinition.canonicalKey, canonicalKey));
  }
  if (domain) {
    where = and(where, eq(mdmKpiDefinition.domain, domain));
  }
  if (category) {
    where = and(where, eq(mdmKpiDefinition.category, category));
  }
  if (status) {
    where = and(where, eq(mdmKpiDefinition.status, status));
  }

  const rows = await db
    .select()
    .from(mdmKpiDefinition)
    .where(where);

  return c.json(rows);
});

/**
 * GET /kpi/components?canonicalKey=...
 *
 * List components for a given KPI canonicalKey.
 */
kpiRouter.get('/components', async (c) => {
  const auth = c.get('auth') as AuthContext;
  const canonicalKey = c.req.query('canonicalKey');

  if (!canonicalKey) {
    return c.json(
      { error: 'Missing canonicalKey query parameter' },
      400,
    );
  }

  const [def] = await db
    .select()
    .from(mdmKpiDefinition)
    .where(
      and(
        eq(mdmKpiDefinition.tenantId, auth.tenantId),
        eq(mdmKpiDefinition.canonicalKey, canonicalKey),
      ),
    );

  if (!def) {
    return c.json({ error: 'KPI not found' }, 404);
  }

  const components = await db
    .select()
    .from(mdmKpiComponent)
    .where(
      and(
        eq(mdmKpiComponent.tenantId, auth.tenantId),
        eq(mdmKpiComponent.kpiId, def.id),
      ),
    );

  return c.json(components);
});

// ═══════════════════════════════════════════════════════════════════
// GRCD KPI DASHBOARD ENDPOINTS (Section 5 - Orchestra KPIs)
// ═══════════════════════════════════════════════════════════════════

/**
 * GET /kpi/dashboard
 * 
 * Get the overall KPI dashboard for governance health monitoring.
 * 
 * Query Parameters:
 * - periodDays: Number of days to look back (default: 90)
 * 
 * Response:
 * {
 *   "tenantId": "...",
 *   "periodStart": "...",
 *   "periodEnd": "...",
 *   "schemaDrift": { ... },
 *   "lineageCoverage": { ... },
 *   "aiReview": { ... },
 *   "healthScore": 85,
 *   "recommendations": [...]
 * }
 */
kpiRouter.get(
  '/dashboard',
  zValidator(
    'query',
    z.object({
      periodDays: z.string().transform(Number).pipe(z.number().min(1).max(365)).optional(),
    }),
  ),
  async (c) => {
    const auth = c.get('auth') as AuthContext;
    const { periodDays = 90 } = c.req.valid('query');

    const periodEnd = new Date();
    const periodStart = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    const dashboard = await getKPIDashboard(auth.tenantId, periodStart, periodEnd);

    return c.json(dashboard);
  },
);

/**
 * GET /kpi/lineage-coverage
 * 
 * Get Tier 1 lineage coverage metrics.
 * 
 * GRCD KPI: Tier 1 lineage coverage should be 100%
 */
kpiRouter.get('/lineage-coverage', async (c) => {
  const auth = c.get('auth') as AuthContext;

  const coverage = await getTier1LineageCoverage(auth.tenantId);

  return c.json({
    metric: 'tier1_lineage_coverage',
    target: 100,
    current: coverage.coveragePercent,
    status: coverage.coveragePercent >= 100 ? 'compliant' : 'non_compliant',
    details: coverage,
  });
});

/**
 * GET /kpi/schema-drift
 * 
 * Get schema drift incidents metrics.
 * 
 * GRCD KPI: Schema drift incidents should decrease quarter over quarter
 */
kpiRouter.get(
  '/schema-drift',
  zValidator(
    'query',
    z.object({
      periodDays: z.string().transform(Number).pipe(z.number().min(1).max(365)).optional(),
    }),
  ),
  async (c) => {
    const auth = c.get('auth') as AuthContext;
    const { periodDays = 90 } = c.req.valid('query');

    const periodEnd = new Date();
    const periodStart = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    const drift = await getSchemaDriftKPI(auth.tenantId, periodStart, periodEnd);

    return c.json({
      metric: 'schema_drift_incidents',
      target: 0,
      current: drift.incidentsTotal,
      status: drift.incidentsTotal <= 5 ? 'compliant' : 'non_compliant',
      details: drift,
    });
  },
);

/**
 * GET /kpi/ai-review
 * 
 * Get AI review coverage metrics.
 * 
 * GRCD KPI: % of schema changes with AI review should be > 90%
 */
kpiRouter.get(
  '/ai-review',
  zValidator(
    'query',
    z.object({
      periodDays: z.string().transform(Number).pipe(z.number().min(1).max(365)).optional(),
    }),
  ),
  async (c) => {
    const auth = c.get('auth') as AuthContext;
    const { periodDays = 90 } = c.req.valid('query');

    const periodEnd = new Date();
    const periodStart = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    const review = await getAIReviewKPI(auth.tenantId, periodStart, periodEnd);

    return c.json({
      metric: 'ai_review_coverage',
      target: 90,
      current: review.reviewPercent,
      status: review.reviewPercent >= 90 ? 'compliant' : 'non_compliant',
      details: review,
    });
  },
);

