/**
 * GL-05 Trial Balance — Public API
 * 
 * Barrel exports for the Trial Balance cell.
 * 
 * @module GL-05
 */

// Domain Service
export { TrialBalanceService } from './TrialBalanceService';
export type {
  ActorContext,
  TrialBalanceLine,
  TrialBalance,
  TBSnapshot,
  TBVariance,
  LedgerQueryPort,
  TBSnapshotRepositoryPort,
  TrialBalanceServiceDeps,
} from './TrialBalanceService';

// Dashboard Service
export { TBDashboardService } from './DashboardService';
export type {
  TBDashboardMetrics,
  TBTrendItem,
  TBDashboardRepositoryPort,
  TBDashboardServiceDeps,
} from './DashboardService';

// Errors
export { TrialBalanceCellError, TrialBalanceError } from './errors';
