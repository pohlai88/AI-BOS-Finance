/**
 * Approval Dashboard Service
 * 
 * AP-04 Invoice Approval Cell — Dashboard metrics and aggregations.
 * 
 * Responsibilities:
 * - Provide approval queue metrics
 * - Bottleneck identification
 * - SoD compliance tracking
 * - Approval aging analysis
 * 
 * Powers the AP-04 cell dashboard in the AP Manager.
 */

import type {
  ApprovalRepositoryPort,
} from '@aibos/kernel-core';
import type { ActorContext } from '@aibos/canon-governance';

// ============================================================================
// 1. TYPES
// ============================================================================

/**
 * Approval dashboard metrics
 */
export interface ApprovalDashboardMetrics {
  /** Cell identity */
  cellCode: 'AP-04';
  cellName: 'Invoice Approval';
  
  /** Health score (0-100) */
  healthScore: number;
  healthStatus: 'healthy' | 'warning' | 'critical';
  
  /** Work queue */
  openItems: {
    total: number;
    pendingApproval: number;
    pendingApprovalValue: string;
    currency: string;
  };
  
  /** Performance metrics */
  performanceMetrics: {
    approvedToday: number;
    rejectedToday: number;
    changesRequestedToday: number;
    avgApprovalTimeDays: number;
  };
  
  /** Aging */
  aging: {
    pending0to3Days: number;
    pending3to7Days: number;
    pending7to14Days: number;
    pendingOver14Days: number;
  };
  
  /** By approval level */
  byLevel: ApprovalLevelStats[];
  
  /** Bottleneck analysis */
  bottlenecks: BottleneckStat[];
  
  /** SoD compliance */
  sodCompliance: {
    totalApprovals: number;
    selfApprovalAttempts: number;
    delegationUsage: number;
    complianceRate: number;
  };
  
  /** Control health */
  controlHealth: {
    sodComplianceRate: number;
    timingComplianceRate: number;
    auditCoverage: number;
  };
  
  generatedAt: Date;
}

interface ApprovalLevelStats {
  level: number;
  pendingCount: number;
  avgWaitTimeDays: number;
  bottleneckApprover?: string;
}

interface BottleneckStat {
  approverId: string;
  approverName?: string;
  pendingCount: number;
  avgResponseTimeDays: number;
  status: 'healthy' | 'slow' | 'blocked';
}

/**
 * Approval cell summary (for AP Manager)
 */
export interface ApprovalCellSummary {
  code: 'AP-04';
  name: 'Invoice Approval';
  healthScore: number;
  status: 'healthy' | 'warning' | 'critical';
  openItems: number;
  keyMetric: { label: string; value: number | string };
}

// ============================================================================
// 2. HELPER FUNCTIONS
// ============================================================================

function calculateHealthScore(metrics: {
  pendingOver7Days: number;
  pendingOver14Days: number;
  selfApprovalAttempts: number;
  maxPendingPerApprover: number;
}): number {
  let score = 100;
  
  // Deduct for old pending approvals
  if (metrics.pendingOver14Days > 10) score -= 25;
  else if (metrics.pendingOver14Days > 5) score -= 15;
  else if (metrics.pendingOver14Days > 0) score -= 5;
  
  if (metrics.pendingOver7Days > 20) score -= 15;
  else if (metrics.pendingOver7Days > 10) score -= 10;
  
  // Critical deduction for self-approval attempts
  if (metrics.selfApprovalAttempts > 0) score -= 20;
  
  // Deduct for bottlenecks
  if (metrics.maxPendingPerApprover > 50) score -= 15;
  else if (metrics.maxPendingPerApprover > 20) score -= 10;
  
  return Math.max(score, 0);
}

function determineHealthStatus(score: number): 'healthy' | 'warning' | 'critical' {
  if (score >= 80) return 'healthy';
  if (score >= 50) return 'warning';
  return 'critical';
}

function determineApproverStatus(pendingCount: number, avgResponseTimeDays: number): 'healthy' | 'slow' | 'blocked' {
  if (pendingCount > 30 || avgResponseTimeDays > 7) return 'blocked';
  if (pendingCount > 10 || avgResponseTimeDays > 3) return 'slow';
  return 'healthy';
}

// ============================================================================
// 3. SERVICE
// ============================================================================

/**
 * ApprovalDashboardService — Powers the AP-04 cell dashboard
 */
export class ApprovalDashboardService {
  constructor(
    private approvalRepo: ApprovalRepositoryPort
  ) {}

  /**
   * Get full dashboard metrics for AP-04
   */
  async getDashboard(actor: ActorContext): Promise<ApprovalDashboardMetrics> {
    const tenantId = actor.tenantId;
    
    // Get all metrics in parallel
    const [
      queueStats,
      agingStats,
      performanceStats,
      bottleneckStats,
      sodStats,
    ] = await Promise.all([
      this.getQueueStats(tenantId),
      this.getAgingStats(tenantId),
      this.getPerformanceStats(tenantId),
      this.getBottleneckStats(tenantId),
      this.getSoDStats(tenantId),
    ]);
    
    const pendingOver7Days = agingStats.pending7to14Days + agingStats.pendingOver14Days;
    const maxPendingPerApprover = bottleneckStats.length > 0 
      ? Math.max(...bottleneckStats.map(b => b.pendingCount))
      : 0;
    
    const healthScore = calculateHealthScore({
      pendingOver7Days,
      pendingOver14Days: agingStats.pendingOver14Days,
      selfApprovalAttempts: sodStats.selfApprovalAttempts,
      maxPendingPerApprover,
    });
    
    return {
      cellCode: 'AP-04',
      cellName: 'Invoice Approval',
      
      healthScore,
      healthStatus: determineHealthStatus(healthScore),
      
      openItems: {
        total: queueStats.pendingCount,
        pendingApproval: queueStats.pendingCount,
        pendingApprovalValue: queueStats.pendingValue,
        currency: 'USD',
      },
      
      performanceMetrics: performanceStats,
      
      aging: agingStats,
      
      byLevel: [
        { level: 1, pendingCount: 0, avgWaitTimeDays: 0 },
        { level: 2, pendingCount: 0, avgWaitTimeDays: 0 },
        { level: 3, pendingCount: 0, avgWaitTimeDays: 0 },
      ],
      
      bottlenecks: bottleneckStats.map(b => ({
        ...b,
        status: determineApproverStatus(b.pendingCount, b.avgResponseTimeDays),
      })),
      
      sodCompliance: sodStats,
      
      controlHealth: {
        sodComplianceRate: sodStats.complianceRate,
        timingComplianceRate: 100,
        auditCoverage: 100,
      },
      
      generatedAt: new Date(),
    };
  }

  /**
   * Get summary for AP Manager cluster dashboard
   */
  async getSummary(actor: ActorContext): Promise<ApprovalCellSummary> {
    const dashboard = await this.getDashboard(actor);
    
    return {
      code: 'AP-04',
      name: 'Invoice Approval',
      healthScore: dashboard.healthScore,
      status: dashboard.healthStatus,
      openItems: dashboard.openItems.total,
      keyMetric: {
        label: 'Pending Value',
        value: `$${dashboard.openItems.pendingApprovalValue}`,
      },
    };
  }

  /**
   * Get queue statistics
   */
  private async getQueueStats(tenantId: string): Promise<{
    pendingCount: number;
    pendingValue: string;
  }> {
    try {
      const stats = await this.approvalRepo.getQueueStats?.(tenantId);
      return stats ?? { pendingCount: 0, pendingValue: '0.00' };
    } catch {
      return { pendingCount: 0, pendingValue: '0.00' };
    }
  }

  /**
   * Get aging statistics
   */
  private async getAgingStats(tenantId: string): Promise<{
    pending0to3Days: number;
    pending3to7Days: number;
    pending7to14Days: number;
    pendingOver14Days: number;
  }> {
    try {
      const stats = await this.approvalRepo.getAgingStats?.(tenantId);
      return stats ?? {
        pending0to3Days: 0,
        pending3to7Days: 0,
        pending7to14Days: 0,
        pendingOver14Days: 0,
      };
    } catch {
      return {
        pending0to3Days: 0,
        pending3to7Days: 0,
        pending7to14Days: 0,
        pendingOver14Days: 0,
      };
    }
  }

  /**
   * Get performance statistics
   */
  private async getPerformanceStats(tenantId: string): Promise<{
    approvedToday: number;
    rejectedToday: number;
    changesRequestedToday: number;
    avgApprovalTimeDays: number;
  }> {
    try {
      const stats = await this.approvalRepo.getPerformanceStats?.(tenantId);
      return stats ?? {
        approvedToday: 0,
        rejectedToday: 0,
        changesRequestedToday: 0,
        avgApprovalTimeDays: 0,
      };
    } catch {
      return {
        approvedToday: 0,
        rejectedToday: 0,
        changesRequestedToday: 0,
        avgApprovalTimeDays: 0,
      };
    }
  }

  /**
   * Get bottleneck statistics
   */
  private async getBottleneckStats(tenantId: string): Promise<BottleneckStat[]> {
    try {
      const stats = await this.approvalRepo.getBottleneckStats?.(tenantId);
      return stats ?? [];
    } catch {
      return [];
    }
  }

  /**
   * Get SoD compliance statistics
   */
  private async getSoDStats(tenantId: string): Promise<{
    totalApprovals: number;
    selfApprovalAttempts: number;
    delegationUsage: number;
    complianceRate: number;
  }> {
    try {
      const stats = await this.approvalRepo.getSoDStats?.(tenantId);
      return stats ?? {
        totalApprovals: 0,
        selfApprovalAttempts: 0,
        delegationUsage: 0,
        complianceRate: 100,
      };
    } catch {
      return {
        totalApprovals: 0,
        selfApprovalAttempts: 0,
        delegationUsage: 0,
        complianceRate: 100,
      };
    }
  }
}

// ============================================================================
// 4. FACTORY
// ============================================================================

export function createApprovalDashboardService(
  approvalRepo: ApprovalRepositoryPort
): ApprovalDashboardService {
  return new ApprovalDashboardService(approvalRepo);
}
