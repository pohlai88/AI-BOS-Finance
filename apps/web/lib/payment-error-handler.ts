/**
 * Payment BFF Error Handler
 * 
 * Centralized error handling for all payment API routes.
 * Converts domain errors to appropriate HTTP responses.
 */

import { NextResponse } from 'next/server';

// ============================================================================
// ERROR MAPPING
// ============================================================================

interface ErrorMapping {
  httpStatus: number;
  code: string;
}

/**
 * Map error names to HTTP responses.
 * This handles both new PaymentCellError instances and legacy error names.
 */
const ERROR_MAP: Record<string, ErrorMapping> = {
  // Not Found
  PaymentNotFoundError: { httpStatus: 404, code: 'NOT_FOUND' },

  // Concurrency
  ConcurrencyConflictError: { httpStatus: 409, code: 'CONCURRENCY_CONFLICT' },

  // Policy / Authorization
  SoDViolationError: { httpStatus: 403, code: 'SOD_VIOLATION' },

  // Validation
  PeriodClosedError: { httpStatus: 422, code: 'PERIOD_CLOSED' },
  InvalidAmountError: { httpStatus: 400, code: 'INVALID_AMOUNT' },
  InvalidCurrencyError: { httpStatus: 400, code: 'INVALID_CURRENCY' },

  // State Machine
  IllegalStateTransitionError: { httpStatus: 422, code: 'INVALID_STATE' },
};

// ============================================================================
// ERROR HANDLER
// ============================================================================

/**
 * Handle payment operation errors and return appropriate HTTP response.
 * 
 * @param error - The caught error
 * @param operation - Name of the operation for logging (e.g., 'creating', 'approving')
 * @returns NextResponse with appropriate status and error body
 */
export function handlePaymentError(
  error: unknown,
  operation: string
): NextResponse {
  // Log all errors for debugging
  console.error(`Error ${operation} payment:`, error);

  // Handle known error types
  if (error instanceof Error) {
    const mapping = ERROR_MAP[error.name];

    if (mapping) {
      return NextResponse.json(
        { error: error.message, code: mapping.code },
        { status: mapping.httpStatus }
      );
    }

    // Check if error has httpStatus and code (PaymentCellError)
    if ('httpStatus' in error && 'code' in error) {
      const paymentError = error as { httpStatus: number; code: string; message: string };
      return NextResponse.json(
        { error: paymentError.message, code: paymentError.code },
        { status: paymentError.httpStatus }
      );
    }
  }

  // Generic server error for unknown errors
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}

// ============================================================================
// VALIDATION HELPER
// ============================================================================

/**
 * Create a validation error response.
 * 
 * @param errors - Field validation errors from Zod
 * @returns NextResponse with 400 status
 */
export function validationErrorResponse(
  errors: Record<string, string[] | undefined>
): NextResponse {
  return NextResponse.json(
    {
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors,
    },
    { status: 400 }
  );
}

/**
 * Create a missing idempotency key error response.
 */
export function missingIdempotencyKeyResponse(): NextResponse {
  return NextResponse.json(
    { error: 'X-Idempotency-Key header is required', code: 'MISSING_IDEMPOTENCY_KEY' },
    { status: 400 }
  );
}
