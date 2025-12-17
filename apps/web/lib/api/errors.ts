/**
 * API Error Handling
 * 
 * Standardized error handling for all API routes.
 * Designed as prototype infrastructure for all AP cells and future departments.
 * 
 * Features:
 * - Typed error classes
 * - Consistent error response format
 * - Error logging with context
 * - Security-safe error messages (no internal details leaked)
 * 
 * @example
 * ```ts
 * import { ApiError, handleApiError, NotFoundError } from '@/lib/api/errors';
 * 
 * export async function GET(request: NextRequest) {
 *   try {
 *     const data = await service.getData();
 *     if (!data) throw new NotFoundError('Resource');
 *     return NextResponse.json(data);
 *   } catch (error) {
 *     return handleApiError(error, request);
 *   }
 * }
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

// ============================================================================
// 1. ERROR CODES
// ============================================================================

/**
 * Standard API error codes
 */
export const ErrorCode = {
  // Client errors (4xx)
  BAD_REQUEST: 'BAD_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  UNPROCESSABLE: 'UNPROCESSABLE_ENTITY',
  
  // Business logic errors
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  SOD_VIOLATION: 'SOD_VIOLATION',
  PERIOD_LOCKED: 'PERIOD_LOCKED',
  VERSION_CONFLICT: 'VERSION_CONFLICT',
  DUPLICATE_DETECTED: 'DUPLICATE_DETECTED',
  INVALID_STATE: 'INVALID_STATE',
  HARD_STOP_REQUIRED: 'HARD_STOP_REQUIRED',
  
  // Server errors (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const;

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];

// ============================================================================
// 2. ERROR RESPONSE FORMAT
// ============================================================================

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  error: ErrorCodeType;
  message: string;
  details?: Record<string, unknown>;
  requestId?: string;
  timestamp: string;
}

// ============================================================================
// 3. API ERROR CLASSES
// ============================================================================

/**
 * Base API error class
 */
export class ApiError extends Error {
  readonly code: ErrorCodeType;
  readonly statusCode: number;
  readonly details?: Record<string, unknown>;
  readonly isOperational: boolean = true; // Distinguishes from programming errors
  
  constructor(
    code: ErrorCodeType,
    message: string,
    statusCode: number = 500,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    
    // Maintain proper stack trace
    Error.captureStackTrace?.(this, this.constructor);
  }
  
  toJSON(): ErrorResponse {
    return {
      error: this.code,
      message: this.message,
      details: this.details,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 400 Bad Request
 */
export class BadRequestError extends ApiError {
  constructor(message = 'Bad request', details?: Record<string, unknown>) {
    super(ErrorCode.BAD_REQUEST, message, 400, details);
    this.name = 'BadRequestError';
  }
}

/**
 * 400 Validation Error (from Zod or similar)
 */
export class ValidationError extends ApiError {
  constructor(message = 'Validation failed', details?: Record<string, unknown>) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, details);
    this.name = 'ValidationError';
  }
  
  static fromZod(error: ZodError): ValidationError {
    return new ValidationError('Invalid request data', {
      fieldErrors: error.flatten().fieldErrors,
      formErrors: error.flatten().formErrors,
    });
  }
}

/**
 * 401 Unauthorized
 */
export class UnauthorizedError extends ApiError {
  constructor(message = 'Authentication required') {
    super(ErrorCode.UNAUTHORIZED, message, 401);
    this.name = 'UnauthorizedError';
  }
}

/**
 * 403 Forbidden
 */
export class ForbiddenError extends ApiError {
  constructor(message = 'Access denied', details?: Record<string, unknown>) {
    super(ErrorCode.FORBIDDEN, message, 403, details);
    this.name = 'ForbiddenError';
  }
}

/**
 * 403 Insufficient Permissions (specific permission denied)
 */
export class PermissionDeniedError extends ApiError {
  constructor(
    requiredPermission?: string,
    message = 'Insufficient permissions'
  ) {
    super(ErrorCode.INSUFFICIENT_PERMISSIONS, message, 403, {
      requiredPermission,
    });
    this.name = 'PermissionDeniedError';
  }
}

/**
 * 403 Segregation of Duties Violation
 */
export class SoDViolationError extends ApiError {
  constructor(
    action: string,
    conflictingAction: string,
    message = 'Segregation of duties violation'
  ) {
    super(ErrorCode.SOD_VIOLATION, message, 403, {
      action,
      conflictingAction,
      description: 'The same user cannot perform both actions',
    });
    this.name = 'SoDViolationError';
  }
}

/**
 * 404 Not Found
 */
export class NotFoundError extends ApiError {
  constructor(resource = 'Resource', id?: string) {
    const message = id ? `${resource} not found: ${id}` : `${resource} not found`;
    super(ErrorCode.NOT_FOUND, message, 404, { resource, id });
    this.name = 'NotFoundError';
  }
}

/**
 * 409 Conflict (optimistic locking, duplicate, etc.)
 */
export class ConflictError extends ApiError {
  constructor(message = 'Resource conflict', details?: Record<string, unknown>) {
    super(ErrorCode.CONFLICT, message, 409, details);
    this.name = 'ConflictError';
  }
}

/**
 * 409 Version Conflict (optimistic locking)
 */
export class VersionConflictError extends ApiError {
  constructor(
    resourceId: string,
    expectedVersion: number,
    actualVersion: number
  ) {
    super(
      ErrorCode.VERSION_CONFLICT,
      'Resource was modified by another user. Please refresh and try again.',
      409,
      { resourceId, expectedVersion, actualVersion }
    );
    this.name = 'VersionConflictError';
  }
}

/**
 * 422 Unprocessable Entity (business logic error)
 */
export class UnprocessableError extends ApiError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(ErrorCode.UNPROCESSABLE, message, 422, details);
    this.name = 'UnprocessableError';
  }
}

/**
 * 422 Period Locked
 */
export class PeriodLockedError extends ApiError {
  constructor(period: string, message = 'Fiscal period is locked') {
    super(ErrorCode.PERIOD_LOCKED, message, 422, { period });
    this.name = 'PeriodLockedError';
  }
}

/**
 * 422 Invalid State Transition
 */
export class InvalidStateError extends ApiError {
  constructor(
    currentState: string,
    targetState: string,
    message = 'Invalid state transition'
  ) {
    super(ErrorCode.INVALID_STATE, message, 422, {
      currentState,
      targetState,
      description: `Cannot transition from ${currentState} to ${targetState}`,
    });
    this.name = 'InvalidStateError';
  }
}

/**
 * 429 Rate Limited
 */
export class RateLimitedError extends ApiError {
  constructor(retryAfter: number, message = 'Too many requests') {
    super(ErrorCode.RATE_LIMITED, message, 429, { retryAfter });
    this.name = 'RateLimitedError';
  }
}

/**
 * 500 Internal Server Error
 */
export class InternalError extends ApiError {
  constructor(message = 'An unexpected error occurred') {
    super(ErrorCode.INTERNAL_ERROR, message, 500);
    this.name = 'InternalError';
  }
}

/**
 * 503 Service Unavailable
 */
export class ServiceUnavailableError extends ApiError {
  constructor(service?: string, message = 'Service temporarily unavailable') {
    super(ErrorCode.SERVICE_UNAVAILABLE, message, 503, { service });
    this.name = 'ServiceUnavailableError';
  }
}

// ============================================================================
// 4. ERROR HANDLER
// ============================================================================

/**
 * Generate a request ID for error tracking
 */
function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Extract safe error context for logging
 */
function extractErrorContext(error: unknown): Record<string, unknown> {
  if (error instanceof ApiError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
      stack: error.stack,
    };
  }
  
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  
  return { error: String(error) };
}

/**
 * Log error with context
 */
function logError(
  error: unknown,
  request: NextRequest,
  requestId: string
): void {
  const logContext = {
    requestId,
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent'),
    error: extractErrorContext(error),
  };
  
  if (error instanceof ApiError && error.isOperational) {
    // Expected errors - log at warn level
    console.warn('[API Error]', JSON.stringify(logContext));
  } else {
    // Unexpected errors - log at error level
    console.error('[API Error - Unexpected]', JSON.stringify(logContext));
  }
}

/**
 * Handle any error and return appropriate response
 */
export function handleApiError(
  error: unknown,
  request: NextRequest
): NextResponse<ErrorResponse> {
  const requestId = generateRequestId();
  
  // Log the error
  logError(error, request, requestId);
  
  // Handle known API errors
  if (error instanceof ApiError) {
    const response = NextResponse.json<ErrorResponse>(
      {
        ...error.toJSON(),
        requestId,
      },
      { status: error.statusCode }
    );
    
    // Add special headers for specific errors
    if (error instanceof RateLimitedError && error.details?.retryAfter) {
      response.headers.set('Retry-After', String(error.details.retryAfter));
    }
    
    if (error instanceof VersionConflictError && error.details?.actualVersion) {
      response.headers.set('X-Current-Version', String(error.details.actualVersion));
    }
    
    return response;
  }
  
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json<ErrorResponse>(
      {
        error: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid request data',
        details: {
          fieldErrors: error.flatten().fieldErrors,
          formErrors: error.flatten().formErrors,
        },
        requestId,
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }
  
  // Handle JSON parse errors
  if (error instanceof SyntaxError && error.message.includes('JSON')) {
    return NextResponse.json<ErrorResponse>(
      {
        error: ErrorCode.BAD_REQUEST,
        message: 'Invalid JSON in request body',
        requestId,
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }
  
  // Unknown error - return generic 500
  return NextResponse.json<ErrorResponse>(
    {
      error: ErrorCode.INTERNAL_ERROR,
      message: 'An unexpected error occurred',
      requestId,
      timestamp: new Date().toISOString(),
    },
    { status: 500 }
  );
}

// ============================================================================
// 5. HELPER FUNCTIONS
// ============================================================================

/**
 * Create a try-catch wrapper for route handlers
 * 
 * @example
 * ```ts
 * export const GET = withErrorHandler(async (request) => {
 *   const data = await service.getData();
 *   return NextResponse.json(data);
 * });
 * ```
 */
export function withErrorHandler<T>(
  handler: (request: NextRequest) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(request);
    } catch (error) {
      return handleApiError(error, request);
    }
  };
}

/**
 * Assert a condition or throw an error
 * 
 * @example
 * ```ts
 * assertOrThrow(user.role === 'admin', new ForbiddenError('Admin access required'));
 * ```
 */
export function assertOrThrow(condition: boolean, error: ApiError): asserts condition {
  if (!condition) {
    throw error;
  }
}

/**
 * Assert resource exists or throw NotFoundError
 */
export function assertExists<T>(
  value: T | null | undefined,
  resource: string,
  id?: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new NotFoundError(resource, id);
  }
}
