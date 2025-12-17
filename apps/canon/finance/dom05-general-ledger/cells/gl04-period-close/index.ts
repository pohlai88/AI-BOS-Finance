/**
 * GL-04 Period Close Cell — Barrel Export
 * 
 * Exports all public APIs for the Period Close Cell.
 * 
 * @module GL-04
 */

// Domain Service
export { PeriodCloseService } from './PeriodCloseService';
export type {
  ActorContext,
  PeriodStatus,
  Period,
  PeriodCloseTask,
  PeriodRepositoryPort,
  TrialBalancePort,
  PeriodCloseServiceDeps,
} from './PeriodCloseService';

// Dashboard Service
export { PeriodCloseDashboardService } from './DashboardService';
export type {
  PeriodCloseDashboardMetrics,
  PeriodCalendarItem,
  PeriodCloseDashboardRepositoryPort,
  PeriodCloseDashboardServiceDeps,
} from './DashboardService';

// Domain Errors
export {
  PeriodCloseCellError,
  PeriodCloseErrorCode,
  periodNotFoundError,
  invalidTransitionError,
  checklistIncompleteError,
  pendingEntriesError,
  sodViolationError,
  alreadyClosedError,
  reopenWindowExpiredError,
  tbSnapshotFailedError,
  periodOverlapError,
} from './errors';
export type { PeriodCloseErrorCodeType } from './errors';
