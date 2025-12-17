/**
 * GL-04 Period Close - Domain Errors
 * 
 * Custom error classes for period close operations.
 * Maps to API error responses in the BFF layer.
 * 
 * @module GL-04
 */

// =============================================================================
// Error Codes
// =============================================================================

export const PeriodCloseErrorCode = {
  // Not found
  PERIOD_NOT_FOUND: 'PERIOD_NOT_FOUND',
  CHECKLIST_TASK_NOT_FOUND: 'CHECKLIST_TASK_NOT_FOUND',
  
  // State machine
  INVALID_TRANSITION: 'INVALID_TRANSITION',
  ALREADY_CLOSED: 'ALREADY_CLOSED',
  ALREADY_OPEN: 'ALREADY_OPEN',
  
  // Checklist
  CHECKLIST_INCOMPLETE: 'CHECKLIST_INCOMPLETE',
  BLOCKING_TASKS_PENDING: 'BLOCKING_TASKS_PENDING',
  
  // Entries
  PENDING_ENTRIES: 'PENDING_ENTRIES',
  UNPOSTED_ENTRIES: 'UNPOSTED_ENTRIES',
  
  // Reopen
  REOPEN_WINDOW_EXPIRED: 'REOPEN_WINDOW_EXPIRED',
  REOPEN_NOT_REQUESTED: 'REOPEN_NOT_REQUESTED',
  
  // TB Snapshot
  TB_SNAPSHOT_FAILED: 'TB_SNAPSHOT_FAILED',
  TB_HASH_MISMATCH: 'TB_HASH_MISMATCH',
  
  // SoD violations
  SOD_VIOLATION: 'SOD_VIOLATION',
  
  // Overlap
  PERIOD_OVERLAP: 'PERIOD_OVERLAP',
  
  // Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  
  // System
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type PeriodCloseErrorCodeType = typeof PeriodCloseErrorCode[keyof typeof PeriodCloseErrorCode];

// =============================================================================
// HTTP Status Mapping
// =============================================================================

const ERROR_HTTP_STATUS: Record<PeriodCloseErrorCodeType, number> = {
  PERIOD_NOT_FOUND: 404,
  CHECKLIST_TASK_NOT_FOUND: 404,
  INVALID_TRANSITION: 422,
  ALREADY_CLOSED: 409,
  ALREADY_OPEN: 409,
  CHECKLIST_INCOMPLETE: 422,
  BLOCKING_TASKS_PENDING: 422,
  PENDING_ENTRIES: 422,
  UNPOSTED_ENTRIES: 422,
  REOPEN_WINDOW_EXPIRED: 422,
  REOPEN_NOT_REQUESTED: 422,
  TB_SNAPSHOT_FAILED: 500,
  TB_HASH_MISMATCH: 500,
  SOD_VIOLATION: 403,
  PERIOD_OVERLAP: 409,
  UNAUTHORIZED: 403,
  INTERNAL_ERROR: 500,
};

// =============================================================================
// Error Class
// =============================================================================

/**
 * Period Close Cell Error
 * 
 * Domain error for period close operations.
 */
export class PeriodCloseCellError extends Error {
  readonly code: PeriodCloseErrorCodeType;
  readonly httpStatus: number;
  readonly details?: Record<string, unknown>;
  readonly isOperational: boolean = true;

  constructor(
    code: PeriodCloseErrorCodeType,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'PeriodCloseCellError';
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

export function periodNotFoundError(periodCode: string): PeriodCloseCellError {
  return new PeriodCloseCellError(
    PeriodCloseErrorCode.PERIOD_NOT_FOUND,
    `Period not found: ${periodCode}`,
    { periodCode }
  );
}

export function invalidTransitionError(
  from: string,
  to: string
): PeriodCloseCellError {
  return new PeriodCloseCellError(
    PeriodCloseErrorCode.INVALID_TRANSITION,
    `Invalid status transition: ${from} → ${to}`,
    { from, to }
  );
}

export function checklistIncompleteError(
  blockingTasks: string[]
): PeriodCloseCellError {
  return new PeriodCloseCellError(
    PeriodCloseErrorCode.CHECKLIST_INCOMPLETE,
    `Cannot close: blocking tasks incomplete`,
    { blockingTasks }
  );
}

export function pendingEntriesError(count: number): PeriodCloseCellError {
  return new PeriodCloseCellError(
    PeriodCloseErrorCode.PENDING_ENTRIES,
    `Cannot close: ${count} pending journal entries`,
    { count }
  );
}

export function sodViolationError(
  initiatedBy: string,
  approvedBy: string
): PeriodCloseCellError {
  return new PeriodCloseCellError(
    PeriodCloseErrorCode.SOD_VIOLATION,
    'SoD violation: Initiator cannot approve',
    { initiatedBy, approvedBy }
  );
}

export function alreadyClosedError(periodCode: string): PeriodCloseCellError {
  return new PeriodCloseCellError(
    PeriodCloseErrorCode.ALREADY_CLOSED,
    `Period already closed: ${periodCode}`,
    { periodCode }
  );
}

export function reopenWindowExpiredError(expiredAt: string): PeriodCloseCellError {
  return new PeriodCloseCellError(
    PeriodCloseErrorCode.REOPEN_WINDOW_EXPIRED,
    `Reopen window expired at ${expiredAt}`,
    { expiredAt }
  );
}

export function tbSnapshotFailedError(reason: string): PeriodCloseCellError {
  return new PeriodCloseCellError(
    PeriodCloseErrorCode.TB_SNAPSHOT_FAILED,
    `TB snapshot failed: ${reason}`,
    { reason }
  );
}

export function periodOverlapError(existingPeriod: string): PeriodCloseCellError {
  return new PeriodCloseCellError(
    PeriodCloseErrorCode.PERIOD_OVERLAP,
    `Period overlaps with: ${existingPeriod}`,
    { existingPeriod }
  );
}
