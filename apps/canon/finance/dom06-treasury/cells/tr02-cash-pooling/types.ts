/**
 * TR-02 Cash Pooling - Type Definitions
 * 
 * @module TR-02
 */

// =============================================================================
// ENUMS
// =============================================================================

export type CashPoolType =
  | 'physical'
  | 'notional'
  | 'zero_balance';

export type CashPoolStatus =
  | 'draft'
  | 'active'
  | 'suspended'
  | 'inactive'
  | 'cancelled';

export type SweepFrequency =
  | 'daily'
  | 'weekly'
  | 'monthly';

export type InterestCalculationMethod =
  | 'daily_balance'
  | 'average_balance';

export type InterestAllocationFrequency =
  | 'monthly'
  | 'quarterly';

export type DayCountConvention =
  | 'ACT_365'
  | 'ACT_360';

export type Compounding =
  | 'simple'
  | 'compound';

export type SweepType =
  | 'sweep'
  | 'fund';

export type SweepStatus =
  | 'pending'
  | 'executing'
  | 'executed'
  | 'failed'
  | 'needs_reconciliation'
  | 'reconciled'
  | 'cancelled';

export type BalanceSource =
  | 'reconciled'
  | 'bank_api'
  | 'gl_ledger';

export type InterestAllocationStatus =
  | 'calculated'
  | 'allocated'
  | 'posted'
  | 'failed';

export type PoolConfigChangeType =
  | 'add_participant'
  | 'remove_participant'
  | 'update_threshold'
  | 'update_rate'
  | 'change_master'
  | 'update_frequency'
  | 'update_legal';

export type PoolConfigChangeStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'effective'
  | 'cancelled';

// =============================================================================
// MONEY TYPE
// =============================================================================

export interface Money {
  amount: string;  // Decimal string
  currency: string; // ISO 4217
}

// =============================================================================
// CORE ENTITIES
// =============================================================================

export interface ParticipantConfig {
  accountId: string;        // FK to TR-01
  companyId: string;
  targetBalance: Money;
  sweepThreshold: Money;
  priority: number;          // Sweep order (1 = first)
  glAccountCode: string;     // For GL posting
  interestExpenseAccount?: string; // For interest allocation
}

export interface InterestBenchmark {
  benchmarkRate: string;     // 'LIBOR', 'SOFR', etc.
  benchmarkValue: number;
  spread: number;
  calculatedRate: number;
  benchmarkedAt: Date;
}

export interface WithholdingTaxRule {
  jurisdiction: string;
  rate: number;
  applicable: boolean;
}

export interface EntityLimit {
  companyId: string;
  maxPoolParticipation: Money;
  regulatoryLimit?: Money;
}

export interface CashPool {
  // Identity
  id: string;
  tenantId: string;
  poolCode: string;          // Generated: POOL-2024-001
  poolName: string;
  
  // Configuration
  poolType: CashPoolType;
  masterAccountId: string;   // FK to TR-01
  masterCompanyId: string;
  masterGlAccountCode: string;
  interestIncomeAccount?: string;
  
  // Participants
  participants: ParticipantConfig[];
  
  // Sweep Configuration
  sweepFrequency: SweepFrequency;
  sweepTime: string;         // HH:MM
  dualAuthorizationRequired: boolean;
  
  // Interest Configuration
  interestRate: number;       // Annual rate (e.g., 0.025)
  interestCalculationMethod: InterestCalculationMethod;
  interestAllocationFrequency: InterestAllocationFrequency;
  dayCountConvention: DayCountConvention; // Default: ACT_365
  compounding: Compounding;  // Default: simple
  skipNonBusinessDays: boolean; // Default: false
  
  // Legal & Compliance
  agreementReference: string; // Intercompany agreement document ID
  agreementDate: Date;
  jurisdictions: string[];
  interestBenchmark: InterestBenchmark;
  withholdingTaxRules: WithholdingTaxRule[];
  entityLimits: EntityLimit[];
  
  // Lifecycle
  status: CashPoolStatus;
  effectiveDate?: Date;
  deactivationDate?: Date;
  
  // Audit Trail
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt?: Date;
  version: number;
}

export interface CashSweep {
  id: string;
  tenantId: string;
  poolId: string;            // FK to treasury_cash_pools
  executionDate: Date;
  sweepType: SweepType;
  
  // Participant details
  participantAccountId: string; // FK to TR-01
  participantCompanyId: string;
  masterAccountId: string;   // FK to TR-01
  
  // Amounts
  amount: Money;
  currency: string;
  
  // Authorization
  initiatorId: string;
  approver1Id: string;
  approver2Id: string;       // Required for dual authorization
  
  // GL Posting
  participantJournalEntryId?: string; // FK to GL-02 (participant entity)
  masterJournalEntryId?: string;     // FK to GL-02 (master entity)
  icLoanId?: string;                 // FK to TR-04
  
  // Idempotency & Retry
  idempotencyKey: string;    // Format: POOL-{poolId}-{date}-{accountId}
  retryCount: number;        // Default: 0
  maxRetries: number;        // Default: 3
  nextRetryAt?: Date;
  
  // Status
  status: SweepStatus;
  errorMessage?: string;
  paymentId?: string;        // FK to AP-05 payment
  paymentStatus?: string;     // From AP-05 webhook
  
  // Balance Source
  balanceSource: BalanceSource;
  balanceAsOf: Date;
  
  // Audit
  createdAt: Date;
  executedAt?: Date;
  reconciledAt?: Date;
  version: number;
}

export interface InterestAllocation {
  id: string;
  tenantId: string;
  poolId: string;            // FK to treasury_cash_pools
  participantAccountId: string; // FK to TR-01
  participantCompanyId: string;
  masterCompanyId: string;
  
  // Period
  periodStart: Date;
  periodEnd: Date;
  
  // Interest Calculation
  interestAmount: Money;
  calculationMethod: InterestCalculationMethod;
  dayCountConvention: DayCountConvention;
  compounding: Compounding;
  
  // Daily balances (for audit trail)
  dailyBalances: Array<{
    date: Date;
    balance: Money;
  }>;
  
  // GL Posting
  participantJournalEntryId?: string; // FK to GL-02 (participant entity)
  masterJournalEntryId?: string;     // FK to GL-02 (master entity)
  icLoanId?: string;                 // FK to TR-04
  
  // Authorization
  allocatedBy: string;
  approver1Id: string;
  approver2Id: string;       // Dual authorization
  
  // Status
  status: InterestAllocationStatus;
  
  // Audit
  createdAt: Date;
  allocatedAt?: Date;
  version: number;
}

export interface PoolConfigChange {
  id: string;
  tenantId: string;
  poolId: string;            // FK to treasury_cash_pools
  changeType: PoolConfigChangeType;
  
  // Before/After State
  beforeValue: Record<string, unknown>; // JSON snapshot of before state
  afterValue: Record<string, unknown>; // JSON snapshot of after state
  diff: Array<{
    field: string;
    before: unknown;
    after: unknown;
  }>;
  
  // Workflow
  requestedBy: string;
  approvedBy?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  
  // Effective Date
  effectiveDate?: Date;       // When change takes effect
  
  // Status
  status: PoolConfigChangeStatus;
  
  // Versioning
  poolVersionBefore: number; // Pool version before change
  poolVersionAfter?: number; // Pool version after change
  
  // Audit
  requestedAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  effectiveAt?: Date;
  version: number;
}

export interface PoolConfigHistory {
  id: string;
  tenantId: string;
  poolId: string;            // FK to treasury_cash_pools
  version: number;           // Configuration version number
  
  // Full Configuration Snapshot
  configuration: CashPool;  // Complete pool configuration at this version
  
  // Change Tracking
  changeRequestId?: string;  // FK to treasury_pool_config_changes
  changedBy: string;
  changedAt: Date;
  changeReason?: string;
  
  // Rollback Support
  isCurrent: boolean;        // Is this the current version?
  rolledBackFromVersion?: number; // If rolled back, which version was rolled back from
}

// =============================================================================
// INPUTS
// =============================================================================

export interface CreateCashPoolInput {
  poolName: string;
  poolType: CashPoolType;
  masterAccountId: string;
  masterCompanyId: string;
  masterGlAccountCode: string;
  participantAccounts: Array<{
    accountId: string;
    companyId: string;
    targetBalance: Money;
    sweepThreshold: Money;
    priority: number;
    glAccountCode: string;
    interestExpenseAccount?: string;
  }>;
  sweepFrequency: SweepFrequency;
  sweepTime: string;
  interestRate: number;
  interestCalculationMethod: InterestCalculationMethod;
  interestAllocationFrequency: InterestAllocationFrequency;
  dayCountConvention?: DayCountConvention;
  compounding?: Compounding;
  skipNonBusinessDays?: boolean;
  dualAuthorizationRequired?: boolean;
  agreementReference: string;
  agreementDate: Date;
  jurisdictions: string[];
  interestBenchmark: {
    benchmarkRate: string;
    benchmarkValue: number;
    spread: number;
  };
  withholdingTaxRules?: WithholdingTaxRule[];
  entityLimits?: EntityLimit[];
}

export interface ExecuteSweepInput {
  poolId: string;
  executionDate: Date;
  initiatorId: string;
  approver1Id: string;
  approver2Id: string;
  reason?: string;
  idempotencyKey?: string;
}

export interface ExecuteFundInput {
  poolId: string;
  participantAccountId: string;
  fundAmount: Money;
  executionDate: Date;
  initiatorId: string;
  approver1Id: string;
  approver2Id: string;
  reason: string;
  idempotencyKey?: string;
}

export interface AllocateInterestInput {
  poolId: string;
  periodStart: Date;
  periodEnd: Date;
  allocatedBy: string;
  approver1Id: string;
  approver2Id: string;
  calculationMethod?: InterestCalculationMethod; // Override pool default if needed
}

export interface RequestConfigChangeInput {
  poolId: string;
  changeType: PoolConfigChangeType;
  afterValue: Record<string, unknown>;
  reason?: string;
}

export interface ApproveConfigChangeInput {
  changeId: string;
  effectiveDate?: Date;
}

export interface CashPoolFilter {
  tenantId: string;
  poolType?: CashPoolType | CashPoolType[];
  status?: CashPoolStatus | CashPoolStatus[];
  masterCompanyId?: string;
  search?: string;
}

// =============================================================================
// RESULTS
// =============================================================================

export interface SweepExecutionResult {
  poolId: string;
  executionDate: Date;
  totalParticipants: number;
  successful: number;
  failed: number;
  results: Array<{
    participantId: string;
    status: 'success' | 'failed' | 'skipped';
    sweepId?: string;
    error?: string;
  }>;
}

export interface BalanceInfo {
  balance: Money;
  source: BalanceSource;
  lastUpdated: Date;
}

export interface SweepCalculationResult {
  shouldSweep: boolean;
  sweepAmount: Money;
  reason?: string;
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

export interface CashPoolRepositoryPort {
  // Pool CRUD
  create(data: Omit<CashPool, 'id' | 'version' | 'createdAt'>): Promise<CashPool>;
  findById(id: string, tenantId: string): Promise<CashPool | null>;
  update(id: string, tenantId: string, data: Partial<CashPool>, expectedVersion: number): Promise<CashPool>;
  list(filter: CashPoolFilter, limit: number, offset: number): Promise<{ data: CashPool[]; total: number }>;
  
  // Sweeps
  createSweep(data: Omit<CashSweep, 'id' | 'version' | 'createdAt'>): Promise<CashSweep>;
  findSweepById(id: string): Promise<CashSweep | null>;
  findSweepByKey(idempotencyKey: string): Promise<CashSweep | null>;
  findSweepsByPool(poolId: string, executionDate?: Date): Promise<CashSweep[]>;
  updateSweep(id: string, data: Partial<CashSweep>, expectedVersion: number): Promise<CashSweep>;
  
  // Interest Allocations
  createInterestAllocation(data: Omit<InterestAllocation, 'id' | 'version' | 'createdAt'>): Promise<InterestAllocation>;
  findInterestAllocationsByPool(poolId: string, periodStart?: Date, periodEnd?: Date): Promise<InterestAllocation[]>;
  
  // Config Changes
  createConfigChange(data: Omit<PoolConfigChange, 'id' | 'version' | 'requestedAt'>): Promise<PoolConfigChange>;
  findConfigChangeById(id: string): Promise<PoolConfigChange | null>;
  findConfigChangesByPool(poolId: string, status?: PoolConfigChangeStatus): Promise<PoolConfigChange[]>;
  updateConfigChange(id: string, data: Partial<PoolConfigChange>, expectedVersion: number): Promise<PoolConfigChange>;
  
  // Config History
  createConfigHistory(data: Omit<PoolConfigHistory, 'id'>): Promise<PoolConfigHistory>;
  findConfigHistoryByPool(poolId: string): Promise<PoolConfigHistory[]>;
  findConfigHistoryByVersion(poolId: string, version: number): Promise<PoolConfigHistory | null>;
}

export interface BankAccountRepositoryPort {
  findById(id: string, tenantId: string): Promise<{
    id: string;
    status: string;
    currency: string;
    glAccountCode: string;
    singleTransactionLimit?: Money;
    dailyTransactionLimit?: Money;
  } | null>;
}

export interface ReconciliationRepositoryPort {
  findLatest(bankAccountId: string, tenantId: string): Promise<{
    finalizedAt?: Date;
    adjustedGLBalance: Money;
  } | null>;
}

export interface GLRepositoryPort {
  getAccountBalance(accountCode: string, asOfDate: Date, tenantId: string, companyId?: string): Promise<Money>;
}

export interface PaymentRepositoryPort {
  findPending(accountId: string, tenantId: string): Promise<Array<{
    id: string;
    amount: Money;
  }>>;
  createPayment(input: {
    fromAccountId: string;
    toAccountId: string;
    amount: Money;
    currency: string;
    paymentType: string;
    reference: string;
    idempotencyKey: string;
    initiatorId: string;
    approver1Id: string;
    approver2Id: string;
  }): Promise<{ paymentId: string }>;
  getPayment(paymentId: string): Promise<{ status: string }>;
}

export interface GLPostingPort {
  postJournal(input: {
    sourceType: string;
    sourceId: string;
    entityId: string;
    lines: Array<{
      accountCode: string;
      debitAmount?: Money;
      creditAmount?: Money;
    }>;
    memo?: string;
    postedBy: string;
    correlationId?: string;
  }): Promise<{ id: string }>;
}

export interface IntercompanyLoanPort {
  createLoan(input: {
    lenderCompanyId: string;
    borrowerCompanyId: string;
    amount: Money;
    currency: string;
    interestRate: number;
    sourceType: string;
    sourceId: string;
  }): Promise<{ loanId: string }>;
  addInterest(loanId: string, interestAmount: Money): Promise<void>;
  cancel(loanId: string, reason: string): Promise<void>;
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
  isBusinessDay(date: Date, tenantId: string): Promise<boolean>;
  getNextBusinessDay(date: Date, tenantId: string): Promise<Date>;
}

export interface PolicyPort {
  validateInterestRate(rate: number, benchmark: InterestBenchmark): Promise<{ valid: boolean; reason?: string }>;
  validateEntityLimit(companyId: string, amount: Money, tenantId: string): Promise<{ valid: boolean; reason?: string }>;
  getBankCutoffTime(bankAccountId: string): Promise<string>; // Returns HH:MM
}

export interface AuthPort {
  verifyPermission(userId: string, permission: string): Promise<boolean>;
  verifyUserScope(userId: string, companyId: string, accountId: string, poolId: string): Promise<boolean>;
  getCompanyController(companyId: string): Promise<{ userId: string } | null>;
  getUserManager(userId: string): Promise<{ userId: string } | null>;
}

export interface SequencePort {
  next(input: {
    tenantId: string;
    entityType: string;
    series?: string;
  }): Promise<string>;
}

export interface EventBusPort {
  publish(event: {
    eventType: string;
    aggregateId: string;
    payload: Record<string, unknown>;
  }): Promise<void>;
}
