/**
 * AP-03: 3-Way Match & Controls Engine Cell
 * 
 * Exports all services, errors, and types for match evaluation.
 */

// ============================================================================
// ERRORS
// ============================================================================

export {
  // Base error
  MatchCellError,
  isMatchCellError,

  // Not found
  MatchResultNotFoundError,
  MatchExceptionNotFoundError,
  InvoiceNotFoundForMatchError,

  // Concurrency
  MatchConcurrencyError,

  // Match evaluation
  MatchAlreadyExistsError,
  InvoiceNotSubmittedError,
  MatchModeNotConfiguredError,

  // PO/GRN
  PurchaseOrderNotFoundError,
  PurchaseOrderPortUnavailableError,
  GoodsReceiptNotFoundError,
  GoodsReceiptPortUnavailableError,
  InsufficientGoodsReceivedError,

  // Tolerance
  ToleranceExceededError,
  ToleranceConfigurationError,

  // Exception
  ExceptionAlreadyResolvedError,
  InvalidExceptionResolutionError,

  // Override
  OverrideNotAllowedError,
  OverrideSoDViolationError,
  OverrideAlreadyAppliedError,
  OverrideReasonRequiredError,

  // Immutability
  MatchResultImmutableError,

  // Status
  InvalidMatchStatusError,
  MatchNotPassedError,
} from './errors';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

export {
  // Match modes
  type MatchMode,
  MATCH_MODES,
  MATCH_MODE_DESCRIPTIONS,

  // Match status
  type MatchStatus,
  MATCH_STATUSES,
  MATCH_STATUS_METADATA,

  // Exception types
  type ExceptionType,
  EXCEPTION_TYPES,
  EXCEPTION_TYPE_DESCRIPTIONS,
  type ExceptionSeverity,
  EXCEPTION_SEVERITIES,
  type ResolutionStatus,

  // Policy
  type PolicySource,

  // Tolerance
  DEFAULT_TOLERANCES,
  type ToleranceConfig,

  // Evaluation
  type MatchEvaluationInput,
  type PurchaseOrderData,
  type POLineData,
  type GoodsReceiptData,
  type GRNLineData,
  type MatchVariance,
  type MatchLineResult,
  type MatchEvaluationResult,

  // Helpers
  canApproveWithMatchStatus,
  getExceptionSeverity,
} from './MatchTypes';

// ============================================================================
// SERVICES
// ============================================================================

export { MatchService } from './MatchService';
export { OverrideService } from './OverrideService';
export { ExceptionService } from './ExceptionService';

// ============================================================================
// PORT TYPES
// ============================================================================

export type {
  MatchRepositoryPort,
  MatchTransactionContext,
  MatchResult,
  MatchException,
  InvoiceForMatch,
  CreateMatchResultInput,
  UpdateMatchResultInput,
  CreateExceptionInput,
  ResolveExceptionInput,
  MatchQueryFilters,
  InvoiceValidationPort,
  PurchaseOrderPort,
  GoodsReceiptPort,
  MatchPolicyPort,
} from './MatchService';

export type {
  OverrideInput,
  OverridePermissionPort,
} from './OverrideService';

export type {
  ExceptionQueueItem,
  ExceptionQueryFilters,
  ExceptionStatistics,
} from './ExceptionService';
