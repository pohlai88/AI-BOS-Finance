/**
 * Invoice Cell Errors
 * 
 * AP-02 Invoice Entry Cell - Shared error definitions.
 * All domain-specific errors for the invoice lifecycle.
 */

// ============================================================================
// BASE ERROR
// ============================================================================

/**
 * Base class for all Invoice Cell errors.
 * Includes HTTP status code and error code for API responses.
 */
export abstract class InvoiceCellError extends Error {
  abstract readonly code: string;
  abstract readonly httpStatus: number;

  constructor(message: string) {
    super(message);
    // Ensure name is set for instanceof checks
    this.name = this.constructor.name;
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
    };
  }
}

// ============================================================================
// NOT FOUND ERRORS
// ============================================================================

export class InvoiceNotFoundError extends InvoiceCellError {
  readonly code = 'INVOICE_NOT_FOUND';
  readonly httpStatus = 404;

  constructor(id: string) {
    super(`Invoice not found: ${id}`);
  }
}

export class InvoiceLineNotFoundError extends InvoiceCellError {
  readonly code = 'INVOICE_LINE_NOT_FOUND';
  readonly httpStatus = 404;

  constructor(id: string) {
    super(`Invoice line not found: ${id}`);
  }
}

// ============================================================================
// CONCURRENCY ERRORS
// ============================================================================

export class InvoiceConcurrencyError extends InvoiceCellError {
  readonly code = 'INVOICE_CONCURRENCY_CONFLICT';
  readonly httpStatus = 409;

  constructor(expectedVersion: number, actualVersion: number) {
    super(`Invoice was modified. Expected v${expectedVersion}, found v${actualVersion}`);
  }

  static fromMessage(message: string): InvoiceConcurrencyError {
    const error = new InvoiceConcurrencyError(0, 0);
    error.message = message;
    return error;
  }
}

// ============================================================================
// VENDOR VALIDATION ERRORS
// ============================================================================

export class VendorNotApprovedError extends InvoiceCellError {
  readonly code = 'VENDOR_NOT_APPROVED';
  readonly httpStatus = 422;

  constructor(vendorId: string) {
    super(`Vendor is not approved: ${vendorId}. Invoice must link to an approved vendor.`);
  }
}

export class VendorNotFoundForInvoiceError extends InvoiceCellError {
  readonly code = 'VENDOR_NOT_FOUND_FOR_INVOICE';
  readonly httpStatus = 422;

  constructor(vendorId: string) {
    super(`Vendor not found: ${vendorId}`);
  }
}

// ============================================================================
// DUPLICATE DETECTION ERRORS
// ============================================================================

export class DuplicateInvoiceError extends InvoiceCellError {
  readonly code = 'DUPLICATE_INVOICE';
  readonly httpStatus = 409;

  constructor(
    vendorId: string,
    invoiceNumber: string,
    existingInvoiceId?: string
  ) {
    super(
      `Duplicate invoice detected: vendor ${vendorId}, invoice number ${invoiceNumber}` +
      (existingInvoiceId ? `. Existing invoice: ${existingInvoiceId}` : '')
    );
  }
}

export class PotentialDuplicateInvoiceError extends InvoiceCellError {
  readonly code = 'POTENTIAL_DUPLICATE_INVOICE';
  readonly httpStatus = 409;

  constructor(
    vendorId: string,
    invoiceNumber: string,
    matchDetails: string
  ) {
    super(
      `Potential duplicate invoice detected: vendor ${vendorId}, ` +
      `invoice ${invoiceNumber}. ${matchDetails}`
    );
  }
}

// ============================================================================
// PERIOD CUTOFF ERRORS
// ============================================================================

export class PeriodClosedError extends InvoiceCellError {
  readonly code = 'PERIOD_CLOSED';
  readonly httpStatus = 422;

  constructor(periodId: string, invoiceDate: string) {
    super(`Cannot post invoice: period ${periodId} is closed. Invoice date: ${invoiceDate}`);
  }
}

export class FuturePeriodError extends InvoiceCellError {
  readonly code = 'FUTURE_PERIOD';
  readonly httpStatus = 422;

  constructor(invoiceDate: string) {
    super(`Cannot post invoice: date ${invoiceDate} is in a future period`);
  }
}

// ============================================================================
// GL POSTING ERRORS
// ============================================================================

export class GLPostingError extends InvoiceCellError {
  readonly code = 'GL_POSTING_FAILED';
  readonly httpStatus = 500;

  constructor(reason: string) {
    super(`GL posting failed: ${reason}`);
  }
}

export class InvalidAccountCodeError extends InvoiceCellError {
  readonly code = 'INVALID_ACCOUNT_CODE';
  readonly httpStatus = 422;

  constructor(accountCode: string, reason?: string) {
    super(`Invalid account code: ${accountCode}${reason ? `. ${reason}` : ''}`);
  }
}

export class JournalNotFoundError extends InvoiceCellError {
  readonly code = 'JOURNAL_NOT_FOUND';
  readonly httpStatus = 404;

  constructor(journalHeaderId: string) {
    super(`Journal not found: ${journalHeaderId}`);
  }
}

// ============================================================================
// STATUS/STATE ERRORS
// ============================================================================

export class InvalidInvoiceStatusError extends InvoiceCellError {
  readonly code = 'INVALID_INVOICE_STATUS';
  readonly httpStatus = 422;

  constructor(currentStatus: string, action: string) {
    super(`Cannot ${action} invoice in status: ${currentStatus}`);
  }
}

export class InvoiceNotInDraftError extends InvoiceCellError {
  readonly code = 'INVOICE_NOT_IN_DRAFT';
  readonly httpStatus = 422;

  constructor(currentStatus: string) {
    super(`Invoice must be in draft status to update. Current status: ${currentStatus}`);
  }
}

export class InvoiceAlreadyPostedError extends InvoiceCellError {
  readonly code = 'INVOICE_ALREADY_POSTED';
  readonly httpStatus = 422;

  constructor() {
    super('Invoice is already posted and cannot be modified');
  }
}

export class InvoiceImmutableError extends InvoiceCellError {
  readonly code = 'INVOICE_IMMUTABLE';
  readonly httpStatus = 422;

  constructor(status: string) {
    super(`Invoice is immutable in status: ${status}. Cannot modify.`);
  }
}

// ============================================================================
// VALIDATION ERRORS
// ============================================================================

export class InvalidInvoiceAmountError extends InvoiceCellError {
  readonly code = 'INVALID_INVOICE_AMOUNT';
  readonly httpStatus = 422;

  constructor(reason: string) {
    super(`Invalid invoice amount: ${reason}`);
  }
}

export class InvoiceLinesRequiredError extends InvoiceCellError {
  readonly code = 'INVOICE_LINES_REQUIRED';
  readonly httpStatus = 422;

  constructor() {
    super('Invoice must have at least one line item');
  }
}

export class InvoiceAmountMismatchError extends InvoiceCellError {
  readonly code = 'INVOICE_AMOUNT_MISMATCH';
  readonly httpStatus = 422;

  constructor(headerTotal: number, linesTotal: number) {
    super(
      `Invoice total (${headerTotal}) does not match sum of line amounts (${linesTotal})`
    );
  }
}

export class InvalidInvoiceDateError extends InvoiceCellError {
  readonly code = 'INVALID_INVOICE_DATE';
  readonly httpStatus = 422;

  constructor(reason: string) {
    super(`Invalid invoice date: ${reason}`);
  }
}

export class DueDateBeforeInvoiceDateError extends InvoiceCellError {
  readonly code = 'DUE_DATE_BEFORE_INVOICE_DATE';
  readonly httpStatus = 422;

  constructor(invoiceDate: string, dueDate: string) {
    super(`Due date (${dueDate}) cannot be before invoice date (${invoiceDate})`);
  }
}

// ============================================================================
// VOID ERRORS
// ============================================================================

export class CannotVoidInvoiceError extends InvoiceCellError {
  readonly code = 'CANNOT_VOID_INVOICE';
  readonly httpStatus = 422;

  constructor(reason: string) {
    super(`Cannot void invoice: ${reason}`);
  }
}

export class InvoiceAlreadyVoidedError extends InvoiceCellError {
  readonly code = 'INVOICE_ALREADY_VOIDED';
  readonly httpStatus = 422;

  constructor() {
    super('Invoice is already voided');
  }
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isInvoiceCellError(error: unknown): error is InvoiceCellError {
  return error instanceof InvoiceCellError;
}
