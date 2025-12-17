/**
 * AP-02 Invoice Entry Cell
 * 
 * Exports all services and errors for the invoice entry lifecycle.
 */

// ============================================================================
// ERRORS (shared)
// ============================================================================

export {
  // Base error
  InvoiceCellError,
  isInvoiceCellError,

  // Not found
  InvoiceNotFoundError,
  InvoiceLineNotFoundError,

  // Concurrency
  InvoiceConcurrencyError,

  // Vendor validation
  VendorNotApprovedError,
  VendorNotFoundForInvoiceError,

  // Duplicate detection
  DuplicateInvoiceError,
  PotentialDuplicateInvoiceError,

  // Period cutoff
  PeriodClosedError,
  FuturePeriodError,

  // GL posting
  GLPostingError,
  InvalidAccountCodeError,
  JournalNotFoundError,

  // Status/State
  InvalidInvoiceStatusError,
  InvoiceNotInDraftError,
  InvoiceAlreadyPostedError,
  InvoiceImmutableError,

  // Validation
  InvalidInvoiceAmountError,
  InvoiceLinesRequiredError,
  InvoiceAmountMismatchError,
  InvalidInvoiceDateError,
  DueDateBeforeInvoiceDateError,

  // Void
  CannotVoidInvoiceError,
  InvoiceAlreadyVoidedError,
} from './errors';

// Re-export from state machine
export { IllegalInvoiceStateTransitionError } from './InvoiceStateMachine';

// ============================================================================
// SERVICES
// ============================================================================

export { InvoiceService } from './InvoiceService';
export { PostingService } from './PostingService';
export { DuplicateDetectionService } from './DuplicateDetectionService';

// ============================================================================
// STATE MACHINE
// ============================================================================

export {
  InvoiceStateMachine,
  INVOICE_STATUS_METADATA,
  type InvoiceStatus,
  type InvoiceAction,
  type MatchStatus,
  type StatusMetadata,
} from './InvoiceStateMachine';

// ============================================================================
// SERVICE TYPES
// ============================================================================

export type {
  CreateInvoiceInput,
  CreateInvoiceLineData,
  UpdateInvoiceInput,
  VendorValidationPort,
} from './InvoiceService';

export type {
  COAValidationPort,
  PostingInput,
  JournalLineInput,
  PostingResult,
} from './PostingService';

export type {
  DuplicateCheckInput,
  DuplicateCheckResult,
  DuplicateDetectionConfig,
} from './DuplicateDetectionService';
