/**
 * AP Workbench Schemas - Comprehensive Accounts Payable Demo
 * 
 * Demonstrates real accounting data structures with Zod schemas.
 * Each field uses .describe() for BioTable/BioForm auto-generation.
 */

import { z } from 'zod';

// ============================================================================
// Invoice Schema - Core AP Document
// ============================================================================

export const InvoiceStatusEnum = z.enum([
  'draft',
  'pending_approval',
  'approved',
  'rejected',
  'scheduled',
  'paid',
  'void',
  'on_hold',
]);

export const InvoiceSchema = z.object({
  id: z.string().uuid().describe('Invoice ID'),
  invoiceNumber: z.string().describe('Invoice #'),
  vendorId: z.string().uuid().describe('Vendor ID'),
  vendorName: z.string().describe('Vendor'),
  vendorCode: z.string().describe('Vendor Code'),

  // Amounts
  subtotal: z.number().describe('Subtotal'),
  taxAmount: z.number().describe('Tax'),
  totalAmount: z.number().describe('Total Amount'),
  paidAmount: z.number().default(0).describe('Paid'),
  balanceDue: z.number().describe('Balance Due'),
  currency: z.string().length(3).default('USD').describe('Currency'),

  // Dates
  invoiceDate: z.string().describe('Invoice Date'),
  dueDate: z.string().describe('Due Date'),
  receivedDate: z.string().describe('Received'),
  paymentDate: z.string().optional().describe('Payment Date'),

  // Accounting
  glAccount: z.string().describe('GL Account'),
  costCenter: z.string().optional().describe('Cost Center'),
  department: z.string().optional().describe('Department'),
  projectCode: z.string().optional().describe('Project'),

  // Status & Workflow
  status: InvoiceStatusEnum.describe('Status'),
  approvalLevel: z.number().min(0).max(5).default(0).describe('Approval Level'),
  currentApprover: z.string().optional().describe('Current Approver'),

  // Metadata
  poNumber: z.string().optional().describe('PO #'),
  description: z.string().describe('Description'),
  notes: z.string().optional().describe('Notes'),
  attachmentCount: z.number().default(0).describe('Attachments'),

  // Exceptions
  hasException: z.boolean().default(false).describe('Has Exception'),
  exceptionType: z.string().optional().describe('Exception Type'),
  exceptionMessage: z.string().optional().describe('Exception'),

  // Audit
  createdAt: z.string().datetime().describe('Created'),
  updatedAt: z.string().datetime().describe('Updated'),
  createdBy: z.string().describe('Created By'),
  version: z.number().default(1).describe('Version'),
});

export type Invoice = z.infer<typeof InvoiceSchema>;
export type InvoiceStatus = z.infer<typeof InvoiceStatusEnum>;

// ============================================================================
// Invoice Line Schema
// ============================================================================

export const InvoiceLineSchema = z.object({
  id: z.string().uuid().describe('Line ID'),
  invoiceId: z.string().uuid().describe('Invoice ID'),
  lineNumber: z.number().describe('Line #'),
  description: z.string().describe('Description'),
  quantity: z.number().describe('Qty'),
  unitPrice: z.number().describe('Unit Price'),
  amount: z.number().describe('Amount'),
  glAccount: z.string().describe('GL Account'),
  costCenter: z.string().optional().describe('Cost Center'),
  taxCode: z.string().optional().describe('Tax Code'),
  taxAmount: z.number().default(0).describe('Tax'),
});

export type InvoiceLine = z.infer<typeof InvoiceLineSchema>;

// ============================================================================
// Payment Batch Schema
// ============================================================================

export const PaymentBatchStatusEnum = z.enum([
  'draft',
  'pending_approval',
  'approved',
  'processing',
  'completed',
  'failed',
  'cancelled',
]);

export const PaymentBatchSchema = z.object({
  id: z.string().uuid().describe('Batch ID'),
  batchNumber: z.string().describe('Batch #'),
  description: z.string().describe('Description'),
  paymentDate: z.string().describe('Payment Date'),
  status: PaymentBatchStatusEnum.describe('Status'),

  // Totals
  invoiceCount: z.number().describe('Invoice Count'),
  totalAmount: z.number().describe('Total Amount'),
  currency: z.string().length(3).default('USD').describe('Currency'),

  // Bank Info
  bankAccountId: z.string().uuid().describe('Bank Account'),
  bankAccountName: z.string().describe('Bank Account'),
  paymentMethod: z.enum(['ACH', 'Wire', 'Check', 'Virtual Card']).describe('Method'),

  // Audit
  createdAt: z.string().datetime().describe('Created'),
  createdBy: z.string().describe('Created By'),
  approvedBy: z.string().optional().describe('Approved By'),
  approvedAt: z.string().datetime().optional().describe('Approved At'),
});

export type PaymentBatch = z.infer<typeof PaymentBatchSchema>;

// ============================================================================
// Vendor Schema
// ============================================================================

export const VendorSchema = z.object({
  id: z.string().uuid().describe('Vendor ID'),
  vendorCode: z.string().describe('Vendor Code'),
  name: z.string().describe('Vendor Name'),
  taxId: z.string().optional().describe('Tax ID'),
  paymentTerms: z.string().describe('Payment Terms'),
  defaultGLAccount: z.string().describe('Default GL'),
  defaultCostCenter: z.string().optional().describe('Cost Center'),

  // Banking
  bankName: z.string().optional().describe('Bank Name'),
  bankAccount: z.string().optional().describe('Account #'),
  routingNumber: z.string().optional().describe('Routing #'),

  // Contact
  email: z.string().email().optional().describe('Email'),
  phone: z.string().optional().describe('Phone'),
  address: z.string().optional().describe('Address'),

  // Status
  isActive: z.boolean().default(true).describe('Active'),
  is1099: z.boolean().default(false).describe('1099 Vendor'),

  // Metrics
  ytdPayments: z.number().default(0).describe('YTD Payments'),
  openBalance: z.number().default(0).describe('Open Balance'),
});

export type Vendor = z.infer<typeof VendorSchema>;

// ============================================================================
// Approval Schema
// ============================================================================

export const ApprovalActionEnum = z.enum(['approve', 'reject', 'hold', 'escalate', 'delegate']);

export const ApprovalSchema = z.object({
  id: z.string().uuid().describe('Approval ID'),
  documentId: z.string().uuid().describe('Document ID'),
  documentType: z.enum(['invoice', 'payment_batch', 'journal']).describe('Document Type'),
  level: z.number().describe('Approval Level'),

  // Approver
  approverId: z.string().uuid().describe('Approver ID'),
  approverName: z.string().describe('Approver'),
  approverRole: z.string().describe('Role'),

  // Action
  action: ApprovalActionEnum.optional().describe('Action'),
  comments: z.string().optional().describe('Comments'),

  // Timing
  requestedAt: z.string().datetime().describe('Requested'),
  respondedAt: z.string().datetime().optional().describe('Responded'),
  dueBy: z.string().datetime().optional().describe('Due By'),

  // Status
  isComplete: z.boolean().default(false).describe('Complete'),
  isOverdue: z.boolean().default(false).describe('Overdue'),
});

export type Approval = z.infer<typeof ApprovalSchema>;

// ============================================================================
// Exception Types
// ============================================================================

export const ExceptionTypeEnum = z.enum([
  'DUPLICATE_INVOICE',
  'MISSING_PO',
  'AMOUNT_MISMATCH',
  'STALE_APPROVAL',
  'VENDOR_HOLD',
  'BUDGET_EXCEEDED',
  'PERIOD_CLOSED',
  'BANK_CHANGED',
  'THREE_WAY_MISMATCH',
  'MISSING_RECEIPT',
]);

export type ExceptionType = z.infer<typeof ExceptionTypeEnum>;

// ============================================================================
// AP Dashboard Stats
// ============================================================================

export interface APDashboardStats {
  totalOpenInvoices: number;
  totalOpenAmount: number;
  overdueInvoices: number;
  overdueAmount: number;
  pendingApprovals: number;
  pendingApprovalAmount: number;
  scheduledPayments: number;
  scheduledAmount: number;
  exceptionsCount: number;
  dueThisWeek: number;
  dueThisWeekAmount: number;
}

// ============================================================================
// Period Close Checklist
// ============================================================================

export const PeriodCloseItemSchema = z.object({
  id: z.string().describe('Item ID'),
  category: z.string().describe('Category'),
  task: z.string().describe('Task'),
  description: z.string().optional().describe('Description'),
  status: z.enum(['pending', 'in_progress', 'completed', 'blocked']).describe('Status'),
  assignee: z.string().optional().describe('Assignee'),
  dueDate: z.string().optional().describe('Due Date'),
  completedAt: z.string().datetime().optional().describe('Completed'),
  completedBy: z.string().optional().describe('Completed By'),
  notes: z.string().optional().describe('Notes'),
  isBlocking: z.boolean().default(false).describe('Blocking'),
});

export type PeriodCloseItem = z.infer<typeof PeriodCloseItemSchema>;
