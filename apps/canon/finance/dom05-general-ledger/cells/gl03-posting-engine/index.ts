/**
 * GL-03 Posting Engine Cell — Barrel Export
 * 
 * Exports all public APIs for the Posting Engine Cell.
 * 
 * @module GL-03
 */

// Domain Service
export { PostingEngineService } from './PostingEngineService';
export type {
  ActorContext,
  SourceType,
  LedgerLine,
  PostingLineInput,
  PostJournalEntryInput,
  PostSubledgerInput,
  PostingResult,
  CreateReversalInput,
  ReversalResult,
  TransactionContext,
  LedgerRepositoryPort,
  JournalEntryUpdatePort,
  PostingEngineServiceDeps,
} from './PostingEngineService';

// Dashboard Service
export { PostingDashboardService } from './DashboardService';
export type {
  PostingDashboardMetrics,
  PostingTrend,
  PostingDashboardRepositoryPort,
  PostingDashboardServiceDeps,
} from './DashboardService';

// Domain Errors
export {
  PostingEngineCellError,
  PostingErrorCode,
  unbalancedEntryError,
  accountNotFoundError,
  accountInactiveError,
  accountNotPostableError,
  periodClosedError,
  alreadyPostedError,
  alreadyReversedError,
  postingNotFoundError,
  entryTypeNotAllowedError,
  transactionFailedError,
} from './errors';
export type { PostingErrorCodeType } from './errors';
