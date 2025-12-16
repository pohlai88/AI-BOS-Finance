// ============================================================================
// PAYMENT MODULE (PAY)
// Group Settlement & Treasury Console powered by the NexusCanon Kernel
// ============================================================================
// Document ID: DOC_PAY_01
// Version: 2.0 (Consolidated)
// ============================================================================

// Data Layer (Sprint 1)
export {
  // Schema
  PAYMENT_SCHEMA,
  PAYMENT_EXTENDED_FIELDS,
  PAYMENT_CONFIG,

  // Types
  type Payment,
  type PaymentStatus,
  type PaymentMethod,
  type TransactionType,
  type EliminationStatus,
  type FunctionalCluster,
  type Manifest,

  // Mock Data
  MOCK_PAYMENTS,
  getPaymentsByStatus,
  getPaymentsByEntity,
  getPaymentsByCluster,
  aggregateFunctionalClusters,

  // Treasury
  TREASURY_DATA,
  ENTITY_OPTIONS,
  IC_POSITIONS,
  type TreasuryContext,
  type CashStatus,
  type ICStatus,
  type EntityOption,
  type ICPosition,
  getTreasuryContext,
  getDistressedEntities,
  getNetBorrowers,
  getGroupTreasurySummary,
  canAffordPayment,
  getICPositionsForEntity,
} from './data';

// Components (Sprint 2)
export {
  AuditSidebar,
  TreasuryHeader,
  FunctionalCard,
  FunctionalCardGrid,
  PaymentTable,
  ApprovalActions,
  BatchApprovalButton,
  type FunctionalClusterData,
  type ClusterStatus,
  type ClusterType,
  // AP-05 Components
  AmountInput,
  getCurrencySymbol,
  sanitizeAmountInput,
  formatForDisplay,
  PaymentStatusBadge,
  RetryBadge,
  getStatusLabel,
  isTerminalStatus,
  canTransition,
  getNextStatus,
  STATUS_CONFIG,
  CreatePaymentDialog,
  type CurrencyCode,
  type CreatePaymentDialogProps,
} from './components';

// AP-05 Payment Execution Cell API
export {
  paymentApi,
  PaymentApiError,
  ConcurrencyError,
  ValidationError,
  NotFoundError,
  SoDViolationError,
  PeriodClosedError,
} from './api';

// AP-05 Payment Execution Cell Schemas
export {
  CurrencyCodeSchema,
  MoneyAmountSchema,
  PaymentStatusSchema,
  PaymentActionSchema,
  SourceDocumentTypeSchema,
  BeneficiarySnapshotSchema,
  CreatePaymentInputSchema,
  ApprovalInputSchema,
  RejectionInputSchema,
  ExecutionInputSchema,
  CompletionInputSchema,
  FailureInputSchema,
  RetryInputSchema,
  PaymentResponseSchema,
  paymentSchemas,
  type PaymentAction,
  type SourceDocumentType,
  type BeneficiarySnapshot,
  type CreatePaymentInput,
  type ApprovalInput,
  type RejectionInput,
  type ExecutionInput,
  type CompletionInput,
  type FailureInput,
  type RetryInput,
  type PaymentResponse,
  type ApprovalResult,
  type RejectionResult,
  type SubmissionResult,
  type ExecutionResult,
  type CompletionResult,
  type FailureResult,
  type RetryResult,
} from './schemas';

// Governance Hooks (Sprint 3)
export {
  // RULE_PAY_01: SoD
  checkSoD,
  useSoDCheck,
  type ApproverRole,
  type SoDCheckResult,
  type CurrentUser,

  // RULE_PAY_02: IC Validation
  validateICTransaction,
  useICValidation,
  formatICRoute,
  getICSettlementStatus,
  type ICValidationResult,
  type ICSettlementStep,
  type ICSettlementStatus,

  // RULE_PAY_03: Batch Approval
  validateBatchApproval,
  useBatchApproval,
  useClusterSummary,
  type BatchValidationResult,
  type BatchApprovalState,

  // RULE_PAY_04: Document Completeness
  validateDocuments,
  useDocumentValidation,
  getDocumentIcon,
  getDocumentStatusSummary,
  type DocumentType,
  type DocumentRequirement,
  type DocumentValidationResult,

  // Unified Approval
  checkApproval,
  usePaymentApproval,
  DEFAULT_USER,
  type ApprovalDecision,
  type PaymentApprovalState,
} from './hooks';

// Page (Sprint 4)
export { PAY01PaymentHub } from './PAY_01_PaymentHub';

