/**
 * AP-04: Invoice Approval Workflow Cell
 * 
 * Exports all services, errors, and types for invoice approval.
 */

// ============================================================================
// ERRORS
// ============================================================================

export {
  // Base error
  ApprovalCellError,
  isApprovalCellError,

  // Not found
  ApprovalNotFoundError,
  ApprovalRouteNotFoundError,
  InvoiceNotFoundForApprovalError,

  // SoD
  SoDViolationError,
  CannotApproveOwnInvoiceError,

  // Authorization
  NotAuthorizedToApproveError,
  ApprovalLevelMismatchError,
  NotPendingApprovalError,

  // State
  InvoiceNotMatchedError,
  AlreadyApprovedError,
  AlreadyRejectedError,
  ApprovalAlreadyActionedError,

  // Immutability
  ApprovalImmutableError,
  ApprovalChainImmutableError,

  // Delegation
  DelegationNotFoundError,
  DelegationExpiredError,
  InvalidDelegationError,

  // Routing
  RoutingConfigurationError,
  NoApproversConfiguredError,
} from './errors';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

export {
  // Decision types
  type ApprovalDecision,
  APPROVAL_DECISIONS,
  type InvoiceApprovalStatus,
  INVOICE_APPROVAL_STATUSES,

  // Roles
  type ApprovalRole,
  APPROVAL_ROLES,
  APPROVAL_ROLE_LABELS,

  // Route config
  type ApprovalLevelConfig,
  type ApprovalRouteConfig,
  DEFAULT_APPROVAL_THRESHOLDS,

  // Entities
  type ApprovalRecord,
  type ApprovalRoute,
  type ApprovalInboxItem,
  type Delegation,

  // Inputs
  type RequestApprovalInput,
  type ApproveInput,
  type RejectInput,
  type RequestChangesInput,
  type CreateDelegationInput,

  // Helpers
  isFullyApproved,
  getNextApprovalLevel,
  calculateApprovalLevels,
} from './ApprovalTypes';

// ============================================================================
// SERVICES
// ============================================================================

export { ApprovalService } from './ApprovalService';

// ============================================================================
// PORT TYPES
// ============================================================================

export type {
  ApprovalRepositoryPort,
  ApprovalTransactionContext,
  InvoiceForApproval,
  CreateApprovalInput,
  UpdateApprovalInput,
  CreateRouteInput,
  UpdateRouteInput,
  InvoiceApprovalPort,
  ApprovalPolicyPort,
} from './ApprovalService';
