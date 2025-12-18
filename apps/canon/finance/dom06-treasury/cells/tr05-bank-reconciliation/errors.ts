/**
 * TR-05 Bank Reconciliation - Error Definitions
 * 
 * @module TR-05
 */

export enum ReconciliationErrorCode {
  // Entity Errors
  STATEMENT_NOT_FOUND = 'TR05_STATEMENT_NOT_FOUND',
  STATEMENT_ITEM_NOT_FOUND = 'TR05_STATEMENT_ITEM_NOT_FOUND',
  MATCH_NOT_FOUND = 'TR05_MATCH_NOT_FOUND',
  DUPLICATE_STATEMENT = 'TR05_DUPLICATE_STATEMENT',
  
  // State Machine Errors
  INVALID_STATE_TRANSITION = 'TR05_INVALID_STATE_TRANSITION',
  STATEMENT_NOT_DRAFT = 'TR05_STATEMENT_NOT_DRAFT',
  STATEMENT_NOT_IN_PROGRESS = 'TR05_STATEMENT_NOT_IN_PROGRESS',
  STATEMENT_NOT_RECONCILED = 'TR05_STATEMENT_NOT_RECONCILED',
  STATEMENT_ALREADY_FINALIZED = 'TR05_STATEMENT_ALREADY_FINALIZED',
  STATEMENT_CANCELLED = 'TR05_STATEMENT_CANCELLED',
  
  // Validation Errors
  INVALID_STATEMENT_FORMAT = 'TR05_INVALID_STATEMENT_FORMAT',
  INVALID_STATEMENT_PERIOD = 'TR05_INVALID_STATEMENT_PERIOD',
  OPENING_BALANCE_MISMATCH = 'TR05_OPENING_BALANCE_MISMATCH',
  BANK_ACCOUNT_NOT_ACTIVE = 'TR05_BANK_ACCOUNT_NOT_ACTIVE',
  PERIOD_CLOSED = 'TR05_PERIOD_CLOSED',
  
  // Matching Errors
  ITEM_ALREADY_MATCHED = 'TR05_ITEM_ALREADY_MATCHED',
  AMOUNT_MISMATCH = 'TR05_AMOUNT_MISMATCH',
  DATE_OUT_OF_TOLERANCE = 'TR05_DATE_OUT_OF_TOLERANCE',
  MATCH_CONFIDENCE_TOO_LOW = 'TR05_MATCH_CONFIDENCE_TOO_LOW',
  GL_TRANSACTION_ALREADY_MATCHED = 'TR05_GL_TRANSACTION_ALREADY_MATCHED',
  
  // Reconciliation Errors
  RECONCILIATION_NOT_COMPLETE = 'TR05_RECONCILIATION_NOT_COMPLETE',
  RECONCILIATION_NOT_BALANCED = 'TR05_RECONCILIATION_NOT_BALANCED',
  EXCEPTION_THRESHOLD_EXCEEDED = 'TR05_EXCEPTION_THRESHOLD_EXCEEDED',
  UNMATCHED_ITEMS_REMAINING = 'TR05_UNMATCHED_ITEMS_REMAINING',
  
  // Authorization Errors
  SOD_VIOLATION = 'TR05_SOD_VIOLATION',
  DUAL_AUTHORIZATION_REQUIRED = 'TR05_DUAL_AUTHORIZATION_REQUIRED',
  UNAUTHORIZED_ACTION = 'TR05_UNAUTHORIZED_ACTION',
  INSUFFICIENT_PERMISSIONS = 'TR05_INSUFFICIENT_PERMISSIONS',
  
  // Adjustment Errors
  ADJUSTMENT_INVALID = 'TR05_ADJUSTMENT_INVALID',
  ADJUSTMENT_APPROVAL_REQUIRED = 'TR05_ADJUSTMENT_APPROVAL_REQUIRED',
  
  // Version Errors
  VERSION_CONFLICT = 'TR05_VERSION_CONFLICT',
  
  // Exception Errors
  EXCEPTION_NOT_RESOLVED = 'TR05_EXCEPTION_NOT_RESOLVED',
  ESCALATION_REQUIRED = 'TR05_ESCALATION_REQUIRED',
}

export class ReconciliationError extends Error {
  constructor(
    public readonly code: ReconciliationErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ReconciliationError';
  }

  static statementNotFound(id: string): ReconciliationError {
    return new ReconciliationError(
      ReconciliationErrorCode.STATEMENT_NOT_FOUND,
      `Bank statement not found: ${id}`,
      { statementId: id }
    );
  }

  static duplicateStatement(statementNumber: string, statementDate: Date): ReconciliationError {
    return new ReconciliationError(
      ReconciliationErrorCode.DUPLICATE_STATEMENT,
      `Duplicate statement detected: ${statementNumber} dated ${statementDate.toISOString()}`,
      { statementNumber, statementDate }
    );
  }

  static invalidStateTransition(from: string, to: string): ReconciliationError {
    return new ReconciliationError(
      ReconciliationErrorCode.INVALID_STATE_TRANSITION,
      `Cannot transition from ${from} to ${to}`,
      { currentStatus: from, targetStatus: to }
    );
  }

  static statementAlreadyFinalized(id: string): ReconciliationError {
    return new ReconciliationError(
      ReconciliationErrorCode.STATEMENT_ALREADY_FINALIZED,
      `Statement ${id} is already finalized and cannot be modified`,
      { statementId: id }
    );
  }

  static reconciliationNotComplete(unmatchedCount: number): ReconciliationError {
    return new ReconciliationError(
      ReconciliationErrorCode.RECONCILIATION_NOT_COMPLETE,
      `Cannot finalize: ${unmatchedCount} unmatched items remaining`,
      { unmatchedCount }
    );
  }

  static reconciliationNotBalanced(difference: { amount: string; currency: string }): ReconciliationError {
    return new ReconciliationError(
      ReconciliationErrorCode.RECONCILIATION_NOT_BALANCED,
      `Cannot finalize: Difference of ${difference.amount} ${difference.currency} remains`,
      { difference }
    );
  }

  static exceptionThresholdExceeded(
    difference: { amount: string; currency: string },
    threshold: { amount: string; currency: string }
  ): ReconciliationError {
    return new ReconciliationError(
      ReconciliationErrorCode.EXCEPTION_THRESHOLD_EXCEEDED,
      `Difference ${difference.amount} ${difference.currency} exceeds exception threshold ${threshold.amount} ${threshold.currency}`,
      { difference, threshold }
    );
  }

  static sodViolation(actorId: string, reason: string): ReconciliationError {
    return new ReconciliationError(
      ReconciliationErrorCode.SOD_VIOLATION,
      `Segregation of Duties violation: ${reason}`,
      { actorId, reason }
    );
  }

  static dualAuthorizationRequired(): ReconciliationError {
    return new ReconciliationError(
      ReconciliationErrorCode.DUAL_AUTHORIZATION_REQUIRED,
      'Dual authorization requires two distinct approvers',
      {}
    );
  }

  static itemAlreadyMatched(itemId: string, itemType: 'bank' | 'gl'): ReconciliationError {
    return new ReconciliationError(
      ReconciliationErrorCode.ITEM_ALREADY_MATCHED,
      `${itemType === 'bank' ? 'Bank item' : 'GL transaction'} ${itemId} is already matched`,
      { itemId, itemType }
    );
  }

  static amountMismatch(
    bankAmount: { amount: string; currency: string },
    glAmount: { amount: string; currency: string },
    tolerance: number
  ): ReconciliationError {
    return new ReconciliationError(
      ReconciliationErrorCode.AMOUNT_MISMATCH,
      `Amount mismatch: bank ${bankAmount.amount} ${bankAmount.currency} vs GL ${glAmount.amount} ${glAmount.currency} (tolerance: ${tolerance})`,
      { bankAmount, glAmount, tolerance }
    );
  }

  static periodClosed(periodCode: string): ReconciliationError {
    return new ReconciliationError(
      ReconciliationErrorCode.PERIOD_CLOSED,
      `Period ${periodCode} is closed. Cannot import statements or create adjustments.`,
      { periodCode }
    );
  }

  static openingBalanceMismatch(
    expected: { amount: string; currency: string },
    actual: { amount: string; currency: string }
  ): ReconciliationError {
    return new ReconciliationError(
      ReconciliationErrorCode.OPENING_BALANCE_MISMATCH,
      `Opening balance mismatch: expected ${expected.amount} ${expected.currency}, got ${actual.amount} ${actual.currency}`,
      { expected, actual }
    );
  }

  static versionConflict(expectedVersion: number, actualVersion: number): ReconciliationError {
    return new ReconciliationError(
      ReconciliationErrorCode.VERSION_CONFLICT,
      `Version conflict: expected ${expectedVersion}, got ${actualVersion}`,
      { expectedVersion, actualVersion }
    );
  }

  static bankAccountNotActive(bankAccountId: string): ReconciliationError {
    return new ReconciliationError(
      ReconciliationErrorCode.BANK_ACCOUNT_NOT_ACTIVE,
      `Bank account ${bankAccountId} is not active`,
      { bankAccountId }
    );
  }

  static invalidStatementFormat(format: string): ReconciliationError {
    return new ReconciliationError(
      ReconciliationErrorCode.INVALID_STATEMENT_FORMAT,
      `Invalid statement format: ${format}. Supported formats: mt940, bai2, csv, ofx`,
      { format }
    );
  }
}
