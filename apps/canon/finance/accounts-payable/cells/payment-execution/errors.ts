/**
 * Payment Cell Errors
 * 
 * AP-05 Payment Execution Cell - Shared error definitions.
 * All domain-specific errors for the payment execution lifecycle.
 */

// ============================================================================
// BASE ERROR
// ============================================================================

/**
 * Base class for all Payment Cell errors.
 * Includes HTTP status code and error code for API responses.
 */
export abstract class PaymentCellError extends Error {
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

export class PaymentNotFoundError extends PaymentCellError {
  readonly code = 'NOT_FOUND';
  readonly httpStatus = 404;

  constructor(id: string) {
    super(`Payment not found: ${id}`);
  }
}

// ============================================================================
// CONCURRENCY ERRORS
// ============================================================================

export class ConcurrencyConflictError extends PaymentCellError {
  readonly code = 'CONCURRENCY_CONFLICT';
  readonly httpStatus = 409;

  constructor(expectedVersion: number, actualVersion: number) {
    super(`Payment was modified. Expected v${expectedVersion}, found v${actualVersion}`);
  }

  static fromMessage(message: string): ConcurrencyConflictError {
    const error = new ConcurrencyConflictError(0, 0);
    error.message = message;
    return error;
  }
}

// ============================================================================
// POLICY ERRORS
// ============================================================================

export class SoDViolationError extends PaymentCellError {
  readonly code = 'SOD_VIOLATION';
  readonly httpStatus = 403;

  constructor(reason: string) {
    super(`Segregation of Duties violation: ${reason}`);
  }
}

// ============================================================================
// VALIDATION ERRORS
// ============================================================================

export class PeriodClosedError extends PaymentCellError {
  readonly code = 'PERIOD_CLOSED';
  readonly httpStatus = 422;

  constructor(date: Date) {
    super(`Period is closed for date: ${date.toISOString().split('T')[0]}`);
  }
}

export class InvalidAmountError extends PaymentCellError {
  readonly code = 'INVALID_AMOUNT';
  readonly httpStatus = 400;

  constructor(message: string) {
    super(message);
  }
}

export class InvalidCurrencyError extends PaymentCellError {
  readonly code = 'INVALID_CURRENCY';
  readonly httpStatus = 400;

  constructor(currency: string) {
    super(`Invalid currency code: ${currency}. Must be a valid ISO 4217 code.`);
  }
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isPaymentCellError(error: unknown): error is PaymentCellError {
  return error instanceof PaymentCellError;
}
