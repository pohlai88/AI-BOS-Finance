/**
 * GL-04 Period Close — Dashboard Service
 * 
 * Provides period close metrics and insights.
 * 
 * @module GL-04
 */

import type { PeriodStatus } from './PeriodCloseService';

// =============================================================================
// Types
// =============================================================================

export interface PeriodCloseDashboardMetrics {
  // Current period status
  currentPeriod: string;
  currentPeriodStatus: PeriodStatus;
  daysRemaining: number;
  
  // Period summary
  openPeriods: number;
  softClosedPeriods: number;
  hardClosedPeriods: number;
  
  // Checklist progress
  checklistTotal: number;
  checklistCompleted: number;
  checklistBlocking: number;
  
  // Pending items
  pendingEntries: number;
  pendingApprovals: number;
  
  // Historical
  averageCloseTime: number;  // Days
  lastCloseDate?: Date;
}

export interface PeriodCalendarItem {
  periodCode: string;
  startDate: Date;
  endDate: Date;
  status: PeriodStatus;
  closedAt?: Date;
}

export interface PeriodCloseDashboardRepositoryPort {
  getCurrentPeriodInfo(tenantId: string, companyId: string): Promise<{
    periodCode: string;
    status: PeriodStatus;
    endDate: Date;
  } | null>;
  getPeriodCounts(tenantId: string, companyId: string): Promise<{
    open: number;
    softClosed: number;
    hardClosed: number;
  }>;
  getChecklistProgress(periodId: string): Promise<{
    total: number;
    completed: number;
    blocking: number;
  }>;
  getPendingItems(tenantId: string, periodCode: string): Promise<{
    entries: number;
    approvals: number;
  }>;
  getHistoricalMetrics(tenantId: string, companyId: string): Promise<{
    averageCloseTime: number;
    lastCloseDate: Date | null;
  }>;
  getPeriodCalendar(tenantId: string, companyId: string, year: number): Promise<PeriodCalendarItem[]>;
}

export interface PeriodCloseDashboardServiceDeps {
  repository: PeriodCloseDashboardRepositoryPort;
}

// =============================================================================
// Dashboard Service
// =============================================================================

export class PeriodCloseDashboardService {
  private readonly repository: PeriodCloseDashboardRepositoryPort;

  constructor(deps: PeriodCloseDashboardServiceDeps) {
    this.repository = deps.repository;
  }

  async getDashboardMetrics(
    tenantId: string,
    companyId: string
  ): Promise<PeriodCloseDashboardMetrics> {
    const [currentPeriod, periodCounts, historicalMetrics] = await Promise.all([
      this.repository.getCurrentPeriodInfo(tenantId, companyId),
      this.repository.getPeriodCounts(tenantId, companyId),
      this.repository.getHistoricalMetrics(tenantId, companyId),
    ]);

    if (!currentPeriod) {
      throw new Error('No current period found');
    }

    const [checklistProgress, pendingItems] = await Promise.all([
      this.repository.getChecklistProgress(currentPeriod.periodCode),
      this.repository.getPendingItems(tenantId, currentPeriod.periodCode),
    ]);

    const daysRemaining = Math.ceil(
      (currentPeriod.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      currentPeriod: currentPeriod.periodCode,
      currentPeriodStatus: currentPeriod.status,
      daysRemaining: Math.max(0, daysRemaining),
      openPeriods: periodCounts.open,
      softClosedPeriods: periodCounts.softClosed,
      hardClosedPeriods: periodCounts.hardClosed,
      checklistTotal: checklistProgress.total,
      checklistCompleted: checklistProgress.completed,
      checklistBlocking: checklistProgress.blocking,
      pendingEntries: pendingItems.entries,
      pendingApprovals: pendingItems.approvals,
      averageCloseTime: historicalMetrics.averageCloseTime,
      lastCloseDate: historicalMetrics.lastCloseDate || undefined,
    };
  }

  async getPeriodCalendar(
    tenantId: string,
    companyId: string,
    year: number
  ): Promise<PeriodCalendarItem[]> {
    return this.repository.getPeriodCalendar(tenantId, companyId, year);
  }
}
