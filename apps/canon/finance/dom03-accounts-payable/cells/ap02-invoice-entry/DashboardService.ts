/**
 * Invoice Dashboard Service
 * 
 * AP-02 Invoice Entry Cell — Dashboard metrics and aggregations.
 * 
 * Responsibilities:
 * - Provide invoice processing metrics
 * - Duplicate detection health
 * - Period cutoff awareness
 * - Aging analysis
 * 
 * Powers the AP-02 cell dashboard in the AP Manager.
 */

import type {
  InvoiceRepositoryPort,
  Invoice,
  InvoiceStatus,
} from '@aibos/kernel-core';
import type { ActorContext } from '@aibos/canon-governance';

// ============================================================================
// 1. TYPES
// ============================================================================

/**
 * Invoice dashboard metrics
 */
export interface InvoiceDashboardMetrics {
  /** Cell identity */
  cellCode: 'AP-02';
  cellName: 'Invoice Entry';
  
  /** Health score (0-100) */
  healthScore: number;
  healthStatus: 'healthy' | 'warning' | 'critical';
  
  /** Work queue */
  openItems: {
    total: number;
    draft: number;
    submitted: number;
    awaitingMatch: number;
  };
  
  /** Volume metrics */
  volumeMetrics: {
    receivedToday: number;
    receivedThisWeek: number;
    receivedThisMonth: number;
    avgDailyVolume: number;
  };
  
  /** Value metrics */
  valueMetrics: {
    totalPendingValue: string;
    avgInvoiceValue: string;
    currency: string;
  };
  
  /** Aging */
  aging: {
    current: number;      // 0-30 days
    days30to60: number;
    days60to90: number;
    over90Days: number;
  };
  
  /** Overdue */
  overdueMetrics: {
    overdueCount: number;
    overdueValue: string;
    dueThisWeek: number;
  };
  
  /** Status distribution */
  byStatus: StatusCount[];
  
  /** Duplicate detection health */
  duplicateDetection: {
    blockedToday: number;
    blockedThisMonth: number;
    falsePositiveRate: number;
  };
  
  /** Period cutoff */
  periodCutoff: {
    currentPeriod: string;
    periodCloseDate: Date | null;
    daysUntilClose: number;
    awaitingPosting: number;
  };
  
  /** Control health */
  controlHealth: {
    sodComplianceRate: number;
    periodComplianceRate: number;
    auditCoverage: number;
  };
  
  generatedAt: Date;
}

interface StatusCount {
  status: string;
  count: number;
}

/**
 * Invoice cell summary (for AP Manager)
 */
export interface InvoiceCellSummary {
  code: 'AP-02';
  name: 'Invoice Entry';
  healthScore: number;
  status: 'healthy' | 'warning' | 'critical';
  openItems: number;
  keyMetric: { label: string; value: number | string };
}

// ============================================================================
// 2. HELPER FUNCTIONS
// ============================================================================

function calculateHealthScore(metrics: {
  overdueCount: number;
  over90Days: number;
  daysUntilClose: number;
  awaitingPosting: number;
}): number {
  let score = 100;
  
  // Deduct for overdue invoices
  const overduePercent = metrics.overdueCount;
  if (overduePercent > 20) score -= 25;
  else if (overduePercent > 10) score -= 15;
  else if (overduePercent > 5) score -= 5;
  
  // Deduct for very old invoices
  if (metrics.over90Days > 10) score -= 20;
  else if (metrics.over90Days > 5) score -= 10;
  
  // Deduct if close to period close with pending invoices
  if (metrics.daysUntilClose <= 3 && metrics.awaitingPosting > 0) {
    score -= 15;
  } else if (metrics.daysUntilClose <= 7 && metrics.awaitingPosting > 10) {
    score -= 10;
  }
  
  return Math.max(score, 0);
}

function determineHealthStatus(score: number): 'healthy' | 'warning' | 'critical' {
  if (score >= 80) return 'healthy';
  if (score >= 50) return 'warning';
  return 'critical';
}

function getCurrentPeriod(): string {
  const now = new Date();
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 
                  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return `${months[now.getMonth()]}-${now.getFullYear()}`;
}

// ============================================================================
// 3. SERVICE
// ============================================================================

/**
 * InvoiceDashboardService — Powers the AP-02 cell dashboard
 */
export class InvoiceDashboardService {
  constructor(
    private invoiceRepo: InvoiceRepositoryPort
  ) {}

  /**
   * Get full dashboard metrics for AP-02
   */
  async getDashboard(actor: ActorContext): Promise<InvoiceDashboardMetrics> {
    const tenantId = actor.tenantId;
    const companyId = actor.companyId;
    
    // Get all metrics in parallel
    const [
      statusCounts,
      agingCounts,
      volumeStats,
      overdueStats,
      duplicateStats,
    ] = await Promise.all([
      this.invoiceRepo.countByStatus(tenantId, companyId),
      this.getAgingCounts(tenantId, companyId),
      this.getVolumeStats(tenantId, companyId),
      this.getOverdueStats(tenantId, companyId),
      this.getDuplicateStats(tenantId),
    ]);
    
    // Calculate derived metrics
    const draft = statusCounts.find(s => s.status === 'draft')?.count ?? 0;
    const submitted = statusCounts.find(s => s.status === 'submitted')?.count ?? 0;
    const awaitingMatch = statusCounts.find(s => s.status === 'submitted')?.count ?? 0;
    const totalOpen = draft + submitted;
    
    // Period cutoff (simplified - would come from K_TIME in production)
    const now = new Date();
    const periodCloseDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysUntilClose = Math.ceil((periodCloseDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    const healthScore = calculateHealthScore({
      overdueCount: overdueStats.count,
      over90Days: agingCounts.over90Days,
      daysUntilClose,
      awaitingPosting: submitted,
    });
    
    return {
      cellCode: 'AP-02',
      cellName: 'Invoice Entry',
      
      healthScore,
      healthStatus: determineHealthStatus(healthScore),
      
      openItems: {
        total: totalOpen,
        draft,
        submitted,
        awaitingMatch,
      },
      
      volumeMetrics: {
        receivedToday: volumeStats.today,
        receivedThisWeek: volumeStats.thisWeek,
        receivedThisMonth: volumeStats.thisMonth,
        avgDailyVolume: volumeStats.avgDaily,
      },
      
      valueMetrics: {
        totalPendingValue: volumeStats.pendingValue,
        avgInvoiceValue: volumeStats.avgValue,
        currency: 'USD',
      },
      
      aging: agingCounts,
      
      overdueMetrics: {
        overdueCount: overdueStats.count,
        overdueValue: overdueStats.value,
        dueThisWeek: overdueStats.dueThisWeek,
      },
      
      byStatus: statusCounts,
      
      duplicateDetection: duplicateStats,
      
      periodCutoff: {
        currentPeriod: getCurrentPeriod(),
        periodCloseDate,
        daysUntilClose,
        awaitingPosting: submitted,
      },
      
      controlHealth: {
        sodComplianceRate: 100,
        periodComplianceRate: 100,
        auditCoverage: 100,
      },
      
      generatedAt: new Date(),
    };
  }

  /**
   * Get summary for AP Manager cluster dashboard
   */
  async getSummary(actor: ActorContext): Promise<InvoiceCellSummary> {
    const dashboard = await this.getDashboard(actor);
    
    return {
      code: 'AP-02',
      name: 'Invoice Entry',
      healthScore: dashboard.healthScore,
      status: dashboard.healthStatus,
      openItems: dashboard.openItems.total,
      keyMetric: {
        label: 'Pending Value',
        value: `$${dashboard.valueMetrics.totalPendingValue}`,
      },
    };
  }

  /**
   * Get aging counts
   */
  private async getAgingCounts(tenantId: string, companyId?: string): Promise<{
    current: number;
    days30to60: number;
    days60to90: number;
    over90Days: number;
  }> {
    try {
      return await this.invoiceRepo.getAgingCounts?.(tenantId, companyId) ?? {
        current: 0,
        days30to60: 0,
        days60to90: 0,
        over90Days: 0,
      };
    } catch {
      return { current: 0, days30to60: 0, days60to90: 0, over90Days: 0 };
    }
  }

  /**
   * Get volume statistics
   */
  private async getVolumeStats(tenantId: string, companyId?: string): Promise<{
    today: number;
    thisWeek: number;
    thisMonth: number;
    avgDaily: number;
    pendingValue: string;
    avgValue: string;
  }> {
    try {
      return await this.invoiceRepo.getVolumeStats?.(tenantId, companyId) ?? {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        avgDaily: 0,
        pendingValue: '0.00',
        avgValue: '0.00',
      };
    } catch {
      return {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        avgDaily: 0,
        pendingValue: '0.00',
        avgValue: '0.00',
      };
    }
  }

  /**
   * Get overdue statistics
   */
  private async getOverdueStats(tenantId: string, companyId?: string): Promise<{
    count: number;
    value: string;
    dueThisWeek: number;
  }> {
    try {
      return await this.invoiceRepo.getOverdueStats?.(tenantId, companyId) ?? {
        count: 0,
        value: '0.00',
        dueThisWeek: 0,
      };
    } catch {
      return { count: 0, value: '0.00', dueThisWeek: 0 };
    }
  }

  /**
   * Get duplicate detection statistics
   */
  private async getDuplicateStats(tenantId: string): Promise<{
    blockedToday: number;
    blockedThisMonth: number;
    falsePositiveRate: number;
  }> {
    try {
      return await this.invoiceRepo.getDuplicateStats?.(tenantId) ?? {
        blockedToday: 0,
        blockedThisMonth: 0,
        falsePositiveRate: 0,
      };
    } catch {
      return { blockedToday: 0, blockedThisMonth: 0, falsePositiveRate: 0 };
    }
  }
}

// ============================================================================
// 4. FACTORY
// ============================================================================

export function createInvoiceDashboardService(
  invoiceRepo: InvoiceRepositoryPort
): InvoiceDashboardService {
  return new InvoiceDashboardService(invoiceRepo);
}
