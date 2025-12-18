/**
 * TR-02 Cash Pooling - Error Definitions
 * 
 * @module TR-02
 */

export enum CashPoolingErrorCode {
  // Entity Errors
  POOL_NOT_FOUND = 'TR02_POOL_NOT_FOUND',
  SWEEP_NOT_FOUND = 'TR02_SWEEP_NOT_FOUND',
  INTEREST_ALLOCATION_NOT_FOUND = 'TR02_INTEREST_ALLOCATION_NOT_FOUND',
  CONFIG_CHANGE_NOT_FOUND = 'TR02_CONFIG_CHANGE_NOT_FOUND',
  
  // State Machine Errors
  INVALID_STATE_TRANSITION = 'TR02_INVALID_STATE_TRANSITION',
  POOL_NOT_ACTIVE = 'TR02_POOL_NOT_ACTIVE',
  POOL_ALREADY_ACTIVE = 'TR02_POOL_ALREADY_ACTIVE',
  POOL_SUSPENDED = 'TR02_POOL_SUSPENDED',
  
  // Validation Errors
  INVALID_POOL_TYPE = 'TR02_INVALID_POOL_TYPE',
  INVALID_CURRENCY_MIX = 'TR02_INVALID_CURRENCY_MIX',
  INVALID_INTEREST_RATE = 'TR02_INVALID_INTEREST_RATE',
  INVALID_SWEEP_THRESHOLD = 'TR02_INVALID_SWEEP_THRESHOLD',
  INVALID_TARGET_BALANCE = 'TR02_INVALID_TARGET_BALANCE',
  BANK_ACCOUNT_NOT_ACTIVE = 'TR02_BANK_ACCOUNT_NOT_ACTIVE',
  INSUFFICIENT_BALANCE = 'TR02_INSUFFICIENT_BALANCE',
  INSUFFICIENT_AVAILABLE_BALANCE = 'TR02_INSUFFICIENT_AVAILABLE_BALANCE',
  STALE_BALANCE = 'TR02_STALE_BALANCE',
  PENDING_TRANSACTIONS = 'TR02_PENDING_TRANSACTIONS',
  
  // Authorization Errors
  SOD_VIOLATION = 'TR02_SOD_VIOLATION',
  DUAL_AUTHORIZATION_REQUIRED = 'TR02_DUAL_AUTHORIZATION_REQUIRED',
  UNAUTHORIZED_ACTION = 'TR02_UNAUTHORIZED_ACTION',
  INSUFFICIENT_PERMISSIONS = 'TR02_INSUFFICIENT_PERMISSIONS',
  SCOPE_VIOLATION = 'TR02_SCOPE_VIOLATION',
  
  // Sweep Errors
  SWEEP_ALREADY_EXECUTED = 'TR02_SWEEP_ALREADY_EXECUTED',
  SWEEP_BELOW_THRESHOLD = 'TR02_SWEEP_BELOW_THRESHOLD',
  SWEEP_EXCEEDS_LIMIT = 'TR02_SWEEP_EXCEEDS_LIMIT',
  SWEEP_FAILED = 'TR02_SWEEP_FAILED',
  SWEEP_NEEDS_RECONCILIATION = 'TR02_SWEEP_NEEDS_RECONCILIATION',
  
  // Interest Errors
  INTEREST_CALCULATION_FAILED = 'TR02_INTEREST_CALCULATION_FAILED',
  INTEREST_ALREADY_ALLOCATED = 'TR02_INTEREST_ALREADY_ALLOCATED',
  
  // Config Change Errors
  CONFIG_CHANGE_NOT_PENDING = 'TR02_CONFIG_CHANGE_NOT_PENDING',
  CONFIG_CHANGE_ALREADY_APPROVED = 'TR02_CONFIG_CHANGE_ALREADY_APPROVED',
  CONFIG_CHANGE_VERSION_MISMATCH = 'TR02_CONFIG_CHANGE_VERSION_MISMATCH',
  
  // Legal/Compliance Errors
  AGREEMENT_MISSING = 'TR02_AGREEMENT_MISSING',
  INTEREST_RATE_NOT_BENCHMARKED = 'TR02_INTEREST_RATE_NOT_BENCHMARKED',
  ENTITY_LIMIT_EXCEEDED = 'TR02_ENTITY_LIMIT_EXCEEDED',
  
  // Version Errors
  VERSION_CONFLICT = 'TR02_VERSION_CONFLICT',
  
  // Period Errors
  PERIOD_CLOSED = 'TR02_PERIOD_CLOSED',
  INVALID_EXECUTION_DATE = 'TR02_INVALID_EXECUTION_DATE',
}

export class CashPoolingError extends Error {
  constructor(
    public readonly code: CashPoolingErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'CashPoolingError';
  }

  static poolNotFound(id: string): CashPoolingError {
    return new CashPoolingError(
      CashPoolingErrorCode.POOL_NOT_FOUND,
      `Cash pool not found: ${id}`,
      { poolId: id }
    );
  }

  static invalidStateTransition(from: string, to: string): CashPoolingError {
    return new CashPoolingError(
      CashPoolingErrorCode.INVALID_STATE_TRANSITION,
      `Cannot transition from ${from} to ${to}`,
      { currentStatus: from, targetStatus: to }
    );
  }

  static poolNotActive(id: string): CashPoolingError {
    return new CashPoolingError(
      CashPoolingErrorCode.POOL_NOT_ACTIVE,
      `Cash pool ${id} is not active`,
      { poolId: id }
    );
  }

  static sodViolation(reason: string): CashPoolingError {
    return new CashPoolingError(
      CashPoolingErrorCode.SOD_VIOLATION,
      `Segregation of Duties violation: ${reason}`,
      { reason }
    );
  }

  static dualAuthorizationRequired(): CashPoolingError {
    return new CashPoolingError(
      CashPoolingErrorCode.DUAL_AUTHORIZATION_REQUIRED,
      'Dual authorization requires two distinct approvers',
      {}
    );
  }

  static insufficientBalance(available: Money, required: Money): CashPoolingError {
    return new CashPoolingError(
      CashPoolingErrorCode.INSUFFICIENT_BALANCE,
      `Insufficient balance: available ${available.amount} ${available.currency}, required ${required.amount} ${required.currency}`,
      { available, required }
    );
  }

  static staleBalance(source: string, stalenessHours: number): CashPoolingError {
    return new CashPoolingError(
      CashPoolingErrorCode.STALE_BALANCE,
      `Balance from ${source} is stale (${stalenessHours.toFixed(1)} hours old)`,
      { source, stalenessHours }
    );
  }

  static sweepBelowThreshold(currentBalance: Money, threshold: Money): CashPoolingError {
    return new CashPoolingError(
      CashPoolingErrorCode.SWEEP_BELOW_THRESHOLD,
      `Current balance ${currentBalance.amount} ${currentBalance.currency} is below sweep threshold ${threshold.amount} ${threshold.currency}`,
      { currentBalance, threshold }
    );
  }

  static sweepExceedsLimit(amount: Money, limit: Money, limitType: 'daily' | 'single'): CashPoolingError {
    return new CashPoolingError(
      CashPoolingErrorCode.SWEEP_EXCEEDS_LIMIT,
      `Sweep amount ${amount.amount} ${amount.currency} exceeds ${limitType} transaction limit ${limit.amount} ${limit.currency}`,
      { amount, limit, limitType }
    );
  }

  static invalidCurrencyMix(currencies: string[]): CashPoolingError {
    return new CashPoolingError(
      CashPoolingErrorCode.INVALID_CURRENCY_MIX,
      `Mixed currency pools not allowed. Found currencies: ${currencies.join(', ')}`,
      { currencies }
    );
  }

  static agreementMissing(): CashPoolingError {
    return new CashPoolingError(
      CashPoolingErrorCode.AGREEMENT_MISSING,
      'Intercompany cash pooling agreement reference is required',
      {}
    );
  }

  static entityLimitExceeded(companyId: string, amount: Money, limit: Money): CashPoolingError {
    return new CashPoolingError(
      CashPoolingErrorCode.ENTITY_LIMIT_EXCEEDED,
      `Entity ${companyId} pool participation ${amount.amount} ${amount.currency} exceeds limit ${limit.amount} ${limit.currency}`,
      { companyId, amount, limit }
    );
  }

  static versionConflict(expectedVersion: number, actualVersion: number): CashPoolingError {
    return new CashPoolingError(
      CashPoolingErrorCode.VERSION_CONFLICT,
      `Version conflict: expected ${expectedVersion}, got ${actualVersion}`,
      { expectedVersion, actualVersion }
    );
  }

  static periodClosed(periodCode: string): CashPoolingError {
    return new CashPoolingError(
      CashPoolingErrorCode.PERIOD_CLOSED,
      `Period ${periodCode} is closed. Cannot execute sweeps.`,
      { periodCode }
    );
  }

  static scopeViolation(userId: string, resource: string): CashPoolingError {
    return new CashPoolingError(
      CashPoolingErrorCode.SCOPE_VIOLATION,
      `User ${userId} not authorized for ${resource}`,
      { userId, resource }
    );
  }
}
