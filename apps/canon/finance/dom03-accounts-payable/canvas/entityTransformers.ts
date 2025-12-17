/**
 * Entity Transformers
 * 
 * Converts AP entities (vendors, invoices, matches, approvals, payments)
 * into canvas display data for hydrated stickies.
 * 
 * Each transformer extracts the essential information needed to render
 * a sticky note on the canvas, including status colors and urgency indicators.
 */

import type { CanvasDisplayData, CanvasStyle } from '@aibos/kernel-core';
import { buildURN, type APCellCode } from './urn';

// ============================================================================
// 1. STATUS COLORS
// ============================================================================

/**
 * Status color tokens by cell and status
 * These map to semantic colors for consistent UI
 */
export const STATUS_COLORS = {
  vendor: {
    draft: '#94A3B8',           // Slate
    pending_approval: '#F59E0B', // Amber
    approved: '#10B981',         // Emerald
    rejected: '#EF4444',         // Red
    suspended: '#6B7280',        // Gray
  },
  invoice: {
    draft: '#94A3B8',           // Slate
    submitted: '#3B82F6',        // Blue
    matched: '#8B5CF6',          // Violet
    pending_approval: '#F59E0B', // Amber
    approved: '#10B981',         // Emerald
    posted: '#14B8A6',           // Teal
    paid: '#22C55E',             // Green
    voided: '#EF4444',           // Red
  },
  match: {
    pending: '#F59E0B',         // Amber
    passed: '#10B981',           // Emerald
    failed: '#EF4444',           // Red
    exception: '#F97316',        // Orange
    override: '#8B5CF6',         // Violet
  },
  approval: {
    pending: '#F59E0B',         // Amber
    approved: '#10B981',         // Emerald
    rejected: '#EF4444',         // Red
    changes_requested: '#F97316', // Orange
  },
  payment: {
    draft: '#94A3B8',           // Slate
    pending_approval: '#F59E0B', // Amber
    approved: '#3B82F6',         // Blue
    processing: '#8B5CF6',       // Violet
    completed: '#10B981',        // Emerald
    failed: '#EF4444',           // Red
  },
} as const;

/**
 * Default sticky background colors by cell
 */
export const CELL_COLORS: Record<APCellCode, string> = {
  '01': '#FEF3C7', // Amber-100 (Vendors)
  '02': '#DBEAFE', // Blue-100 (Invoices)
  '03': '#E0E7FF', // Indigo-100 (Match)
  '04': '#FCE7F3', // Pink-100 (Approval)
  '05': '#D1FAE5', // Emerald-100 (Payment)
};

// ============================================================================
// 2. URGENCY CALCULATION
// ============================================================================

/**
 * Calculate urgency based on due date
 */
export function calculateUrgency(dueDate?: Date | string | null): 'normal' | 'soon' | 'overdue' | 'critical' {
  if (!dueDate) return 'normal';
  
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const now = new Date();
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'overdue';
  if (diffDays === 0) return 'critical';
  if (diffDays <= 3) return 'soon';
  return 'normal';
}

/**
 * Calculate priority score based on entity factors
 */
export function calculatePriorityScore(factors: {
  amountCents?: number;
  daysUntilDue?: number;
  hasRedFlag?: boolean;
  urgentTagCount?: number;
  status?: string;
}): number {
  let score = 0;
  
  // Amount-based (0-30 points)
  const amount = factors.amountCents ?? 0;
  if (amount >= 100_000_00) score += 30;      // $100K+
  else if (amount >= 50_000_00) score += 25;  // $50K+
  else if (amount >= 10_000_00) score += 15;  // $10K+
  else if (amount >= 1_000_00) score += 5;    // $1K+
  
  // Due date urgency (0-25 points)
  const days = factors.daysUntilDue ?? 30;
  if (days < 0) score += 25;               // Overdue
  else if (days <= 1) score += 20;         // Due today/tomorrow
  else if (days <= 3) score += 10;         // Due this week
  
  // Red flag from team (0-20 points)
  if (factors.hasRedFlag) score += 20;
  
  // Urgent tags (0-15 points)
  score += Math.min((factors.urgentTagCount ?? 0) * 5, 15);
  
  // Status-based (exception states)
  if (factors.status === 'failed' || factors.status === 'exception') {
    score += 15;
  }
  
  return Math.min(score, 100);  // Cap at 100
}

// ============================================================================
// 3. ENTITY TYPES (for input)
// ============================================================================

/**
 * Vendor entity (from AP-01)
 */
export interface VendorEntity {
  id: string;
  code: string;
  legalName: string;
  displayName?: string;
  status: string;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  country?: string;
  currencyPreference?: string;
  hasPendingBankChanges?: boolean;
  createdAt?: Date;
}

/**
 * Invoice entity (from AP-02)
 */
export interface InvoiceEntity {
  id: string;
  invoiceNumber: string;
  vendorId: string;
  vendorName?: string;
  totalAmountCents: number;
  currency: string;
  status: string;
  matchStatus?: string;
  invoiceDate?: Date;
  dueDate?: Date;
  lineCount?: number;
  createdAt?: Date;
}

/**
 * Match result entity (from AP-03)
 */
export interface MatchEntity {
  id: string;
  invoiceId: string;
  invoiceNumber?: string;
  vendorName?: string;
  status: string;
  matchMode?: string;
  priceVariancePercent?: number;
  qtyVariancePercent?: number;
  isOverridden?: boolean;
  overrideApprovedBy?: string;
  exceptionReason?: string;
  createdAt?: Date;
}

/**
 * Approval record entity (from AP-04)
 */
export interface ApprovalEntity {
  id: string;
  invoiceId: string;
  invoiceNumber?: string;
  vendorName?: string;
  approvalLevel: number;
  totalLevels: number;
  decision: string;
  approverId?: string;
  approverName?: string;
  invoiceAmountCents?: number;
  currency?: string;
  isDelegated?: boolean;
  ageInDays?: number;
  createdAt?: Date;
}

/**
 * Payment entity (from AP-05)
 */
export interface PaymentEntity {
  id: string;
  paymentNumber: string;
  vendorId: string;
  vendorName: string;
  amount: string;
  currency: string;
  status: string;
  paymentDate?: Date;
  dueDate?: Date;
  bankReference?: string;
  retryCount?: number;
  createdAt?: Date;
}

// ============================================================================
// 4. TRANSFORMER FUNCTIONS
// ============================================================================

/**
 * Transform vendor to canvas display data
 */
export function transformVendor(vendor: VendorEntity): {
  displayData: CanvasDisplayData;
  style: CanvasStyle;
  sourceRef: string;
  priorityScore: number;
} {
  const statusColor = STATUS_COLORS.vendor[vendor.status as keyof typeof STATUS_COLORS.vendor] ?? '#94A3B8';
  
  const displayData: CanvasDisplayData = {
    entityType: 'vendor',
    cellCode: 'AP-01',
    title: vendor.code,
    subtitle: vendor.displayName || vendor.legalName,
    status: vendor.status,
    statusColor,
    urgency: vendor.riskLevel === 'HIGH' ? 'critical' : 'normal',
    metadata: {
      riskLevel: vendor.riskLevel,
      country: vendor.country,
      hasPendingBankChanges: vendor.hasPendingBankChanges,
    },
  };
  
  const style: CanvasStyle = {
    backgroundColor: CELL_COLORS['01'],
    borderColor: statusColor,
    borderWidth: 2,
  };
  
  const priorityScore = calculatePriorityScore({
    hasRedFlag: vendor.hasPendingBankChanges,
    status: vendor.status,
  });
  
  return {
    displayData,
    style,
    sourceRef: buildURN('01', vendor.id),
    priorityScore,
  };
}

/**
 * Transform invoice to canvas display data
 */
export function transformInvoice(invoice: InvoiceEntity): {
  displayData: CanvasDisplayData;
  style: CanvasStyle;
  sourceRef: string;
  priorityScore: number;
} {
  const statusColor = STATUS_COLORS.invoice[invoice.status as keyof typeof STATUS_COLORS.invoice] ?? '#94A3B8';
  const urgency = calculateUrgency(invoice.dueDate);
  
  const daysUntilDue = invoice.dueDate 
    ? Math.ceil((new Date(invoice.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : undefined;
  
  const displayData: CanvasDisplayData = {
    entityType: 'invoice',
    cellCode: 'AP-02',
    title: invoice.invoiceNumber,
    subtitle: invoice.vendorName || invoice.vendorId.slice(0, 8),
    status: invoice.status,
    statusColor,
    amount: formatAmount(invoice.totalAmountCents),
    currency: invoice.currency,
    dueDate: invoice.dueDate?.toISOString().split('T')[0],
    urgency,
    metadata: {
      matchStatus: invoice.matchStatus,
      lineCount: invoice.lineCount,
    },
  };
  
  const style: CanvasStyle = {
    backgroundColor: CELL_COLORS['02'],
    borderColor: statusColor,
    borderWidth: 2,
    pulse: urgency === 'overdue' || urgency === 'critical',
  };
  
  const priorityScore = calculatePriorityScore({
    amountCents: invoice.totalAmountCents,
    daysUntilDue,
    status: invoice.status,
  });
  
  return {
    displayData,
    style,
    sourceRef: buildURN('02', invoice.id),
    priorityScore,
  };
}

/**
 * Transform match result to canvas display data
 */
export function transformMatch(match: MatchEntity): {
  displayData: CanvasDisplayData;
  style: CanvasStyle;
  sourceRef: string;
  priorityScore: number;
} {
  const statusColor = STATUS_COLORS.match[match.status as keyof typeof STATUS_COLORS.match] ?? '#94A3B8';
  const urgency = match.status === 'exception' || match.status === 'failed' ? 'critical' : 'normal';
  
  const displayData: CanvasDisplayData = {
    entityType: 'match',
    cellCode: 'AP-03',
    title: `Match: ${match.invoiceNumber || match.invoiceId.slice(0, 8)}`,
    subtitle: match.vendorName || match.status,
    status: match.status,
    statusColor,
    urgency,
    metadata: {
      matchMode: match.matchMode,
      priceVariance: match.priceVariancePercent,
      qtyVariance: match.qtyVariancePercent,
      isOverridden: match.isOverridden,
      exceptionReason: match.exceptionReason,
    },
  };
  
  const style: CanvasStyle = {
    backgroundColor: CELL_COLORS['03'],
    borderColor: statusColor,
    borderWidth: 2,
    pulse: match.status === 'exception',
  };
  
  const priorityScore = calculatePriorityScore({
    status: match.status,
  });
  
  return {
    displayData,
    style,
    sourceRef: buildURN('03', match.id),
    priorityScore,
  };
}

/**
 * Transform approval record to canvas display data
 */
export function transformApproval(approval: ApprovalEntity): {
  displayData: CanvasDisplayData;
  style: CanvasStyle;
  sourceRef: string;
  priorityScore: number;
} {
  const statusColor = STATUS_COLORS.approval[approval.decision as keyof typeof STATUS_COLORS.approval] ?? '#94A3B8';
  const urgency = (approval.ageInDays ?? 0) > 7 ? 'overdue' : 
                  (approval.ageInDays ?? 0) > 3 ? 'soon' : 'normal';
  
  const displayData: CanvasDisplayData = {
    entityType: 'approval',
    cellCode: 'AP-04',
    title: `Approval: ${approval.invoiceNumber || approval.invoiceId.slice(0, 8)}`,
    subtitle: `Level ${approval.approvalLevel}/${approval.totalLevels}`,
    status: approval.decision,
    statusColor,
    amount: approval.invoiceAmountCents ? formatAmount(approval.invoiceAmountCents) : undefined,
    currency: approval.currency,
    urgency,
    metadata: {
      approverName: approval.approverName,
      isDelegated: approval.isDelegated,
      ageInDays: approval.ageInDays,
    },
  };
  
  const style: CanvasStyle = {
    backgroundColor: CELL_COLORS['04'],
    borderColor: statusColor,
    borderWidth: 2,
    pulse: urgency === 'overdue',
  };
  
  const priorityScore = calculatePriorityScore({
    amountCents: approval.invoiceAmountCents,
    daysUntilDue: approval.ageInDays ? -approval.ageInDays : undefined,
    status: approval.decision,
  });
  
  return {
    displayData,
    style,
    sourceRef: buildURN('04', approval.id),
    priorityScore,
  };
}

/**
 * Transform payment to canvas display data
 */
export function transformPayment(payment: PaymentEntity): {
  displayData: CanvasDisplayData;
  style: CanvasStyle;
  sourceRef: string;
  priorityScore: number;
} {
  const statusColor = STATUS_COLORS.payment[payment.status as keyof typeof STATUS_COLORS.payment] ?? '#94A3B8';
  const urgency = calculateUrgency(payment.dueDate);
  
  const amountCents = Math.round(parseFloat(payment.amount) * 100);
  const daysUntilDue = payment.dueDate 
    ? Math.ceil((new Date(payment.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : undefined;
  
  const displayData: CanvasDisplayData = {
    entityType: 'payment',
    cellCode: 'AP-05',
    title: payment.paymentNumber,
    subtitle: payment.vendorName,
    status: payment.status,
    statusColor,
    amount: payment.amount,
    currency: payment.currency,
    dueDate: payment.dueDate?.toISOString().split('T')[0],
    urgency,
    metadata: {
      bankReference: payment.bankReference,
      retryCount: payment.retryCount,
    },
  };
  
  const style: CanvasStyle = {
    backgroundColor: CELL_COLORS['05'],
    borderColor: statusColor,
    borderWidth: 2,
    pulse: payment.status === 'failed' || urgency === 'overdue',
  };
  
  const priorityScore = calculatePriorityScore({
    amountCents,
    daysUntilDue,
    status: payment.status,
  });
  
  return {
    displayData,
    style,
    sourceRef: buildURN('05', payment.id),
    priorityScore,
  };
}

// ============================================================================
// 5. UNIFIED TRANSFORMER
// ============================================================================

/**
 * Transform any AP entity to canvas display data
 */
export function transformEntity(
  cell: APCellCode,
  entity: VendorEntity | InvoiceEntity | MatchEntity | ApprovalEntity | PaymentEntity
): {
  displayData: CanvasDisplayData;
  style: CanvasStyle;
  sourceRef: string;
  priorityScore: number;
} {
  switch (cell) {
    case '01':
      return transformVendor(entity as VendorEntity);
    case '02':
      return transformInvoice(entity as InvoiceEntity);
    case '03':
      return transformMatch(entity as MatchEntity);
    case '04':
      return transformApproval(entity as ApprovalEntity);
    case '05':
      return transformPayment(entity as PaymentEntity);
    default:
      throw new Error(`Unknown cell code: ${cell}`);
  }
}

// ============================================================================
// 6. HELPERS
// ============================================================================

/**
 * Format amount in cents to display string
 */
function formatAmount(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Get status color for any entity
 */
export function getStatusColor(cell: APCellCode, status: string): string {
  const colorMap = {
    '01': STATUS_COLORS.vendor,
    '02': STATUS_COLORS.invoice,
    '03': STATUS_COLORS.match,
    '04': STATUS_COLORS.approval,
    '05': STATUS_COLORS.payment,
  }[cell];
  
  return (colorMap as Record<string, string>)[status] ?? '#94A3B8';
}
