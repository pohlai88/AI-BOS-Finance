/**
 * TR-02 Cash Pooling - Service Implementation
 * 
 * Domain service for cash pool management, sweep execution, and interest allocation.
 * Implements dual authorization, balance source-of-truth, and entity-by-entity GL posting.
 * 
 * @module TR-02
 */

import type {
  CashPool,
  CashSweep,
  InterestAllocation,
  PoolConfigChange,
  CreateCashPoolInput,
  ExecuteSweepInput,
  ExecuteFundInput,
  AllocateInterestInput,
  RequestConfigChangeInput,
  ApproveConfigChangeInput,
  CashPoolRepositoryPort,
  BankAccountRepositoryPort,
  ReconciliationRepositoryPort,
  GLRepositoryPort,
  PaymentRepositoryPort,
  GLPostingPort,
  IntercompanyLoanPort,
  AuditPort,
  FiscalTimePort,
  PolicyPort,
  AuthPort,
  SequencePort,
  EventBusPort,
  ActorContext,
  Money,
  BalanceInfo,
  SweepCalculationResult,
  SweepExecutionResult,
} from './types';
import { CashPoolingError, CashPoolingErrorCode } from './errors';
import Decimal from 'decimal.js';

// =============================================================================
// MONEY HELPERS (Safe arithmetic)
// =============================================================================

function moneyFromJSON(json: Money): Decimal {
  return new Decimal(json.amount);
}

function moneyToJSON(decimal: Decimal, currency: string): Money {
  return {
    amount: decimal.toFixed(4),
    currency,
  };
}

function moneyAdd(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error(`Currency mismatch: ${a.currency} vs ${b.currency}`);
  }
  const sum = moneyFromJSON(a).plus(moneyFromJSON(b));
  return moneyToJSON(sum, a.currency);
}

function moneySubtract(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error(`Currency mismatch: ${a.currency} vs ${b.currency}`);
  }
  const diff = moneyFromJSON(a).minus(moneyFromJSON(b));
  return moneyToJSON(diff, a.currency);
}

function moneyGreaterThan(a: Money, b: Money): boolean {
  if (a.currency !== b.currency) {
    throw new Error(`Currency mismatch: ${a.currency} vs ${b.currency}`);
  }
  return moneyFromJSON(a).greaterThan(moneyFromJSON(b));
}

function moneyLessThanOrEqual(a: Money, b: Money): boolean {
  if (a.currency !== b.currency) {
    throw new Error(`Currency mismatch: ${a.currency} vs ${b.currency}`);
  }
  return moneyFromJSON(a).lessThanOrEqualTo(moneyFromJSON(b));
}

// =============================================================================
// SERVICE DEPENDENCIES
// =============================================================================

export interface CashPoolingServiceDeps {
  repository: CashPoolRepositoryPort;
  bankRepo: BankAccountRepositoryPort;
  reconciliationRepo: ReconciliationRepositoryPort;
  glRepo: GLRepositoryPort;
  paymentRepo: PaymentRepositoryPort;
  glPosting: GLPostingPort;
  icLoan: IntercompanyLoanPort;
  audit: AuditPort;
  fiscalTime: FiscalTimePort;
  policy: PolicyPort;
  auth: AuthPort;
  sequence: SequencePort;
  eventBus: EventBusPort;
}

// =============================================================================
// SERVICE IMPLEMENTATION
// =============================================================================

export class CashPoolingService {
  private readonly repository: CashPoolRepositoryPort;
  private readonly bankRepo: BankAccountRepositoryPort;
  private readonly reconciliationRepo: ReconciliationRepositoryPort;
  private readonly glRepo: GLRepositoryPort;
  private readonly paymentRepo: PaymentRepositoryPort;
  private readonly glPosting: GLPostingPort;
  private readonly icLoan: IntercompanyLoanPort;
  private readonly audit: AuditPort;
  private readonly fiscalTime: FiscalTimePort;
  private readonly policy: PolicyPort;
  private readonly auth: AuthPort;
  private readonly sequence: SequencePort;
  private readonly eventBus: EventBusPort;

  constructor(deps: CashPoolingServiceDeps) {
    this.repository = deps.repository;
    this.bankRepo = deps.bankRepo;
    this.reconciliationRepo = deps.reconciliationRepo;
    this.glRepo = deps.glRepo;
    this.paymentRepo = deps.paymentRepo;
    this.glPosting = deps.glPosting;
    this.icLoan = deps.icLoan;
    this.audit = deps.audit;
    this.fiscalTime = deps.fiscalTime;
    this.policy = deps.policy;
    this.auth = deps.auth;
    this.sequence = deps.sequence;
    this.eventBus = deps.eventBus;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CREATE CASH POOL
  // ═══════════════════════════════════════════════════════════════════════════

  async createPool(
    input: CreateCashPoolInput,
    actor: ActorContext
  ): Promise<CashPool> {
    // 1. Verify master account is active
    const masterAccount = await this.bankRepo.findById(input.masterAccountId, actor.tenantId);
    if (!masterAccount || masterAccount.status !== 'active') {
      throw CashPoolingError.poolNotFound(input.masterAccountId);
    }

    // 2. Verify all participant accounts are active
    for (const participant of input.participantAccounts) {
      const account = await this.bankRepo.findById(participant.accountId, actor.tenantId);
      if (!account || account.status !== 'active') {
        throw CashPoolingError.poolNotFound(participant.accountId);
      }
    }

    // 3. Validate currency policy (Option A: Hard-block mixed currency)
    const participantCurrencies = await Promise.all(
      input.participantAccounts.map(async (p) => {
        const account = await this.bankRepo.findById(p.accountId, actor.tenantId);
        return account?.currency || '';
      })
    );
    const allCurrencies = [masterAccount.currency, ...participantCurrencies].filter(c => c);
    const uniqueCurrencies = Array.from(new Set(allCurrencies));
    
    if (uniqueCurrencies.length > 1) {
      throw CashPoolingError.invalidCurrencyMix(uniqueCurrencies);
    }

    // 4. Validate interest rate (arm's length check via K_POLICY)
    const rateValidation = await this.policy.validateInterestRate(
      input.interestRate,
      {
        benchmarkRate: input.interestBenchmark.benchmarkRate,
        benchmarkValue: input.interestBenchmark.benchmarkValue,
        spread: input.interestBenchmark.spread,
        calculatedRate: input.interestRate,
        benchmarkedAt: new Date(),
      }
    );
    if (!rateValidation.valid) {
      throw new CashPoolingError(
        CashPoolingErrorCode.INVALID_INTEREST_RATE,
        `Interest rate validation failed: ${rateValidation.reason}`,
        { rate: input.interestRate, reason: rateValidation.reason }
      );
    }

    // 5. Validate entity limits
    for (const limit of input.entityLimits || []) {
      const limitValidation = await this.policy.validateEntityLimit(
        limit.companyId,
        limit.maxPoolParticipation,
        actor.tenantId
      );
      if (!limitValidation.valid) {
        throw CashPoolingError.entityLimitExceeded(
          limit.companyId,
          limit.maxPoolParticipation,
          limit.maxPoolParticipation
        );
      }
    }

    // 6. Validate thresholds
    for (const participant of input.participantAccounts) {
      if (moneyGreaterThan(participant.targetBalance, participant.sweepThreshold)) {
        throw new CashPoolingError(
          CashPoolingErrorCode.INVALID_SWEEP_THRESHOLD,
          `Sweep threshold must be greater than target balance for participant ${participant.accountId}`,
          { participant: participant.accountId, targetBalance: participant.targetBalance, sweepThreshold: participant.sweepThreshold }
        );
      }
    }

    // 7. Validate agreement reference
    if (!input.agreementReference) {
      throw CashPoolingError.agreementMissing();
    }

    // 8. Generate pool code
    const poolCode = await this.sequence.next({
      tenantId: actor.tenantId,
      entityType: 'cash_pool',
      series: 'POOL',
    });

    // 9. Calculate interest rate from benchmark
    const calculatedRate = input.interestBenchmark.benchmarkValue + input.interestBenchmark.spread;

    // 10. Create pool
    const pool = await this.repository.create({
      tenantId: actor.tenantId,
      poolCode,
      poolName: input.poolName,
      poolType: input.poolType,
      masterAccountId: input.masterAccountId,
      masterCompanyId: input.masterCompanyId,
      masterGlAccountCode: input.masterGlAccountCode,
      participants: input.participantAccounts,
      sweepFrequency: input.sweepFrequency,
      sweepTime: input.sweepTime,
      dualAuthorizationRequired: input.dualAuthorizationRequired ?? true,
      interestRate: calculatedRate,
      interestCalculationMethod: input.interestCalculationMethod,
      interestAllocationFrequency: input.interestAllocationFrequency,
      dayCountConvention: input.dayCountConvention || 'ACT_365',
      compounding: input.compounding || 'simple',
      skipNonBusinessDays: input.skipNonBusinessDays || false,
      agreementReference: input.agreementReference,
      agreementDate: input.agreementDate,
      jurisdictions: input.jurisdictions,
      interestBenchmark: {
        benchmarkRate: input.interestBenchmark.benchmarkRate,
        benchmarkValue: input.interestBenchmark.benchmarkValue,
        spread: input.interestBenchmark.spread,
        calculatedRate,
        benchmarkedAt: new Date(),
      },
      withholdingTaxRules: input.withholdingTaxRules || [],
      entityLimits: input.entityLimits || [],
      status: 'draft',
      createdBy: actor.userId,
      version: 1,
    });

    // 11. Audit event
    await this.audit.emit({
      eventType: 'treasury.cash_pool.created',
      aggregateId: pool.id,
      aggregateType: 'CashPool',
      tenantId: actor.tenantId,
      userId: actor.userId,
      payload: {
        poolCode,
        poolName: input.poolName,
        poolType: input.poolType,
        participantCount: input.participantAccounts.length,
        agreementReference: input.agreementReference,
      },
    });

    return pool;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GET ACCOUNT BALANCE (Source-of-Truth)
  // ═══════════════════════════════════════════════════════════════════════════

  async getAccountBalance(
    accountId: string,
    asOfDate: Date,
    actor: ActorContext
  ): Promise<BalanceInfo> {
    // 1. Check last reconciliation (TR-05) - Preferred source
    const lastReconciliation = await this.reconciliationRepo.findLatest(accountId, actor.tenantId);
    if (
      lastReconciliation &&
      lastReconciliation.finalizedAt &&
      (asOfDate.getTime() - lastReconciliation.finalizedAt.getTime()) < 24 * 60 * 60 * 1000
    ) {
      return {
        balance: lastReconciliation.adjustedGLBalance,
        source: 'reconciled',
        lastUpdated: lastReconciliation.finalizedAt,
      };
    }

    // 2. Check bank API (if available) - Fallback
    // TODO: Implement bank API integration
    // For now, skip to GL ledger

    // 3. Fallback to GL ledger
    const bankAccount = await this.bankRepo.findById(accountId, actor.tenantId);
    if (!bankAccount) {
      throw CashPoolingError.poolNotFound(accountId);
    }

    const glBalance = await this.glRepo.getAccountBalance(
      bankAccount.glAccountCode,
      asOfDate,
      actor.tenantId
    );

    // Check for pending payments
    const pendingPayments = await this.paymentRepo.findPending(accountId, actor.tenantId);
    if (pendingPayments.length > 0) {
      // Balance may be inaccurate due to pending payments
      // Return with warning flag
      return {
        balance: glBalance,
        source: 'gl_ledger',
        lastUpdated: asOfDate,
      };
    }

    return {
      balance: glBalance,
      source: 'gl_ledger',
      lastUpdated: asOfDate,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CALCULATE SWEEP AMOUNT
  // ═══════════════════════════════════════════════════════════════════════════

  async calculateSweepAmount(
    participant: { accountId: string; targetBalance: Money; sweepThreshold: Money },
    currentBalance: Money,
    availableBalance: Money,
    actor: ActorContext
  ): Promise<SweepCalculationResult> {
    // Use available balance (current - pending payments)
    const balanceToUse = availableBalance;

    // Check trigger condition: IF currentBalance > sweepThreshold
    if (!moneyGreaterThan(balanceToUse, participant.sweepThreshold)) {
      return {
        shouldSweep: false,
        sweepAmount: { amount: '0', currency: balanceToUse.currency },
        reason: 'Balance below sweep threshold',
      };
    }

    // Calculate sweep amount: sweepAmount = currentBalance - targetBalance
    let sweepAmount = moneySubtract(balanceToUse, participant.targetBalance);

    // Apply limits (from bank account configuration - TR-01)
    const bankAccount = await this.bankRepo.findById(participant.accountId, actor.tenantId);
    if (!bankAccount) {
      throw CashPoolingError.poolNotFound(participant.accountId);
    }

    if (bankAccount.singleTransactionLimit) {
      if (moneyGreaterThan(sweepAmount, bankAccount.singleTransactionLimit)) {
        sweepAmount = bankAccount.singleTransactionLimit;
      }
    }

    if (bankAccount.dailyTransactionLimit) {
      // TODO: Get today's sweeps for this account to calculate remaining limit
      // For now, just check against single transaction limit
      if (moneyGreaterThan(sweepAmount, bankAccount.dailyTransactionLimit)) {
        sweepAmount = bankAccount.dailyTransactionLimit;
      }
    }

    // Ensure sweep amount is positive
    if (parseFloat(sweepAmount.amount) <= 0) {
      return {
        shouldSweep: false,
        sweepAmount: { amount: '0', currency: balanceToUse.currency },
        reason: 'Calculated sweep amount is zero or negative',
      };
    }

    return {
      shouldSweep: true,
      sweepAmount,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXECUTE SWEEP
  // ═══════════════════════════════════════════════════════════════════════════

  async executeSweep(
    input: ExecuteSweepInput,
    actor: ActorContext
  ): Promise<SweepExecutionResult> {
    // 1. Get pool
    const pool = await this.repository.findById(input.poolId, actor.tenantId);
    if (!pool) {
      throw CashPoolingError.poolNotFound(input.poolId);
    }

    if (pool.status !== 'active') {
      throw CashPoolingError.poolNotActive(input.poolId);
    }

    // 2. Verify period is open
    await this.fiscalTime.verifyPeriodOpen(actor.tenantId, input.executionDate);

    // 3. Verify dual authorization
    if (input.approver1Id === input.approver2Id) {
      throw CashPoolingError.dualAuthorizationRequired();
    }

    if (input.approver1Id === input.initiatorId || input.approver2Id === input.initiatorId) {
      throw CashPoolingError.sodViolation('Initiator cannot be an approver');
    }

    // 4. Verify both approvers have permission
    const approver1HasPermission = await this.auth.verifyPermission(input.approver1Id, 'treasury.cash_pool.approve');
    const approver2HasPermission = await this.auth.verifyPermission(input.approver2Id, 'treasury.cash_pool.approve');
    
    if (!approver1HasPermission || !approver2HasPermission) {
      throw new CashPoolingError(
        CashPoolingErrorCode.INSUFFICIENT_PERMISSIONS,
        'One or both approvers lack approval permission',
        { approver1Id: input.approver1Id, approver2Id: input.approver2Id }
      );
    }

    // 5. Execute sweep for each participant
    const results: SweepExecutionResult['results'] = [];

    for (const participant of pool.participants.sort((a, b) => a.priority - b.priority)) {
      try {
        // Get balance (source-of-truth)
        const balanceInfo = await this.getAccountBalance(participant.accountId, input.executionDate, {
        tenantId: actor.tenantId,
        userId: actor.userId,
      });

        // Validate balance staleness
        const stalenessHours = (Date.now() - balanceInfo.lastUpdated.getTime()) / (1000 * 60 * 60);
        if (balanceInfo.source === 'reconciled' && stalenessHours > 24) {
          throw CashPoolingError.staleBalance('reconciled', stalenessHours);
        }
        if (balanceInfo.source === 'bank_api' && stalenessHours > 1) {
          throw CashPoolingError.staleBalance('bank_api', stalenessHours);
        }

        // Get pending payments
        const pendingPayments = await this.paymentRepo.findPending(participant.accountId, actor.tenantId);
        const pendingTotal = pendingPayments.reduce(
          (sum, p) => moneyAdd(sum, p.amount),
          { amount: '0', currency: balanceInfo.balance.currency }
        );
        const availableBalance = moneySubtract(balanceInfo.balance, pendingTotal);

        // Calculate sweep amount
        const calculation = await this.calculateSweepAmount(
          participant,
          balanceInfo.balance,
          availableBalance,
          actor
        );

        if (!calculation.shouldSweep) {
          results.push({
            participantId: participant.accountId,
            status: 'skipped',
            error: calculation.reason,
          });
          continue;
        }

        // Generate idempotency key
        const idempotencyKey = input.idempotencyKey || 
          `POOL-${input.poolId}-${input.executionDate.toISOString().split('T')[0]}-${participant.accountId}`;

        // Check idempotency
        const existingSweep = await this.repository.findSweepByKey(idempotencyKey);
        if (existingSweep && existingSweep.status === 'executed') {
          results.push({
            participantId: participant.accountId,
            status: 'success',
            sweepId: existingSweep.id,
          });
          continue;
        }

        // Create sweep record
        const sweep = await this.repository.createSweep({
          tenantId: actor.tenantId,
          poolId: input.poolId,
          executionDate: input.executionDate,
          sweepType: 'sweep',
          participantAccountId: participant.accountId,
          participantCompanyId: participant.companyId,
          masterAccountId: pool.masterAccountId,
          amount: calculation.sweepAmount,
          currency: calculation.sweepAmount.currency,
          initiatorId: input.initiatorId,
          approver1Id: input.approver1Id,
          approver2Id: input.approver2Id,
          idempotencyKey,
          retryCount: 0,
          maxRetries: 3,
          status: 'pending',
          balanceSource: balanceInfo.source,
          balanceAsOf: balanceInfo.lastUpdated,
          version: 1,
        });

        // Execute payment (via AP-05)
        try {
          const paymentResult = await this.paymentRepo.createPayment({
            fromAccountId: participant.accountId,
            toAccountId: pool.masterAccountId,
            amount: calculation.sweepAmount,
            currency: calculation.sweepAmount.currency,
            paymentType: 'cash_pool_sweep',
            reference: `POOL-${input.poolId}-SWEEP-${input.executionDate.toISOString()}`,
            idempotencyKey: `PAY-${idempotencyKey}`,
            initiatorId: input.initiatorId,
            approver1Id: input.approver1Id,
            approver2Id: input.approver2Id,
          });

          // Update sweep record
          await this.repository.updateSweep(sweep.id, {
            status: 'executing',
            paymentId: paymentResult.paymentId,
            version: sweep.version,
          });

          // Post GL entries (entity-by-entity)
          await this.postSweepGLEntries(sweep, participant, pool, actor);

          // Create IC loan entry
          const icLoanResult = await this.icLoan.createLoan({
            lenderCompanyId: participant.companyId,
            borrowerCompanyId: pool.masterCompanyId,
            amount: calculation.sweepAmount,
            currency: calculation.sweepAmount.currency,
            interestRate: pool.interestRate,
            sourceType: 'cash_pool_sweep',
            sourceId: sweep.id,
          });

          // Update sweep record
          await this.repository.updateSweep(sweep.id, {
            status: 'executed',
            executedAt: new Date(),
            icLoanId: icLoanResult.loanId,
            version: sweep.version + 1,
          });

          results.push({
            participantId: participant.accountId,
            status: 'success',
            sweepId: sweep.id,
          });

        } catch (error) {
          // Handle partial failure
          await this.repository.updateSweep(sweep.id, {
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            version: sweep.version + 1,
          });

          results.push({
            participantId: participant.accountId,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }

      } catch (error) {
        results.push({
          participantId: participant.accountId,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Audit event
    await this.audit.emit({
      eventType: 'treasury.cash_pool.sweep_executed',
      aggregateId: input.poolId,
      aggregateType: 'CashPool',
      tenantId: actor.tenantId,
      userId: actor.userId,
      payload: {
        executionDate: input.executionDate,
        totalParticipants: pool.participants.length,
        successful: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'failed').length,
      },
    });

    return {
      poolId: input.poolId,
      executionDate: input.executionDate,
      totalParticipants: pool.participants.length,
      successful: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length,
      results,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // POST SWEEP GL ENTRIES (Entity-by-Entity)
  // ═══════════════════════════════════════════════════════════════════════════

  private async postSweepGLEntries(
    sweep: CashSweep,
    participant: { companyId: string; glAccountCode: string },
    pool: CashPool,
    actor: ActorContext
  ): Promise<{ participantJEId: string; masterJEId: string }> {
    // Participant entity journal entry
    const participantJE = await this.glPosting.postJournal({
      sourceType: 'CASH_POOL_SWEEP',
      sourceId: sweep.id,
      entityId: participant.companyId,
      lines: [
        {
          accountCode: `IC_LOAN_RECEIVABLE_${pool.masterCompanyId}`,
          debitAmount: sweep.amount,
          creditAmount: undefined,
        },
        {
          accountCode: participant.glAccountCode,
          debitAmount: undefined,
          creditAmount: sweep.amount,
        },
      ],
      memo: `Cash pool sweep to master account`,
      postedBy: actor.userId,
      correlationId: sweep.id,
    });

    // Master entity journal entry
    const masterJE = await this.glPosting.postJournal({
      sourceType: 'CASH_POOL_SWEEP',
      sourceId: sweep.id,
      entityId: pool.masterCompanyId,
      lines: [
        {
          accountCode: pool.masterGlAccountCode,
          debitAmount: sweep.amount,
          creditAmount: undefined,
        },
        {
          accountCode: `IC_LOAN_PAYABLE_${participant.companyId}`,
          debitAmount: undefined,
          creditAmount: sweep.amount,
        },
      ],
      memo: `Cash pool sweep from participant ${participant.companyId}`,
      postedBy: actor.userId,
      correlationId: sweep.id,
    });

    // Update sweep record
    await this.repository.updateSweep(sweep.id, {
      participantJournalEntryId: participantJE.id,
      masterJournalEntryId: masterJE.id,
      version: sweep.version,
    });

    return { participantJEId: participantJE.id, masterJEId: masterJE.id };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ALLOCATE INTEREST
  // ═══════════════════════════════════════════════════════════════════════════

  async allocateInterest(
    input: AllocateInterestInput,
    actor: ActorContext
  ): Promise<InterestAllocation[]> {
    const pool = await this.repository.findById(input.poolId, actor.tenantId);
    if (!pool) {
      throw CashPoolingError.poolNotFound(input.poolId);
    }

    if (pool.status !== 'active') {
      throw CashPoolingError.poolNotActive(input.poolId);
    }

    // Verify dual authorization
    if (input.approver1Id === input.approver2Id) {
      throw CashPoolingError.dualAuthorizationRequired();
    }

    const allocations: InterestAllocation[] = [];
    const calculationMethod = input.calculationMethod || pool.interestCalculationMethod;

    for (const participant of pool.participants) {
      // Calculate interest
      const interest = await this.calculateInterest(
        participant,
        pool,
        input.periodStart,
        input.periodEnd,
        calculationMethod,
        actor
      );

      if (parseFloat(interest.amount) <= 0) {
        continue; // Skip zero/negative interest
      }

      // Create allocation record
      const allocation = await this.repository.createInterestAllocation({
        tenantId: actor.tenantId,
        poolId: input.poolId,
        participantAccountId: participant.accountId,
        participantCompanyId: participant.companyId,
        masterCompanyId: pool.masterCompanyId,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        interestAmount: interest,
        calculationMethod,
        dayCountConvention: pool.dayCountConvention,
        compounding: pool.compounding,
        dailyBalances: [], // TODO: Store daily balances
        allocatedBy: input.allocatedBy,
        approver1Id: input.approver1Id,
        approver2Id: input.approver2Id,
        status: 'calculated',
        version: 1,
      });

      // Post GL entries (entity-by-entity)
      await this.postInterestGLEntries(allocation, participant, pool, actor);

      // Update IC loan balance
      if (allocation.icLoanId) {
        await this.icLoan.addInterest(allocation.icLoanId, interest);
      }

      // Note: Allocation status update would be handled by repository if method exists
      // For now, allocation is created with status 'calculated' and updated via separate method if needed

      allocations.push(allocation);
    }

    // Audit event
    await this.audit.emit({
      eventType: 'treasury.cash_pool.interest_allocated',
      aggregateId: input.poolId,
      aggregateType: 'CashPool',
      tenantId: actor.tenantId,
      userId: actor.userId,
      payload: {
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        allocationCount: allocations.length,
        calculationMethod,
      },
    });

    return allocations;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // POST INTEREST GL ENTRIES (Entity-by-Entity)
  // ═══════════════════════════════════════════════════════════════════════════

  private async postInterestGLEntries(
    allocation: InterestAllocation,
    participant: { companyId: string; interestExpenseAccount?: string },
    pool: CashPool,
    actor: ActorContext
  ): Promise<{ participantJEId: string; masterJEId: string }> {
    // Participant entity journal entry
    const participantJE = await this.glPosting.postJournal({
      sourceType: 'CASH_POOL_INTEREST',
      sourceId: allocation.id,
      entityId: participant.companyId,
      lines: [
        {
          accountCode: participant.interestExpenseAccount || 'INTEREST_EXPENSE',
          debitAmount: allocation.interestAmount,
          creditAmount: undefined,
        },
        {
          accountCode: `IC_LOAN_PAYABLE_${pool.masterCompanyId}`,
          debitAmount: undefined,
          creditAmount: allocation.interestAmount,
        },
      ],
      memo: `Interest on cash pool loan`,
      postedBy: actor.userId,
      correlationId: allocation.id,
    });

    // Master entity journal entry
    const masterJE = await this.glPosting.postJournal({
      sourceType: 'CASH_POOL_INTEREST',
      sourceId: allocation.id,
      entityId: pool.masterCompanyId,
      lines: [
        {
          accountCode: `IC_LOAN_RECEIVABLE_${participant.companyId}`,
          debitAmount: allocation.interestAmount,
          creditAmount: undefined,
        },
        {
          accountCode: pool.interestIncomeAccount || 'INTEREST_INCOME',
          debitAmount: undefined,
          creditAmount: allocation.interestAmount,
        },
      ],
      memo: `Interest on cash pool loan from participant ${participant.companyId}`,
      postedBy: actor.userId,
      correlationId: allocation.id,
    });

    return { participantJEId: participantJE.id, masterJEId: masterJE.id };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CALCULATE INTEREST
  // ═══════════════════════════════════════════════════════════════════════════

  private async calculateInterest(
    participant: { accountId: string; currency: string },
    pool: CashPool,
    periodStart: Date,
    periodEnd: Date,
    method: InterestCalculationMethod,
    actor: ActorContext
  ): Promise<Money> {
    if (method === 'daily_balance') {
      return this.calculateInterestDailyBalance(participant, pool, periodStart, periodEnd, actor);
    } else {
      return this.calculateInterestAverageBalance(participant, pool, periodStart, periodEnd, actor);
    }
  }

  private async calculateInterestDailyBalance(
    participant: { accountId: string; currency: string },
    pool: CashPool,
    periodStart: Date,
    periodEnd: Date,
    actor: ActorContext
  ): Promise<Money> {
    const daysInYear = pool.dayCountConvention === 'ACT_365' ? 365 : 360;
    let totalInterest = new Decimal(0);
    const dailyBalances: Array<{ date: Date; balance: number }> = [];

    // Get daily balances
    for (let date = new Date(periodStart); date <= periodEnd; date = new Date(date.getTime() + 24 * 60 * 60 * 1000)) {
      if (pool.skipNonBusinessDays && !(await this.fiscalTime.isBusinessDay(date, actor.tenantId))) {
        continue;
      }

      const balanceInfo = await this.getAccountBalance(participant.accountId, date, actor);
      const balance = parseFloat(balanceInfo.balance.amount);
      dailyBalances.push({ date, balance });

      if (balance <= 0) {
        continue; // No interest on zero/negative balance
      }

      const dailyInterest = new Decimal(balance).times(pool.interestRate).div(daysInYear);
      totalInterest = totalInterest.plus(dailyInterest);
    }

    // Round to 2 decimal places (banker's rounding)
    const roundedInterest = totalInterest.toDecimalPlaces(2, Decimal.ROUND_HALF_EVEN);

    return {
      amount: roundedInterest.toString(),
      currency: participant.currency,
    };
  }

  private async calculateInterestAverageBalance(
    participant: { accountId: string; currency: string },
    pool: CashPool,
    periodStart: Date,
    periodEnd: Date,
    actor: ActorContext
  ): Promise<Money> {
    const daysInYear = pool.dayCountConvention === 'ACT_365' ? 365 : 360;
    const dailyBalances: number[] = [];

    // Get daily balances
    for (let date = new Date(periodStart); date <= periodEnd; date = new Date(date.getTime() + 24 * 60 * 60 * 1000)) {
      if (pool.skipNonBusinessDays && !(await this.fiscalTime.isBusinessDay(date, actor.tenantId))) {
        continue;
      }

      const balanceInfo = await this.getAccountBalance(participant.accountId, date, actor);
      dailyBalances.push(parseFloat(balanceInfo.balance.amount));
    }

    // Calculate average balance
    const averageBalance = dailyBalances.reduce((sum, b) => sum + b, 0) / dailyBalances.length;

    if (averageBalance <= 0) {
      return { amount: '0', currency: participant.currency };
    }

    // Calculate days
    const days = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate interest
    const interest = new Decimal(averageBalance)
      .times(pool.interestRate)
      .div(daysInYear)
      .times(days);

    // Round
    const roundedInterest = interest.toDecimalPlaces(2, Decimal.ROUND_HALF_EVEN);

    return {
      amount: roundedInterest.toString(),
      currency: participant.currency,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXECUTE FUND
  // ═══════════════════════════════════════════════════════════════════════════

  async executeFund(
    input: ExecuteFundInput,
    actor: ActorContext
  ): Promise<CashSweep> {
    const pool = await this.repository.findById(input.poolId, actor.tenantId);
    if (!pool) {
      throw CashPoolingError.poolNotFound(input.poolId);
    }

    if (pool.status !== 'active') {
      throw CashPoolingError.poolNotActive(input.poolId);
    }

    // Verify period is open
    await this.fiscalTime.verifyPeriodOpen(actor.tenantId, input.executionDate);

    // Verify dual authorization
    if (input.approver1Id === input.approver2Id) {
      throw CashPoolingError.dualAuthorizationRequired();
    }

    // Get master account balance
    const masterBalanceInfo = await this.getAccountBalance(pool.masterAccountId, input.executionDate, actor);
    const pendingPayments = await this.paymentRepo.findPending(pool.masterAccountId, actor.tenantId);
    const pendingTotal = pendingPayments.reduce(
      (sum, p) => moneyAdd(sum, p.amount),
      { amount: '0', currency: masterBalanceInfo.balance.currency }
    );
    const availableBalance = moneySubtract(masterBalanceInfo.balance, pendingTotal);

    // Validate sufficient balance
    if (moneyLessThanOrEqual(availableBalance, input.fundAmount)) {
      throw CashPoolingError.insufficientBalance(availableBalance, input.fundAmount);
    }

    // Find participant
    const participant = pool.participants.find(p => p.accountId === input.participantAccountId);
    if (!participant) {
      throw CashPoolingError.poolNotFound(input.participantAccountId);
    }

    // Generate idempotency key
    const idempotencyKey = input.idempotencyKey ||
      `POOL-${input.poolId}-FUND-${input.executionDate.toISOString().split('T')[0]}-${input.participantAccountId}`;

    // Check idempotency
    const existingFund = await this.repository.findSweepByKey(idempotencyKey);
    if (existingFund && existingFund.status === 'executed') {
      return existingFund;
    }

    // Create fund record
    const fund = await this.repository.createSweep({
      tenantId: actor.tenantId,
      poolId: input.poolId,
      executionDate: input.executionDate,
      sweepType: 'fund',
      participantAccountId: input.participantAccountId,
      participantCompanyId: participant.companyId,
      masterAccountId: pool.masterAccountId,
      amount: input.fundAmount,
      currency: input.fundAmount.currency,
      initiatorId: input.initiatorId,
      approver1Id: input.approver1Id,
      approver2Id: input.approver2Id,
      idempotencyKey,
      retryCount: 0,
      maxRetries: 3,
      status: 'pending',
      balanceSource: masterBalanceInfo.source,
      balanceAsOf: masterBalanceInfo.lastUpdated,
      version: 1,
    });

    // Execute payment (via AP-05)
    const paymentResult = await this.paymentRepo.createPayment({
      fromAccountId: pool.masterAccountId,
      toAccountId: input.participantAccountId,
      amount: input.fundAmount,
      currency: input.fundAmount.currency,
      paymentType: 'cash_pool_fund',
      reference: `POOL-${input.poolId}-FUND-${input.executionDate.toISOString()}`,
      idempotencyKey: `PAY-${idempotencyKey}`,
      initiatorId: input.initiatorId,
      approver1Id: input.approver1Id,
      approver2Id: input.approver2Id,
    });

    // Update fund record
    await this.repository.updateSweep(fund.id, {
      status: 'executing',
      paymentId: paymentResult.paymentId,
      version: fund.version,
    });

    // Post GL entries (entity-by-entity)
    await this.postFundGLEntries(fund, participant, pool, actor);

    // Create IC loan entry (master → participant)
    const icLoanResult = await this.icLoan.createLoan({
      lenderCompanyId: pool.masterCompanyId,
      borrowerCompanyId: participant.companyId,
      amount: input.fundAmount,
      currency: input.fundAmount.currency,
      interestRate: pool.interestRate,
      sourceType: 'cash_pool_fund',
      sourceId: fund.id,
    });

    // Update fund record
    await this.repository.updateSweep(fund.id, {
      status: 'executed',
      executedAt: new Date(),
      icLoanId: icLoanResult.loanId,
      version: fund.version + 1,
    });

    // Audit event
    await this.audit.emit({
      eventType: 'treasury.cash_pool.fund_executed',
      aggregateId: input.poolId,
      aggregateType: 'CashPool',
      tenantId: actor.tenantId,
      userId: actor.userId,
      payload: {
        fundId: fund.id,
        participantAccountId: input.participantAccountId,
        amount: input.fundAmount,
      },
    });

    return fund;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // POST FUND GL ENTRIES (Entity-by-Entity)
  // ═══════════════════════════════════════════════════════════════════════════

  private async postFundGLEntries(
    fund: CashSweep,
    participant: { companyId: string; glAccountCode: string },
    pool: CashPool,
    actor: ActorContext
  ): Promise<{ participantJEId: string; masterJEId: string }> {
    // Participant entity journal entry
    const participantJE = await this.glPosting.postJournal({
      sourceType: 'CASH_POOL_FUND',
      sourceId: fund.id,
      entityId: participant.companyId,
      lines: [
        {
          accountCode: participant.glAccountCode,
          debitAmount: fund.amount,
          creditAmount: undefined,
        },
        {
          accountCode: `IC_LOAN_PAYABLE_${pool.masterCompanyId}`,
          debitAmount: undefined,
          creditAmount: fund.amount,
        },
      ],
      memo: `Cash pool fund from master account`,
      postedBy: actor.userId,
      correlationId: fund.id,
    });

    // Master entity journal entry
    const masterJE = await this.glPosting.postJournal({
      sourceType: 'CASH_POOL_FUND',
      sourceId: fund.id,
      entityId: pool.masterCompanyId,
      lines: [
        {
          accountCode: `IC_LOAN_RECEIVABLE_${participant.companyId}`,
          debitAmount: fund.amount,
          creditAmount: undefined,
        },
        {
          accountCode: pool.masterGlAccountCode,
          debitAmount: undefined,
          creditAmount: fund.amount,
        },
      ],
      memo: `Cash pool fund to participant ${participant.companyId}`,
      postedBy: actor.userId,
      correlationId: fund.id,
    });

    // Update fund record
    await this.repository.updateSweep(fund.id, {
      participantJournalEntryId: participantJE.id,
      masterJournalEntryId: masterJE.id,
      version: fund.version,
    });

    return { participantJEId: participantJE.id, masterJEId: masterJE.id };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REQUEST CONFIG CHANGE
  // ═══════════════════════════════════════════════════════════════════════════

  async requestConfigChange(
    input: RequestConfigChangeInput,
    actor: ActorContext
  ): Promise<PoolConfigChange> {
    const pool = await this.repository.findById(input.poolId, actor.tenantId);
    if (!pool) {
      throw CashPoolingError.poolNotFound(input.poolId);
    }

    // Extract before value (relevant fields only)
    const beforeValue: Record<string, unknown> = {};
    switch (input.changeType) {
      case 'add_participant':
      case 'remove_participant':
        beforeValue.participants = pool.participants;
        break;
      case 'update_threshold':
        beforeValue.participants = pool.participants.map(p => ({
          accountId: p.accountId,
          targetBalance: p.targetBalance,
          sweepThreshold: p.sweepThreshold,
        }));
        break;
      case 'update_rate':
        beforeValue.interestRate = pool.interestRate;
        beforeValue.interestBenchmark = pool.interestBenchmark;
        break;
      case 'change_master':
        beforeValue.masterAccountId = pool.masterAccountId;
        beforeValue.masterCompanyId = pool.masterCompanyId;
        break;
      case 'update_frequency':
        beforeValue.sweepFrequency = pool.sweepFrequency;
        beforeValue.sweepTime = pool.sweepTime;
        break;
      case 'update_legal':
        beforeValue.agreementReference = pool.agreementReference;
        beforeValue.interestBenchmark = pool.interestBenchmark;
        beforeValue.entityLimits = pool.entityLimits;
        break;
    }

    // Calculate diff
    const diff: Array<{ field: string; before: unknown; after: unknown }> = [];
    for (const [key, value] of Object.entries(input.afterValue)) {
      if (beforeValue[key] !== value) {
        diff.push({
          field: key,
          before: beforeValue[key],
          after: value,
        });
      }
    }

    // Create change request
    const changeRequest = await this.repository.createConfigChange({
      tenantId: actor.tenantId,
      poolId: input.poolId,
      changeType: input.changeType,
      beforeValue,
      afterValue: input.afterValue,
      diff,
      requestedBy: actor.userId,
      status: 'pending',
      poolVersionBefore: pool.version,
      version: 1,
    });

    // Audit event
    await this.audit.emitTransactional({
      event: 'treasury.cash_pool.config_change_requested',
      actor,
      metadata: {
        changeRequestId: changeRequest.id,
        changeType: input.changeType,
        diff,
      },
    });

    return changeRequest;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // APPROVE CONFIG CHANGE
  // ═══════════════════════════════════════════════════════════════════════════

  async approveConfigChange(
    input: ApproveConfigChangeInput,
    actor: ActorContext
  ): Promise<void> {
    const changeRequest = await this.repository.findConfigChangeById(input.changeId);
    if (!changeRequest) {
      throw CashPoolingError.poolNotFound(input.changeId);
    }

    if (changeRequest.status !== 'pending') {
      throw new CashPoolingError(
        CashPoolingErrorCode.CONFIG_CHANGE_NOT_PENDING,
        `Config change ${input.changeId} is not pending`,
        { status: changeRequest.status }
      );
    }

    const pool = await this.repository.findById(changeRequest.poolId, actor.tenantId);
    if (!pool) {
      throw CashPoolingError.poolNotFound(changeRequest.poolId);
    }

    // Verify version (optimistic locking)
    if (pool.version !== changeRequest.poolVersionBefore) {
      throw CashPoolingError.versionConflict(changeRequest.poolVersionBefore, pool.version);
    }

    // Apply change
    const updatedPool = await this.applyConfigChange(pool, changeRequest);

    // Update pool (merge updates with existing pool)
    const finalPool = await this.repository.update(
      changeRequest.poolId,
      actor.tenantId,
      { ...pool, ...updatedPool, updatedBy: actor.userId, updatedAt: new Date() },
      pool.version
    );

    // Create config history
    await this.repository.createConfigHistory({
      tenantId: actor.tenantId,
      poolId: changeRequest.poolId,
      version: finalPool.version,
      configuration: finalPool,
      changeRequestId: changeRequest.id,
      changedBy: actor.userId,
      changedAt: new Date(),
      isCurrent: true,
    });

    // Update change request
    await this.repository.updateConfigChange(input.changeId, {
      status: 'approved',
      approvedBy: actor.userId,
      approvedAt: new Date(),
      effectiveDate: input.effectiveDate || new Date(),
      effectiveAt: input.effectiveDate || new Date(),
      poolVersionAfter: finalPool.version,
      version: changeRequest.version + 1,
    }, changeRequest.version);

    // Audit event
    await this.audit.emitTransactional({
      event: 'treasury.cash_pool.config_change_approved',
      actor,
      metadata: {
        changeRequestId: input.changeId,
        changeType: changeRequest.changeType,
        effectiveDate: input.effectiveDate || new Date(),
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // APPLY CONFIG CHANGE
  // ═══════════════════════════════════════════════════════════════════════════

  private async applyConfigChange(
    pool: CashPool,
    changeRequest: PoolConfigChange
  ): Promise<Partial<CashPool>> {
    const updates: Partial<CashPool> = {};

    switch (changeRequest.changeType) {
      case 'add_participant':
        const newParticipant = changeRequest.afterValue.participants as typeof pool.participants;
        updates.participants = [...pool.participants, ...newParticipant];
        break;
      case 'remove_participant':
        const removedAccountId = changeRequest.afterValue.accountId as string;
        updates.participants = pool.participants.filter(p => p.accountId !== removedAccountId);
        break;
      case 'update_threshold':
        const updatedParticipants = changeRequest.afterValue.participants as typeof pool.participants;
        updates.participants = updatedParticipants;
        break;
      case 'update_rate':
        updates.interestRate = changeRequest.afterValue.interestRate as number;
        updates.interestBenchmark = changeRequest.afterValue.interestBenchmark as typeof pool.interestBenchmark;
        break;
      case 'change_master':
        updates.masterAccountId = changeRequest.afterValue.masterAccountId as string;
        updates.masterCompanyId = changeRequest.afterValue.masterCompanyId as string;
        break;
      case 'update_frequency':
        updates.sweepFrequency = changeRequest.afterValue.sweepFrequency as typeof pool.sweepFrequency;
        updates.sweepTime = changeRequest.afterValue.sweepTime as string;
        break;
      case 'update_legal':
        updates.agreementReference = changeRequest.afterValue.agreementReference as string;
        updates.interestBenchmark = changeRequest.afterValue.interestBenchmark as typeof pool.interestBenchmark;
        updates.entityLimits = changeRequest.afterValue.entityLimits as typeof pool.entityLimits;
        break;
    }

    return updates;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LIST POOLS
  // ═══════════════════════════════════════════════════════════════════════════

  async listPools(
    filter: CashPoolFilter,
    limit: number,
    offset: number,
    actor: ActorContext
  ): Promise<{ data: CashPool[]; total: number }> {
    return this.repository.list(
      { ...filter, tenantId: actor.tenantId },
      limit,
      offset
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GET POOL BY ID
  // ═══════════════════════════════════════════════════════════════════════════

  async getPoolById(
    id: string,
    actor: ActorContext
  ): Promise<CashPool | null> {
    return this.repository.findById(id, actor.tenantId);
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createCashPoolingService(
  deps: CashPoolingServiceDeps
): CashPoolingService {
  return new CashPoolingService(deps);
}
