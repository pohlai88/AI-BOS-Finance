/**
 * Credit Note Dashboard Service
 * 
 * AR-04 Credit Note Cell — Dashboard metrics and aggregations.
 * 
 * Responsibilities:
 * - Provide credit note health metrics
 * - Pending approvals tracking
 * - Unapplied credits monitoring
 * - Reversal tracking
 * 
 * Powers the AR-04 cell dashboard in the AR Manager.
 * 
 * @module AR-04
 */

import type {
  CreditNoteRepositoryPort,
  CreditNoteStatus,
} from '@aibos/kernel-core';

// =============================================================================
// 1. TYPES
// =============================================================================

export interface ActorContext {
  tenantId: string;
  userId: string;
  permissions?: string[];
}

/**
 * Credit Note dashboard metrics
 */
export interface CreditNoteDashboardMetrics {
  /** Cell identity */
  cellCode: 'AR-04';
  cellName: 'Credit Note';

  /** Health score (0-100) */
  healthScore: number;
  healthStatus: 'healthy' | 'warning' | 'critical';

  /** Work queue */
  openItems: {
    total: number;
    pendingApproval: number;
    pendingPosting: number;
    pendingApplication: number;
  };

  /** Credit note metrics */
  creditNoteMetrics: {
    totalCreditNotesThisMonth: number;
    totalCreditAmount: number;
    averageCreditValue: number;
    creditToSalesRatio: number; // % of credits vs sales
  };

  /** Application status */
  applicationStatus: {
    fullyApplied: number;
    partiallyApplied: number;
    unapplied: number;
    totalUnappliedAmount: number;
  };

  /** Status distribution */
  byStatus: StatusCount[];

  /** Reason distribution */
  byReason: ReasonCount[];

  /** Control health */
  controlHealth: {
    unappliedOver30Days: number;
    highValuePending: number; // Credits > $10K pending approval
    writeOffRequests: number;
  };

  generatedAt: Date;
}

interface StatusCount {
  status: CreditNoteStatus;
  count: number;
}

interface ReasonCount {
  reason: string;
  count: number;
  amount: number;
}

/**
 * Credit Note cell summary (for AR Manager)
 */
export interface CreditNoteCellSummary {
  code: 'AR-04';
  name: 'Credit Note';
  healthScore: number;
  status: 'healthy' | 'warning' | 'critical';
  openItems: number;
  keyMetric: { label: string; value: number | string };
}

// =============================================================================
// 2. HELPER FUNCTIONS
// =============================================================================

function calculateHealthScore(metrics: {
  pendingApproval: number;
  unappliedOver30Days: number;
  highValuePending: number;
  creditToSalesRatio: number;
}): number {
  let score = 100;

  // Deduct for pending approvals
  if (metrics.pendingApproval > 20) score -= 15;
  else if (metrics.pendingApproval > 10) score -= 10;
  else if (metrics.pendingApproval > 5) score -= 5;

  // Deduct for old unapplied credits (high priority)
  if (metrics.unappliedOver30Days > 10) score -= 20;
  else if (metrics.unappliedOver30Days > 5) score -= 10;
  else if (metrics.unappliedOver30Days > 0) score -= 5;

  // Deduct for high-value pending approvals
  if (metrics.highValuePending > 5) score -= 15;
  else if (metrics.highValuePending > 0) score -= 5;

  // Deduct for high credit-to-sales ratio (potential revenue leakage)
  if (metrics.creditToSalesRatio > 10) score -= 15;
  else if (metrics.creditToSalesRatio > 5) score -= 10;

  return Math.max(score, 0);
}

function determineHealthStatus(score: number): 'healthy' | 'warning' | 'critical' {
  if (score >= 80) return 'healthy';
  if (score >= 50) return 'warning';
  return 'critical';
}

// =============================================================================
// 3. SERVICE
// =============================================================================

/**
 * CreditNoteDashboardService — Powers the AR-04 cell dashboard
 */
export class CreditNoteDashboardService {
  constructor(
    private creditNoteRepo: CreditNoteRepositoryPort
  ) {}

  /**
   * Get full dashboard metrics for AR-04
   */
  async getDashboard(actor: ActorContext): Promise<CreditNoteDashboardMetrics> {
    const tenantId = actor.tenantId;

    // Get all metrics in parallel
    const [
      statusCounts,
      applicationStats,
      reasonStats,
      controlStats,
      periodStats,
    ] = await Promise.all([
      this.creditNoteRepo.countByStatus(tenantId),
      this.getApplicationStats(tenantId),
      this.getReasonStats(tenantId),
      this.getControlStats(tenantId),
      this.getPeriodStats(tenantId),
    ]);

    // Calculate derived metrics
    const pendingApproval = statusCounts.find(s => s.status === 'submitted')?.count ?? 0;
    const pendingPosting = statusCounts.find(s => s.status === 'approved')?.count ?? 0;

    const healthScore = calculateHealthScore({
      pendingApproval,
      unappliedOver30Days: controlStats.unappliedOver30Days,
      highValuePending: controlStats.highValuePending,
      creditToSalesRatio: periodStats.creditToSalesRatio,
    });

    return {
      cellCode: 'AR-04',
      cellName: 'Credit Note',

      healthScore,
      healthStatus: determineHealthStatus(healthScore),

      openItems: {
        total: pendingApproval + pendingPosting + applicationStats.unapplied,
        pendingApproval,
        pendingPosting,
        pendingApplication: applicationStats.unapplied,
      },

      creditNoteMetrics: {
        totalCreditNotesThisMonth: periodStats.creditNotesThisMonth,
        totalCreditAmount: periodStats.totalCreditAmount,
        averageCreditValue: periodStats.averageValue,
        creditToSalesRatio: periodStats.creditToSalesRatio,
      },

      applicationStatus: applicationStats,

      byStatus: statusCounts,
      byReason: reasonStats,

      controlHealth: {
        unappliedOver30Days: controlStats.unappliedOver30Days,
        highValuePending: controlStats.highValuePending,
        writeOffRequests: controlStats.writeOffRequests,
      },

      generatedAt: new Date(),
    };
  }

  /**
   * Get summary for AR Manager cluster dashboard
   */
  async getSummary(actor: ActorContext): Promise<CreditNoteCellSummary> {
    const dashboard = await this.getDashboard(actor);

    return {
      code: 'AR-04',
      name: 'Credit Note',
      healthScore: dashboard.healthScore,
      status: dashboard.healthStatus,
      openItems: dashboard.openItems.total,
      keyMetric: {
        label: 'Pending',
        value: dashboard.openItems.pendingApproval,
      },
    };
  }

  /**
   * Get application statistics
   */
  private async getApplicationStats(tenantId: string): Promise<{
    fullyApplied: number;
    partiallyApplied: number;
    unapplied: number;
    totalUnappliedAmount: number;
  }> {
    try {
      return await this.creditNoteRepo.getApplicationStats?.(tenantId) ?? {
        fullyApplied: 0,
        partiallyApplied: 0,
        unapplied: 0,
        totalUnappliedAmount: 0,
      };
    } catch {
      return {
        fullyApplied: 0,
        partiallyApplied: 0,
        unapplied: 0,
        totalUnappliedAmount: 0,
      };
    }
  }

  /**
   * Get reason statistics
   */
  private async getReasonStats(tenantId: string): Promise<ReasonCount[]> {
    try {
      return await this.creditNoteRepo.getReasonStats?.(tenantId) ?? [];
    } catch {
      return [];
    }
  }

  /**
   * Get control statistics
   */
  private async getControlStats(tenantId: string): Promise<{
    unappliedOver30Days: number;
    highValuePending: number;
    writeOffRequests: number;
  }> {
    try {
      const [unapplied, highValue, writeOffs] = await Promise.all([
        this.creditNoteRepo.countUnappliedOver?.(tenantId, 30) ?? Promise.resolve(0),
        this.creditNoteRepo.countHighValuePending?.(tenantId, 10000) ?? Promise.resolve(0),
        this.creditNoteRepo.countWriteOffRequests?.(tenantId) ?? Promise.resolve(0),
      ]);

      return {
        unappliedOver30Days: unapplied,
        highValuePending: highValue,
        writeOffRequests: writeOffs,
      };
    } catch {
      return {
        unappliedOver30Days: 0,
        highValuePending: 0,
        writeOffRequests: 0,
      };
    }
  }

  /**
   * Get period statistics
   */
  private async getPeriodStats(tenantId: string): Promise<{
    creditNotesThisMonth: number;
    totalCreditAmount: number;
    averageValue: number;
    creditToSalesRatio: number;
  }> {
    try {
      return await this.creditNoteRepo.getPeriodStats?.(tenantId) ?? {
        creditNotesThisMonth: 0,
        totalCreditAmount: 0,
        averageValue: 0,
        creditToSalesRatio: 0,
      };
    } catch {
      return {
        creditNotesThisMonth: 0,
        totalCreditAmount: 0,
        averageValue: 0,
        creditToSalesRatio: 0,
      };
    }
  }
}

// =============================================================================
// 4. FACTORY
// =============================================================================

export function createCreditNoteDashboardService(
  creditNoteRepo: CreditNoteRepositoryPort
): CreditNoteDashboardService {
  return new CreditNoteDashboardService(creditNoteRepo);
}
