/**
 * Invoice Service
 * 
 * AP-02 Invoice Entry Cell - Invoice creation and lifecycle management.
 * 
 * Responsibilities:
 * - Create new invoices (draft status)
 * - Update invoices (draft only)
 * - Submit invoices for matching/approval
 * - Validate invoice data
 * - Emit transactional audit events
 */

import type {
  InvoiceRepositoryPort,
  Invoice,
  InvoiceLine,
  InvoiceWithLines,
  CreateInvoiceInput as RepoCreateInput,
  CreateInvoiceLineInput,
  UpdateInvoiceInput as RepoUpdateInput,
  InvoiceTransactionContext,
  AuditPort,
  AuditEvent,
} from '@aibos/kernel-core';
import type { ActorContext } from '@aibos/canon-governance';
import { InvoiceStateMachine } from './InvoiceStateMachine';
import {
  InvoiceNotFoundError,
  InvoiceNotInDraftError,
  InvalidInvoiceStatusError,
  InvoiceConcurrencyError,
  InvalidInvoiceAmountError,
  InvoiceLinesRequiredError,
  InvoiceAmountMismatchError,
  DueDateBeforeInvoiceDateError,
  VendorNotApprovedError,
  DuplicateInvoiceError,
} from './errors';

// ============================================================================
// 1. TYPES
// ============================================================================

/**
 * Input for creating an invoice
 */
export interface CreateInvoiceInput {
  companyId: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  reference?: string;
  vendorId: string;
  currency?: string;
  lines: CreateInvoiceLineData[];
}

/**
 * Input for creating an invoice line
 */
export interface CreateInvoiceLineData {
  description: string;
  quantity: number;
  unitPriceCents: number;
  debitAccountCode: string;
  creditAccountCode?: string;
  costCenter?: string;
  projectCode?: string;
}

/**
 * Input for updating an invoice (draft only)
 */
export interface UpdateInvoiceInput {
  invoiceNumber?: string;
  invoiceDate?: Date;
  dueDate?: Date;
  reference?: string;
  vendorId?: string;
  currency?: string;
  lines?: CreateInvoiceLineData[];
}

/**
 * Vendor validation port (for checking approved vendors)
 */
export interface VendorValidationPort {
  isVendorApproved(vendorId: string, tenantId: string): Promise<boolean>;
  getVendorInfo(vendorId: string, tenantId: string): Promise<{ code: string; name: string } | null>;
}

// ============================================================================
// 2. VALIDATION
// ============================================================================

function validateInvoiceDate(invoiceDate: Date, dueDate: Date): void {
  if (dueDate < invoiceDate) {
    throw new DueDateBeforeInvoiceDateError(
      invoiceDate.toISOString().split('T')[0],
      dueDate.toISOString().split('T')[0]
    );
  }
}

function validateLines(lines: CreateInvoiceLineData[]): void {
  if (!lines || lines.length === 0) {
    throw new InvoiceLinesRequiredError();
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.description || line.description.trim().length === 0) {
      throw new InvalidInvoiceAmountError(`Line ${i + 1}: description is required`);
    }
    if (line.quantity <= 0) {
      throw new InvalidInvoiceAmountError(`Line ${i + 1}: quantity must be positive`);
    }
    if (line.unitPriceCents < 0) {
      throw new InvalidInvoiceAmountError(`Line ${i + 1}: unit price cannot be negative`);
    }
    if (!line.debitAccountCode || line.debitAccountCode.trim().length === 0) {
      throw new InvalidInvoiceAmountError(`Line ${i + 1}: debit account code is required`);
    }
  }
}

function calculateLineAmount(quantity: number, unitPriceCents: number): number {
  return Math.round(quantity * unitPriceCents);
}

function calculateTotals(lines: CreateInvoiceLineData[]): {
  subtotalCents: number;
  taxAmountCents: number;
  totalAmountCents: number;
} {
  const subtotalCents = lines.reduce((sum, line) => {
    return sum + calculateLineAmount(line.quantity, line.unitPriceCents);
  }, 0);

  // Tax calculation (can be extended to support tax rates per line)
  const taxAmountCents = 0; // No tax by default

  return {
    subtotalCents,
    taxAmountCents,
    totalAmountCents: subtotalCents + taxAmountCents,
  };
}

// ============================================================================
// 3. SERVICE
// ============================================================================

/**
 * InvoiceService - Creates and manages invoice lifecycle
 */
export class InvoiceService {
  constructor(
    private invoiceRepo: InvoiceRepositoryPort,
    private vendorPort: VendorValidationPort,
    private auditPort: AuditPort
  ) {}

  /**
   * Create a new invoice with lines
   * 
   * @param input - Invoice creation data
   * @param actor - Who is creating the invoice
   * @returns Created invoice with lines
   */
  async create(
    input: CreateInvoiceInput,
    actor: ActorContext
  ): Promise<InvoiceWithLines> {
    // 1. Validate input
    validateInvoiceDate(input.invoiceDate, input.dueDate);
    validateLines(input.lines);

    // 2. Validate vendor is approved (AP-01 dependency)
    const isApproved = await this.vendorPort.isVendorApproved(input.vendorId, actor.tenantId);
    if (!isApproved) {
      throw new VendorNotApprovedError(input.vendorId);
    }

    // 3. Get vendor info for denormalization
    const vendorInfo = await this.vendorPort.getVendorInfo(input.vendorId, actor.tenantId);

    // 4. Calculate totals
    const { subtotalCents, taxAmountCents, totalAmountCents } = calculateTotals(input.lines);

    // 5. Begin transaction
    return this.invoiceRepo.withTransaction(async (txContext) => {
      // 5a. Check for duplicate
      const duplicateCheck = await this.invoiceRepo.checkDuplicate({
        tenantId: actor.tenantId,
        vendorId: input.vendorId,
        invoiceNumber: input.invoiceNumber,
        invoiceDate: input.invoiceDate,
        totalAmountCents,
      });

      if (duplicateCheck.isDuplicate && duplicateCheck.exactMatch) {
        throw new DuplicateInvoiceError(
          input.vendorId,
          input.invoiceNumber,
          duplicateCheck.matchingInvoiceId
        );
      }

      // 6. Create invoice header
      const repoInput: RepoCreateInput = {
        tenantId: actor.tenantId,
        companyId: input.companyId,
        invoiceNumber: input.invoiceNumber,
        invoiceDate: input.invoiceDate,
        dueDate: input.dueDate,
        reference: input.reference,
        vendorId: input.vendorId,
        subtotalCents,
        taxAmountCents,
        totalAmountCents,
        currency: input.currency || 'USD',
        createdBy: actor.userId,
      };

      const invoice = await this.invoiceRepo.create(repoInput, txContext);

      // 7. Create invoice lines
      const lineInputs: CreateInvoiceLineInput[] = input.lines.map((line, idx) => ({
        invoiceId: invoice.id,
        tenantId: actor.tenantId,
        lineNumber: idx + 1,
        description: line.description,
        quantity: line.quantity,
        unitPriceCents: line.unitPriceCents,
        lineAmountCents: calculateLineAmount(line.quantity, line.unitPriceCents),
        debitAccountCode: line.debitAccountCode,
        creditAccountCode: line.creditAccountCode || '2000', // Default AP Payable
        costCenter: line.costCenter,
        projectCode: line.projectCode,
      }));

      const lines = await this.invoiceRepo.addLines(lineInputs, txContext);

      // 8. Flag as potential duplicate if detected
      if (duplicateCheck.isDuplicate && !duplicateCheck.exactMatch) {
        await this.invoiceRepo.markAsDuplicate(
          invoice.id,
          duplicateCheck.matchingInvoiceId!,
          actor.tenantId,
          txContext
        );
      }

      // 9. Emit audit event (TRANSACTIONAL)
      const auditEvent: AuditEvent = {
        eventType: 'finance.ap.invoice.created',
        entityId: invoice.id,
        entityUrn: `urn:finance:invoice:${invoice.id}`,
        actor: {
          userId: actor.userId,
          tenantId: actor.tenantId,
        },
        action: 'create',
        payload: {
          invoiceNumber: invoice.invoiceNumber,
          vendorId: invoice.vendorId,
          vendorCode: vendorInfo?.code,
          totalAmountCents: invoice.totalAmountCents,
          status: invoice.status,
          lineCount: lines.length,
          duplicateFlag: duplicateCheck.isDuplicate && !duplicateCheck.exactMatch,
        },
        correlationId: txContext.correlationId,
        timestamp: new Date(),
      };

      await this.auditPort.emitTransactional(auditEvent, txContext);

      return {
        ...invoice,
        vendorCode: vendorInfo?.code,
        vendorName: vendorInfo?.name,
        lines,
      };
    });
  }

  /**
   * Update invoice (draft only)
   * 
   * @param invoiceId - Invoice ID
   * @param input - Update data
   * @param actor - Who is updating
   * @param expectedVersion - Expected version (optimistic locking)
   * @returns Updated invoice with lines
   */
  async update(
    invoiceId: string,
    input: UpdateInvoiceInput,
    actor: ActorContext,
    expectedVersion: number
  ): Promise<InvoiceWithLines> {
    return this.invoiceRepo.withTransaction(async (txContext) => {
      // 1. Fetch invoice with version check
      const invoice = await this.invoiceRepo.findByIdForUpdate(
        invoiceId,
        actor.tenantId,
        txContext
      );

      if (!invoice) {
        throw new InvoiceNotFoundError(invoiceId);
      }

      // 2. Version check (concurrency control)
      if (invoice.version !== expectedVersion) {
        throw new InvoiceConcurrencyError(expectedVersion, invoice.version);
      }

      // 3. Status check (draft only)
      if (invoice.status !== 'draft') {
        throw new InvoiceNotInDraftError(invoice.status);
      }

      // 4. Validate updates
      const invoiceDate = input.invoiceDate || invoice.invoiceDate;
      const dueDate = input.dueDate || invoice.dueDate;
      validateInvoiceDate(invoiceDate, dueDate);

      // 5. If vendor changed, validate new vendor
      if (input.vendorId && input.vendorId !== invoice.vendorId) {
        const isApproved = await this.vendorPort.isVendorApproved(input.vendorId, actor.tenantId);
        if (!isApproved) {
          throw new VendorNotApprovedError(input.vendorId);
        }
      }

      // 6. Update lines if provided
      let lines: InvoiceLine[];
      let totals = {
        subtotalCents: invoice.subtotalCents,
        taxAmountCents: invoice.taxAmountCents,
        totalAmountCents: invoice.totalAmountCents,
      };

      if (input.lines) {
        validateLines(input.lines);

        // Delete existing lines
        await this.invoiceRepo.deleteAllLines(invoiceId, actor.tenantId, txContext);

        // Create new lines
        totals = calculateTotals(input.lines);
        const lineInputs: CreateInvoiceLineInput[] = input.lines.map((line, idx) => ({
          invoiceId,
          tenantId: actor.tenantId,
          lineNumber: idx + 1,
          description: line.description,
          quantity: line.quantity,
          unitPriceCents: line.unitPriceCents,
          lineAmountCents: calculateLineAmount(line.quantity, line.unitPriceCents),
          debitAccountCode: line.debitAccountCode,
          creditAccountCode: line.creditAccountCode || '2000',
          costCenter: line.costCenter,
          projectCode: line.projectCode,
        }));

        lines = await this.invoiceRepo.addLines(lineInputs, txContext);
      } else {
        lines = await this.invoiceRepo.listLines(invoiceId, actor.tenantId);
      }

      // 7. Update invoice header
      const repoInput: RepoUpdateInput = {
        tenantId: actor.tenantId,
        invoiceNumber: input.invoiceNumber,
        invoiceDate: input.invoiceDate,
        dueDate: input.dueDate,
        reference: input.reference,
        vendorId: input.vendorId,
        currency: input.currency,
        subtotalCents: input.lines ? totals.subtotalCents : undefined,
        taxAmountCents: input.lines ? totals.taxAmountCents : undefined,
        totalAmountCents: input.lines ? totals.totalAmountCents : undefined,
      };

      const updated = await this.invoiceRepo.update(invoiceId, repoInput, txContext);

      // 8. Emit audit event
      const auditEvent: AuditEvent = {
        eventType: 'finance.ap.invoice.updated',
        entityId: invoice.id,
        entityUrn: `urn:finance:invoice:${invoice.id}`,
        actor: {
          userId: actor.userId,
          tenantId: actor.tenantId,
        },
        action: 'update',
        payload: {
          before: {
            invoiceNumber: invoice.invoiceNumber,
            totalAmountCents: invoice.totalAmountCents,
          },
          after: {
            invoiceNumber: updated.invoiceNumber,
            totalAmountCents: updated.totalAmountCents,
          },
        },
        correlationId: txContext.correlationId,
        timestamp: new Date(),
      };

      await this.auditPort.emitTransactional(auditEvent, txContext);

      return { ...updated, lines };
    });
  }

  /**
   * Submit invoice for matching/approval
   * 
   * @param invoiceId - Invoice ID
   * @param actor - Who is submitting
   * @param expectedVersion - Expected version (optimistic locking)
   * @returns Updated invoice
   */
  async submit(
    invoiceId: string,
    actor: ActorContext,
    expectedVersion: number
  ): Promise<Invoice> {
    return this.invoiceRepo.withTransaction(async (txContext) => {
      // 1. Fetch invoice
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

      // 3. State machine check
      if (!InvoiceStateMachine.canTransition(invoice.status, 'submit')) {
        throw new InvalidInvoiceStatusError(invoice.status, 'submit');
      }

      // 4. Validate invoice has lines
      const lines = await this.invoiceRepo.listLines(invoiceId, actor.tenantId);
      if (lines.length === 0) {
        throw new InvoiceLinesRequiredError();
      }

      // 5. Validate amounts match
      const lineTotal = lines.reduce((sum, line) => sum + line.lineAmountCents, 0);
      if (lineTotal !== invoice.subtotalCents) {
        throw new InvoiceAmountMismatchError(invoice.subtotalCents, lineTotal);
      }

      // 6. Update status to submitted
      const nextStatus = InvoiceStateMachine.getNextStatus(invoice.status, 'submit');
      const updated = await this.invoiceRepo.updateStatus(
        invoiceId,
        {
          tenantId: actor.tenantId,
          status: nextStatus,
          submittedBy: actor.userId,
          submittedAt: new Date(),
        },
        txContext
      );

      // 7. Emit audit event
      const auditEvent: AuditEvent = {
        eventType: 'finance.ap.invoice.submitted',
        entityId: invoice.id,
        entityUrn: `urn:finance:invoice:${invoice.id}`,
        actor: {
          userId: actor.userId,
          tenantId: actor.tenantId,
        },
        action: 'submit',
        payload: {
          invoiceNumber: invoice.invoiceNumber,
          totalAmountCents: invoice.totalAmountCents,
          fromStatus: invoice.status,
          toStatus: nextStatus,
        },
        correlationId: txContext.correlationId,
        timestamp: new Date(),
      };

      await this.auditPort.emitTransactional(auditEvent, txContext);

      return updated;
    });
  }

  /**
   * Void an invoice (creates reversal if posted)
   * 
   * @param invoiceId - Invoice ID
   * @param reason - Reason for voiding
   * @param actor - Who is voiding
   * @param expectedVersion - Expected version (optimistic locking)
   * @returns Updated invoice
   */
  async void(
    invoiceId: string,
    reason: string,
    actor: ActorContext,
    expectedVersion: number
  ): Promise<Invoice> {
    return this.invoiceRepo.withTransaction(async (txContext) => {
      // 1. Fetch invoice
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

      // 3. State machine check
      if (!InvoiceStateMachine.canTransition(invoice.status, 'void')) {
        throw new InvalidInvoiceStatusError(invoice.status, 'void');
      }

      // 4. If posted, GL reversal would be handled by PostingService
      // Here we just update status

      // 5. Update status to voided
      const nextStatus = InvoiceStateMachine.getNextStatus(invoice.status, 'void');
      const updated = await this.invoiceRepo.updateStatus(
        invoiceId,
        {
          tenantId: actor.tenantId,
          status: nextStatus,
        },
        txContext
      );

      // 6. Emit audit event
      const auditEvent: AuditEvent = {
        eventType: 'finance.ap.invoice.voided',
        entityId: invoice.id,
        entityUrn: `urn:finance:invoice:${invoice.id}`,
        actor: {
          userId: actor.userId,
          tenantId: actor.tenantId,
        },
        action: 'void',
        payload: {
          invoiceNumber: invoice.invoiceNumber,
          totalAmountCents: invoice.totalAmountCents,
          reason,
          fromStatus: invoice.status,
          toStatus: nextStatus,
          hadJournalEntry: !!invoice.journalHeaderId,
        },
        correlationId: txContext.correlationId,
        timestamp: new Date(),
      };

      await this.auditPort.emitTransactional(auditEvent, txContext);

      return updated;
    });
  }

  /**
   * Get invoice by ID
   * 
   * @param invoiceId - Invoice ID
   * @param actor - Actor context
   * @returns Invoice or null
   */
  async getById(invoiceId: string, actor: ActorContext): Promise<Invoice | null> {
    return this.invoiceRepo.findById(invoiceId, actor.tenantId);
  }

  /**
   * Get invoice by ID with lines
   * 
   * @param invoiceId - Invoice ID
   * @param actor - Actor context
   * @returns Invoice with lines or null
   */
  async getByIdWithLines(invoiceId: string, actor: ActorContext): Promise<InvoiceWithLines | null> {
    return this.invoiceRepo.findByIdWithLines(invoiceId, actor.tenantId);
  }

  /**
   * List invoices with filters
   * 
   * @param filters - Query filters
   * @param actor - Actor context
   * @returns Invoices and total count
   */
  async list(
    filters: {
      companyId?: string;
      vendorId?: string;
      status?: string | string[];
      fromDate?: Date;
      toDate?: Date;
      minAmount?: number;
      maxAmount?: number;
      duplicateFlag?: boolean;
      search?: string;
      limit?: number;
      offset?: number;
    },
    actor: ActorContext
  ): Promise<{ invoices: Invoice[]; total: number }> {
    return this.invoiceRepo.list({
      tenantId: actor.tenantId,
      companyId: filters.companyId,
      vendorId: filters.vendorId,
      status: filters.status as any,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      minAmount: filters.minAmount,
      maxAmount: filters.maxAmount,
      duplicateFlag: filters.duplicateFlag,
      search: filters.search,
      limit: filters.limit,
      offset: filters.offset,
    });
  }
}
