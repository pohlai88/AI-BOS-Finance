/**
 * AR-05 AR Aging & Collection - Domain Errors
 * 
 * Custom error classes for aging and collection operations.
 * Maps to API error responses in the BFF layer.
 * 
 * @module AR-05
 */

// =============================================================================
// Error Codes
// =============================================================================

export const AgingErrorCode = {
  // Not found
  SNAPSHOT_NOT_FOUND: 'SNAPSHOT_NOT_FOUND',
  CUSTOMER_NOT_FOUND: 'CUSTOMER_NOT_FOUND',
  INVOICE_NOT_FOUND: 'INVOICE_NOT_FOUND',
  ACTION_NOT_FOUND: 'ACTION_NOT_FOUND',

  // Business rules
  INVALID_DATE_RANGE: 'INVALID_DATE_RANGE',
  SNAPSHOT_IN_PROGRESS: 'SNAPSHOT_IN_PROGRESS',
  FUTURE_DATE_NOT_ALLOWED: 'FUTURE_DATE_NOT_ALLOWED',

  // Concurrency
  VERSION_CONFLICT: 'VERSION_CONFLICT',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

export type AgingErrorCodeType = typeof AgingErrorCode[keyof typeof AgingErrorCode];

// =============================================================================
// HTTP Status Mapping
// =============================================================================

const ERROR_HTTP_STATUS: Record<AgingErrorCodeType, number> = {
  SNAPSHOT_NOT_FOUND: 404,
  CUSTOMER_NOT_FOUND: 404,
  INVOICE_NOT_FOUND: 404,
  ACTION_NOT_FOUND: 404,
  INVALID_DATE_RANGE: 400,
  SNAPSHOT_IN_PROGRESS: 409,
  FUTURE_DATE_NOT_ALLOWED: 400,
  VERSION_CONFLICT: 409,
  VALIDATION_ERROR: 400,
};

// =============================================================================
// Error Class
// =============================================================================

/**
 * Aging Cell Error
 * 
 * Domain error for aging and collection operations.
 */
export class AgingCellError extends Error {
  readonly code: AgingErrorCodeType;
  readonly httpStatus: number;
  readonly details?: Record<string, unknown>;
  readonly isOperational: boolean = true;

  constructor(
    code: AgingErrorCodeType,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AgingCellError';
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

export function snapshotNotFoundError(snapshotId: string): AgingCellError {
  return new AgingCellError(
    AgingErrorCode.SNAPSHOT_NOT_FOUND,
    `Snapshot not found: ${snapshotId}`,
    { snapshotId }
  );
}

export function customerNotFoundError(customerId: string): AgingCellError {
  return new AgingCellError(
    AgingErrorCode.CUSTOMER_NOT_FOUND,
    `Customer not found: ${customerId}`,
    { customerId }
  );
}

export function invoiceNotFoundError(invoiceId: string): AgingCellError {
  return new AgingCellError(
    AgingErrorCode.INVOICE_NOT_FOUND,
    `Invoice not found: ${invoiceId}`,
    { invoiceId }
  );
}

export function actionNotFoundError(actionId: string): AgingCellError {
  return new AgingCellError(
    AgingErrorCode.ACTION_NOT_FOUND,
    `Collection action not found: ${actionId}`,
    { actionId }
  );
}

export function invalidDateRangeError(
  startDate: Date,
  endDate: Date
): AgingCellError {
  return new AgingCellError(
    AgingErrorCode.INVALID_DATE_RANGE,
    'Start date must be before end date',
    { startDate, endDate }
  );
}

export function snapshotInProgressError(tenantId: string): AgingCellError {
  return new AgingCellError(
    AgingErrorCode.SNAPSHOT_IN_PROGRESS,
    'A snapshot generation is already in progress',
    { tenantId }
  );
}

export function futureDateNotAllowedError(asOfDate: Date): AgingCellError {
  return new AgingCellError(
    AgingErrorCode.FUTURE_DATE_NOT_ALLOWED,
    'Cannot generate snapshot for future date',
    { asOfDate }
  );
}

export function versionConflictError(
  actionId: string,
  expectedVersion: number
): AgingCellError {
  return new AgingCellError(
    AgingErrorCode.VERSION_CONFLICT,
    'Collection action was modified by another user. Please refresh and try again.',
    { actionId, expectedVersion }
  );
}
