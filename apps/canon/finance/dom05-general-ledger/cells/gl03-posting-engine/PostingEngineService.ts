/**
 * GL-03 Posting Engine — Posting Engine Service
 * 
 * The ONLY authorized writer to the immutable ledger.
 * Central posting authority for the entire Finance Canon.
 * 
 * @module GL-03
 */

import type {
  FiscalTimePort,
  COAPort,
  SequencePort,
  AuditPort,
  AccountValidationResult,
} from '@aibos/kernel-core';
import { PostingError } from './errors';

// =============================================================================
// Types
// =============================================================================

export interface ActorContext {
  tenantId: string;
  userId: string;
  permissions?: string[];
}

export type SourceType = 'journal_entry' | 'ap_invoice' | 'ap_payment' | 'ar_invoice' | 'ar_receipt';
export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

export interface LedgerLine {
  id: string;
  tenantId: string;
  companyId: string;
  postingReference: string;
  postingDate: Date;
  postingTimestamp: Date;
  sourceType: SourceType;
  sourceId: string;
  sourceLineId?: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  debitAmount?: string;
  creditAmount?: string;
  currency: string;
  functionalAmount?: string;
  exchangeRate?: string;
  fiscalYear: number;
  fiscalPeriod: number;
  periodCode: string;
  description: string;
  costCenter?: string;
  project?: string;
  department?: string;
  segment?: string;
  isReversal: boolean;
  reversesLineId?: string;
  reversedByLineId?: string;
  postedBy: string;
  postedAt: Date;
}

export interface PostingLineInput {
  accountCode: string;
  debitAmount?: string;
  creditAmount?: string;
  currency: string;
  description?: string;
  costCenter?: string;
  project?: string;
  department?: string;
  segment?: string;
  sourceLineId?: string;
}

export interface PostJournalEntryInput {
  journalEntryId: string;
  tenantId: string;
  companyId: string;
  entryDate: Date;
  entryType: string;
  reference: string;
  description: string;
  lines: PostingLineInput[];
  postedBy: string;
}

export interface PostSubledgerInput {
  sourceType: SourceType;
  sourceId: string;
  tenantId: string;
  companyId: string;
  postingDate: Date;
  description: string;
  lines: PostingLineInput[];
  postedBy: string;
}

export interface PostingResult {
  success: boolean;
  postingReference?: string;
  ledgerLineIds?: string[];
  totalDebit: string;
  totalCredit: string;
  postedAt?: Date;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface CreateReversalInput {
  originalPostingReference: string;
  tenantId: string;
  companyId: string;
  reversalDate: Date;
  reason: string;
  reversedBy: string;
}

export interface ReversalResult {
  success: boolean;
  reversalReference?: string;
  reversalLineIds?: string[];
  error?: {
    code: string;
    message: string;
  };
}

export interface TransactionContext {
  client: unknown;
}

export interface LedgerRepositoryPort {
  findBySourceId(sourceType: SourceType, sourceId: string, tenantId: string): Promise<LedgerLine[]>;
  findByPostingReference(postingReference: string, tenantId: string): Promise<LedgerLine[]>;
  insertLines(lines: Omit<LedgerLine, 'id'>[], txContext?: TransactionContext): Promise<LedgerLine[]>;
  markAsReversed(lineIds: string[], reversalLineIds: string[], txContext?: TransactionContext): Promise<void>;
  beginTransaction(): Promise<TransactionContext>;
  commitTransaction(txContext: TransactionContext): Promise<void>;
  rollbackTransaction(txContext: TransactionContext): Promise<void>;
}

export interface JournalEntryUpdatePort {
  updateToPosted(
    journalEntryId: string,
    tenantId: string,
    postingReference: string,
    postedBy: string,
    postedAt: Date,
    txContext?: TransactionContext
  ): Promise<void>;
}

export interface PostingEngineServiceDeps {
  ledgerRepository: LedgerRepositoryPort;
  journalEntryUpdate: JournalEntryUpdatePort;
  fiscalTime: FiscalTimePort;
  coa: COAPort;
  sequence: SequencePort;
  audit: AuditPort;
}

// =============================================================================
// Posting Engine Service
// =============================================================================

export class PostingEngineService {
  private readonly ledgerRepo: LedgerRepositoryPort;
  private readonly journalEntryUpdate: JournalEntryUpdatePort;
  private readonly fiscalTime: FiscalTimePort;
  private readonly coa: COAPort;
  private readonly sequence: SequencePort;
  private readonly audit: AuditPort;

  constructor(deps: PostingEngineServiceDeps) {
    this.ledgerRepo = deps.ledgerRepository;
    this.journalEntryUpdate = deps.journalEntryUpdate;
    this.fiscalTime = deps.fiscalTime;
    this.coa = deps.coa;
    this.sequence = deps.sequence;
    this.audit = deps.audit;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // POST JOURNAL ENTRY
  // ═══════════════════════════════════════════════════════════════════════════

  async postJournalEntry(
    input: PostJournalEntryInput,
    actor: ActorContext
  ): Promise<PostingResult> {
    // 1. IDEMPOTENCY CHECK
    const existing = await this.ledgerRepo.findBySourceId(
      'journal_entry',
      input.journalEntryId,
      input.tenantId
    );
    if (existing.length > 0) {
      return {
        success: true,
        postingReference: existing[0].postingReference,
        ledgerLineIds: existing.map((l) => l.id),
        totalDebit: this.sumDebits(existing),
        totalCredit: this.sumCredits(existing),
        postedAt: existing[0].postedAt,
      };
    }

    // 2. VALIDATE PERIOD
    const periodStatus = await this.fiscalTime.getPeriodStatus(
      input.entryDate,
      input.tenantId,
      input.companyId
    );

    if (!periodStatus.canPost) {
      throw PostingError.periodClosed(
        periodStatus.period?.periodId || 'unknown',
        periodStatus.status
      );
    }

    // 3. VALIDATE ENTRY TYPE FOR PERIOD STATUS
    const allowedTypes = this.getAllowedEntryTypes(periodStatus.status);
    if (!allowedTypes.includes(input.entryType)) {
      throw PostingError.entryTypeNotAllowed(input.entryType, periodStatus.status, allowedTypes);
    }

    // 4. VALIDATE ACCOUNTS
    await this.validateAccounts(input.lines, input.tenantId, input.companyId);

    // 5. VALIDATE BALANCE
    const { totalDebit, totalCredit } = this.calculateTotals(input.lines);
    if (Math.abs(parseFloat(totalDebit) - parseFloat(totalCredit)) > 0.01) {
      throw PostingError.unbalancedEntry(totalDebit, totalCredit);
    }

    // 6. GENERATE POSTING REFERENCE
    const sequenceResult = await this.sequence.nextSequence({
      type: 'JOURNAL',
      tenantId: input.tenantId,
      companyId: input.companyId,
      fiscalYear: input.entryDate.getFullYear(),
    });

    const postingReference = sequenceResult.formattedNumber;
    const postedAt = new Date();

    // 7. BEGIN TRANSACTION
    const txContext = await this.ledgerRepo.beginTransaction();

    try {
      // 8. INSERT LEDGER LINES
      const ledgerLines = await this.ledgerRepo.insertLines(
        input.lines.map((line, index) =>
          this.createLedgerLine(
            line,
            input,
            postingReference,
            postedAt,
            periodStatus.period!,
            index
          )
        ),
        txContext
      );

      // 9. UPDATE JOURNAL ENTRY → POSTED
      await this.journalEntryUpdate.updateToPosted(
        input.journalEntryId,
        input.tenantId,
        postingReference,
        actor.userId,
        postedAt,
        txContext
      );

      // 10. COMMIT
      await this.ledgerRepo.commitTransaction(txContext);

      // 11. EMIT AUDIT EVENT
      await this.audit.emit({
        eventType: 'finance.gl.journal.posted',
        aggregateId: input.journalEntryId,
        aggregateType: 'JournalEntry',
        tenantId: input.tenantId,
        userId: actor.userId,
        payload: {
          postingReference,
          totalDebit,
          totalCredit,
          lineCount: ledgerLines.length,
          entryType: input.entryType,
        },
      });

      return {
        success: true,
        postingReference,
        ledgerLineIds: ledgerLines.map((l) => l.id),
        totalDebit,
        totalCredit,
        postedAt,
      };
    } catch (error) {
      // ROLLBACK
      await this.ledgerRepo.rollbackTransaction(txContext);

      if (error instanceof PostingError) {
        throw error;
      }

      throw PostingError.transactionFailed(
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // POST SUBLEDGER ENTRY
  // ═══════════════════════════════════════════════════════════════════════════

  async postSubledgerEntry(
    input: PostSubledgerInput,
    actor: ActorContext
  ): Promise<PostingResult> {
    // 1. VALIDATE SOURCE TYPE
    const validSourceTypes: SourceType[] = [
      'ap_invoice',
      'ap_payment',
      'ar_invoice',
      'ar_receipt',
    ];
    if (!validSourceTypes.includes(input.sourceType)) {
      throw PostingError.invalidSourceType(input.sourceType);
    }

    // 2. IDEMPOTENCY CHECK
    const existing = await this.ledgerRepo.findBySourceId(
      input.sourceType,
      input.sourceId,
      input.tenantId
    );
    if (existing.length > 0) {
      return {
        success: true,
        postingReference: existing[0].postingReference,
        ledgerLineIds: existing.map((l) => l.id),
        totalDebit: this.sumDebits(existing),
        totalCredit: this.sumCredits(existing),
        postedAt: existing[0].postedAt,
      };
    }

    // 3. VALIDATE PERIOD
    const periodStatus = await this.fiscalTime.getPeriodStatus(
      input.postingDate,
      input.tenantId,
      input.companyId
    );

    if (!periodStatus.canPost) {
      throw PostingError.periodClosed(
        periodStatus.period?.periodId || 'unknown',
        periodStatus.status
      );
    }

    // 4. VALIDATE ACCOUNTS
    await this.validateAccounts(input.lines, input.tenantId, input.companyId);

    // 5. VALIDATE BALANCE
    const { totalDebit, totalCredit } = this.calculateTotals(input.lines);
    if (Math.abs(parseFloat(totalDebit) - parseFloat(totalCredit)) > 0.01) {
      throw PostingError.unbalancedEntry(totalDebit, totalCredit);
    }

    // 6. GENERATE POSTING REFERENCE
    const sequenceResult = await this.sequence.nextSequence({
      type: 'JOURNAL',
      tenantId: input.tenantId,
      companyId: input.companyId,
      fiscalYear: input.postingDate.getFullYear(),
    });

    const postingReference = sequenceResult.formattedNumber;
    const postedAt = new Date();

    // 7. BEGIN TRANSACTION
    const txContext = await this.ledgerRepo.beginTransaction();

    try {
      // 8. INSERT LEDGER LINES
      const ledgerLines = await this.ledgerRepo.insertLines(
        input.lines.map((line, index) =>
          this.createSubledgerLine(
            line,
            input,
            postingReference,
            postedAt,
            periodStatus.period!,
            index
          )
        ),
        txContext
      );

      // 9. COMMIT
      await this.ledgerRepo.commitTransaction(txContext);

      // 10. EMIT AUDIT EVENT
      await this.audit.emit({
        eventType: 'finance.gl.subledger.posted',
        aggregateId: input.sourceId,
        aggregateType: input.sourceType,
        tenantId: input.tenantId,
        userId: actor.userId,
        payload: {
          postingReference,
          sourceType: input.sourceType,
          totalDebit,
          totalCredit,
          lineCount: ledgerLines.length,
        },
      });

      return {
        success: true,
        postingReference,
        ledgerLineIds: ledgerLines.map((l) => l.id),
        totalDebit,
        totalCredit,
        postedAt,
      };
    } catch (error) {
      await this.ledgerRepo.rollbackTransaction(txContext);

      if (error instanceof PostingError) {
        throw error;
      }

      throw PostingError.transactionFailed(
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CREATE REVERSAL
  // ═══════════════════════════════════════════════════════════════════════════

  async createReversal(
    input: CreateReversalInput,
    actor: ActorContext
  ): Promise<ReversalResult> {
    // 1. FIND ORIGINAL POSTING
    const originalLines = await this.ledgerRepo.findByPostingReference(
      input.originalPostingReference,
      input.tenantId
    );

    if (originalLines.length === 0) {
      throw PostingError.postingNotFound(input.originalPostingReference);
    }

    // 2. CHECK IF ALREADY REVERSED
    if (originalLines[0].reversedByLineId) {
      throw PostingError.alreadyReversed(
        input.originalPostingReference,
        originalLines[0].reversedByLineId
      );
    }

    // 3. CHECK IF ORIGINAL IS A REVERSAL
    if (originalLines[0].isReversal) {
      throw PostingError.cannotReverseReversal(input.originalPostingReference);
    }

    // 4. VALIDATE PERIOD FOR REVERSAL DATE
    const periodStatus = await this.fiscalTime.getPeriodStatus(
      input.reversalDate,
      input.tenantId,
      input.companyId
    );

    if (!periodStatus.canPost) {
      throw PostingError.periodClosed(
        periodStatus.period?.periodId || 'unknown',
        periodStatus.status
      );
    }

    // 5. GENERATE REVERSAL REFERENCE
    const sequenceResult = await this.sequence.nextSequence({
      type: 'JOURNAL',
      tenantId: input.tenantId,
      companyId: input.companyId,
      fiscalYear: input.reversalDate.getFullYear(),
    });

    const reversalReference = sequenceResult.formattedNumber;
    const postedAt = new Date();

    // 6. BEGIN TRANSACTION
    const txContext = await this.ledgerRepo.beginTransaction();

    try {
      // 7. CREATE REVERSAL LINES (swap debits and credits)
      const reversalLines = await this.ledgerRepo.insertLines(
        originalLines.map((line) => ({
          tenantId: line.tenantId,
          companyId: line.companyId,
          postingReference: reversalReference,
          postingDate: input.reversalDate,
          postingTimestamp: postedAt,
          sourceType: line.sourceType,
          sourceId: line.sourceId,
          sourceLineId: line.sourceLineId,
          accountCode: line.accountCode,
          accountName: line.accountName,
          accountType: line.accountType,
          // SWAP debits and credits
          debitAmount: line.creditAmount,
          creditAmount: line.debitAmount,
          currency: line.currency,
          functionalAmount: line.functionalAmount,
          exchangeRate: line.exchangeRate,
          fiscalYear: input.reversalDate.getFullYear(),
          fiscalPeriod: periodStatus.period?.fiscalPeriod || 0,
          periodCode: periodStatus.period?.periodId || '',
          description: `Reversal of ${input.originalPostingReference}: ${input.reason}`,
          costCenter: line.costCenter,
          project: line.project,
          department: line.department,
          segment: line.segment,
          isReversal: true,
          reversesLineId: line.id,
          postedBy: input.reversedBy,
          postedAt,
        })),
        txContext
      );

      // 8. MARK ORIGINAL AS REVERSED
      await this.ledgerRepo.markAsReversed(
        originalLines.map((l) => l.id),
        reversalLines.map((l) => l.id),
        txContext
      );

      // 9. COMMIT
      await this.ledgerRepo.commitTransaction(txContext);

      // 10. EMIT AUDIT EVENT
      await this.audit.emit({
        eventType: 'finance.gl.reversal.created',
        aggregateId: input.originalPostingReference,
        aggregateType: 'Posting',
        tenantId: input.tenantId,
        userId: actor.userId,
        payload: {
          originalReference: input.originalPostingReference,
          reversalReference,
          reason: input.reason,
          lineCount: reversalLines.length,
        },
      });

      return {
        success: true,
        reversalReference,
        reversalLineIds: reversalLines.map((l) => l.id),
      };
    } catch (error) {
      await this.ledgerRepo.rollbackTransaction(txContext);

      if (error instanceof PostingError) {
        throw error;
      }

      throw PostingError.transactionFailed(
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GET POSTING BY SOURCE
  // ═══════════════════════════════════════════════════════════════════════════

  async getPostingBySourceId(
    sourceType: SourceType,
    sourceId: string,
    tenantId: string
  ): Promise<LedgerLine[] | null> {
    const lines = await this.ledgerRepo.findBySourceId(sourceType, sourceId, tenantId);
    return lines.length > 0 ? lines : null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  private getAllowedEntryTypes(periodStatus: string): string[] {
    switch (periodStatus) {
      case 'OPEN':
        return ['adjusting', 'accrual', 'reclassification', 'opening', 'closing', 'reversal', 'correction'];
      case 'SOFT_CLOSE':
        return ['adjusting', 'accrual'];
      case 'CONTROLLED_REOPEN':
        return ['correction'];
      default:
        return [];
    }
  }

  private async validateAccounts(
    lines: PostingLineInput[],
    tenantId: string,
    companyId: string
  ): Promise<void> {
    const accountCodes = [...new Set(lines.map((l) => l.accountCode))];
    const validations = await this.coa.validateAccountsBatch(accountCodes, tenantId, companyId);

    for (const [code, result] of validations) {
      if (!result.isValid) {
        switch (result.errorCode) {
          case 'ACCOUNT_NOT_FOUND':
            throw PostingError.accountNotFound(code);
          case 'ACCOUNT_INACTIVE':
            throw PostingError.accountNotActive(code, result.account?.status || 'unknown');
          case 'ACCOUNT_NOT_POSTABLE':
            throw PostingError.accountNotPostable(code);
          default:
            throw PostingError.accountNotFound(code);
        }
      }
    }
  }

  private calculateTotals(lines: PostingLineInput[]): { totalDebit: string; totalCredit: string } {
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of lines) {
      if (line.debitAmount) {
        totalDebit += parseFloat(line.debitAmount);
      }
      if (line.creditAmount) {
        totalCredit += parseFloat(line.creditAmount);
      }
    }

    return {
      totalDebit: totalDebit.toFixed(2),
      totalCredit: totalCredit.toFixed(2),
    };
  }

  private sumDebits(lines: LedgerLine[]): string {
    return lines
      .reduce((sum, l) => sum + parseFloat(l.debitAmount || '0'), 0)
      .toFixed(2);
  }

  private sumCredits(lines: LedgerLine[]): string {
    return lines
      .reduce((sum, l) => sum + parseFloat(l.creditAmount || '0'), 0)
      .toFixed(2);
  }

  private createLedgerLine(
    line: PostingLineInput,
    input: PostJournalEntryInput,
    postingReference: string,
    postedAt: Date,
    period: { periodId: string; fiscalYear?: number; fiscalPeriod?: number },
    _index: number
  ): Omit<LedgerLine, 'id'> {
    return {
      tenantId: input.tenantId,
      companyId: input.companyId,
      postingReference,
      postingDate: input.entryDate,
      postingTimestamp: postedAt,
      sourceType: 'journal_entry',
      sourceId: input.journalEntryId,
      sourceLineId: line.sourceLineId,
      accountCode: line.accountCode,
      accountName: '', // Will be enriched by COA lookup
      accountType: 'ASSET', // Will be enriched by COA lookup
      debitAmount: line.debitAmount,
      creditAmount: line.creditAmount,
      currency: line.currency,
      fiscalYear: period.fiscalYear || input.entryDate.getFullYear(),
      fiscalPeriod: period.fiscalPeriod || input.entryDate.getMonth() + 1,
      periodCode: period.periodId,
      description: line.description || input.description,
      costCenter: line.costCenter,
      project: line.project,
      department: line.department,
      segment: line.segment,
      isReversal: false,
      postedBy: input.postedBy,
      postedAt,
    };
  }

  private createSubledgerLine(
    line: PostingLineInput,
    input: PostSubledgerInput,
    postingReference: string,
    postedAt: Date,
    period: { periodId: string; fiscalYear?: number; fiscalPeriod?: number },
    _index: number
  ): Omit<LedgerLine, 'id'> {
    return {
      tenantId: input.tenantId,
      companyId: input.companyId,
      postingReference,
      postingDate: input.postingDate,
      postingTimestamp: postedAt,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      sourceLineId: line.sourceLineId,
      accountCode: line.accountCode,
      accountName: '',
      accountType: 'ASSET',
      debitAmount: line.debitAmount,
      creditAmount: line.creditAmount,
      currency: line.currency,
      fiscalYear: period.fiscalYear || input.postingDate.getFullYear(),
      fiscalPeriod: period.fiscalPeriod || input.postingDate.getMonth() + 1,
      periodCode: period.periodId,
      description: line.description || input.description,
      costCenter: line.costCenter,
      project: line.project,
      department: line.department,
      segment: line.segment,
      isReversal: false,
      postedBy: input.postedBy,
      postedAt,
    };
  }
}
