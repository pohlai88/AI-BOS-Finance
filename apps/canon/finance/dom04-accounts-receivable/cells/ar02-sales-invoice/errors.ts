/**
 * AR-02 Sales Invoice - Domain Errors
 * 
 * Custom error classes for invoice domain operations.
 * Maps to API error responses in the BFF layer.
 * 
 * @module AR-02
 */

// =============================================================================
// Error Codes
// =============================================================================

export const InvoiceErrorCode = {
  // Not found
  INVOICE_NOT_FOUND: 'INVOICE_NOT_FOUND',
  LINE_NOT_FOUND: 'LINE_NOT_FOUND',
  CUSTOMER_NOT_FOUND: 'CUSTOMER_NOT_FOUND',

  // State machine
  INVALID_STATE: 'INVALID_STATE',
  INVALID_STATE_TRANSITION: 'INVALID_STATE_TRANSITION',
  POSTED_IMMUTABLE: 'POSTED_IMMUTABLE',
  VOIDED_IMMUTABLE: 'VOIDED_IMMUTABLE',

  // Duplicates
  DUPLICATE_INVOICE: 'DUPLICATE_INVOICE',
  DUPLICATE_INVOICE_NUMBER: 'DUPLICATE_INVOICE_NUMBER',

  // SoD violations
  SOD_VIOLATION: 'SOD_VIOLATION',

  // Business rules
  CUSTOMER_NOT_APPROVED: 'CUSTOMER_NOT_APPROVED',
  CREDIT_LIMIT_EXCEEDED: 'CREDIT_LIMIT_EXCEEDED',
  PERIOD_CLOSED: 'PERIOD_CLOSED',
  NO_LINES: 'NO_LINES',
  INVALID_ACCOUNT: 'INVALID_ACCOUNT',
  ALREADY_POSTED: 'ALREADY_POSTED',

  // Concurrency
  VERSION_CONFLICT: 'VERSION_CONFLICT',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

export type InvoiceErrorCodeType = typeof InvoiceErrorCode[keyof typeof InvoiceErrorCode];

// =============================================================================
// HTTP Status Mapping
// =============================================================================

const ERROR_HTTP_STATUS: Record<InvoiceErrorCodeType, number> = {
  INVOICE_NOT_FOUND: 404,
  LINE_NOT_FOUND: 404,
  CUSTOMER_NOT_FOUND: 404,
  INVALID_STATE: 422,
  INVALID_STATE_TRANSITION: 422,
  POSTED_IMMUTABLE: 422,
  VOIDED_IMMUTABLE: 422,
  DUPLICATE_INVOICE: 409,
  DUPLICATE_INVOICE_NUMBER: 409,
  SOD_VIOLATION: 403,
  CUSTOMER_NOT_APPROVED: 422,
  CREDIT_LIMIT_EXCEEDED: 422,
  PERIOD_CLOSED: 422,
  NO_LINES: 422,
  INVALID_ACCOUNT: 422,
  ALREADY_POSTED: 409,
  VERSION_CONFLICT: 409,
  VALIDATION_ERROR: 400,
};

// =============================================================================
// Error Class
// =============================================================================

/**
 * Invoice Cell Error
 * 
 * Domain error for invoice operations.
 */
export class InvoiceCellError extends Error {
  readonly code: InvoiceErrorCodeType;
  readonly httpStatus: number;
  readonly details?: Record<string, unknown>;
  readonly isOperational: boolean = true;

  constructor(
    code: InvoiceErrorCodeType,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'InvoiceCellError';
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

export function invoiceNotFoundError(invoiceId: string): InvoiceCellError {
  return new InvoiceCellError(
    InvoiceErrorCode.INVOICE_NOT_FOUND,
    `Invoice not found: ${invoiceId}`,
    { invoiceId }
  );
}

export function lineNotFoundError(lineId: string): InvoiceCellError {
  return new InvoiceCellError(
    InvoiceErrorCode.LINE_NOT_FOUND,
    `Invoice line not found: ${lineId}`,
    { lineId }
  );
}

export function invalidStateTransitionError(
  invoiceId: string,
  currentStatus: string,
  targetStatus: string
): InvoiceCellError {
  return new InvoiceCellError(
    InvoiceErrorCode.INVALID_STATE_TRANSITION,
    `Cannot transition invoice from ${currentStatus} to ${targetStatus}`,
    { invoiceId, currentStatus, targetStatus }
  );
}

export function sodViolationError(
  action: string,
  invoiceId: string,
  createdBy: string,
  actorId: string
): InvoiceCellError {
  return new InvoiceCellError(
    InvoiceErrorCode.SOD_VIOLATION,
    `Cannot ${action} your own invoice (Segregation of Duties)`,
    { invoiceId, createdBy, actorId, action }
  );
}

export function versionConflictError(
  invoiceId: string,
  expectedVersion: number
): InvoiceCellError {
  return new InvoiceCellError(
    InvoiceErrorCode.VERSION_CONFLICT,
    'Invoice was modified by another user. Please refresh and try again.',
    { invoiceId, expectedVersion }
  );
}

export function duplicateInvoiceError(
  matchingInvoices: Array<{ id: string; invoiceNumber: string }>
): InvoiceCellError {
  return new InvoiceCellError(
    InvoiceErrorCode.DUPLICATE_INVOICE,
    'Potential duplicate invoice detected',
    { matchingInvoices }
  );
}

export function customerNotApprovedError(
  customerId: string,
  status?: string
): InvoiceCellError {
  return new InvoiceCellError(
    InvoiceErrorCode.CUSTOMER_NOT_APPROVED,
    'Customer must be approved before invoicing',
    { customerId, status }
  );
}

export function periodClosedError(period: string): InvoiceCellError {
  return new InvoiceCellError(
    InvoiceErrorCode.PERIOD_CLOSED,
    `Cannot post to closed period: ${period}`,
    { period }
  );
}

export function noLinesError(invoiceId: string): InvoiceCellError {
  return new InvoiceCellError(
    InvoiceErrorCode.NO_LINES,
    'Invoice must have at least one line',
    { invoiceId }
  );
}

export function postedImmutableError(invoiceId: string): InvoiceCellError {
  return new InvoiceCellError(
    InvoiceErrorCode.POSTED_IMMUTABLE,
    'Posted invoices cannot be modified',
    { invoiceId }
  );
}

export function alreadyPostedError(
  invoiceId: string,
  idempotencyKey: string
): InvoiceCellError {
  return new InvoiceCellError(
    InvoiceErrorCode.ALREADY_POSTED,
    'Invoice already posted with this idempotency key',
    { invoiceId, idempotencyKey }
  );
}

export function creditLimitExceededError(
  customerId: string,
  creditLimit: number,
  currentBalance: number,
  invoiceAmount: number
): InvoiceCellError {
  return new InvoiceCellError(
    InvoiceErrorCode.CREDIT_LIMIT_EXCEEDED,
    'Invoice would exceed customer credit limit',
    { customerId, creditLimit, currentBalance, invoiceAmount }
  );
}
