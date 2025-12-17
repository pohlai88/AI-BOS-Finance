/**
 * AR-04 Credit Note - Repository Port
 * @module AR-04
 */

export type CreditNoteStatus = 'draft' | 'submitted' | 'approved' | 'posted' | 'applied' | 'voided';
export type CreditNoteReason = 'RETURN' | 'PRICING_ERROR' | 'DAMAGED_GOODS' | 'SERVICE_ISSUE' | 'GOODWILL' | 'OTHER';

export interface CreditNote {
  id: string;
  tenantId: string;
  creditNoteNumber: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  originalInvoiceId?: string | null;
  originalInvoiceNumber?: string | null;
  creditNoteDate: Date;
  currency: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  appliedAmount: number;
  unappliedAmount: number;
  reason: CreditNoteReason;
  reasonDescription?: string | null;
  notes?: string | null;
  status: CreditNoteStatus;
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

export interface CreditNoteLine {
  id: string;
  creditNoteId: string;
  tenantId: string;
  lineNumber: number;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
  revenueAccountId: string;
  version: number;
}

export interface CreditNoteApplication {
  id: string;
  creditNoteId: string;
  invoiceId: string;
  tenantId: string;
  appliedAmount: number;
  appliedAt: Date;
  appliedBy: string;
  version: number;
}

export interface CreateCreditNoteData {
  tenantId: string;
  customerId: string;
  originalInvoiceId?: string;
  creditNoteDate: Date;
  currency?: string;
  reason: CreditNoteReason;
  reasonDescription?: string;
  notes?: string;
  createdBy: string;
}

export interface CreditNoteFilter {
  status?: CreditNoteStatus | CreditNoteStatus[];
  customerId?: string;
  originalInvoiceId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface TransactionContext { client?: unknown; }

export interface CreditNoteRepositoryPort {
  create(data: CreateCreditNoteData, creditNoteNumber: string, ctx?: TransactionContext): Promise<CreditNote>;
  getById(id: string, tenantId: string, ctx?: TransactionContext): Promise<CreditNote | null>;
  getByNumber(creditNoteNumber: string, tenantId: string, ctx?: TransactionContext): Promise<CreditNote | null>;
  update(id: string, tenantId: string, data: Partial<CreditNote>, expectedVersion: number, ctx?: TransactionContext): Promise<CreditNote | null>;
  list(tenantId: string, filter: CreditNoteFilter, ctx?: TransactionContext): Promise<{ data: CreditNote[]; total: number }>;
  
  // Lines
  createLine(data: Omit<CreditNoteLine, 'id' | 'version'>, ctx?: TransactionContext): Promise<CreditNoteLine>;
  getLines(creditNoteId: string, tenantId: string, ctx?: TransactionContext): Promise<CreditNoteLine[]>;
  deleteLine(id: string, tenantId: string, ctx?: TransactionContext): Promise<boolean>;
  recalculateTotals(creditNoteId: string, tenantId: string, ctx?: TransactionContext): Promise<CreditNote>;
  
  // Applications
  createApplication(creditNoteId: string, invoiceId: string, tenantId: string, amount: number, appliedBy: string, ctx?: TransactionContext): Promise<CreditNoteApplication>;
  getApplications(creditNoteId: string, tenantId: string, ctx?: TransactionContext): Promise<CreditNoteApplication[]>;
  
  beginTransaction(): Promise<TransactionContext>;
  commitTransaction(ctx: TransactionContext): Promise<void>;
  rollbackTransaction(ctx: TransactionContext): Promise<void>;
}
