/**
 * AR-04 Credit Note Cell — Barrel Export
 * 
 * Exports all public APIs for the Credit Note Cell.
 * 
 * @module AR-04
 */

// Domain Service
export { CreditNoteService } from './CreditNoteService';
export type {
  ActorContext,
  SequencePort,
  AuditOutboxPort,
  CustomerPort,
  InvoicePort,
  FiscalTimePort,
  GLPostingPort,
} from './CreditNoteService';

// Domain Errors
export {
  CreditNoteCellError,
  CreditNoteErrorCode,
  creditNoteNotFoundError,
  lineNotFoundError,
  invalidStateTransitionError,
  sodViolationError,
  versionConflictError,
  customerNotApprovedError,
  periodClosedError,
  noLinesError,
  overApplicationError,
  insufficientUnappliedError,
  alreadyPostedError,
  postedImmutableError,
  invoiceNotFoundError,
} from './errors';
export type { CreditNoteErrorCodeType } from './errors';
