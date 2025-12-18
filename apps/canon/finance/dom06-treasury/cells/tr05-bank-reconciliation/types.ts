/**
 * TR-05 Bank Reconciliation - Type Definitions
 * 
 * @module TR-05
 */

// =============================================================================
// ENUMS
// =============================================================================

export type ReconciliationStatus =
  | 'draft'
  | 'in_progress'
  | 'reconciled'
  | 'adjusted'
  | 'finalized'
  | 'exception'
  | 'cancelled';

export type StatementItemStatus =
  | 'unmatched'
  | 'matched'
  | 'reconciling_item';

export type ReconcilingItemType =
  | 'deposit_in_transit'
  | 'outstanding_check'
  | 'bank_error'
  | 'book_error'
  | 'bank_charge'
  | 'interest';

export type MatchType =
  | 'exact'
  | 'fuzzy'
  | 'manual'
  | 'many_to_one'
  | 'one_to_many';

export type MatchStatus =
  | 'active'
  | 'unmatched'
  | 'superseded';

export type StatementFormat =
  | 'mt940'
  | 'bai2'
  | 'csv'
  | 'ofx';

export type BalanceSnapshotSource =
  | 'bank_statement'
  | 'manual'
  | 'api';

// =============================================================================
// MONEY TYPE (from kernel)
// =============================================================================

export interface Money {
  amount: string;  // Decimal string
  currency: string; // ISO 4217
}

// =============================================================================
// CORE ENTITIES
// =============================================================================

export interface BankStatement {
  // Identity
  id: string;
  tenantId: string;
  bankAccountId: string;  // FK to TR-01
  statementNumber: string; // From bank
  
  // Statement Period
  statementDate: Date;     // Statement generation date
  periodStart: Date;       // First transaction date
  periodEnd: Date;         // Last transaction date
  openingBalanceDate: Date; // Date of opening balance
  closingBalanceDate: Date; // Date of closing balance
  
  // Balances
  openingBalance: Money;
  closingBalance: Money;
  currency: string;
  
  // Reconciliation
  glBalance?: Money;           // GL balance at closingBalanceDate
  adjustedGLBalance?: Money;  // After reconciling items
  difference?: Money;          // adjustedGLBalance - closingBalance
  
  // Status
  status: ReconciliationStatus;
  
  // Exception
  exceptionReason?: string;
  exceptionThreshold?: Money;
  escalatedTo?: 'ic_manager' | 'controller' | 'cfo';
  
  // Metadata
  importFormat: StatementFormat;
  importSource: string;        // File name or API source
  fileHash?: string;           // SHA-256 hash for deduplication
  totalItems: number;
  matchedItems: number;
  unmatchedItems: number;
  
  // Audit Trail
  importedBy: string;
  importedAt: Date;
  finalizedBy?: string;
  finalizedAt?: Date;
  approver1Id?: string;        // Dual authorization
  approver2Id?: string;        // Dual authorization
  notes?: string;
  version: number;
}

export interface StatementItem {
  id: string;
  statementId: string;          // FK to treasury_bank_statements
  valueDate: Date;
  entryDate: Date;
  amount: Money;
  debitCredit: 'D' | 'C';      // Debit or Credit
  reference: string;
  description: string;
  counterparty?: string;
  
  // Matching (status only - actual matches in treasury_recon_matches)
  status: StatementItemStatus;
  
  // Reconciling item
  reconcilingItemType?: ReconcilingItemType;
  expectedClearingDate?: Date;
}

export interface ReconMatch {
  id: string;
  tenantId: string;
  statementId: string;         // FK to treasury_bank_statements
  bankItemId?: string;         // FK to treasury_statement_items (null for one-to-many)
  glTransactionId?: string;   // FK to GL transactions (null for many-to-one)
  
  // Match Details
  matchType: MatchType;
  allocatedAmount: Money;      // Total allocated amount for this match
  confidence: number;          // 0.0 - 1.0
  matchReason?: string;        // User-provided reason (for manual matches)
  
  // Status
  status: MatchStatus;
  unmatchedReason?: string;
  unmatchedBy?: string;
  unmatchedAt?: Date;
  
  // Authorization
  matchedBy: string;
  matchedAt: Date;
  
  // Idempotency
  idempotencyKey?: string;     // For retry scenarios
  
  // Versioning
  version: number;             // For optimistic locking
  supersededByVersion?: number;
}

export interface ReconMatchAllocation {
  id: string;
  matchId: string;            // FK to treasury_recon_matches
  bankItemId?: string;         // FK to treasury_statement_items (for one-to-many)
  glTransactionId?: string;    // FK to GL transactions (for many-to-one)
  allocatedAmount: Money;      // Partial amount allocated
  allocationOrder: number;     // Order in allocation sequence
  createdAt: Date;
}

export interface BankAccountBalanceSnapshot {
  id: string;
  tenantId: string;
  bankAccountId: string;       // FK to TR-01
  statementId: string;          // FK to treasury_bank_statements
  balanceDate: Date;
  balance: Money;
  source: BalanceSnapshotSource;
  reconciledAt: Date;
  reconciledBy: string;
  createdAt: Date;
}

// =============================================================================
// INPUTS
// =============================================================================

export interface ImportStatementInput {
  bankAccountId: string;
  statementFormat: StatementFormat;
  statementData: string | Buffer;
  statementDate: Date;
  importedBy: string;
}

export interface AutoMatchInput {
  statementId: string;
  matchingRules?: {
    exactMatchEnabled: boolean;
    fuzzyMatchEnabled: boolean;
    dateToleranceDays: number;  // Default: 3 days
  };
}

export interface ManualMatchInput {
  statementId: string;
  matches: Array<{
    bankItemId: string;
    glTransactionIds: string[]; // Can be multiple for many-to-one
    matchType: 'exact' | 'fuzzy' | 'manual';
    confidence?: number;
    reason?: string;            // User-provided reason
  }>;
  matchedBy: string;
}

export interface CreateReconcilingItemInput {
  statementId: string;
  bankItemId?: string;
  itemType: ReconcilingItemType;
  amount: Money;
  description: string;
  expectedClearingDate?: Date;
}

export interface CreateAdjustmentInput {
  statementId: string;
  accountCode: string;         // Bank account GL code
  debitAmount?: Money;
  creditAmount?: Money;
  description: string;
  reason: string;              // Why adjustment needed
  createdBy: string;
  approvedBy: string;          // Dual authorization
}

export interface FinalizeReconciliationInput {
  statementId: string;
  finalizedBy: string;
  approver1Id: string;
  approver2Id: string;         // Dual authorization
  notes?: string;
}

export interface ReconciliationFilter {
  tenantId: string;
  bankAccountId?: string;
  status?: ReconciliationStatus | ReconciliationStatus[];
  periodStart?: Date;
  periodEnd?: Date;
  search?: string;
}

// =============================================================================
// NORMALIZED TYPES (for matching)
// =============================================================================

export interface NormalizedAmount {
  signedMinorUnits: number;    // Integer: positive = credit, negative = debit
  currency: string;
  originalAmount: Money;
}

export interface GLTransaction {
  id: string;
  transactionDate: Date;
  amount: Money;
  debitCredit: 'D' | 'C';
  reference: string;
  description: string;
  accountCode: string;
  matched: boolean;            // Whether already matched to a statement
}

// =============================================================================
// RESULTS
// =============================================================================

export interface MatchingResult {
  matches: ReconMatch[];
  matchedCount: number;
  unmatchedBankItems: StatementItem[];
  unmatchedGLTransactions: GLTransaction[];
}

export interface AdjustedGLBalanceResult {
  glBalance: Money;
  adjustedGLBalance: Money;
  bankBalance: Money;
  difference: Money;
  isReconciled: boolean;
  exceptionThresholdExceeded: boolean;
}

export interface FinalizationResult {
  statementId: string;
  finalizedAt: Date;
  adjustedGLBalance: Money;
  bankBalance: Money;
  reportId?: string;
}

// =============================================================================
// PORTS
// =============================================================================

export interface ActorContext {
  tenantId: string;
  userId: string;
  permissions?: string[];
  correlationId?: string;
}

export interface ReconciliationRepositoryPort {
  // Statement CRUD
  createStatement(data: Omit<BankStatement, 'id' | 'version'>): Promise<BankStatement>;
  findStatementById(id: string, tenantId: string): Promise<BankStatement | null>;
  findStatementByKeys(keys: {
    bankAccountId: string;
    statementNumber: string;
    statementDate: Date;
    openingBalance: Money;
    closingBalance: Money;
    periodStart: Date;
    periodEnd: Date;
  }): Promise<BankStatement | null>;
  updateStatement(id: string, tenantId: string, data: Partial<BankStatement>, expectedVersion: number): Promise<BankStatement>;
  listStatements(filter: ReconciliationFilter, limit: number, offset: number): Promise<{ data: BankStatement[]; total: number }>;
  
  // Statement Items
  createStatementItem(data: Omit<StatementItem, 'id'>): Promise<StatementItem>;
  findStatementItemsByStatement(statementId: string): Promise<StatementItem[]>;
  findUnmatchedItems(statementId: string): Promise<StatementItem[]>;
  updateStatementItem(id: string, data: Partial<StatementItem>): Promise<StatementItem>;
  
  // Matches
  createMatch(data: Omit<ReconMatch, 'id' | 'matchedAt' | 'version'>): Promise<ReconMatch>;
  findMatchesByStatement(statementId: string): Promise<ReconMatch[]>;
  findMatchById(id: string): Promise<ReconMatch | null>;
  updateMatch(id: string, data: Partial<ReconMatch>, expectedVersion: number): Promise<ReconMatch>;
  
  // Match Allocations
  createMatchAllocation(data: Omit<ReconMatchAllocation, 'id' | 'createdAt'>): Promise<ReconMatchAllocation>;
  findMatchAllocationsByMatch(matchId: string): Promise<ReconMatchAllocation[]>;
  
  // Balance Snapshots
  createBalanceSnapshot(data: Omit<BankAccountBalanceSnapshot, 'id' | 'createdAt'>): Promise<BankAccountBalanceSnapshot>;
  findLatestBalanceSnapshot(bankAccountId: string, tenantId: string): Promise<BankAccountBalanceSnapshot | null>;
}

export interface BankAccountRepositoryPort {
  findById(id: string, tenantId: string): Promise<{
    id: string;
    glAccountCode: string;
    currency: string;
    timezone?: string;
    status: string;
  } | null>;
}

export interface GLRepositoryPort {
  getAccountBalance(accountCode: string, asOfDate: Date, tenantId: string): Promise<Money>;
  getTransactions(bankAccountId: string, periodStart: Date, periodEnd: Date, tenantId: string): Promise<GLTransaction[]>;
}

export interface GLPostingPort {
  postJournal(input: {
    sourceType: string;
    sourceId: string;
    lines: Array<{
      accountCode: string;
      debitAmount?: Money;
      creditAmount?: Money;
    }>;
    memo?: string;
    postedBy: string;
    correlationId?: string;
  }): Promise<{ journalEntryId: string }>;
}

export interface AuditPort {
  emit(event: {
    eventType: string;
    aggregateId: string;
    aggregateType: string;
    tenantId: string;
    userId: string;
    payload: Record<string, unknown>;
  }): Promise<void>;
  
  emitTransactional(event: {
    event: string;
    actor: ActorContext;
    metadata: Record<string, unknown>;
  }): Promise<void>;
}

export interface FiscalTimePort {
  verifyPeriodOpen(tenantId: string, date: Date): Promise<void>;
  getFiscalContext(tenantId: string): Promise<{
    currentPeriodCode: string;
    isPeriodOpen: boolean;
  }>;
}

export interface PolicyPort {
  getReconciliationPolicy(currency: string): Promise<{
    exceptionThreshold: number;
    tolerance: number;
    roundingRules?: {
      bankRounding: 'round_half_up' | 'round_half_down' | 'round_half_even' | 'truncate';
      glRounding: 'round_half_up' | 'round_half_down' | 'round_half_even' | 'truncate';
      decimalPlaces: number;
    };
  }>;
}

export interface FXPort {
  getCurrencyConfig(currency: string): Promise<{
    decimals: number;
    tolerance: number;  // Minor unit tolerance
  }>;
}

export interface SequencePort {
  next(input: {
    tenantId: string;
    entityType: string;
    series?: string;
  }): Promise<string>;
}
