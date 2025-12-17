/**
 * AP-03: 3-Way Match & Controls Engine — Repository Port
 * 
 * Defines the interface for match result persistence.
 * Part of kernel-core as it's a shared port for multiple adapters.
 * 
 * OPTIMIZED: Inlined types to avoid circular dependency with cell module.
 */

// ============================================================================
// INLINE TYPES (Avoid circular import from cell module)
// ============================================================================

export type MatchMode = '1-way' | '2-way' | '3-way';
export type MatchStatus = 'passed' | 'exception' | 'skipped';
export type PolicySource = 'tenant' | 'vendor' | 'category' | 'default';
export type ExceptionType =
  | 'price_mismatch'
  | 'qty_mismatch'
  | 'amount_mismatch'
  | 'missing_po'
  | 'missing_grn'
  | 'insufficient_receipt'
  | 'po_closed'
  | 'grn_closed'
  | 'vendor_mismatch'
  | 'currency_mismatch'
  | 'date_mismatch'
  | 'other';

// ============================================================================
// TRANSACTION CONTEXT
// ============================================================================

export interface MatchTransactionContext {
  tx: unknown;
  correlationId: string;
}

// ============================================================================
// ENTITIES
// ============================================================================

export interface MatchResult {
  id: string;
  invoiceId: string;
  tenantId: string;
  matchMode: MatchMode;
  matchPolicySource: PolicySource;
  status: MatchStatus;
  purchaseOrderId?: string;
  goodsReceiptId?: string;
  priceVariancePercent?: number;
  qtyVariancePercent?: number;
  amountVarianceCents?: number;
  withinTolerance: boolean;
  exceptionReason?: string;
  exceptionCode?: string;
  isOverridden: boolean;
  overrideApprovedBy?: string;
  overrideApprovedAt?: Date;
  overrideReason?: string;
  createdBy: string;
  createdAt: Date;
  evaluatedAt: Date;
  version: number;
  updatedAt: Date;
}

export interface MatchException {
  id: string;
  matchResultId: string;
  tenantId: string;
  exceptionType: ExceptionType;
  severity: string;
  message: string;
  resolutionStatus: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolutionNotes?: string;
  createdAt: Date;
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreateMatchResultInput {
  invoiceId: string;
  tenantId: string;
  matchMode: MatchMode;
  matchPolicySource: PolicySource;
  status: MatchStatus;
  purchaseOrderId?: string;
  goodsReceiptId?: string;
  priceVariancePercent?: number;
  qtyVariancePercent?: number;
  amountVarianceCents?: number;
  withinTolerance: boolean;
  exceptionReason?: string;
  exceptionCode?: string;
  createdBy: string;
}

export interface UpdateMatchResultInput {
  tenantId: string;
  status?: MatchStatus;
  isOverridden?: boolean;
  overrideApprovedBy?: string;
  overrideApprovedAt?: Date;
  overrideReason?: string;
}

export interface CreateExceptionInput {
  matchResultId: string;
  tenantId: string;
  exceptionType: ExceptionType;
  severity: string;
  message: string;
}

export interface ResolveExceptionInput {
  tenantId: string;
  resolutionStatus: 'resolved' | 'overridden';
  resolvedBy: string;
  resolutionNotes?: string;
}

export interface MatchQueryFilters {
  tenantId: string;
  invoiceId?: string;
  status?: MatchStatus | MatchStatus[];
  matchMode?: MatchMode;
  isOverridden?: boolean;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

// ============================================================================
// REPOSITORY PORT
// ============================================================================

export interface MatchingRepositoryPort {
  /**
   * Execute within a transaction
   */
  withTransaction<T>(callback: (txContext: MatchTransactionContext) => Promise<T>): Promise<T>;

  // ========== Match Result Operations ==========

  /**
   * Create a new match result
   */
  create(input: CreateMatchResultInput, txContext: MatchTransactionContext): Promise<MatchResult>;

  /**
   * Find match result by ID
   */
  findById(id: string, tenantId: string): Promise<MatchResult | null>;

  /**
   * Find match result by invoice ID
   */
  findByInvoiceId(invoiceId: string, tenantId: string): Promise<MatchResult | null>;

  /**
   * Update match result
   */
  update(id: string, input: UpdateMatchResultInput, txContext: MatchTransactionContext): Promise<MatchResult>;

  /**
   * List match results with filters
   */
  list(filters: MatchQueryFilters): Promise<{ results: MatchResult[]; total: number }>;

  // ========== Exception Operations ==========

  /**
   * Create a match exception
   */
  createException(input: CreateExceptionInput, txContext: MatchTransactionContext): Promise<MatchException>;

  /**
   * List exceptions for a match result
   */
  listExceptions(matchResultId: string, tenantId: string): Promise<MatchException[]>;

  /**
   * Resolve an exception
   */
  resolveException(id: string, input: ResolveExceptionInput, txContext: MatchTransactionContext): Promise<MatchException>;

  /**
   * Find exception by ID
   */
  findExceptionById(id: string, tenantId: string): Promise<MatchException | null>;
}
