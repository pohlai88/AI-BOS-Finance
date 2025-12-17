/**
 * AP-01 Vendor Master Cell
 * 
 * Exports all services and errors for the vendor lifecycle.
 */

// ============================================================================
// ERRORS (shared)
// ============================================================================

export {
  // Base error
  VendorCellError,
  isVendorCellError,

  // Not found
  VendorNotFoundError,
  BankAccountNotFoundError,

  // Concurrency
  ConcurrencyConflictError,

  // Policy
  SoDViolationError,

  // Validation
  InvalidVendorStatusError,
  VendorNotInDraftError,
  VendorAlreadyApprovedError,
  DuplicateVendorCodeError,
  DuplicateTaxIdError,
  DuplicateBankAccountError,
  InvalidBankAccountChangeRequestError,
  BankAccountChangeNotPendingError,
} from './errors';

// Re-export from canon-governance for convenience
export { IllegalVendorStateTransitionError } from './VendorStateMachine';

// ============================================================================
// SERVICES
// ============================================================================

export { VendorService } from './VendorService';
export { ApprovalService } from './ApprovalService';
export { BankAccountService } from './BankAccountService';

// ============================================================================
// STATE MACHINE
// ============================================================================

export {
  VendorStateMachine,
  STATUS_METADATA,
  type VendorStatus,
  type VendorAction,
  type StatusMetadata,
} from './VendorStateMachine';

// ============================================================================
// SERVICE TYPES
// ============================================================================

export type { CreateVendorInput, UpdateVendorInput } from './VendorService';

export type {
  ApprovalResult,
  RejectionResult,
} from './ApprovalService';

export type {
  CreateBankAccountInput,
  RequestBankAccountChangeInput,
  ApproveBankAccountChangeInput,
} from './BankAccountService';
