/**
 * Payment Dashboard Service
 * 
 * AP-05 Payment Execution Cell — Dashboard metrics and aggregations.
 * 
 * Responsibilities:
 * - Provide real-time payment hub metrics
 * - Cash position projection
 * - Control health indicators
 * - Multi-company aggregation
 * 
 * Powers the Payment Hub frontend with actionable data.
 */

import type {
  PaymentRepositoryPort,
  StatusAggregate,
  CompanyAggregate,
  CashPositionEntry,
  DashboardFilters,
  PaymentStatus,
} from '@aibos/kernel-core';
import type { ActorContext } from '@aibos/canon-governance';

// ============================================================================
// 1. TYPES
// ============================================================================

/**
 * Full dashboard metrics response
 */
export interface DashboardMetrics {
  /** Cash position projection */
  cashPosition: {
    today: CashSummary;
    thisWeek: CashSummary;
    thisMonth: CashSummary;
    next90Days: CashSummary;
  };
  
  /** Payment counts by status */
  byStatus: StatusAggregate[];
  
  /** Payments by company (for groups) */
  byCompany: CompanyAggregate[];
  
  /** Control health indicators */
  controlHealth: ControlHealthMetrics;
  
  /** Timestamp of metrics generation */
  generatedAt: Date;
}

/**
 * Cash summary for a period
 */
export interface CashSummary {
  amount: string;
  paymentCount: number;
  currency: string;
}

/**
 * Control health metrics
 */
export interface ControlHealthMetrics {
  /** SoD compliance rate (0-100) */
  sodComplianceRate: number;
  
  /** Number of payments pending approval */
  pendingApprovals: number;
  
  /** Pending approval amount */
  pendingApprovalAmount: string;
  
  /** Exception counts by severity */
  exceptions: {
    total: number;
    high: number;
    medium: number;
    low: number;
  };
  
  /** Audit coverage percentage */
  auditCoverage: number;
  
  /** Whether any control violations exist */
  hasViolations: boolean;
}

/**
 * Cash position response with daily breakdown
 */
export interface CashPositionResponse {
  summary: {
    today: CashSummary;
    thisWeek: CashSummary;
    thisMonth: CashSummary;
    next90Days: CashSummary;
  };
  daily: CashPositionEntry[];
  currency: string;
  generatedAt: Date;
}

/**
 * Control health response
 */
export interface ControlHealthResponse {
  metrics: ControlHealthMetrics;
  
  /** Control status indicators */
  status: {
    sod: 'healthy' | 'warning' | 'critical';
    approvals: 'healthy' | 'warning' | 'critical';
    exceptions: 'healthy' | 'warning' | 'critical';
    overall: 'healthy' | 'warning' | 'critical';
  };
  
  generatedAt: Date;
}

/**
 * Company breakdown response
 */
export interface CompanyBreakdownResponse {
  companies: CompanyAggregate[];
  totals: {
    pendingAmount: string;
    completedAmount: string;
    totalAmount: string;
    paymentCount: number;
  };
  currency: string;
  generatedAt: Date;
}

// ============================================================================
// 2. HELPER FUNCTIONS
// ============================================================================

function sumAmounts(entries: { amount: string }[]): string {
  const total = entries.reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0);
  return total.toFixed(2);
}

function getDateRange(days: number): { from: Date; to: Date } {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  
  const to = new Date(from);
  to.setDate(to.getDate() + days);
  
  return { from, to };
}

function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function isThisWeek(date: Date): boolean {
  const today = new Date();
  const weekFromNow = new Date(today);
  weekFromNow.setDate(today.getDate() + 7);
  return date >= today && date < weekFromNow;
}

function isThisMonth(date: Date): boolean {
  const today = new Date();
  const monthFromNow = new Date(today);
  monthFromNow.setDate(today.getDate() + 30);
  return date >= today && date < monthFromNow;
}

// ============================================================================
// 3. SERVICE
// ============================================================================

/**
 * PaymentDashboardService — Powers the Payment Hub frontend
 */
export class PaymentDashboardService {
  constructor(
    private paymentRepo: PaymentRepositoryPort
  ) {}

  /**
   * Get full dashboard metrics
   */
  async getDashboard(actor: ActorContext): Promise<DashboardMetrics> {
    const filters: DashboardFilters = {
      tenantId: actor.tenantId,
      companyId: actor.companyId,
    };

    // Execute all queries in parallel for performance
    const [statusAggregates, companyAggregates, cashPosition, controlHealth] = await Promise.all([
      this.paymentRepo.getStatusAggregates(filters),
      this.paymentRepo.getCompanyAggregates(filters),
      this.getCashPosition(actor, 90),
      this.getControlHealth(actor),
    ]);

    return {
      cashPosition: cashPosition.summary,
      byStatus: statusAggregates,
      byCompany: companyAggregates,
      controlHealth: controlHealth.metrics,
      generatedAt: new Date(),
    };
  }

  /**
   * Get cash position projection
   */
  async getCashPosition(actor: ActorContext, days: number = 90): Promise<CashPositionResponse> {
    const { from, to } = getDateRange(days);
    
    const filters: DashboardFilters = {
      tenantId: actor.tenantId,
      companyId: actor.companyId,
      fromDate: from,
      toDate: to,
    };

    const entries = await this.paymentRepo.getCashPosition(filters, days);
    
    // Calculate summaries
    const currency = entries[0]?.currency || 'USD';
    
    const todayEntries = entries.filter(e => isToday(e.date));
    const weekEntries = entries.filter(e => isThisWeek(e.date));
    const monthEntries = entries.filter(e => isThisMonth(e.date));

    return {
      summary: {
        today: {
          amount: sumAmounts(todayEntries.map(e => ({ amount: e.scheduledAmount }))),
          paymentCount: todayEntries.reduce((sum, e) => sum + e.paymentCount, 0),
          currency,
        },
        thisWeek: {
          amount: sumAmounts(weekEntries.map(e => ({ amount: e.scheduledAmount }))),
          paymentCount: weekEntries.reduce((sum, e) => sum + e.paymentCount, 0),
          currency,
        },
        thisMonth: {
          amount: sumAmounts(monthEntries.map(e => ({ amount: e.scheduledAmount }))),
          paymentCount: monthEntries.reduce((sum, e) => sum + e.paymentCount, 0),
          currency,
        },
        next90Days: {
          amount: sumAmounts(entries.map(e => ({ amount: e.scheduledAmount }))),
          paymentCount: entries.reduce((sum, e) => sum + e.paymentCount, 0),
          currency,
        },
      },
      daily: entries,
      currency,
      generatedAt: new Date(),
    };
  }

  /**
   * Get control health metrics
   */
  async getControlHealth(actor: ActorContext): Promise<ControlHealthResponse> {
    const filters: DashboardFilters = {
      tenantId: actor.tenantId,
      companyId: actor.companyId,
    };

    // Get status aggregates to calculate pending approvals
    const statusAggregates = await this.paymentRepo.getStatusAggregates(filters);
    
    const pendingApproval = statusAggregates.find(s => s.status === 'pending_approval');
    const pendingApprovals = pendingApproval?.count || 0;
    const pendingApprovalAmount = pendingApproval?.totalAmount || '0.00';

    // TODO: When exception service is integrated, get real exception counts
    // For now, return zeros (no exceptions is good!)
    const exceptions = {
      total: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    // SoD compliance is 100% by design (DB constraints enforce it)
    // Audit coverage is 100% (transactional audit on all mutations)
    const metrics: ControlHealthMetrics = {
      sodComplianceRate: 100,
      pendingApprovals,
      pendingApprovalAmount,
      exceptions,
      auditCoverage: 100,
      hasViolations: false,
    };

    // Determine status thresholds
    const approvalStatus = pendingApprovals > 50 ? 'critical' : pendingApprovals > 20 ? 'warning' : 'healthy';
    const exceptionStatus = exceptions.high > 0 ? 'critical' : exceptions.total > 10 ? 'warning' : 'healthy';
    const overallStatus = approvalStatus === 'critical' || exceptionStatus === 'critical' 
      ? 'critical' 
      : approvalStatus === 'warning' || exceptionStatus === 'warning'
        ? 'warning'
        : 'healthy';

    return {
      metrics,
      status: {
        sod: 'healthy', // Always healthy - enforced by design
        approvals: approvalStatus,
        exceptions: exceptionStatus,
        overall: overallStatus,
      },
      generatedAt: new Date(),
    };
  }

  /**
   * Get payments breakdown by company
   */
  async getByCompany(actor: ActorContext): Promise<CompanyBreakdownResponse> {
    const filters: DashboardFilters = {
      tenantId: actor.tenantId,
      // Don't filter by company - we want all companies for this view
    };

    const companies = await this.paymentRepo.getCompanyAggregates(filters);
    const currency = companies[0]?.currency || 'USD';

    // Calculate totals
    const totals = {
      pendingAmount: sumAmounts(companies.map(c => ({ amount: c.pendingAmount }))),
      completedAmount: sumAmounts(companies.map(c => ({ amount: c.completedAmount }))),
      totalAmount: sumAmounts(companies.map(c => ({ amount: c.totalAmount }))),
      paymentCount: companies.reduce((sum, c) => sum + c.totalCount, 0),
    };

    return {
      companies,
      totals,
      currency,
      generatedAt: new Date(),
    };
  }

  /**
   * Get pending approval count for current user
   */
  async getPendingForApprover(actor: ActorContext): Promise<number> {
    return this.paymentRepo.getPendingApprovalCount(actor.userId, actor.tenantId);
  }
}

// ============================================================================
// 4. FACTORY
// ============================================================================

export function createPaymentDashboardService(
  paymentRepo: PaymentRepositoryPort
): PaymentDashboardService {
  return new PaymentDashboardService(paymentRepo);
}
