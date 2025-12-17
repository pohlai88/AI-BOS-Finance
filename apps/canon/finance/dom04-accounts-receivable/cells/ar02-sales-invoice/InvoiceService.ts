/**
 * AR-02 Sales Invoice - Invoice Service
 * 
 * Domain service for sales invoice management.
 * Implements business logic, state machine, SoD enforcement, and GL posting.
 * 
 * @module AR-02
 */

import {
  Invoice,
  InvoiceLine,
  InvoiceRepositoryPort,
  InvoiceFilter,
  CreateInvoiceData,
  UpdateInvoiceData,
  CreateInvoiceLineData,
  InvoiceStatus,
  DiscountType,
  PaymentTerms,
} from '@aibos/kernel-core';
import { InvoiceCellError, InvoiceErrorCode } from './errors';

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
  ): Promise<{
    id: string;
    status: string;
    creditLimit: number;
    currentBalance: number;
  } | null>;
}

export interface FiscalTimePort {
  isOpen(tenantId: string, date: Date): Promise<boolean>;
  getCurrentPeriod(tenantId: string): Promise<string>;
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

const VALID_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  draft: ['submitted'],
  submitted: ['approved', 'draft'], // reject → draft
  approved: ['posted', 'voided'],
  posted: ['paid', 'voided'],
  paid: ['closed'],
  closed: [], // Terminal state - no transitions allowed
  voided: [], // Terminal state - no transitions allowed
};

function canTransition(from: InvoiceStatus, to: InvoiceStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// =============================================================================
// Service Implementation
// =============================================================================

export class InvoiceService {
  constructor(
    private readonly invoiceRepo: InvoiceRepositoryPort,
    private readonly sequencePort: SequencePort,
    private readonly auditPort: AuditOutboxPort,
    private readonly customerPort: CustomerPort,
    private readonly fiscalTimePort: FiscalTimePort,
    private readonly glPostingPort: GLPostingPort
  ) {}

  // ---------------------------------------------------------------------------
  // Create Invoice (draft)
  // ---------------------------------------------------------------------------

  async create(
    input: {
      customerId: string;
      invoiceDate: Date;
      dueDate: Date;
      currency?: string;
      paymentTerms?: PaymentTerms;
      discountType?: DiscountType;
      discountValue?: number;
      notes?: string;
      internalNotes?: string;
    },
    actor: ActorContext
  ): Promise<Invoice> {
    // Validate customer exists and is approved
    const customer = await this.customerPort.getById(
      input.customerId,
      actor.tenantId
    );
    if (!customer) {
      throw new InvoiceCellError(
        InvoiceErrorCode.CUSTOMER_NOT_FOUND,
        'Customer not found',
        { customerId: input.customerId }
      );
    }
    if (customer.status !== 'approved') {
      throw new InvoiceCellError(
        InvoiceErrorCode.CUSTOMER_NOT_APPROVED,
        'Customer must be approved before invoicing',
        { customerId: input.customerId, status: customer.status }
      );
    }

    // Generate invoice number
    const invoiceNumber = await this.sequencePort.nextSequence(
      actor.tenantId,
      'INVOICE'
    );

    // Create invoice
    const createData: CreateInvoiceData = {
      tenantId: actor.tenantId,
      customerId: input.customerId,
      invoiceDate: input.invoiceDate,
      dueDate: input.dueDate,
      currency: input.currency ?? 'USD',
      paymentTerms: input.paymentTerms ?? 'NET_30',
      discountType: input.discountType,
      discountValue: input.discountValue ?? 0,
      notes: input.notes,
      internalNotes: input.internalNotes,
      createdBy: actor.userId,
    };

    const invoice = await this.invoiceRepo.create(createData, invoiceNumber);

    // Emit audit event
    await this.auditPort.writeEvent(
      actor.tenantId,
      'INVOICE_CREATED',
      invoice.id,
      'Invoice',
      {
        invoiceNumber: invoice.invoiceNumber,
        customerId: invoice.customerId,
        createdBy: actor.userId,
      }
    );

    return invoice;
  }

  // ---------------------------------------------------------------------------
  // Get Invoice
  // ---------------------------------------------------------------------------

  async getById(id: string, actor: ActorContext): Promise<Invoice | null> {
    return this.invoiceRepo.getById(id, actor.tenantId);
  }

  async getByNumber(
    invoiceNumber: string,
    actor: ActorContext
  ): Promise<Invoice | null> {
    return this.invoiceRepo.getByNumber(invoiceNumber, actor.tenantId);
  }

  // ---------------------------------------------------------------------------
  // List Invoices
  // ---------------------------------------------------------------------------

  async list(
    filter: InvoiceFilter,
    actor: ActorContext
  ): Promise<{ data: Invoice[]; total: number }> {
    return this.invoiceRepo.list(actor.tenantId, filter);
  }

  // ---------------------------------------------------------------------------
  // Update Invoice (draft only)
  // ---------------------------------------------------------------------------

  async update(
    id: string,
    input: {
      customerId?: string;
      invoiceDate?: Date;
      dueDate?: Date;
      currency?: string;
      paymentTerms?: PaymentTerms;
      discountType?: DiscountType;
      discountValue?: number;
      notes?: string;
      internalNotes?: string;
      version: number;
    },
    actor: ActorContext
  ): Promise<Invoice> {
    const invoice = await this.getOrThrow(id, actor);

    // Can only update in draft status
    if (invoice.status !== 'draft') {
      throw new InvoiceCellError(
        InvoiceErrorCode.INVALID_STATE,
        `Cannot update invoice in ${invoice.status} status`,
        { invoiceId: id, currentStatus: invoice.status }
      );
    }

    // Validate new customer if changing
    if (input.customerId && input.customerId !== invoice.customerId) {
      const customer = await this.customerPort.getById(
        input.customerId,
        actor.tenantId
      );
      if (!customer || customer.status !== 'approved') {
        throw new InvoiceCellError(
          InvoiceErrorCode.CUSTOMER_NOT_APPROVED,
          'Customer must be approved',
          { customerId: input.customerId }
        );
      }
    }

    const updateData: UpdateInvoiceData = {
      customerId: input.customerId,
      invoiceDate: input.invoiceDate,
      dueDate: input.dueDate,
      currency: input.currency,
      paymentTerms: input.paymentTerms,
      discountType: input.discountType,
      discountValue: input.discountValue,
      notes: input.notes,
      internalNotes: input.internalNotes,
    };

    const updated = await this.invoiceRepo.update(
      id,
      actor.tenantId,
      updateData,
      input.version
    );

    if (!updated) {
      throw new InvoiceCellError(
        InvoiceErrorCode.VERSION_CONFLICT,
        'Invoice was modified by another user. Please refresh and try again.',
        { invoiceId: id, expectedVersion: input.version }
      );
    }

    // Emit audit event
    await this.auditPort.writeEvent(
      actor.tenantId,
      'INVOICE_UPDATED',
      invoice.id,
      'Invoice',
      {
        invoiceNumber: invoice.invoiceNumber,
        changes: updateData,
        updatedBy: actor.userId,
      }
    );

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Add Line
  // ---------------------------------------------------------------------------

  async addLine(
    invoiceId: string,
    input: {
      description: string;
      productCode?: string;
      quantity: number;
      unitPrice: number;
      discountType?: DiscountType;
      discountValue?: number;
      taxRate: number;
      revenueAccountId: string;
      taxAccountId?: string;
    },
    actor: ActorContext
  ): Promise<InvoiceLine> {
    const invoice = await this.getOrThrow(invoiceId, actor);

    // Can only add lines in draft status
    if (invoice.status !== 'draft') {
      throw new InvoiceCellError(
        InvoiceErrorCode.INVALID_STATE,
        `Cannot add lines to invoice in ${invoice.status} status`,
        { invoiceId, currentStatus: invoice.status }
      );
    }

    // Get next line number
    const existingLines = await this.invoiceRepo.getLines(
      invoiceId,
      actor.tenantId
    );
    const lineNumber = existingLines.length + 1;

    const lineData: CreateInvoiceLineData = {
      invoiceId,
      tenantId: actor.tenantId,
      lineNumber,
      description: input.description,
      productCode: input.productCode,
      quantity: input.quantity,
      unitPrice: input.unitPrice,
      discountType: input.discountType,
      discountValue: input.discountValue ?? 0,
      taxRate: input.taxRate,
      revenueAccountId: input.revenueAccountId,
      taxAccountId: input.taxAccountId,
    };

    const line = await this.invoiceRepo.createLine(lineData);

    // Recalculate invoice totals
    await this.invoiceRepo.recalculateTotals(invoiceId, actor.tenantId);

    // Emit audit event
    await this.auditPort.writeEvent(
      actor.tenantId,
      'INVOICE_LINE_ADDED',
      invoiceId,
      'Invoice',
      {
        lineId: line.id,
        description: input.description,
        lineTotal: line.lineTotal,
        addedBy: actor.userId,
      }
    );

    return line;
  }

  // ---------------------------------------------------------------------------
  // Get Lines
  // ---------------------------------------------------------------------------

  async getLines(invoiceId: string, actor: ActorContext): Promise<InvoiceLine[]> {
    await this.getOrThrow(invoiceId, actor);
    return this.invoiceRepo.getLines(invoiceId, actor.tenantId);
  }

  // ---------------------------------------------------------------------------
  // Delete Line
  // ---------------------------------------------------------------------------

  async deleteLine(
    invoiceId: string,
    lineId: string,
    actor: ActorContext
  ): Promise<void> {
    const invoice = await this.getOrThrow(invoiceId, actor);

    // Can only delete lines in draft status
    if (invoice.status !== 'draft') {
      throw new InvoiceCellError(
        InvoiceErrorCode.INVALID_STATE,
        `Cannot delete lines from invoice in ${invoice.status} status`,
        { invoiceId, currentStatus: invoice.status }
      );
    }

    const deleted = await this.invoiceRepo.deleteLine(lineId, actor.tenantId);
    if (!deleted) {
      throw new InvoiceCellError(
        InvoiceErrorCode.LINE_NOT_FOUND,
        'Invoice line not found',
        { lineId }
      );
    }

    // Recalculate invoice totals
    await this.invoiceRepo.recalculateTotals(invoiceId, actor.tenantId);

    // Emit audit event
    await this.auditPort.writeEvent(
      actor.tenantId,
      'INVOICE_LINE_DELETED',
      invoiceId,
      'Invoice',
      {
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
  ): Promise<Invoice> {
    const invoice = await this.getOrThrow(id, actor);

    if (!canTransition(invoice.status, 'submitted')) {
      throw new InvoiceCellError(
        InvoiceErrorCode.INVALID_STATE_TRANSITION,
        `Cannot submit invoice from ${invoice.status} status`,
        { invoiceId: id, currentStatus: invoice.status, targetStatus: 'submitted' }
      );
    }

    // Validate has lines
    const lines = await this.invoiceRepo.getLines(id, actor.tenantId);
    if (lines.length === 0) {
      throw new InvoiceCellError(
        InvoiceErrorCode.NO_LINES,
        'Invoice must have at least one line',
        { invoiceId: id }
      );
    }

    // Check for duplicates
    const duplicateCheck = await this.invoiceRepo.checkDuplicate(
      actor.tenantId,
      invoice.customerId,
      invoice.invoiceDate,
      invoice.totalAmount,
      id
    );
    if (duplicateCheck.isDuplicate) {
      throw new InvoiceCellError(
        InvoiceErrorCode.DUPLICATE_INVOICE,
        'Potential duplicate invoice detected',
        { matchingInvoices: duplicateCheck.matchingInvoices }
      );
    }

    const updated = await this.invoiceRepo.update(
      id,
      actor.tenantId,
      { status: 'submitted' },
      input.version
    );

    if (!updated) {
      throw new InvoiceCellError(
        InvoiceErrorCode.VERSION_CONFLICT,
        'Invoice was modified by another user. Please refresh and try again.',
        { invoiceId: id, expectedVersion: input.version }
      );
    }

    // Emit audit event
    await this.auditPort.writeEvent(
      actor.tenantId,
      'INVOICE_SUBMITTED',
      id,
      'Invoice',
      {
        invoiceNumber: invoice.invoiceNumber,
        submittedBy: actor.userId,
      }
    );

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Approve Invoice (SoD: approver ≠ creator)
  // ---------------------------------------------------------------------------

  async approve(
    id: string,
    input: { version: number; comments?: string },
    actor: ActorContext
  ): Promise<Invoice> {
    const invoice = await this.getOrThrow(id, actor);

    // Validate state transition
    if (!canTransition(invoice.status, 'approved')) {
      throw new InvoiceCellError(
        InvoiceErrorCode.INVALID_STATE_TRANSITION,
        `Cannot approve invoice from ${invoice.status} status`,
        { invoiceId: id, currentStatus: invoice.status, targetStatus: 'approved' }
      );
    }

    // Enforce SoD: approver ≠ creator
    if (invoice.createdBy === actor.userId) {
      throw new InvoiceCellError(
        InvoiceErrorCode.SOD_VIOLATION,
        'Cannot approve your own invoice (Segregation of Duties)',
        { invoiceId: id, createdBy: invoice.createdBy, approverId: actor.userId }
      );
    }

    const updated = await this.invoiceRepo.update(
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
      throw new InvoiceCellError(
        InvoiceErrorCode.VERSION_CONFLICT,
        'Invoice was modified by another user. Please refresh and try again.',
        { invoiceId: id, expectedVersion: input.version }
      );
    }

    // Emit audit event
    await this.auditPort.writeEvent(
      actor.tenantId,
      'INVOICE_APPROVED',
      id,
      'Invoice',
      {
        invoiceNumber: invoice.invoiceNumber,
        approvedBy: actor.userId,
        comments: input.comments,
      }
    );

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Reject Invoice (SoD: rejector ≠ creator)
  // ---------------------------------------------------------------------------

  async reject(
    id: string,
    input: { version: number; reason: string },
    actor: ActorContext
  ): Promise<Invoice> {
    const invoice = await this.getOrThrow(id, actor);

    if (invoice.status !== 'submitted') {
      throw new InvoiceCellError(
        InvoiceErrorCode.INVALID_STATE_TRANSITION,
        `Cannot reject invoice from ${invoice.status} status`,
        { invoiceId: id, currentStatus: invoice.status, targetStatus: 'draft' }
      );
    }

    // Enforce SoD: rejector ≠ creator
    if (invoice.createdBy === actor.userId) {
      throw new InvoiceCellError(
        InvoiceErrorCode.SOD_VIOLATION,
        'Cannot reject your own invoice (Segregation of Duties)',
        { invoiceId: id, createdBy: invoice.createdBy, rejectorId: actor.userId }
      );
    }

    const updated = await this.invoiceRepo.update(
      id,
      actor.tenantId,
      { status: 'draft' },
      input.version
    );

    if (!updated) {
      throw new InvoiceCellError(
        InvoiceErrorCode.VERSION_CONFLICT,
        'Invoice was modified by another user. Please refresh and try again.',
        { invoiceId: id, expectedVersion: input.version }
      );
    }

    // Emit audit event
    await this.auditPort.writeEvent(
      actor.tenantId,
      'INVOICE_REJECTED',
      id,
      'Invoice',
      {
        invoiceNumber: invoice.invoiceNumber,
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
  ): Promise<Invoice> {
    const invoice = await this.getOrThrow(id, actor);

    // Validate state transition
    if (!canTransition(invoice.status, 'posted')) {
      throw new InvoiceCellError(
        InvoiceErrorCode.INVALID_STATE_TRANSITION,
        `Cannot post invoice from ${invoice.status} status`,
        { invoiceId: id, currentStatus: invoice.status, targetStatus: 'posted' }
      );
    }

    // Check idempotency - prevent double posting
    if (invoice.postingIdempotencyKey === input.idempotencyKey) {
      throw new InvoiceCellError(
        InvoiceErrorCode.ALREADY_POSTED,
        'Invoice already posted with this idempotency key',
        { invoiceId: id, idempotencyKey: input.idempotencyKey }
      );
    }

    // Check fiscal period is open
    const isOpen = await this.fiscalTimePort.isOpen(
      actor.tenantId,
      invoice.invoiceDate
    );
    if (!isOpen) {
      const period = await this.fiscalTimePort.getCurrentPeriod(actor.tenantId);
      throw new InvoiceCellError(
        InvoiceErrorCode.PERIOD_CLOSED,
        'Cannot post to closed period',
        { invoiceId: id, period }
      );
    }

    // Get lines for GL posting
    const lines = await this.invoiceRepo.getLines(id, actor.tenantId);

    // Build journal lines (Dr AR / Cr Revenue / Cr Tax)
    const arAccountId = 'AR_CONTROL'; // Would be resolved from K_COA
    const journalLines = [
      {
        accountId: arAccountId,
        debit: invoice.totalAmount,
        credit: 0,
        description: `AR: Invoice ${invoice.invoiceNumber}`,
      },
    ];

    for (const line of lines) {
      journalLines.push({
        accountId: line.revenueAccountId,
        debit: 0,
        credit: line.lineTotal - line.taxAmount,
        description: `Revenue: ${line.description}`,
      });
      if (line.taxAmount > 0 && line.taxAccountId) {
        journalLines.push({
          accountId: line.taxAccountId,
          debit: 0,
          credit: line.taxAmount,
          description: `Tax: ${line.description}`,
        });
      }
    }

    // Post to GL
    const { journalHeaderId } = await this.glPostingPort.post(
      actor.tenantId,
      journalLines,
      `INV-${invoice.invoiceNumber}`,
      invoice.invoiceDate
    );

    // Update invoice with posting info
    const updated = await this.invoiceRepo.update(
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
      throw new InvoiceCellError(
        InvoiceErrorCode.VERSION_CONFLICT,
        'Invoice was modified by another user. Please refresh and try again.',
        { invoiceId: id, expectedVersion: input.version }
      );
    }

    // Emit audit event
    await this.auditPort.writeEvent(
      actor.tenantId,
      'INVOICE_POSTED',
      id,
      'Invoice',
      {
        invoiceNumber: invoice.invoiceNumber,
        journalHeaderId,
        totalAmount: invoice.totalAmount,
        postedBy: actor.userId,
      }
    );

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Void Invoice
  // ---------------------------------------------------------------------------

  async void(
    id: string,
    input: { version: number; reason: string },
    actor: ActorContext
  ): Promise<Invoice> {
    const invoice = await this.getOrThrow(id, actor);

    // Validate state transition
    if (!canTransition(invoice.status, 'voided')) {
      throw new InvoiceCellError(
        InvoiceErrorCode.INVALID_STATE_TRANSITION,
        `Cannot void invoice from ${invoice.status} status`,
        { invoiceId: id, currentStatus: invoice.status, targetStatus: 'voided' }
      );
    }

    // If posted, would need to create reversal journal (future implementation)
    const updated = await this.invoiceRepo.update(
      id,
      actor.tenantId,
      { status: 'voided' },
      input.version
    );

    if (!updated) {
      throw new InvoiceCellError(
        InvoiceErrorCode.VERSION_CONFLICT,
        'Invoice was modified by another user. Please refresh and try again.',
        { invoiceId: id, expectedVersion: input.version }
      );
    }

    // Emit audit event
    await this.auditPort.writeEvent(
      actor.tenantId,
      'INVOICE_VOIDED',
      id,
      'Invoice',
      {
        invoiceNumber: invoice.invoiceNumber,
        voidedBy: actor.userId,
        reason: input.reason,
      }
    );

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Duplicate Check
  // ---------------------------------------------------------------------------

  async checkDuplicate(
    customerId: string,
    invoiceDate: Date,
    totalAmount: number,
    actor: ActorContext
  ): Promise<{
    isDuplicate: boolean;
    matchingInvoices?: Array<{
      id: string;
      invoiceNumber: string;
      invoiceDate: Date;
      totalAmount: number;
    }>;
  }> {
    return this.invoiceRepo.checkDuplicate(
      actor.tenantId,
      customerId,
      invoiceDate,
      totalAmount
    );
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async getOrThrow(id: string, actor: ActorContext): Promise<Invoice> {
    const invoice = await this.invoiceRepo.getById(id, actor.tenantId);
    if (!invoice) {
      throw new InvoiceCellError(
        InvoiceErrorCode.INVOICE_NOT_FOUND,
        `Invoice not found: ${id}`,
        { invoiceId: id }
      );
    }
    return invoice;
  }
}
