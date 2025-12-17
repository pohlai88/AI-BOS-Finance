/**
 * In-Memory Invoice Repository
 * 
 * Memory-based implementation of InvoiceRepositoryPort for testing.
 * Provides full functionality without a real database.
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  InvoiceRepositoryPort,
  Invoice,
  InvoiceLine,
  InvoiceWithLines,
  InvoiceStatus,
  CreateInvoiceInput,
  CreateInvoiceLineInput,
  UpdateInvoiceInput,
  UpdateInvoiceStatusInput,
  InvoiceQueryFilters,
  InvoiceTransactionContext,
  DuplicateCheckInput,
  DuplicateCheckResult,
} from '@aibos/kernel-core';

// ============================================================================
// MEMORY ADAPTER
// ============================================================================

export class MemoryInvoiceRepository implements InvoiceRepositoryPort {
  private invoices: Map<string, Invoice> = new Map();
  private invoiceLines: Map<string, InvoiceLine> = new Map();

  /**
   * Clear all data (for test reset)
   */
  clear(): void {
    this.invoices.clear();
    this.invoiceLines.clear();
  }

  /**
   * Get invoice count (for testing)
   */
  getInvoiceCount(): number {
    return this.invoices.size;
  }

  /**
   * Get line count (for testing)
   */
  getLineCount(): number {
    return this.invoiceLines.size;
  }

  // ============================================================================
  // TRANSACTION MANAGEMENT
  // ============================================================================

  async withTransaction<T>(
    callback: (txContext: InvoiceTransactionContext) => Promise<T>
  ): Promise<T> {
    // Memory implementation doesn't need real transactions
    const txContext: InvoiceTransactionContext = {
      tx: null,
      correlationId: uuidv4(),
    };
    return callback(txContext);
  }

  // ============================================================================
  // INVOICE OPERATIONS
  // ============================================================================

  async create(
    input: CreateInvoiceInput,
    _txContext: InvoiceTransactionContext
  ): Promise<Invoice> {
    const now = new Date();
    const invoice: Invoice = {
      id: uuidv4(),
      tenantId: input.tenantId,
      companyId: input.companyId,
      invoiceNumber: input.invoiceNumber,
      invoiceDate: input.invoiceDate,
      dueDate: input.dueDate,
      reference: input.reference,
      vendorId: input.vendorId,
      subtotalCents: input.subtotalCents,
      taxAmountCents: input.taxAmountCents,
      totalAmountCents: input.totalAmountCents,
      currency: input.currency,
      status: 'draft',
      duplicateFlag: false,
      createdBy: input.createdBy,
      createdAt: now,
      version: 1,
      updatedAt: now,
    };

    this.invoices.set(invoice.id, invoice);
    return { ...invoice };
  }

  async findById(id: string, tenantId: string): Promise<Invoice | null> {
    const invoice = this.invoices.get(id);
    if (!invoice || invoice.tenantId !== tenantId) {
      return null;
    }
    return { ...invoice };
  }

  async findByIdWithLines(id: string, tenantId: string): Promise<InvoiceWithLines | null> {
    const invoice = await this.findById(id, tenantId);
    if (!invoice) {
      return null;
    }
    const lines = await this.listLines(id, tenantId);
    return { ...invoice, lines };
  }

  async findByIdForUpdate(
    id: string,
    tenantId: string,
    _txContext: InvoiceTransactionContext
  ): Promise<Invoice | null> {
    // Memory implementation doesn't need row locking
    return this.findById(id, tenantId);
  }

  async findByVendorAndNumber(
    vendorId: string,
    invoiceNumber: string,
    tenantId: string
  ): Promise<Invoice | null> {
    for (const invoice of this.invoices.values()) {
      if (
        invoice.tenantId === tenantId &&
        invoice.vendorId === vendorId &&
        invoice.invoiceNumber === invoiceNumber
      ) {
        return { ...invoice };
      }
    }
    return null;
  }

  async update(
    id: string,
    input: UpdateInvoiceInput,
    _txContext: InvoiceTransactionContext
  ): Promise<Invoice> {
    const invoice = this.invoices.get(id);
    if (!invoice || invoice.tenantId !== input.tenantId) {
      throw new Error(`Invoice not found: ${id}`);
    }

    const updated: Invoice = {
      ...invoice,
      ...(input.invoiceNumber !== undefined && { invoiceNumber: input.invoiceNumber }),
      ...(input.invoiceDate !== undefined && { invoiceDate: input.invoiceDate }),
      ...(input.dueDate !== undefined && { dueDate: input.dueDate }),
      ...(input.reference !== undefined && { reference: input.reference }),
      ...(input.vendorId !== undefined && { vendorId: input.vendorId }),
      ...(input.subtotalCents !== undefined && { subtotalCents: input.subtotalCents }),
      ...(input.taxAmountCents !== undefined && { taxAmountCents: input.taxAmountCents }),
      ...(input.totalAmountCents !== undefined && { totalAmountCents: input.totalAmountCents }),
      ...(input.currency !== undefined && { currency: input.currency }),
      version: invoice.version + 1,
      updatedAt: new Date(),
    };

    this.invoices.set(id, updated);
    return { ...updated };
  }

  async updateStatus(
    id: string,
    input: UpdateInvoiceStatusInput,
    _txContext: InvoiceTransactionContext
  ): Promise<Invoice> {
    const invoice = this.invoices.get(id);
    if (!invoice || invoice.tenantId !== input.tenantId) {
      throw new Error(`Invoice not found: ${id}`);
    }

    const updated: Invoice = {
      ...invoice,
      status: input.status,
      ...(input.submittedBy !== undefined && { submittedBy: input.submittedBy }),
      ...(input.submittedAt !== undefined && { submittedAt: input.submittedAt }),
      ...(input.approvedBy !== undefined && { approvedBy: input.approvedBy }),
      ...(input.approvedAt !== undefined && { approvedAt: input.approvedAt }),
      ...(input.postedBy !== undefined && { postedBy: input.postedBy }),
      ...(input.postedAt !== undefined && { postedAt: input.postedAt }),
      ...(input.journalHeaderId !== undefined && { journalHeaderId: input.journalHeaderId }),
      ...(input.paymentId !== undefined && { paymentId: input.paymentId }),
      ...(input.matchStatus !== undefined && { matchStatus: input.matchStatus }),
      ...(input.matchResultId !== undefined && { matchResultId: input.matchResultId }),
      version: invoice.version + 1,
      updatedAt: new Date(),
    };

    this.invoices.set(id, updated);
    return { ...updated };
  }

  async list(filters: InvoiceQueryFilters): Promise<{ invoices: Invoice[]; total: number }> {
    let results = Array.from(this.invoices.values())
      .filter(inv => inv.tenantId === filters.tenantId);

    // Apply filters
    if (filters.companyId) {
      results = results.filter(inv => inv.companyId === filters.companyId);
    }
    if (filters.vendorId) {
      results = results.filter(inv => inv.vendorId === filters.vendorId);
    }
    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      results = results.filter(inv => statuses.includes(inv.status));
    }
    if (filters.matchStatus) {
      results = results.filter(inv => inv.matchStatus === filters.matchStatus);
    }
    if (filters.fromDate) {
      results = results.filter(inv => inv.invoiceDate >= filters.fromDate!);
    }
    if (filters.toDate) {
      results = results.filter(inv => inv.invoiceDate <= filters.toDate!);
    }
    if (filters.minAmount !== undefined) {
      results = results.filter(inv => inv.totalAmountCents >= filters.minAmount!);
    }
    if (filters.maxAmount !== undefined) {
      results = results.filter(inv => inv.totalAmountCents <= filters.maxAmount!);
    }
    if (filters.duplicateFlag !== undefined) {
      results = results.filter(inv => inv.duplicateFlag === filters.duplicateFlag);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      results = results.filter(inv =>
        inv.invoiceNumber.toLowerCase().includes(search) ||
        (inv.reference?.toLowerCase().includes(search)) ||
        (inv.vendorName?.toLowerCase().includes(search))
      );
    }

    // Sort by createdAt descending
    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = results.length;

    // Pagination
    if (filters.offset !== undefined) {
      results = results.slice(filters.offset);
    }
    if (filters.limit !== undefined) {
      results = results.slice(0, filters.limit);
    }

    return {
      invoices: results.map(inv => ({ ...inv })),
      total,
    };
  }

  // ============================================================================
  // INVOICE LINE OPERATIONS
  // ============================================================================

  async addLine(
    input: CreateInvoiceLineInput,
    _txContext: InvoiceTransactionContext
  ): Promise<InvoiceLine> {
    const line: InvoiceLine = {
      id: uuidv4(),
      invoiceId: input.invoiceId,
      tenantId: input.tenantId,
      lineNumber: input.lineNumber,
      description: input.description,
      quantity: input.quantity,
      unitPriceCents: input.unitPriceCents,
      lineAmountCents: input.lineAmountCents,
      debitAccountCode: input.debitAccountCode,
      creditAccountCode: input.creditAccountCode || '2000',
      costCenter: input.costCenter,
      projectCode: input.projectCode,
      createdAt: new Date(),
      version: 1,
    };

    this.invoiceLines.set(line.id, line);
    return { ...line };
  }

  async addLines(
    lines: CreateInvoiceLineInput[],
    txContext: InvoiceTransactionContext
  ): Promise<InvoiceLine[]> {
    const createdLines: InvoiceLine[] = [];
    for (const input of lines) {
      const line = await this.addLine(input, txContext);
      createdLines.push(line);
    }
    return createdLines;
  }

  async findLineById(id: string, tenantId: string): Promise<InvoiceLine | null> {
    const line = this.invoiceLines.get(id);
    if (!line || line.tenantId !== tenantId) {
      return null;
    }
    return { ...line };
  }

  async listLines(invoiceId: string, tenantId: string): Promise<InvoiceLine[]> {
    return Array.from(this.invoiceLines.values())
      .filter(line => line.invoiceId === invoiceId && line.tenantId === tenantId)
      .sort((a, b) => a.lineNumber - b.lineNumber)
      .map(line => ({ ...line }));
  }

  async updateLine(
    id: string,
    input: Partial<CreateInvoiceLineInput>,
    _txContext: InvoiceTransactionContext
  ): Promise<InvoiceLine> {
    const line = this.invoiceLines.get(id);
    if (!line) {
      throw new Error(`Invoice line not found: ${id}`);
    }

    const updated: InvoiceLine = {
      ...line,
      ...(input.lineNumber !== undefined && { lineNumber: input.lineNumber }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.quantity !== undefined && { quantity: input.quantity }),
      ...(input.unitPriceCents !== undefined && { unitPriceCents: input.unitPriceCents }),
      ...(input.lineAmountCents !== undefined && { lineAmountCents: input.lineAmountCents }),
      ...(input.debitAccountCode !== undefined && { debitAccountCode: input.debitAccountCode }),
      ...(input.creditAccountCode !== undefined && { creditAccountCode: input.creditAccountCode }),
      ...(input.costCenter !== undefined && { costCenter: input.costCenter }),
      ...(input.projectCode !== undefined && { projectCode: input.projectCode }),
      version: line.version + 1,
    };

    this.invoiceLines.set(id, updated);
    return { ...updated };
  }

  async deleteLine(
    id: string,
    tenantId: string,
    _txContext: InvoiceTransactionContext
  ): Promise<void> {
    const line = this.invoiceLines.get(id);
    if (line && line.tenantId === tenantId) {
      this.invoiceLines.delete(id);
    }
  }

  async deleteAllLines(
    invoiceId: string,
    tenantId: string,
    _txContext: InvoiceTransactionContext
  ): Promise<void> {
    for (const [id, line] of this.invoiceLines.entries()) {
      if (line.invoiceId === invoiceId && line.tenantId === tenantId) {
        this.invoiceLines.delete(id);
      }
    }
  }

  // ============================================================================
  // DUPLICATE DETECTION
  // ============================================================================

  async checkDuplicate(input: DuplicateCheckInput): Promise<DuplicateCheckResult> {
    // Check for exact match (vendor + invoice number + date)
    for (const invoice of this.invoices.values()) {
      if (
        invoice.tenantId === input.tenantId &&
        invoice.vendorId === input.vendorId &&
        invoice.invoiceNumber === input.invoiceNumber &&
        invoice.id !== input.excludeInvoiceId
      ) {
        // Exact match on invoice number
        if (
          input.invoiceDate &&
          invoice.invoiceDate.getTime() === input.invoiceDate.getTime()
        ) {
          return {
            isDuplicate: true,
            exactMatch: true,
            matchingInvoiceId: invoice.id,
            matchDetails: 'Exact match on vendor, invoice number, and date',
          };
        }

        // Amount tolerance check (within 1%)
        if (
          input.totalAmountCents &&
          Math.abs(invoice.totalAmountCents - input.totalAmountCents) <=
            input.totalAmountCents * 0.01
        ) {
          return {
            isDuplicate: true,
            exactMatch: false,
            matchingInvoiceId: invoice.id,
            matchDetails: 'Match on vendor and invoice number with similar amount',
          };
        }

        // Same vendor and invoice number
        return {
          isDuplicate: true,
          exactMatch: false,
          matchingInvoiceId: invoice.id,
          matchDetails: 'Match on vendor and invoice number',
        };
      }
    }

    return {
      isDuplicate: false,
      exactMatch: false,
    };
  }

  async markAsDuplicate(
    invoiceId: string,
    duplicateOfId: string,
    tenantId: string,
    _txContext: InvoiceTransactionContext
  ): Promise<Invoice> {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice || invoice.tenantId !== tenantId) {
      throw new Error(`Invoice not found: ${invoiceId}`);
    }

    const updated: Invoice = {
      ...invoice,
      duplicateFlag: true,
      duplicateOfInvoiceId: duplicateOfId,
      version: invoice.version + 1,
      updatedAt: new Date(),
    };

    this.invoices.set(invoiceId, updated);
    return { ...updated };
  }

  // ============================================================================
  // GL POSTING
  // ============================================================================

  async recordGLPosting(
    invoiceId: string,
    journalHeaderId: string,
    postedBy: string,
    tenantId: string,
    _txContext: InvoiceTransactionContext
  ): Promise<Invoice> {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice || invoice.tenantId !== tenantId) {
      throw new Error(`Invoice not found: ${invoiceId}`);
    }

    const updated: Invoice = {
      ...invoice,
      status: 'posted',
      journalHeaderId,
      postedBy,
      postedAt: new Date(),
      version: invoice.version + 1,
      updatedAt: new Date(),
    };

    this.invoices.set(invoiceId, updated);
    return { ...updated };
  }

  // ============================================================================
  // AGGREGATIONS
  // ============================================================================

  async getTotalsByStatus(
    tenantId: string,
    companyId?: string
  ): Promise<Map<InvoiceStatus, { count: number; totalCents: number }>> {
    const result = new Map<InvoiceStatus, { count: number; totalCents: number }>();

    for (const invoice of this.invoices.values()) {
      if (invoice.tenantId !== tenantId) continue;
      if (companyId && invoice.companyId !== companyId) continue;

      const current = result.get(invoice.status) || { count: 0, totalCents: 0 };
      result.set(invoice.status, {
        count: current.count + 1,
        totalCents: current.totalCents + invoice.totalAmountCents,
      });
    }

    return result;
  }

  async getAgingBuckets(
    tenantId: string,
    companyId?: string
  ): Promise<{
    current: number;
    days30: number;
    days60: number;
    days90: number;
    over90: number;
  }> {
    const now = new Date();
    const result = {
      current: 0,
      days30: 0,
      days60: 0,
      days90: 0,
      over90: 0,
    };

    for (const invoice of this.invoices.values()) {
      if (invoice.tenantId !== tenantId) continue;
      if (companyId && invoice.companyId !== companyId) continue;
      if (invoice.status === 'paid' || invoice.status === 'closed' || invoice.status === 'voided') continue;

      const daysSinceDue = Math.floor(
        (now.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceDue <= 0) {
        result.current += invoice.totalAmountCents;
      } else if (daysSinceDue <= 30) {
        result.days30 += invoice.totalAmountCents;
      } else if (daysSinceDue <= 60) {
        result.days60 += invoice.totalAmountCents;
      } else if (daysSinceDue <= 90) {
        result.days90 += invoice.totalAmountCents;
      } else {
        result.over90 += invoice.totalAmountCents;
      }
    }

    return result;
  }

  // ============================================================================
  // TEST HELPERS
  // ============================================================================

  /**
   * Seed test data (for testing)
   */
  async seedInvoice(invoice: Invoice): Promise<void> {
    this.invoices.set(invoice.id, { ...invoice });
  }

  /**
   * Seed test line data (for testing)
   */
  async seedLine(line: InvoiceLine): Promise<void> {
    this.invoiceLines.set(line.id, { ...line });
  }

  /**
   * Get all invoices (for testing)
   */
  getAllInvoices(): Invoice[] {
    return Array.from(this.invoices.values()).map(inv => ({ ...inv }));
  }

  /**
   * Get all lines (for testing)
   */
  getAllLines(): InvoiceLine[] {
    return Array.from(this.invoiceLines.values()).map(line => ({ ...line }));
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createMemoryInvoiceRepository(): MemoryInvoiceRepository {
  return new MemoryInvoiceRepository();
}
