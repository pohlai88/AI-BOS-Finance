/**
 * Receipt Dashboard Service
 * 
 * AR-03 Receipt Processing Cell — Dashboard metrics and aggregations.
 * 
 * Responsibilities:
 * - Provide receipt health metrics
 * - Unallocated receipt tracking
 * - Allocation rate monitoring
 * - Bank reconciliation status
 * 
 * Powers the AR-03 cell dashboard in the AR Manager.
 * 
 * @module AR-03
 */

import type {
  ReceiptRepositoryPort,
  ReceiptStatus,
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
 * Receipt dashboard metrics
 */
export interface ReceiptDashboardMetrics {
  /** Cell identity */
  cellCode: 'AR-03';
  cellName: 'Receipt Processing';

  /** Health score (0-100) */
  healthScore: number;
  healthStatus: 'healthy' | 'warning' | 'critical';

  /** Work queue */
  openItems: {
    total: number;
    pendingApproval: number;
    pendingAllocation: number;
    pendingPosting: number;
  };

  /** Receipt metrics */
  receiptMetrics: {
    totalReceiptsThisMonth: number;
    totalAmountCollected: number;
    averageReceiptValue: number;
    collectionRate: number; // % of due invoices collected
  };

  /** Allocation status */
  allocationStatus: {
    fullyAllocated: number;
    partiallyAllocated: number;
    unallocated: number;
    totalUnallocatedAmount: number;
  };

  /** Status distribution */
  byStatus: StatusCount[];

  /** Control health */
  controlHealth: {
    unallocatedOver7Days: number;
    bankReconciliationStatus: 'current' | 'pending' | 'overdue';
    duplicatePayments: number;
  };

  generatedAt: Date;
}

interface StatusCount {
  status: ReceiptStatus;
  count: number;
}

/**
 * Receipt cell summary (for AR Manager)
 */
export interface ReceiptCellSummary {
  code: 'AR-03';
  name: 'Receipt Processing';
  healthScore: number;
  status: 'healthy' | 'warning' | 'critical';
  openItems: number;
  keyMetric: { label: string; value: number | string };
}

// =============================================================================
// 2. HELPER FUNCTIONS
// =============================================================================

function calculateHealthScore(metrics: {
  pendingAllocation: number;
  unallocatedOver7Days: number;
  duplicatePayments: number;
  bankReconciliationStatus: 'current' | 'pending' | 'overdue';
}): number {
  let score = 100;

  // Deduct for pending allocations
  if (metrics.pendingAllocation > 50) score -= 15;
  else if (metrics.pendingAllocation > 20) score -= 10;
  else if (metrics.pendingAllocation > 10) score -= 5;

  // Deduct for old unallocated receipts (high priority)
  if (metrics.unallocatedOver7Days > 10) score -= 25;
  else if (metrics.unallocatedOver7Days > 5) score -= 15;
  else if (metrics.unallocatedOver7Days > 0) score -= 5;

  // Deduct for duplicate payments
  if (metrics.duplicatePayments > 0) score -= 10;

  // Deduct for bank reconciliation status
  if (metrics.bankReconciliationStatus === 'overdue') score -= 15;
  else if (metrics.bankReconciliationStatus === 'pending') score -= 5;

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
 * ReceiptDashboardService — Powers the AR-03 cell dashboard
 */
export class ReceiptDashboardService {
  constructor(
    private receiptRepo: ReceiptRepositoryPort
  ) {}

  /**
   * Get full dashboard metrics for AR-03
   */
  async getDashboard(actor: ActorContext): Promise<ReceiptDashboardMetrics> {
    const tenantId = actor.tenantId;

    // Get all metrics in parallel
    const [
      statusCounts,
      allocationStats,
      controlStats,
      periodStats,
    ] = await Promise.all([
      this.receiptRepo.countByStatus(tenantId),
      this.getAllocationStats(tenantId),
      this.getControlStats(tenantId),
      this.getPeriodStats(tenantId),
    ]);

    // Calculate derived metrics
    const pendingApproval = statusCounts.find(s => s.status === 'submitted')?.count ?? 0;
    const pendingPosting = statusCounts.find(s => s.status === 'approved')?.count ?? 0;

    const healthScore = calculateHealthScore({
      pendingAllocation: allocationStats.unallocated,
      unallocatedOver7Days: controlStats.unallocatedOver7Days,
      duplicatePayments: controlStats.duplicatePayments,
      bankReconciliationStatus: controlStats.bankReconciliationStatus,
    });

    return {
      cellCode: 'AR-03',
      cellName: 'Receipt Processing',

      healthScore,
      healthStatus: determineHealthStatus(healthScore),

      openItems: {
        total: pendingApproval + allocationStats.unallocated + pendingPosting,
        pendingApproval,
        pendingAllocation: allocationStats.unallocated,
        pendingPosting,
      },

      receiptMetrics: {
        totalReceiptsThisMonth: periodStats.receiptsThisMonth,
        totalAmountCollected: periodStats.amountCollected,
        averageReceiptValue: periodStats.averageValue,
        collectionRate: periodStats.collectionRate,
      },

      allocationStatus: allocationStats,

      byStatus: statusCounts,

      controlHealth: {
        unallocatedOver7Days: controlStats.unallocatedOver7Days,
        bankReconciliationStatus: controlStats.bankReconciliationStatus,
        duplicatePayments: controlStats.duplicatePayments,
      },

      generatedAt: new Date(),
    };
  }

  /**
   * Get summary for AR Manager cluster dashboard
   */
  async getSummary(actor: ActorContext): Promise<ReceiptCellSummary> {
    const dashboard = await this.getDashboard(actor);

    return {
      code: 'AR-03',
      name: 'Receipt Processing',
      healthScore: dashboard.healthScore,
      status: dashboard.healthStatus,
      openItems: dashboard.openItems.total,
      keyMetric: {
        label: 'Unallocated',
        value: `$${(dashboard.allocationStatus.totalUnallocatedAmount / 1000).toFixed(0)}K`,
      },
    };
  }

  /**
   * Get allocation statistics
   */
  private async getAllocationStats(tenantId: string): Promise<{
    fullyAllocated: number;
    partiallyAllocated: number;
    unallocated: number;
    totalUnallocatedAmount: number;
  }> {
    try {
      return await this.receiptRepo.getAllocationStats?.(tenantId) ?? {
        fullyAllocated: 0,
        partiallyAllocated: 0,
        unallocated: 0,
        totalUnallocatedAmount: 0,
      };
    } catch {
      return {
        fullyAllocated: 0,
        partiallyAllocated: 0,
        unallocated: 0,
        totalUnallocatedAmount: 0,
      };
    }
  }

  /**
   * Get control statistics
   */
  private async getControlStats(tenantId: string): Promise<{
    unallocatedOver7Days: number;
    bankReconciliationStatus: 'current' | 'pending' | 'overdue';
    duplicatePayments: number;
  }> {
    try {
      const [unallocated, duplicates] = await Promise.all([
        this.receiptRepo.countUnallocatedOver?.(tenantId, 7) ?? Promise.resolve(0),
        this.receiptRepo.countDuplicatePayments?.(tenantId) ?? Promise.resolve(0),
      ]);

      return {
        unallocatedOver7Days: unallocated,
        bankReconciliationStatus: 'current', // TODO: Get from actual reconciliation
        duplicatePayments: duplicates,
      };
    } catch {
      return {
        unallocatedOver7Days: 0,
        bankReconciliationStatus: 'current',
        duplicatePayments: 0,
      };
    }
  }

  /**
   * Get period statistics
   */
  private async getPeriodStats(tenantId: string): Promise<{
    receiptsThisMonth: number;
    amountCollected: number;
    averageValue: number;
    collectionRate: number;
  }> {
    try {
      return await this.receiptRepo.getPeriodStats?.(tenantId) ?? {
        receiptsThisMonth: 0,
        amountCollected: 0,
        averageValue: 0,
        collectionRate: 0,
      };
    } catch {
      return {
        receiptsThisMonth: 0,
        amountCollected: 0,
        averageValue: 0,
        collectionRate: 0,
      };
    }
  }
}

// =============================================================================
// 4. FACTORY
// =============================================================================

export function createReceiptDashboardService(
  receiptRepo: ReceiptRepositoryPort
): ReceiptDashboardService {
  return new ReceiptDashboardService(receiptRepo);
}
