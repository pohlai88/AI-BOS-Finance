// ============================================================================
// PAYMENT MODULE - GOVERNANCE HOOKS
// Sprint 3 deliverables: RULE_PAY_01 through RULE_PAY_04
// ============================================================================

// RULE_PAY_01: Segregation of Duties
export {
  checkSoD,
  useSoDCheck,
  type ApproverRole,
  type SoDCheckResult,
  type CurrentUser,
} from './usePaymentGovernance';

// RULE_PAY_02: Intercompany Elimination Logic
export {
  validateICTransaction,
  useICValidation,
  formatICRoute,
  getICSettlementStatus,
  type ICValidationResult,
  type ICSettlementStep,
  type ICSettlementStatus,
} from './useICValidation';

// RULE_PAY_03: Batch Approval Logic
export {
  validateBatchApproval,
  useBatchApproval,
  useClusterSummary,
  type BatchValidationResult,
  type BatchApprovalState,
} from './useBatchApproval';

// RULE_PAY_04: Document Completeness
export {
  validateDocuments,
  useDocumentValidation,
  getDocumentIcon,
  getDocumentStatusSummary,
  type DocumentType,
  type DocumentRequirement,
  type DocumentValidationResult,
} from './useDocumentValidation';

// Unified Payment Approval
export {
  checkApproval,
  usePaymentApproval,
  DEFAULT_USER,
  type ApprovalDecision,
  type PaymentApprovalState,
} from './usePaymentApproval';

// Dashboard Hooks (AP-05 Dashboard Service)
export {
  useDashboard,
  useCashPosition,
  useControlHealth,
  useCompanyBreakdown,
  type DashboardMetrics,
  type CashSummary,
  type StatusAggregate,
  type CompanyAggregate,
  type ControlHealthMetrics,
  type CashPositionResponse,
  type ControlHealthResponse,
  type CompanyBreakdownResponse,
} from './useDashboard';
