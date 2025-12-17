/**
 * AR-01 Customer Master - BFF Error Handler
 * 
 * Maps domain errors to API responses.
 * 
 * @module AR-01
 */

import { NextResponse } from 'next/server';
import { CustomerCellError, CustomerErrorCode } from '@/apps/canon/finance/dom04-accounts-receivable/cells/ar01-customer-master/errors';
import {
  handleApiError,
  NotFoundError,
  ConflictError,
  InvalidStateError,
  SoDViolationError,
  VersionConflictError,
  ValidationError,
  type ErrorResponse,
} from '@/lib/api';
import { ZodError } from 'zod';

/**
 * Handle customer domain errors and return appropriate HTTP response
 */
export function handleCustomerError(
  error: unknown,
  operation: string
): NextResponse<ErrorResponse> {
  // Map CustomerCellError to API errors
  if (error instanceof CustomerCellError) {
    switch (error.code) {
      case CustomerErrorCode.CUSTOMER_NOT_FOUND:
      case CustomerErrorCode.ADDRESS_NOT_FOUND:
      case CustomerErrorCode.CONTACT_NOT_FOUND:
      case CustomerErrorCode.CREDIT_CHANGE_NOT_FOUND:
        return handleApiError(
          new NotFoundError('Customer', error.details?.customerId as string),
          { method: 'POST', url: `/api/ar/customers/${operation}` } as Request
        );
      
      case CustomerErrorCode.DUPLICATE_TAX_ID:
      case CustomerErrorCode.DUPLICATE_CUSTOMER_CODE:
      case CustomerErrorCode.PENDING_CREDIT_CHANGE:
        return handleApiError(
          new ConflictError(error.message, error.details),
          { method: 'POST', url: `/api/ar/customers/${operation}` } as Request
        );
      
      case CustomerErrorCode.INVALID_STATE:
      case CustomerErrorCode.INVALID_STATE_TRANSITION:
      case CustomerErrorCode.ARCHIVED_IMMUTABLE:
        return handleApiError(
          new InvalidStateError(
            error.details?.currentStatus as string ?? 'unknown',
            error.details?.targetStatus as string ?? 'unknown',
            error.message
          ),
          { method: 'POST', url: `/api/ar/customers/${operation}` } as Request
        );
      
      case CustomerErrorCode.SOD_VIOLATION:
        return handleApiError(
          new SoDViolationError(
            error.details?.action as string ?? operation,
            'create',
            error.message
          ),
          { method: 'POST', url: `/api/ar/customers/${operation}` } as Request
        );
      
      case CustomerErrorCode.VERSION_CONFLICT:
        return handleApiError(
          new VersionConflictError(
            error.details?.customerId as string ?? 'unknown',
            error.details?.expectedVersion as number ?? 0,
            0 // Actual version unknown
          ),
          { method: 'POST', url: `/api/ar/customers/${operation}` } as Request
        );
      
      default:
        // Unknown CustomerCellError - log and return generic error
        console.error(`Unhandled CustomerCellError: ${error.code}`, error);
        return handleApiError(error, { method: 'POST', url: `/api/ar/customers/${operation}` } as Request);
    }
  }
  
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return handleApiError(
      ValidationError.fromZod(error),
      { method: 'POST', url: `/api/ar/customers/${operation}` } as Request
    );
  }
  
  // Pass through to generic handler
  return handleApiError(error, { method: 'POST', url: `/api/ar/customers/${operation}` } as Request);
}

/**
 * Return validation error response from Zod field errors
 */
export function validationErrorResponse(
  fieldErrors: Record<string, string[] | undefined>
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      error: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      details: { fieldErrors },
      timestamp: new Date().toISOString(),
    },
    { status: 400 }
  );
}
