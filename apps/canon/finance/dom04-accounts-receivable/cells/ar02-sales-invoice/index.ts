/**
 * AR-02 Sales Invoice Cell — Barrel Export
 * 
 * Exports all public APIs for the Sales Invoice Cell.
 * 
 * @module AR-02
 */

// Domain Service
export { InvoiceService } from './InvoiceService';
export type {
  ActorContext,
  SequencePort,
  AuditOutboxPort,
  CustomerPort,
  FiscalTimePort,
  GLPostingPort,
} from './InvoiceService';

// Domain Errors
export {
  InvoiceCellError,
  InvoiceErrorCode,
  invoiceNotFoundError,
  lineNotFoundError,
  invalidStateTransitionError,
  sodViolationError,
  versionConflictError,
  duplicateInvoiceError,
  customerNotApprovedError,
  periodClosedError,
  noLinesError,
  postedImmutableError,
  alreadyPostedError,
  creditLimitExceededError,
} from './errors';
export type { InvoiceErrorCodeType } from './errors';
