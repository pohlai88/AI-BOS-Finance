/**
 * GL-02 Journal Entry Cell — Barrel Export
 * 
 * Exports all public APIs for the Journal Entry Cell.
 * 
 * @module GL-02
 */

// Domain Service
export { JournalEntryService } from './JournalEntryService';

// Dashboard Service
export { JEDashboardService } from './DashboardService';
export type {
  JEDashboardMetrics,
  JEAgeingBucket,
  JEDashboardRepositoryPort,
  JEDashboardServiceDeps,
} from './DashboardService';

// Types (pending refactor to kernel-core)
export {
  JournalEntryType,
  JournalEntryStatus,
} from './types';
export type {
  JournalEntry,
  JournalEntryLine,
  JournalEntryAttachment,
  CreateJournalEntryInput,
  CreateJournalEntryLineInput,
  CreateAttachmentInput,
  SubmitForApprovalInput,
  ApproveJournalEntryInput,
  RejectJournalEntryInput,
  ReverseJournalEntryInput,
  JournalEntryFilter,
  JournalEntryRepositoryPort,
  ActorContext,
} from './types';

// Domain Errors
export {
  JournalEntryCellError,
  JournalEntryErrorCode,
  entryNotFoundError,
  entryNotBalancedError,
  minimumLinesRequiredError,
  lineDebitCreditMissingError,
  lineDebitCreditBothError,
  invalidStateTransitionError,
  sodViolationError,
  versionConflictError,
  duplicateReferenceError,
  periodClosedError,
  entryTypeNotAllowedError,
  accountNotPostableError,
  accountNotActiveError,
  entryAlreadyReversedError,
  postingFailedError,
} from './errors';
export type { JournalEntryErrorCodeType } from './errors';
