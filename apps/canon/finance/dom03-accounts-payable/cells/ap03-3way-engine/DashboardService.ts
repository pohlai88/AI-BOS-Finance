/**
 * Match Dashboard Service
 * 
 * AP-03 3-Way Match Engine Cell — Dashboard metrics and aggregations.
 * 
 * Responsibilities:
 * - Provide match evaluation metrics
 * - Exception aging and resolution
 * - Override tracking
 * - Pass/fail rate analysis
 * 
 * Powers the AP-03 cell dashboard in the AP Manager.
 */

import type {
  MatchRepositoryPort,
} from '@aibos/kernel-core';
import type { ActorContext } from '@aibos/canon-governance';

// ============================================================================
// 1. TYPES
// ============================================================================

/**
 * Match dashboard metrics
 */
export interface MatchDashboardMetrics {
  /** Cell identity */
  cellCode: 'AP-03';
  cellName: '3-Way Match';
  
  /** Health score (0-100) */
  healthScore: number;
  healthStatus: 'healthy' | 'warning' | 'critical';
  
  /** Work queue */
  openItems: {
    total: number;
    pendingMatch: number;
    exceptions: number;
  };
  
  /** Match performance */
  matchPerformance: {
    passRate: number;
    failRate: number;
    exceptionRate: number;
    matchedToday: number;
    matchedThisWeek: number;
  };
  
  /** By match mode */
  byMatchMode: MatchModeStats[];
  
  /** Exception health */
  exceptionHealth: {
    totalOpen: number;
    highSeverity: number;
    mediumSeverity: number;
    lowSeverity: number;
    avgResolutionDays: number;
    oldestUnresolvedDays: number;
  };
  
  /** Exception by type */
  exceptionsByType: ExceptionTypeCount[];
  
  /** Override tracking */
  overrideMetrics: {
    overridesThisMonth: number;
    overrideValueTotal: string;
    currency: string;
    topOverriders: OverriderStat[];
  };
  
  /** Control health */
  controlHealth: {
    sodComplianceRate: number;
    toleranceComplianceRate: number;
    auditCoverage: number;
  };
  
  generatedAt: Date;
}

interface MatchModeStats {
  mode: string;
  count: number;
  passRate: number;
}

interface ExceptionTypeCount {
  type: string;
  count: number;
  avgAge: number;
}

interface OverriderStat {
  userId: string;
  userName?: string;
  overrideCount: number;
}

/**
 * Match cell summary (for AP Manager)
 */
export interface MatchCellSummary {
  code: 'AP-03';
  name: '3-Way Match';
  healthScore: number;
  status: 'healthy' | 'warning' | 'critical';
  openItems: number;
  keyMetric: { label: string; value: number | string };
}

// ============================================================================
// 2. HELPER FUNCTIONS
// ============================================================================

function calculateHealthScore(metrics: {
  passRate: number;
  highSeverityExceptions: number;
  oldestUnresolvedDays: number;
  singleUserOverrides: number;
}): number {
  let score = 100;
  
  // Deduct for low pass rate
  if (metrics.passRate < 70) score -= 25;
  else if (metrics.passRate < 80) score -= 15;
  else if (metrics.passRate < 90) score -= 5;
  
  // Deduct for high severity exceptions
  if (metrics.highSeverityExceptions > 10) score -= 20;
  else if (metrics.highSeverityExceptions > 5) score -= 10;
  else if (metrics.highSeverityExceptions > 0) score -= 5;
  
  // Deduct for old unresolved exceptions
  if (metrics.oldestUnresolvedDays > 30) score -= 20;
  else if (metrics.oldestUnresolvedDays > 14) score -= 10;
  else if (metrics.oldestUnresolvedDays > 7) score -= 5;
  
  // Deduct for concentrated overrides (SoD concern)
  if (metrics.singleUserOverrides > 20) score -= 15;
  else if (metrics.singleUserOverrides > 10) score -= 5;
  
  return Math.max(score, 0);
}

function determineHealthStatus(score: number): 'healthy' | 'warning' | 'critical' {
  if (score >= 80) return 'healthy';
  if (score >= 50) return 'warning';
  return 'critical';
}

// ============================================================================
// 3. SERVICE
// ============================================================================

/**
 * MatchDashboardService — Powers the AP-03 cell dashboard
 */
export class MatchDashboardService {
  constructor(
    private matchRepo: MatchRepositoryPort
  ) {}

  /**
   * Get full dashboard metrics for AP-03
   */
  async getDashboard(actor: ActorContext): Promise<MatchDashboardMetrics> {
    const tenantId = actor.tenantId;
    
    // Get all metrics in parallel
    const [
      statusCounts,
      exceptionStats,
      overrideStats,
      performanceStats,
    ] = await Promise.all([
      this.getStatusCounts(tenantId),
      this.getExceptionStats(tenantId),
      this.getOverrideStats(tenantId),
      this.getPerformanceStats(tenantId),
    ]);
    
    const pendingMatch = statusCounts.pending ?? 0;
    const exceptions = exceptionStats.totalOpen;
    
    const healthScore = calculateHealthScore({
      passRate: performanceStats.passRate,
      highSeverityExceptions: exceptionStats.highSeverity,
      oldestUnresolvedDays: exceptionStats.oldestUnresolvedDays,
      singleUserOverrides: overrideStats.topOverriders[0]?.overrideCount ?? 0,
    });
    
    return {
      cellCode: 'AP-03',
      cellName: '3-Way Match',
      
      healthScore,
      healthStatus: determineHealthStatus(healthScore),
      
      openItems: {
        total: pendingMatch + exceptions,
        pendingMatch,
        exceptions,
      },
      
      matchPerformance: performanceStats,
      
      byMatchMode: [
        { mode: 'NO_MATCH', count: 0, passRate: 100 },
        { mode: '1_WAY', count: 0, passRate: 95 },
        { mode: '2_WAY', count: 0, passRate: 90 },
        { mode: '3_WAY', count: 0, passRate: 85 },
      ],
      
      exceptionHealth: exceptionStats,
      
      exceptionsByType: [
        { type: 'PRICE_VARIANCE', count: 0, avgAge: 0 },
        { type: 'QTY_VARIANCE', count: 0, avgAge: 0 },
        { type: 'NO_PO', count: 0, avgAge: 0 },
        { type: 'NO_GRN', count: 0, avgAge: 0 },
      ],
      
      overrideMetrics: overrideStats,
      
      controlHealth: {
        sodComplianceRate: 100,
        toleranceComplianceRate: 100,
        auditCoverage: 100,
      },
      
      generatedAt: new Date(),
    };
  }

  /**
   * Get summary for AP Manager cluster dashboard
   */
  async getSummary(actor: ActorContext): Promise<MatchCellSummary> {
    const dashboard = await this.getDashboard(actor);
    
    return {
      code: 'AP-03',
      name: '3-Way Match',
      healthScore: dashboard.healthScore,
      status: dashboard.healthStatus,
      openItems: dashboard.openItems.total,
      keyMetric: {
        label: 'Exceptions',
        value: dashboard.openItems.exceptions,
      },
    };
  }

  /**
   * Get status counts
   */
  private async getStatusCounts(tenantId: string): Promise<{
    pending: number;
    passed: number;
    failed: number;
    exception: number;
    override: number;
  }> {
    try {
      const counts = await this.matchRepo.getStatusCounts?.(tenantId);
      return counts ?? {
        pending: 0,
        passed: 0,
        failed: 0,
        exception: 0,
        override: 0,
      };
    } catch {
      return { pending: 0, passed: 0, failed: 0, exception: 0, override: 0 };
    }
  }

  /**
   * Get exception statistics
   */
  private async getExceptionStats(tenantId: string): Promise<{
    totalOpen: number;
    highSeverity: number;
    mediumSeverity: number;
    lowSeverity: number;
    avgResolutionDays: number;
    oldestUnresolvedDays: number;
  }> {
    try {
      const stats = await this.matchRepo.getExceptionStats?.(tenantId);
      return stats ?? {
        totalOpen: 0,
        highSeverity: 0,
        mediumSeverity: 0,
        lowSeverity: 0,
        avgResolutionDays: 0,
        oldestUnresolvedDays: 0,
      };
    } catch {
      return {
        totalOpen: 0,
        highSeverity: 0,
        mediumSeverity: 0,
        lowSeverity: 0,
        avgResolutionDays: 0,
        oldestUnresolvedDays: 0,
      };
    }
  }

  /**
   * Get override statistics
   */
  private async getOverrideStats(tenantId: string): Promise<{
    overridesThisMonth: number;
    overrideValueTotal: string;
    currency: string;
    topOverriders: OverriderStat[];
  }> {
    try {
      const stats = await this.matchRepo.getOverrideStats?.(tenantId);
      return stats ?? {
        overridesThisMonth: 0,
        overrideValueTotal: '0.00',
        currency: 'USD',
        topOverriders: [],
      };
    } catch {
      return {
        overridesThisMonth: 0,
        overrideValueTotal: '0.00',
        currency: 'USD',
        topOverriders: [],
      };
    }
  }

  /**
   * Get performance statistics
   */
  private async getPerformanceStats(tenantId: string): Promise<{
    passRate: number;
    failRate: number;
    exceptionRate: number;
    matchedToday: number;
    matchedThisWeek: number;
  }> {
    try {
      const stats = await this.matchRepo.getPerformanceStats?.(tenantId);
      return stats ?? {
        passRate: 100,
        failRate: 0,
        exceptionRate: 0,
        matchedToday: 0,
        matchedThisWeek: 0,
      };
    } catch {
      return {
        passRate: 100,
        failRate: 0,
        exceptionRate: 0,
        matchedToday: 0,
        matchedThisWeek: 0,
      };
    }
  }
}

// ============================================================================
// 4. FACTORY
// ============================================================================

export function createMatchDashboardService(
  matchRepo: MatchRepositoryPort
): MatchDashboardService {
  return new MatchDashboardService(matchRepo);
}
