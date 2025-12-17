/**
 * AR-03 Receipt Processing - Repository Port
 * @module AR-03
 */

export type ReceiptStatus = 'draft' | 'submitted' | 'approved' | 'posted' | 'reversed' | 'voided';
export type ReceiptMethod = 'WIRE' | 'ACH' | 'CHECK' | 'CARD' | 'CASH' | 'OTHER';

export interface Receipt {
  id: string;
  tenantId: string;
  receiptNumber: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  receiptDate: Date;
  receiptMethod: ReceiptMethod;
  bankAccountId?: string | null;
  referenceNumber?: string | null;
  currency: string;
  receiptAmount: number;
  allocatedAmount: number;
  unallocatedAmount: number;
  notes?: string | null;
  status: ReceiptStatus;
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

export interface ReceiptAllocation {
  id: string;
  receiptId: string;
  invoiceId: string;
  tenantId: string;
  allocatedAmount: number;
  allocatedAt: Date;
  allocatedBy: string;
  version: number;
}

export interface CreateReceiptData {
  tenantId: string;
  customerId: string;
  receiptDate: Date;
  receiptMethod: ReceiptMethod;
  bankAccountId?: string;
  referenceNumber?: string;
  currency?: string;
  receiptAmount: number;
  notes?: string;
  createdBy: string;
}

export interface ReceiptFilter {
  status?: ReceiptStatus | ReceiptStatus[];
  customerId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface TransactionContext { client?: unknown; }

export interface ReceiptRepositoryPort {
  create(data: CreateReceiptData, receiptNumber: string, ctx?: TransactionContext): Promise<Receipt>;
  getById(id: string, tenantId: string, ctx?: TransactionContext): Promise<Receipt | null>;
  getByNumber(receiptNumber: string, tenantId: string, ctx?: TransactionContext): Promise<Receipt | null>;
  update(id: string, tenantId: string, data: Partial<Receipt>, expectedVersion: number, ctx?: TransactionContext): Promise<Receipt | null>;
  list(tenantId: string, filter: ReceiptFilter, ctx?: TransactionContext): Promise<{ data: Receipt[]; total: number }>;
  
  // Allocations
  createAllocation(receiptId: string, invoiceId: string, tenantId: string, amount: number, allocatedBy: string, ctx?: TransactionContext): Promise<ReceiptAllocation>;
  getAllocations(receiptId: string, tenantId: string, ctx?: TransactionContext): Promise<ReceiptAllocation[]>;
  deleteAllocation(id: string, tenantId: string, ctx?: TransactionContext): Promise<boolean>;
  recalculateAllocated(receiptId: string, tenantId: string, ctx?: TransactionContext): Promise<Receipt>;
  
  // Transaction
  beginTransaction(): Promise<TransactionContext>;
  commitTransaction(ctx: TransactionContext): Promise<void>;
  rollbackTransaction(ctx: TransactionContext): Promise<void>;
}
