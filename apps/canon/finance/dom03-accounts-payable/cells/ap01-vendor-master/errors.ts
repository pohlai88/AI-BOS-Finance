/**
 * Vendor Cell Errors
 * 
 * AP-01 Vendor Master Cell - Shared error definitions.
 * All domain-specific errors for the vendor lifecycle.
 */

// ============================================================================
// BASE ERROR
// ============================================================================

/**
 * Base class for all Vendor Cell errors.
 * Includes HTTP status code and error code for API responses.
 */
export abstract class VendorCellError extends Error {
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

export class VendorNotFoundError extends VendorCellError {
  readonly code = 'VENDOR_NOT_FOUND';
  readonly httpStatus = 404;

  constructor(id: string) {
    super(`Vendor not found: ${id}`);
  }
}

export class BankAccountNotFoundError extends VendorCellError {
  readonly code = 'BANK_ACCOUNT_NOT_FOUND';
  readonly httpStatus = 404;

  constructor(id: string) {
    super(`Bank account not found: ${id}`);
  }
}

// ============================================================================
// CONCURRENCY ERRORS
// ============================================================================

export class ConcurrencyConflictError extends VendorCellError {
  readonly code = 'CONCURRENCY_CONFLICT';
  readonly httpStatus = 409;

  constructor(expectedVersion: number, actualVersion: number) {
    super(`Vendor was modified. Expected v${expectedVersion}, found v${actualVersion}`);
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

export class SoDViolationError extends VendorCellError {
  readonly code = 'SOD_VIOLATION';
  readonly httpStatus = 403;

  constructor(reason: string) {
    super(`Segregation of Duties violation: ${reason}`);
  }
}

// ============================================================================
// VALIDATION ERRORS
// ============================================================================

export class InvalidVendorStatusError extends VendorCellError {
  readonly code = 'INVALID_VENDOR_STATUS';
  readonly httpStatus = 422;

  constructor(currentStatus: string, action: string) {
    super(`Cannot ${action} vendor in status: ${currentStatus}`);
  }
}

export class VendorNotInDraftError extends VendorCellError {
  readonly code = 'VENDOR_NOT_IN_DRAFT';
  readonly httpStatus = 422;

  constructor(currentStatus: string) {
    super(`Vendor must be in draft status to update. Current status: ${currentStatus}`);
  }
}

export class VendorAlreadyApprovedError extends VendorCellError {
  readonly code = 'VENDOR_ALREADY_APPROVED';
  readonly httpStatus = 422;

  constructor() {
    super('Vendor is already approved and cannot be modified');
  }
}

export class DuplicateVendorCodeError extends VendorCellError {
  readonly code = 'DUPLICATE_VENDOR_CODE';
  readonly httpStatus = 409;

  constructor(vendorCode: string) {
    super(`Vendor code already exists: ${vendorCode}`);
  }
}

export class DuplicateTaxIdError extends VendorCellError {
  readonly code = 'DUPLICATE_TAX_ID';
  readonly httpStatus = 409;

  constructor(taxId: string) {
    super(`Tax ID already exists: ${taxId}`);
  }
}

export class DuplicateBankAccountError extends VendorCellError {
  readonly code = 'DUPLICATE_BANK_ACCOUNT';
  readonly httpStatus = 409;

  constructor(accountNumber: string) {
    super(`Bank account already exists: ${accountNumber}`);
  }
}

export class InvalidBankAccountChangeRequestError extends VendorCellError {
  readonly code = 'INVALID_BANK_ACCOUNT_CHANGE_REQUEST';
  readonly httpStatus = 422;

  constructor(reason: string) {
    super(`Invalid bank account change request: ${reason}`);
  }
}

export class BankAccountChangeNotPendingError extends VendorCellError {
  readonly code = 'BANK_ACCOUNT_CHANGE_NOT_PENDING';
  readonly httpStatus = 422;

  constructor(currentStatus?: string) {
    super(`Bank account change request is not pending approval. Current status: ${currentStatus || 'none'}`);
  }
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isVendorCellError(error: unknown): error is VendorCellError {
  return error instanceof VendorCellError;
}
