/**
 * AR-01 Customer Master - Domain Errors
 * 
 * Custom error classes for customer domain operations.
 * Maps to API error responses in the BFF layer.
 * 
 * @module AR-01
 */

// =============================================================================
// Error Codes
// =============================================================================

export const CustomerErrorCode = {
  // Not found
  CUSTOMER_NOT_FOUND: 'CUSTOMER_NOT_FOUND',
  ADDRESS_NOT_FOUND: 'ADDRESS_NOT_FOUND',
  CONTACT_NOT_FOUND: 'CONTACT_NOT_FOUND',
  CREDIT_CHANGE_NOT_FOUND: 'CREDIT_CHANGE_NOT_FOUND',
  
  // State machine
  INVALID_STATE: 'INVALID_STATE',
  INVALID_STATE_TRANSITION: 'INVALID_STATE_TRANSITION',
  ARCHIVED_IMMUTABLE: 'ARCHIVED_IMMUTABLE',
  
  // Duplicates
  DUPLICATE_TAX_ID: 'DUPLICATE_TAX_ID',
  DUPLICATE_CUSTOMER_CODE: 'DUPLICATE_CUSTOMER_CODE',
  
  // SoD violations
  SOD_VIOLATION: 'SOD_VIOLATION',
  
  // Credit limit
  PENDING_CREDIT_CHANGE: 'PENDING_CREDIT_CHANGE',
  CREDIT_LIMIT_EXCEEDED: 'CREDIT_LIMIT_EXCEEDED',
  
  // Concurrency
  VERSION_CONFLICT: 'VERSION_CONFLICT',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

export type CustomerErrorCodeType = typeof CustomerErrorCode[keyof typeof CustomerErrorCode];

// =============================================================================
// HTTP Status Mapping
// =============================================================================

const ERROR_HTTP_STATUS: Record<CustomerErrorCodeType, number> = {
  CUSTOMER_NOT_FOUND: 404,
  ADDRESS_NOT_FOUND: 404,
  CONTACT_NOT_FOUND: 404,
  CREDIT_CHANGE_NOT_FOUND: 404,
  INVALID_STATE: 422,
  INVALID_STATE_TRANSITION: 422,
  ARCHIVED_IMMUTABLE: 422,
  DUPLICATE_TAX_ID: 409,
  DUPLICATE_CUSTOMER_CODE: 409,
  SOD_VIOLATION: 403,
  PENDING_CREDIT_CHANGE: 409,
  CREDIT_LIMIT_EXCEEDED: 422,
  VERSION_CONFLICT: 409,
  VALIDATION_ERROR: 400,
};

// =============================================================================
// Error Class
// =============================================================================

/**
 * Customer Cell Error
 * 
 * Domain error for customer operations.
 */
export class CustomerCellError extends Error {
  readonly code: CustomerErrorCodeType;
  readonly httpStatus: number;
  readonly details?: Record<string, unknown>;
  readonly isOperational: boolean = true;

  constructor(
    code: CustomerErrorCodeType,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'CustomerCellError';
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

export function customerNotFoundError(customerId: string): CustomerCellError {
  return new CustomerCellError(
    CustomerErrorCode.CUSTOMER_NOT_FOUND,
    `Customer not found: ${customerId}`,
    { customerId }
  );
}

export function invalidStateTransitionError(
  customerId: string,
  currentStatus: string,
  targetStatus: string
): CustomerCellError {
  return new CustomerCellError(
    CustomerErrorCode.INVALID_STATE_TRANSITION,
    `Cannot transition customer from ${currentStatus} to ${targetStatus}`,
    { customerId, currentStatus, targetStatus }
  );
}

export function sodViolationError(
  action: string,
  customerId: string,
  createdBy: string,
  actorId: string
): CustomerCellError {
  return new CustomerCellError(
    CustomerErrorCode.SOD_VIOLATION,
    `Cannot ${action} your own customer (Segregation of Duties)`,
    { customerId, createdBy, actorId, action }
  );
}

export function versionConflictError(
  customerId: string,
  expectedVersion: number
): CustomerCellError {
  return new CustomerCellError(
    CustomerErrorCode.VERSION_CONFLICT,
    'Customer was modified by another user. Please refresh and try again.',
    { customerId, expectedVersion }
  );
}

export function duplicateTaxIdError(taxId: string): CustomerCellError {
  return new CustomerCellError(
    CustomerErrorCode.DUPLICATE_TAX_ID,
    `Customer with tax ID ${taxId} already exists`,
    { taxId }
  );
}

export function archivedImmutableError(customerId: string): CustomerCellError {
  return new CustomerCellError(
    CustomerErrorCode.ARCHIVED_IMMUTABLE,
    'Archived customers cannot be modified',
    { customerId }
  );
}

export function pendingCreditChangeError(
  customerId: string,
  pendingRequestId: string
): CustomerCellError {
  return new CustomerCellError(
    CustomerErrorCode.PENDING_CREDIT_CHANGE,
    'A credit limit change request is already pending',
    { customerId, pendingRequestId }
  );
}
