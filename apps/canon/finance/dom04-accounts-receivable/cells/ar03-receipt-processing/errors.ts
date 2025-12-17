/**
 * AR-03 Receipt Processing - Domain Errors
 * 
 * Custom error classes for receipt processing operations.
 * Maps to API error responses in the BFF layer.
 * 
 * @module AR-03
 */

// =============================================================================
// Error Codes
// =============================================================================

export const ReceiptErrorCode = {
  // Not found
  RECEIPT_NOT_FOUND: 'RECEIPT_NOT_FOUND',
  ALLOCATION_NOT_FOUND: 'ALLOCATION_NOT_FOUND',
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
  OVER_ALLOCATION: 'OVER_ALLOCATION',
  INSUFFICIENT_UNALLOCATED: 'INSUFFICIENT_UNALLOCATED',
  INVOICE_NOT_POSTED: 'INVOICE_NOT_POSTED',
  ALREADY_POSTED: 'ALREADY_POSTED',

  // Concurrency
  VERSION_CONFLICT: 'VERSION_CONFLICT',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

export type ReceiptErrorCodeType = typeof ReceiptErrorCode[keyof typeof ReceiptErrorCode];

// =============================================================================
// HTTP Status Mapping
// =============================================================================

const ERROR_HTTP_STATUS: Record<ReceiptErrorCodeType, number> = {
  RECEIPT_NOT_FOUND: 404,
  ALLOCATION_NOT_FOUND: 404,
  CUSTOMER_NOT_FOUND: 404,
  INVOICE_NOT_FOUND: 404,
  INVALID_STATE: 422,
  INVALID_STATE_TRANSITION: 422,
  POSTED_IMMUTABLE: 422,
  SOD_VIOLATION: 403,
  CUSTOMER_NOT_APPROVED: 422,
  PERIOD_CLOSED: 422,
  OVER_ALLOCATION: 422,
  INSUFFICIENT_UNALLOCATED: 422,
  INVOICE_NOT_POSTED: 422,
  ALREADY_POSTED: 409,
  VERSION_CONFLICT: 409,
  VALIDATION_ERROR: 400,
};

// =============================================================================
// Error Class
// =============================================================================

/**
 * Receipt Cell Error
 * 
 * Domain error for receipt processing operations.
 */
export class ReceiptCellError extends Error {
  readonly code: ReceiptErrorCodeType;
  readonly httpStatus: number;
  readonly details?: Record<string, unknown>;
  readonly isOperational: boolean = true;

  constructor(
    code: ReceiptErrorCodeType,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ReceiptCellError';
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

export function receiptNotFoundError(receiptId: string): ReceiptCellError {
  return new ReceiptCellError(
    ReceiptErrorCode.RECEIPT_NOT_FOUND,
    `Receipt not found: ${receiptId}`,
    { receiptId }
  );
}

export function allocationNotFoundError(allocationId: string): ReceiptCellError {
  return new ReceiptCellError(
    ReceiptErrorCode.ALLOCATION_NOT_FOUND,
    `Allocation not found: ${allocationId}`,
    { allocationId }
  );
}

export function invalidStateTransitionError(
  receiptId: string,
  currentStatus: string,
  targetStatus: string
): ReceiptCellError {
  return new ReceiptCellError(
    ReceiptErrorCode.INVALID_STATE_TRANSITION,
    `Cannot transition receipt from ${currentStatus} to ${targetStatus}`,
    { receiptId, currentStatus, targetStatus }
  );
}

export function sodViolationError(
  action: string,
  receiptId: string,
  createdBy: string,
  actorId: string
): ReceiptCellError {
  return new ReceiptCellError(
    ReceiptErrorCode.SOD_VIOLATION,
    `Cannot ${action} your own receipt (Segregation of Duties)`,
    { receiptId, createdBy, actorId, action }
  );
}

export function versionConflictError(
  receiptId: string,
  expectedVersion: number
): ReceiptCellError {
  return new ReceiptCellError(
    ReceiptErrorCode.VERSION_CONFLICT,
    'Receipt was modified by another user. Please refresh and try again.',
    { receiptId, expectedVersion }
  );
}

export function customerNotApprovedError(
  customerId: string,
  status?: string
): ReceiptCellError {
  return new ReceiptCellError(
    ReceiptErrorCode.CUSTOMER_NOT_APPROVED,
    'Customer must be approved',
    { customerId, status }
  );
}

export function periodClosedError(receiptId: string): ReceiptCellError {
  return new ReceiptCellError(
    ReceiptErrorCode.PERIOD_CLOSED,
    'Cannot post to closed period',
    { receiptId }
  );
}

export function overAllocationError(
  invoiceId: string,
  outstandingAmount: number,
  requestedAmount: number
): ReceiptCellError {
  return new ReceiptCellError(
    ReceiptErrorCode.OVER_ALLOCATION,
    'Amount exceeds invoice outstanding balance',
    { invoiceId, outstandingAmount, requestedAmount }
  );
}

export function insufficientUnallocatedError(
  receiptId: string,
  available: number,
  requested: number
): ReceiptCellError {
  return new ReceiptCellError(
    ReceiptErrorCode.INSUFFICIENT_UNALLOCATED,
    'Insufficient unallocated amount',
    { receiptId, available, requested }
  );
}

export function invoiceNotPostedError(
  invoiceId: string,
  status: string
): ReceiptCellError {
  return new ReceiptCellError(
    ReceiptErrorCode.INVOICE_NOT_POSTED,
    'Invoice must be posted',
    { invoiceId, status }
  );
}

export function alreadyPostedError(
  receiptId: string,
  idempotencyKey: string
): ReceiptCellError {
  return new ReceiptCellError(
    ReceiptErrorCode.ALREADY_POSTED,
    'Receipt already posted with this idempotency key',
    { receiptId, idempotencyKey }
  );
}

export function postedImmutableError(receiptId: string): ReceiptCellError {
  return new ReceiptCellError(
    ReceiptErrorCode.POSTED_IMMUTABLE,
    'Posted receipts cannot be modified',
    { receiptId }
  );
}
