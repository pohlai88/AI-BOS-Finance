/**
 * Entity Transformers
 * 
 * Converts AR entities (customers, invoices, receipts, credit notes, aging)
 * into canvas display data for hydrated stickies.
 * 
 * Each transformer extracts the essential information needed to render
 * a sticky note on the canvas, including status colors and urgency indicators.
 * 
 * @module AR-Canvas
 */

import type { CanvasDisplayData, CanvasStyle } from '@aibos/kernel-core';
import { buildURN, type ARCellCode } from './urn';

// =============================================================================
// 1. STATUS COLORS
// =============================================================================

/**
 * Status color tokens by cell and status
 * These map to semantic colors for consistent UI
 */
export const STATUS_COLORS = {
  customer: {
    draft: '#94A3B8',           // Slate
    submitted: '#3B82F6',       // Blue
    approved: '#10B981',        // Emerald
    suspended: '#6B7280',       // Gray
    archived: '#4B5563',        // Dark gray
  },
  invoice: {
    draft: '#94A3B8',           // Slate
    submitted: '#3B82F6',       // Blue
    approved: '#8B5CF6',        // Violet
    posted: '#14B8A6',          // Teal
    paid: '#22C55E',            // Green
    closed: '#6B7280',          // Gray
    voided: '#EF4444',          // Red
  },
  receipt: {
    draft: '#94A3B8',           // Slate
    submitted: '#3B82F6',       // Blue
    approved: '#10B981',        // Emerald
    posted: '#14B8A6',          // Teal
    reversed: '#EF4444',        // Red
    voided: '#6B7280',          // Gray
  },
  creditnote: {
    draft: '#94A3B8',           // Slate
    submitted: '#3B82F6',       // Blue
    approved: '#10B981',        // Emerald
    posted: '#14B8A6',          // Teal
    applied: '#22C55E',         // Green
    voided: '#EF4444',          // Red
  },
  aging: {
    current: '#10B981',         // Green
    overdue: '#F59E0B',         // Amber
    collection: '#EF4444',      // Red
  },
  collection: {
    current: '#10B981',         // Green
    follow_up: '#F59E0B',       // Amber
    reminder_sent: '#3B82F6',   // Blue
    escalated: '#EF4444',       // Red
    payment_promised: '#8B5CF6', // Violet
    disputed: '#F97316',        // Orange
    write_off: '#7F1D1D',       // Dark red
  },
} as const;

/**
 * Aging bucket colors (severity increases with age)
 */
export const AGING_BUCKET_COLORS = {
  CURRENT: '#10B981',    // Green
  '1_30': '#F59E0B',     // Amber
  '31_60': '#F97316',    // Orange
  '61_90': '#EF4444',    // Red
  '91_120': '#B91C1C',   // Dark red
  OVER_120: '#7F1D1D',   // Darkest red
} as const;

/**
 * Default sticky background colors by cell
 */
export const CELL_COLORS: Record<ARCellCode, string> = {
  '01': '#FEF3C7', // Amber-100 (Customers)
  '02': '#DBEAFE', // Blue-100 (Invoices)
  '03': '#D1FAE5', // Green-100 (Receipts)
  '04': '#FCE7F3', // Pink-100 (Credit Notes)
  '05': '#FEE2E2', // Red-100 (Aging)
};

// =============================================================================
// 2. URGENCY CALCULATION
// =============================================================================

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
 * Calculate days overdue
 */
export function calculateDaysOverdue(dueDate?: Date | string | null): number {
  if (!dueDate) return 0;

  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Calculate AR priority score based on entity factors
 */
export function calculateARPriorityScore(factors: {
  outstandingAmountCents?: number;
  daysOverdue?: number;
  hasRedFlag?: boolean;
  isOverCreditLimit?: boolean;
  collectionActionCount?: number;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
}): number {
  let score = 0;

  // Amount-based (0-30 points)
  const amount = factors.outstandingAmountCents ?? 0;
  if (amount >= 100_000_00) score += 30;      // $100K+
  else if (amount >= 50_000_00) score += 25;  // $50K+
  else if (amount >= 10_000_00) score += 15;  // $10K+
  else if (amount >= 1_000_00) score += 5;    // $1K+

  // Days overdue (0-30 points)
  const days = factors.daysOverdue ?? 0;
  if (days >= 120) score += 30;
  else if (days >= 90) score += 25;
  else if (days >= 60) score += 15;
  else if (days >= 30) score += 10;

  // Risk flags (0-25 points)
  if (factors.hasRedFlag) score += 20;
  if (factors.isOverCreditLimit) score += 25;

  // Risk level (0-10 points)
  if (factors.riskLevel === 'HIGH') score += 10;
  else if (factors.riskLevel === 'MEDIUM') score += 5;

  // Collection history (0-15 points)
  const actions = factors.collectionActionCount ?? 0;
  if (actions === 0 && days > 30) score += 15; // No action taken on overdue

  return Math.min(score, 100);
}

// =============================================================================
// 3. ENTITY TYPES (for input)
// =============================================================================

/**
 * Customer entity (from AR-01)
 */
export interface CustomerEntity {
  id: string;
  customerCode: string;
  legalName: string;
  displayName?: string;
  status: string;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  creditLimit?: number;
  currentBalance?: number;
  outstandingBalance?: number;
  country?: string;
  currencyPreference?: string;
  collectionStatus?: 'CURRENT' | 'OVERDUE' | 'COLLECTION';
  oldestInvoiceDate?: Date;
  createdAt?: Date;
}

/**
 * Invoice entity (from AR-02)
 */
export interface InvoiceEntity {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName?: string;
  totalAmount: number;
  outstandingAmount: number;
  currency: string;
  status: string;
  invoiceDate?: Date;
  dueDate?: Date;
  lineCount?: number;
  paidAmount?: number;
  createdAt?: Date;
}

/**
 * Receipt entity (from AR-03)
 */
export interface ReceiptEntity {
  id: string;
  receiptNumber: string;
  customerId: string;
  customerName?: string;
  receiptAmount: number;
  allocatedAmount: number;
  unallocatedAmount: number;
  currency: string;
  status: string;
  receiptDate?: Date;
  receiptMethod?: string;
  bankReference?: string;
  createdAt?: Date;
}

/**
 * Credit Note entity (from AR-04)
 */
export interface CreditNoteEntity {
  id: string;
  creditNoteNumber: string;
  customerId: string;
  customerName?: string;
  totalAmount: number;
  appliedAmount: number;
  unappliedAmount: number;
  currency: string;
  status: string;
  creditNoteDate?: Date;
  reason?: string;
  originalInvoiceNumber?: string;
  createdAt?: Date;
}

/**
 * Aging entity (from AR-05)
 */
export interface AgingEntity {
  id: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  totalOutstanding: number;
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  days91to120: number;
  over120Days: number;
  oldestInvoiceDate?: Date;
  averageDaysOverdue: number;
  collectionStatus: 'CURRENT' | 'OVERDUE' | 'COLLECTION';
  lastContactDate?: Date;
  snapshotDate?: Date;
}

// =============================================================================
// 4. TRANSFORMER FUNCTIONS
// =============================================================================

/**
 * Transform customer to canvas display data
 */
export function transformCustomer(customer: CustomerEntity): {
  displayData: CanvasDisplayData;
  style: CanvasStyle;
  sourceRef: string;
  priorityScore: number;
} {
  const statusColor = STATUS_COLORS.customer[customer.status as keyof typeof STATUS_COLORS.customer] ?? '#94A3B8';
  const collectionColor = customer.collectionStatus 
    ? STATUS_COLORS.aging[customer.collectionStatus.toLowerCase() as keyof typeof STATUS_COLORS.aging] 
    : '#10B981';

  const creditUtilization = customer.creditLimit && customer.creditLimit > 0
    ? Math.round(((customer.currentBalance ?? 0) / customer.creditLimit) * 100)
    : 0;

  const displayData: CanvasDisplayData = {
    entityType: 'customer',
    cellCode: 'AR-01',
    title: customer.customerCode,
    subtitle: customer.displayName || customer.legalName,
    status: customer.status,
    statusColor,
    amount: customer.outstandingBalance?.toFixed(2),
    urgency: customer.riskLevel === 'HIGH' ? 'critical' : customer.collectionStatus === 'COLLECTION' ? 'overdue' : 'normal',
    metadata: {
      riskLevel: customer.riskLevel,
      creditLimit: customer.creditLimit,
      creditUtilization,
      collectionStatus: customer.collectionStatus,
      country: customer.country,
    },
  };

  const style: CanvasStyle = {
    backgroundColor: CELL_COLORS['01'],
    borderColor: collectionColor,
    borderWidth: customer.collectionStatus === 'COLLECTION' ? 3 : 2,
    pulse: customer.collectionStatus === 'COLLECTION',
  };

  const priorityScore = calculateARPriorityScore({
    outstandingAmountCents: Math.round((customer.outstandingBalance ?? 0) * 100),
    isOverCreditLimit: creditUtilization > 100,
    riskLevel: customer.riskLevel,
  });

  return {
    displayData,
    style,
    sourceRef: buildURN('01', customer.id),
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
  const daysOverdue = calculateDaysOverdue(invoice.dueDate);

  const displayData: CanvasDisplayData = {
    entityType: 'invoice',
    cellCode: 'AR-02',
    title: invoice.invoiceNumber,
    subtitle: invoice.customerName || invoice.customerId.slice(0, 8),
    status: invoice.status,
    statusColor,
    amount: invoice.outstandingAmount.toFixed(2),
    currency: invoice.currency,
    dueDate: invoice.dueDate instanceof Date ? invoice.dueDate.toISOString().split('T')[0] : invoice.dueDate,
    urgency,
    metadata: {
      totalAmount: invoice.totalAmount,
      paidAmount: invoice.paidAmount,
      lineCount: invoice.lineCount,
      daysOverdue: daysOverdue > 0 ? daysOverdue : undefined,
    },
  };

  const style: CanvasStyle = {
    backgroundColor: CELL_COLORS['02'],
    borderColor: daysOverdue > 0 ? AGING_BUCKET_COLORS[getAgingBucket(daysOverdue)] : statusColor,
    borderWidth: 2,
    pulse: urgency === 'overdue' || urgency === 'critical',
  };

  const priorityScore = calculateARPriorityScore({
    outstandingAmountCents: Math.round(invoice.outstandingAmount * 100),
    daysOverdue,
  });

  return {
    displayData,
    style,
    sourceRef: buildURN('02', invoice.id),
    priorityScore,
  };
}

/**
 * Transform receipt to canvas display data
 */
export function transformReceipt(receipt: ReceiptEntity): {
  displayData: CanvasDisplayData;
  style: CanvasStyle;
  sourceRef: string;
  priorityScore: number;
} {
  const statusColor = STATUS_COLORS.receipt[receipt.status as keyof typeof STATUS_COLORS.receipt] ?? '#94A3B8';
  const hasUnallocated = receipt.unallocatedAmount > 0;

  const displayData: CanvasDisplayData = {
    entityType: 'receipt',
    cellCode: 'AR-03',
    title: receipt.receiptNumber,
    subtitle: receipt.customerName || receipt.customerId.slice(0, 8),
    status: receipt.status,
    statusColor,
    amount: receipt.receiptAmount.toFixed(2),
    currency: receipt.currency,
    urgency: hasUnallocated ? 'soon' : 'normal',
    metadata: {
      allocatedAmount: receipt.allocatedAmount,
      unallocatedAmount: receipt.unallocatedAmount,
      receiptMethod: receipt.receiptMethod,
      bankReference: receipt.bankReference,
    },
  };

  const style: CanvasStyle = {
    backgroundColor: CELL_COLORS['03'],
    borderColor: hasUnallocated ? '#F59E0B' : statusColor,
    borderWidth: 2,
    pulse: hasUnallocated && receipt.status === 'posted',
  };

  // Priority based on unallocated amount and age
  const priorityScore = hasUnallocated
    ? calculateARPriorityScore({
        outstandingAmountCents: Math.round(receipt.unallocatedAmount * 100),
      })
    : 0;

  return {
    displayData,
    style,
    sourceRef: buildURN('03', receipt.id),
    priorityScore,
  };
}

/**
 * Transform credit note to canvas display data
 */
export function transformCreditNote(creditNote: CreditNoteEntity): {
  displayData: CanvasDisplayData;
  style: CanvasStyle;
  sourceRef: string;
  priorityScore: number;
} {
  const statusColor = STATUS_COLORS.creditnote[creditNote.status as keyof typeof STATUS_COLORS.creditnote] ?? '#94A3B8';
  const hasUnapplied = creditNote.unappliedAmount > 0;

  const displayData: CanvasDisplayData = {
    entityType: 'creditnote',
    cellCode: 'AR-04',
    title: creditNote.creditNoteNumber,
    subtitle: creditNote.customerName || creditNote.customerId.slice(0, 8),
    status: creditNote.status,
    statusColor,
    amount: creditNote.totalAmount.toFixed(2),
    currency: creditNote.currency,
    urgency: hasUnapplied && creditNote.status === 'posted' ? 'soon' : 'normal',
    metadata: {
      appliedAmount: creditNote.appliedAmount,
      unappliedAmount: creditNote.unappliedAmount,
      reason: creditNote.reason,
      originalInvoice: creditNote.originalInvoiceNumber,
    },
  };

  const style: CanvasStyle = {
    backgroundColor: CELL_COLORS['04'],
    borderColor: hasUnapplied ? '#F59E0B' : statusColor,
    borderWidth: 2,
  };

  const priorityScore = hasUnapplied
    ? calculateARPriorityScore({
        outstandingAmountCents: Math.round(creditNote.unappliedAmount * 100),
      })
    : 0;

  return {
    displayData,
    style,
    sourceRef: buildURN('04', creditNote.id),
    priorityScore,
  };
}

/**
 * Transform aging record to canvas display data
 */
export function transformAging(aging: AgingEntity): {
  displayData: CanvasDisplayData;
  style: CanvasStyle;
  sourceRef: string;
  priorityScore: number;
} {
  const collectionColor = STATUS_COLORS.aging[aging.collectionStatus.toLowerCase() as keyof typeof STATUS_COLORS.aging] ?? '#10B981';

  // Calculate worst bucket
  const worstBucket = getWorstAgingBucket(aging);
  const bucketColor = AGING_BUCKET_COLORS[worstBucket];

  const displayData: CanvasDisplayData = {
    entityType: 'aging',
    cellCode: 'AR-05',
    title: aging.customerCode,
    subtitle: aging.customerName,
    status: aging.collectionStatus,
    statusColor: collectionColor,
    amount: aging.totalOutstanding.toFixed(2),
    urgency: aging.collectionStatus === 'COLLECTION' ? 'critical' : aging.collectionStatus === 'OVERDUE' ? 'overdue' : 'normal',
    metadata: {
      current: aging.current,
      days1to30: aging.days1to30,
      days31to60: aging.days31to60,
      days61to90: aging.days61to90,
      days91to120: aging.days91to120,
      over120Days: aging.over120Days,
      averageDaysOverdue: aging.averageDaysOverdue,
      lastContactDate: aging.lastContactDate,
    },
  };

  const style: CanvasStyle = {
    backgroundColor: CELL_COLORS['05'],
    borderColor: bucketColor,
    borderWidth: aging.collectionStatus === 'COLLECTION' ? 3 : 2,
    pulse: aging.over120Days > 0,
  };

  const priorityScore = calculateARPriorityScore({
    outstandingAmountCents: Math.round(aging.totalOutstanding * 100),
    daysOverdue: aging.averageDaysOverdue,
    collectionActionCount: aging.lastContactDate ? 1 : 0,
  });

  return {
    displayData,
    style,
    sourceRef: buildURN('05', aging.id),
    priorityScore,
  };
}

// =============================================================================
// 5. UNIFIED TRANSFORMER
// =============================================================================

/**
 * Transform any AR entity to canvas display data
 */
export function transformEntity(
  cell: ARCellCode,
  entity: CustomerEntity | InvoiceEntity | ReceiptEntity | CreditNoteEntity | AgingEntity
): {
  displayData: CanvasDisplayData;
  style: CanvasStyle;
  sourceRef: string;
  priorityScore: number;
} {
  switch (cell) {
    case '01':
      return transformCustomer(entity as CustomerEntity);
    case '02':
      return transformInvoice(entity as InvoiceEntity);
    case '03':
      return transformReceipt(entity as ReceiptEntity);
    case '04':
      return transformCreditNote(entity as CreditNoteEntity);
    case '05':
      return transformAging(entity as AgingEntity);
    default:
      throw new Error(`Unknown cell code: ${cell}`);
  }
}

// =============================================================================
// 6. HELPERS
// =============================================================================

/**
 * Get aging bucket from days overdue
 */
function getAgingBucket(daysOverdue: number): keyof typeof AGING_BUCKET_COLORS {
  if (daysOverdue <= 0) return 'CURRENT';
  if (daysOverdue <= 30) return '1_30';
  if (daysOverdue <= 60) return '31_60';
  if (daysOverdue <= 90) return '61_90';
  if (daysOverdue <= 120) return '91_120';
  return 'OVER_120';
}

/**
 * Get worst aging bucket for a customer
 */
function getWorstAgingBucket(aging: AgingEntity): keyof typeof AGING_BUCKET_COLORS {
  if (aging.over120Days > 0) return 'OVER_120';
  if (aging.days91to120 > 0) return '91_120';
  if (aging.days61to90 > 0) return '61_90';
  if (aging.days31to60 > 0) return '31_60';
  if (aging.days1to30 > 0) return '1_30';
  return 'CURRENT';
}

/**
 * Get status color for any entity
 */
export function getStatusColor(cell: ARCellCode, status: string): string {
  const colorMap = {
    '01': STATUS_COLORS.customer,
    '02': STATUS_COLORS.invoice,
    '03': STATUS_COLORS.receipt,
    '04': STATUS_COLORS.creditnote,
    '05': STATUS_COLORS.aging,
  }[cell];

  return (colorMap as Record<string, string>)[status] ?? '#94A3B8';
}

/**
 * Format currency amount
 */
export function formatAmount(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}
