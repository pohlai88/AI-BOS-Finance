/**
 * GL-03 Posting Engine — Dashboard Service
 * 
 * Provides posting metrics and insights for GL management.
 * 
 * @module GL-03
 */

// =============================================================================
// Types
// =============================================================================

export interface PostingDashboardMetrics {
  // Daily posting summary
  todayPostings: number;
  todayTotalDebit: string;
  todayTotalCredit: string;
  
  // Period summary
  currentPeriodPostings: number;
  currentPeriodTotalDebit: string;
  currentPeriodTotalCredit: string;
  
  // By source type
  bySourceType: Record<string, {
    count: number;
    totalDebit: string;
    totalCredit: string;
  }>;
  
  // Reversals
  reversalsToday: number;
  reversalsThisPeriod: number;
  
  // Pending
  pendingAutoReverse: number;
  
  // Health
  failedPostingsLast24h: number;
  averagePostingLatencyMs: number;
}

export interface PostingTrend {
  date: string;
  postings: number;
  totalDebit: string;
  totalCredit: string;
}

export interface PostingDashboardRepositoryPort {
  getTodaySummary(tenantId: string, companyId?: string): Promise<{
    count: number;
    totalDebit: string;
    totalCredit: string;
  }>;
  getPeriodSummary(tenantId: string, periodCode: string): Promise<{
    count: number;
    totalDebit: string;
    totalCredit: string;
  }>;
  getBySourceType(tenantId: string, companyId?: string, days?: number): Promise<Record<string, {
    count: number;
    totalDebit: string;
    totalCredit: string;
  }>>;
  getReversalCounts(tenantId: string, companyId?: string): Promise<{
    today: number;
    thisPeriod: number;
  }>;
  getPendingAutoReverse(tenantId: string): Promise<number>;
  getFailedPostings(tenantId: string, hours: number): Promise<number>;
  getAverageLatency(tenantId: string, hours: number): Promise<number>;
  getPostingTrend(tenantId: string, companyId: string, days: number): Promise<PostingTrend[]>;
}

export interface PostingDashboardServiceDeps {
  repository: PostingDashboardRepositoryPort;
}

// =============================================================================
// Dashboard Service
// =============================================================================

export class PostingDashboardService {
  private readonly repository: PostingDashboardRepositoryPort;

  constructor(deps: PostingDashboardServiceDeps) {
    this.repository = deps.repository;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GET DASHBOARD METRICS
  // ═══════════════════════════════════════════════════════════════════════════

  async getDashboardMetrics(
    tenantId: string,
    companyId?: string,
    periodCode?: string
  ): Promise<PostingDashboardMetrics> {
    const currentPeriod = periodCode || this.getCurrentPeriodCode();

    const [
      todaySummary,
      periodSummary,
      bySourceType,
      reversalCounts,
      pendingAutoReverse,
      failedPostings,
      averageLatency,
    ] = await Promise.all([
      this.repository.getTodaySummary(tenantId, companyId),
      this.repository.getPeriodSummary(tenantId, currentPeriod),
      this.repository.getBySourceType(tenantId, companyId, 30),
      this.repository.getReversalCounts(tenantId, companyId),
      this.repository.getPendingAutoReverse(tenantId),
      this.repository.getFailedPostings(tenantId, 24),
      this.repository.getAverageLatency(tenantId, 24),
    ]);

    return {
      todayPostings: todaySummary.count,
      todayTotalDebit: todaySummary.totalDebit,
      todayTotalCredit: todaySummary.totalCredit,
      currentPeriodPostings: periodSummary.count,
      currentPeriodTotalDebit: periodSummary.totalDebit,
      currentPeriodTotalCredit: periodSummary.totalCredit,
      bySourceType,
      reversalsToday: reversalCounts.today,
      reversalsThisPeriod: reversalCounts.thisPeriod,
      pendingAutoReverse,
      failedPostingsLast24h: failedPostings,
      averagePostingLatencyMs: averageLatency,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GET POSTING TREND
  // ═══════════════════════════════════════════════════════════════════════════

  async getPostingTrend(
    tenantId: string,
    companyId: string,
    days: number = 30
  ): Promise<PostingTrend[]> {
    return this.repository.getPostingTrend(tenantId, companyId, days);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  private getCurrentPeriodCode(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  }
}
