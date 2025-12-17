/**
 * AR-02 Sales Invoice - Invoice Repository Port
 * 
 * Port interface for invoice data persistence.
 * Follows hexagonal architecture pattern.
 * 
 * @module AR-02
 */

// =============================================================================
// Types
// =============================================================================

export type InvoiceStatus = 'draft' | 'submitted' | 'approved' | 'posted' | 'paid' | 'closed' | 'voided';
export type DiscountType = 'percentage' | 'fixed';
export type PaymentTerms = 'NET_30' | 'NET_60' | 'NET_90' | '2_10_NET_30' | 'DUE_ON_RECEIPT' | 'CUSTOM';

/**
 * Invoice entity
 */
export interface Invoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  invoiceDate: Date;
  dueDate: Date;
  currency: string;
  subtotal: number;
  discountType?: DiscountType | null;
  discountValue: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  paymentTerms: PaymentTerms;
  notes?: string | null;
  internalNotes?: string | null;
  status: InvoiceStatus;
  postingIdempotencyKey?: string | null;
  journalHeaderId?: string | null;
  postedAt?: Date | null;
  postedBy?: string | null;
  createdBy: string;
  createdAt: Date;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  version: number;
  updatedAt: Date;
}

/**
 * Invoice line entity
 */
export interface InvoiceLine {
  id: string;
  invoiceId: string;
  tenantId: string;
  lineNumber: number;
  description: string;
  productCode?: string | null;
  quantity: number;
  unitPrice: number;
  discountType?: DiscountType | null;
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
  revenueAccountId: string;
  taxAccountId?: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Invoice settlement entity (payment allocation)
 */
export interface InvoiceSettlement {
  id: string;
  invoiceId: string;
  receiptId: string;
  tenantId: string;
  allocatedAmount: number;
  allocatedAt: Date;
  allocatedBy: string;
  version: number;
}

/**
 * Create invoice input
 */
export interface CreateInvoiceData {
  tenantId: string;
  customerId: string;
  invoiceDate: Date;
  dueDate: Date;
  currency?: string;
  paymentTerms?: PaymentTerms;
  discountType?: DiscountType;
  discountValue?: number;
  notes?: string;
  internalNotes?: string;
  createdBy: string;
}

/**
 * Update invoice input
 */
export interface UpdateInvoiceData {
  customerId?: string;
  invoiceDate?: Date;
  dueDate?: Date;
  currency?: string;
  paymentTerms?: PaymentTerms;
  discountType?: DiscountType;
  discountValue?: number;
  notes?: string;
  internalNotes?: string;
  status?: InvoiceStatus;
  approvedBy?: string;
  approvedAt?: Date;
  postingIdempotencyKey?: string;
  journalHeaderId?: string;
  postedAt?: Date;
  postedBy?: string;
  paidAmount?: number;
}

/**
 * Create invoice line input
 */
export interface CreateInvoiceLineData {
  invoiceId: string;
  tenantId: string;
  lineNumber: number;
  description: string;
  productCode?: string;
  quantity: number;
  unitPrice: number;
  discountType?: DiscountType;
  discountValue?: number;
  taxRate: number;
  revenueAccountId: string;
  taxAccountId?: string;
}

/**
 * Invoice list filter
 */
export interface InvoiceFilter {
  status?: InvoiceStatus | InvoiceStatus[];
  customerId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Duplicate check result
 */
export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchingInvoices?: Array<{
    id: string;
    invoiceNumber: string;
    invoiceDate: Date;
    totalAmount: number;
  }>;
}

/**
 * Transaction context
 */
export interface TransactionContext {
  client?: unknown;
}

// =============================================================================
// Port Interface
// =============================================================================

export interface InvoiceRepositoryPort {
  // Invoice CRUD
  create(data: CreateInvoiceData, invoiceNumber: string, ctx?: TransactionContext): Promise<Invoice>;
  getById(id: string, tenantId: string, ctx?: TransactionContext): Promise<Invoice | null>;
  getByNumber(invoiceNumber: string, tenantId: string, ctx?: TransactionContext): Promise<Invoice | null>;
  update(id: string, tenantId: string, data: UpdateInvoiceData, expectedVersion: number, ctx?: TransactionContext): Promise<Invoice | null>;
  list(tenantId: string, filter: InvoiceFilter, ctx?: TransactionContext): Promise<{ data: Invoice[]; total: number }>;
  
  // Duplicate detection
  checkDuplicate(tenantId: string, customerId: string, invoiceDate: Date, totalAmount: number, excludeId?: string): Promise<DuplicateCheckResult>;
  
  // Invoice lines
  createLine(data: CreateInvoiceLineData, ctx?: TransactionContext): Promise<InvoiceLine>;
  getLines(invoiceId: string, tenantId: string, ctx?: TransactionContext): Promise<InvoiceLine[]>;
  updateLine(id: string, tenantId: string, data: Partial<CreateInvoiceLineData>, expectedVersion: number, ctx?: TransactionContext): Promise<InvoiceLine | null>;
  deleteLine(id: string, tenantId: string, ctx?: TransactionContext): Promise<boolean>;
  deleteLinesByInvoice(invoiceId: string, tenantId: string, ctx?: TransactionContext): Promise<number>;
  
  // Settlements
  createSettlement(invoiceId: string, receiptId: string, tenantId: string, amount: number, allocatedBy: string, ctx?: TransactionContext): Promise<InvoiceSettlement>;
  getSettlements(invoiceId: string, tenantId: string, ctx?: TransactionContext): Promise<InvoiceSettlement[]>;
  
  // Recalculation
  recalculateTotals(invoiceId: string, tenantId: string, ctx?: TransactionContext): Promise<Invoice>;
  
  // Transaction support
  beginTransaction(): Promise<TransactionContext>;
  commitTransaction(ctx: TransactionContext): Promise<void>;
  rollbackTransaction(ctx: TransactionContext): Promise<void>;
}

export function createInvoiceRepositoryPort(adapter: InvoiceRepositoryPort): InvoiceRepositoryPort {
  return adapter;
}
