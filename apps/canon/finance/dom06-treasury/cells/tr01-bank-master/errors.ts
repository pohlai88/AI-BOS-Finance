/**
 * TR-01 Bank Master - Error Definitions
 * 
 * @module TR-01
 */

export enum BankMasterErrorCode {
  // Entity Errors
  BANK_ACCOUNT_NOT_FOUND = 'TR01_BANK_ACCOUNT_NOT_FOUND',
  DUPLICATE_ACCOUNT_NUMBER = 'TR01_DUPLICATE_ACCOUNT_NUMBER',
  
  // State Machine Errors
  INVALID_STATE_TRANSITION = 'TR01_INVALID_STATE_TRANSITION',
  NOT_PENDING_VERIFICATION = 'TR01_NOT_PENDING_VERIFICATION',
  ALREADY_VERIFIED = 'TR01_ALREADY_VERIFIED',
  ACCOUNT_NOT_ACTIVE = 'TR01_ACCOUNT_NOT_ACTIVE',
  ACCOUNT_SUSPENDED = 'TR01_ACCOUNT_SUSPENDED',
  
  // Validation Errors
  INVALID_IBAN = 'TR01_INVALID_IBAN',
  INVALID_SWIFT_CODE = 'TR01_INVALID_SWIFT_CODE',
  INVALID_ROUTING_NUMBER = 'TR01_INVALID_ROUTING_NUMBER',
  INVALID_GL_ACCOUNT = 'TR01_INVALID_GL_ACCOUNT',
  GL_ACCOUNT_NOT_CASH = 'TR01_GL_ACCOUNT_NOT_CASH',
  
  // Authorization Errors
  SOD_VIOLATION = 'TR01_SOD_VIOLATION',
  UNAUTHORIZED_ACTION = 'TR01_UNAUTHORIZED_ACTION',
  
  // Verification Errors
  VERIFICATION_FAILED = 'TR01_VERIFICATION_FAILED',
  MICRO_DEPOSIT_MISMATCH = 'TR01_MICRO_DEPOSIT_MISMATCH',
  
  // Version Errors
  VERSION_CONFLICT = 'TR01_VERSION_CONFLICT',
}

export class BankMasterError extends Error {
  constructor(
    public readonly code: BankMasterErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'BankMasterError';
  }

  static accountNotFound(id: string): BankMasterError {
    return new BankMasterError(
      BankMasterErrorCode.BANK_ACCOUNT_NOT_FOUND,
      `Bank account not found: ${id}`,
      { bankAccountId: id }
    );
  }

  static duplicateAccountNumber(accountNumber: string): BankMasterError {
    return new BankMasterError(
      BankMasterErrorCode.DUPLICATE_ACCOUNT_NUMBER,
      `Bank account number already exists: ****${accountNumber.slice(-4)}`,
      { accountNumberLast4: accountNumber.slice(-4) }
    );
  }

  static invalidStateTransition(from: string, to: string): BankMasterError {
    return new BankMasterError(
      BankMasterErrorCode.INVALID_STATE_TRANSITION,
      `Cannot transition from ${from} to ${to}`,
      { currentStatus: from, targetStatus: to }
    );
  }

  static sodViolation(createdBy: string, actorId: string): BankMasterError {
    return new BankMasterError(
      BankMasterErrorCode.SOD_VIOLATION,
      'Cannot approve your own bank account (Segregation of Duties)',
      { createdBy, actorId }
    );
  }

  static invalidGLAccount(glAccountCode: string, reason: string): BankMasterError {
    return new BankMasterError(
      BankMasterErrorCode.INVALID_GL_ACCOUNT,
      `Invalid GL account: ${reason}`,
      { glAccountCode }
    );
  }

  static glAccountNotCash(glAccountCode: string): BankMasterError {
    return new BankMasterError(
      BankMasterErrorCode.GL_ACCOUNT_NOT_CASH,
      `GL account ${glAccountCode} is not a cash account`,
      { glAccountCode }
    );
  }

  static verificationFailed(reason: string): BankMasterError {
    return new BankMasterError(
      BankMasterErrorCode.VERIFICATION_FAILED,
      `Verification failed: ${reason}`,
      { reason }
    );
  }
}
