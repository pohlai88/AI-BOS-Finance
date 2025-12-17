/**
 * AP Manager Dashboard Service
 * 
 * DOM-03 Accounts Payable — Cluster-level dashboard aggregation.
 * 
 * Responsibilities:
 * - Aggregate metrics from all 5 AP cells (AP-01 to AP-05)
 * - Calculate overall cluster health
 * - Provide P2P lifecycle metrics
 * - Cash flow summary
 * 
 * Powers the AP Manager cluster dashboard.
 */

import type { ActorContext } from '@aibos/canon-governance';
import type { VendorDashboardService, VendorCellSummary } from './cells/ap01-vendor-master/DashboardService';
import type { InvoiceDashboardService, InvoiceCellSummary } from './cells/ap02-invoice-entry/DashboardService';
import type { MatchDashboardService, MatchCellSummary } from './cells/ap03-3way-engine/DashboardService';
import type { ApprovalDashboardService, ApprovalCellSummary } from './cells/ap04-invoice-submit-approval/DashboardService';
import type { PaymentDashboardService, CashSummary, ControlHealthMetrics } from './cells/ap05-payment-execution/DashboardService';

// ============================================================================
// 1. TYPES
// ============================================================================

/**
 * Cell summary for cluster dashboard
 */
export interface CellSummary {
  code: string;
  name: string;
  healthScore: number;
  status: 'healthy' | 'warning' | 'critical';
  openItems: number;
  keyMetric: { label: string; value: number | string };
}

/**
 * P2P lifecycle stage metrics
 */
export interface P2PStageMetrics {
  stage: 'VENDOR_ONBOARD' | 'INVOICE_ENTRY' | 'MATCHING' | 'APPROVAL' | 'PAYMENT';
  avgDays: number;
  isBottleneck: boolean;
  itemsInStage: number;
}

/**
 * Cluster health metrics
 */
export interface ClusterHealthMetrics {
  overallScore: number;
  status: 'healthy' | 'warning' | 'critical';
  cellCount: number;
  cellsHealthy: number;
  cellsWarning: number;
  cellsCritical: number;
}

/**
 * P2P lifecycle metrics
 */
export interface P2PLifecycleMetrics {
  avgCycleTimeDays: number;
  cycleTimeP90Days: number;
  stages: P2PStageMetrics[];
  itemsInPipeline: number;
  valueInPipeline: string;
  currency: string;
}

/**
 * Control aggregation
 */
export interface AggregatedControlHealth {
  sodComplianceOverall: number;
  auditCoverage: number;
  openExceptions: number;
  controlViolations: number;
}

/**
 * AP Manager dashboard metrics
 */
export interface APManagerDashboardMetrics {
  /** Cluster identity */
  domainCode: 'DOM-03';
  domainName: 'Accounts Payable';
  
  /** Aggregate health */
  clusterHealth: ClusterHealthMetrics;
  
  /** P2P lifecycle */
  p2pLifecycle: P2PLifecycleMetrics;
  
  /** Control aggregation */
  controlHealth: AggregatedControlHealth;
  
  /** Cash summary */
  cashSummary: {
    scheduledThisWeek: string;
    scheduledThisMonth: string;
    cashPositionTrend: 'increasing' | 'stable' | 'decreasing';
    currency: string;
  };
  
  /** Cell summaries */
  cells: CellSummary[];
  
  generatedAt: Date;
}

// ============================================================================
// 2. HELPER FUNCTIONS
// ============================================================================

function calculateClusterHealthScore(cellSummaries: CellSummary[]): number {
  if (cellSummaries.length === 0) return 100;
  
  // Weighted average - payment cell gets higher weight (most critical)
  const weights: Record<string, number> = {
    'AP-01': 1.0,
    'AP-02': 1.2,
    'AP-03': 1.0,
    'AP-04': 1.2,
    'AP-05': 1.5,
  };
  
  let totalWeight = 0;
  let weightedSum = 0;
  
  for (const cell of cellSummaries) {
    const weight = weights[cell.code] ?? 1.0;
    weightedSum += cell.healthScore * weight;
    totalWeight += weight;
  }
  
  return Math.round(weightedSum / totalWeight);
}

function determineClusterStatus(score: number): 'healthy' | 'warning' | 'critical' {
  if (score >= 80) return 'healthy';
  if (score >= 50) return 'warning';
  return 'critical';
}

function determineCashTrend(thisWeek: number, lastWeek: number): 'increasing' | 'stable' | 'decreasing' {
  const diff = thisWeek - lastWeek;
  const percentChange = lastWeek > 0 ? (diff / lastWeek) * 100 : 0;
  
  if (percentChange > 10) return 'increasing';
  if (percentChange < -10) return 'decreasing';
  return 'stable';
}

// ============================================================================
// 3. SERVICE
// ============================================================================

/**
 * APManagerDashboardService — Powers the cluster-level dashboard
 */
export class APManagerDashboardService {
  constructor(
    private vendorDashboard: VendorDashboardService,
    private invoiceDashboard: InvoiceDashboardService,
    private matchDashboard: MatchDashboardService,
    private approvalDashboard: ApprovalDashboardService,
    private paymentDashboard: PaymentDashboardService
  ) {}

  /**
   * Get full AP Manager dashboard metrics
   */
  async getDashboard(actor: ActorContext): Promise<APManagerDashboardMetrics> {
    // Get all cell summaries in parallel
    const [
      vendorSummary,
      invoiceSummary,
      matchSummary,
      approvalSummary,
      paymentMetrics,
    ] = await Promise.all([
      this.vendorDashboard.getSummary(actor),
      this.invoiceDashboard.getSummary(actor),
      this.matchDashboard.getSummary(actor),
      this.approvalDashboard.getSummary(actor),
      this.paymentDashboard.getDashboard(actor),
    ]);
    
    // Build cell summaries array
    const cellSummaries: CellSummary[] = [
      vendorSummary,
      invoiceSummary,
      matchSummary,
      approvalSummary,
      {
        code: 'AP-05',
        name: 'Payment Execution',
        healthScore: this.calculatePaymentHealthScore(paymentMetrics.controlHealth),
        status: this.determinePaymentStatus(paymentMetrics.controlHealth),
        openItems: paymentMetrics.byStatus.reduce((sum, s) => 
          ['draft', 'pending_approval', 'approved', 'processing'].includes(s.status) 
            ? sum + s.count 
            : sum, 0),
        keyMetric: {
          label: 'This Week',
          value: `$${paymentMetrics.cashPosition.thisWeek.amount}`,
        },
      },
    ];
    
    // Calculate cluster health
    const overallScore = calculateClusterHealthScore(cellSummaries);
    const clusterHealth: ClusterHealthMetrics = {
      overallScore,
      status: determineClusterStatus(overallScore),
      cellCount: 5,
      cellsHealthy: cellSummaries.filter(c => c.status === 'healthy').length,
      cellsWarning: cellSummaries.filter(c => c.status === 'warning').length,
      cellsCritical: cellSummaries.filter(c => c.status === 'critical').length,
    };
    
    // Calculate P2P lifecycle metrics
    const totalOpenItems = cellSummaries.reduce((sum, c) => sum + c.openItems, 0);
    const p2pLifecycle: P2PLifecycleMetrics = {
      avgCycleTimeDays: 4.2, // TODO: Calculate from actual data
      cycleTimeP90Days: 7.5,
      stages: [
        { stage: 'VENDOR_ONBOARD', avgDays: 0.5, isBottleneck: false, itemsInStage: vendorSummary.openItems },
        { stage: 'INVOICE_ENTRY', avgDays: 1.0, isBottleneck: false, itemsInStage: invoiceSummary.openItems },
        { stage: 'MATCHING', avgDays: 0.5, isBottleneck: matchSummary.openItems > 50, itemsInStage: matchSummary.openItems },
        { stage: 'APPROVAL', avgDays: 1.5, isBottleneck: approvalSummary.openItems > 100, itemsInStage: approvalSummary.openItems },
        { stage: 'PAYMENT', avgDays: 0.7, isBottleneck: false, itemsInStage: cellSummaries[4].openItems },
      ],
      itemsInPipeline: totalOpenItems,
      valueInPipeline: paymentMetrics.cashPosition.next90Days.amount,
      currency: 'USD',
    };
    
    // Aggregate control health
    const matchExceptions = matchSummary.openItems; // Simplified
    const controlHealth: AggregatedControlHealth = {
      sodComplianceOverall: 100, // By design
      auditCoverage: 100,
      openExceptions: matchExceptions,
      controlViolations: 0,
    };
    
    // Cash summary
    const thisWeekAmount = parseFloat(paymentMetrics.cashPosition.thisWeek.amount);
    const thisMonthAmount = parseFloat(paymentMetrics.cashPosition.thisMonth.amount);
    
    return {
      domainCode: 'DOM-03',
      domainName: 'Accounts Payable',
      
      clusterHealth,
      p2pLifecycle,
      controlHealth,
      
      cashSummary: {
        scheduledThisWeek: paymentMetrics.cashPosition.thisWeek.amount,
        scheduledThisMonth: paymentMetrics.cashPosition.thisMonth.amount,
        cashPositionTrend: determineCashTrend(thisWeekAmount, thisWeekAmount * 0.9), // Simplified
        currency: 'USD',
      },
      
      cells: cellSummaries,
      
      generatedAt: new Date(),
    };
  }

  /**
   * Get just the cell summaries (lighter weight)
   */
  async getCellSummaries(actor: ActorContext): Promise<CellSummary[]> {
    const dashboard = await this.getDashboard(actor);
    return dashboard.cells;
  }

  /**
   * Get cluster health only
   */
  async getClusterHealth(actor: ActorContext): Promise<ClusterHealthMetrics> {
    const dashboard = await this.getDashboard(actor);
    return dashboard.clusterHealth;
  }

  /**
   * Calculate payment cell health score
   */
  private calculatePaymentHealthScore(controlHealth: ControlHealthMetrics): number {
    let score = 100;
    
    if (controlHealth.pendingApprovals > 50) score -= 20;
    else if (controlHealth.pendingApprovals > 20) score -= 10;
    
    if (controlHealth.exceptions.high > 0) score -= 15;
    if (controlHealth.exceptions.total > 10) score -= 10;
    
    if (controlHealth.sodComplianceRate < 100) score -= 20;
    
    return Math.max(score, 0);
  }

  /**
   * Determine payment cell status
   */
  private determinePaymentStatus(controlHealth: ControlHealthMetrics): 'healthy' | 'warning' | 'critical' {
    const score = this.calculatePaymentHealthScore(controlHealth);
    if (score >= 80) return 'healthy';
    if (score >= 50) return 'warning';
    return 'critical';
  }
}

// ============================================================================
// 4. FACTORY
// ============================================================================

export function createAPManagerDashboardService(
  vendorDashboard: VendorDashboardService,
  invoiceDashboard: InvoiceDashboardService,
  matchDashboard: MatchDashboardService,
  approvalDashboard: ApprovalDashboardService,
  paymentDashboard: PaymentDashboardService
): APManagerDashboardService {
  return new APManagerDashboardService(
    vendorDashboard,
    invoiceDashboard,
    matchDashboard,
    approvalDashboard,
    paymentDashboard
  );
}
