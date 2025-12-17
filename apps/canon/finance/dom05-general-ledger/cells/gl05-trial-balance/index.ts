/**
 * GL-05 Trial Balance Cell — Barrel Export
 * 
 * Exports all public APIs for the Trial Balance Cell.
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

// Domain Errors
export {
  TrialBalanceCellError,
  TrialBalanceErrorCode,
  periodNotFoundError,
  snapshotNotFoundError,
  snapshotAlreadyExistsError,
  hashMismatchError,
  unbalancedTBError,
  immutableSnapshotError,
  noLedgerDataError,
} from './errors';
export type { TrialBalanceErrorCodeType } from './errors';
