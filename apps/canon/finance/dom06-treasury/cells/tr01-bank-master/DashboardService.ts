/**
 * TR-01 Bank Master - Dashboard Service
 * 
 * Provides cell-level metrics for the Bank Master cell.
 * 
 * @module TR-01
 */

import type { BankAccountRepositoryPort, BankAccountStatus, ActorContext } from './types';

// =============================================================================
// TYPES
// =============================================================================

export interface BankAccountMetricsByStatus {
  draft: number;
  verification: number;
  active: number;
  suspended: number;
  inactive: number;
  rejected: number;
  cancelled: number;
}

export interface BankAccountMetricsByType {
  checking: number;
  savings: number;
  payroll: number;
  lockbox: number;
  sweep: number;
  imprest: number;
}

export interface BankAccountMetricsByCurrency {
  currency: string;
  count: number;
  activeCount: number;
}

export interface RecentActivity {
  id: string;
  action: string;
  bankName: string;
  accountNumberLast4: string;
  timestamp: Date;
  userId: string;
}

export interface BankMasterDashboardMetrics {
  // Summary
  totalAccounts: number;
  activeAccounts: number;
  pendingVerification: number;
  suspendedAccounts: number;
  
  // Health
  healthScore: number;
  status: 'healthy' | 'warning' | 'critical';
  
  // Breakdowns
  byStatus: BankAccountMetricsByStatus;
  byType: BankAccountMetricsByType;
  byCurrency: BankAccountMetricsByCurrency[];
  
  // Recent Activity
  recentActivity: RecentActivity[];
  
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

export class BankMasterDashboardService {
  constructor(
    private readonly repository: BankAccountRepositoryPort
  ) {}

  async getDashboard(actor: ActorContext): Promise<BankMasterDashboardMetrics> {
    // Fetch all accounts for metrics
    const { data: accounts, total } = await this.repository.findByFilter(
      { tenantId: actor.tenantId },
      1000,
      0
    );

    // Calculate by status
    const byStatus: BankAccountMetricsByStatus = {
      draft: 0,
      verification: 0,
      active: 0,
      suspended: 0,
      inactive: 0,
      rejected: 0,
      cancelled: 0,
    };

    // Calculate by type
    const byType: BankAccountMetricsByType = {
      checking: 0,
      savings: 0,
      payroll: 0,
      lockbox: 0,
      sweep: 0,
      imprest: 0,
    };

    // Calculate by currency
    const currencyMap = new Map<string, { count: number; activeCount: number }>();

    for (const account of accounts) {
      // By status
      byStatus[account.status]++;

      // By type
      byType[account.accountType]++;

      // By currency
      const curr = currencyMap.get(account.currency) || { count: 0, activeCount: 0 };
      curr.count++;
      if (account.status === 'active') curr.activeCount++;
      currencyMap.set(account.currency, curr);
    }

    const byCurrency: BankAccountMetricsByCurrency[] = Array.from(currencyMap.entries())
      .map(([currency, data]) => ({ currency, ...data }))
      .sort((a, b) => b.count - a.count);

    // Calculate health score
    const activeRatio = total > 0 ? byStatus.active / total : 0;
    const suspendedRatio = total > 0 ? byStatus.suspended / total : 0;
    const rejectedRatio = total > 0 ? byStatus.rejected / total : 0;

    let healthScore = 100;
    healthScore -= suspendedRatio * 30;  // -30 for all suspended
    healthScore -= rejectedRatio * 20;   // -20 for all rejected
    healthScore -= (byStatus.verification > 5 ? 10 : 0);  // Pending verification backlog

    healthScore = Math.max(0, Math.min(100, healthScore));

    const status = healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'warning' : 'critical';

    // Generate alerts
    const alerts: BankMasterDashboardMetrics['alerts'] = [];

    if (byStatus.suspended > 0) {
      alerts.push({
        severity: 'warning',
        message: 'Bank accounts suspended',
        count: byStatus.suspended,
      });
    }

    if (byStatus.verification > 3) {
      alerts.push({
        severity: 'info',
        message: 'Accounts pending verification',
        count: byStatus.verification,
      });
    }

    if (byStatus.rejected > 0) {
      alerts.push({
        severity: 'error',
        message: 'Accounts with failed verification',
        count: byStatus.rejected,
      });
    }

    return {
      totalAccounts: total,
      activeAccounts: byStatus.active,
      pendingVerification: byStatus.verification,
      suspendedAccounts: byStatus.suspended,
      healthScore: Math.round(healthScore),
      status,
      byStatus,
      byType,
      byCurrency,
      recentActivity: [], // Would come from audit log
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

export function createBankMasterDashboardService(
  repository: BankAccountRepositoryPort
): BankMasterDashboardService {
  return new BankMasterDashboardService(repository);
}
