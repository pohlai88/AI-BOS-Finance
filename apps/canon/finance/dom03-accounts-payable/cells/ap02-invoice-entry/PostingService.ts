/**
 * Posting Service
 * 
 * AP-02 Invoice Entry Cell - GL posting orchestration.
 * 
 * Responsibilities:
 * - Validate period is open (K_TIME)
 * - Validate account codes (K_COA)
 * - Generate deterministic journal lines
 * - Post to GL-03 (blocking call)
 * - Record GL posting reference
 * - Emit transactional audit events
 */

import type {
  InvoiceRepositoryPort,
  Invoice,
  InvoiceLine,
  InvoiceTransactionContext,
  AuditPort,
  AuditEvent,
  FiscalTimePort,
  GLPostingPort,
  JournalLine,
} from '@aibos/kernel-core';
import type { ActorContext } from '@aibos/canon-governance';
import { InvoiceStateMachine } from './InvoiceStateMachine';
import {
  InvoiceNotFoundError,
  InvalidInvoiceStatusError,
  InvoiceConcurrencyError,
  PeriodClosedError,
  InvalidAccountCodeError,
  GLPostingError,
  InvoiceLinesRequiredError,
} from './errors';

// ============================================================================
// 1. TYPES
// ============================================================================

/**
 * Chart of Accounts validation port
 */
export interface COAValidationPort {
  isValidAccountCode(accountCode: string, tenantId: string): Promise<boolean>;
  getAccountDetails(accountCode: string, tenantId: string): Promise<{ 
    code: string; 
    name: string; 
    type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  } | null>;
}

/**
 * Journal entry input for GL-03
 */
export interface PostingInput {
  tenantId: string;
  companyId: string;
  postingDate: Date;
  reference: string;
  description: string;
  sourceDocument: {
    type: 'invoice';
    id: string;
    number: string;
  };
  lines: JournalLineInput[];
  postedBy: string;
}

/**
 * Journal line input
 */
export interface JournalLineInput {
  accountCode: string;
  debitCents: number;
  creditCents: number;
  description: string;
  costCenter?: string;
  projectCode?: string;
}

/**
 * Posting result from GL-03
 */
export interface PostingResult {
  success: boolean;
  journalHeaderId?: string;
  journalNumber?: string;
  error?: string;
}

// ============================================================================
// 2. SERVICE
// ============================================================================

/**
 * PostingService - Orchestrates GL posting for invoices
 */
export class PostingService {
  constructor(
    private invoiceRepo: InvoiceRepositoryPort,
    private glPostingPort: GLPostingPort,
    private fiscalTimePort: FiscalTimePort,
    private coaPort: COAValidationPort,
    private auditPort: AuditPort
  ) {}

  /**
   * Post an approved invoice to GL
   * 
   * @param invoiceId - Invoice ID
   * @param actor - Who is posting
   * @param expectedVersion - Expected version (optimistic locking)
   * @returns Updated invoice with GL reference
   */
  async postToGL(
    invoiceId: string,
    actor: ActorContext,
    expectedVersion: number
  ): Promise<Invoice> {
    return this.invoiceRepo.withTransaction(async (txContext) => {
      // 1. Fetch invoice with lines
      const invoice = await this.invoiceRepo.findByIdForUpdate(
        invoiceId,
        actor.tenantId,
        txContext
      );

      if (!invoice) {
        throw new InvoiceNotFoundError(invoiceId);
      }

      // 2. Version check
      if (invoice.version !== expectedVersion) {
        throw new InvoiceConcurrencyError(expectedVersion, invoice.version);
      }

      // 3. State machine check - must be approved
      if (!InvoiceStateMachine.canPostToGL(invoice.status)) {
        throw new InvalidInvoiceStatusError(invoice.status, 'post to GL');
      }

      // 4. Fetch invoice lines
      const lines = await this.invoiceRepo.listLines(invoiceId, actor.tenantId);
      if (lines.length === 0) {
        throw new InvoiceLinesRequiredError();
      }

      // 5. Validate period is open (K_TIME)
      const isPeriodOpen = await this.fiscalTimePort.isPeriodOpen(
        invoice.invoiceDate,
        actor.tenantId
      );
      if (!isPeriodOpen) {
        throw new PeriodClosedError(
          invoice.invoiceDate.toISOString().split('T')[0],
          invoice.invoiceDate.toISOString().split('T')[0]
        );
      }

      // 6. Validate account codes (K_COA)
      await this.validateAccountCodes(lines, actor.tenantId);

      // 7. Generate journal lines (deterministic)
      const journalLines = this.generateJournalLines(invoice, lines);

      // 8. Post to GL-03 (BLOCKING)
      const postingInput: PostingInput = {
        tenantId: actor.tenantId,
        companyId: invoice.companyId,
        postingDate: invoice.invoiceDate,
        reference: invoice.invoiceNumber,
        description: `AP Invoice ${invoice.invoiceNumber}`,
        sourceDocument: {
          type: 'invoice',
          id: invoice.id,
          number: invoice.invoiceNumber,
        },
        lines: journalLines,
        postedBy: actor.userId,
      };

      const postingResult = await this.glPostingPort.postJournal(postingInput);

      if (!postingResult.success || !postingResult.journalHeaderId) {
        throw new GLPostingError(postingResult.error || 'Unknown GL posting error');
      }

      // 9. Update invoice status and record GL reference
      const updated = await this.invoiceRepo.recordGLPosting(
        invoiceId,
        postingResult.journalHeaderId,
        actor.userId,
        actor.tenantId,
        txContext
      );

      // 10. Emit audit event
      const auditEvent: AuditEvent = {
        eventType: 'finance.ap.invoice.posted',
        entityId: invoice.id,
        entityUrn: `urn:finance:invoice:${invoice.id}`,
        actor: {
          userId: actor.userId,
          tenantId: actor.tenantId,
        },
        action: 'post',
        payload: {
          invoiceNumber: invoice.invoiceNumber,
          totalAmountCents: invoice.totalAmountCents,
          journalHeaderId: postingResult.journalHeaderId,
          journalNumber: postingResult.journalNumber,
          fromStatus: invoice.status,
          toStatus: 'posted',
          lineCount: journalLines.length,
        },
        correlationId: txContext.correlationId,
        timestamp: new Date(),
      };

      await this.auditPort.emitTransactional(auditEvent, txContext);

      return updated;
    });
  }

  /**
   * Validate period is open for posting
   * 
   * @param invoiceDate - Invoice date
   * @param tenantId - Tenant ID
   * @returns true if period is open
   */
  async validatePeriodOpen(invoiceDate: Date, tenantId: string): Promise<boolean> {
    return this.fiscalTimePort.isPeriodOpen(invoiceDate, tenantId);
  }

  /**
   * Validate all account codes in invoice lines
   * 
   * @param lines - Invoice lines
   * @param tenantId - Tenant ID
   * @throws InvalidAccountCodeError if any account code is invalid
   */
  private async validateAccountCodes(
    lines: InvoiceLine[],
    tenantId: string
  ): Promise<void> {
    // Collect unique account codes
    const accountCodes = new Set<string>();
    for (const line of lines) {
      accountCodes.add(line.debitAccountCode);
      accountCodes.add(line.creditAccountCode);
    }

    // Validate each account code
    for (const accountCode of accountCodes) {
      const isValid = await this.coaPort.isValidAccountCode(accountCode, tenantId);
      if (!isValid) {
        throw new InvalidAccountCodeError(accountCode, 'Account code not found in Chart of Accounts');
      }
    }
  }

  /**
   * Generate journal lines from invoice lines (deterministic)
   * 
   * Double-entry accounting:
   * - Debit: Expense/Asset accounts (from invoice lines)
   * - Credit: AP Payable account (from invoice lines)
   * 
   * @param invoice - Invoice header
   * @param lines - Invoice lines
   * @returns Journal lines for GL posting
   */
  private generateJournalLines(
    invoice: Invoice,
    lines: InvoiceLine[]
  ): JournalLineInput[] {
    const journalLines: JournalLineInput[] = [];

    // Group lines by credit account (AP Payable)
    const creditTotals = new Map<string, number>();

    for (const line of lines) {
      // Debit entry (Expense/Asset)
      journalLines.push({
        accountCode: line.debitAccountCode,
        debitCents: line.lineAmountCents,
        creditCents: 0,
        description: line.description,
        costCenter: line.costCenter,
        projectCode: line.projectCode,
      });

      // Accumulate credit to AP Payable
      const currentCredit = creditTotals.get(line.creditAccountCode) || 0;
      creditTotals.set(line.creditAccountCode, currentCredit + line.lineAmountCents);
    }

    // Add tax line if applicable
    if (invoice.taxAmountCents > 0) {
      // Debit: Tax expense
      journalLines.push({
        accountCode: '6100', // Tax expense account (configurable)
        debitCents: invoice.taxAmountCents,
        creditCents: 0,
        description: `Tax on Invoice ${invoice.invoiceNumber}`,
      });

      // Add tax to AP Payable
      const defaultAPAccount = '2000';
      const currentCredit = creditTotals.get(defaultAPAccount) || 0;
      creditTotals.set(defaultAPAccount, currentCredit + invoice.taxAmountCents);
    }

    // Credit entries (AP Payable)
    for (const [accountCode, totalCents] of creditTotals) {
      journalLines.push({
        accountCode,
        debitCents: 0,
        creditCents: totalCents,
        description: `AP Payable - Invoice ${invoice.invoiceNumber}`,
      });
    }

    return journalLines;
  }

  /**
   * Create a reversal journal for voided invoice
   * 
   * @param invoiceId - Invoice ID
   * @param reason - Reason for reversal
   * @param actor - Who is reversing
   * @returns Reversal journal header ID
   */
  async createReversalJournal(
    invoiceId: string,
    reason: string,
    actor: ActorContext
  ): Promise<string> {
    return this.invoiceRepo.withTransaction(async (txContext) => {
      // 1. Fetch invoice with lines
      const invoice = await this.invoiceRepo.findById(invoiceId, actor.tenantId);
      if (!invoice) {
        throw new InvoiceNotFoundError(invoiceId);
      }

      // 2. Ensure invoice was posted
      if (!invoice.journalHeaderId) {
        throw new GLPostingError('Invoice was not posted to GL');
      }

      // 3. Fetch invoice lines
      const lines = await this.invoiceRepo.listLines(invoiceId, actor.tenantId);

      // 4. Generate reversal journal lines (swap debits and credits)
      const reversalLines = this.generateReversalJournalLines(invoice, lines);

      // 5. Post reversal to GL-03
      const postingInput: PostingInput = {
        tenantId: actor.tenantId,
        companyId: invoice.companyId,
        postingDate: new Date(), // Reversal date is today
        reference: `REV-${invoice.invoiceNumber}`,
        description: `Reversal: ${reason}`,
        sourceDocument: {
          type: 'invoice',
          id: invoice.id,
          number: invoice.invoiceNumber,
        },
        lines: reversalLines,
        postedBy: actor.userId,
      };

      const postingResult = await this.glPostingPort.postJournal(postingInput);

      if (!postingResult.success || !postingResult.journalHeaderId) {
        throw new GLPostingError(postingResult.error || 'Unknown GL posting error');
      }

      // 6. Emit audit event
      const auditEvent: AuditEvent = {
        eventType: 'finance.ap.invoice.reversed',
        entityId: invoice.id,
        entityUrn: `urn:finance:invoice:${invoice.id}`,
        actor: {
          userId: actor.userId,
          tenantId: actor.tenantId,
        },
        action: 'reverse',
        payload: {
          invoiceNumber: invoice.invoiceNumber,
          totalAmountCents: invoice.totalAmountCents,
          originalJournalHeaderId: invoice.journalHeaderId,
          reversalJournalHeaderId: postingResult.journalHeaderId,
          reason,
        },
        correlationId: txContext.correlationId,
        timestamp: new Date(),
      };

      await this.auditPort.emitTransactional(auditEvent, txContext);

      return postingResult.journalHeaderId;
    });
  }

  /**
   * Generate reversal journal lines (swap debits and credits)
   */
  private generateReversalJournalLines(
    invoice: Invoice,
    lines: InvoiceLine[]
  ): JournalLineInput[] {
    // Generate original lines
    const originalLines = this.generateJournalLines(invoice, lines);

    // Swap debits and credits for reversal
    return originalLines.map(line => ({
      ...line,
      debitCents: line.creditCents,
      creditCents: line.debitCents,
      description: `Reversal: ${line.description}`,
    }));
  }
}
