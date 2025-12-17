/**
 * GL-05 Trial Balance — Error Factory
 * 
 * Centralized error definitions for trial balance operations.
 * 
 * @module GL-05
 */

export class TrialBalanceCellError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'TrialBalanceCellError';
  }
}

export const TrialBalanceError = {
  periodNotFound: (periodCode: string) =>
    new TrialBalanceCellError(`Period not found: ${periodCode}`, 'PERIOD_NOT_FOUND', 404, { periodCode }),

  snapshotNotFound: (snapshotId: string) =>
    new TrialBalanceCellError(`Snapshot not found: ${snapshotId}`, 'SNAPSHOT_NOT_FOUND', 404, { snapshotId }),

  snapshotAlreadyExists: (periodCode: string) =>
    new TrialBalanceCellError(`Snapshot already exists for: ${periodCode}`, 'SNAPSHOT_EXISTS', 409, { periodCode }),

  hashMismatch: (expectedHash: string, actualHash: string) =>
    new TrialBalanceCellError(
      `CRITICAL: TB hash mismatch detected!`,
      'HASH_MISMATCH',
      500,
      { expectedHash, actualHash }
    ),

  unbalanced: (totalDebit: string, totalCredit: string) =>
    new TrialBalanceCellError(
      `Trial balance is unbalanced: Debit ${totalDebit} ≠ Credit ${totalCredit}`,
      'UNBALANCED_TB',
      500,
      { totalDebit, totalCredit }
    ),

  immutableSnapshot: (snapshotId: string) =>
    new TrialBalanceCellError(
      `Cannot modify immutable snapshot: ${snapshotId}`,
      'IMMUTABLE_SNAPSHOT',
      400,
      { snapshotId }
    ),

  noLedgerData: (periodCode: string) =>
    new TrialBalanceCellError(
      `No ledger data found for period: ${periodCode}`,
      'NO_LEDGER_DATA',
      400,
      { periodCode }
    ),

  accountNotFound: (accountCode: string) =>
    new TrialBalanceCellError(`Account not found: ${accountCode}`, 'ACCOUNT_NOT_FOUND', 404, { accountCode }),

  unauthorized: (operation: string) =>
    new TrialBalanceCellError(`Unauthorized: ${operation}`, 'UNAUTHORIZED', 403, { operation }),

  internal: (operation: string) =>
    new TrialBalanceCellError(`Internal error: ${operation}`, 'INTERNAL_ERROR', 500, { operation }),
};
