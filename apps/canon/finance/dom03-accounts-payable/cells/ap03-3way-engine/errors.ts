/**
 * AP-03: 3-Way Match & Controls Engine — Domain Errors
 * 
 * Custom error classes for match evaluation, tolerance, and exception handling.
 * Each error maps to appropriate HTTP status codes for BFF layer.
 */

// ============================================================================
// BASE ERROR
// ============================================================================

/**
 * Base error class for all AP-03 match-related errors
 */
export abstract class MatchCellError extends Error {
  abstract readonly code: string;
  abstract readonly httpStatus: number;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace?.(this, this.constructor);
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
      name: this.name,
    };
  }
}

/**
 * Type guard for MatchCellError
 */
export function isMatchCellError(error: unknown): error is MatchCellError {
  return error instanceof MatchCellError;
}

// ============================================================================
// NOT FOUND ERRORS
// ============================================================================

export class MatchResultNotFoundError extends MatchCellError {
  readonly code = 'MATCH_RESULT_NOT_FOUND';
  readonly httpStatus = 404;

  constructor(matchResultId: string) {
    super(`Match result not found: ${matchResultId}`);
  }
}

export class MatchExceptionNotFoundError extends MatchCellError {
  readonly code = 'MATCH_EXCEPTION_NOT_FOUND';
  readonly httpStatus = 404;

  constructor(exceptionId: string) {
    super(`Match exception not found: ${exceptionId}`);
  }
}

export class InvoiceNotFoundForMatchError extends MatchCellError {
  readonly code = 'INVOICE_NOT_FOUND_FOR_MATCH';
  readonly httpStatus = 404;

  constructor(invoiceId: string) {
    super(`Invoice not found for match evaluation: ${invoiceId}`);
  }
}

// ============================================================================
// CONCURRENCY ERRORS
// ============================================================================

export class MatchConcurrencyError extends MatchCellError {
  readonly code = 'MATCH_CONCURRENCY_CONFLICT';
  readonly httpStatus = 409;

  constructor(matchResultId: string, expectedVersion: number, actualVersion: number) {
    super(
      `Concurrency conflict for match result ${matchResultId}: expected version ${expectedVersion}, found ${actualVersion}`
    );
  }
}

// ============================================================================
// MATCH EVALUATION ERRORS
// ============================================================================

export class MatchAlreadyExistsError extends MatchCellError {
  readonly code = 'MATCH_ALREADY_EXISTS';
  readonly httpStatus = 409;

  constructor(invoiceId: string, existingMatchId?: string) {
    super(
      `Match result already exists for invoice ${invoiceId}` +
      (existingMatchId ? `. Existing match: ${existingMatchId}` : '')
    );
  }
}

export class InvoiceNotSubmittedError extends MatchCellError {
  readonly code = 'INVOICE_NOT_SUBMITTED';
  readonly httpStatus = 422;

  constructor(invoiceId: string, currentStatus: string) {
    super(
      `Invoice ${invoiceId} is not in submitted status. Current status: ${currentStatus}`
    );
  }
}

export class MatchModeNotConfiguredError extends MatchCellError {
  readonly code = 'MATCH_MODE_NOT_CONFIGURED';
  readonly httpStatus = 500;

  constructor(tenantId: string, vendorId?: string) {
    super(
      `Match mode not configured for tenant ${tenantId}` +
      (vendorId ? `, vendor ${vendorId}` : '')
    );
  }
}

// ============================================================================
// PO/GRN ERRORS (External Dependencies)
// ============================================================================

export class PurchaseOrderNotFoundError extends MatchCellError {
  readonly code = 'PURCHASE_ORDER_NOT_FOUND';
  readonly httpStatus = 422;

  constructor(poNumber: string) {
    super(`Purchase order not found: ${poNumber}`);
  }
}

export class PurchaseOrderPortUnavailableError extends MatchCellError {
  readonly code = 'PURCHASE_ORDER_PORT_UNAVAILABLE';
  readonly httpStatus = 503;

  constructor() {
    super('Purchase order service is temporarily unavailable');
  }
}

export class GoodsReceiptNotFoundError extends MatchCellError {
  readonly code = 'GOODS_RECEIPT_NOT_FOUND';
  readonly httpStatus = 422;

  constructor(grnNumber: string) {
    super(`Goods receipt (GRN) not found: ${grnNumber}`);
  }
}

export class GoodsReceiptPortUnavailableError extends MatchCellError {
  readonly code = 'GOODS_RECEIPT_PORT_UNAVAILABLE';
  readonly httpStatus = 503;

  constructor() {
    super('Goods receipt service is temporarily unavailable');
  }
}

export class InsufficientGoodsReceivedError extends MatchCellError {
  readonly code = 'INSUFFICIENT_GOODS_RECEIVED';
  readonly httpStatus = 422;

  constructor(invoiceQty: number, receivedQty: number) {
    super(
      `Insufficient goods received: invoice quantity ${invoiceQty}, received quantity ${receivedQty}`
    );
  }
}

// ============================================================================
// TOLERANCE ERRORS
// ============================================================================

export class ToleranceExceededError extends MatchCellError {
  readonly code = 'TOLERANCE_EXCEEDED';
  readonly httpStatus = 422;

  constructor(
    toleranceType: 'price' | 'quantity' | 'amount',
    variance: number,
    tolerance: number
  ) {
    super(
      `${toleranceType.charAt(0).toUpperCase() + toleranceType.slice(1)} tolerance exceeded: ` +
      `variance ${variance}${toleranceType === 'amount' ? ' cents' : '%'}, tolerance ±${tolerance}${toleranceType === 'amount' ? ' cents' : '%'}`
    );
  }
}

export class ToleranceConfigurationError extends MatchCellError {
  readonly code = 'TOLERANCE_CONFIGURATION_ERROR';
  readonly httpStatus = 500;

  constructor(message: string) {
    super(`Tolerance configuration error: ${message}`);
  }
}

// ============================================================================
// EXCEPTION ERRORS
// ============================================================================

export class ExceptionAlreadyResolvedError extends MatchCellError {
  readonly code = 'EXCEPTION_ALREADY_RESOLVED';
  readonly httpStatus = 409;

  constructor(exceptionId: string) {
    super(`Exception ${exceptionId} has already been resolved`);
  }
}

export class InvalidExceptionResolutionError extends MatchCellError {
  readonly code = 'INVALID_EXCEPTION_RESOLUTION';
  readonly httpStatus = 422;

  constructor(exceptionId: string, reason: string) {
    super(`Cannot resolve exception ${exceptionId}: ${reason}`);
  }
}

// ============================================================================
// OVERRIDE ERRORS
// ============================================================================

export class OverrideNotAllowedError extends MatchCellError {
  readonly code = 'OVERRIDE_NOT_ALLOWED';
  readonly httpStatus = 403;

  constructor(matchResultId: string, reason: string) {
    super(`Override not allowed for match result ${matchResultId}: ${reason}`);
  }
}

export class OverrideSoDViolationError extends MatchCellError {
  readonly code = 'OVERRIDE_SOD_VIOLATION';
  readonly httpStatus = 403;

  constructor(matchResultId: string, createdBy: string, approverUserId: string) {
    super(
      `SoD violation: Match result ${matchResultId} was created by user ${createdBy}. ` +
      `Cannot be overridden by same user ${approverUserId}`
    );
  }
}

export class OverrideAlreadyAppliedError extends MatchCellError {
  readonly code = 'OVERRIDE_ALREADY_APPLIED';
  readonly httpStatus = 409;

  constructor(matchResultId: string) {
    super(`Match result ${matchResultId} has already been overridden`);
  }
}

export class OverrideReasonRequiredError extends MatchCellError {
  readonly code = 'OVERRIDE_REASON_REQUIRED';
  readonly httpStatus = 422;

  constructor() {
    super('Override reason is required');
  }
}

// ============================================================================
// IMMUTABILITY ERRORS
// ============================================================================

export class MatchResultImmutableError extends MatchCellError {
  readonly code = 'MATCH_RESULT_IMMUTABLE';
  readonly httpStatus = 422;

  constructor(matchResultId: string, invoiceStatus: string) {
    super(
      `Match result ${matchResultId} is immutable: invoice is in ${invoiceStatus} status`
    );
  }
}

// ============================================================================
// STATUS ERRORS
// ============================================================================

export class InvalidMatchStatusError extends MatchCellError {
  readonly code = 'INVALID_MATCH_STATUS';
  readonly httpStatus = 422;

  constructor(currentStatus: string, expectedStatus: string | string[]) {
    const expected = Array.isArray(expectedStatus)
      ? expectedStatus.join(' or ')
      : expectedStatus;
    super(`Invalid match status: expected ${expected}, got ${currentStatus}`);
  }
}

export class MatchNotPassedError extends MatchCellError {
  readonly code = 'MATCH_NOT_PASSED';
  readonly httpStatus = 422;

  constructor(matchResultId: string, currentStatus: string) {
    super(
      `Match result ${matchResultId} has not passed. Current status: ${currentStatus}. ` +
      `Invoice cannot proceed to approval.`
    );
  }
}
