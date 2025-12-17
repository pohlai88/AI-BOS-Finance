/**
 * GL-03 Posting Engine - Domain Errors
 * 
 * Custom error classes for posting operations.
 * Maps to API error responses in the BFF layer.
 * 
 * @module GL-03
 */

// =============================================================================
// Error Codes
// =============================================================================

export const PostingErrorCode = {
  // Balance
  UNBALANCED_ENTRY: 'UNBALANCED_ENTRY',
  INVALID_LINE_AMOUNTS: 'INVALID_LINE_AMOUNTS',
  NO_LINES: 'NO_LINES',
  MIXED_CURRENCIES: 'MIXED_CURRENCIES',
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  
  // Account
  ACCOUNT_NOT_FOUND: 'ACCOUNT_NOT_FOUND',
  ACCOUNT_INACTIVE: 'ACCOUNT_INACTIVE',
  ACCOUNT_NOT_POSTABLE: 'ACCOUNT_NOT_POSTABLE',
  CURRENCY_MISMATCH: 'CURRENCY_MISMATCH',
  
  // Period
  PERIOD_CLOSED: 'PERIOD_CLOSED',
  PERIOD_NOT_FOUND: 'PERIOD_NOT_FOUND',
  ENTRY_TYPE_NOT_ALLOWED: 'ENTRY_TYPE_NOT_ALLOWED',
  
  // Idempotency
  ALREADY_POSTED: 'ALREADY_POSTED',
  DUPLICATE_REFERENCE: 'DUPLICATE_REFERENCE',
  
  // Reversal
  ALREADY_REVERSED: 'ALREADY_REVERSED',
  POSTING_NOT_FOUND: 'POSTING_NOT_FOUND',
  CANNOT_REVERSE_REVERSAL: 'CANNOT_REVERSE_REVERSAL',
  
  // Source
  INVALID_SOURCE_TYPE: 'INVALID_SOURCE_TYPE',
  SOURCE_NOT_FOUND: 'SOURCE_NOT_FOUND',
  SOURCE_NOT_APPROVED: 'SOURCE_NOT_APPROVED',
  
  // Immutability
  LEDGER_IMMUTABLE: 'LEDGER_IMMUTABLE',
  
  // System
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  SEQUENCE_GENERATION_FAILED: 'SEQUENCE_GENERATION_FAILED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  TENANT_MISMATCH: 'TENANT_MISMATCH',
} as const;

export type PostingErrorCodeType = typeof PostingErrorCode[keyof typeof PostingErrorCode];

// =============================================================================
// HTTP Status Mapping
// =============================================================================

const ERROR_HTTP_STATUS: Record<PostingErrorCodeType, number> = {
  UNBALANCED_ENTRY: 400,
  INVALID_LINE_AMOUNTS: 400,
  NO_LINES: 400,
  MIXED_CURRENCIES: 400,
  INVALID_AMOUNT: 400,
  ACCOUNT_NOT_FOUND: 400,
  ACCOUNT_INACTIVE: 400,
  ACCOUNT_NOT_POSTABLE: 400,
  CURRENCY_MISMATCH: 400,
  PERIOD_CLOSED: 422,
  PERIOD_NOT_FOUND: 400,
  ENTRY_TYPE_NOT_ALLOWED: 422,
  ALREADY_POSTED: 409,
  DUPLICATE_REFERENCE: 409,
  ALREADY_REVERSED: 409,
  POSTING_NOT_FOUND: 404,
  CANNOT_REVERSE_REVERSAL: 400,
  INVALID_SOURCE_TYPE: 400,
  SOURCE_NOT_FOUND: 404,
  SOURCE_NOT_APPROVED: 400,
  LEDGER_IMMUTABLE: 400,
  INTERNAL_ERROR: 500,
  TRANSACTION_FAILED: 500,
  SEQUENCE_GENERATION_FAILED: 500,
  UNAUTHORIZED: 403,
  TENANT_MISMATCH: 403,
};

// =============================================================================
// Error Class
// =============================================================================

/**
 * Posting Engine Cell Error
 * 
 * Domain error for posting operations.
 */
export class PostingEngineCellError extends Error {
  readonly code: PostingErrorCodeType;
  readonly httpStatus: number;
  readonly details?: Record<string, unknown>;
  readonly isOperational: boolean = true;

  constructor(
    code: PostingErrorCodeType,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'PostingEngineCellError';
    this.code = code;
    this.httpStatus = ERROR_HTTP_STATUS[code] ?? 500;
    this.details = details;

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

export function unbalancedEntryError(
  totalDebit: string,
  totalCredit: string
): PostingEngineCellError {
  return new PostingEngineCellError(
    PostingErrorCode.UNBALANCED_ENTRY,
    `Entry is not balanced. Debit: ${totalDebit}, Credit: ${totalCredit}`,
    { totalDebit, totalCredit }
  );
}

export function accountNotFoundError(accountCode: string): PostingEngineCellError {
  return new PostingEngineCellError(
    PostingErrorCode.ACCOUNT_NOT_FOUND,
    `Account not found: ${accountCode}`,
    { accountCode }
  );
}

export function accountInactiveError(
  accountCode: string,
  status: string
): PostingEngineCellError {
  return new PostingEngineCellError(
    PostingErrorCode.ACCOUNT_INACTIVE,
    `Account ${accountCode} is not active (status: ${status})`,
    { accountCode, status }
  );
}

export function accountNotPostableError(accountCode: string): PostingEngineCellError {
  return new PostingEngineCellError(
    PostingErrorCode.ACCOUNT_NOT_POSTABLE,
    `Account ${accountCode} is not postable (summary account)`,
    { accountCode }
  );
}

export function periodClosedError(
  periodCode: string,
  status: string
): PostingEngineCellError {
  return new PostingEngineCellError(
    PostingErrorCode.PERIOD_CLOSED,
    `Cannot post to period ${periodCode}: status is ${status}`,
    { periodCode, status }
  );
}

export function alreadyPostedError(
  sourceType: string,
  sourceId: string,
  existingReference: string
): PostingEngineCellError {
  return new PostingEngineCellError(
    PostingErrorCode.ALREADY_POSTED,
    `Already posted: ${sourceType}/${sourceId} → ${existingReference}`,
    { sourceType, sourceId, existingReference }
  );
}

export function alreadyReversedError(
  postingReference: string,
  reversalReference: string
): PostingEngineCellError {
  return new PostingEngineCellError(
    PostingErrorCode.ALREADY_REVERSED,
    `Posting ${postingReference} already reversed by ${reversalReference}`,
    { postingReference, reversalReference }
  );
}

export function postingNotFoundError(postingReference: string): PostingEngineCellError {
  return new PostingEngineCellError(
    PostingErrorCode.POSTING_NOT_FOUND,
    `Posting not found: ${postingReference}`,
    { postingReference }
  );
}

export function entryTypeNotAllowedError(
  entryType: string,
  periodStatus: string,
  allowedTypes: string[]
): PostingEngineCellError {
  return new PostingEngineCellError(
    PostingErrorCode.ENTRY_TYPE_NOT_ALLOWED,
    `Entry type '${entryType}' not allowed when period is '${periodStatus}'`,
    { entryType, periodStatus, allowedTypes }
  );
}

export function transactionFailedError(reason: string): PostingEngineCellError {
  return new PostingEngineCellError(
    PostingErrorCode.TRANSACTION_FAILED,
    `Posting transaction failed: ${reason}`,
    { reason }
  );
}
