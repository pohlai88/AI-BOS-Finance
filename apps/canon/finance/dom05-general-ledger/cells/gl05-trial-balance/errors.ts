/**
 * GL-05 Trial Balance - Domain Errors
 * 
 * Custom error classes for trial balance operations.
 * Maps to API error responses in the BFF layer.
 * 
 * @module GL-05
 */

// =============================================================================
// Error Codes
// =============================================================================

export const TrialBalanceErrorCode = {
  // Not found
  PERIOD_NOT_FOUND: 'PERIOD_NOT_FOUND',
  SNAPSHOT_NOT_FOUND: 'SNAPSHOT_NOT_FOUND',
  ACCOUNT_NOT_FOUND: 'ACCOUNT_NOT_FOUND',
  
  // Snapshot
  SNAPSHOT_ALREADY_EXISTS: 'SNAPSHOT_ALREADY_EXISTS',
  IMMUTABLE_SNAPSHOT: 'IMMUTABLE_SNAPSHOT',
  
  // Verification
  HASH_MISMATCH: 'HASH_MISMATCH',
  UNBALANCED_TB: 'UNBALANCED_TB',
  
  // Data
  NO_LEDGER_DATA: 'NO_LEDGER_DATA',
  
  // Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  
  // System
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type TrialBalanceErrorCodeType = typeof TrialBalanceErrorCode[keyof typeof TrialBalanceErrorCode];

// =============================================================================
// HTTP Status Mapping
// =============================================================================

const ERROR_HTTP_STATUS: Record<TrialBalanceErrorCodeType, number> = {
  PERIOD_NOT_FOUND: 404,
  SNAPSHOT_NOT_FOUND: 404,
  ACCOUNT_NOT_FOUND: 404,
  SNAPSHOT_ALREADY_EXISTS: 409,
  IMMUTABLE_SNAPSHOT: 422,
  HASH_MISMATCH: 500,
  UNBALANCED_TB: 500,
  NO_LEDGER_DATA: 400,
  UNAUTHORIZED: 403,
  INTERNAL_ERROR: 500,
};

// =============================================================================
// Error Class
// =============================================================================

/**
 * Trial Balance Cell Error
 * 
 * Domain error for trial balance operations.
 */
export class TrialBalanceCellError extends Error {
  readonly code: TrialBalanceErrorCodeType;
  readonly httpStatus: number;
  readonly details?: Record<string, unknown>;
  readonly isOperational: boolean = true;

  constructor(
    code: TrialBalanceErrorCodeType,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'TrialBalanceCellError';
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

export function periodNotFoundError(periodCode: string): TrialBalanceCellError {
  return new TrialBalanceCellError(
    TrialBalanceErrorCode.PERIOD_NOT_FOUND,
    `Period not found: ${periodCode}`,
    { periodCode }
  );
}

export function snapshotNotFoundError(snapshotId: string): TrialBalanceCellError {
  return new TrialBalanceCellError(
    TrialBalanceErrorCode.SNAPSHOT_NOT_FOUND,
    `Snapshot not found: ${snapshotId}`,
    { snapshotId }
  );
}

export function snapshotAlreadyExistsError(periodCode: string): TrialBalanceCellError {
  return new TrialBalanceCellError(
    TrialBalanceErrorCode.SNAPSHOT_ALREADY_EXISTS,
    `Snapshot already exists for period: ${periodCode}`,
    { periodCode }
  );
}

export function hashMismatchError(
  expectedHash: string,
  actualHash: string
): TrialBalanceCellError {
  return new TrialBalanceCellError(
    TrialBalanceErrorCode.HASH_MISMATCH,
    'CRITICAL: TB hash mismatch detected!',
    { expectedHash, actualHash }
  );
}

export function unbalancedTBError(
  totalDebit: string,
  totalCredit: string
): TrialBalanceCellError {
  return new TrialBalanceCellError(
    TrialBalanceErrorCode.UNBALANCED_TB,
    `Trial balance is unbalanced. Debit: ${totalDebit}, Credit: ${totalCredit}`,
    { totalDebit, totalCredit }
  );
}

export function immutableSnapshotError(snapshotId: string): TrialBalanceCellError {
  return new TrialBalanceCellError(
    TrialBalanceErrorCode.IMMUTABLE_SNAPSHOT,
    `Cannot modify immutable snapshot: ${snapshotId}`,
    { snapshotId }
  );
}

export function noLedgerDataError(periodCode: string): TrialBalanceCellError {
  return new TrialBalanceCellError(
    TrialBalanceErrorCode.NO_LEDGER_DATA,
    `No ledger data found for period: ${periodCode}`,
    { periodCode }
  );
}
