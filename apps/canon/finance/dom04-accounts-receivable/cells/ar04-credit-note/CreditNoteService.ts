/**
 * AR-04 Credit Note - Credit Note Service
 * 
 * Domain service for credit note management.
 * Implements business logic, state machine, SoD enforcement, and GL posting.
 * 
 * @module AR-04
 */

import {
  CreditNote,
  CreditNoteLine,
  CreditNoteApplication,
  CreditNoteRepositoryPort,
  CreateCreditNoteData,
  CreditNoteFilter,
  CreditNoteStatus,
  CreditNoteReason,
} from '@aibos/kernel-core';
import { CreditNoteCellError, CreditNoteErrorCode } from './errors';

// =============================================================================
// Types
// =============================================================================

export interface ActorContext {
  tenantId: string;
  userId: string;
  permissions?: string[];
}

export interface SequencePort {
  nextSequence(tenantId: string, sequenceType: string): Promise<string>;
}

export interface AuditOutboxPort {
  writeEvent(
    tenantId: string,
    eventType: string,
    aggregateId: string,
    aggregateType: string,
    payload: Record<string, unknown>
  ): Promise<void>;
}

export interface CustomerPort {
  getById(
    id: string,
    tenantId: string
  ): Promise<{ id: string; status: string } | null>;
}

export interface InvoicePort {
  getById(
    id: string,
    tenantId: string
  ): Promise<{
    id: string;
    invoiceNumber: string;
    status: string;
    outstandingAmount: number;
  } | null>;
  reduceOutstanding(id: string, tenantId: string, amount: number): Promise<void>;
}

export interface FiscalTimePort {
  isOpen(tenantId: string, date: Date): Promise<boolean>;
}

export interface GLPostingPort {
  post(
    tenantId: string,
    journalLines: Array<{
      accountId: string;
      debit: number;
      credit: number;
      description: string;
    }>,
    reference: string,
    postingDate: Date
  ): Promise<{ journalHeaderId: string }>;
}

// =============================================================================
// State Machine
// =============================================================================

const VALID_TRANSITIONS: Record<CreditNoteStatus, CreditNoteStatus[]> = {
  draft: ['submitted'],
  submitted: ['approved', 'draft'], // reject → draft
  approved: ['posted', 'voided'],
  posted: ['applied'],
  applied: [], // Terminal state - no transitions allowed
  voided: [], // Terminal state - no transitions allowed
};

function canTransition(from: CreditNoteStatus, to: CreditNoteStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// =============================================================================
// Service Implementation
// =============================================================================

export class CreditNoteService {
  constructor(
    private readonly creditNoteRepo: CreditNoteRepositoryPort,
    private readonly sequencePort: SequencePort,
    private readonly auditPort: AuditOutboxPort,
    private readonly customerPort: CustomerPort,
    private readonly invoicePort: InvoicePort,
    private readonly fiscalTimePort: FiscalTimePort,
    private readonly glPostingPort: GLPostingPort
  ) {}

  // ---------------------------------------------------------------------------
  // Create Credit Note (draft)
  // ---------------------------------------------------------------------------

  async create(
    input: {
      customerId: string;
      originalInvoiceId?: string;
      creditNoteDate: Date;
      reason: CreditNoteReason;
      reasonDescription?: string;
      notes?: string;
    },
    actor: ActorContext
  ): Promise<CreditNote> {
    // Validate customer exists and is approved
    const customer = await this.customerPort.getById(
      input.customerId,
      actor.tenantId
    );
    if (!customer) {
      throw new CreditNoteCellError(
        CreditNoteErrorCode.CUSTOMER_NOT_FOUND,
        'Customer not found',
        { customerId: input.customerId }
      );
    }
    if (customer.status !== 'approved') {
      throw new CreditNoteCellError(
        CreditNoteErrorCode.CUSTOMER_NOT_APPROVED,
        'Customer must be approved',
        { customerId: input.customerId, status: customer.status }
      );
    }

    // Validate original invoice if provided
    if (input.originalInvoiceId) {
      const invoice = await this.invoicePort.getById(
        input.originalInvoiceId,
        actor.tenantId
      );
      if (!invoice) {
        throw new CreditNoteCellError(
          CreditNoteErrorCode.INVOICE_NOT_FOUND,
          'Original invoice not found',
          { invoiceId: input.originalInvoiceId }
        );
      }
    }

    // Generate credit note number
    const creditNoteNumber = await this.sequencePort.nextSequence(
      actor.tenantId,
      'CREDIT_NOTE'
    );

    // Create credit note
    const createData: CreateCreditNoteData = {
      tenantId: actor.tenantId,
      customerId: input.customerId,
      originalInvoiceId: input.originalInvoiceId,
      creditNoteDate: input.creditNoteDate,
      reason: input.reason,
      reasonDescription: input.reasonDescription,
      notes: input.notes,
      createdBy: actor.userId,
    };

    const creditNote = await this.creditNoteRepo.create(
      createData,
      creditNoteNumber
    );

    // Emit audit event
    await this.auditPort.writeEvent(
      actor.tenantId,
      'CREDIT_NOTE_CREATED',
      creditNote.id,
      'CreditNote',
      {
        creditNoteNumber,
        customerId: input.customerId,
        reason: input.reason,
        createdBy: actor.userId,
      }
    );

    return creditNote;
  }

  // ---------------------------------------------------------------------------
  // Get Credit Note
  // ---------------------------------------------------------------------------

  async getById(id: string, actor: ActorContext): Promise<CreditNote | null> {
    return this.creditNoteRepo.getById(id, actor.tenantId);
  }

  // ---------------------------------------------------------------------------
  // List Credit Notes
  // ---------------------------------------------------------------------------

  async list(
    filter: CreditNoteFilter,
    actor: ActorContext
  ): Promise<{ data: CreditNote[]; total: number }> {
    return this.creditNoteRepo.list(actor.tenantId, filter);
  }

  // ---------------------------------------------------------------------------
  // Add Line
  // ---------------------------------------------------------------------------

  async addLine(
    creditNoteId: string,
    input: {
      description: string;
      quantity: number;
      unitPrice: number;
      taxRate: number;
      revenueAccountId: string;
    },
    actor: ActorContext
  ): Promise<CreditNoteLine> {
    const creditNote = await this.getOrThrow(creditNoteId, actor);

    // Can only add lines in draft status
    if (creditNote.status !== 'draft') {
      throw new CreditNoteCellError(
        CreditNoteErrorCode.INVALID_STATE,
        `Cannot add lines to credit note in ${creditNote.status} status`,
        { creditNoteId, currentStatus: creditNote.status }
      );
    }

    // Get next line number
    const existingLines = await this.creditNoteRepo.getLines(
      creditNoteId,
      actor.tenantId
    );
    const lineNumber = existingLines.length + 1;

    const line = await this.creditNoteRepo.createLine({
      creditNoteId,
      tenantId: actor.tenantId,
      lineNumber,
      description: input.description,
      quantity: input.quantity,
      unitPrice: input.unitPrice,
      taxRate: input.taxRate,
      revenueAccountId: input.revenueAccountId,
      taxAmount: 0, // Will be calculated
      lineTotal: 0, // Will be calculated
    });

    // Recalculate credit note totals
    await this.creditNoteRepo.recalculateTotals(creditNoteId, actor.tenantId);

    // Emit audit event
    await this.auditPort.writeEvent(
      actor.tenantId,
      'CREDIT_NOTE_LINE_ADDED',
      creditNoteId,
      'CreditNote',
      {
        creditNoteNumber: creditNote.creditNoteNumber,
        lineId: line.id,
        description: input.description,
        addedBy: actor.userId,
      }
    );

    return line;
  }

  // ---------------------------------------------------------------------------
  // Get Lines
  // ---------------------------------------------------------------------------

  async getLines(
    creditNoteId: string,
    actor: ActorContext
  ): Promise<CreditNoteLine[]> {
    await this.getOrThrow(creditNoteId, actor);
    return this.creditNoteRepo.getLines(creditNoteId, actor.tenantId);
  }

  // ---------------------------------------------------------------------------
  // Delete Line
  // ---------------------------------------------------------------------------

  async deleteLine(
    creditNoteId: string,
    lineId: string,
    actor: ActorContext
  ): Promise<void> {
    const creditNote = await this.getOrThrow(creditNoteId, actor);

    // Can only delete lines in draft status
    if (creditNote.status !== 'draft') {
      throw new CreditNoteCellError(
        CreditNoteErrorCode.INVALID_STATE,
        `Cannot delete lines from credit note in ${creditNote.status} status`,
        { creditNoteId, currentStatus: creditNote.status }
      );
    }

    const deleted = await this.creditNoteRepo.deleteLine(lineId, actor.tenantId);
    if (!deleted) {
      throw new CreditNoteCellError(
        CreditNoteErrorCode.LINE_NOT_FOUND,
        'Credit note line not found',
        { lineId }
      );
    }

    // Recalculate credit note totals
    await this.creditNoteRepo.recalculateTotals(creditNoteId, actor.tenantId);

    // Emit audit event
    await this.auditPort.writeEvent(
      actor.tenantId,
      'CREDIT_NOTE_LINE_DELETED',
      creditNoteId,
      'CreditNote',
      {
        creditNoteNumber: creditNote.creditNoteNumber,
        lineId,
        deletedBy: actor.userId,
      }
    );
  }

  // ---------------------------------------------------------------------------
  // Submit for Approval
  // ---------------------------------------------------------------------------

  async submit(
    id: string,
    input: { version: number },
    actor: ActorContext
  ): Promise<CreditNote> {
    const creditNote = await this.getOrThrow(id, actor);

    if (!canTransition(creditNote.status, 'submitted')) {
      throw new CreditNoteCellError(
        CreditNoteErrorCode.INVALID_STATE_TRANSITION,
        `Cannot submit credit note from ${creditNote.status} status`,
        { creditNoteId: id, currentStatus: creditNote.status, targetStatus: 'submitted' }
      );
    }

    // Validate has lines
    const lines = await this.creditNoteRepo.getLines(id, actor.tenantId);
    if (lines.length === 0) {
      throw new CreditNoteCellError(
        CreditNoteErrorCode.NO_LINES,
        'Credit note must have at least one line',
        { creditNoteId: id }
      );
    }

    const updated = await this.creditNoteRepo.update(
      id,
      actor.tenantId,
      { status: 'submitted' },
      input.version
    );

    if (!updated) {
      throw new CreditNoteCellError(
        CreditNoteErrorCode.VERSION_CONFLICT,
        'Credit note was modified by another user. Please refresh and try again.',
        { creditNoteId: id, expectedVersion: input.version }
      );
    }

    // Emit audit event
    await this.auditPort.writeEvent(
      actor.tenantId,
      'CREDIT_NOTE_SUBMITTED',
      id,
      'CreditNote',
      {
        creditNoteNumber: creditNote.creditNoteNumber,
        submittedBy: actor.userId,
      }
    );

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Approve Credit Note (SoD: approver ≠ creator)
  // ---------------------------------------------------------------------------

  async approve(
    id: string,
    input: { version: number; comments?: string },
    actor: ActorContext
  ): Promise<CreditNote> {
    const creditNote = await this.getOrThrow(id, actor);

    // Validate state transition
    if (!canTransition(creditNote.status, 'approved')) {
      throw new CreditNoteCellError(
        CreditNoteErrorCode.INVALID_STATE_TRANSITION,
        `Cannot approve credit note from ${creditNote.status} status`,
        { creditNoteId: id, currentStatus: creditNote.status, targetStatus: 'approved' }
      );
    }

    // Enforce SoD: approver ≠ creator
    if (creditNote.createdBy === actor.userId) {
      throw new CreditNoteCellError(
        CreditNoteErrorCode.SOD_VIOLATION,
        'Cannot approve your own credit note (Segregation of Duties)',
        { creditNoteId: id, createdBy: creditNote.createdBy, approverId: actor.userId }
      );
    }

    const updated = await this.creditNoteRepo.update(
      id,
      actor.tenantId,
      {
        status: 'approved',
        approvedBy: actor.userId,
        approvedAt: new Date(),
      },
      input.version
    );

    if (!updated) {
      throw new CreditNoteCellError(
        CreditNoteErrorCode.VERSION_CONFLICT,
        'Credit note was modified by another user. Please refresh and try again.',
        { creditNoteId: id, expectedVersion: input.version }
      );
    }

    // Emit audit event
    await this.auditPort.writeEvent(
      actor.tenantId,
      'CREDIT_NOTE_APPROVED',
      id,
      'CreditNote',
      {
        creditNoteNumber: creditNote.creditNoteNumber,
        approvedBy: actor.userId,
        comments: input.comments,
      }
    );

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Reject Credit Note (SoD: rejector ≠ creator)
  // ---------------------------------------------------------------------------

  async reject(
    id: string,
    input: { version: number; reason: string },
    actor: ActorContext
  ): Promise<CreditNote> {
    const creditNote = await this.getOrThrow(id, actor);

    if (creditNote.status !== 'submitted') {
      throw new CreditNoteCellError(
        CreditNoteErrorCode.INVALID_STATE_TRANSITION,
        `Cannot reject credit note from ${creditNote.status} status`,
        { creditNoteId: id, currentStatus: creditNote.status, targetStatus: 'draft' }
      );
    }

    // Enforce SoD: rejector ≠ creator
    if (creditNote.createdBy === actor.userId) {
      throw new CreditNoteCellError(
        CreditNoteErrorCode.SOD_VIOLATION,
        'Cannot reject your own credit note (Segregation of Duties)',
        { creditNoteId: id, createdBy: creditNote.createdBy, rejectorId: actor.userId }
      );
    }

    const updated = await this.creditNoteRepo.update(
      id,
      actor.tenantId,
      { status: 'draft' },
      input.version
    );

    if (!updated) {
      throw new CreditNoteCellError(
        CreditNoteErrorCode.VERSION_CONFLICT,
        'Credit note was modified by another user. Please refresh and try again.',
        { creditNoteId: id, expectedVersion: input.version }
      );
    }

    // Emit audit event
    await this.auditPort.writeEvent(
      actor.tenantId,
      'CREDIT_NOTE_REJECTED',
      id,
      'CreditNote',
      {
        creditNoteNumber: creditNote.creditNoteNumber,
        rejectedBy: actor.userId,
        reason: input.reason,
      }
    );

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Post to GL (Idempotent)
  // ---------------------------------------------------------------------------

  async post(
    id: string,
    input: { version: number; idempotencyKey: string },
    actor: ActorContext
  ): Promise<CreditNote> {
    const creditNote = await this.getOrThrow(id, actor);

    // Validate state transition
    if (!canTransition(creditNote.status, 'posted')) {
      throw new CreditNoteCellError(
        CreditNoteErrorCode.INVALID_STATE_TRANSITION,
        `Cannot post credit note from ${creditNote.status} status`,
        { creditNoteId: id, currentStatus: creditNote.status, targetStatus: 'posted' }
      );
    }

    // Check idempotency - prevent double posting
    if (creditNote.postingIdempotencyKey === input.idempotencyKey) {
      throw new CreditNoteCellError(
        CreditNoteErrorCode.ALREADY_POSTED,
        'Credit note already posted with this idempotency key',
        { creditNoteId: id, idempotencyKey: input.idempotencyKey }
      );
    }

    // Check fiscal period is open
    const isOpen = await this.fiscalTimePort.isOpen(
      actor.tenantId,
      creditNote.creditNoteDate
    );
    if (!isOpen) {
      throw new CreditNoteCellError(
        CreditNoteErrorCode.PERIOD_CLOSED,
        'Cannot post to closed period',
        { creditNoteId: id }
      );
    }

    // Get lines for GL posting
    const lines = await this.creditNoteRepo.getLines(id, actor.tenantId);

    // Build journal lines (Dr Revenue / Cr AR)
    const journalLines = [
      {
        accountId: 'AR_CONTROL',
        debit: 0,
        credit: creditNote.totalAmount,
        description: `Credit Note ${creditNote.creditNoteNumber}`,
      },
    ];

    for (const line of lines) {
      journalLines.push({
        accountId: line.revenueAccountId,
        debit: line.lineTotal - line.taxAmount,
        credit: 0,
        description: `Revenue reversal: ${line.description}`,
      });
    }

    // Post to GL
    const { journalHeaderId } = await this.glPostingPort.post(
      actor.tenantId,
      journalLines,
      `CN-${creditNote.creditNoteNumber}`,
      creditNote.creditNoteDate
    );

    // Update credit note with posting info
    const updated = await this.creditNoteRepo.update(
      id,
      actor.tenantId,
      {
        status: 'posted',
        postingIdempotencyKey: input.idempotencyKey,
        journalHeaderId,
        postedAt: new Date(),
        postedBy: actor.userId,
      },
      input.version
    );

    if (!updated) {
      throw new CreditNoteCellError(
        CreditNoteErrorCode.VERSION_CONFLICT,
        'Credit note was modified by another user. Please refresh and try again.',
        { creditNoteId: id, expectedVersion: input.version }
      );
    }

    // Emit audit event
    await this.auditPort.writeEvent(
      actor.tenantId,
      'CREDIT_NOTE_POSTED',
      id,
      'CreditNote',
      {
        creditNoteNumber: creditNote.creditNoteNumber,
        journalHeaderId,
        totalAmount: creditNote.totalAmount,
        postedBy: actor.userId,
      }
    );

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Void Credit Note
  // ---------------------------------------------------------------------------

  async void(
    id: string,
    input: { version: number; reason: string },
    actor: ActorContext
  ): Promise<CreditNote> {
    const creditNote = await this.getOrThrow(id, actor);

    // Validate state transition
    if (!canTransition(creditNote.status, 'voided')) {
      throw new CreditNoteCellError(
        CreditNoteErrorCode.INVALID_STATE_TRANSITION,
        `Cannot void credit note from ${creditNote.status} status`,
        { creditNoteId: id, currentStatus: creditNote.status, targetStatus: 'voided' }
      );
    }

    const updated = await this.creditNoteRepo.update(
      id,
      actor.tenantId,
      { status: 'voided' },
      input.version
    );

    if (!updated) {
      throw new CreditNoteCellError(
        CreditNoteErrorCode.VERSION_CONFLICT,
        'Credit note was modified by another user. Please refresh and try again.',
        { creditNoteId: id, expectedVersion: input.version }
      );
    }

    // Emit audit event
    await this.auditPort.writeEvent(
      actor.tenantId,
      'CREDIT_NOTE_VOIDED',
      id,
      'CreditNote',
      {
        creditNoteNumber: creditNote.creditNoteNumber,
        voidedBy: actor.userId,
        reason: input.reason,
      }
    );

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Apply to Invoice
  // ---------------------------------------------------------------------------

  async applyToInvoice(
    creditNoteId: string,
    input: { invoiceId: string; amount: number },
    actor: ActorContext
  ): Promise<CreditNoteApplication> {
    const creditNote = await this.getOrThrow(creditNoteId, actor);

    // Credit note must be posted
    if (creditNote.status !== 'posted') {
      throw new CreditNoteCellError(
        CreditNoteErrorCode.INVALID_STATE,
        'Credit note must be posted to apply',
        { creditNoteId, currentStatus: creditNote.status }
      );
    }

    // Check sufficient unapplied amount
    if (input.amount > creditNote.unappliedAmount) {
      throw new CreditNoteCellError(
        CreditNoteErrorCode.INSUFFICIENT_UNAPPLIED,
        'Insufficient unapplied amount',
        {
          creditNoteId,
          available: creditNote.unappliedAmount,
          requested: input.amount,
        }
      );
    }

    // Validate invoice exists
    const invoice = await this.invoicePort.getById(
      input.invoiceId,
      actor.tenantId
    );
    if (!invoice) {
      throw new CreditNoteCellError(
        CreditNoteErrorCode.INVOICE_NOT_FOUND,
        'Invoice not found',
        { invoiceId: input.invoiceId }
      );
    }

    // Cannot over-apply to invoice
    if (input.amount > invoice.outstandingAmount) {
      throw new CreditNoteCellError(
        CreditNoteErrorCode.OVER_APPLICATION,
        'Amount exceeds invoice outstanding balance',
        {
          invoiceId: input.invoiceId,
          outstandingAmount: invoice.outstandingAmount,
          requestedAmount: input.amount,
        }
      );
    }

    // Create application
    const application = await this.creditNoteRepo.createApplication(
      creditNoteId,
      input.invoiceId,
      actor.tenantId,
      input.amount,
      actor.userId
    );

    // Reduce invoice outstanding
    await this.invoicePort.reduceOutstanding(
      input.invoiceId,
      actor.tenantId,
      input.amount
    );

    // Emit audit event
    await this.auditPort.writeEvent(
      actor.tenantId,
      'CREDIT_NOTE_APPLIED',
      creditNoteId,
      'CreditNote',
      {
        creditNoteNumber: creditNote.creditNoteNumber,
        invoiceId: input.invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        amount: input.amount,
        appliedBy: actor.userId,
      }
    );

    return application;
  }

  // ---------------------------------------------------------------------------
  // Get Applications
  // ---------------------------------------------------------------------------

  async getApplications(
    creditNoteId: string,
    actor: ActorContext
  ): Promise<CreditNoteApplication[]> {
    await this.getOrThrow(creditNoteId, actor);
    return this.creditNoteRepo.getApplications(creditNoteId, actor.tenantId);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async getOrThrow(id: string, actor: ActorContext): Promise<CreditNote> {
    const creditNote = await this.creditNoteRepo.getById(id, actor.tenantId);
    if (!creditNote) {
      throw new CreditNoteCellError(
        CreditNoteErrorCode.CREDIT_NOTE_NOT_FOUND,
        `Credit note not found: ${id}`,
        { creditNoteId: id }
      );
    }
    return creditNote;
  }
}
