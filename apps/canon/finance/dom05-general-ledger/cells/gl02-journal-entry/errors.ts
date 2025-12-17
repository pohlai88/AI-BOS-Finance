/**
 * GL-02 Journal Entry - Domain Errors
 * 
 * Custom error classes for journal entry operations.
 * Maps to API error responses in the BFF layer.
 * 
 * @module GL-02
 */

// =============================================================================
// Error Codes
// =============================================================================

export const JournalEntryErrorCode = {
  // Not found
  ENTRY_NOT_FOUND: 'ENTRY_NOT_FOUND',
  
  // Validation
  ENTRY_NOT_BALANCED: 'ENTRY_NOT_BALANCED',
  MINIMUM_LINES_REQUIRED: 'MINIMUM_LINES_REQUIRED',
  LINE_DEBIT_CREDIT_MISSING: 'LINE_DEBIT_CREDIT_MISSING',
  LINE_DEBIT_CREDIT_BOTH: 'LINE_DEBIT_CREDIT_BOTH',
  DESCRIPTION_REQUIRED: 'DESCRIPTION_REQUIRED',
  REFERENCE_REQUIRED: 'REFERENCE_REQUIRED',
  INVALID_ACCOUNT_CODE: 'INVALID_ACCOUNT_CODE',
  ACCOUNT_NOT_POSTABLE: 'ACCOUNT_NOT_POSTABLE',
  ACCOUNT_NOT_ACTIVE: 'ACCOUNT_NOT_ACTIVE',
  AUTO_REVERSE_RECURRING_CONFLICT: 'AUTO_REVERSE_RECURRING_CONFLICT',
  CLOSING_ENTRY_DATE_INVALID: 'CLOSING_ENTRY_DATE_INVALID',
  OPENING_ENTRY_DATE_INVALID: 'OPENING_ENTRY_DATE_INVALID',
  REJECTION_REASON_REQUIRED: 'REJECTION_REASON_REQUIRED',
  ATTACHMENT_TOO_LARGE: 'ATTACHMENT_TOO_LARGE',
  
  // Duplicates
  DUPLICATE_REFERENCE: 'DUPLICATE_REFERENCE',
  
  // State machine
  INVALID_STATE_TRANSITION: 'INVALID_STATE_TRANSITION',
  ENTRY_NOT_IN_DRAFT_STATUS: 'ENTRY_NOT_IN_DRAFT_STATUS',
  ENTRY_NOT_IN_SUBMITTED_STATUS: 'ENTRY_NOT_IN_SUBMITTED_STATUS',
  ENTRY_NOT_IN_POSTED_STATUS: 'ENTRY_NOT_IN_POSTED_STATUS',
  ENTRY_NOT_EDITABLE: 'ENTRY_NOT_EDITABLE',
  
  // Period/Cutoff
  PERIOD_CLOSED: 'PERIOD_CLOSED',
  PERIOD_NOT_OPEN: 'PERIOD_NOT_OPEN',
  ENTRY_TYPE_NOT_ALLOWED: 'ENTRY_TYPE_NOT_ALLOWED',
  
  // SoD violations
  SOD_VIOLATION: 'SOD_VIOLATION',
  APPROVER_CANNOT_BE_CREATOR: 'APPROVER_CANNOT_BE_CREATOR',
  
  // Authorization
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  APPROVAL_NOT_AUTHORIZED: 'APPROVAL_NOT_AUTHORIZED',
  
  // Reversal
  ENTRY_ALREADY_REVERSED: 'ENTRY_ALREADY_REVERSED',
  REVERSAL_DATE_INVALID: 'REVERSAL_DATE_INVALID',
  
  // Concurrency
  VERSION_CONFLICT: 'VERSION_CONFLICT',
  
  // Posting
  POSTING_FAILED: 'POSTING_FAILED',
} as const;

export type JournalEntryErrorCodeType = typeof JournalEntryErrorCode[keyof typeof JournalEntryErrorCode];

// =============================================================================
// HTTP Status Mapping
// =============================================================================

const ERROR_HTTP_STATUS: Record<JournalEntryErrorCodeType, number> = {
  ENTRY_NOT_FOUND: 404,
  ENTRY_NOT_BALANCED: 400,
  MINIMUM_LINES_REQUIRED: 400,
  LINE_DEBIT_CREDIT_MISSING: 400,
  LINE_DEBIT_CREDIT_BOTH: 400,
  DESCRIPTION_REQUIRED: 400,
  REFERENCE_REQUIRED: 400,
  INVALID_ACCOUNT_CODE: 400,
  ACCOUNT_NOT_POSTABLE: 400,
  ACCOUNT_NOT_ACTIVE: 400,
  AUTO_REVERSE_RECURRING_CONFLICT: 400,
  CLOSING_ENTRY_DATE_INVALID: 400,
  OPENING_ENTRY_DATE_INVALID: 400,
  REJECTION_REASON_REQUIRED: 400,
  ATTACHMENT_TOO_LARGE: 400,
  DUPLICATE_REFERENCE: 409,
  INVALID_STATE_TRANSITION: 422,
  ENTRY_NOT_IN_DRAFT_STATUS: 422,
  ENTRY_NOT_IN_SUBMITTED_STATUS: 422,
  ENTRY_NOT_IN_POSTED_STATUS: 422,
  ENTRY_NOT_EDITABLE: 422,
  PERIOD_CLOSED: 422,
  PERIOD_NOT_OPEN: 422,
  ENTRY_TYPE_NOT_ALLOWED: 422,
  SOD_VIOLATION: 403,
  APPROVER_CANNOT_BE_CREATOR: 403,
  INSUFFICIENT_PERMISSIONS: 403,
  APPROVAL_NOT_AUTHORIZED: 403,
  ENTRY_ALREADY_REVERSED: 409,
  REVERSAL_DATE_INVALID: 400,
  VERSION_CONFLICT: 409,
  POSTING_FAILED: 500,
};

// =============================================================================
// Error Class
// =============================================================================

/**
 * Journal Entry Cell Error
 * 
 * Domain error for journal entry operations.
 */
export class JournalEntryCellError extends Error {
  readonly code: JournalEntryErrorCodeType;
  readonly httpStatus: number;
  readonly details?: Record<string, unknown>;
  readonly isOperational: boolean = true;

  constructor(
    code: JournalEntryErrorCodeType,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'JournalEntryCellError';
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

export function entryNotFoundError(entryId: string): JournalEntryCellError {
  return new JournalEntryCellError(
    JournalEntryErrorCode.ENTRY_NOT_FOUND,
    `Journal entry not found: ${entryId}`,
    { entryId }
  );
}

export function entryNotBalancedError(
  totalDebit: string,
  totalCredit: string
): JournalEntryCellError {
  return new JournalEntryCellError(
    JournalEntryErrorCode.ENTRY_NOT_BALANCED,
    `Entry is not balanced. Debit: ${totalDebit}, Credit: ${totalCredit}`,
    { totalDebit, totalCredit }
  );
}

export function minimumLinesRequiredError(provided: number): JournalEntryCellError {
  return new JournalEntryCellError(
    JournalEntryErrorCode.MINIMUM_LINES_REQUIRED,
    `At least 2 lines required, got ${provided}`,
    { provided, minimum: 2 }
  );
}

export function lineDebitCreditMissingError(lineNumber: number): JournalEntryCellError {
  return new JournalEntryCellError(
    JournalEntryErrorCode.LINE_DEBIT_CREDIT_MISSING,
    `Line ${lineNumber} must have debit or credit amount`,
    { lineNumber }
  );
}

export function lineDebitCreditBothError(lineNumber: number): JournalEntryCellError {
  return new JournalEntryCellError(
    JournalEntryErrorCode.LINE_DEBIT_CREDIT_BOTH,
    `Line ${lineNumber} cannot have both debit and credit`,
    { lineNumber }
  );
}

export function invalidStateTransitionError(
  entryId: string,
  currentStatus: string,
  targetStatus: string
): JournalEntryCellError {
  return new JournalEntryCellError(
    JournalEntryErrorCode.INVALID_STATE_TRANSITION,
    `Cannot transition from ${currentStatus} to ${targetStatus}`,
    { entryId, currentStatus, targetStatus }
  );
}

export function sodViolationError(
  action: string,
  entryId: string,
  createdBy: string,
  actorId: string
): JournalEntryCellError {
  return new JournalEntryCellError(
    JournalEntryErrorCode.SOD_VIOLATION,
    `Cannot ${action} your own journal entry (Segregation of Duties)`,
    { entryId, createdBy, actorId, action }
  );
}

export function versionConflictError(
  entryId: string,
  expectedVersion: number
): JournalEntryCellError {
  return new JournalEntryCellError(
    JournalEntryErrorCode.VERSION_CONFLICT,
    'Entry was modified by another user. Please refresh and try again.',
    { entryId, expectedVersion }
  );
}

export function duplicateReferenceError(
  reference: string,
  companyId: string
): JournalEntryCellError {
  return new JournalEntryCellError(
    JournalEntryErrorCode.DUPLICATE_REFERENCE,
    `Reference ${reference} already exists`,
    { reference, companyId }
  );
}

export function periodClosedError(
  periodName: string,
  entryDate: Date
): JournalEntryCellError {
  return new JournalEntryCellError(
    JournalEntryErrorCode.PERIOD_CLOSED,
    `Period ${periodName} is closed`,
    { periodName, entryDate }
  );
}

export function entryTypeNotAllowedError(
  entryType: string,
  periodStatus: string,
  allowedTypes: string[]
): JournalEntryCellError {
  return new JournalEntryCellError(
    JournalEntryErrorCode.ENTRY_TYPE_NOT_ALLOWED,
    `Entry type '${entryType}' not allowed when period is '${periodStatus}'`,
    { entryType, periodStatus, allowedTypes }
  );
}

export function accountNotPostableError(
  accountCode: string,
  lineNumber: number
): JournalEntryCellError {
  return new JournalEntryCellError(
    JournalEntryErrorCode.ACCOUNT_NOT_POSTABLE,
    `Account ${accountCode} on line ${lineNumber} is not postable`,
    { accountCode, lineNumber }
  );
}

export function accountNotActiveError(
  accountCode: string,
  lineNumber: number
): JournalEntryCellError {
  return new JournalEntryCellError(
    JournalEntryErrorCode.ACCOUNT_NOT_ACTIVE,
    `Account ${accountCode} on line ${lineNumber} is not active`,
    { accountCode, lineNumber }
  );
}

export function entryAlreadyReversedError(
  entryId: string,
  reversalEntryId: string
): JournalEntryCellError {
  return new JournalEntryCellError(
    JournalEntryErrorCode.ENTRY_ALREADY_REVERSED,
    `Entry already reversed by ${reversalEntryId}`,
    { entryId, reversalEntryId }
  );
}

export function postingFailedError(
  entryId: string,
  reason: string
): JournalEntryCellError {
  return new JournalEntryCellError(
    JournalEntryErrorCode.POSTING_FAILED,
    `Posting failed: ${reason}`,
    { entryId, reason }
  );
}
