// metadata-studio/services/kpi-metrics.service.ts

/**
 * KPI Metrics Service
 * 
 * Implements GRCD Section 5 - Orchestra KPIs:
 * - Schema drift incidents per quarter
 * - p95 query latency for key workloads
 * - % of schema changes with AI review
 * - Tier 1 lineage coverage
 * 
 * These metrics are used to:
 * 1. Track governance effectiveness
 * 2. Justify autonomy tier promotions
 * 3. Identify areas needing improvement
 */

import { db } from '../db/client';
import { mdmGlobalMetadata } from '../db/schema/metadata.tables';
import { mdmLineageField } from '../db/schema/lineage.tables';
import { mdmApproval } from '../db/schema/approval.tables';
import { eq, and, sql, gte, lte, count } from 'drizzle-orm';
import {
  schemaDriftIncidentsTotal,
  tier1LineageCoverageGauge,
  metadataChangesWithAiReviewTotal,
} from '../observability/metrics';

// ============================================================================
// Types
// ============================================================================

export interface SchemaDriftKPI {
  period: string;
  incidentsTotal: number;
  incidentsResolved: number;
  avgResolutionTimeHours: number;
  byDomain: Record<string, number>;
  bySeverity: Record<string, number>;
}

export interface LineageCoverageKPI {
  totalTier1Fields: number;
  coveredFields: number;
  uncoveredFields: number;
  coveragePercent: number;
  uncoveredCanonicalKeys: string[];
}

export interface AIReviewKPI {
  totalChanges: number;
  aiReviewed: number;
  reviewPercent: number;
  byTier: Record<string, { total: number; reviewed: number }>;
}

export interface OverallKPIDashboard {
  tenantId: string;
  periodStart: string;
  periodEnd: string;
  schemaDrift: SchemaDriftKPI;
  lineageCoverage: LineageCoverageKPI;
  aiReview: AIReviewKPI;
  healthScore: number;  // 0-100
  recommendations: string[];
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Get Tier 1 lineage coverage KPI
 * 
 * GRCD KPI: Tier 1 lineage coverage should be 100%
 */
export async function getTier1LineageCoverage(
  tenantId: string,
): Promise<LineageCoverageKPI> {
  // Get all Tier 1 metadata
  const tier1Fields = await db
    .select({
      id: mdmGlobalMetadata.id,
      canonicalKey: mdmGlobalMetadata.canonicalKey,
    })
    .from(mdmGlobalMetadata)
    .where(
      and(
        eq(mdmGlobalMetadata.tenantId, tenantId),
        eq(mdmGlobalMetadata.tier, 'tier1'),
        eq(mdmGlobalMetadata.status, 'active'),
      ),
    );

  if (tier1Fields.length === 0) {
    return {
      totalTier1Fields: 0,
      coveredFields: 0,
      uncoveredFields: 0,
      coveragePercent: 100,  // No fields = 100% covered
      uncoveredCanonicalKeys: [],
    };
  }

  const tier1Ids = tier1Fields.map((f) => f.id);

  // Get lineage edges for Tier 1 fields
  const edges = await db
    .select({
      targetMetadataId: mdmLineageField.targetMetadataId,
    })
    .from(mdmLineageField)
    .where(eq(mdmLineageField.tenantId, tenantId));

  const coveredIds = new Set(edges.map((e) => e.targetMetadataId));
  const uncovered = tier1Fields.filter((f) => !coveredIds.has(f.id));

  const result: LineageCoverageKPI = {
    totalTier1Fields: tier1Fields.length,
    coveredFields: tier1Fields.length - uncovered.length,
    uncoveredFields: uncovered.length,
    coveragePercent: Math.round(
      ((tier1Fields.length - uncovered.length) / tier1Fields.length) * 100,
    ),
    uncoveredCanonicalKeys: uncovered.map((f) => f.canonicalKey),
  };

  // Update Prometheus metrics
  tier1LineageCoverageGauge.inc({ tenant_id: tenantId, status: 'covered' }, result.coveredFields);
  tier1LineageCoverageGauge.inc({ tenant_id: tenantId, status: 'uncovered' }, result.uncoveredFields);

  return result;
}

/**
 * Get schema drift incidents KPI
 * 
 * GRCD KPI: Schema drift incidents per quarter should decrease
 */
export async function getSchemaDriftKPI(
  tenantId: string,
  periodStart: Date,
  periodEnd: Date,
): Promise<SchemaDriftKPI> {
  // For now, we'll track schema drift through approval rejections
  // and metadata changes that were reverted
  const approvals = await db
    .select({
      status: mdmApproval.status,
      tier: mdmApproval.tier,
      createdAt: mdmApproval.createdAt,
      approvedAt: mdmApproval.approvedAt,
    })
    .from(mdmApproval)
    .where(
      and(
        eq(mdmApproval.tenantId, tenantId),
        gte(mdmApproval.createdAt, periodStart),
        lte(mdmApproval.createdAt, periodEnd),
      ),
    );

  // Schema drift is indicated by rejected changes
  const rejected = approvals.filter((a) => a.status === 'rejected');
  const resolved = approvals.filter((a) => a.status === 'approved');

  // Calculate average resolution time
  const resolvedWithTime = resolved.filter((a) => a.approvedAt);
  const avgResolutionMs = resolvedWithTime.length > 0
    ? resolvedWithTime.reduce((sum, a) => {
        const diff = new Date(a.approvedAt!).getTime() - new Date(a.createdAt).getTime();
        return sum + diff;
      }, 0) / resolvedWithTime.length
    : 0;

  // Group by tier (using as severity proxy)
  const bySeverity: Record<string, number> = {};
  rejected.forEach((a) => {
    bySeverity[a.tier] = (bySeverity[a.tier] ?? 0) + 1;
  });

  const result: SchemaDriftKPI = {
    period: `${periodStart.toISOString()} to ${periodEnd.toISOString()}`,
    incidentsTotal: rejected.length,
    incidentsResolved: resolved.length,
    avgResolutionTimeHours: Math.round(avgResolutionMs / (1000 * 60 * 60) * 10) / 10,
    byDomain: {},  // Would require joining with metadata
    bySeverity,
  };

  // Update Prometheus metrics
  Object.entries(bySeverity).forEach(([severity, count]) => {
    schemaDriftIncidentsTotal.inc(
      { tenant_id: tenantId, domain: 'ALL', severity },
      count,
    );
  });

  return result;
}

/**
 * Get AI review coverage KPI
 * 
 * GRCD KPI: % of schema changes with AI review before deployment
 */
export async function getAIReviewKPI(
  tenantId: string,
  periodStart: Date,
  periodEnd: Date,
): Promise<AIReviewKPI> {
  const approvals = await db
    .select({
      tier: mdmApproval.tier,
      status: mdmApproval.status,
    })
    .from(mdmApproval)
    .where(
      and(
        eq(mdmApproval.tenantId, tenantId),
        gte(mdmApproval.createdAt, periodStart),
        lte(mdmApproval.createdAt, periodEnd),
      ),
    );

  // All changes that went through approval = "reviewed"
  // For now, we assume approval workflow = AI review (human-in-loop)
  const totalChanges = approvals.length;
  const aiReviewed = approvals.filter((a) => 
    a.status === 'approved' || a.status === 'rejected',
  ).length;

  const byTier: Record<string, { total: number; reviewed: number }> = {};
  approvals.forEach((a) => {
    if (!byTier[a.tier]) {
      byTier[a.tier] = { total: 0, reviewed: 0 };
    }
    byTier[a.tier].total++;
    if (a.status === 'approved' || a.status === 'rejected') {
      byTier[a.tier].reviewed++;
    }
  });

  const result: AIReviewKPI = {
    totalChanges,
    aiReviewed,
    reviewPercent: totalChanges > 0 ? Math.round((aiReviewed / totalChanges) * 100) : 100,
    byTier,
  };

  // Update Prometheus metrics
  Object.entries(byTier).forEach(([tier, { total, reviewed }]) => {
    metadataChangesWithAiReviewTotal.inc(
      { tenant_id: tenantId, tier, ai_reviewed: 'true' },
      reviewed,
    );
    metadataChangesWithAiReviewTotal.inc(
      { tenant_id: tenantId, tier, ai_reviewed: 'false' },
      total - reviewed,
    );
  });

  return result;
}

/**
 * Get overall KPI dashboard
 * 
 * Aggregates all KPIs and calculates health score
 */
export async function getKPIDashboard(
  tenantId: string,
  periodStart: Date = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
  periodEnd: Date = new Date(),
): Promise<OverallKPIDashboard> {
  const [lineageCoverage, schemaDrift, aiReview] = await Promise.all([
    getTier1LineageCoverage(tenantId),
    getSchemaDriftKPI(tenantId, periodStart, periodEnd),
    getAIReviewKPI(tenantId, periodStart, periodEnd),
  ]);

  // Calculate health score (0-100)
  const scores = [
    lineageCoverage.coveragePercent,
    aiReview.reviewPercent,
    Math.max(0, 100 - schemaDrift.incidentsTotal * 10),  // Penalize drift incidents
  ];
  const healthScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  // Generate recommendations
  const recommendations: string[] = [];
  
  if (lineageCoverage.coveragePercent < 100) {
    recommendations.push(
      `Complete lineage for ${lineageCoverage.uncoveredFields} Tier1 fields: ${lineageCoverage.uncoveredCanonicalKeys.slice(0, 3).join(', ')}${lineageCoverage.uncoveredFields > 3 ? '...' : ''}`,
    );
  }

  if (aiReview.reviewPercent < 90) {
    recommendations.push(
      `Increase AI review coverage from ${aiReview.reviewPercent}% to 90%+`,
    );
  }

  if (schemaDrift.incidentsTotal > 5) {
    recommendations.push(
      `Investigate schema drift: ${schemaDrift.incidentsTotal} incidents in period`,
    );
  }

  if (schemaDrift.avgResolutionTimeHours > 24) {
    recommendations.push(
      `Reduce drift resolution time from ${schemaDrift.avgResolutionTimeHours}h to <24h`,
    );
  }

  return {
    tenantId,
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    schemaDrift,
    lineageCoverage,
    aiReview,
    healthScore,
    recommendations,
  };
}

