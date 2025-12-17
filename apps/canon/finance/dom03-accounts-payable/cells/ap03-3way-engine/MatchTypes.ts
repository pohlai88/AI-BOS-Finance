/**
 * AP-03: 3-Way Match & Controls Engine — Types & Constants
 * 
 * Defines match modes, statuses, exception types, and tolerance configurations.
 */

// ============================================================================
// MATCH MODES
// ============================================================================

/**
 * Match mode types
 * - 1-way: Invoice-only validation (vendor, duplicates, math, tax)
 * - 2-way: PO ↔ Invoice (price/qty tolerance)
 * - 3-way: PO ↔ GRN ↔ Invoice (qty received must support billed qty)
 */
export type MatchMode = '1-way' | '2-way' | '3-way';

export const MATCH_MODES: MatchMode[] = ['1-way', '2-way', '3-way'];

export const MATCH_MODE_DESCRIPTIONS: Record<MatchMode, string> = {
  '1-way': 'Invoice-only validation (vendor, duplicates, math, tax)',
  '2-way': 'PO ↔ Invoice matching (price/qty tolerance)',
  '3-way': 'PO ↔ GRN ↔ Invoice matching (full goods receipt verification)',
};

// ============================================================================
// MATCH STATUS
// ============================================================================

/**
 * Match result status
 * - passed: All validations passed
 * - exception: One or more validations failed, requires resolution
 * - skipped: Match not required (1-way mode for certain vendors)
 */
export type MatchStatus = 'passed' | 'exception' | 'skipped';

export const MATCH_STATUSES: MatchStatus[] = ['passed', 'exception', 'skipped'];

export const MATCH_STATUS_METADATA: Record<MatchStatus, {
  label: string;
  description: string;
  canApprove: boolean;
}> = {
  passed: {
    label: 'Passed',
    description: 'All match validations passed',
    canApprove: true,
  },
  exception: {
    label: 'Exception',
    description: 'Match failed, requires resolution or override',
    canApprove: false,
  },
  skipped: {
    label: 'Skipped',
    description: 'Match not required for this invoice',
    canApprove: true,
  },
};

// ============================================================================
// EXCEPTION TYPES
// ============================================================================

/**
 * Types of match exceptions
 */
export type ExceptionType =
  | 'price_mismatch'
  | 'qty_mismatch'
  | 'amount_mismatch'
  | 'missing_po'
  | 'missing_grn'
  | 'insufficient_receipt'
  | 'po_closed'
  | 'grn_closed'
  | 'vendor_mismatch'
  | 'currency_mismatch'
  | 'date_mismatch'
  | 'other';

export const EXCEPTION_TYPES: ExceptionType[] = [
  'price_mismatch',
  'qty_mismatch',
  'amount_mismatch',
  'missing_po',
  'missing_grn',
  'insufficient_receipt',
  'po_closed',
  'grn_closed',
  'vendor_mismatch',
  'currency_mismatch',
  'date_mismatch',
  'other',
];

export const EXCEPTION_TYPE_DESCRIPTIONS: Record<ExceptionType, string> = {
  price_mismatch: 'Invoice price differs from PO price beyond tolerance',
  qty_mismatch: 'Invoice quantity differs from PO quantity beyond tolerance',
  amount_mismatch: 'Invoice total differs from expected amount beyond tolerance',
  missing_po: 'Purchase order not found or not provided',
  missing_grn: 'Goods receipt note not found or not provided',
  insufficient_receipt: 'Goods received quantity is less than invoiced quantity',
  po_closed: 'Purchase order is closed and cannot accept invoices',
  grn_closed: 'Goods receipt is already closed/processed',
  vendor_mismatch: 'Invoice vendor does not match PO vendor',
  currency_mismatch: 'Invoice currency does not match PO currency',
  date_mismatch: 'Invoice date is outside acceptable range',
  other: 'Other match exception',
};

/**
 * Exception severity levels
 */
export type ExceptionSeverity = 'low' | 'medium' | 'high' | 'critical';

export const EXCEPTION_SEVERITIES: ExceptionSeverity[] = ['low', 'medium', 'high', 'critical'];

/**
 * Exception resolution status
 */
export type ResolutionStatus = 'pending' | 'resolved' | 'overridden';

// ============================================================================
// POLICY SOURCE
// ============================================================================

/**
 * Source of match policy configuration
 */
export type PolicySource = 'tenant' | 'vendor' | 'category' | 'default';

// ============================================================================
// TOLERANCE CONFIGURATION
// ============================================================================

/**
 * Default tolerance thresholds
 */
export const DEFAULT_TOLERANCES = {
  priceTolerancePercent: 5, // ±5%
  qtyTolerancePercent: 2,   // ±2%
  amountToleranceCents: 10000, // ±$100
} as const;

export interface ToleranceConfig {
  /** Price tolerance as percentage (e.g., 5 = ±5%) */
  priceTolerancePercent: number;
  /** Quantity tolerance as percentage (e.g., 2 = ±2%) */
  qtyTolerancePercent: number;
  /** Amount tolerance in cents (e.g., 10000 = ±$100) */
  amountToleranceCents: number;
}

// ============================================================================
// MATCH EVALUATION INPUTS
// ============================================================================

export interface MatchEvaluationInput {
  invoiceId: string;
  forceMode?: MatchMode; // Override policy-determined mode
  skipToleranceCheck?: boolean; // For debugging only
}

export interface POLineData {
  lineNumber: number;
  description: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
}

export interface PurchaseOrderData {
  poNumber: string;
  vendorId: string;
  currency: string;
  totalCents: number;
  lines: POLineData[];
  status: 'open' | 'closed' | 'cancelled';
  createdAt: Date;
}

export interface GRNLineData {
  lineNumber: number;
  poLineNumber: number;
  receivedQty: number;
  receivedAt: Date;
}

export interface GoodsReceiptData {
  grnNumber: string;
  poNumber: string;
  vendorId: string;
  lines: GRNLineData[];
  totalReceivedQty: number;
  status: 'pending' | 'received' | 'closed';
  receivedAt: Date;
}

// ============================================================================
// MATCH RESULT DATA
// ============================================================================

export interface MatchVariance {
  type: 'price' | 'quantity' | 'amount';
  invoiceValue: number;
  expectedValue: number;
  varianceAmount: number;
  variancePercent: number;
  tolerancePercent: number;
  withinTolerance: boolean;
}

export interface MatchLineResult {
  invoiceLineNumber: number;
  poLineNumber?: number;
  grnLineNumber?: number;
  priceVariance?: MatchVariance;
  qtyVariance?: MatchVariance;
  passed: boolean;
  exceptions: string[];
}

export interface MatchEvaluationResult {
  status: MatchStatus;
  matchMode: MatchMode;
  policySource: PolicySource;
  purchaseOrderId?: string;
  goodsReceiptId?: string;
  priceVariancePercent?: number;
  qtyVariancePercent?: number;
  amountVarianceCents?: number;
  withinTolerance: boolean;
  exceptions: {
    type: ExceptionType;
    severity: ExceptionSeverity;
    message: string;
    lineNumber?: number;
  }[];
  lineResults?: MatchLineResult[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if match status allows invoice approval
 */
export function canApproveWithMatchStatus(status: MatchStatus): boolean {
  return MATCH_STATUS_METADATA[status].canApprove;
}

/**
 * Get exception severity based on type and variance
 */
export function getExceptionSeverity(
  type: ExceptionType,
  variancePercent?: number
): ExceptionSeverity {
  // Critical exceptions
  if (['missing_po', 'missing_grn', 'vendor_mismatch'].includes(type)) {
    return 'critical';
  }

  // High severity for large variances
  if (variancePercent !== undefined && variancePercent > 20) {
    return 'high';
  }

  // Medium severity for tolerance failures
  if (['price_mismatch', 'qty_mismatch', 'insufficient_receipt'].includes(type)) {
    return 'medium';
  }

  return 'low';
}
