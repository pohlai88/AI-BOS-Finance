/**
 * Payment Repository - SQL Adapter (PostgreSQL)
 * 
 * Implements PaymentRepositoryPort for production use.
 * 
 * Key Features:
 * - Optimistic locking via version column
 * - Idempotency via unique constraint
 * - RLS tenant isolation (set via session)
 * - Row-level locking for updates (SELECT FOR UPDATE)
 */

import type { PoolClient, Pool } from 'pg';
import type {
  PaymentRepositoryPort,
  Payment,
  PaymentApproval,
  CreatePaymentInput,
  UpdatePaymentStatusInput,
  RecordApprovalInput,
  PaymentQueryFilters,
  TransactionContext,
  PaymentStatus,
  SourceDocumentType,
} from '@aibos/kernel-core';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// 1. SQL QUERIES
// ============================================================================

const SQL = {
  // Create payment
  CREATE: `
    INSERT INTO finance.payments (
      id, tenant_id, company_id, payment_number,
      vendor_id, vendor_name,
      amount, currency, functional_currency,
      payment_date, due_date, status,
      created_by, source_document_id, source_document_type,
      idempotency_key, version, created_at, updated_at
    ) VALUES (
      $1, $2, $3, finance.generate_payment_number($2, $3),
      $4, $5, $6, $7, $8, $9, $10, $11,
      $12, $13, $14, $15, 1, NOW(), NOW()
    )
    RETURNING *
  `,

  // Find by ID
  FIND_BY_ID: `
    SELECT * FROM finance.payments
    WHERE id = $1 AND tenant_id = $2
  `,

  // Find by ID with lock
  FIND_BY_ID_FOR_UPDATE: `
    SELECT * FROM finance.payments
    WHERE id = $1 AND tenant_id = $2
    FOR UPDATE
  `,

  // Find by idempotency key
  FIND_BY_IDEMPOTENCY_KEY: `
    SELECT * FROM finance.payments
    WHERE idempotency_key = $1 AND tenant_id = $2
  `,

  // Update status (base)
  UPDATE_STATUS: `
    UPDATE finance.payments
    SET status = $1, updated_at = NOW()
  `,

  // Record approval
  RECORD_APPROVAL: `
    INSERT INTO finance.payment_approvals (
      id, payment_id, tenant_id, level, approver_id, action, comment, decided_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    RETURNING *
  `,

  // List with filters
  LIST_BASE: `
    SELECT * FROM finance.payments
    WHERE tenant_id = $1
  `,

  // Count for pagination
  COUNT_BASE: `
    SELECT COUNT(*) as total FROM finance.payments
    WHERE tenant_id = $1
  `,

  // Get approval history
  GET_APPROVAL_HISTORY: `
    SELECT * FROM finance.payment_approvals
    WHERE payment_id = $1 AND tenant_id = $2
    ORDER BY decided_at ASC
  `,
};

// ============================================================================
// 2. ROW MAPPER
// ============================================================================

function mapPaymentRow(row: Record<string, unknown>): Payment {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    companyId: row.company_id as string,
    paymentNumber: row.payment_number as string,
    vendorId: row.vendor_id as string,
    vendorName: row.vendor_name as string,
    amount: row.amount as string,
    currency: row.currency as string,
    functionalCurrency: row.functional_currency as string | undefined,
    fxRate: row.fx_rate as string | undefined,
    functionalAmount: row.functional_amount as string | undefined,
    paymentDate: new Date(row.payment_date as string),
    dueDate: row.due_date ? new Date(row.due_date as string) : undefined,
    status: row.status as PaymentStatus,
    createdBy: row.created_by as string,
    approvedBy: row.approved_by as string | undefined,
    approvedAt: row.approved_at ? new Date(row.approved_at as string) : undefined,
    executedBy: row.executed_by as string | undefined,
    executedAt: row.executed_at ? new Date(row.executed_at as string) : undefined,
    sourceDocumentId: row.source_document_id as string | undefined,
    sourceDocumentType: row.source_document_type as SourceDocumentType | undefined,
    journalHeaderId: row.journal_header_id as string | undefined,
    beneficiaryAccountNumber: row.beneficiary_account_number as string | undefined,
    beneficiaryRoutingNumber: row.beneficiary_routing_number as string | undefined,
    beneficiaryBankName: row.beneficiary_bank_name as string | undefined,
    beneficiaryAccountName: row.beneficiary_account_name as string | undefined,
    beneficiarySwiftCode: row.beneficiary_swift_code as string | undefined,
    beneficiarySnapshotAt: row.beneficiary_snapshot_at
      ? new Date(row.beneficiary_snapshot_at as string)
      : undefined,
    version: row.version as number,
    idempotencyKey: row.idempotency_key as string | undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

function mapApprovalRow(row: Record<string, unknown>): PaymentApproval {
  return {
    id: row.id as string,
    paymentId: row.payment_id as string,
    tenantId: row.tenant_id as string,
    level: row.level as number,
    approverId: row.approver_id as string,
    action: row.action as 'approved' | 'rejected',
    comment: row.comment as string | undefined,
    decidedAt: new Date(row.decided_at as string),
  };
}

// ============================================================================
// 3. SQL ADAPTER
// ============================================================================

export class SqlPaymentRepository implements PaymentRepositoryPort {
  constructor(private pool: Pool) { }

  async withTransaction<T>(
    callback: (txContext: TransactionContext) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();
    const correlationId = uuidv4();

    try {
      await client.query('BEGIN');

      const txContext: TransactionContext = {
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

  async create(
    input: CreatePaymentInput,
    txContext: TransactionContext
  ): Promise<Payment> {
    const client = txContext.tx as PoolClient;
    const id = uuidv4();

    const result = await client.query(SQL.CREATE, [
      id,
      input.tenantId,
      input.companyId,
      input.vendorId,
      input.vendorName,
      input.amount,
      input.currency,
      input.currency, // functional_currency defaults to transaction currency
      input.paymentDate,
      input.dueDate || null,
      'draft',
      input.createdBy,
      input.sourceDocumentId || null,
      input.sourceDocumentType || null,
      input.idempotencyKey || null,
    ]);

    return mapPaymentRow(result.rows[0]);
  }

  async findById(id: string, tenantId: string): Promise<Payment | null> {
    const result = await this.pool.query(SQL.FIND_BY_ID, [id, tenantId]);
    return result.rows[0] ? mapPaymentRow(result.rows[0]) : null;
  }

  async findByIdForUpdate(
    id: string,
    tenantId: string,
    txContext: TransactionContext
  ): Promise<Payment | null> {
    const client = txContext.tx as PoolClient;
    const result = await client.query(SQL.FIND_BY_ID_FOR_UPDATE, [id, tenantId]);
    return result.rows[0] ? mapPaymentRow(result.rows[0]) : null;
  }

  async findByIdempotencyKey(
    idempotencyKey: string,
    tenantId: string,
    txContext: TransactionContext
  ): Promise<Payment | null> {
    const client = txContext.tx as PoolClient;
    const result = await client.query(SQL.FIND_BY_IDEMPOTENCY_KEY, [
      idempotencyKey,
      tenantId,
    ]);
    return result.rows[0] ? mapPaymentRow(result.rows[0]) : null;
  }

  async updateStatus(
    id: string,
    input: UpdatePaymentStatusInput,
    txContext: TransactionContext
  ): Promise<Payment> {
    const client = txContext.tx as PoolClient;

    // Build dynamic UPDATE query based on provided fields
    // OPTIMIZED: Added version increment for optimistic locking
    const setClauses: string[] = ['status = $1', 'version = version + 1', 'updated_at = NOW()'];
    const values: unknown[] = [input.status];
    let paramIndex = 2;

    if (input.approvedBy !== undefined) {
      setClauses.push(`approved_by = $${paramIndex}`);
      values.push(input.approvedBy);
      paramIndex++;
    }
    if (input.approvedAt !== undefined) {
      setClauses.push(`approved_at = $${paramIndex}`);
      values.push(input.approvedAt);
      paramIndex++;
    }
    if (input.executedBy !== undefined) {
      setClauses.push(`executed_by = $${paramIndex}`);
      values.push(input.executedBy);
      paramIndex++;
    }
    if (input.executedAt !== undefined) {
      setClauses.push(`executed_at = $${paramIndex}`);
      values.push(input.executedAt);
      paramIndex++;
    }
    if (input.journalHeaderId !== undefined) {
      setClauses.push(`journal_header_id = $${paramIndex}`);
      values.push(input.journalHeaderId);
      paramIndex++;
    }
    if (input.beneficiaryAccountNumber !== undefined) {
      setClauses.push(`beneficiary_account_number = $${paramIndex}`);
      values.push(input.beneficiaryAccountNumber);
      paramIndex++;
    }
    if (input.beneficiaryRoutingNumber !== undefined) {
      setClauses.push(`beneficiary_routing_number = $${paramIndex}`);
      values.push(input.beneficiaryRoutingNumber);
      paramIndex++;
    }
    if (input.beneficiaryBankName !== undefined) {
      setClauses.push(`beneficiary_bank_name = $${paramIndex}`);
      values.push(input.beneficiaryBankName);
      paramIndex++;
    }
    if (input.beneficiaryAccountName !== undefined) {
      setClauses.push(`beneficiary_account_name = $${paramIndex}`);
      values.push(input.beneficiaryAccountName);
      paramIndex++;
    }
    if (input.beneficiarySwiftCode !== undefined) {
      setClauses.push(`beneficiary_swift_code = $${paramIndex}`);
      values.push(input.beneficiarySwiftCode);
      paramIndex++;
    }
    if (input.beneficiarySnapshotAt !== undefined) {
      setClauses.push(`beneficiary_snapshot_at = $${paramIndex}`);
      values.push(input.beneficiarySnapshotAt);
      paramIndex++;
    }

    values.push(id);
    const sql = `
      UPDATE finance.payments
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await client.query(sql, values);
    if (result.rows.length === 0) {
      throw new Error(`Payment not found: ${id}`);
    }

    return mapPaymentRow(result.rows[0]);
  }

  async recordApproval(
    input: RecordApprovalInput,
    txContext: TransactionContext
  ): Promise<PaymentApproval> {
    const client = txContext.tx as PoolClient;
    const id = uuidv4();

    const result = await client.query(SQL.RECORD_APPROVAL, [
      id,
      input.paymentId,
      input.tenantId,
      input.level,
      input.approverId,
      input.action,
      input.comment || null,
    ]);

    return mapApprovalRow(result.rows[0]);
  }

  /**
   * OPTIMIZED: Single query with COUNT(*) OVER() window function
   * Reduces database round-trips from 2 to 1
   */
  async list(
    filters: PaymentQueryFilters
  ): Promise<{ payments: Payment[]; total: number }> {
    const whereClauses: string[] = ['tenant_id = $1'];
    const values: unknown[] = [filters.tenantId];
    let paramIndex = 2;

    if (filters.companyId) {
      whereClauses.push(`company_id = $${paramIndex}`);
      values.push(filters.companyId);
      paramIndex++;
    }
    if (filters.vendorId) {
      whereClauses.push(`vendor_id = $${paramIndex}`);
      values.push(filters.vendorId);
      paramIndex++;
    }
    if (filters.createdBy) {
      whereClauses.push(`created_by = $${paramIndex}`);
      values.push(filters.createdBy);
      paramIndex++;
    }
    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      whereClauses.push(`status = ANY($${paramIndex}::text[])`);
      values.push(statuses);
      paramIndex++;
    }
    if (filters.fromDate) {
      whereClauses.push(`payment_date >= $${paramIndex}`);
      values.push(filters.fromDate);
      paramIndex++;
    }
    if (filters.toDate) {
      whereClauses.push(`payment_date <= $${paramIndex}`);
      values.push(filters.toDate);
      paramIndex++;
    }

    const whereClause = whereClauses.join(' AND ');
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    // OPTIMIZED: Single query with window function for count
    values.push(limit);
    values.push(offset);

    const listSql = `
      SELECT *, COUNT(*) OVER() as total
      FROM finance.payments
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const result = await this.pool.query(listSql, values);

    const total = result.rows.length > 0
      ? parseInt(result.rows[0].total as string, 10)
      : 0;
    const payments = result.rows.map(mapPaymentRow);

    return { payments, total };
  }

  async getApprovalHistory(
    paymentId: string,
    tenantId: string
  ): Promise<PaymentApproval[]> {
    const result = await this.pool.query(SQL.GET_APPROVAL_HISTORY, [
      paymentId,
      tenantId,
    ]);
    return result.rows.map(mapApprovalRow);
  }
}

// ============================================================================
// 4. FACTORY
// ============================================================================

export function createSqlPaymentRepository(pool: Pool): PaymentRepositoryPort {
  return new SqlPaymentRepository(pool);
}
