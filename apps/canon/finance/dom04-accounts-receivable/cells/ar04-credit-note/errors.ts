/**
 * AR-04 Credit Note - Domain Errors
 * 
 * Custom error classes for credit note operations.
 * Maps to API error responses in the BFF layer.
 * 
 * @module AR-04
 */

// =============================================================================
// Error Codes
// =============================================================================

export const CreditNoteErrorCode = {
  // Not found
  CREDIT_NOTE_NOT_FOUND: 'CREDIT_NOTE_NOT_FOUND',
  LINE_NOT_FOUND: 'LINE_NOT_FOUND',
  CUSTOMER_NOT_FOUND: 'CUSTOMER_NOT_FOUND',
  INVOICE_NOT_FOUND: 'INVOICE_NOT_FOUND',

  // State machine
  INVALID_STATE: 'INVALID_STATE',
  INVALID_STATE_TRANSITION: 'INVALID_STATE_TRANSITION',
  POSTED_IMMUTABLE: 'POSTED_IMMUTABLE',

  // SoD violations
  SOD_VIOLATION: 'SOD_VIOLATION',

  // Business rules
  CUSTOMER_NOT_APPROVED: 'CUSTOMER_NOT_APPROVED',
  PERIOD_CLOSED: 'PERIOD_CLOSED',
  NO_LINES: 'NO_LINES',
  OVER_APPLICATION: 'OVER_APPLICATION',
  INSUFFICIENT_UNAPPLIED: 'INSUFFICIENT_UNAPPLIED',
  ALREADY_POSTED: 'ALREADY_POSTED',

  // Concurrency
  VERSION_CONFLICT: 'VERSION_CONFLICT',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

export type CreditNoteErrorCodeType = typeof CreditNoteErrorCode[keyof typeof CreditNoteErrorCode];

// =============================================================================
// HTTP Status Mapping
// =============================================================================

const ERROR_HTTP_STATUS: Record<CreditNoteErrorCodeType, number> = {
  CREDIT_NOTE_NOT_FOUND: 404,
  LINE_NOT_FOUND: 404,
  CUSTOMER_NOT_FOUND: 404,
  INVOICE_NOT_FOUND: 404,
  INVALID_STATE: 422,
  INVALID_STATE_TRANSITION: 422,
  POSTED_IMMUTABLE: 422,
  SOD_VIOLATION: 403,
  CUSTOMER_NOT_APPROVED: 422,
  PERIOD_CLOSED: 422,
  NO_LINES: 422,
  OVER_APPLICATION: 422,
  INSUFFICIENT_UNAPPLIED: 422,
  ALREADY_POSTED: 409,
  VERSION_CONFLICT: 409,
  VALIDATION_ERROR: 400,
};

// =============================================================================
// Error Class
// =============================================================================

/**
 * Credit Note Cell Error
 * 
 * Domain error for credit note operations.
 */
export class CreditNoteCellError extends Error {
  readonly code: CreditNoteErrorCodeType;
  readonly httpStatus: number;
  readonly details?: Record<string, unknown>;
  readonly isOperational: boolean = true;

  constructor(
    code: CreditNoteErrorCodeType,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'CreditNoteCellError';
    this.code = code;
    this.httpStatus = ERROR_HTTP_STATUS[code] ?? 500;
    this.details = details;

    // Maintain proper stack trace
    Error.captureStackTrace?.(this, this.constructor);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

// =============================================================================
// Error Factory Helpers
// =============================================================================

export function creditNoteNotFoundError(creditNoteId: string): CreditNoteCellError {
  return new CreditNoteCellError(
    CreditNoteErrorCode.CREDIT_NOTE_NOT_FOUND,
    `Credit note not found: ${creditNoteId}`,
    { creditNoteId }
  );
}

export function lineNotFoundError(lineId: string): CreditNoteCellError {
  return new CreditNoteCellError(
    CreditNoteErrorCode.LINE_NOT_FOUND,
    `Credit note line not found: ${lineId}`,
    { lineId }
  );
}

export function invalidStateTransitionError(
  creditNoteId: string,
  currentStatus: string,
  targetStatus: string
): CreditNoteCellError {
  return new CreditNoteCellError(
    CreditNoteErrorCode.INVALID_STATE_TRANSITION,
    `Cannot transition credit note from ${currentStatus} to ${targetStatus}`,
    { creditNoteId, currentStatus, targetStatus }
  );
}

export function sodViolationError(
  action: string,
  creditNoteId: string,
  createdBy: string,
  actorId: string
): CreditNoteCellError {
  return new CreditNoteCellError(
    CreditNoteErrorCode.SOD_VIOLATION,
    `Cannot ${action} your own credit note (Segregation of Duties)`,
    { creditNoteId, createdBy, actorId, action }
  );
}

export function versionConflictError(
  creditNoteId: string,
  expectedVersion: number
): CreditNoteCellError {
  return new CreditNoteCellError(
    CreditNoteErrorCode.VERSION_CONFLICT,
    'Credit note was modified by another user. Please refresh and try again.',
    { creditNoteId, expectedVersion }
  );
}

export function customerNotApprovedError(
  customerId: string,
  status?: string
): CreditNoteCellError {
  return new CreditNoteCellError(
    CreditNoteErrorCode.CUSTOMER_NOT_APPROVED,
    'Customer must be approved',
    { customerId, status }
  );
}

export function periodClosedError(creditNoteId: string): CreditNoteCellError {
  return new CreditNoteCellError(
    CreditNoteErrorCode.PERIOD_CLOSED,
    'Cannot post to closed period',
    { creditNoteId }
  );
}

export function noLinesError(creditNoteId: string): CreditNoteCellError {
  return new CreditNoteCellError(
    CreditNoteErrorCode.NO_LINES,
    'Credit note must have at least one line',
    { creditNoteId }
  );
}

export function overApplicationError(
  invoiceId: string,
  outstandingAmount: number,
  requestedAmount: number
): CreditNoteCellError {
  return new CreditNoteCellError(
    CreditNoteErrorCode.OVER_APPLICATION,
    'Amount exceeds invoice outstanding balance',
    { invoiceId, outstandingAmount, requestedAmount }
  );
}

export function insufficientUnappliedError(
  creditNoteId: string,
  available: number,
  requested: number
): CreditNoteCellError {
  return new CreditNoteCellError(
    CreditNoteErrorCode.INSUFFICIENT_UNAPPLIED,
    'Insufficient unapplied amount',
    { creditNoteId, available, requested }
  );
}

export function alreadyPostedError(
  creditNoteId: string,
  idempotencyKey: string
): CreditNoteCellError {
  return new CreditNoteCellError(
    CreditNoteErrorCode.ALREADY_POSTED,
    'Credit note already posted with this idempotency key',
    { creditNoteId, idempotencyKey }
  );
}

export function postedImmutableError(creditNoteId: string): CreditNoteCellError {
  return new CreditNoteCellError(
    CreditNoteErrorCode.POSTED_IMMUTABLE,
    'Posted credit notes cannot be modified',
    { creditNoteId }
  );
}

export function invoiceNotFoundError(invoiceId: string): CreditNoteCellError {
  return new CreditNoteCellError(
    CreditNoteErrorCode.INVOICE_NOT_FOUND,
    `Invoice not found: ${invoiceId}`,
    { invoiceId }
  );
}
