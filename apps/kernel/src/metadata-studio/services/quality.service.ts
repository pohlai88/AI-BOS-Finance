// metadata-studio/services/quality.service.ts

import { z } from 'zod';
import type { DataProfile, QualityRuleLike } from './quality-scoring';
import { computeQuality } from './quality-scoring';
import { ProfilerExecutor } from '../db/profiler.executor';
import { observabilityRepo } from '../db/observability.repo';
import {
  metadataProfilerRunsTotal,
  metadataProfilerFailuresTotal,
  metadataProfilerDurationSeconds,
} from '../observability/metrics';
import { withSpan, addSpanAttributes } from '../observability/tracing';

/**
 * Input schema for runProfiler.
 *
 * Matches the expected POST /quality/profile body shape.
 */
export const RunProfilerInputSchema = z.object({
  tenantId: z.string().uuid(),
  entityUrn: z.string().min(1), // e.g. "gl.account:revenue_gross"
  
  // Physical table to profile
  service: z.object({
    schema: z.string().min(1), // e.g. "public"
    table: z.string().min(1),  // e.g. "sales_transactions"
  }),
  
  // Optional: specific columns to profile (defaults to all)
  columns: z.array(z.string()).optional(),
  
  // Who triggered this profiler run
  triggeredBy: z.object({
    actorId: z.string().min(1),
    actorType: z.enum(['HUMAN', 'AGENT', 'SYSTEM']),
  }),
  
  // Optional: governance tier for tracking
  governanceTier: z.enum(['T1', 'T2', 'T3', 'T4', 'T5']).optional(),
  
  // Optional: quality rules to apply (defaults to fetching from standard packs)
  qualityRules: z.array(
    z.object({
      dimension: z.enum(['completeness', 'uniqueness', 'validity']),
      threshold: z.number().min(0).max(100),
    })
  ).optional(),
});

export type RunProfilerInput = z.infer<typeof RunProfilerInputSchema>;

export interface ProfilerResult {
  profile: DataProfile;
  profileId: string;
  qualityGrade: string; // A-F
  meetsThreshold: boolean;
}

/**
 * QualityService
 *
 * Orchestrates data quality profiling:
 * 1. Validates input (RunProfilerInputSchema)
 * 2. Executes SQL profiler against physical table
 * 3. Computes quality dimensions (completeness, uniqueness, validity, score)
 * 4. Persists profile via observabilityRepo
 * 5. Tracks metrics + OTEL spans (metadata.profile)
 *
 * Aligned with GRCD observability requirements and Audit #004.
 */
export class QualityService {
  constructor(
    private readonly profilerExecutor: ProfilerExecutor
  ) {}

  /**
   * Run data profiler for a given entity/table.
   *
   * @param input - Profiler configuration (table, columns, triggers)
   * @returns Profile result with quality dimensions
   *
   * @example
   * ```typescript
   * const qualityService = new QualityService(profilerExecutor);
   *
   * const result = await qualityService.runProfiler({
   *   tenantId: 'tenant-123',
   *   entityUrn: 'gl.account:revenue_gross',
   *   service: {
   *     schema: 'public',
   *     table: 'sales_transactions'
   *   },
   *   columns: ['amount', 'quantity', 'customer_id'],
   *   triggeredBy: {
   *     actorId: 'profiler-agent',
   *     actorType: 'AGENT'
   *   },
   *   governanceTier: 'T1',
   *   qualityRules: [
   *     { dimension: 'completeness', threshold: 95 },
   *     { dimension: 'uniqueness', threshold: 80 }
   *   ]
   * });
   *
   * console.log(`Quality Score: ${result.profile.qualityScore}%`);
   * console.log(`Grade: ${result.qualityGrade}`);
   * ```
   */
  async runProfiler(input: RunProfilerInput): Promise<ProfilerResult> {
    // ═══════════════════════════════════════════════════════════════════
    // 1) Validate input
    // ═══════════════════════════════════════════════════════════════════
    const payload = RunProfilerInputSchema.parse(input);

    // ═══════════════════════════════════════════════════════════════════
    // 2) Start metrics + tracing
    // ═══════════════════════════════════════════════════════════════════
    metadataProfilerRunsTotal.inc({
      tenant_id: payload.tenantId,
      entity_type: 'table',
    });

    const endTimer = metadataProfilerDurationSeconds.startTimer({
      tenant_id: payload.tenantId,
      entity_type: 'table',
    });

    try {
      return await withSpan('metadata.profile', async () => {
        // Add span attributes for debugging
        addSpanAttributes({
          'tenant.id': payload.tenantId,
          'entity.urn': payload.entityUrn,
          'table.schema': payload.service.schema,
          'table.name': payload.service.table,
          'actor.id': payload.triggeredBy.actorId,
          'actor.type': payload.triggeredBy.actorType,
          'governance.tier': payload.governanceTier || 'unknown',
        });

        // ═══════════════════════════════════════════════════════════════════
        // 3) Fetch quality rules (from input or standard packs)
        // ═══════════════════════════════════════════════════════════════════
        const qualityRules: QualityRuleLike[] = payload.qualityRules || [];
        
        // TODO: If not provided, fetch from standard packs:
        // const qualityRules = await standardPackRepo.getQualityRulesForEntity(
        //   payload.tenantId,
        //   payload.entityUrn
        // );

        // ═══════════════════════════════════════════════════════════════════
        // 4) Run SQL profiler
        // ═══════════════════════════════════════════════════════════════════
        const tableProfile = await this.profilerExecutor.profileTable({
          schema: payload.service.schema,
          table: payload.service.table,
          columns: payload.columns,
        });

        // ═══════════════════════════════════════════════════════════════════
        // 5) Map to DataProfile structure
        // ═══════════════════════════════════════════════════════════════════
        const dataProfile: DataProfile = {
          rowCount: tableProfile.rowCount,
          columnProfiles: tableProfile.columns.map((col) => ({
            columnName: col.columnName,
            nullCount: col.nullCount,
            distinctCount: col.distinctCount,
            min: col.min,
            max: col.max,
            mean: col.mean,
            median: col.median,
            stdDev: col.stdDev,
            topValues: col.topValues,
          })),
        };

        // ═══════════════════════════════════════════════════════════════════
        // 6) Compute quality dimensions
        // ═══════════════════════════════════════════════════════════════════
        const dimensions = computeQuality(dataProfile, qualityRules);

        const finalProfile: DataProfile = {
          ...dataProfile,
          ...dimensions,
        };

        // ═══════════════════════════════════════════════════════════════════
        // 7) Persist profile via observability repository
        // ═══════════════════════════════════════════════════════════════════
        const savedProfile = await observabilityRepo.saveProfile({
          tenantId: payload.tenantId,
          entityUrn: payload.entityUrn,
          profile: finalProfile,
          completeness: dimensions.completeness,
          uniqueness: dimensions.uniqueness,
          validity: dimensions.validity,
          qualityScore: dimensions.qualityScore,
          governanceTier: payload.governanceTier,
          createdBy: payload.triggeredBy.actorId,
        });

        // ═══════════════════════════════════════════════════════════════════
        // 8) Add metrics to span
        // ═══════════════════════════════════════════════════════════════════
        addSpanAttributes({
          'profile.row_count': finalProfile.rowCount,
          'profile.completeness': dimensions.completeness,
          'profile.uniqueness': dimensions.uniqueness,
          'profile.validity': dimensions.validity,
          'profile.quality_score': dimensions.qualityScore,
        });

        // ═══════════════════════════════════════════════════════════════════
        // 9) Calculate grade and threshold check
        // ═══════════════════════════════════════════════════════════════════
        const qualityGrade = this.qualityToGrade(dimensions.qualityScore);
        
        // Check if meets minimum quality threshold (default 70%)
        const minThreshold = qualityRules.find(r => r.dimension === 'validity')?.threshold || 70;
        const meetsThreshold = dimensions.qualityScore >= minThreshold;

        return {
          profile: finalProfile,
          profileId: savedProfile.id,
          qualityGrade,
          meetsThreshold,
        };
      });
    } catch (err: any) {
      // ═══════════════════════════════════════════════════════════════════
      // 10) Track failures
      // ═══════════════════════════════════════════════════════════════════
      metadataProfilerFailuresTotal.inc({
        tenant_id: payload.tenantId,
        error_type: 'profiler_error',
      });

      throw new Error(
        `Failed to run data profiler for entity ${payload.entityUrn}: ${err?.message ?? err}`
      );
    } finally {
      endTimer();
    }
  }

  /**
   * Helper: Format quality score as a grade (A-F).
   */
  private qualityToGrade(score: number): string {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'A-';
    if (score >= 80) return 'B+';
    if (score >= 75) return 'B';
    if (score >= 70) return 'B-';
    if (score >= 65) return 'C+';
    if (score >= 60) return 'C';
    if (score >= 55) return 'C-';
    if (score >= 50) return 'D';
    return 'F';
  }

  /**
   * Get latest profile for an entity.
   */
  async getLatestProfile(tenantId: string, entityUrn: string) {
    return await observabilityRepo.getLatestProfile(tenantId, entityUrn);
  }

  /**
   * Get profile history for an entity.
   */
  async getProfileHistory(tenantId: string, entityUrn: string, limit = 20) {
    return await observabilityRepo.getProfileHistory(tenantId, entityUrn, limit);
  }
}

