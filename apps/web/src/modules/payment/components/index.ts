// ============================================================================
// PAYMENT MODULE - COMPONENTS
// Sprint 2 deliverables: COM_PAY_01 through COM_PAY_08
// ============================================================================

// COM_PAY_01: Audit Sidebar - The 4W1H Orchestra
export { AuditSidebar } from './AuditSidebar';

// COM_PAY_02: Treasury Header - The "100 Logins" Solution
export { TreasuryHeader } from './TreasuryHeader';

// COM_PAY_03: Functional Card - Batch Processing Clusters
export {
  FunctionalCard,
  FunctionalCardGrid,
  type FunctionalClusterData,
  type ClusterStatus,
  type ClusterType,
} from './FunctionalCard';

// COM_PAY_04: Payment Table - Transaction List View
export { PaymentTable } from './PaymentTable';

// COM_PAY_05: Approval Actions - Approve/Reject Buttons
export {
  ApprovalActions,
  BatchApprovalButton,
} from './ApprovalActions';

// ============================================================================
// AP-05 PAYMENT EXECUTION CELL COMPONENTS
// ============================================================================

// COM_PAY_06: Amount Input - String-only money input
export {
  AmountInput,
  getCurrencySymbol,
  sanitizeAmountInput,
  formatForDisplay,
  type CurrencyCode,
} from './AmountInput';

// COM_PAY_07: Payment Status Badge - State machine visualization
export {
  PaymentStatusBadge,
  RetryBadge,
  getStatusLabel,
  isTerminalStatus,
  canTransition,
  getNextStatus,
  STATUS_CONFIG,
  type PaymentStatus,
} from './PaymentStatusBadge';

// COM_PAY_08: Create Payment Dialog - Enterprise payment creation
export {
  CreatePaymentDialog,
  type CreatePaymentDialogProps,
} from './CreatePaymentDialog';

