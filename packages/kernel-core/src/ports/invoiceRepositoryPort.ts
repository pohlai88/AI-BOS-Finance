/**
 * Invoice Repository Port
 * 
 * Interface for invoice persistence operations.
 * Used by AP-02 Invoice Entry Cell.
 * 
 * Anti-Gravity: This is a PORT, not an adapter.
 * It defines WHAT we need, not HOW it's implemented.
 */

// ============================================================================
// 1. TYPES
// ============================================================================

/**
 * Invoice status (state machine)
 */
export type InvoiceStatus =
  | 'draft'
  | 'submitted'
  | 'matched'
  | 'approved'
  | 'posted'
  | 'paid'
  | 'closed'
  | 'voided';

/**
 * Match status from AP-03 3-Way Engine
 */
export type MatchStatus = 'passed' | 'exception' | 'skipped';

/**
 * Transaction context for transactional operations
 */
export interface InvoiceTransactionContext {
  /** Database transaction handle */
  tx: unknown;
  /** Correlation ID for tracing */
  correlationId: string;
}

/**
 * Invoice header entity
 */
export interface Invoice {
  id: string;
  tenantId: string;
  companyId: string;

  // Identification
  invoiceNumber: string; // Vendor's invoice number
  invoiceDate: Date;
  dueDate: Date;
  reference?: string; // Internal reference

  // Vendor Link (AP-01)
  vendorId: string;
  vendorCode?: string; // Denormalized for display
  vendorName?: string; // Denormalized for display

  // Amounts (in cents to avoid floating point issues)
  subtotalCents: number;
  taxAmountCents: number;
  totalAmountCents: number;
  currency: string; // ISO 4217

  // Status Machine
  status: InvoiceStatus;

  // Matching (AP-03)
  matchStatus?: MatchStatus;
  matchResultId?: string; // Link to AP-03 match result

  // GL Posting
  journalHeaderId?: string; // FK to finance.journal_headers
  postedAt?: Date;
  postedBy?: string;

  // Payment Link (AP-05)
  paymentId?: string; // FK to finance.payments

  // Duplicate Detection
  duplicateFlag: boolean;
  duplicateOfInvoiceId?: string;

  // Audit
  createdBy: string;
  createdAt: Date;
  submittedBy?: string;
  submittedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  version: number; // Optimistic locking
  updatedAt: Date;
}

/**
 * Invoice line entity
 */
export interface InvoiceLine {
  id: string;
  invoiceId: string;
  tenantId: string;

  // Line Details
  lineNumber: number;
  description: string;
  quantity: number; // Decimal (4 places)
  unitPriceCents: number;
  lineAmountCents: number; // quantity * unit_price

  // GL Posting
  debitAccountCode: string; // Expense/Asset account
  creditAccountCode: string; // AP Payable (default: '2000')

  // Classification
  costCenter?: string;
  projectCode?: string;

  // Audit
  createdAt: Date;
  version: number;
}

/**
 * Invoice with lines (for full invoice retrieval)
 */
export interface InvoiceWithLines extends Invoice {
  lines: InvoiceLine[];
}

/**
 * Invoice creation input
 */
export interface CreateInvoiceInput {
  tenantId: string;
  companyId: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  reference?: string;
  vendorId: string;
  subtotalCents: number;
  taxAmountCents: number;
  totalAmountCents: number;
  currency: string;
  createdBy: string;
}

/**
 * Invoice line creation input
 */
export interface CreateInvoiceLineInput {
  invoiceId: string;
  tenantId: string;
  lineNumber: number;
  description: string;
  quantity: number;
  unitPriceCents: number;
  lineAmountCents: number;
  debitAccountCode: string;
  creditAccountCode?: string;
  costCenter?: string;
  projectCode?: string;
}

/**
 * Invoice update input (draft only)
 */
export interface UpdateInvoiceInput {
  tenantId: string; // Required for RLS
  invoiceNumber?: string;
  invoiceDate?: Date;
  dueDate?: Date;
  reference?: string;
  vendorId?: string;
  subtotalCents?: number;
  taxAmountCents?: number;
  totalAmountCents?: number;
  currency?: string;
}

/**
 * Invoice status update input
 */
export interface UpdateInvoiceStatusInput {
  tenantId: string; // Required for RLS
  status: InvoiceStatus;
  submittedBy?: string;
  submittedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  postedBy?: string;
  postedAt?: Date;
  journalHeaderId?: string;
  paymentId?: string;
  matchStatus?: MatchStatus;
  matchResultId?: string;
}

/**
 * Query filters for listing invoices
 */
export interface InvoiceQueryFilters {
  tenantId: string;
  companyId?: string;
  vendorId?: string;
  status?: InvoiceStatus | InvoiceStatus[];
  matchStatus?: MatchStatus;
  fromDate?: Date;
  toDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  duplicateFlag?: boolean;
  search?: string; // Search in invoiceNumber, reference, vendorName
  limit?: number;
  offset?: number;
}

/**
 * Duplicate check input
 */
export interface DuplicateCheckInput {
  tenantId: string;
  vendorId: string;
  invoiceNumber: string;
  invoiceDate?: Date;
  totalAmountCents?: number;
  excludeInvoiceId?: string; // Exclude this invoice from check
}

/**
 * Duplicate check result
 */
export interface DuplicateCheckResult {
  isDuplicate: boolean;
  exactMatch: boolean;
  matchingInvoiceId?: string;
  matchDetails?: string;
}

// ============================================================================
// 2. PORT INTERFACE
// ============================================================================

export interface InvoiceRepositoryPort {
  /**
   * Execute operations within a transaction
   * 
   * @param callback - Function to execute within transaction
   * @returns Result of the callback
   */
  withTransaction<T>(
    callback: (txContext: InvoiceTransactionContext) => Promise<T>
  ): Promise<T>;

  // ============================================================================
  // INVOICE OPERATIONS
  // ============================================================================

  /**
   * Create a new invoice (header only)
   * 
   * @param input - Invoice creation data
   * @param txContext - Transaction context
   * @returns Created invoice with generated ID
   */
  create(
    input: CreateInvoiceInput,
    txContext: InvoiceTransactionContext
  ): Promise<Invoice>;

  /**
   * Find invoice by ID (read-only)
   * 
   * @param id - Invoice ID
   * @param tenantId - Tenant ID (for RLS)
   * @returns Invoice or null if not found
   */
  findById(
    id: string,
    tenantId: string
  ): Promise<Invoice | null>;

  /**
   * Find invoice by ID with lines (read-only)
   * 
   * @param id - Invoice ID
   * @param tenantId - Tenant ID (for RLS)
   * @returns Invoice with lines or null if not found
   */
  findByIdWithLines(
    id: string,
    tenantId: string
  ): Promise<InvoiceWithLines | null>;

  /**
   * Find invoice by ID with row lock (for update)
   * 
   * @param id - Invoice ID
   * @param tenantId - Tenant ID (for RLS)
   * @param txContext - Transaction context
   * @returns Invoice or null if not found
   */
  findByIdForUpdate(
    id: string,
    tenantId: string,
    txContext: InvoiceTransactionContext
  ): Promise<Invoice | null>;

  /**
   * Find invoice by vendor and invoice number
   * 
   * @param vendorId - Vendor ID
   * @param invoiceNumber - Invoice number
   * @param tenantId - Tenant ID
   * @returns Invoice or null if not found
   */
  findByVendorAndNumber(
    vendorId: string,
    invoiceNumber: string,
    tenantId: string
  ): Promise<Invoice | null>;

  /**
   * Update invoice (draft only)
   * 
   * @param id - Invoice ID
   * @param input - Update data
   * @param txContext - Transaction context
   * @returns Updated invoice
   */
  update(
    id: string,
    input: UpdateInvoiceInput,
    txContext: InvoiceTransactionContext
  ): Promise<Invoice>;

  /**
   * Update invoice status
   * 
   * @param id - Invoice ID
   * @param input - Status update data
   * @param txContext - Transaction context
   * @returns Updated invoice
   */
  updateStatus(
    id: string,
    input: UpdateInvoiceStatusInput,
    txContext: InvoiceTransactionContext
  ): Promise<Invoice>;

  /**
   * List invoices with filters
   * 
   * @param filters - Query filters
   * @returns Invoices and total count
   */
  list(filters: InvoiceQueryFilters): Promise<{
    invoices: Invoice[];
    total: number;
  }>;

  // ============================================================================
  // INVOICE LINE OPERATIONS
  // ============================================================================

  /**
   * Add line to invoice
   * 
   * @param input - Line creation data
   * @param txContext - Transaction context
   * @returns Created line
   */
  addLine(
    input: CreateInvoiceLineInput,
    txContext: InvoiceTransactionContext
  ): Promise<InvoiceLine>;

  /**
   * Add multiple lines to invoice
   * 
   * @param lines - Array of line creation data
   * @param txContext - Transaction context
   * @returns Created lines
   */
  addLines(
    lines: CreateInvoiceLineInput[],
    txContext: InvoiceTransactionContext
  ): Promise<InvoiceLine[]>;

  /**
   * Find line by ID
   * 
   * @param id - Line ID
   * @param tenantId - Tenant ID
   * @returns Line or null if not found
   */
  findLineById(
    id: string,
    tenantId: string
  ): Promise<InvoiceLine | null>;

  /**
   * List lines for an invoice
   * 
   * @param invoiceId - Invoice ID
   * @param tenantId - Tenant ID
   * @returns Lines ordered by lineNumber
   */
  listLines(
    invoiceId: string,
    tenantId: string
  ): Promise<InvoiceLine[]>;

  /**
   * Update line (draft invoice only)
   * 
   * @param id - Line ID
   * @param input - Update data (partial)
   * @param txContext - Transaction context
   * @returns Updated line
   */
  updateLine(
    id: string,
    input: Partial<CreateInvoiceLineInput>,
    txContext: InvoiceTransactionContext
  ): Promise<InvoiceLine>;

  /**
   * Delete line (draft invoice only)
   * 
   * @param id - Line ID
   * @param tenantId - Tenant ID
   * @param txContext - Transaction context
   */
  deleteLine(
    id: string,
    tenantId: string,
    txContext: InvoiceTransactionContext
  ): Promise<void>;

  /**
   * Delete all lines for an invoice (draft invoice only)
   * 
   * @param invoiceId - Invoice ID
   * @param tenantId - Tenant ID
   * @param txContext - Transaction context
   */
  deleteAllLines(
    invoiceId: string,
    tenantId: string,
    txContext: InvoiceTransactionContext
  ): Promise<void>;

  // ============================================================================
  // DUPLICATE DETECTION
  // ============================================================================

  /**
   * Check for duplicate invoice
   * 
   * @param input - Duplicate check parameters
   * @returns Duplicate check result
   */
  checkDuplicate(
    input: DuplicateCheckInput
  ): Promise<DuplicateCheckResult>;

  /**
   * Mark invoice as potential duplicate
   * 
   * @param invoiceId - Invoice ID
   * @param duplicateOfId - ID of the original invoice
   * @param tenantId - Tenant ID
   * @param txContext - Transaction context
   * @returns Updated invoice
   */
  markAsDuplicate(
    invoiceId: string,
    duplicateOfId: string,
    tenantId: string,
    txContext: InvoiceTransactionContext
  ): Promise<Invoice>;

  // ============================================================================
  // GL POSTING
  // ============================================================================

  /**
   * Record GL posting
   * 
   * @param invoiceId - Invoice ID
   * @param journalHeaderId - Journal header ID
   * @param postedBy - User who triggered posting
   * @param tenantId - Tenant ID
   * @param txContext - Transaction context
   * @returns Updated invoice
   */
  recordGLPosting(
    invoiceId: string,
    journalHeaderId: string,
    postedBy: string,
    tenantId: string,
    txContext: InvoiceTransactionContext
  ): Promise<Invoice>;

  // ============================================================================
  // AGGREGATIONS
  // ============================================================================

  /**
   * Get total amounts by status
   * 
   * @param tenantId - Tenant ID
   * @param companyId - Company ID (optional)
   * @returns Totals by status
   */
  getTotalsByStatus(
    tenantId: string,
    companyId?: string
  ): Promise<Map<InvoiceStatus, { count: number; totalCents: number }>>;

  /**
   * Get aging buckets (0-30, 31-60, 61-90, 90+ days)
   * 
   * @param tenantId - Tenant ID
   * @param companyId - Company ID (optional)
   * @returns Aging buckets with totals
   */
  getAgingBuckets(
    tenantId: string,
    companyId?: string
  ): Promise<{
    current: number;
    days30: number;
    days60: number;
    days90: number;
    over90: number;
  }>;
}
