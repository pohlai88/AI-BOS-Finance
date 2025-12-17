/**
 * AR-03 Receipt Processing Cell — Barrel Export
 * 
 * Exports all public APIs for the Receipt Processing Cell.
 * 
 * @module AR-03
 */

// Domain Service
export { ReceiptService } from './ReceiptService';
export type {
  ActorContext,
  SequencePort,
  AuditOutboxPort,
  CustomerPort,
  InvoicePort,
  FiscalTimePort,
  GLPostingPort,
} from './ReceiptService';

// Domain Errors
export {
  ReceiptCellError,
  ReceiptErrorCode,
  receiptNotFoundError,
  allocationNotFoundError,
  invalidStateTransitionError,
  sodViolationError,
  versionConflictError,
  customerNotApprovedError,
  periodClosedError,
  overAllocationError,
  insufficientUnallocatedError,
  invoiceNotPostedError,
  alreadyPostedError,
  postedImmutableError,
} from './errors';
export type { ReceiptErrorCodeType } from './errors';
