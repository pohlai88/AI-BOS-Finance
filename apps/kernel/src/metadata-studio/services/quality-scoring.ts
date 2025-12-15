// metadata-studio/services/quality-scoring.ts

/**
 * Quality Scoring Engine
 *
 * Converts raw profiler statistics into quality dimensions:
 * - completeness: % of non-null values
 * - uniqueness: % of distinct values (cardinality)
 * - validity: minimum of completeness/uniqueness, adjusted by rules
 * - qualityScore: average of the three dimensions
 *
 * Aligned with GRCD DataProfileSchema and standard pack quality rules.
 */

export type QualityDimension = 'completeness' | 'uniqueness' | 'validity';

export interface QualityRuleLike {
  dimension: QualityDimension;
  threshold: number; // 0–100
}

export interface ColumnProfile {
  columnName: string;
  nullCount: number;
  distinctCount: number;
  min: unknown;
  max: unknown;
  mean: number | null;
  median: number | null;
  stdDev: number | null;
  topValues: Array<{ value: unknown; count: number; percentage: number }>;
}

export interface DataProfile {
  rowCount: number;
  columnProfiles: ColumnProfile[];
  completeness?: number;
  uniqueness?: number;
  validity?: number;
  qualityScore?: number;
}

export interface QualityDimensions {
  completeness: number;
  uniqueness: number;
  validity: number;
  qualityScore: number;
}

/**
 * Clamp a value between min and max.
 */
const clamp = (value: number, min = 0, max = 100): number => {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
};

/**
 * Calculate average of an array of numbers.
 */
const average = (values: number[]): number => {
  if (!values.length) return 100;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
};

/**
 * computeQuality
 *
 * Computes quality dimensions from raw profile statistics:
 *
 * 1. **completeness**: 100% - avg(nullCount / rowCount) across columns
 *    - Measures how "filled in" the data is
 *    - 100% = no nulls, 0% = all nulls
 *
 * 2. **uniqueness**: avg(distinctCount / rowCount) across columns
 *    - Measures data cardinality/diversity
 *    - 100% = all unique values, 0% = all same value
 *
 * 3. **validity**: min(completeness, uniqueness), adjusted by quality rules
 *    - Starts as the weaker of completeness/uniqueness
 *    - Reduced if quality rules' thresholds aren't met
 *    - Rules come from standard packs (IFRS, MFRS, etc.)
 *
 * 4. **qualityScore**: average of the three dimensions
 *    - Overall quality metric (0-100)
 *
 * @param profile - Raw data profile from profiler executor
 * @param rules - Quality rules from standard packs (optional)
 * @returns Quality dimensions (0-100 for each)
 *
 * @example
 * ```typescript
 * const profile = await profilerExecutor.profileTable({
 *   schema: 'public',
 *   table: 'sales'
 * });
 *
 * const quality = computeQuality(profile, [
 *   { dimension: 'completeness', threshold: 95 },
 *   { dimension: 'uniqueness', threshold: 80 }
 * ]);
 *
 * console.log(`Quality Score: ${quality.qualityScore}%`);
 * console.log(`Completeness: ${quality.completeness}%`);
 * console.log(`Uniqueness: ${quality.uniqueness}%`);
 * console.log(`Validity: ${quality.validity}%`);
 * ```
 */
export function computeQuality(
  profile: DataProfile,
  rules: QualityRuleLike[] = []
): QualityDimensions {
  const rowCount = profile.rowCount || 0;

  const completenessPerCol: number[] = [];
  const uniquenessPerCol: number[] = [];

  // ═══════════════════════════════════════════════════════════════════
  // 1) Calculate completeness and uniqueness per column
  // ═══════════════════════════════════════════════════════════════════
  for (const col of profile.columnProfiles) {
    const colCompleteness =
      rowCount === 0 ? 100 : clamp((1 - col.nullCount / rowCount) * 100);
    const colUniqueness =
      rowCount === 0 ? 100 : clamp((col.distinctCount / rowCount) * 100);

    completenessPerCol.push(colCompleteness);
    uniquenessPerCol.push(colUniqueness);
  }

  let completeness = clamp(average(completenessPerCol));
  let uniqueness = clamp(average(uniquenessPerCol));

  // ═══════════════════════════════════════════════════════════════════
  // 2) Base validity as the weaker of the two
  // ═══════════════════════════════════════════════════════════════════
  let validity = Math.min(completeness, uniqueness);

  // ═══════════════════════════════════════════════════════════════════
  // 3) Apply quality rule thresholds
  // ═══════════════════════════════════════════════════════════════════
  // If we fall below a threshold, reduce validity proportionally
  for (const rule of rules) {
    const threshold = clamp(rule.threshold);
    if (threshold <= 0) continue;

    if (rule.dimension === 'completeness' && completeness < threshold) {
      // Scale validity down based on how far below threshold we are
      const scaled = clamp((completeness / threshold) * 100);
      validity = Math.min(validity, scaled);
    } else if (rule.dimension === 'uniqueness' && uniqueness < threshold) {
      const scaled = clamp((uniqueness / threshold) * 100);
      validity = Math.min(validity, scaled);
    } else if (rule.dimension === 'validity') {
      // Treat as "overall quality must be >= threshold"
      const base = Math.min(completeness, uniqueness);
      if (base < threshold) {
        const scaled = clamp((base / threshold) * 100);
        validity = Math.min(validity, scaled);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 4) Calculate overall quality score
  // ═══════════════════════════════════════════════════════════════════
  const qualityScore = clamp((completeness + uniqueness + validity) / 3);

  return {
    completeness,
    uniqueness,
    validity,
    qualityScore,
  };
}

/**
 * Helper: Format quality dimension as a grade (A-F).
 */
export function qualityToGrade(score: number): string {
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
 * Helper: Determine if quality meets a threshold.
 */
export function meetsQualityThreshold(
  dimensions: QualityDimensions,
  threshold: number
): boolean {
  return dimensions.qualityScore >= threshold;
}

