/**
 * Invoice Dashboard Service
 * 
 * AR-02 Sales Invoice Cell — Dashboard metrics and aggregations.
 * 
 * Responsibilities:
 * - Provide invoice health metrics
 * - Posting backlog tracking
 * - Duplicate detection alerts
 * - Period cutoff monitoring
 * 
 * Powers the AR-02 cell dashboard in the AR Manager.
 * 
 * @module AR-02
 */

import type {
  InvoiceRepositoryPort,
  InvoiceStatus,
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
 * Invoice dashboard metrics
 */
export interface InvoiceDashboardMetrics {
  /** Cell identity */
  cellCode: 'AR-02';
  cellName: 'Sales Invoice';

  /** Health score (0-100) */
  healthScore: number;
  healthStatus: 'healthy' | 'warning' | 'critical';

  /** Work queue */
  openItems: {
    total: number;
    draft: number;
    pendingApproval: number;
    pendingPosting: number;
  };

  /** Invoice metrics */
  invoiceMetrics: {
    totalOpenInvoices: number;
    totalPostedThisMonth: number;
    totalOutstandingAmount: number;
    averageInvoiceValue: number;
  };

  /** Status distribution */
  byStatus: StatusCount[];

  /** Aging summary (from posted invoices) */
  agingSummary: {
    current: number;
    days1to30: number;
    days31to60: number;
    days61to90: number;
    days91Plus: number;
  };

  /** Control health */
  controlHealth: {
    duplicatesDetected: number;
    periodCutoffDaysRemaining: number;
    postingBacklogDays: number;
  };

  generatedAt: Date;
}

interface StatusCount {
  status: InvoiceStatus;
  count: number;
}

/**
 * Invoice cell summary (for AR Manager)
 */
export interface InvoiceCellSummary {
  code: 'AR-02';
  name: 'Sales Invoice';
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
  pendingPosting: number;
  duplicatesDetected: number;
  postingBacklogDays: number;
}): number {
  let score = 100;

  // Deduct for pending approvals
  if (metrics.pendingApproval > 100) score -= 20;
  else if (metrics.pendingApproval > 50) score -= 10;
  else if (metrics.pendingApproval > 20) score -= 5;

  // Deduct for pending postings
  if (metrics.pendingPosting > 50) score -= 15;
  else if (metrics.pendingPosting > 20) score -= 10;
  else if (metrics.pendingPosting > 10) score -= 5;

  // Deduct for duplicates
  if (metrics.duplicatesDetected > 5) score -= 15;
  else if (metrics.duplicatesDetected > 0) score -= 5;

  // Deduct for posting backlog
  if (metrics.postingBacklogDays > 5) score -= 20;
  else if (metrics.postingBacklogDays > 3) score -= 10;
  else if (metrics.postingBacklogDays > 1) score -= 5;

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
 * InvoiceDashboardService — Powers the AR-02 cell dashboard
 */
export class InvoiceDashboardService {
  constructor(
    private invoiceRepo: InvoiceRepositoryPort
  ) {}

  /**
   * Get full dashboard metrics for AR-02
   */
  async getDashboard(actor: ActorContext): Promise<InvoiceDashboardMetrics> {
    const tenantId = actor.tenantId;

    // Get all metrics in parallel
    const [
      statusCounts,
      agingData,
      controlStats,
      periodStats,
    ] = await Promise.all([
      this.invoiceRepo.countByStatus(tenantId),
      this.getAgingData(tenantId),
      this.getControlStats(tenantId),
      this.getPeriodStats(tenantId),
    ]);

    // Calculate derived metrics
    const draft = statusCounts.find(s => s.status === 'draft')?.count ?? 0;
    const pendingApproval = statusCounts.find(s => s.status === 'submitted')?.count ?? 0;
    const pendingPosting = statusCounts.find(s => s.status === 'approved')?.count ?? 0;
    const posted = statusCounts.find(s => s.status === 'posted')?.count ?? 0;

    const healthScore = calculateHealthScore({
      pendingApproval,
      pendingPosting,
      duplicatesDetected: controlStats.duplicatesDetected,
      postingBacklogDays: controlStats.postingBacklogDays,
    });

    return {
      cellCode: 'AR-02',
      cellName: 'Sales Invoice',

      healthScore,
      healthStatus: determineHealthStatus(healthScore),

      openItems: {
        total: draft + pendingApproval + pendingPosting,
        draft,
        pendingApproval,
        pendingPosting,
      },

      invoiceMetrics: {
        totalOpenInvoices: posted,
        totalPostedThisMonth: periodStats.postedThisMonth,
        totalOutstandingAmount: periodStats.totalOutstanding,
        averageInvoiceValue: periodStats.averageValue,
      },

      byStatus: statusCounts,

      agingSummary: agingData,

      controlHealth: {
        duplicatesDetected: controlStats.duplicatesDetected,
        periodCutoffDaysRemaining: periodStats.daysUntilCutoff,
        postingBacklogDays: controlStats.postingBacklogDays,
      },

      generatedAt: new Date(),
    };
  }

  /**
   * Get summary for AR Manager cluster dashboard
   */
  async getSummary(actor: ActorContext): Promise<InvoiceCellSummary> {
    const dashboard = await this.getDashboard(actor);

    return {
      code: 'AR-02',
      name: 'Sales Invoice',
      healthScore: dashboard.healthScore,
      status: dashboard.healthStatus,
      openItems: dashboard.openItems.total,
      keyMetric: {
        label: 'Outstanding',
        value: `$${(dashboard.invoiceMetrics.totalOutstandingAmount / 1000).toFixed(0)}K`,
      },
    };
  }

  /**
   * Get aging data
   */
  private async getAgingData(tenantId: string): Promise<{
    current: number;
    days1to30: number;
    days31to60: number;
    days61to90: number;
    days91Plus: number;
  }> {
    try {
      return await this.invoiceRepo.getAgingSummary?.(tenantId) ?? {
        current: 0,
        days1to30: 0,
        days31to60: 0,
        days61to90: 0,
        days91Plus: 0,
      };
    } catch {
      return {
        current: 0,
        days1to30: 0,
        days31to60: 0,
        days61to90: 0,
        days91Plus: 0,
      };
    }
  }

  /**
   * Get control statistics
   */
  private async getControlStats(tenantId: string): Promise<{
    duplicatesDetected: number;
    postingBacklogDays: number;
  }> {
    try {
      const [duplicates, backlog] = await Promise.all([
        this.invoiceRepo.countDuplicateFlags?.(tenantId) ?? Promise.resolve(0),
        this.invoiceRepo.getPostingBacklogDays?.(tenantId) ?? Promise.resolve(0),
      ]);

      return {
        duplicatesDetected: duplicates,
        postingBacklogDays: backlog,
      };
    } catch {
      return {
        duplicatesDetected: 0,
        postingBacklogDays: 0,
      };
    }
  }

  /**
   * Get period statistics
   */
  private async getPeriodStats(tenantId: string): Promise<{
    postedThisMonth: number;
    totalOutstanding: number;
    averageValue: number;
    daysUntilCutoff: number;
  }> {
    try {
      return await this.invoiceRepo.getPeriodStats?.(tenantId) ?? {
        postedThisMonth: 0,
        totalOutstanding: 0,
        averageValue: 0,
        daysUntilCutoff: 14,
      };
    } catch {
      return {
        postedThisMonth: 0,
        totalOutstanding: 0,
        averageValue: 0,
        daysUntilCutoff: 14,
      };
    }
  }
}

// =============================================================================
// 4. FACTORY
// =============================================================================

export function createInvoiceDashboardService(
  invoiceRepo: InvoiceRepositoryPort
): InvoiceDashboardService {
  return new InvoiceDashboardService(invoiceRepo);
}
