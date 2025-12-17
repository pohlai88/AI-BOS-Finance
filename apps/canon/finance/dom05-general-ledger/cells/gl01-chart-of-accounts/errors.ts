/**
 * GL-01 Chart of Accounts - Domain Errors
 * 
 * Custom error classes for COA domain operations.
 * Maps to API error responses in the BFF layer.
 * 
 * @module GL-01
 */

// =============================================================================
// Error Codes
// =============================================================================

export const AccountErrorCode = {
  // Not found
  ACCOUNT_NOT_FOUND: 'ACCOUNT_NOT_FOUND',
  PARENT_NOT_FOUND: 'PARENT_NOT_FOUND',
  GROUP_ACCOUNT_NOT_FOUND: 'GROUP_ACCOUNT_NOT_FOUND',
  MAPPING_NOT_FOUND: 'MAPPING_NOT_FOUND',
  
  // State machine
  INVALID_STATUS: 'INVALID_STATUS',
  INVALID_STATE_TRANSITION: 'INVALID_STATE_TRANSITION',
  NOT_PENDING_APPROVAL: 'NOT_PENDING_APPROVAL',
  
  // Duplicates
  DUPLICATE_ACCOUNT_CODE: 'DUPLICATE_ACCOUNT_CODE',
  MAPPING_ALREADY_EXISTS: 'MAPPING_ALREADY_EXISTS',
  
  // Hierarchy
  PARENT_IS_POSTABLE: 'PARENT_IS_POSTABLE',
  ACCOUNT_HAS_CHILDREN: 'ACCOUNT_HAS_CHILDREN',
  CIRCULAR_REFERENCE: 'CIRCULAR_REFERENCE',
  MAX_DEPTH_EXCEEDED: 'MAX_DEPTH_EXCEEDED',
  
  // Deactivation
  ACCOUNT_HAS_OPEN_BALANCE: 'ACCOUNT_HAS_OPEN_BALANCE',
  ACCOUNT_HAS_ACTIVE_CHILDREN: 'ACCOUNT_HAS_ACTIVE_CHILDREN',
  REPLACEMENT_REQUIRED: 'REPLACEMENT_REQUIRED',
  
  // SoD violations
  SOD_VIOLATION: 'SOD_VIOLATION',
  
  // Approval
  APPROVAL_REQUIRED: 'APPROVAL_REQUIRED',
  ALREADY_APPROVED: 'ALREADY_APPROVED',
  
  // Updates
  IMMUTABLE_FIELD: 'IMMUTABLE_FIELD',
  VERSION_CONFLICT: 'VERSION_CONFLICT',
  
  // Validation
  INVALID_ACCOUNT_CODE: 'INVALID_ACCOUNT_CODE',
  INVALID_ACCOUNT_TYPE: 'INVALID_ACCOUNT_TYPE',
  INVALID_NORMAL_BALANCE: 'INVALID_NORMAL_BALANCE',
  ACCOUNT_NOT_ACTIVE: 'ACCOUNT_NOT_ACTIVE',
  ACCOUNT_NOT_POSTABLE: 'ACCOUNT_NOT_POSTABLE',
  
  // System
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  TENANT_MISMATCH: 'TENANT_MISMATCH',
} as const;

export type AccountErrorCodeType = typeof AccountErrorCode[keyof typeof AccountErrorCode];

// =============================================================================
// HTTP Status Mapping
// =============================================================================

const ERROR_HTTP_STATUS: Record<AccountErrorCodeType, number> = {
  ACCOUNT_NOT_FOUND: 404,
  PARENT_NOT_FOUND: 404,
  GROUP_ACCOUNT_NOT_FOUND: 404,
  MAPPING_NOT_FOUND: 404,
  INVALID_STATUS: 422,
  INVALID_STATE_TRANSITION: 422,
  NOT_PENDING_APPROVAL: 422,
  DUPLICATE_ACCOUNT_CODE: 409,
  MAPPING_ALREADY_EXISTS: 409,
  PARENT_IS_POSTABLE: 422,
  ACCOUNT_HAS_CHILDREN: 422,
  CIRCULAR_REFERENCE: 422,
  MAX_DEPTH_EXCEEDED: 422,
  ACCOUNT_HAS_OPEN_BALANCE: 422,
  ACCOUNT_HAS_ACTIVE_CHILDREN: 422,
  REPLACEMENT_REQUIRED: 422,
  SOD_VIOLATION: 403,
  APPROVAL_REQUIRED: 422,
  ALREADY_APPROVED: 409,
  IMMUTABLE_FIELD: 422,
  VERSION_CONFLICT: 409,
  INVALID_ACCOUNT_CODE: 400,
  INVALID_ACCOUNT_TYPE: 400,
  INVALID_NORMAL_BALANCE: 400,
  ACCOUNT_NOT_ACTIVE: 422,
  ACCOUNT_NOT_POSTABLE: 422,
  INTERNAL_ERROR: 500,
  UNAUTHORIZED: 403,
  TENANT_MISMATCH: 403,
};

// =============================================================================
// Error Class
// =============================================================================

/**
 * Account Cell Error
 * 
 * Domain error for COA operations.
 */
export class AccountCellError extends Error {
  readonly code: AccountErrorCodeType;
  readonly httpStatus: number;
  readonly details?: Record<string, unknown>;
  readonly isOperational: boolean = true;

  constructor(
    code: AccountErrorCodeType,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AccountCellError';
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

export function accountNotFoundError(accountId: string): AccountCellError {
  return new AccountCellError(
    AccountErrorCode.ACCOUNT_NOT_FOUND,
    `Account not found: ${accountId}`,
    { accountId }
  );
}

export function parentNotFoundError(parentAccountId: string): AccountCellError {
  return new AccountCellError(
    AccountErrorCode.PARENT_NOT_FOUND,
    `Parent account not found: ${parentAccountId}`,
    { parentAccountId }
  );
}

export function invalidStateTransitionError(
  accountId: string,
  currentStatus: string,
  targetStatus: string
): AccountCellError {
  return new AccountCellError(
    AccountErrorCode.INVALID_STATE_TRANSITION,
    `Cannot transition account from ${currentStatus} to ${targetStatus}`,
    { accountId, currentStatus, targetStatus }
  );
}

export function sodViolationError(
  action: string,
  accountId: string,
  createdBy: string,
  actorId: string
): AccountCellError {
  return new AccountCellError(
    AccountErrorCode.SOD_VIOLATION,
    `Cannot ${action} your own account (Segregation of Duties)`,
    { accountId, createdBy, actorId, action }
  );
}

export function versionConflictError(
  accountId: string,
  expectedVersion: number
): AccountCellError {
  return new AccountCellError(
    AccountErrorCode.VERSION_CONFLICT,
    'Account was modified by another user. Please refresh and try again.',
    { accountId, expectedVersion }
  );
}

export function duplicateAccountCodeError(
  accountCode: string,
  companyId: string
): AccountCellError {
  return new AccountCellError(
    AccountErrorCode.DUPLICATE_ACCOUNT_CODE,
    `Account code ${accountCode} already exists`,
    { accountCode, companyId }
  );
}

export function accountNotPostableError(accountCode: string): AccountCellError {
  return new AccountCellError(
    AccountErrorCode.ACCOUNT_NOT_POSTABLE,
    `Account ${accountCode} is not postable (summary account)`,
    { accountCode }
  );
}

export function accountNotActiveError(
  accountCode: string,
  status: string
): AccountCellError {
  return new AccountCellError(
    AccountErrorCode.ACCOUNT_NOT_ACTIVE,
    `Account ${accountCode} is not active (status: ${status})`,
    { accountCode, status }
  );
}

export function parentIsPostableError(parentAccountCode: string): AccountCellError {
  return new AccountCellError(
    AccountErrorCode.PARENT_IS_POSTABLE,
    `Cannot add child to postable account: ${parentAccountCode}`,
    { parentAccountCode }
  );
}

export function accountHasChildrenError(
  accountCode: string,
  childCount: number
): AccountCellError {
  return new AccountCellError(
    AccountErrorCode.ACCOUNT_HAS_CHILDREN,
    `Account ${accountCode} has ${childCount} children and cannot be postable`,
    { accountCode, childCount }
  );
}

export function hasOpenBalanceError(
  accountCode: string,
  balance: string
): AccountCellError {
  return new AccountCellError(
    AccountErrorCode.ACCOUNT_HAS_OPEN_BALANCE,
    `Cannot deactivate account ${accountCode} with open balance: ${balance}`,
    { accountCode, balance }
  );
}

export function notPendingApprovalError(
  accountId: string,
  status: string
): AccountCellError {
  return new AccountCellError(
    AccountErrorCode.NOT_PENDING_APPROVAL,
    `Account ${accountId} is not pending approval (status: ${status})`,
    { accountId, status }
  );
}
