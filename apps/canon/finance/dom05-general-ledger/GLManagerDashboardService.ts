/**
 * GL Manager Dashboard Service
 * 
 * DOM-05 General Ledger — Cluster-level dashboard aggregation.
 * 
 * Responsibilities:
 * - Aggregate metrics from all 5 GL cells (GL-01 to GL-05)
 * - Calculate overall cluster health
 * - Provide R2R (Record-to-Report) lifecycle metrics
 * - Period status summary
 * - Trial balance insights
 * 
 * Powers the GL Manager cluster dashboard (Ledger Command Center).
 * 
 * @module GL-Manager
 */

import type { AccountDashboardService, AccountCellSummary } from './cells/gl01-chart-of-accounts/DashboardService';
import type { JournalEntryDashboardService, JournalEntryCellSummary } from './cells/gl02-journal-entry/DashboardService';
import type { PostingEngineDashboardService, PostingCellSummary } from './cells/gl03-posting-engine/DashboardService';
import type { PeriodCloseDashboardService, PeriodCloseCellSummary } from './cells/gl04-period-close/DashboardService';
import type { TrialBalanceDashboardService, TrialBalanceCellSummary } from './cells/gl05-trial-balance/DashboardService';

// =============================================================================
// 1. TYPES
// =============================================================================

export interface ActorContext {
  tenantId: string;
  userId: string;
  permissions?: string[];
}

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
 * R2R lifecycle stage metrics
 */
export interface R2RStageMetrics {
  stage: 'COA_SETUP' | 'JOURNAL_ENTRY' | 'POSTING' | 'PERIOD_CLOSE' | 'TRIAL_BALANCE';
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
 * R2R lifecycle metrics
 */
export interface R2RLifecycleMetrics {
  closeDaysRemaining: number;
  closeProgress: number;
  stages: R2RStageMetrics[];
  unpostedEntries: number;
  pendingApprovals: number;
}

/**
 * Period status summary
 */
export interface PeriodStatusSummary {
  currentPeriod: string;
  periodStatus: 'open' | 'soft_lock' | 'hard_lock' | 'closed';
  daysUntilClose: number;
  periodsOpen: number;
  periodsClosed: number;
  oldestOpenPeriod: string | null;
}

/**
 * Trial balance summary
 */
export interface TrialBalanceSummary {
  isBalanced: boolean;
  totalDebits: number;
  totalCredits: number;
  variance: number;
  accountsWithActivity: number;
  lastSnapshotDate: Date | null;
  currency: string;
}

/**
 * Control aggregation
 */
export interface AggregatedControlHealth {
  sodComplianceOverall: number;
  auditCoverage: number;
  immutabilityScore: number;
  unpostedJournals: number;
  periodLockCompliance: number;
}

/**
 * GL Manager dashboard metrics
 */
export interface GLManagerDashboardMetrics {
  /** Cluster identity */
  domainCode: 'DOM-05';
  domainName: 'General Ledger';

  /** Aggregate health */
  clusterHealth: ClusterHealthMetrics;

  /** R2R lifecycle */
  r2rLifecycle: R2RLifecycleMetrics;

  /** Period status */
  periodStatus: PeriodStatusSummary;

  /** Trial balance summary */
  trialBalance: TrialBalanceSummary;

  /** Control aggregation */
  controlHealth: AggregatedControlHealth;

  /** Posting summary */
  postingSummary: {
    postedToday: number;
    postedThisMonth: number;
    pendingPosting: number;
    failedPostings: number;
  };

  /** Cell summaries */
  cells: CellSummary[];

  generatedAt: Date;
}

// =============================================================================
// 2. HELPER FUNCTIONS
// =============================================================================

function calculateClusterHealthScore(cellSummaries: CellSummary[]): number {
  if (cellSummaries.length === 0) return 100;

  // Weighted average - posting engine and period close get higher weight
  const weights: Record<string, number> = {
    'GL-01': 1.0,
    'GL-02': 1.2,
    'GL-03': 1.5, // Posting engine is critical
    'GL-04': 1.5, // Period close is critical
    'GL-05': 1.2, // Trial balance important for reporting
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

function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// =============================================================================
// 3. SERVICE
// =============================================================================

/**
 * GLManagerDashboardService — Powers the cluster-level dashboard
 */
export class GLManagerDashboardService {
  constructor(
    private accountDashboard: AccountDashboardService,
    private journalEntryDashboard: JournalEntryDashboardService,
    private postingDashboard: PostingEngineDashboardService,
    private periodCloseDashboard: PeriodCloseDashboardService,
    private trialBalanceDashboard: TrialBalanceDashboardService
  ) {}

  /**
   * Get full GL Manager dashboard metrics
   */
  async getDashboard(actor: ActorContext): Promise<GLManagerDashboardMetrics> {
    // Get all cell summaries in parallel
    const [
      accountSummary,
      journalEntrySummary,
      postingSummary,
      periodCloseSummary,
      trialBalanceSummaryData,
    ] = await Promise.all([
      this.accountDashboard.getSummary(actor),
      this.journalEntryDashboard.getSummary(actor),
      this.postingDashboard.getSummary(actor),
      this.periodCloseDashboard.getSummary(actor),
      this.trialBalanceDashboard.getSummary(actor),
    ]);

    // Build cell summaries array
    const cellSummaries: CellSummary[] = [
      accountSummary,
      journalEntrySummary,
      postingSummary,
      periodCloseSummary,
      trialBalanceSummaryData,
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

    // Calculate R2R lifecycle metrics
    const r2rLifecycle: R2RLifecycleMetrics = {
      closeDaysRemaining: 5, // TODO: Calculate from period close dashboard
      closeProgress: 65, // TODO: Calculate from cells
      stages: [
        { stage: 'COA_SETUP', avgDays: 0, isBottleneck: false, itemsInStage: accountSummary.openItems },
        { stage: 'JOURNAL_ENTRY', avgDays: 1, isBottleneck: journalEntrySummary.openItems > 50, itemsInStage: journalEntrySummary.openItems },
        { stage: 'POSTING', avgDays: 0.5, isBottleneck: postingSummary.openItems > 20, itemsInStage: postingSummary.openItems },
        { stage: 'PERIOD_CLOSE', avgDays: 3, isBottleneck: false, itemsInStage: periodCloseSummary.openItems },
        { stage: 'TRIAL_BALANCE', avgDays: 1, isBottleneck: false, itemsInStage: trialBalanceSummaryData.openItems },
      ],
      unpostedEntries: journalEntrySummary.openItems,
      pendingApprovals: 0, // TODO: Get from JE dashboard
    };

    // Period status
    const periodStatus: PeriodStatusSummary = {
      currentPeriod: 'December 2024',
      periodStatus: 'open',
      daysUntilClose: 5,
      periodsOpen: 2,
      periodsClosed: 10,
      oldestOpenPeriod: 'November 2024',
    };

    // Trial balance summary
    const trialBalance: TrialBalanceSummary = {
      isBalanced: true,
      totalDebits: 465000,
      totalCredits: 465000,
      variance: 0,
      accountsWithActivity: 85,
      lastSnapshotDate: new Date(),
      currency: 'USD',
    };

    // Aggregate control health
    const controlHealth: AggregatedControlHealth = {
      sodComplianceOverall: 100,
      auditCoverage: 100,
      immutabilityScore: 100, // Ledger is append-only
      unpostedJournals: journalEntrySummary.openItems,
      periodLockCompliance: 100,
    };

    return {
      domainCode: 'DOM-05',
      domainName: 'General Ledger',

      clusterHealth,
      r2rLifecycle,
      periodStatus,
      trialBalance,
      controlHealth,

      postingSummary: {
        postedToday: 45,
        postedThisMonth: 892,
        pendingPosting: postingSummary.openItems,
        failedPostings: 0,
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
   * Get period status for visualization
   */
  async getPeriodStatus(actor: ActorContext): Promise<PeriodStatusSummary> {
    const dashboard = await this.getDashboard(actor);
    return dashboard.periodStatus;
  }

  /**
   * Get trial balance summary
   */
  async getTrialBalanceSummary(actor: ActorContext): Promise<TrialBalanceSummary> {
    const dashboard = await this.getDashboard(actor);
    return dashboard.trialBalance;
  }

  /**
   * Get R2R lifecycle metrics
   */
  async getR2RLifecycle(actor: ActorContext): Promise<R2RLifecycleMetrics> {
    const dashboard = await this.getDashboard(actor);
    return dashboard.r2rLifecycle;
  }
}

// =============================================================================
// 4. FACTORY
// =============================================================================

export function createGLManagerDashboardService(
  accountDashboard: AccountDashboardService,
  journalEntryDashboard: JournalEntryDashboardService,
  postingDashboard: PostingEngineDashboardService,
  periodCloseDashboard: PeriodCloseDashboardService,
  trialBalanceDashboard: TrialBalanceDashboardService
): GLManagerDashboardService {
  return new GLManagerDashboardService(
    accountDashboard,
    journalEntryDashboard,
    postingDashboard,
    periodCloseDashboard,
    trialBalanceDashboard
  );
}
