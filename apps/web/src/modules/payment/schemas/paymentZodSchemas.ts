// ============================================================================
// SCH_PAY_ZOD_01: PAYMENT ZOD SCHEMAS
// Enterprise-grade validation schemas for AP-05 Payment Execution Cell
// ============================================================================
// PHILOSOPHY: "Money is always a string. Never parseFloat until display."
// - All money fields use string-based validation
// - All amounts validated via regex for precision (up to 4 decimal places)
// - Currency codes validated as ISO 4217
// ============================================================================

import { z } from 'zod';

// ============================================================================
// 1. CURRENCY CODES (ISO 4217)
// ============================================================================

export const CurrencyCodeSchema = z.enum([
  'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD',
  'HKD', 'SGD', 'SEK', 'NOK', 'DKK', 'CNY', 'INR', 'BRL',
  'MXN', 'ZAR', 'KRW', 'THB', 'MYR', 'PHP', 'IDR', 'VND',
]);

export type CurrencyCode = z.infer<typeof CurrencyCodeSchema>;

// ============================================================================
// 2. MONEY AMOUNT (String-only with precision validation)
// ============================================================================

/**
 * Money Amount Schema - NEVER allows numbers, only valid decimal strings
 * 
 * Valid formats:
 * - "1250" (integer)
 * - "1250.00" (2 decimal places)
 * - "1250.0000" (4 decimal places)
 * - "0.0001" (minimum precision)
 * 
 * Invalid:
 * - 1250 (number type)
 * - "1250.00001" (5+ decimal places)
 * - "$1,250.00" (formatted)
 */
export const MoneyAmountSchema = z.string()
  .regex(
    /^\d+(\.\d{1,4})?$/,
    'Amount must be a decimal string with up to 4 decimal places (e.g., "1250.00")'
  )
  .refine(
    (val) => parseFloat(val) > 0,
    'Amount must be greater than zero'
  );

// ============================================================================
// 3. PAYMENT STATUS (State Machine)
// ============================================================================

export const PaymentStatusSchema = z.enum([
  'draft',
  'pending_approval',
  'approved',
  'rejected',
  'processing',
  'completed',
  'failed',
]);

export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

// ============================================================================
// 4. PAYMENT ACTIONS (State Machine Transitions)
// ============================================================================

export const PaymentActionSchema = z.enum([
  'submit',
  'approve',
  'reject',
  'execute',
  'complete',
  'fail',
  'retry',
]);

export type PaymentAction = z.infer<typeof PaymentActionSchema>;

// ============================================================================
// 5. SOURCE DOCUMENT TYPES
// ============================================================================

export const SourceDocumentTypeSchema = z.enum([
  'invoice',
  'tax',
  'payroll',
  'bank_fee',
  'deposit',
  'prepayment',
  'other',
]);

export type SourceDocumentType = z.infer<typeof SourceDocumentTypeSchema>;

// ============================================================================
// 6. BENEFICIARY SNAPSHOT (at execution time)
// ============================================================================

export const BeneficiarySnapshotSchema = z.object({
  accountNumber: z.string().min(1, 'Account number is required'),
  routingNumber: z.string().optional(),
  bankName: z.string().min(1, 'Bank name is required'),
  accountName: z.string().min(1, 'Account name is required'),
  swiftCode: z.string().max(11).optional(),
});

export type BeneficiarySnapshot = z.infer<typeof BeneficiarySnapshotSchema>;

// ============================================================================
// 7. CREATE PAYMENT INPUT
// ============================================================================

export const CreatePaymentInputSchema = z.object({
  vendorId: z.string().uuid('Vendor ID must be a valid UUID'),
  vendorName: z.string().min(1, 'Vendor name is required').max(255),
  amount: MoneyAmountSchema,
  currency: CurrencyCodeSchema.default('USD'),
  paymentDate: z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    'Payment date must be in YYYY-MM-DD format'
  ),
  dueDate: z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    'Due date must be in YYYY-MM-DD format'
  ).optional(),
  sourceDocumentId: z.string().uuid().optional(),
  sourceDocumentType: SourceDocumentTypeSchema.optional(),
  invoiceRef: z.string().max(50).optional(),
});

export type CreatePaymentInput = z.infer<typeof CreatePaymentInputSchema>;

// ============================================================================
// 8. APPROVAL INPUT
// ============================================================================

export const ApprovalInputSchema = z.object({
  version: z.number().int().positive('Version must be a positive integer'),
  comment: z.string().max(1000).optional(),
});

export type ApprovalInput = z.infer<typeof ApprovalInputSchema>;

// ============================================================================
// 9. REJECTION INPUT
// ============================================================================

export const RejectionInputSchema = z.object({
  version: z.number().int().positive('Version must be a positive integer'),
  comment: z.string().max(1000).optional(),
});

export type RejectionInput = z.infer<typeof RejectionInputSchema>;

// ============================================================================
// 10. EXECUTION INPUT
// ============================================================================

export const ExecutionInputSchema = z.object({
  version: z.number().int().positive('Version must be a positive integer'),
  beneficiary: BeneficiarySnapshotSchema,
});

export type ExecutionInput = z.infer<typeof ExecutionInputSchema>;

// ============================================================================
// 11. COMPLETION INPUT
// ============================================================================

export const CompletionInputSchema = z.object({
  version: z.number().int().positive('Version must be a positive integer'),
  bankConfirmationRef: z.string().min(1, 'Bank confirmation reference is required'),
});

export type CompletionInput = z.infer<typeof CompletionInputSchema>;

// ============================================================================
// 12. FAILURE INPUT
// ============================================================================

export const FailureInputSchema = z.object({
  version: z.number().int().positive('Version must be a positive integer'),
  failureReason: z.string().min(1, 'Failure reason is required').max(1000),
});

export type FailureInput = z.infer<typeof FailureInputSchema>;

// ============================================================================
// 13. SUBMISSION INPUT
// ============================================================================

export const SubmissionInputSchema = z.object({
  version: z.number().int().positive('Version must be a positive integer'),
});

export type SubmissionInput = z.infer<typeof SubmissionInputSchema>;

// ============================================================================
// 14. RETRY INPUT
// ============================================================================

export const RetryInputSchema = z.object({
  version: z.number().int().positive('Version must be a positive integer'),
});

export type RetryInput = z.infer<typeof RetryInputSchema>;

// ============================================================================
// 15. PAYMENT RESPONSE (from API)
// ============================================================================

export const PaymentResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  companyId: z.string().uuid(),
  paymentNumber: z.string(),
  vendorId: z.string().uuid(),
  vendorName: z.string(),
  amount: z.string(), // Always string
  currency: CurrencyCodeSchema,
  functionalCurrency: CurrencyCodeSchema.optional(),
  fxRate: z.string().optional(),
  functionalAmount: z.string().optional(),
  paymentDate: z.string(),
  dueDate: z.string().optional(),
  status: PaymentStatusSchema,
  createdBy: z.string().uuid(),
  approvedBy: z.string().uuid().optional(),
  approvedAt: z.string().optional(),
  executedBy: z.string().uuid().optional(),
  executedAt: z.string().optional(),
  sourceDocumentId: z.string().uuid().optional(),
  sourceDocumentType: SourceDocumentTypeSchema.optional(),
  journalHeaderId: z.string().uuid().optional(),
  version: z.number().int(),
  idempotencyKey: z.string().uuid().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  // Beneficiary snapshot (populated at execution)
  beneficiaryAccountNumber: z.string().optional(),
  beneficiaryRoutingNumber: z.string().optional(),
  beneficiaryBankName: z.string().optional(),
  beneficiaryAccountName: z.string().optional(),
  beneficiarySwiftCode: z.string().optional(),
  beneficiarySnapshotAt: z.string().optional(),
});

export type PaymentResponse = z.infer<typeof PaymentResponseSchema>;

// ============================================================================
// 16. OPERATION RESULT SCHEMAS
// ============================================================================

export const ApprovalResultSchema = z.object({
  success: z.boolean(),
  payment: PaymentResponseSchema,
});

export type ApprovalResult = z.infer<typeof ApprovalResultSchema>;

export const RejectionResultSchema = z.object({
  success: z.boolean(),
  payment: PaymentResponseSchema,
});

export type RejectionResult = z.infer<typeof RejectionResultSchema>;

export const SubmissionResultSchema = z.object({
  success: z.boolean(),
  payment: PaymentResponseSchema,
});

export type SubmissionResult = z.infer<typeof SubmissionResultSchema>;

export const ExecutionResultSchema = z.object({
  success: z.boolean(),
  payment: PaymentResponseSchema,
});

export type ExecutionResult = z.infer<typeof ExecutionResultSchema>;

export const CompletionResultSchema = z.object({
  success: z.boolean(),
  payment: PaymentResponseSchema,
  glEntry: z.object({
    journalHeaderId: z.string().uuid(),
  }).optional(),
});

export type CompletionResult = z.infer<typeof CompletionResultSchema>;

export const FailureResultSchema = z.object({
  success: z.boolean(),
  payment: PaymentResponseSchema,
});

export type FailureResult = z.infer<typeof FailureResultSchema>;

export const RetryResultSchema = z.object({
  success: z.boolean(),
  payment: PaymentResponseSchema,
});

export type RetryResult = z.infer<typeof RetryResultSchema>;

// ============================================================================
// 17. HELPER EXPORTS
// ============================================================================

export const paymentSchemas = {
  CreatePaymentInput: CreatePaymentInputSchema,
  ApprovalInput: ApprovalInputSchema,
  RejectionInput: RejectionInputSchema,
  SubmissionInput: SubmissionInputSchema,
  ExecutionInput: ExecutionInputSchema,
  CompletionInput: CompletionInputSchema,
  FailureInput: FailureInputSchema,
  RetryInput: RetryInputSchema,
  PaymentResponse: PaymentResponseSchema,
} as const;
