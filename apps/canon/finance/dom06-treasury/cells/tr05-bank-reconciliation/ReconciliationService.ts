/**
 * TR-05 Bank Reconciliation - Service Implementation
 * 
 * Domain service for bank statement reconciliation.
 * Implements statement import, matching, reconciliation, and finalization.
 * 
 * @module TR-05
 */

import type {
  BankStatement,
  StatementItem,
  ReconMatch,
  ReconMatchAllocation,
  BankAccountBalanceSnapshot,
  ImportStatementInput,
  AutoMatchInput,
  ManualMatchInput,
  CreateReconcilingItemInput,
  CreateAdjustmentInput,
  FinalizeReconciliationInput,
  ReconciliationFilter,
  ReconciliationRepositoryPort,
  BankAccountRepositoryPort,
  GLRepositoryPort,
  GLPostingPort,
  AuditPort,
  FiscalTimePort,
  PolicyPort,
  FXPort,
  SequencePort,
  ActorContext,
  NormalizedAmount,
  GLTransaction,
  MatchingResult,
  AdjustedGLBalanceResult,
  FinalizationResult,
  Money,
} from './types';
import { ReconciliationError, ReconciliationErrorCode } from './errors';
import { createHash } from 'crypto';
import Decimal from 'decimal.js';

// =============================================================================
// MONEY HELPERS (Safe arithmetic)
// =============================================================================

/**
 * Create Money from JSON
 */
function moneyFromJSON(json: Money): Decimal {
  return new Decimal(json.amount);
}

/**
 * Create Money JSON from Decimal
 */
function moneyToJSON(decimal: Decimal, currency: string): Money {
  return {
    amount: decimal.toFixed(4),
    currency,
  };
}

/**
 * Add two Money values (same currency)
 */
function moneyAdd(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error(`Currency mismatch: ${a.currency} vs ${b.currency}`);
  }
  const sum = moneyFromJSON(a).plus(moneyFromJSON(b));
  return moneyToJSON(sum, a.currency);
}

/**
 * Subtract two Money values (same currency)
 */
function moneySubtract(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error(`Currency mismatch: ${a.currency} vs ${b.currency}`);
  }
  const diff = moneyFromJSON(a).minus(moneyFromJSON(b));
  return moneyToJSON(diff, a.currency);
}

/**
 * Get absolute value of Money
 */
function moneyAbs(m: Money): Money {
  const abs = moneyFromJSON(m).abs();
  return moneyToJSON(abs, m.currency);
}

/**
 * Compare Money values
 */
function moneyLessThanOrEqual(a: Money, b: Money): boolean {
  if (a.currency !== b.currency) {
    throw new Error(`Currency mismatch: ${a.currency} vs ${b.currency}`);
  }
  return moneyFromJSON(a).lessThanOrEqualTo(moneyFromJSON(b));
}

function moneyGreaterThan(a: Money, b: Money): boolean {
  if (a.currency !== b.currency) {
    throw new Error(`Currency mismatch: ${a.currency} vs ${b.currency}`);
  }
  return moneyFromJSON(a).greaterThan(moneyFromJSON(b));
}

function moneyZero(currency: string): Money {
  return { amount: '0.0000', currency };
}

// =============================================================================
// NORMALIZATION HELPERS
// =============================================================================

/**
 * Get currency decimals from FX port
 */
async function getCurrencyDecimals(
  currency: string,
  fxPort: FXPort
): Promise<number> {
  const config = await fxPort.getCurrencyConfig(currency);
  return config.decimals;
}

/**
 * Normalize bank amount to signed minor units
 * Bank items: D = debit (negative), C = credit (positive)
 */
async function normalizeBankAmount(
  bankItem: StatementItem,
  fxPort: FXPort
): Promise<NormalizedAmount> {
  const decimals = await getCurrencyDecimals(bankItem.amount.currency, fxPort);
  const amountDecimal = moneyFromJSON(bankItem.amount);
  const amountMinorUnits = amountDecimal.times(new Decimal(10).pow(decimals));
  
  // Bank items: D = debit (negative), C = credit (positive)
  const signedMinorUnits = bankItem.debitCredit === 'D'
    ? amountMinorUnits.negated().round().toNumber()
    : amountMinorUnits.round().toNumber();
  
  return {
    signedMinorUnits,
    currency: bankItem.amount.currency,
    originalAmount: bankItem.amount,
  };
}

/**
 * Normalize GL amount to signed minor units
 * For bank account: debit increases balance (positive), credit decreases balance (negative)
 */
async function normalizeGLAmount(
  glTransaction: GLTransaction,
  fxPort: FXPort
): Promise<NormalizedAmount> {
  const decimals = await getCurrencyDecimals(glTransaction.amount.currency, fxPort);
  const amountDecimal = moneyFromJSON(glTransaction.amount);
  const amountMinorUnits = amountDecimal.times(new Decimal(10).pow(decimals));
  
  // GL transactions: debit = positive (for bank account), credit = negative
  const signedMinorUnits = glTransaction.debitCredit === 'D'
    ? amountMinorUnits.round().toNumber()
    : amountMinorUnits.negated().round().toNumber();
  
  return {
    signedMinorUnits,
    currency: glTransaction.amount.currency,
    originalAmount: glTransaction.amount,
  };
}

/**
 * Compare dates (day-based, timezone-safe)
 * Returns difference in days (not milliseconds)
 */
function compareDates(dateA: Date, dateB: Date, bankTimezone?: string): number {
  // For now, use UTC. In production, convert to bank timezone
  const dateAOnly = new Date(Date.UTC(dateA.getFullYear(), dateA.getMonth(), dateA.getDate()));
  const dateBOnly = new Date(Date.UTC(dateB.getFullYear(), dateB.getMonth(), dateB.getDate()));
  
  // Calculate difference in days
  const diffMs = dateAOnly.getTime() - dateBOnly.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

// =============================================================================
// SERVICE DEPENDENCIES
// =============================================================================

export interface ReconciliationServiceDeps {
  repository: ReconciliationRepositoryPort;
  bankRepo: BankAccountRepositoryPort;
  glRepo: GLRepositoryPort;
  glPosting: GLPostingPort;
  audit: AuditPort;
  fiscalTime: FiscalTimePort;
  policy: PolicyPort;
  fx: FXPort;
  sequence: SequencePort;
}

// =============================================================================
// SERVICE IMPLEMENTATION
// =============================================================================

export class ReconciliationService {
  private readonly repository: ReconciliationRepositoryPort;
  private readonly bankRepo: BankAccountRepositoryPort;
  private readonly glRepo: GLRepositoryPort;
  private readonly glPosting: GLPostingPort;
  private readonly audit: AuditPort;
  private readonly fiscalTime: FiscalTimePort;
  private readonly policy: PolicyPort;
  private readonly fx: FXPort;
  private readonly sequence: SequencePort;

  constructor(deps: ReconciliationServiceDeps) {
    this.repository = deps.repository;
    this.bankRepo = deps.bankRepo;
    this.glRepo = deps.glRepo;
    this.fiscalTime = deps.fiscalTime;
    this.policy = deps.policy;
    this.fx = deps.fx;
    this.sequence = deps.sequence;
    this.glPosting = deps.glPosting;
    this.audit = deps.audit;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // IMPORT STATEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  async importStatement(
    input: ImportStatementInput,
    actor: ActorContext
  ): Promise<BankStatement> {
    // 1. Verify period is open
    await this.fiscalTime.verifyPeriodOpen(actor.tenantId, input.statementDate);

    // 2. Verify bank account is active
    const bankAccount = await this.bankRepo.findById(input.bankAccountId, actor.tenantId);
    if (!bankAccount) {
      throw ReconciliationError.statementNotFound(input.bankAccountId);
    }
    if (bankAccount.status !== 'active') {
      throw ReconciliationError.bankAccountNotActive(input.bankAccountId);
    }

    // 3. Parse statement (simplified - in production, use proper parsers)
    const parsed = await this.parseStatement(input.statementFormat, input.statementData);

    // 4. Calculate file hash for deduplication
    const fileHash = createHash('sha256')
      .update(typeof input.statementData === 'string' ? input.statementData : Buffer.from(input.statementData))
      .digest('hex');

    // 5. Check for duplicate statement
    const existing = await this.repository.findStatementByKeys({
      bankAccountId: input.bankAccountId,
      statementNumber: parsed.statementNumber,
      statementDate: parsed.statementDate,
      openingBalance: parsed.openingBalance,
      closingBalance: parsed.closingBalance,
      periodStart: parsed.periodStart,
      periodEnd: parsed.periodEnd,
    });

    if (existing) {
      if (existing.fileHash === fileHash) {
        throw ReconciliationError.duplicateStatement(parsed.statementNumber, parsed.statementDate);
      }
    }

    // 6. Validate opening balance matches previous statement (if exists)
    // TODO: Implement opening balance validation

    // 7. Generate statement number
    const statementNumber = await this.sequence.next({
      tenantId: actor.tenantId,
      entityType: 'bank_statement',
    });

    // 8. Create statement record
    const statement = await this.repository.createStatement({
      tenantId: actor.tenantId,
      bankAccountId: input.bankAccountId,
      statementNumber,
      statementDate: parsed.statementDate,
      periodStart: parsed.periodStart,
      periodEnd: parsed.periodEnd,
      openingBalanceDate: parsed.openingBalanceDate,
      closingBalanceDate: parsed.closingBalanceDate,
      openingBalance: parsed.openingBalance,
      closingBalance: parsed.closingBalance,
      currency: parsed.currency,
      status: 'draft',
      importFormat: input.statementFormat,
      importSource: input.importSource || 'manual',
      fileHash,
      totalItems: parsed.transactions.length,
      matchedItems: 0,
      unmatchedItems: parsed.transactions.length,
      importedBy: actor.userId,
      importedAt: new Date(),
    });

    // 9. Create statement items
    for (const tx of parsed.transactions) {
      await this.repository.createStatementItem({
        statementId: statement.id,
        valueDate: tx.valueDate,
        entryDate: tx.entryDate,
        amount: tx.amount,
        debitCredit: tx.debitCredit,
        reference: tx.reference,
        description: tx.description,
        counterparty: tx.counterparty,
        status: 'unmatched',
      });
    }

    // 10. Audit event
    await this.audit.emit({
      eventType: 'treasury.reconciliation.statement_imported',
      aggregateId: statement.id,
      aggregateType: 'BankStatement',
      tenantId: actor.tenantId,
      userId: actor.userId,
      payload: {
        statementNumber,
        statementDate: parsed.statementDate,
        totalItems: parsed.transactions.length,
        importFormat: input.statementFormat,
        fileHash,
      },
    });

    return statement;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTO MATCH
  // ═══════════════════════════════════════════════════════════════════════════

  async autoMatch(
    input: AutoMatchInput,
    actor: ActorContext
  ): Promise<MatchingResult> {
    const statement = await this.repository.findStatementById(input.statementId, actor.tenantId);
    if (!statement) {
      throw ReconciliationError.statementNotFound(input.statementId);
    }

    if (statement.status === 'finalized' || statement.status === 'cancelled') {
      throw ReconciliationError.statementAlreadyFinalized(input.statementId);
    }

    const bankAccount = await this.bankRepo.findById(statement.bankAccountId, actor.tenantId);
    if (!bankAccount) {
      throw ReconciliationError.statementNotFound(statement.bankAccountId);
    }

    const bankItems = await this.repository.findStatementItemsByStatement(input.statementId);
    const glTransactions = await this.glRepo.getTransactions(
      statement.bankAccountId,
      statement.periodStart,
      statement.periodEnd,
      actor.tenantId
    );

    const rules = input.matchingRules || {
      exactMatchEnabled: true,
      fuzzyMatchEnabled: true,
      dateToleranceDays: 3,
    };

    const matches: ReconMatch[] = [];
    const tolerance = await this.getTolerance(statement.currency);

    // 1. Exact Match
    if (rules.exactMatchEnabled) {
      for (const bankItem of bankItems.filter(i => i.status === 'unmatched')) {
        const normalizedBank = await normalizeBankAmount(bankItem, this.fx);
        
        for (const glTxn of glTransactions.filter(gl => !gl.matched)) {
          const normalizedGL = await normalizeGLAmount(glTxn, this.fx);
          
          // Compare signed minor units
          if (
            normalizedBank.signedMinorUnits === normalizedGL.signedMinorUnits &&
            normalizedBank.currency === normalizedGL.currency &&
            bankItem.reference === glTxn.reference
          ) {
            // Compare dates (day-based)
            const dateDiff = compareDates(bankItem.valueDate, glTxn.transactionDate, bankAccount.timezone);
            if (dateDiff === 0) {
              const match = await this.repository.createMatch({
                tenantId: actor.tenantId,
                statementId: input.statementId,
                bankItemId: bankItem.id,
                glTransactionId: glTxn.id,
                allocatedAmount: bankItem.amount,
                matchType: 'exact',
                confidence: 1.0,
                matchedBy: actor.userId,
                status: 'active',
              });
              matches.push(match);
              
              // Update item status
              await this.repository.updateStatementItem(bankItem.id, { status: 'matched' });
              glTxn.matched = true;
              break;
            }
          }
        }
      }
    }

    // 2. Fuzzy Match
    if (rules.fuzzyMatchEnabled) {
      const decimals = await getCurrencyDecimals(statement.currency, this.fx);
      const toleranceMinorUnits = tolerance * Math.pow(10, decimals);

      for (const bankItem of bankItems.filter(i => i.status === 'unmatched')) {
        const normalizedBank = await normalizeBankAmount(bankItem, this.fx);
        
        const fuzzyMatches = await Promise.all(
          glTransactions
            .filter(gl => !gl.matched)
            .map(async (gl) => {
              const normalizedGL = await normalizeGLAmount(gl, this.fx);
              const amountDiff = Math.abs(normalizedBank.signedMinorUnits - normalizedGL.signedMinorUnits);
              const dateDiff = Math.abs(compareDates(bankItem.valueDate, gl.transactionDate, bankAccount.timezone));
              
              if (amountDiff <= toleranceMinorUnits && dateDiff <= rules.dateToleranceDays) {
                const confidence = this.calculateConfidence(bankItem, gl, amountDiff, dateDiff);
                return { gl, confidence, amountDiff, dateDiff };
              }
              return null;
            })
        );
        
        const validFuzzyMatches = fuzzyMatches
          .filter(m => m !== null)
          .sort((a, b) => (b?.confidence || 0) - (a?.confidence || 0));

      if (validFuzzyMatches.length > 0 && validFuzzyMatches[0]!.confidence >= 0.8) {
        const match = await this.repository.createMatch({
          tenantId: actor.tenantId,
          statementId: input.statementId,
          bankItemId: bankItem.id,
          glTransactionId: validFuzzyMatches[0]!.gl.id,
          allocatedAmount: bankItem.amount,
          matchType: 'fuzzy',
          confidence: validFuzzyMatches[0]!.confidence,
          matchedBy: actor.userId,
          status: 'active',
        });
        matches.push(match);
        
        await this.repository.updateStatementItem(bankItem.id, { status: 'matched' });
        validFuzzyMatches[0]!.gl.matched = true;
      }
    }
    }

    // Update statement matched count
    const unmatchedItems = bankItems.filter(i => i.status === 'unmatched');
    await this.repository.updateStatement(statement.id, actor.tenantId, {
      matchedItems: matches.length,
      unmatchedItems: unmatchedItems.length,
      status: statement.status === 'draft' ? 'in_progress' : statement.status,
    }, statement.version);

    // Audit event
    await this.audit.emit({
      eventType: 'treasury.reconciliation.auto_matched',
      aggregateId: input.statementId,
      aggregateType: 'BankStatement',
      tenantId: actor.tenantId,
      userId: actor.userId,
      payload: {
        matchedCount: matches.length,
        matchTypes: matches.map(m => m.matchType),
      },
    });

    return {
      matches,
      matchedCount: matches.length,
      unmatchedBankItems: unmatchedItems,
      unmatchedGLTransactions: glTransactions.filter(gl => !gl.matched),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CALCULATE ADJUSTED GL BALANCE
  // ═══════════════════════════════════════════════════════════════════════════

  async calculateAdjustedGLBalance(
    statementId: string,
    actor: ActorContext
  ): Promise<AdjustedGLBalanceResult> {
    const statement = await this.repository.findStatementById(statementId, actor.tenantId);
    if (!statement) {
      throw ReconciliationError.statementNotFound(statementId);
    }

    const bankAccount = await this.bankRepo.findById(statement.bankAccountId, actor.tenantId);
    if (!bankAccount) {
      throw ReconciliationError.statementNotFound(statement.bankAccountId);
    }

    // Get GL balance at statement date
    const glBalance = await this.glRepo.getAccountBalance(
      bankAccount.glAccountCode,
      statement.closingBalanceDate,
      actor.tenantId
    );

    // Get reconciling items (statement items marked as reconciling)
    const statementItems = await this.repository.findStatementItemsByStatement(statementId);
    const reconcilingItems = statementItems.filter(i => i.status === 'reconciling_item');

    // Calculate adjustments using Money-safe arithmetic
    let adjustments = moneyZero(statement.currency);

    for (const item of reconcilingItems) {
      // Add items that increase GL balance
      if (item.reconcilingItemType === 'deposit_in_transit' || item.reconcilingItemType === 'interest') {
        adjustments = moneyAdd(adjustments, item.amount);
      }
      
      // Subtract items that decrease GL balance
      if (item.reconcilingItemType === 'outstanding_check' || item.reconcilingItemType === 'bank_charge') {
        adjustments = moneySubtract(adjustments, item.amount);
      }
    }

    // Calculate adjusted GL balance
    const adjustedGLBalance = moneyAdd(glBalance, adjustments);

    // Compare with bank balance
    const bankBalance = statement.closingBalance;
    const difference = moneySubtract(adjustedGLBalance, bankBalance);

    // Get currency-aware tolerance
    const tolerance = await this.getTolerance(statement.currency);
    const toleranceMoney: Money = { amount: String(tolerance), currency: statement.currency };

    // Check if reconciled (within tolerance)
    const absDifference = moneyAbs(difference);
    const isReconciled = moneyLessThanOrEqual(absDifference, toleranceMoney);

    // Check exception threshold
    const exceptionThreshold = await this.getExceptionThreshold(statement.currency);
    const exceptionThresholdMoney: Money = { amount: String(exceptionThreshold), currency: statement.currency };
    const exceptionThresholdExceeded = moneyGreaterThan(absDifference, exceptionThresholdMoney);

    // Update statement
    await this.repository.updateStatement(statementId, actor.tenantId, {
      glBalance,
      adjustedGLBalance,
      difference,
    }, statement.version);

    // If exception threshold exceeded, flag for review
    if (exceptionThresholdExceeded) {
      await this.repository.updateStatement(statementId, actor.tenantId, {
        status: 'exception',
        exceptionReason: 'Difference exceeds exception threshold',
        exceptionThreshold: exceptionThresholdMoney,
        escalatedTo: this.determineEscalationRole(difference, exceptionThreshold),
      }, statement.version);
    }

    return {
      glBalance,
      adjustedGLBalance,
      bankBalance,
      difference,
      isReconciled,
      exceptionThresholdExceeded,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FINALIZE RECONCILIATION
  // ═══════════════════════════════════════════════════════════════════════════

  async finalizeReconciliation(
    input: FinalizeReconciliationInput,
    actor: ActorContext
  ): Promise<FinalizationResult> {
    const statement = await this.repository.findStatementById(input.statementId, actor.tenantId);
    if (!statement) {
      throw ReconciliationError.statementNotFound(input.statementId);
    }

    // Verify period is open
    await this.fiscalTime.verifyPeriodOpen(actor.tenantId, statement.statementDate);

    // 1. Verify all items matched or categorized
    const unmatchedItems = await this.repository.findUnmatchedItems(input.statementId);
    if (unmatchedItems.length > 0) {
      throw ReconciliationError.reconciliationNotComplete(unmatchedItems.length);
    }

    // 2. Calculate adjusted GL balance
    const balanceResult = await this.calculateAdjustedGLBalance(input.statementId, actor);

    if (!balanceResult.isReconciled) {
      throw ReconciliationError.reconciliationNotBalanced(balanceResult.difference);
    }

    // 3. Verify no exception threshold exceeded
    if (balanceResult.exceptionThresholdExceeded) {
      throw ReconciliationError.exceptionThresholdExceeded(
        balanceResult.difference,
        { amount: String(await this.getExceptionThreshold(statement.currency)), currency: statement.currency }
      );
    }

    // 4. Verify dual authorization
    if (input.approver1Id === input.approver2Id) {
      throw ReconciliationError.dualAuthorizationRequired();
    }

    if (input.approver1Id === actor.userId || input.approver2Id === actor.userId) {
      throw ReconciliationError.sodViolation(actor.userId, 'Finalizer cannot be an approver');
    }

    // 5. Finalize (lock reconciliation)
    const finalized = await this.repository.updateStatement(
      input.statementId,
      actor.tenantId,
      {
        status: 'finalized',
        finalizedBy: actor.userId,
        approver1Id: input.approver1Id,
        approver2Id: input.approver2Id,
        finalizedAt: new Date(),
        notes: input.notes,
      },
      statement.version
    );

    // 6. Store statement-derived balance snapshot (do NOT overwrite GL balance)
    await this.repository.createBalanceSnapshot({
      tenantId: actor.tenantId,
      bankAccountId: statement.bankAccountId,
      statementId: input.statementId,
      balanceDate: statement.closingBalanceDate,
      balance: statement.closingBalance,
      source: 'bank_statement',
      reconciledAt: new Date(),
      reconciledBy: actor.userId,
    });

    // 7. Audit
    await this.audit.emitTransactional({
      event: 'treasury.reconciliation.finalized',
      actor,
      metadata: {
        statementId: input.statementId,
        adjustedGLBalance: balanceResult.adjustedGLBalance,
        bankBalance: balanceResult.bankBalance,
        difference: balanceResult.difference,
        approvers: [input.approver1Id, input.approver2Id],
      },
    });

    return {
      statementId: input.statementId,
      finalizedAt: new Date(),
      adjustedGLBalance: balanceResult.adjustedGLBalance,
      bankBalance: balanceResult.bankBalance,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  private async getTolerance(currency: string): Promise<number> {
    const config = await this.fx.getCurrencyConfig(currency);
    return config.tolerance;
  }

  private async getExceptionThreshold(currency: string): Promise<number> {
    const policy = await this.policy.getReconciliationPolicy(currency);
    return policy.exceptionThreshold;
  }

  private calculateConfidence(
    bankItem: StatementItem,
    glTxn: GLTransaction,
    amountDiff: number,
    dateDiff: number
  ): number {
    // Simple confidence calculation
    // In production, use more sophisticated algorithm
    let confidence = 1.0;
    
    // Reduce confidence based on amount difference
    if (amountDiff > 0) {
      const amountDecimal = moneyFromJSON(bankItem.amount);
      const diffPercent = new Decimal(amountDiff).div(amountDecimal).abs();
      confidence *= (1 - diffPercent.toNumber());
    }
    
    // Reduce confidence based on date difference
    if (dateDiff > 0) {
      confidence *= Math.max(0, 1 - (dateDiff / 30)); // 30 days max
    }
    
    // Boost confidence if reference matches
    if (bankItem.reference === glTxn.reference) {
      confidence = Math.min(1.0, confidence * 1.2);
    }
    
    return Math.max(0, Math.min(1.0, confidence));
  }

  private determineEscalationRole(difference: Money, threshold: number): 'ic_manager' | 'controller' | 'cfo' {
    const diffAmount = Math.abs(parseFloat(difference.amount));
    
    if (diffAmount > threshold * 10) {
      return 'cfo';
    } else if (diffAmount > threshold * 5) {
      return 'controller';
    } else {
      return 'ic_manager';
    }
  }

  private async parseStatement(
    format: 'mt940' | 'bai2' | 'csv' | 'ofx',
    data: string | Buffer
  ): Promise<{
    statementNumber: string;
    statementDate: Date;
    periodStart: Date;
    periodEnd: Date;
    openingBalanceDate: Date;
    closingBalanceDate: Date;
    openingBalance: Money;
    closingBalance: Money;
    currency: string;
    transactions: Array<{
      valueDate: Date;
      entryDate: Date;
      amount: Money;
      debitCredit: 'D' | 'C';
      reference: string;
      description: string;
      counterparty?: string;
    }>;
  }> {
    // TODO: Implement actual parsers for MT940, BAI2, CSV, OFX
    // For now, return mock data
    throw new Error('Statement parsing not yet implemented');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MANUAL MATCH
  // ═══════════════════════════════════════════════════════════════════════════

  async manualMatch(
    input: ManualMatchInput,
    actor: ActorContext
  ): Promise<{ matchedCount: number }> {
    const statement = await this.repository.findStatementById(input.statementId, actor.tenantId);
    if (!statement) {
      throw ReconciliationError.statementNotFound(input.statementId);
    }

    if (statement.status === 'finalized' || statement.status === 'cancelled') {
      throw ReconciliationError.statementAlreadyFinalized(input.statementId);
    }

    const matches: ReconMatch[] = [];
    const tolerance = await this.getTolerance(statement.currency);

    for (const matchInput of input.matches) {
      const bankItem = await this.repository.findStatementItemsByStatement(input.statementId)
        .then(items => items.find(i => i.id === matchInput.bankItemId));

      if (!bankItem) {
        throw ReconciliationError.statementNotFound(matchInput.bankItemId);
      }

      if (bankItem.status !== 'unmatched') {
        throw ReconciliationError.itemAlreadyMatched(matchInput.bankItemId, 'bank');
      }

      // Validate amounts match (within tolerance)
      // TODO: Implement amount validation

      // Create match record
      const match = await this.repository.createMatch({
        tenantId: actor.tenantId,
        statementId: input.statementId,
        bankItemId: matchInput.bankItemId,
        glTransactionId: matchInput.glTransactionIds[0], // For now, single match
        allocatedAmount: bankItem.amount,
        matchType: matchInput.matchType,
        confidence: matchInput.confidence || 1.0,
        matchReason: matchInput.reason,
        matchedBy: actor.userId,
        status: 'active',
      });

      matches.push(match);

      // Update item status
      await this.repository.updateStatementItem(bankItem.id, { status: 'matched' });
    }

    // Update statement matched count
    const unmatchedItems = await this.repository.findUnmatchedItems(input.statementId);
    await this.repository.updateStatement(statement.id, actor.tenantId, {
      matchedItems: statement.matchedItems + matches.length,
      unmatchedItems: unmatchedItems.length,
    }, statement.version);

    // Audit event
    await this.audit.emit({
      eventType: 'treasury.reconciliation.manually_matched',
      aggregateId: input.statementId,
      aggregateType: 'BankStatement',
      tenantId: actor.tenantId,
      userId: actor.userId,
      payload: { matchedCount: matches.length },
    });

    return { matchedCount: matches.length };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CREATE RECONCILING ITEM
  // ═══════════════════════════════════════════════════════════════════════════

  async createReconcilingItem(
    input: CreateReconcilingItemInput,
    actor: ActorContext
  ): Promise<StatementItem> {
    const statement = await this.repository.findStatementById(input.statementId, actor.tenantId);
    if (!statement) {
      throw ReconciliationError.statementNotFound(input.statementId);
    }

    if (statement.status === 'finalized' || statement.status === 'cancelled') {
      throw ReconciliationError.statementAlreadyFinalized(input.statementId);
    }

    // If bankItemId provided, update existing item; otherwise create new
    if (input.bankItemId) {
      const item = await this.repository.findStatementItemsByStatement(input.statementId)
        .then(items => items.find(i => i.id === input.bankItemId));

      if (!item) {
        throw ReconciliationError.statementNotFound(input.bankItemId);
      }

      const updated = await this.repository.updateStatementItem(input.bankItemId, {
        status: 'reconciling_item',
        reconcilingItemType: input.itemType,
        expectedClearingDate: input.expectedClearingDate,
      });

      // Audit event
      await this.audit.emit({
        eventType: 'treasury.reconciliation.reconciling_items_created',
        aggregateId: input.statementId,
        aggregateType: 'BankStatement',
        tenantId: actor.tenantId,
        userId: actor.userId,
        payload: { itemType: input.itemType, amount: input.amount },
      });

      return updated;
    } else {
      // Create new reconciling item (not from statement)
      // This would be a manual entry
      // For now, we require bankItemId
      throw new Error('Creating new reconciling items without bankItemId not yet implemented');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CREATE ADJUSTMENT
  // ═══════════════════════════════════════════════════════════════════════════

  async createAdjustment(
    input: CreateAdjustmentInput,
    actor: ActorContext
  ): Promise<{ journalEntryId: string }> {
    const statement = await this.repository.findStatementById(input.statementId, actor.tenantId);
    if (!statement) {
      throw ReconciliationError.statementNotFound(input.statementId);
    }

    // Verify dual authorization
    if (input.createdBy === input.approvedBy) {
      throw ReconciliationError.dualAuthorizationRequired();
    }

    // Create adjustment journal entry via GL-03
    const journalResult = await this.glPosting.postJournal({
      sourceType: 'BANK_RECONCILIATION_ADJUSTMENT',
      sourceId: input.statementId,
      lines: [
        {
          accountCode: input.accountCode,
          debitAmount: input.debitAmount,
          creditAmount: input.creditAmount,
        },
        // Second line would be determined by adjustment type
        // For now, simplified
      ],
      memo: input.description,
      postedBy: actor.userId,
      correlationId: actor.correlationId,
    });

    // Update statement status
    await this.repository.updateStatement(statement.id, actor.tenantId, {
      status: 'adjusted',
    }, statement.version);

    // Re-run matching after adjustment
    await this.autoMatch({ statementId: input.statementId }, actor);

    // Audit event
    await this.audit.emit({
      eventType: 'treasury.reconciliation.adjustment_created',
      aggregateId: input.statementId,
      aggregateType: 'BankStatement',
      tenantId: actor.tenantId,
      userId: actor.userId,
      payload: {
        journalEntryId: journalResult.journalEntryId,
        accountCode: input.accountCode,
        reason: input.reason,
        approvers: [input.createdBy, input.approvedBy],
      },
    });

    return { journalEntryId: journalResult.journalEntryId };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LIST STATEMENTS
  // ═══════════════════════════════════════════════════════════════════════════

  async listStatements(
    filter: ReconciliationFilter,
    limit: number,
    offset: number,
    actor: ActorContext
  ): Promise<{ data: BankStatement[]; total: number }> {
    return this.repository.listStatements(
      { ...filter, tenantId: actor.tenantId },
      limit,
      offset
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GET STATEMENT BY ID
  // ═══════════════════════════════════════════════════════════════════════════

  async getStatementById(
    id: string,
    actor: ActorContext
  ): Promise<BankStatement | null> {
    return this.repository.findStatementById(id, actor.tenantId);
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createReconciliationService(
  deps: ReconciliationServiceDeps
): ReconciliationService {
  return new ReconciliationService(deps);
}
