/**
 * Payment Repository Port
 * 
 * Interface for payment persistence operations.
 * Used by AP-05 Payment Execution Cell.
 * 
 * Anti-Gravity: This is a PORT, not an adapter.
 * It defines WHAT we need, not HOW it's implemented.
 */

// ============================================================================
// 1. TYPES
// ============================================================================

/**
 * Payment status (state machine)
 */
export type PaymentStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'processing'
  | 'completed'
  | 'failed';

/**
 * Source document type
 */
export type SourceDocumentType =
  | 'invoice'
  | 'tax'
  | 'payroll'
  | 'bank_fee'
  | 'deposit'
  | 'prepayment'
  | 'other';

/**
 * Transaction context for transactional operations
 */
export interface TransactionContext {
  /** Database transaction handle */
  tx: unknown;
  /** Correlation ID for tracing */
  correlationId: string;
}

/**
 * Payment entity
 */
export interface Payment {
  id: string;
  tenantId: string;
  companyId: string;
  paymentNumber: string;

  // Vendor
  vendorId: string;
  vendorName: string;

  // Money (always strings)
  amount: string;
  currency: string;
  functionalCurrency?: string;
  fxRate?: string;
  functionalAmount?: string;

  // Dates
  paymentDate: Date;
  dueDate?: Date;

  // Status
  status: PaymentStatus;

  // Actors
  createdBy: string;
  approvedBy?: string;
  approvedAt?: Date;
  executedBy?: string;
  executedAt?: Date;

  // Traceability
  sourceDocumentId?: string;
  sourceDocumentType?: SourceDocumentType;
  journalHeaderId?: string;

  // Beneficiary snapshot (at execution)
  beneficiaryAccountNumber?: string;
  beneficiaryRoutingNumber?: string;
  beneficiaryBankName?: string;
  beneficiaryAccountName?: string;
  beneficiarySwiftCode?: string;
  beneficiarySnapshotAt?: Date;

  // Concurrency
  version: number;
  idempotencyKey?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Payment creation input
 */
export interface CreatePaymentInput {
  tenantId: string;
  companyId: string;
  vendorId: string;
  vendorName: string;
  amount: string;
  currency: string;
  paymentDate: Date;
  dueDate?: Date;
  createdBy: string;
  sourceDocumentId?: string;
  sourceDocumentType?: SourceDocumentType;
  idempotencyKey?: string;
}

/**
 * Payment status update input
 */
export interface UpdatePaymentStatusInput {
  status: PaymentStatus;
  approvedBy?: string;
  approvedAt?: Date;
  executedBy?: string;
  executedAt?: Date;
  journalHeaderId?: string;
  beneficiaryAccountNumber?: string;
  beneficiaryRoutingNumber?: string;
  beneficiaryBankName?: string;
  beneficiaryAccountName?: string;
  beneficiarySwiftCode?: string;
  beneficiarySnapshotAt?: Date;
}

/**
 * Payment approval record
 */
export interface PaymentApproval {
  id: string;
  paymentId: string;
  tenantId: string;
  level: number;
  approverId: string;
  action: 'approved' | 'rejected';
  comment?: string;
  decidedAt: Date;
}

/**
 * Payment approval input
 */
export interface RecordApprovalInput {
  paymentId: string;
  tenantId: string;
  level: number;
  approverId: string;
  action: 'approved' | 'rejected';
  comment?: string;
}

/**
 * Query filters for listing payments
 */
export interface PaymentQueryFilters {
  tenantId: string;
  companyId?: string;
  status?: PaymentStatus | PaymentStatus[];
  vendorId?: string;
  createdBy?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

/**
 * Status count with total amount
 */
export interface StatusAggregate {
  status: PaymentStatus;
  count: number;
  totalAmount: string;
  currency: string;
}

/**
 * Company payment aggregate
 */
export interface CompanyAggregate {
  companyId: string;
  companyName?: string;
  pendingCount: number;
  pendingAmount: string;
  completedCount: number;
  completedAmount: string;
  totalCount: number;
  totalAmount: string;
  currency: string;
}

/**
 * Cash position projection
 */
export interface CashPositionEntry {
  date: Date;
  scheduledAmount: string;
  paymentCount: number;
  currency: string;
}

/**
 * Dashboard filters
 */
export interface DashboardFilters {
  tenantId: string;
  companyId?: string;
  fromDate?: Date;
  toDate?: Date;
  currency?: string;
}

// ============================================================================
// 2. PORT INTERFACE
// ============================================================================

export interface PaymentRepositoryPort {
  /**
   * Execute operations within a transaction
   * 
   * @param callback - Function to execute within transaction
   * @returns Result of the callback
   */
  withTransaction<T>(
    callback: (txContext: TransactionContext) => Promise<T>
  ): Promise<T>;

  /**
   * Create a new payment
   * 
   * @param input - Payment creation data
   * @param txContext - Transaction context
   * @returns Created payment with generated ID and number
   */
  create(
    input: CreatePaymentInput,
    txContext: TransactionContext
  ): Promise<Payment>;

  /**
   * Find payment by ID (read-only)
   * 
   * @param id - Payment ID
   * @param tenantId - Tenant ID (for RLS)
   * @returns Payment or null if not found
   */
  findById(
    id: string,
    tenantId: string
  ): Promise<Payment | null>;

  /**
   * Find payment by ID with row lock (for update)
   * 
   * @param id - Payment ID
   * @param tenantId - Tenant ID (for RLS)
   * @param txContext - Transaction context
   * @returns Payment or null if not found
   */
  findByIdForUpdate(
    id: string,
    tenantId: string,
    txContext: TransactionContext
  ): Promise<Payment | null>;

  /**
   * Find payment by idempotency key
   * 
   * @param idempotencyKey - Idempotency key
   * @param tenantId - Tenant ID
   * @param txContext - Transaction context
   * @returns Existing payment or null
   */
  findByIdempotencyKey(
    idempotencyKey: string,
    tenantId: string,
    txContext: TransactionContext
  ): Promise<Payment | null>;

  /**
   * Update payment status
   * 
   * @param id - Payment ID
   * @param input - Status update data
   * @param txContext - Transaction context
   * @returns Updated payment
   */
  updateStatus(
    id: string,
    input: UpdatePaymentStatusInput,
    txContext: TransactionContext
  ): Promise<Payment>;

  /**
   * Record an approval decision
   * 
   * @param input - Approval record data
   * @param txContext - Transaction context
   * @returns Created approval record
   */
  recordApproval(
    input: RecordApprovalInput,
    txContext: TransactionContext
  ): Promise<PaymentApproval>;

  /**
   * List payments with filters
   * 
   * @param filters - Query filters
   * @returns Payments and total count
   */
  list(filters: PaymentQueryFilters): Promise<{
    payments: Payment[];
    total: number;
  }>;

  /**
   * Get approval history for a payment
   * 
   * @param paymentId - Payment ID
   * @param tenantId - Tenant ID
   * @returns Approval records
   */
  getApprovalHistory(
    paymentId: string,
    tenantId: string
  ): Promise<PaymentApproval[]>;

  // ==========================================================================
  // DASHBOARD QUERIES
  // ==========================================================================

  /**
   * Get payment counts and amounts grouped by status
   * 
   * @param filters - Dashboard filters
   * @returns Aggregates by status
   */
  getStatusAggregates(
    filters: DashboardFilters
  ): Promise<StatusAggregate[]>;

  /**
   * Get payment aggregates by company (for group-of-companies view)
   * 
   * @param filters - Dashboard filters
   * @returns Aggregates by company
   */
  getCompanyAggregates(
    filters: DashboardFilters
  ): Promise<CompanyAggregate[]>;

  /**
   * Get cash position projection (scheduled outflows)
   * 
   * @param filters - Dashboard filters
   * @param days - Number of days to project (default 90)
   * @returns Daily cash position entries
   */
  getCashPosition(
    filters: DashboardFilters,
    days?: number
  ): Promise<CashPositionEntry[]>;

  /**
   * Get count of payments pending approval for a specific approver
   * 
   * @param approverId - User ID of approver
   * @param tenantId - Tenant ID
   * @returns Count of pending approvals
   */
  getPendingApprovalCount(
    approverId: string,
    tenantId: string
  ): Promise<number>;
}
