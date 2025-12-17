/**
 * GL-01 Chart of Accounts Cell — Barrel Export
 * 
 * Exports all public APIs for the Chart of Accounts Cell.
 * 
 * @module GL-01
 */

// Domain Service
export { AccountService, createAccountService } from './AccountService';
export type {
  ActorContext,
  SequencePort,
  AuditOutboxPort,
  PolicyPort,
  AccountRepositoryPort,
  CreateAccountData,
  UpdateAccountData,
} from './AccountService';

// Dashboard Service
export { COADashboardService } from './DashboardService';
export type {
  COADashboardMetrics,
  AccountDistribution,
  HierarchyHealth,
  COADashboardRepositoryPort,
  COADashboardServiceDeps,
} from './DashboardService';

// Domain Errors
export {
  AccountCellError,
  AccountErrorCode,
  accountNotFoundError,
  parentNotFoundError,
  invalidStateTransitionError,
  sodViolationError,
  versionConflictError,
  duplicateAccountCodeError,
  accountNotPostableError,
  accountNotActiveError,
  parentIsPostableError,
  accountHasChildrenError,
  hasOpenBalanceError,
  notPendingApprovalError,
} from './errors';
export type { AccountErrorCodeType } from './errors';
