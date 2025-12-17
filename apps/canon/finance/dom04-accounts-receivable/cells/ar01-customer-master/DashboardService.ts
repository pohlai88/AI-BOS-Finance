/**
 * Customer Dashboard Service
 * 
 * AR-01 Customer Master Cell — Dashboard metrics and aggregations.
 * 
 * Responsibilities:
 * - Provide customer health metrics
 * - Pending approvals tracking
 * - Credit utilization monitoring
 * - Risk distribution analysis
 * 
 * Powers the AR-01 cell dashboard in the AR Manager.
 * 
 * @module AR-01
 */

import type {
  CustomerRepositoryPort,
  CustomerStatus,
  RiskLevel,
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
 * Customer dashboard metrics
 */
export interface CustomerDashboardMetrics {
  /** Cell identity */
  cellCode: 'AR-01';
  cellName: 'Customer Master';

  /** Health score (0-100) */
  healthScore: number;
  healthStatus: 'healthy' | 'warning' | 'critical';

  /** Work queue */
  openItems: {
    total: number;
    pendingApproval: number;
    pendingCreditReview: number;
  };

  /** Customer counts */
  customerMetrics: {
    totalActiveCustomers: number;
    newCustomersThisMonth: number;
    suspendedCustomers: number;
    archivedCustomers: number;
  };

  /** Risk distribution */
  byRiskLevel: {
    high: number;
    medium: number;
    low: number;
  };

  /** Status distribution */
  byStatus: StatusCount[];

  /** Credit health */
  creditHealth: {
    customersOverLimit: number;
    customersNearLimit: number; // 80-100% utilized
    totalCreditExposure: number;
    averageUtilization: number;
  };

  /** Control health */
  controlHealth: {
    sodComplianceRate: number;
    dualControlCompliance: number;
    auditCoverage: number;
  };

  generatedAt: Date;
}

interface StatusCount {
  status: CustomerStatus;
  count: number;
}

/**
 * Customer cell summary (for AR Manager)
 */
export interface CustomerCellSummary {
  code: 'AR-01';
  name: 'Customer Master';
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
  pendingCreditReview: number;
  customersOverLimit: number;
}): number {
  let score = 100;

  // Deduct for pending approvals
  if (metrics.pendingApproval > 50) score -= 20;
  else if (metrics.pendingApproval > 20) score -= 10;
  else if (metrics.pendingApproval > 10) score -= 5;

  // Deduct for pending credit reviews (high risk)
  if (metrics.pendingCreditReview > 10) score -= 15;
  else if (metrics.pendingCreditReview > 5) score -= 10;
  else if (metrics.pendingCreditReview > 0) score -= 5;

  // Deduct for customers over credit limit
  if (metrics.customersOverLimit > 10) score -= 20;
  else if (metrics.customersOverLimit > 5) score -= 10;
  else if (metrics.customersOverLimit > 0) score -= 5;

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
 * CustomerDashboardService — Powers the AR-01 cell dashboard
 */
export class CustomerDashboardService {
  constructor(
    private customerRepo: CustomerRepositoryPort
  ) {}

  /**
   * Get full dashboard metrics for AR-01
   */
  async getDashboard(actor: ActorContext): Promise<CustomerDashboardMetrics> {
    const tenantId = actor.tenantId;

    // Get all metrics in parallel
    const [
      statusCounts,
      riskCounts,
      creditStats,
      recentCustomers,
    ] = await Promise.all([
      this.customerRepo.countByStatus(tenantId),
      this.customerRepo.countByRiskLevel(tenantId),
      this.getCreditStats(tenantId),
      this.customerRepo.countRecentCustomers?.(tenantId, 30) ?? Promise.resolve(0),
    ]);

    // Calculate derived metrics
    const pendingApproval = statusCounts.find(s => s.status === 'submitted')?.count ?? 0;
    const totalActive = statusCounts.find(s => s.status === 'approved')?.count ?? 0;
    const suspended = statusCounts.find(s => s.status === 'suspended')?.count ?? 0;
    const archived = statusCounts.find(s => s.status === 'archived')?.count ?? 0;

    const healthScore = calculateHealthScore({
      pendingApproval,
      pendingCreditReview: creditStats.pendingCreditReviews,
      customersOverLimit: creditStats.customersOverLimit,
    });

    return {
      cellCode: 'AR-01',
      cellName: 'Customer Master',

      healthScore,
      healthStatus: determineHealthStatus(healthScore),

      openItems: {
        total: pendingApproval + creditStats.pendingCreditReviews,
        pendingApproval,
        pendingCreditReview: creditStats.pendingCreditReviews,
      },

      customerMetrics: {
        totalActiveCustomers: totalActive,
        newCustomersThisMonth: recentCustomers,
        suspendedCustomers: suspended,
        archivedCustomers: archived,
      },

      byRiskLevel: {
        high: riskCounts.find(r => r.riskLevel === 'HIGH')?.count ?? 0,
        medium: riskCounts.find(r => r.riskLevel === 'MEDIUM')?.count ?? 0,
        low: riskCounts.find(r => r.riskLevel === 'LOW')?.count ?? 0,
      },

      byStatus: statusCounts,

      creditHealth: {
        customersOverLimit: creditStats.customersOverLimit,
        customersNearLimit: creditStats.customersNearLimit,
        totalCreditExposure: creditStats.totalExposure,
        averageUtilization: creditStats.averageUtilization,
      },

      // SoD is 100% by design (enforced in DB)
      controlHealth: {
        sodComplianceRate: 100,
        dualControlCompliance: 100,
        auditCoverage: 100,
      },

      generatedAt: new Date(),
    };
  }

  /**
   * Get summary for AR Manager cluster dashboard
   */
  async getSummary(actor: ActorContext): Promise<CustomerCellSummary> {
    const dashboard = await this.getDashboard(actor);

    return {
      code: 'AR-01',
      name: 'Customer Master',
      healthScore: dashboard.healthScore,
      status: dashboard.healthStatus,
      openItems: dashboard.openItems.total,
      keyMetric: {
        label: 'Pending Approval',
        value: dashboard.openItems.pendingApproval,
      },
    };
  }

  /**
   * Get credit statistics
   */
  private async getCreditStats(tenantId: string): Promise<{
    customersOverLimit: number;
    customersNearLimit: number;
    pendingCreditReviews: number;
    totalExposure: number;
    averageUtilization: number;
  }> {
    // These would come from the CustomerRepositoryPort
    // For now, return defaults (to be implemented with actual repo methods)
    try {
      const [overLimit, nearLimit, pendingReviews] = await Promise.all([
        this.customerRepo.countCustomersOverCreditLimit?.(tenantId) ?? Promise.resolve(0),
        this.customerRepo.countCustomersNearCreditLimit?.(tenantId, 80) ?? Promise.resolve(0),
        this.customerRepo.countPendingCreditReviews?.(tenantId) ?? Promise.resolve(0),
      ]);

      return {
        customersOverLimit: overLimit,
        customersNearLimit: nearLimit,
        pendingCreditReviews: pendingReviews,
        totalExposure: 0, // TODO: Calculate from actual data
        averageUtilization: 0, // TODO: Calculate from actual data
      };
    } catch {
      // Fallback if methods not implemented yet
      return {
        customersOverLimit: 0,
        customersNearLimit: 0,
        pendingCreditReviews: 0,
        totalExposure: 0,
        averageUtilization: 0,
      };
    }
  }
}

// =============================================================================
// 4. FACTORY
// =============================================================================

export function createCustomerDashboardService(
  customerRepo: CustomerRepositoryPort
): CustomerDashboardService {
  return new CustomerDashboardService(customerRepo);
}
