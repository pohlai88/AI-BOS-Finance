/**
 * Vendor BFF Error Handler
 * 
 * Centralized error handling for all vendor API routes.
 * Converts domain errors to appropriate HTTP responses.
 * 
 * AP-01 Vendor Master Cell - BFF Error Handler
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
 * Handles VendorCellError instances and legacy error names.
 */
const ERROR_MAP: Record<string, ErrorMapping> = {
  // Not Found (404)
  VendorNotFoundError: { httpStatus: 404, code: 'VENDOR_NOT_FOUND' },
  BankAccountNotFoundError: { httpStatus: 404, code: 'BANK_ACCOUNT_NOT_FOUND' },

  // Concurrency (409)
  ConcurrencyConflictError: { httpStatus: 409, code: 'CONCURRENCY_CONFLICT' },

  // Duplicates (409)
  DuplicateVendorCodeError: { httpStatus: 409, code: 'DUPLICATE_VENDOR_CODE' },
  DuplicateTaxIdError: { httpStatus: 409, code: 'DUPLICATE_TAX_ID' },
  DuplicateBankAccountError: { httpStatus: 409, code: 'DUPLICATE_BANK_ACCOUNT' },

  // Policy / Authorization (403)
  SoDViolationError: { httpStatus: 403, code: 'SOD_VIOLATION' },

  // Invalid State (422)
  InvalidVendorStatusError: { httpStatus: 422, code: 'INVALID_VENDOR_STATUS' },
  VendorNotInDraftError: { httpStatus: 422, code: 'VENDOR_NOT_IN_DRAFT' },
  VendorAlreadyApprovedError: { httpStatus: 422, code: 'VENDOR_ALREADY_APPROVED' },
  IllegalVendorStateTransitionError: { httpStatus: 422, code: 'INVALID_STATE_TRANSITION' },
  InvalidBankAccountChangeRequestError: { httpStatus: 422, code: 'INVALID_BANK_CHANGE_REQUEST' },
  BankAccountChangeNotPendingError: { httpStatus: 422, code: 'BANK_CHANGE_NOT_PENDING' },
};

// ============================================================================
// ERROR HANDLER
// ============================================================================

/**
 * Handle vendor operation errors and return appropriate HTTP response.
 * 
 * @param error - The caught error
 * @param operation - Name of the operation for logging (e.g., 'creating', 'approving')
 * @returns NextResponse with appropriate status and error body
 */
export function handleVendorError(
  error: unknown,
  operation: string
): NextResponse {
  // Log all errors for debugging
  console.error(`[VendorBFF] Error ${operation} vendor:`, error);

  // Handle known error types
  if (error instanceof Error) {
    const mapping = ERROR_MAP[error.name];

    if (mapping) {
      return NextResponse.json(
        { error: error.message, code: mapping.code },
        { status: mapping.httpStatus }
      );
    }

    // Check if error has httpStatus and code (VendorCellError)
    if ('httpStatus' in error && 'code' in error) {
      const vendorError = error as { httpStatus: number; code: string; message: string };
      return NextResponse.json(
        { error: vendorError.message, code: vendorError.code },
        { status: vendorError.httpStatus }
      );
    }

    // Generic validation error (from service layer)
    if (error.message.includes('must be') || error.message.includes('Invalid')) {
      return NextResponse.json(
        { error: error.message, code: 'VALIDATION_ERROR' },
        { status: 400 }
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

// ============================================================================
// NOT FOUND RESPONSE
// ============================================================================

/**
 * Create a not found error response.
 */
export function notFoundResponse(resource: string, id: string): NextResponse {
  return NextResponse.json(
    { error: `${resource} not found: ${id}`, code: `${resource.toUpperCase()}_NOT_FOUND` },
    { status: 404 }
  );
}

// ============================================================================
// UNAUTHORIZED RESPONSE
// ============================================================================

/**
 * Create an unauthorized error response.
 */
export function unauthorizedResponse(message = 'Authentication required'): NextResponse {
  return NextResponse.json(
    { error: message, code: 'UNAUTHORIZED' },
    { status: 401 }
  );
}

// ============================================================================
// FORBIDDEN RESPONSE
// ============================================================================

/**
 * Create a forbidden error response.
 */
export function forbiddenResponse(message = 'Access denied'): NextResponse {
  return NextResponse.json(
    { error: message, code: 'FORBIDDEN' },
    { status: 403 }
  );
}
