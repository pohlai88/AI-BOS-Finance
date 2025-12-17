/**
 * AR-03 Receipt Processing - Receipt Service
 * 
 * Domain service for receipt processing operations.
 * Implements business logic, state machine, SoD enforcement, and GL posting.
 * 
 * @module AR-03
 */

import {
  Receipt,
  ReceiptAllocation,
  ReceiptRepositoryPort,
  CreateReceiptData,
  ReceiptFilter,
  ReceiptStatus,
  ReceiptMethod,
} from '@aibos/kernel-core';
import { ReceiptCellError, ReceiptErrorCode } from './errors';

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
    status: string;
    outstandingAmount: number;
    customerId: string;
  } | null>;
  updatePaidAmount(id: string, tenantId: string, paidAmount: number): Promise<void>;
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

const VALID_TRANSITIONS: Record<ReceiptStatus, ReceiptStatus[]> = {
  draft: ['submitted'],
  submitted: ['approved', 'draft'], // reject → draft
  approved: ['posted', 'voided'],
  posted: ['reversed'],
  reversed: [], // Terminal state - no transitions allowed
  voided: [], // Terminal state - no transitions allowed
};

function canTransition(from: ReceiptStatus, to: ReceiptStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// =============================================================================
// Service Implementation
// =============================================================================

export class ReceiptService {
  constructor(
    private readonly receiptRepo: ReceiptRepositoryPort,
    private readonly sequencePort: SequencePort,
    private readonly auditPort: AuditOutboxPort,
    private readonly customerPort: CustomerPort,
    private readonly invoicePort: InvoicePort,
    private readonly fiscalTimePort: FiscalTimePort,
    private readonly glPostingPort: GLPostingPort
  ) {}

  // ---------------------------------------------------------------------------
  // Create Receipt (draft)
  // ---------------------------------------------------------------------------

  async create(
    input: {
      customerId: string;
      receiptDate: Date;
      receiptMethod: ReceiptMethod;
      bankAccountId?: string;
      referenceNumber?: string;
      receiptAmount: number;
      notes?: string;
    },
    actor: ActorContext
  ): Promise<Receipt> {
    // Validate customer exists and is approved
    const customer = await this.customerPort.getById(
      input.customerId,
      actor.tenantId
    );
    if (!customer) {
      throw new ReceiptCellError(
        ReceiptErrorCode.CUSTOMER_NOT_FOUND,
        'Customer not found',
        { customerId: input.customerId }
      );
    }
    if (customer.status !== 'approved') {
      throw new ReceiptCellError(
        ReceiptErrorCode.CUSTOMER_NOT_APPROVED,
        'Customer must be approved',
        { customerId: input.customerId, status: customer.status }
      );
    }

    // Generate receipt number
    const receiptNumber = await this.sequencePort.nextSequence(
      actor.tenantId,
      'RECEIPT'
    );

    // Create receipt
    const createData: CreateReceiptData = {
      tenantId: actor.tenantId,
      customerId: input.customerId,
      receiptDate: input.receiptDate,
      receiptMethod: input.receiptMethod,
      bankAccountId: input.bankAccountId,
      referenceNumber: input.referenceNumber,
      receiptAmount: input.receiptAmount,
      notes: input.notes,
      createdBy: actor.userId,
    };

    const receipt = await this.receiptRepo.create(createData, receiptNumber);

    // Emit audit event
    await this.auditPort.writeEvent(
      actor.tenantId,
      'RECEIPT_CREATED',
      receipt.id,
      'Receipt',
      {
        receiptNumber,
        customerId: input.customerId,
        receiptAmount: input.receiptAmount,
        createdBy: actor.userId,
      }
    );

    return receipt;
  }

  // ---------------------------------------------------------------------------
  // Get Receipt
  // ---------------------------------------------------------------------------

  async getById(id: string, actor: ActorContext): Promise<Receipt | null> {
    return this.receiptRepo.getById(id, actor.tenantId);
  }

  // ---------------------------------------------------------------------------
  // List Receipts
  // ---------------------------------------------------------------------------

  async list(
    filter: ReceiptFilter,
    actor: ActorContext
  ): Promise<{ data: Receipt[]; total: number }> {
    return this.receiptRepo.list(actor.tenantId, filter);
  }

  // ---------------------------------------------------------------------------
  // Submit for Approval
  // ---------------------------------------------------------------------------

  async submit(
    id: string,
    input: { version: number },
    actor: ActorContext
  ): Promise<Receipt> {
    const receipt = await this.getOrThrow(id, actor);

    if (!canTransition(receipt.status, 'submitted')) {
      throw new ReceiptCellError(
        ReceiptErrorCode.INVALID_STATE_TRANSITION,
        `Cannot submit receipt from ${receipt.status} status`,
        { receiptId: id, currentStatus: receipt.status, targetStatus: 'submitted' }
      );
    }

    const updated = await this.receiptRepo.update(
      id,
      actor.tenantId,
      { status: 'submitted' },
      input.version
    );

    if (!updated) {
      throw new ReceiptCellError(
        ReceiptErrorCode.VERSION_CONFLICT,
        'Receipt was modified by another user. Please refresh and try again.',
        { receiptId: id, expectedVersion: input.version }
      );
    }

    // Emit audit event
    await this.auditPort.writeEvent(
      actor.tenantId,
      'RECEIPT_SUBMITTED',
      id,
      'Receipt',
      {
        receiptNumber: receipt.receiptNumber,
        submittedBy: actor.userId,
      }
    );

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Approve Receipt (SoD: approver ≠ creator)
  // ---------------------------------------------------------------------------

  async approve(
    id: string,
    input: { version: number; comments?: string },
    actor: ActorContext
  ): Promise<Receipt> {
    const receipt = await this.getOrThrow(id, actor);

    // Validate state transition
    if (!canTransition(receipt.status, 'approved')) {
      throw new ReceiptCellError(
        ReceiptErrorCode.INVALID_STATE_TRANSITION,
        `Cannot approve receipt from ${receipt.status} status`,
        { receiptId: id, currentStatus: receipt.status, targetStatus: 'approved' }
      );
    }

    // Enforce SoD: approver ≠ creator
    if (receipt.createdBy === actor.userId) {
      throw new ReceiptCellError(
        ReceiptErrorCode.SOD_VIOLATION,
        'Cannot approve your own receipt (Segregation of Duties)',
        { receiptId: id, createdBy: receipt.createdBy, approverId: actor.userId }
      );
    }

    const updated = await this.receiptRepo.update(
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
      throw new ReceiptCellError(
        ReceiptErrorCode.VERSION_CONFLICT,
        'Receipt was modified by another user. Please refresh and try again.',
        { receiptId: id, expectedVersion: input.version }
      );
    }

    // Emit audit event
    await this.auditPort.writeEvent(
      actor.tenantId,
      'RECEIPT_APPROVED',
      id,
      'Receipt',
      {
        receiptNumber: receipt.receiptNumber,
        approvedBy: actor.userId,
        comments: input.comments,
      }
    );

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Reject Receipt (SoD: rejector ≠ creator)
  // ---------------------------------------------------------------------------

  async reject(
    id: string,
    input: { version: number; reason: string },
    actor: ActorContext
  ): Promise<Receipt> {
    const receipt = await this.getOrThrow(id, actor);

    if (receipt.status !== 'submitted') {
      throw new ReceiptCellError(
        ReceiptErrorCode.INVALID_STATE_TRANSITION,
        `Cannot reject receipt from ${receipt.status} status`,
        { receiptId: id, currentStatus: receipt.status, targetStatus: 'draft' }
      );
    }

    // Enforce SoD: rejector ≠ creator
    if (receipt.createdBy === actor.userId) {
      throw new ReceiptCellError(
        ReceiptErrorCode.SOD_VIOLATION,
        'Cannot reject your own receipt (Segregation of Duties)',
        { receiptId: id, createdBy: receipt.createdBy, rejectorId: actor.userId }
      );
    }

    const updated = await this.receiptRepo.update(
      id,
      actor.tenantId,
      { status: 'draft' },
      input.version
    );

    if (!updated) {
      throw new ReceiptCellError(
        ReceiptErrorCode.VERSION_CONFLICT,
        'Receipt was modified by another user. Please refresh and try again.',
        { receiptId: id, expectedVersion: input.version }
      );
    }

    // Emit audit event
    await this.auditPort.writeEvent(
      actor.tenantId,
      'RECEIPT_REJECTED',
      id,
      'Receipt',
      {
        receiptNumber: receipt.receiptNumber,
        rejectedBy: actor.userId,
        reason: input.reason,
      }
    );

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Allocate Receipt to Invoice
  // ---------------------------------------------------------------------------

  async allocate(
    receiptId: string,
    input: { invoiceId: string; amount: number },
    actor: ActorContext
  ): Promise<ReceiptAllocation> {
    const receipt = await this.getOrThrow(receiptId, actor);

    // Can only allocate approved or posted receipts
    if (receipt.status !== 'approved' && receipt.status !== 'posted') {
      throw new ReceiptCellError(
        ReceiptErrorCode.INVALID_STATE,
        'Receipt must be approved or posted to allocate',
        { receiptId, currentStatus: receipt.status }
      );
    }

    // Check sufficient unallocated amount
    if (input.amount > receipt.unallocatedAmount) {
      throw new ReceiptCellError(
        ReceiptErrorCode.INSUFFICIENT_UNALLOCATED,
        'Insufficient unallocated amount',
        {
          receiptId,
          available: receipt.unallocatedAmount,
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
      throw new ReceiptCellError(
        ReceiptErrorCode.INVOICE_NOT_FOUND,
        'Invoice not found',
        { invoiceId: input.invoiceId }
      );
    }

    // Invoice must be posted or partially paid
    if (invoice.status !== 'posted' && invoice.status !== 'paid') {
      throw new ReceiptCellError(
        ReceiptErrorCode.INVOICE_NOT_POSTED,
        'Invoice must be posted',
        { invoiceId: input.invoiceId, status: invoice.status }
      );
    }

    // Customer must match
    if (invoice.customerId !== receipt.customerId) {
      throw new ReceiptCellError(
        ReceiptErrorCode.VALIDATION_ERROR,
        'Invoice customer does not match receipt customer',
        {
          receiptCustomerId: receipt.customerId,
          invoiceCustomerId: invoice.customerId,
        }
      );
    }

    // Cannot over-allocate invoice
    if (input.amount > invoice.outstandingAmount) {
      throw new ReceiptCellError(
        ReceiptErrorCode.OVER_ALLOCATION,
        'Amount exceeds invoice outstanding balance',
        {
          invoiceId: input.invoiceId,
          outstandingAmount: invoice.outstandingAmount,
          requestedAmount: input.amount,
        }
      );
    }

    // Create allocation
    const allocation = await this.receiptRepo.createAllocation(
      receiptId,
      input.invoiceId,
      actor.tenantId,
      input.amount,
      actor.userId
    );

    // Recalculate receipt allocated amount
    await this.receiptRepo.recalculateAllocated(receiptId, actor.tenantId);

    // Update invoice paid amount
    await this.invoicePort.updatePaidAmount(
      input.invoiceId,
      actor.tenantId,
      input.amount
    );

    // Emit audit event
    await this.auditPort.writeEvent(
      actor.tenantId,
      'RECEIPT_ALLOCATED',
      receiptId,
      'Receipt',
      {
        receiptNumber: receipt.receiptNumber,
        invoiceId: input.invoiceId,
        amount: input.amount,
        allocatedBy: actor.userId,
      }
    );

    return allocation;
  }

  // ---------------------------------------------------------------------------
  // Get Allocations
  // ---------------------------------------------------------------------------

  async getAllocations(
    receiptId: string,
    actor: ActorContext
  ): Promise<ReceiptAllocation[]> {
    await this.getOrThrow(receiptId, actor);
    return this.receiptRepo.getAllocations(receiptId, actor.tenantId);
  }

  // ---------------------------------------------------------------------------
  // Post to GL (Idempotent)
  // ---------------------------------------------------------------------------

  async post(
    id: string,
    input: { version: number; idempotencyKey: string },
    actor: ActorContext
  ): Promise<Receipt> {
    const receipt = await this.getOrThrow(id, actor);

    // Validate state transition
    if (!canTransition(receipt.status, 'posted')) {
      throw new ReceiptCellError(
        ReceiptErrorCode.INVALID_STATE_TRANSITION,
        `Cannot post receipt from ${receipt.status} status`,
        { receiptId: id, currentStatus: receipt.status, targetStatus: 'posted' }
      );
    }

    // Check idempotency - prevent double posting
    if (receipt.postingIdempotencyKey === input.idempotencyKey) {
      throw new ReceiptCellError(
        ReceiptErrorCode.ALREADY_POSTED,
        'Receipt already posted with this idempotency key',
        { receiptId: id, idempotencyKey: input.idempotencyKey }
      );
    }

    // Check fiscal period is open
    const isOpen = await this.fiscalTimePort.isOpen(
      actor.tenantId,
      receipt.receiptDate
    );
    if (!isOpen) {
      throw new ReceiptCellError(
        ReceiptErrorCode.PERIOD_CLOSED,
        'Cannot post to closed period',
        { receiptId: id }
      );
    }

    // Build journal lines (Dr Bank / Cr AR)
    const journalLines = [
      {
        accountId: 'BANK',
        debit: receipt.receiptAmount,
        credit: 0,
        description: `Receipt ${receipt.receiptNumber}`,
      },
      {
        accountId: 'AR_CONTROL',
        debit: 0,
        credit: receipt.receiptAmount,
        description: `Receipt ${receipt.receiptNumber}`,
      },
    ];

    // Post to GL
    const { journalHeaderId } = await this.glPostingPort.post(
      actor.tenantId,
      journalLines,
      `RCP-${receipt.receiptNumber}`,
      receipt.receiptDate
    );

    // Update receipt with posting info
    const updated = await this.receiptRepo.update(
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
      throw new ReceiptCellError(
        ReceiptErrorCode.VERSION_CONFLICT,
        'Receipt was modified by another user. Please refresh and try again.',
        { receiptId: id, expectedVersion: input.version }
      );
    }

    // Emit audit event
    await this.auditPort.writeEvent(
      actor.tenantId,
      'RECEIPT_POSTED',
      id,
      'Receipt',
      {
        receiptNumber: receipt.receiptNumber,
        journalHeaderId,
        receiptAmount: receipt.receiptAmount,
        postedBy: actor.userId,
      }
    );

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Void Receipt
  // ---------------------------------------------------------------------------

  async void(
    id: string,
    input: { version: number; reason: string },
    actor: ActorContext
  ): Promise<Receipt> {
    const receipt = await this.getOrThrow(id, actor);

    // Validate state transition
    if (!canTransition(receipt.status, 'voided')) {
      throw new ReceiptCellError(
        ReceiptErrorCode.INVALID_STATE_TRANSITION,
        `Cannot void receipt from ${receipt.status} status`,
        { receiptId: id, currentStatus: receipt.status, targetStatus: 'voided' }
      );
    }

    const updated = await this.receiptRepo.update(
      id,
      actor.tenantId,
      { status: 'voided' },
      input.version
    );

    if (!updated) {
      throw new ReceiptCellError(
        ReceiptErrorCode.VERSION_CONFLICT,
        'Receipt was modified by another user. Please refresh and try again.',
        { receiptId: id, expectedVersion: input.version }
      );
    }

    // Emit audit event
    await this.auditPort.writeEvent(
      actor.tenantId,
      'RECEIPT_VOIDED',
      id,
      'Receipt',
      {
        receiptNumber: receipt.receiptNumber,
        voidedBy: actor.userId,
        reason: input.reason,
      }
    );

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async getOrThrow(id: string, actor: ActorContext): Promise<Receipt> {
    const receipt = await this.receiptRepo.getById(id, actor.tenantId);
    if (!receipt) {
      throw new ReceiptCellError(
        ReceiptErrorCode.RECEIPT_NOT_FOUND,
        `Receipt not found: ${id}`,
        { receiptId: id }
      );
    }
    return receipt;
  }
}
