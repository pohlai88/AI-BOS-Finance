/**
 * TR-05 Bank Reconciliation - Dashboard Service
 * 
 * Provides cell-level metrics for the Bank Reconciliation cell.
 * 
 * @module TR-05
 */

import type {
  ReconciliationRepositoryPort,
  ReconciliationStatus,
  ActorContext,
} from './types';

// =============================================================================
// TYPES
// =============================================================================

export interface ReconciliationMetricsByStatus {
  draft: number;
  in_progress: number;
  reconciled: number;
  adjusted: number;
  finalized: number;
  exception: number;
  cancelled: number;
}

export interface ReconciliationMetricsByBankAccount {
  bankAccountId: string;
  bankAccountName: string;
  totalStatements: number;
  finalizedStatements: number;
  pendingStatements: number;
  exceptionStatements: number;
  lastReconciledDate?: Date;
}

export interface OutstandingItemsMetrics {
  totalUnmatched: number;
  unmatchedByAge: {
    '0-7 days': number;
    '8-30 days': number;
    '31-90 days': number;
    '90+ days': number;
  };
  averageAgingDays: number;
}

export interface ReconciliationDashboardMetrics {
  // Summary
  totalStatements: number;
  finalizedStatements: number;
  pendingStatements: number;
  exceptionStatements: number;
  
  // Health
  healthScore: number;
  status: 'healthy' | 'warning' | 'critical';
  
  // Breakdowns
  byStatus: ReconciliationMetricsByStatus;
  byBankAccount: ReconciliationMetricsByBankAccount[];
  
  // Outstanding Items
  outstandingItems: OutstandingItemsMetrics;
  
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

export class ReconciliationDashboardService {
  constructor(
    private readonly repository: ReconciliationRepositoryPort
  ) {}

  async getDashboard(actor: ActorContext): Promise<ReconciliationDashboardMetrics> {
    // Fetch all statements for metrics
    const { data: statements, total } = await this.repository.listStatements(
      { tenantId: actor.tenantId },
      1000,
      0
    );

    // Calculate by status
    const byStatus: ReconciliationMetricsByStatus = {
      draft: 0,
      in_progress: 0,
      reconciled: 0,
      adjusted: 0,
      finalized: 0,
      exception: 0,
      cancelled: 0,
    };

    // Calculate by bank account
    const bankAccountMap = new Map<string, {
      bankAccountName: string;
      totalStatements: number;
      finalizedStatements: number;
      pendingStatements: number;
      exceptionStatements: number;
      lastReconciledDate?: Date;
    }>();

    for (const statement of statements) {
      // By status
      byStatus[statement.status]++;

      // By bank account
      const account = bankAccountMap.get(statement.bankAccountId) || {
        bankAccountName: statement.bankAccountId, // Would fetch actual name
        totalStatements: 0,
        finalizedStatements: 0,
        pendingStatements: 0,
        exceptionStatements: 0,
      };
      
      account.totalStatements++;
      if (statement.status === 'finalized') {
        account.finalizedStatements++;
        if (!account.lastReconciledDate || statement.finalizedAt! > account.lastReconciledDate) {
          account.lastReconciledDate = statement.finalizedAt!;
        }
      } else if (statement.status === 'draft' || statement.status === 'in_progress' || statement.status === 'reconciled') {
        account.pendingStatements++;
      } else if (statement.status === 'exception') {
        account.exceptionStatements++;
      }
      
      bankAccountMap.set(statement.bankAccountId, account);
    }

    const byBankAccount: ReconciliationMetricsByBankAccount[] = Array.from(bankAccountMap.entries())
      .map(([bankAccountId, data]) => ({
        bankAccountId,
        ...data,
      }))
      .sort((a, b) => b.totalStatements - a.totalStatements);

    // Calculate outstanding items (simplified - would need to query statement items)
    const outstandingItems: OutstandingItemsMetrics = {
      totalUnmatched: statements.reduce((sum, s) => sum + s.unmatchedItems, 0),
      unmatchedByAge: {
        '0-7 days': 0,
        '8-30 days': 0,
        '31-90 days': 0,
        '90+ days': 0,
      },
      averageAgingDays: 0, // Would calculate from actual unmatched items
    };

    // Calculate health score
    const finalizedRatio = total > 0 ? byStatus.finalized / total : 0;
    const exceptionRatio = total > 0 ? byStatus.exception / total : 0;
    const pendingRatio = total > 0 ? (byStatus.draft + byStatus.in_progress + byStatus.reconciled) / total : 0;

    let healthScore = 100;
    healthScore -= exceptionRatio * 40;  // -40 for all exceptions
    healthScore -= pendingRatio * 20;    // -20 for all pending
    healthScore -= (outstandingItems.totalUnmatched > 50 ? 15 : 0);  // Large backlog

    healthScore = Math.max(0, Math.min(100, healthScore));

    const status = healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'warning' : 'critical';

    // Generate alerts
    const alerts: ReconciliationDashboardMetrics['alerts'] = [];

    if (byStatus.exception > 0) {
      alerts.push({
        severity: 'error',
        message: 'Reconciliations with exceptions',
        count: byStatus.exception,
      });
    }

    if (byStatus.in_progress > 10) {
      alerts.push({
        severity: 'warning',
        message: 'Many reconciliations in progress',
        count: byStatus.in_progress,
      });
    }

    if (outstandingItems.totalUnmatched > 100) {
      alerts.push({
        severity: 'warning',
        message: 'High number of unmatched items',
        count: outstandingItems.totalUnmatched,
      });
    }

    if (byStatus.draft > 5) {
      alerts.push({
        severity: 'info',
        message: 'Statements pending reconciliation',
        count: byStatus.draft,
      });
    }

    return {
      totalStatements: total,
      finalizedStatements: byStatus.finalized,
      pendingStatements: byStatus.draft + byStatus.in_progress + byStatus.reconciled,
      exceptionStatements: byStatus.exception,
      healthScore: Math.round(healthScore),
      status,
      byStatus,
      byBankAccount,
      outstandingItems,
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

export function createReconciliationDashboardService(
  repository: ReconciliationRepositoryPort
): ReconciliationDashboardService {
  return new ReconciliationDashboardService(repository);
}
