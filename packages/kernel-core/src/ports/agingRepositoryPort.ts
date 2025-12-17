/**
 * AR-05 AR Aging & Collection - Repository Port
 * @module AR-05
 */

export type AgingBucket = 'CURRENT' | '1_30' | '31_60' | '61_90' | '91_120' | 'OVER_120';
export type CollectionStatus = 'CURRENT' | 'OVERDUE' | 'COLLECTION' | 'WRITE_OFF';
export type CollectionActionType = 'REMINDER' | 'PHONE_CALL' | 'LETTER' | 'ESCALATION' | 'PAYMENT_PLAN' | 'LEGAL' | 'WRITE_OFF' | 'NOTE';

export interface AgingSnapshot {
  id: string;
  tenantId: string;
  snapshotDate: Date;
  generatedBy: string;
  generatedAt: Date;
  totalOutstanding: number;
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  days91to120: number;
  over120Days: number;
}

export interface CustomerAging {
  id: string;
  snapshotId: string;
  tenantId: string;
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
  oldestInvoiceDate: Date;
  averageDaysOverdue: number;
  collectionStatus: CollectionStatus;
}

export interface InvoiceAging {
  id: string;
  snapshotId: string;
  tenantId: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  invoiceDate: Date;
  dueDate: Date;
  outstandingAmount: number;
  daysOverdue: number;
  agingBucket: AgingBucket;
}

export interface CollectionAction {
  id: string;
  tenantId: string;
  customerId: string;
  invoiceId?: string | null;
  actionType: CollectionActionType;
  actionDate: Date;
  description: string;
  outcome?: string | null;
  followUpDate?: Date | null;
  assignedTo?: string | null;
  createdBy: string;
  createdAt: Date;
  version: number;
}

export interface AgingFilter {
  snapshotId?: string;
  customerId?: string;
  agingBucket?: AgingBucket;
  collectionStatus?: CollectionStatus;
  minAmount?: number;
  limit?: number;
  offset?: number;
}

export interface TransactionContext { client?: unknown; }

export interface AgingRepositoryPort {
  // Snapshots
  createSnapshot(tenantId: string, snapshotDate: Date, generatedBy: string, ctx?: TransactionContext): Promise<AgingSnapshot>;
  getLatestSnapshot(tenantId: string, ctx?: TransactionContext): Promise<AgingSnapshot | null>;
  getSnapshotById(id: string, tenantId: string, ctx?: TransactionContext): Promise<AgingSnapshot | null>;
  listSnapshots(tenantId: string, limit?: number, ctx?: TransactionContext): Promise<AgingSnapshot[]>;
  
  // Customer aging
  saveCustomerAging(data: Omit<CustomerAging, 'id'>, ctx?: TransactionContext): Promise<CustomerAging>;
  getCustomerAging(snapshotId: string, tenantId: string, filter: AgingFilter, ctx?: TransactionContext): Promise<{ data: CustomerAging[]; total: number }>;
  getCustomerAgingDetail(snapshotId: string, customerId: string, tenantId: string, ctx?: TransactionContext): Promise<CustomerAging | null>;
  
  // Invoice aging
  saveInvoiceAging(data: Omit<InvoiceAging, 'id'>, ctx?: TransactionContext): Promise<InvoiceAging>;
  getInvoiceAging(snapshotId: string, tenantId: string, filter: AgingFilter, ctx?: TransactionContext): Promise<{ data: InvoiceAging[]; total: number }>;
  
  // Collection actions
  createCollectionAction(data: Omit<CollectionAction, 'id' | 'createdAt' | 'version'>, ctx?: TransactionContext): Promise<CollectionAction>;
  getCollectionActions(customerId: string, tenantId: string, ctx?: TransactionContext): Promise<CollectionAction[]>;
  updateCollectionAction(id: string, tenantId: string, data: Partial<CollectionAction>, expectedVersion: number, ctx?: TransactionContext): Promise<CollectionAction | null>;
  
  // Calculation (for generating aging)
  getOutstandingInvoices(tenantId: string, asOfDate: Date, ctx?: TransactionContext): Promise<Array<{ invoiceId: string; invoiceNumber: string; customerId: string; invoiceDate: Date; dueDate: Date; outstandingAmount: number }>>;
  
  beginTransaction(): Promise<TransactionContext>;
  commitTransaction(ctx: TransactionContext): Promise<void>;
  rollbackTransaction(ctx: TransactionContext): Promise<void>;
}
