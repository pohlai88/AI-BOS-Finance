/**
 * AP-05 Payment Execution Cell
 * 
 * Exports all services and errors for the payment execution lifecycle.
 */

// ============================================================================
// ERRORS (shared)
// ============================================================================

export {
  // Base error
  PaymentCellError,
  isPaymentCellError,

  // Not found
  PaymentNotFoundError,

  // Concurrency
  ConcurrencyConflictError,

  // Policy
  SoDViolationError,

  // Validation
  PeriodClosedError,
  InvalidAmountError,
  InvalidCurrencyError,
} from './errors';

// Re-export from canon-governance for convenience
export { IllegalStateTransitionError } from '@aibos/canon-governance';

// ============================================================================
// SERVICES
// ============================================================================

export { PaymentService } from './PaymentService';
export { ApprovalService } from './ApprovalService';
export { ExecutionService } from './ExecutionService';
export { ExceptionService } from './ExceptionService';
export { WebhookService, verifyWebhookSignature, PAYMENT_EVENT_TYPES } from './WebhookService';

// ============================================================================
// SERVICE TYPES
// ============================================================================

export type { CreatePaymentInput } from './PaymentService';

export type {
  ApprovalResult,
  RejectionResult,
} from './ApprovalService';

export type {
  SubmissionResult,
  ExecutionResult,
  CompletionResult,
  FailureResult,
  RetryResult,
} from './ExecutionService';

export type {
  PaymentException,
  ExceptionType,
  ExceptionSeverity,
  ExceptionCounts,
  ExceptionResolution,
  ExceptionConfig,
} from './ExceptionService';

export type {
  WebhookRegistration,
  WebhookFilter,
  WebhookPayload,
  WebhookDelivery,
  CreateWebhookInput,
  PaymentEventType,
} from './WebhookService';
