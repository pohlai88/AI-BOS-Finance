/**
 * Invoice Repository - SQL Adapter (PostgreSQL)
 * 
 * Implements InvoiceRepositoryPort for production use.
 * 
 * Key Features:
 * - Optimistic locking via version column
 * - RLS tenant isolation (set via session)
 * - Row-level locking for updates (SELECT FOR UPDATE)
 * - Window function optimization for list queries
 * - Immutability enforcement for posted invoices
 */

import type { PoolClient, Pool } from 'pg';
import type {
  InvoiceRepositoryPort,
  Invoice,
  InvoiceLine,
  InvoiceWithLines,
  InvoiceStatus,
  MatchStatus,
  CreateInvoiceInput,
  CreateInvoiceLineInput,
  UpdateInvoiceInput,
  UpdateInvoiceStatusInput,
  InvoiceQueryFilters,
  InvoiceTransactionContext,
  DuplicateCheckInput,
  DuplicateCheckResult,
} from '@aibos/kernel-core';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// 1. SQL QUERIES
// ============================================================================

const SQL = {
  // Create invoice
  CREATE_INVOICE: `
    INSERT INTO ap.invoices (
      id, tenant_id, company_id, invoice_number, invoice_date, due_date,
      reference, vendor_id, subtotal_cents, tax_amount_cents, total_amount_cents,
      currency, status, duplicate_flag, created_by, version, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'draft', FALSE, $13, 1, NOW(), NOW()
    )
    RETURNING *
  `,

  // Find invoice by ID
  FIND_INVOICE_BY_ID: `
    SELECT * FROM ap.invoices
    WHERE id = $1 AND tenant_id = $2
  `,

  // Find invoice by ID with lock
  FIND_INVOICE_BY_ID_FOR_UPDATE: `
    SELECT * FROM ap.invoices
    WHERE id = $1 AND tenant_id = $2
    FOR UPDATE
  `,

  // Find invoice by vendor and number
  FIND_INVOICE_BY_VENDOR_AND_NUMBER: `
    SELECT * FROM ap.invoices
    WHERE vendor_id = $1 AND invoice_number = $2 AND tenant_id = $3
  `,

  // Update invoice (draft only) - OPTIMIZED: Added version increment
  UPDATE_INVOICE: `
    UPDATE ap.invoices
    SET invoice_number = COALESCE($1, invoice_number),
        invoice_date = COALESCE($2, invoice_date),
        due_date = COALESCE($3, due_date),
        reference = COALESCE($4, reference),
        vendor_id = COALESCE($5, vendor_id),
        subtotal_cents = COALESCE($6, subtotal_cents),
        tax_amount_cents = COALESCE($7, tax_amount_cents),
        total_amount_cents = COALESCE($8, total_amount_cents),
        currency = COALESCE($9, currency),
        version = version + 1,
        updated_at = NOW()
    WHERE id = $10 AND tenant_id = $11 AND status = 'draft'
    RETURNING *
  `,

  // Update invoice status - OPTIMIZED: Added version increment
  UPDATE_INVOICE_STATUS: `
    UPDATE ap.invoices
    SET status = $1,
        submitted_by = COALESCE($2, submitted_by),
        submitted_at = COALESCE($3, submitted_at),
        approved_by = COALESCE($4, approved_by),
        approved_at = COALESCE($5, approved_at),
        posted_by = COALESCE($6, posted_by),
        posted_at = COALESCE($7, posted_at),
        journal_header_id = COALESCE($8, journal_header_id),
        payment_id = COALESCE($9, payment_id),
        match_status = COALESCE($10, match_status),
        match_result_id = COALESCE($11, match_result_id),
        version = version + 1,
        updated_at = NOW()
    WHERE id = $12 AND tenant_id = $13
    RETURNING *
  `,

  // Add invoice line
  ADD_INVOICE_LINE: `
    INSERT INTO ap.invoice_lines (
      id, invoice_id, tenant_id, line_number, description, quantity,
      unit_price_cents, line_amount_cents, debit_account_code, credit_account_code,
      cost_center, project_code, version, created_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 1, NOW()
    )
    RETURNING *
  `,

  // Find line by ID
  FIND_LINE_BY_ID: `
    SELECT * FROM ap.invoice_lines
    WHERE id = $1 AND tenant_id = $2
  `,

  // List lines for invoice
  LIST_LINES: `
    SELECT * FROM ap.invoice_lines
    WHERE invoice_id = $1 AND tenant_id = $2
    ORDER BY line_number ASC
  `,

  // Update line
  UPDATE_LINE: `
    UPDATE ap.invoice_lines
    SET line_number = COALESCE($1, line_number),
        description = COALESCE($2, description),
        quantity = COALESCE($3, quantity),
        unit_price_cents = COALESCE($4, unit_price_cents),
        line_amount_cents = COALESCE($5, line_amount_cents),
        debit_account_code = COALESCE($6, debit_account_code),
        credit_account_code = COALESCE($7, credit_account_code),
        cost_center = COALESCE($8, cost_center),
        project_code = COALESCE($9, project_code)
    WHERE id = $10 AND tenant_id = $11
    RETURNING *
  `,

  // Delete line
  DELETE_LINE: `
    DELETE FROM ap.invoice_lines
    WHERE id = $1 AND tenant_id = $2
  `,

  // Delete all lines for invoice
  DELETE_ALL_LINES: `
    DELETE FROM ap.invoice_lines
    WHERE invoice_id = $1 AND tenant_id = $2
  `,

  // Check for duplicate invoice
  CHECK_DUPLICATE: `
    SELECT id, invoice_number, invoice_date, total_amount_cents
    FROM ap.invoices
    WHERE tenant_id = $1
      AND vendor_id = $2
      AND invoice_number = $3
      AND ($4::uuid IS NULL OR id != $4)
    LIMIT 1
  `,

  // Mark as duplicate
  MARK_AS_DUPLICATE: `
    UPDATE ap.invoices
    SET duplicate_flag = TRUE,
        duplicate_of_invoice_id = $1,
        updated_at = NOW()
    WHERE id = $2 AND tenant_id = $3
    RETURNING *
  `,

  // Record GL posting
  RECORD_GL_POSTING: `
    UPDATE ap.invoices
    SET status = 'posted',
        journal_header_id = $1,
        posted_by = $2,
        posted_at = NOW(),
        updated_at = NOW()
    WHERE id = $3 AND tenant_id = $4 AND status = 'approved'
    RETURNING *
  `,

  // Get totals by status
  GET_TOTALS_BY_STATUS: `
    SELECT status, COUNT(*) as count, SUM(total_amount_cents) as total_cents
    FROM ap.invoices
    WHERE tenant_id = $1
      AND ($2::uuid IS NULL OR company_id = $2)
    GROUP BY status
  `,

  // Get aging buckets
  GET_AGING_BUCKETS: `
    SELECT 
      SUM(CASE WHEN due_date >= CURRENT_DATE THEN total_amount_cents ELSE 0 END) as current,
      SUM(CASE WHEN due_date < CURRENT_DATE AND due_date >= CURRENT_DATE - INTERVAL '30 days' THEN total_amount_cents ELSE 0 END) as days_30,
      SUM(CASE WHEN due_date < CURRENT_DATE - INTERVAL '30 days' AND due_date >= CURRENT_DATE - INTERVAL '60 days' THEN total_amount_cents ELSE 0 END) as days_60,
      SUM(CASE WHEN due_date < CURRENT_DATE - INTERVAL '60 days' AND due_date >= CURRENT_DATE - INTERVAL '90 days' THEN total_amount_cents ELSE 0 END) as days_90,
      SUM(CASE WHEN due_date < CURRENT_DATE - INTERVAL '90 days' THEN total_amount_cents ELSE 0 END) as over_90
    FROM ap.invoices
    WHERE tenant_id = $1
      AND ($2::uuid IS NULL OR company_id = $2)
      AND status NOT IN ('paid', 'closed', 'voided')
  `,
};

// ============================================================================
// 2. ROW MAPPERS
// ============================================================================

function mapInvoiceRow(row: Record<string, unknown>): Invoice {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    companyId: row.company_id as string,
    invoiceNumber: row.invoice_number as string,
    invoiceDate: new Date(row.invoice_date as string),
    dueDate: new Date(row.due_date as string),
    reference: row.reference as string | undefined,
    vendorId: row.vendor_id as string,
    vendorCode: row.vendor_code as string | undefined,
    vendorName: row.vendor_name as string | undefined,
    subtotalCents: parseInt(row.subtotal_cents as string, 10),
    taxAmountCents: parseInt(row.tax_amount_cents as string, 10),
    totalAmountCents: parseInt(row.total_amount_cents as string, 10),
    currency: row.currency as string,
    status: row.status as InvoiceStatus,
    matchStatus: row.match_status as MatchStatus | undefined,
    matchResultId: row.match_result_id as string | undefined,
    journalHeaderId: row.journal_header_id as string | undefined,
    postedAt: row.posted_at ? new Date(row.posted_at as string) : undefined,
    postedBy: row.posted_by as string | undefined,
    paymentId: row.payment_id as string | undefined,
    duplicateFlag: (row.duplicate_flag as boolean) || false,
    duplicateOfInvoiceId: row.duplicate_of_invoice_id as string | undefined,
    createdBy: row.created_by as string,
    createdAt: new Date(row.created_at as string),
    submittedBy: row.submitted_by as string | undefined,
    submittedAt: row.submitted_at ? new Date(row.submitted_at as string) : undefined,
    approvedBy: row.approved_by as string | undefined,
    approvedAt: row.approved_at ? new Date(row.approved_at as string) : undefined,
    version: parseInt(row.version as string, 10),
    updatedAt: new Date(row.updated_at as string),
  };
}

function mapLineRow(row: Record<string, unknown>): InvoiceLine {
  return {
    id: row.id as string,
    invoiceId: row.invoice_id as string,
    tenantId: row.tenant_id as string,
    lineNumber: parseInt(row.line_number as string, 10),
    description: row.description as string,
    quantity: parseFloat(row.quantity as string),
    unitPriceCents: parseInt(row.unit_price_cents as string, 10),
    lineAmountCents: parseInt(row.line_amount_cents as string, 10),
    debitAccountCode: row.debit_account_code as string,
    creditAccountCode: row.credit_account_code as string,
    costCenter: row.cost_center as string | undefined,
    projectCode: row.project_code as string | undefined,
    createdAt: new Date(row.created_at as string),
    version: parseInt(row.version as string, 10),
  };
}

// ============================================================================
// 3. SQL ADAPTER
// ============================================================================

export class SqlInvoiceRepository implements InvoiceRepositoryPort {
  constructor(private pool: Pool) {}

  async withTransaction<T>(
    callback: (txContext: InvoiceTransactionContext) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();
    const correlationId = uuidv4();

    try {
      await client.query('BEGIN');

      const txContext: InvoiceTransactionContext = {
        tx: client,
        correlationId,
      };

      const result = await callback(txContext);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // INVOICE OPERATIONS
  // ============================================================================

  async create(
    input: CreateInvoiceInput,
    txContext: InvoiceTransactionContext
  ): Promise<Invoice> {
    const client = txContext.tx as PoolClient;
    const id = uuidv4();

    const result = await client.query(SQL.CREATE_INVOICE, [
      id,
      input.tenantId,
      input.companyId,
      input.invoiceNumber,
      input.invoiceDate,
      input.dueDate,
      input.reference || null,
      input.vendorId,
      input.subtotalCents,
      input.taxAmountCents,
      input.totalAmountCents,
      input.currency,
      input.createdBy,
    ]);

    return mapInvoiceRow(result.rows[0]);
  }

  async findById(id: string, tenantId: string): Promise<Invoice | null> {
    const result = await this.pool.query(SQL.FIND_INVOICE_BY_ID, [id, tenantId]);
    return result.rows[0] ? mapInvoiceRow(result.rows[0]) : null;
  }

  async findByIdWithLines(id: string, tenantId: string): Promise<InvoiceWithLines | null> {
    const invoice = await this.findById(id, tenantId);
    if (!invoice) return null;

    const lines = await this.listLines(id, tenantId);
    return { ...invoice, lines };
  }

  async findByIdForUpdate(
    id: string,
    tenantId: string,
    txContext: InvoiceTransactionContext
  ): Promise<Invoice | null> {
    const client = txContext.tx as PoolClient;
    const result = await client.query(SQL.FIND_INVOICE_BY_ID_FOR_UPDATE, [id, tenantId]);
    return result.rows[0] ? mapInvoiceRow(result.rows[0]) : null;
  }

  async findByVendorAndNumber(
    vendorId: string,
    invoiceNumber: string,
    tenantId: string
  ): Promise<Invoice | null> {
    const result = await this.pool.query(SQL.FIND_INVOICE_BY_VENDOR_AND_NUMBER, [
      vendorId,
      invoiceNumber,
      tenantId,
    ]);
    return result.rows[0] ? mapInvoiceRow(result.rows[0]) : null;
  }

  async update(
    id: string,
    input: UpdateInvoiceInput,
    txContext: InvoiceTransactionContext
  ): Promise<Invoice> {
    const client = txContext.tx as PoolClient;

    const result = await client.query(SQL.UPDATE_INVOICE, [
      input.invoiceNumber || null,
      input.invoiceDate || null,
      input.dueDate || null,
      input.reference || null,
      input.vendorId || null,
      input.subtotalCents || null,
      input.taxAmountCents || null,
      input.totalAmountCents || null,
      input.currency || null,
      id,
      input.tenantId,
    ]);

    if (result.rows.length === 0) {
      throw new Error(`Invoice not found or not in draft status: ${id}`);
    }

    return mapInvoiceRow(result.rows[0]);
  }

  async updateStatus(
    id: string,
    input: UpdateInvoiceStatusInput,
    txContext: InvoiceTransactionContext
  ): Promise<Invoice> {
    const client = txContext.tx as PoolClient;

    const result = await client.query(SQL.UPDATE_INVOICE_STATUS, [
      input.status,
      input.submittedBy || null,
      input.submittedAt || null,
      input.approvedBy || null,
      input.approvedAt || null,
      input.postedBy || null,
      input.postedAt || null,
      input.journalHeaderId || null,
      input.paymentId || null,
      input.matchStatus || null,
      input.matchResultId || null,
      id,
      input.tenantId,
    ]);

    if (result.rows.length === 0) {
      throw new Error(`Invoice not found: ${id}`);
    }

    return mapInvoiceRow(result.rows[0]);
  }

  async list(filters: InvoiceQueryFilters): Promise<{ invoices: Invoice[]; total: number }> {
    const conditions: string[] = ['tenant_id = $1'];
    const values: unknown[] = [filters.tenantId];
    let paramIndex = 2;

    if (filters.companyId) {
      conditions.push(`company_id = $${paramIndex}`);
      values.push(filters.companyId);
      paramIndex++;
    }

    if (filters.vendorId) {
      conditions.push(`vendor_id = $${paramIndex}`);
      values.push(filters.vendorId);
      paramIndex++;
    }

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        conditions.push(`status = ANY($${paramIndex})`);
        values.push(filters.status);
      } else {
        conditions.push(`status = $${paramIndex}`);
        values.push(filters.status);
      }
      paramIndex++;
    }

    if (filters.matchStatus) {
      conditions.push(`match_status = $${paramIndex}`);
      values.push(filters.matchStatus);
      paramIndex++;
    }

    if (filters.fromDate) {
      conditions.push(`invoice_date >= $${paramIndex}`);
      values.push(filters.fromDate);
      paramIndex++;
    }

    if (filters.toDate) {
      conditions.push(`invoice_date <= $${paramIndex}`);
      values.push(filters.toDate);
      paramIndex++;
    }

    if (filters.minAmount !== undefined) {
      conditions.push(`total_amount_cents >= $${paramIndex}`);
      values.push(filters.minAmount);
      paramIndex++;
    }

    if (filters.maxAmount !== undefined) {
      conditions.push(`total_amount_cents <= $${paramIndex}`);
      values.push(filters.maxAmount);
      paramIndex++;
    }

    if (filters.duplicateFlag !== undefined) {
      conditions.push(`duplicate_flag = $${paramIndex}`);
      values.push(filters.duplicateFlag);
      paramIndex++;
    }

    if (filters.search) {
      conditions.push(`(
        invoice_number ILIKE $${paramIndex} OR
        reference ILIKE $${paramIndex} OR
        vendor_name ILIKE $${paramIndex}
      )`);
      values.push(`%${filters.search}%`);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Get invoices with pagination and total count in single query (optimized)
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    values.push(limit, offset);

    const result = await this.pool.query(
      `SELECT 
        *,
        COUNT(*) OVER() as total
      FROM ap.invoices 
      WHERE ${whereClause} 
      ORDER BY created_at DESC 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      values
    );

    const total = result.rows.length > 0
      ? parseInt(result.rows[0].total as string, 10)
      : 0;

    return {
      invoices: result.rows.map(mapInvoiceRow),
      total,
    };
  }

  // ============================================================================
  // LINE OPERATIONS
  // ============================================================================

  async addLine(
    input: CreateInvoiceLineInput,
    txContext: InvoiceTransactionContext
  ): Promise<InvoiceLine> {
    const client = txContext.tx as PoolClient;
    const id = uuidv4();

    const result = await client.query(SQL.ADD_INVOICE_LINE, [
      id,
      input.invoiceId,
      input.tenantId,
      input.lineNumber,
      input.description,
      input.quantity,
      input.unitPriceCents,
      input.lineAmountCents,
      input.debitAccountCode,
      input.creditAccountCode || '2000',
      input.costCenter || null,
      input.projectCode || null,
    ]);

    return mapLineRow(result.rows[0]);
  }

  /**
   * OPTIMIZED: Batch insert invoice lines using a single query with UNNEST
   * This reduces database round-trips from N to 1 for N lines.
   */
  async addLines(
    lines: CreateInvoiceLineInput[],
    txContext: InvoiceTransactionContext
  ): Promise<InvoiceLine[]> {
    if (lines.length === 0) return [];

    // For small batches (< 5 lines), sequential insert is fine
    if (lines.length < 5) {
      const createdLines: InvoiceLine[] = [];
      for (const input of lines) {
        const line = await this.addLine(input, txContext);
        createdLines.push(line);
      }
      return createdLines;
    }

    // For larger batches, use optimized batch insert
    const client = txContext.tx as PoolClient;

    // Prepare arrays for UNNEST
    const ids = lines.map(() => uuidv4());
    const invoiceIds = lines.map(l => l.invoiceId);
    const tenantIds = lines.map(l => l.tenantId);
    const lineNumbers = lines.map(l => l.lineNumber);
    const descriptions = lines.map(l => l.description);
    const quantities = lines.map(l => l.quantity);
    const unitPriceCents = lines.map(l => l.unitPriceCents);
    const lineAmountCents = lines.map(l => l.lineAmountCents);
    const debitAccountCodes = lines.map(l => l.debitAccountCode);
    const creditAccountCodes = lines.map(l => l.creditAccountCode || '2000');
    const costCenters = lines.map(l => l.costCenter || null);
    const projectCodes = lines.map(l => l.projectCode || null);

    const batchInsertSQL = `
      INSERT INTO ap.invoice_lines (
        id, invoice_id, tenant_id, line_number, description, quantity,
        unit_price_cents, line_amount_cents, debit_account_code, credit_account_code,
        cost_center, project_code, version, created_at
      )
      SELECT * FROM UNNEST(
        $1::uuid[],
        $2::uuid[],
        $3::uuid[],
        $4::int[],
        $5::text[],
        $6::numeric[],
        $7::bigint[],
        $8::bigint[],
        $9::text[],
        $10::text[],
        $11::text[],
        $12::text[]
      ) AS t(id, invoice_id, tenant_id, line_number, description, quantity,
             unit_price_cents, line_amount_cents, debit_account_code, credit_account_code,
             cost_center, project_code)
      CROSS JOIN (SELECT 1 as version, NOW() as created_at) AS defaults
      RETURNING *
    `;

    const result = await client.query(batchInsertSQL, [
      ids,
      invoiceIds,
      tenantIds,
      lineNumbers,
      descriptions,
      quantities,
      unitPriceCents,
      lineAmountCents,
      debitAccountCodes,
      creditAccountCodes,
      costCenters,
      projectCodes,
    ]);

    return result.rows.map(mapLineRow);
  }

  async findLineById(id: string, tenantId: string): Promise<InvoiceLine | null> {
    const result = await this.pool.query(SQL.FIND_LINE_BY_ID, [id, tenantId]);
    return result.rows[0] ? mapLineRow(result.rows[0]) : null;
  }

  async listLines(invoiceId: string, tenantId: string): Promise<InvoiceLine[]> {
    const result = await this.pool.query(SQL.LIST_LINES, [invoiceId, tenantId]);
    return result.rows.map(mapLineRow);
  }

  async updateLine(
    id: string,
    input: Partial<CreateInvoiceLineInput>,
    txContext: InvoiceTransactionContext
  ): Promise<InvoiceLine> {
    const client = txContext.tx as PoolClient;

    const result = await client.query(SQL.UPDATE_LINE, [
      input.lineNumber || null,
      input.description || null,
      input.quantity || null,
      input.unitPriceCents || null,
      input.lineAmountCents || null,
      input.debitAccountCode || null,
      input.creditAccountCode || null,
      input.costCenter || null,
      input.projectCode || null,
      id,
      input.tenantId,
    ]);

    if (result.rows.length === 0) {
      throw new Error(`Invoice line not found: ${id}`);
    }

    return mapLineRow(result.rows[0]);
  }

  async deleteLine(
    id: string,
    tenantId: string,
    txContext: InvoiceTransactionContext
  ): Promise<void> {
    const client = txContext.tx as PoolClient;
    await client.query(SQL.DELETE_LINE, [id, tenantId]);
  }

  async deleteAllLines(
    invoiceId: string,
    tenantId: string,
    txContext: InvoiceTransactionContext
  ): Promise<void> {
    const client = txContext.tx as PoolClient;
    await client.query(SQL.DELETE_ALL_LINES, [invoiceId, tenantId]);
  }

  // ============================================================================
  // DUPLICATE DETECTION
  // ============================================================================

  async checkDuplicate(input: DuplicateCheckInput): Promise<DuplicateCheckResult> {
    const result = await this.pool.query(SQL.CHECK_DUPLICATE, [
      input.tenantId,
      input.vendorId,
      input.invoiceNumber,
      input.excludeInvoiceId || null,
    ]);

    if (result.rows.length === 0) {
      return {
        isDuplicate: false,
        exactMatch: false,
      };
    }

    const match = result.rows[0];
    const invoiceDate = new Date(match.invoice_date as string);
    const totalAmountCents = parseInt(match.total_amount_cents as string, 10);

    // Check for exact match (same date)
    const isExactDateMatch = input.invoiceDate &&
      invoiceDate.getTime() === input.invoiceDate.getTime();

    // Check for amount match within 1% tolerance
    const isAmountMatch = input.totalAmountCents &&
      Math.abs(totalAmountCents - input.totalAmountCents) <= input.totalAmountCents * 0.01;

    if (isExactDateMatch) {
      return {
        isDuplicate: true,
        exactMatch: true,
        matchingInvoiceId: match.id as string,
        matchDetails: 'Exact match on vendor, invoice number, and date',
      };
    }

    return {
      isDuplicate: true,
      exactMatch: false,
      matchingInvoiceId: match.id as string,
      matchDetails: isAmountMatch
        ? 'Match on vendor and invoice number with similar amount'
        : 'Match on vendor and invoice number',
    };
  }

  async markAsDuplicate(
    invoiceId: string,
    duplicateOfId: string,
    tenantId: string,
    txContext: InvoiceTransactionContext
  ): Promise<Invoice> {
    const client = txContext.tx as PoolClient;

    const result = await client.query(SQL.MARK_AS_DUPLICATE, [
      duplicateOfId,
      invoiceId,
      tenantId,
    ]);

    if (result.rows.length === 0) {
      throw new Error(`Invoice not found: ${invoiceId}`);
    }

    return mapInvoiceRow(result.rows[0]);
  }

  // ============================================================================
  // GL POSTING
  // ============================================================================

  async recordGLPosting(
    invoiceId: string,
    journalHeaderId: string,
    postedBy: string,
    tenantId: string,
    txContext: InvoiceTransactionContext
  ): Promise<Invoice> {
    const client = txContext.tx as PoolClient;

    const result = await client.query(SQL.RECORD_GL_POSTING, [
      journalHeaderId,
      postedBy,
      invoiceId,
      tenantId,
    ]);

    if (result.rows.length === 0) {
      throw new Error(`Invoice not found or not in approved status: ${invoiceId}`);
    }

    return mapInvoiceRow(result.rows[0]);
  }

  // ============================================================================
  // AGGREGATIONS
  // ============================================================================

  async getTotalsByStatus(
    tenantId: string,
    companyId?: string
  ): Promise<Map<InvoiceStatus, { count: number; totalCents: number }>> {
    const result = await this.pool.query(SQL.GET_TOTALS_BY_STATUS, [
      tenantId,
      companyId || null,
    ]);

    const totals = new Map<InvoiceStatus, { count: number; totalCents: number }>();

    for (const row of result.rows) {
      totals.set(row.status as InvoiceStatus, {
        count: parseInt(row.count as string, 10),
        totalCents: parseInt(row.total_cents as string, 10) || 0,
      });
    }

    return totals;
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
    const result = await this.pool.query(SQL.GET_AGING_BUCKETS, [
      tenantId,
      companyId || null,
    ]);

    const row = result.rows[0] || {};

    return {
      current: parseInt(row.current as string, 10) || 0,
      days30: parseInt(row.days_30 as string, 10) || 0,
      days60: parseInt(row.days_60 as string, 10) || 0,
      days90: parseInt(row.days_90 as string, 10) || 0,
      over90: parseInt(row.over_90 as string, 10) || 0,
    };
  }
}

/**
 * Factory function to create SQL invoice repository
 */
export function createSqlInvoiceRepository(pool: Pool): InvoiceRepositoryPort {
  return new SqlInvoiceRepository(pool);
}
