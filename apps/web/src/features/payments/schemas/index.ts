// ============================================================================
// PAYMENT MODULE - ZOD SCHEMAS
// AP-05 Payment Execution Cell validation schemas
// ============================================================================

// Payment Hub Demo Schemas
export {
  PaymentHubSchema,
  PaymentHubCreateSchema,
  CellStatusSchema,
  CellSchema,
  HealthCheckSchema,
  type PaymentHub,
  type PaymentHubCreate,
  type Cell,
  type HealthCheck,
  type CellStatus,
} from './payment-hub-demo';

// AP Workbench Schemas (Comprehensive Demo)
export {
  InvoiceStatusEnum,
  InvoiceSchema,
  InvoiceLineSchema,
  PaymentBatchStatusEnum,
  PaymentBatchSchema,
  VendorSchema,
  ApprovalActionEnum,
  ApprovalSchema,
  ExceptionTypeEnum,
  PeriodCloseItemSchema,
  type Invoice,
  type InvoiceStatus,
  type InvoiceLine,
  type PaymentBatch,
  type Vendor,
  type Approval,
  type ExceptionType,
  type PeriodCloseItem,
  type APDashboardStats,
} from './ap-workbench';

// Core Payment Schemas
export {
  // Currency
  CurrencyCodeSchema,

  // Money
  MoneyAmountSchema,

  // Status & Actions
  PaymentStatusSchema,
  PaymentActionSchema,

  // Source Documents
  SourceDocumentTypeSchema,

  // Beneficiary
  BeneficiarySnapshotSchema,

  // Input Schemas
  CreatePaymentInputSchema,
  ApprovalInputSchema,
  RejectionInputSchema,
  SubmissionInputSchema,
  ExecutionInputSchema,
  CompletionInputSchema,
  FailureInputSchema,
  RetryInputSchema,

  // Response Schemas
  PaymentResponseSchema,
  ApprovalResultSchema,
  RejectionResultSchema,
  SubmissionResultSchema,
  ExecutionResultSchema,
  CompletionResultSchema,
  FailureResultSchema,
  RetryResultSchema,

  // Helper export
  paymentSchemas,
} from './paymentZodSchemas';

export type {
  CurrencyCode,
  PaymentStatus,
  PaymentAction,
  SourceDocumentType,
  BeneficiarySnapshot,
  CreatePaymentInput,
  ApprovalInput,
  RejectionInput,
  SubmissionInput,
  ExecutionInput,
  CompletionInput,
  FailureInput,
  RetryInput,
  PaymentResponse,
  ApprovalResult,
  RejectionResult,
  SubmissionResult,
  ExecutionResult,
  CompletionResult,
  FailureResult,
  RetryResult,
} from './paymentZodSchemas';
