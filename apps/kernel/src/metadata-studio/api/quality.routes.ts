// metadata-studio/api/quality.routes.ts
import { Hono } from 'hono';
import type { AuthContext } from '../middleware/auth.middleware';
import { QualityService } from '../services/quality.service';
import { ProfilerExecutor } from '../db/profiler.executor';
import { db } from '../db/client';

export const qualityRouter = new Hono();

// Initialize profiler executor and quality service
// In production, this would be dependency-injected
const profilerExecutor = new ProfilerExecutor(db as any);
const qualityService = new QualityService(profilerExecutor);

/**
 * POST /quality/profile
 *
 * On-demand data quality profiling.
 * 
 * Triggers the profiler execution engine to:
 * 1. Run SQL profiler against the specified table
 * 2. Compute quality dimensions (completeness, uniqueness, validity, score)
 * 3. Persist profile to mdm_profile
 * 4. Return quality grade + threshold check
 *
 * Example:
 * ```bash
 * curl -X POST http://localhost:8787/quality/profile \
 *   -H "Content-Type: application/json" \
 *   -H "x-tenant-id: tenant-123" \
 *   -H "x-user-id: steward" \
 *   -H "x-role: metadata_steward" \
 *   -d '{
 *     "entityUrn": "gl.account:revenue_gross",
 *     "service": {
 *       "schema": "public",
 *       "table": "sales_transactions"
 *     },
 *     "columns": ["amount", "quantity"],
 *     "governanceTier": "T1"
 *   }'
 * ```
 */
qualityRouter.post('/profile', async (c) => {
  const auth = c.get('auth') as AuthContext;
  const body = await c.req.json();

  const result = await qualityService.runProfiler({
    tenantId: body.tenantId ?? auth.tenantId,
    entityUrn: body.entityUrn,
    service: body.service,
    columns: body.columns,
    triggeredBy: {
      actorId: body.triggeredBy?.actorId ?? auth.userId,
      actorType: body.triggeredBy?.actorType ?? 'HUMAN',
    },
    governanceTier: body.governanceTier,
    qualityRules: body.qualityRules,
  });

  return c.json({
    profileId: result.profileId,
    qualityScore: result.profile.qualityScore,
    qualityGrade: result.qualityGrade,
    meetsThreshold: result.meetsThreshold,
    profile: {
      rowCount: result.profile.rowCount,
      completeness: result.profile.completeness,
      uniqueness: result.profile.uniqueness,
      validity: result.profile.validity,
      columnProfiles: result.profile.columnProfiles.map(col => ({
        columnName: col.columnName,
        nullCount: col.nullCount,
        distinctCount: col.distinctCount,
        topValues: col.topValues.slice(0, 3), // Limit to top 3 for API response
      })),
    },
  }, 200);
});

/**
 * GET /quality/profile/latest
 *
 * Get the latest profile for an entity.
 *
 * Example:
 * ```bash
 * curl "http://localhost:8787/quality/profile/latest?entityUrn=gl.account:revenue_gross" \
 *   -H "x-tenant-id: tenant-123"
 * ```
 */
qualityRouter.get('/profile/latest', async (c) => {
  const auth = c.get('auth') as AuthContext;
  const entityUrn = c.req.query('entityUrn');

  if (!entityUrn) {
    return c.json({ error: 'Missing entityUrn query parameter' }, 400);
  }

  const profile = await qualityService.getLatestProfile(auth.tenantId, entityUrn);

  if (!profile) {
    return c.json({ error: 'No profile found for this entity' }, 404);
  }

  return c.json(profile, 200);
});

/**
 * GET /quality/profile/history
 *
 * Get profile history for an entity (time-series).
 *
 * Example:
 * ```bash
 * curl "http://localhost:8787/quality/profile/history?entityUrn=gl.account:revenue_gross&limit=30" \
 *   -H "x-tenant-id: tenant-123"
 * ```
 */
qualityRouter.get('/profile/history', async (c) => {
  const auth = c.get('auth') as AuthContext;
  const entityUrn = c.req.query('entityUrn');
  const limit = parseInt(c.req.query('limit') ?? '20', 10);

  if (!entityUrn) {
    return c.json({ error: 'Missing entityUrn query parameter' }, 400);
  }

  const history = await qualityService.getProfileHistory(
    auth.tenantId,
    entityUrn,
    limit
  );

  return c.json(history, 200);
});

