// ============================================================================
// META GOVERNANCE ROUTES - UI-Driven Development
// ============================================================================
// Serves: META_01 (Schema Governance), META_04 (Risk Radar), META_06 (Health)
// Philosophy: Simple routes that return exactly what the UI needs
// ============================================================================

import { Hono } from 'hono';
import { sql } from 'drizzle-orm';
import { db } from '../db/client';
import { mdmGlobalMetadata } from '../db/schema/metadata.tables';
import { mdmStandardPack } from '../db/schema/standard-pack.tables';
import { getAuth, type AppVariables } from '../middleware/auth.middleware';
import type {
  GovernanceDashboardResponse,
  RiskRadarResponse,
  HealthScanResponse,
  ViolationSeverity,
} from '@ai-bos/shared';

export const metaGovernanceRouter = new Hono<{ Variables: AppVariables }>();

// -----------------------------------------------------------------------------
// META_01: Governance Dashboard
// GET /api/meta/governance/dashboard
// -----------------------------------------------------------------------------
metaGovernanceRouter.get('/dashboard', async (c) => {
  const auth = getAuth(c);
  const tenantId = auth?.tenantId ?? 'default';

  try {
    // Parallel queries for performance
    const [fieldStats, standardPacks] = await Promise.all([
      // Field statistics by status
      db.execute(sql`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'active') as active,
          COUNT(*) FILTER (WHERE status = 'draft') as draft,
          COUNT(*) FILTER (WHERE status = 'deprecated') as deprecated
        FROM mdm_global_metadata
        WHERE tenant_id = ${tenantId}
      `),
      // Standard pack coverage
      db
        .select({
          pack_id: mdmStandardPack.packId,
          pack_name: mdmStandardPack.packName,
          category: mdmStandardPack.category,
        })
        .from(mdmStandardPack)
        .limit(10),
    ]);

    const stats = fieldStats.rows[0] as Record<string, number> ?? {
      total: 0,
      active: 0,
      draft: 0,
      deprecated: 0,
    };

    // Calculate health score (naive: % of active fields)
    const total = Number(stats.total) || 0;
    const active = Number(stats.active) || 0;
    const healthScore = total === 0 ? 100 : Math.round((active / total) * 100);

    const response: GovernanceDashboardResponse = {
      stats: {
        total_fields: total,
        active_fields: active,
        draft_fields: Number(stats.draft) || 0,
        deprecated_fields: Number(stats.deprecated) || 0,
        violation_count: 0, // TODO: Query from mdm_violation_report when data exists
        health_score: healthScore,
      },
      systems: [
        // Mock data until real system bindings exist
        {
          id: 'postgres-local',
          system_name: 'PostgreSQL (Local)',
          system_type: 'rdbms',
          status: 'healthy',
          schema_count: total,
          validated_count: active,
          drift_count: 0,
          compliance_percent: healthScore,
          last_sync: new Date().toISOString(),
          sample_tables: ['mdm_global_metadata', 'mdm_entity_catalog'],
        },
      ],
      recent_violations: [], // TODO: Populate from mdm_violation_report
      recent_events: [
        // Mock recent events
        {
          id: '1',
          time: new Date().toISOString(),
          system: 'Metadata Studio',
          event: 'Dashboard loaded',
          severity: 'info',
        },
      ],
    };

    return c.json(response);
  } catch (error) {
    console.error('Error fetching governance dashboard:', error);
    return c.json(
      {
        stats: {
          total_fields: 0,
          active_fields: 0,
          draft_fields: 0,
          deprecated_fields: 0,
          violation_count: 0,
          health_score: 0,
        },
        systems: [],
        recent_violations: [],
        recent_events: [],
      } satisfies GovernanceDashboardResponse,
      200,
    );
  }
});

// -----------------------------------------------------------------------------
// META_04: Risk Radar
// GET /api/meta/governance/risks
// -----------------------------------------------------------------------------
metaGovernanceRouter.get('/risks', async (c) => {
  const auth = getAuth(c);
  const tenantId = auth?.tenantId ?? 'default';

  try {
    // Query for fields missing required governance attributes
    const [tierViolations, orphanFields] = await Promise.all([
      // Tier1/2 without standard_pack_id
      db.execute(sql`
        SELECT canonical_key, tier, 'Missing standard_pack_id' as issue
        FROM mdm_global_metadata
        WHERE tenant_id = ${tenantId}
          AND tier IN ('tier1', 'tier2')
          AND (standard_pack_id IS NULL OR standard_pack_id = '')
        LIMIT 20
      `),
      // Fields with potential data quality issues (no label)
      db.execute(sql`
        SELECT canonical_key, 'Missing label' as issue
        FROM mdm_global_metadata
        WHERE tenant_id = ${tenantId}
          AND (label IS NULL OR label = '')
        LIMIT 20
      `),
    ]);

    const tierIssues = (tierViolations.rows || []).map((row: any, idx: number) => ({
      id: `tier-${idx}`,
      violation_code: 'GRCD-12',
      target_key: row.canonical_key,
      severity: 'high' as ViolationSeverity,
      message: `${row.issue} for ${row.tier} field`,
      detected_at: new Date().toISOString(),
      status: 'open' as const,
    }));

    const orphanIssues = (orphanFields.rows || []).map((row: any, idx: number) => ({
      id: `orphan-${idx}`,
      violation_code: 'GRCD-20',
      target_key: row.canonical_key,
      severity: 'medium' as ViolationSeverity,
      message: row.issue,
      detected_at: new Date().toISOString(),
      status: 'open' as const,
    }));

    const response: RiskRadarResponse = {
      summary: {
        total_issues: tierIssues.length + orphanIssues.length,
        active_issues: tierIssues.length + orphanIssues.length,
        critical_count: 0,
        remediated_count: 0,
      },
      categories: [
        {
          id: 'governance',
          title: 'Governance Violations',
          severity: 'high',
          issue_count: tierIssues.length,
          issues: tierIssues,
        },
        {
          id: 'data-quality',
          title: 'Data Quality Issues',
          severity: 'medium',
          issue_count: orphanIssues.length,
          issues: orphanIssues,
        },
      ],
    };

    return c.json(response);
  } catch (error) {
    console.error('Error fetching risk radar:', error);
    return c.json(
      {
        summary: {
          total_issues: 0,
          active_issues: 0,
          critical_count: 0,
          remediated_count: 0,
        },
        categories: [],
      } satisfies RiskRadarResponse,
      200,
    );
  }
});

// -----------------------------------------------------------------------------
// META_06: Health Scan
// GET /api/meta/governance/health
// -----------------------------------------------------------------------------
metaGovernanceRouter.get('/health', async (c) => {
  const auth = getAuth(c);
  const tenantId = auth?.tenantId ?? 'default';

  try {
    // Query field coverage by standard pack
    const packCoverage = await db.execute(sql`
      SELECT 
        sp.pack_id,
        sp.pack_name,
        sp.category,
        COUNT(gm.id) as field_count,
        COUNT(gm.id) FILTER (WHERE gm.status = 'active') as active_count
      FROM mdm_standard_pack sp
      LEFT JOIN mdm_global_metadata gm 
        ON gm.standard_pack_id = sp.pack_id 
        AND gm.tenant_id = ${tenantId}
      GROUP BY sp.pack_id, sp.pack_name, sp.category
      ORDER BY field_count DESC
      LIMIT 20
    `);

    const modules = (packCoverage.rows || []).map((row: any) => {
      const fieldCount = Number(row.field_count) || 0;
      const activeCount = Number(row.active_count) || 0;
      const score = fieldCount === 0 ? 0 : Math.round((activeCount / fieldCount) * 100);

      let status: 'governed' | 'watch' | 'exposed' = 'exposed';
      if (score >= 80) status = 'governed';
      else if (score >= 50) status = 'watch';

      return {
        id: row.pack_id,
        name: row.pack_name,
        standard_pack_id: row.pack_id,
        score,
        status,
        issue_count: fieldCount - activeCount,
        issues: [],
      };
    });

    // Calculate overall score
    const totalScore = modules.reduce((sum, m) => sum + m.score, 0);
    const overallScore = modules.length === 0 ? 100 : Math.round(totalScore / modules.length);

    const response: HealthScanResponse = {
      overall_score: overallScore,
      trend: 0, // TODO: Calculate from historical data
      modules,
      summary: {
        governed_count: modules.filter((m) => m.status === 'governed').length,
        watch_count: modules.filter((m) => m.status === 'watch').length,
        exposed_count: modules.filter((m) => m.status === 'exposed').length,
        critical_issues: 0,
      },
    };

    return c.json(response);
  } catch (error) {
    console.error('Error fetching health scan:', error);
    return c.json(
      {
        overall_score: 0,
        trend: 0,
        modules: [],
        summary: {
          governed_count: 0,
          watch_count: 0,
          exposed_count: 0,
          critical_issues: 0,
        },
      } satisfies HealthScanResponse,
      200,
    );
  }
});
