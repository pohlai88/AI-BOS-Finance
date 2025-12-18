/**
 * TR-02 Cash Pooling - Dashboard Service
 * 
 * Provides cell-level metrics for the Cash Pooling cell.
 * 
 * @module TR-02
 */

import type {
  CashPoolRepositoryPort,
  CashPoolStatus,
  ActorContext,
} from './types';

// =============================================================================
// TYPES
// =============================================================================

export interface CashPoolMetricsByStatus {
  draft: number;
  active: number;
  suspended: number;
  inactive: number;
  cancelled: number;
}

export interface CashPoolMetricsByType {
  physical: number;
  notional: number;
  zero_balance: number;
}

export interface SweepMetrics {
  totalSweeps: number;
  successfulSweeps: number;
  failedSweeps: number;
  totalAmount: { amount: string; currency: string };
  averageSweepAmount: { amount: string; currency: string };
}

export interface CashPoolingDashboardMetrics {
  // Summary
  totalPools: number;
  activePools: number;
  suspendedPools: number;
  
  // Health
  healthScore: number;
  status: 'healthy' | 'warning' | 'critical';
  
  // Breakdowns
  byStatus: CashPoolMetricsByStatus;
  byType: CashPoolMetricsByType;
  
  // Sweep Metrics
  sweepMetrics: SweepMetrics;
  
  // Alerts
  alerts: Array<{
    severity: 'info' | 'warning' | 'error';
    message: string;
    count?: number;
  }>;
  
  // Metadata
  generatedAt: Date;
}

// =============================================================================
// SERVICE
// =============================================================================

export class CashPoolingDashboardService {
  constructor(
    private readonly repository: CashPoolRepositoryPort
  ) {}

  async getDashboard(actor: ActorContext): Promise<CashPoolingDashboardMetrics> {
    // Fetch all pools for metrics
    const { data: pools, total } = await this.repository.list(
      { tenantId: actor.tenantId },
      1000,
      0
    );

    // Calculate by status
    const byStatus: CashPoolMetricsByStatus = {
      draft: 0,
      active: 0,
      suspended: 0,
      inactive: 0,
      cancelled: 0,
    };

    // Calculate by type
    const byType: CashPoolMetricsByType = {
      physical: 0,
      notional: 0,
      zero_balance: 0,
    };

    // Calculate sweep metrics
    let totalSweeps = 0;
    let successfulSweeps = 0;
    let failedSweeps = 0;
    const sweepAmounts: Array<{ amount: string; currency: string }> = [];

    for (const pool of pools) {
      // By status
      byStatus[pool.status]++;

      // By type
      byType[pool.poolType]++;

      // Get sweeps for this pool
      const sweeps = await this.repository.findSweepsByPool(pool.id);
      totalSweeps += sweeps.length;
      successfulSweeps += sweeps.filter(s => s.status === 'executed').length;
      failedSweeps += sweeps.filter(s => s.status === 'failed').length;
      sweepAmounts.push(...sweeps.map(s => s.amount));
    }

    // Calculate total and average sweep amounts
    const totalAmount = sweepAmounts.reduce(
      (sum, a) => {
        if (sum.currency === a.currency) {
          return { amount: String(parseFloat(sum.amount) + parseFloat(a.amount)), currency: sum.currency };
        }
        return sum;
      },
      { amount: '0', currency: sweepAmounts[0]?.currency || 'USD' }
    );

    const averageSweepAmount = totalSweeps > 0
      ? { amount: String(parseFloat(totalAmount.amount) / totalSweeps), currency: totalAmount.currency }
      : { amount: '0', currency: totalAmount.currency };

    // Calculate health score
    const activeRatio = total > 0 ? byStatus.active / total : 0;
    const suspendedRatio = total > 0 ? byStatus.suspended / total : 0;
    const failureRate = totalSweeps > 0 ? failedSweeps / totalSweeps : 0;

    let healthScore = 100;
    healthScore -= suspendedRatio * 30;
    healthScore -= failureRate * 40;
    healthScore -= (byStatus.draft > 3 ? 10 : 0);

    healthScore = Math.max(0, Math.min(100, healthScore));

    const status = healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'warning' : 'critical';

    // Generate alerts
    const alerts: CashPoolingDashboardMetrics['alerts'] = [];

    if (byStatus.suspended > 0) {
      alerts.push({
        severity: 'warning',
        message: 'Cash pools suspended',
        count: byStatus.suspended,
      });
    }

    if (failedSweeps > 0) {
      alerts.push({
        severity: 'error',
        message: 'Failed sweeps detected',
        count: failedSweeps,
      });
    }

    if (byStatus.draft > 2) {
      alerts.push({
        severity: 'info',
        message: 'Pools pending activation',
        count: byStatus.draft,
      });
    }

    return {
      totalPools: total,
      activePools: byStatus.active,
      suspendedPools: byStatus.suspended,
      healthScore: Math.round(healthScore),
      status,
      byStatus,
      byType,
      sweepMetrics: {
        totalSweeps,
        successfulSweeps,
        failedSweeps,
        totalAmount,
        averageSweepAmount,
      },
      alerts,
      generatedAt: new Date(),
    };
  }

  async getHealthScore(actor: ActorContext): Promise<{ score: number; status: string }> {
    const dashboard = await this.getDashboard(actor);
    return { score: dashboard.healthScore, status: dashboard.status };
  }
}

// =============================================================================
// FACTORY
// =============================================================================

export function createCashPoolingDashboardService(
  repository: CashPoolRepositoryPort
): CashPoolingDashboardService {
  return new CashPoolingDashboardService(repository);
}
