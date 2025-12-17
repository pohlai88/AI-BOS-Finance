/**
 * Journal Entry Repository Port
 * 
 * Interface for Journal Entry persistence operations.
 * Used by GL-02 Journal Entry Cell.
 * 
 * Anti-Gravity: This is a PORT, not an adapter.
 * It defines WHAT we need, not HOW it's implemented.
 * 
 * @file packages/kernel-core/src/ports/journalEntryRepositoryPort.ts
 */

// ============================================================================
// 1. TYPES
// ============================================================================

/**
 * Journal Entry Type
 */
export type JournalEntryType =
  | 'adjusting'
  | 'accrual'
  | 'reclassification'
  | 'opening'
  | 'closing'
  | 'reversal'
  | 'correction';

/**
 * Journal Entry Status
 */
export type JournalEntryStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'posted'
  | 'cancelled'
  | 'closed';

/**
 * Journal Entry entity
 */
export interface JournalEntry {
  // Identity
  id: string;
  tenantId: string;
  companyId: string;

  // Entry Metadata
  entryNumber: string;
  entryDate: Date;
  entryType: JournalEntryType;
  reference: string;
  description: string;

  // Amounts (string for precision - no floats!)
  totalDebit: string;
  totalCredit: string;
  currency: string;
  isBalanced: boolean;

  // Lifecycle
  status: JournalEntryStatus;

  // Reversal Handling
  autoReverse: boolean;
  reverseDate?: Date;
  originalEntryId?: string;
  hasReversal: boolean;
  reversalEntryId?: string;

  // Recurring
  isRecurring: boolean;
  recurringFrequency?: 'monthly' | 'quarterly' | 'yearly';
  recurringStartDate?: Date;
  recurringEndDate?: Date;

  // Workflow
  submittedAt?: Date;
  submittedBy?: string;
  approvedAt?: Date;
  approvedBy?: string;
  rejectedAt?: Date;
  rejectedBy?: string;
  rejectionReason?: string;
  postedAt?: Date;
  postedBy?: string;
  glPostingReference?: string;

  // Attachments
  attachments: JournalEntryAttachment[];

  // Audit
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt?: Date;
  version: number;

  // Relations (loaded optionally)
  lines?: JournalEntryLine[];
}

/**
 * Journal Entry Line
 */
export interface JournalEntryLine {
  id: string;
  journalEntryId: string;
  lineNumber: number;

  // Account
  accountCode: string;
  accountName?: string;

  // Amounts (string for precision)
  debitAmount?: string;
  creditAmount?: string;
  currency: string;

  // Optional FX
  functionalAmount?: string;
  exchangeRate?: string;

  // Description
  description?: string;

  // Dimensions (for analytics)
  costCenter?: string;
  project?: string;
  department?: string;
  segment?: string;

  // Source Linkage
  sourceDocumentType?: string;
  sourceDocumentId?: string;
  sourceLineId?: string;

  // Audit
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Journal Entry Attachment
 */
export interface JournalEntryAttachment {
  id: string;
  journalEntryId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storageUrl: string;
  uploadedBy: string;
  uploadedAt: Date;
}

/**
 * Filter options for querying journal entries
 */
export interface JournalEntryFilter {
  tenantId: string;
  companyId?: string;
  status?: JournalEntryStatus | JournalEntryStatus[];
  entryType?: JournalEntryType | JournalEntryType[];
  dateFrom?: Date;
  dateTo?: Date;
  reference?: string;
  description?: string;
  createdBy?: string;
  minAmount?: string;
  maxAmount?: string;
  accountCode?: string;
  hasReversal?: boolean;
  isRecurring?: boolean;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  limit: number;
  offset: number;
  sortBy?: 'entryDate' | 'entryNumber' | 'createdAt' | 'totalDebit';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Create journal entry input
 */
export interface CreateJournalEntryInput {
  tenantId: string;
  companyId: string;
  entryDate: Date;
  entryType: JournalEntryType;
  reference: string;
  description: string;
  currency: string;
  createdBy: string;
  autoReverse?: boolean;
  reverseDate?: Date;
  isRecurring?: boolean;
  recurringFrequency?: 'monthly' | 'quarterly' | 'yearly';
  recurringStartDate?: Date;
  recurringEndDate?: Date;
  lines: CreateJournalEntryLineInput[];
}

/**
 * Create journal entry line input
 */
export interface CreateJournalEntryLineInput {
  lineNumber: number;
  accountCode: string;
  debitAmount?: string;
  creditAmount?: string;
  currency: string;
  description?: string;
  costCenter?: string;
  project?: string;
  department?: string;
  segment?: string;
  sourceDocumentType?: string;
  sourceDocumentId?: string;
  sourceLineId?: string;
}

/**
 * Update journal entry input (partial)
 */
export interface UpdateJournalEntryInput {
  entryDate?: Date;
  entryType?: JournalEntryType;
  reference?: string;
  description?: string;
  autoReverse?: boolean;
  reverseDate?: Date;
  updatedBy: string;
}

/**
 * Transaction context for atomic operations
 */
export interface TransactionContext {
  client: unknown; // Database client (pg.PoolClient, etc.)
}

// ============================================================================
// 2. PORT INTERFACE
// ============================================================================

/**
 * Journal Entry Repository Port
 * 
 * ENTERPRISE REQUIREMENTS:
 * - Transactional integrity (entry + lines + audit)
 * - Optimistic locking (version conflicts)
 * - Tenant isolation
 * - Audit trail
 */
export interface JournalEntryRepositoryPort {
  /**
   * Create a new journal entry with lines
   * 
   * @param input - Journal entry data
   * @param txContext - Optional transaction context
   * @returns Created journal entry with generated ID and entry number
   * 
   * Business Rules:
   * - Entry number is auto-generated (sequence)
   * - Status defaults to 'draft'
   * - Totals are computed from lines
   * - Lines are created atomically with entry
   */
  create(
    input: CreateJournalEntryInput,
    txContext?: TransactionContext
  ): Promise<JournalEntry>;

  /**
   * Get journal entry by ID
   * 
   * @param id - Journal entry ID
   * @param tenantId - Tenant ID
   * @param includeLines - Whether to include lines
   * @returns Journal entry or null
   */
  findById(
    id: string,
    tenantId: string,
    includeLines?: boolean
  ): Promise<JournalEntry | null>;

  /**
   * Get journal entry by entry number
   * 
   * @param entryNumber - Entry number
   * @param tenantId - Tenant ID
   * @param companyId - Company ID
   * @returns Journal entry or null
   */
  findByEntryNumber(
    entryNumber: string,
    tenantId: string,
    companyId: string
  ): Promise<JournalEntry | null>;

  /**
   * Find journal entries by filter
   * 
   * @param filter - Filter options
   * @param pagination - Pagination options
   * @returns Paginated result
   */
  findByFilter(
    filter: JournalEntryFilter,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<JournalEntry>>;

  /**
   * Update journal entry (partial update)
   * 
   * @param id - Journal entry ID
   * @param tenantId - Tenant ID
   * @param input - Update data
   * @param expectedVersion - Version for optimistic locking
   * @param txContext - Optional transaction context
   * @returns Updated journal entry
   * 
   * Business Rules:
   * - Can only update entries in DRAFT status
   * - Version must match (optimistic locking)
   */
  update(
    id: string,
    tenantId: string,
    input: UpdateJournalEntryInput,
    expectedVersion: number,
    txContext?: TransactionContext
  ): Promise<JournalEntry>;

  /**
   * Update journal entry status (workflow transition)
   * 
   * @param id - Journal entry ID
   * @param tenantId - Tenant ID
   * @param newStatus - New status
   * @param workflowData - Workflow-specific data (approvedBy, rejectionReason, etc.)
   * @param expectedVersion - Version for optimistic locking
   * @param txContext - Optional transaction context
   * @returns Updated journal entry
   */
  updateStatus(
    id: string,
    tenantId: string,
    newStatus: JournalEntryStatus,
    workflowData: Partial<JournalEntry>,
    expectedVersion: number,
    txContext?: TransactionContext
  ): Promise<JournalEntry>;

  /**
   * Add lines to existing journal entry
   * 
   * @param journalEntryId - Journal entry ID
   * @param tenantId - Tenant ID
   * @param lines - Lines to add
   * @param txContext - Optional transaction context
   * @returns Created lines
   */
  addLines(
    journalEntryId: string,
    tenantId: string,
    lines: CreateJournalEntryLineInput[],
    txContext?: TransactionContext
  ): Promise<JournalEntryLine[]>;

  /**
   * Get lines for journal entry
   * 
   * @param journalEntryId - Journal entry ID
   * @param tenantId - Tenant ID
   * @returns Lines
   */
  getLines(
    journalEntryId: string,
    tenantId: string
  ): Promise<JournalEntryLine[]>;

  /**
   * Delete lines from journal entry (draft only)
   * 
   * @param journalEntryId - Journal entry ID
   * @param tenantId - Tenant ID
   * @param lineIds - Line IDs to delete
   * @param txContext - Optional transaction context
   */
  deleteLines(
    journalEntryId: string,
    tenantId: string,
    lineIds: string[],
    txContext?: TransactionContext
  ): Promise<void>;

  /**
   * Add attachment to journal entry
   * 
   * @param journalEntryId - Journal entry ID
   * @param tenantId - Tenant ID
   * @param attachment - Attachment data
   * @param txContext - Optional transaction context
   * @returns Created attachment
   */
  addAttachment(
    journalEntryId: string,
    tenantId: string,
    attachment: Omit<JournalEntryAttachment, 'id' | 'journalEntryId'>,
    txContext?: TransactionContext
  ): Promise<JournalEntryAttachment>;

  /**
   * Get entries pending reversal (auto-reverse date reached)
   * 
   * @param tenantId - Tenant ID
   * @param asOfDate - Check reversals as of this date
   * @returns Entries pending reversal
   */
  findPendingReversals(
    tenantId: string,
    asOfDate: Date
  ): Promise<JournalEntry[]>;

  /**
   * Check if reference is unique within company
   * 
   * @param reference - Reference to check
   * @param tenantId - Tenant ID
   * @param companyId - Company ID
   * @param excludeId - Exclude this entry ID (for updates)
   * @returns True if unique
   */
  isReferenceUnique(
    reference: string,
    tenantId: string,
    companyId: string,
    excludeId?: string
  ): Promise<boolean>;

  /**
   * Begin transaction
   * @returns Transaction context
   */
  beginTransaction(): Promise<TransactionContext>;

  /**
   * Commit transaction
   * @param txContext - Transaction context
   */
  commitTransaction(txContext: TransactionContext): Promise<void>;

  /**
   * Rollback transaction
   * @param txContext - Transaction context
   */
  rollbackTransaction(txContext: TransactionContext): Promise<void>;
}
