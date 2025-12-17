/**
 * GL-02 Journal Entry — Dashboard Service
 * 
 * Provides journal entry metrics and insights for GL management.
 * 
 * @module GL-02
 */

import { JournalEntryStatus, JournalEntryType } from './types';

// =============================================================================
// Types
// =============================================================================

export interface JEDashboardMetrics {
  // Summary counts
  totalEntries: number;
  draftCount: number;
  submittedCount: number;
  approvedCount: number;
  postedCount: number;
  rejectedCount: number;
  
  // By type
  byType: Record<JournalEntryType, number>;
  
  // By status
  byStatus: Record<JournalEntryStatus, number>;
  
  // Pending actions
  pendingMyApproval: number;
  pendingSubmission: number;
  
  // Amounts (current period)
  periodTotalDebit: string;
  periodTotalCredit: string;
  
  // Activity
  createdToday: number;
  createdThisWeek: number;
  
  // Health
  rejectionRate: number;  // Percentage
  averageApprovalTime: number;  // Hours
}

export interface JEAgeingBucket {
  range: string;  // "0-7 days", "8-14 days", etc.
  count: number;
  totalAmount: string;
}

export interface JEDashboardRepositoryPort {
  getTotalCounts(tenantId: string, companyId?: string): Promise<{
    total: number;
    draft: number;
    submitted: number;
    approved: number;
    posted: number;
    rejected: number;
  }>;
  getCountsByType(tenantId: string, companyId?: string): Promise<Record<JournalEntryType, number>>;
  getCountsByStatus(tenantId: string, companyId?: string): Promise<Record<JournalEntryStatus, number>>;
  getPendingMyApproval(tenantId: string, userId: string): Promise<number>;
  getPendingSubmission(tenantId: string, userId: string): Promise<number>;
  getPeriodTotals(tenantId: string, companyId: string, periodCode: string): Promise<{
    totalDebit: string;
    totalCredit: string;
  }>;
  getRecentActivity(tenantId: string, companyId?: string): Promise<{
    today: number;
    thisWeek: number;
  }>;
  getRejectionRate(tenantId: string, companyId?: string, days?: number): Promise<number>;
  getAverageApprovalTime(tenantId: string, companyId?: string, days?: number): Promise<number>;
  getSubmittedAgeing(tenantId: string, companyId?: string): Promise<JEAgeingBucket[]>;
}

export interface JEDashboardServiceDeps {
  repository: JEDashboardRepositoryPort;
}

// =============================================================================
// Dashboard Service
// =============================================================================

export class JEDashboardService {
  private readonly repository: JEDashboardRepositoryPort;

  constructor(deps: JEDashboardServiceDeps) {
    this.repository = deps.repository;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GET DASHBOARD METRICS
  // ═══════════════════════════════════════════════════════════════════════════

  async getDashboardMetrics(
    tenantId: string,
    userId: string,
    companyId?: string,
    periodCode?: string
  ): Promise<JEDashboardMetrics> {
    const currentPeriod = periodCode || this.getCurrentPeriodCode();

    const [
      totalCounts,
      byType,
      byStatus,
      pendingMyApproval,
      pendingSubmission,
      periodTotals,
      recentActivity,
      rejectionRate,
      averageApprovalTime,
    ] = await Promise.all([
      this.repository.getTotalCounts(tenantId, companyId),
      this.repository.getCountsByType(tenantId, companyId),
      this.repository.getCountsByStatus(tenantId, companyId),
      this.repository.getPendingMyApproval(tenantId, userId),
      this.repository.getPendingSubmission(tenantId, userId),
      this.repository.getPeriodTotals(tenantId, companyId || '', currentPeriod),
      this.repository.getRecentActivity(tenantId, companyId),
      this.repository.getRejectionRate(tenantId, companyId, 30),
      this.repository.getAverageApprovalTime(tenantId, companyId, 30),
    ]);

    return {
      totalEntries: totalCounts.total,
      draftCount: totalCounts.draft,
      submittedCount: totalCounts.submitted,
      approvedCount: totalCounts.approved,
      postedCount: totalCounts.posted,
      rejectedCount: totalCounts.rejected,
      byType,
      byStatus,
      pendingMyApproval,
      pendingSubmission,
      periodTotalDebit: periodTotals.totalDebit,
      periodTotalCredit: periodTotals.totalCredit,
      createdToday: recentActivity.today,
      createdThisWeek: recentActivity.thisWeek,
      rejectionRate,
      averageApprovalTime,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GET SUBMITTED AGEING
  // ═══════════════════════════════════════════════════════════════════════════

  async getSubmittedAgeing(
    tenantId: string,
    companyId?: string
  ): Promise<JEAgeingBucket[]> {
    return this.repository.getSubmittedAgeing(tenantId, companyId);
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
