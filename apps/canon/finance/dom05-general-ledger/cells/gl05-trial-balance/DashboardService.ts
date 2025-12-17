/**
 * GL-05 Trial Balance — Dashboard Service
 * 
 * Provides trial balance metrics and insights.
 * 
 * @module GL-05
 */

// =============================================================================
// Types
// =============================================================================

export interface TBDashboardMetrics {
  // Current period
  currentPeriodTB?: {
    periodCode: string;
    totalDebit: string;
    totalCredit: string;
    isBalanced: boolean;
    accountCount: number;
  };
  
  // Snapshot status
  totalSnapshots: number;
  lastSnapshotDate?: Date;
  lastSnapshotPeriod?: string;
  
  // Verification
  verificationsToday: number;
  hashMismatchesEver: number;
  
  // By account type
  balancesByType: Record<string, { debit: string; credit: string }>;
  
  // Variance alerts
  significantVariances: number;  // > 10% change from prior period
}

export interface TBTrendItem {
  periodCode: string;
  totalDebit: string;
  totalCredit: string;
  accountCount: number;
}

export interface TBDashboardRepositoryPort {
  getCurrentPeriodSummary(tenantId: string, companyId: string): Promise<{
    periodCode: string;
    totalDebit: string;
    totalCredit: string;
    isBalanced: boolean;
    accountCount: number;
  } | null>;
  getSnapshotStats(tenantId: string, companyId: string): Promise<{
    total: number;
    lastDate: Date | null;
    lastPeriod: string | null;
  }>;
  getVerificationStats(tenantId: string): Promise<{
    today: number;
    mismatchesEver: number;
  }>;
  getBalancesByType(tenantId: string, companyId: string, periodCode: string): Promise<Record<string, { debit: string; credit: string }>>;
  getSignificantVariances(tenantId: string, companyId: string, threshold: number): Promise<number>;
  getTBTrend(tenantId: string, companyId: string, periods: number): Promise<TBTrendItem[]>;
}

export interface TBDashboardServiceDeps {
  repository: TBDashboardRepositoryPort;
}

// =============================================================================
// Dashboard Service
// =============================================================================

export class TBDashboardService {
  private readonly repository: TBDashboardRepositoryPort;

  constructor(deps: TBDashboardServiceDeps) {
    this.repository = deps.repository;
  }

  async getDashboardMetrics(
    tenantId: string,
    companyId: string
  ): Promise<TBDashboardMetrics> {
    const [currentPeriod, snapshotStats, verificationStats] = await Promise.all([
      this.repository.getCurrentPeriodSummary(tenantId, companyId),
      this.repository.getSnapshotStats(tenantId, companyId),
      this.repository.getVerificationStats(tenantId),
    ]);

    const periodCode = currentPeriod?.periodCode || this.getCurrentPeriodCode();

    const [balancesByType, significantVariances] = await Promise.all([
      this.repository.getBalancesByType(tenantId, companyId, periodCode),
      this.repository.getSignificantVariances(tenantId, companyId, 10),  // 10% threshold
    ]);

    return {
      currentPeriodTB: currentPeriod || undefined,
      totalSnapshots: snapshotStats.total,
      lastSnapshotDate: snapshotStats.lastDate || undefined,
      lastSnapshotPeriod: snapshotStats.lastPeriod || undefined,
      verificationsToday: verificationStats.today,
      hashMismatchesEver: verificationStats.mismatchesEver,
      balancesByType,
      significantVariances,
    };
  }

  async getTBTrend(
    tenantId: string,
    companyId: string,
    periods: number = 12
  ): Promise<TBTrendItem[]> {
    return this.repository.getTBTrend(tenantId, companyId, periods);
  }

  private getCurrentPeriodCode(): string {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  }
}
