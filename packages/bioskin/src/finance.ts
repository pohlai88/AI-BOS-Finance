'use client';

/**
 * @aibos/bioskin/finance - Finance ERP Components
 *
 * Specialized components for Accounting/Finance ERP:
 * - Ledger drilldown
 * - Reconciliation workspaces
 * - Period close
 * - Bulk actions with governance
 * - Exception management
 * - Print templates
 *
 * @example
 * import { BioDrilldown, BioReconciliation, BioPeriodClose } from '@aibos/bioskin/finance';
 */

// Drilldown & Navigation
export { BioDrilldown, type BioDrilldownProps, type DrilldownFilter } from './molecules/BioDrilldown';
export { BioActiveFilters, type BioActiveFiltersProps, type ActiveFilter } from './molecules/BioActiveFilters';

// Reconciliation
export {
  BioReconciliation,
  type BioReconciliationProps,
  type ReconciliationItem,
  type ReconciliationPane,
  type ReconciliationColumn,
  type MatchSuggestion,
  type SplitItem,
} from './organisms/BioReconciliation';

// Period Close
export {
  BioPeriodClose,
  type BioPeriodCloseProps,
  type AccountingPeriod,
  type ChecklistItem,
  type ChecklistResult,
  type PeriodCloseState,
} from './organisms/BioPeriodClose';

// Saved Views
export { BioSavedViews, type BioSavedViewsProps, type SavedView } from './molecules/BioSavedViews';

// Bulk Actions
export {
  BioBulkActions,
  type BioBulkActionsProps,
  type BulkAction,
  type BulkActionItem,
  type BulkActionResult,
} from './molecules/BioBulkActions';

// Exception Management
export {
  BioExceptionDashboard,
  type BioExceptionDashboardProps,
  type Exception,
  type ExceptionItem,
  type ExceptionAction,
  type ExceptionSeverity,
} from './molecules/BioExceptionDashboard';

// Explainer
export {
  BioExplainer,
  type BioExplainerProps,
  type NumberExplanation,
  type FxRateInfo,
} from './molecules/BioExplainer';

// Print Templates
export {
  BioPrintTemplate,
  type BioPrintTemplateProps,
  type PrintTemplateType,
  type PrintConfig,
  type CompanyInfo,
} from './molecules/BioPrintTemplate';

// Accounting Schemas
export {
  JournalEntrySchema,
  JournalEntryLineSchema,
  InvoiceSchema,
  InvoiceLineSchema,
  PaymentSchema,
  PaymentAllocationSchema,
  AccountCodeSchema,
  CurrencyCodeSchema,
  TaxCodeSchema,
  AmountSchema,
  SignedAmountSchema,
  AccountingPeriodSchema,
  validateBalance,
  requiresTaxCode,
  createReversalEntry,
  roundAmount,
  amountsEqual,
  sumAmounts,
  type JournalEntry,
  type JournalEntryLine,
  type Invoice,
  type InvoiceLine,
  type Payment,
  type PaymentAllocation,
} from './schemas/accounting';
