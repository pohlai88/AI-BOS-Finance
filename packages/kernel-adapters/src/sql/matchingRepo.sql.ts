/**
 * AP-03: 3-Way Match & Controls Engine — SQL Adapter
 * 
 * PostgreSQL implementation of MatchingRepositoryPort.
 */

import type { PoolClient, Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import type {
  MatchingRepositoryPort,
  MatchResult,
  MatchException,
  MatchTransactionContext,
  CreateMatchResultInput,
  UpdateMatchResultInput,
  CreateExceptionInput,
  ResolveExceptionInput,
  MatchQueryFilters,
} from '@aibos/kernel-core';

// ============================================================================
// SQL QUERIES
// ============================================================================

const SQL = {
  // Match Result queries
  CREATE_MATCH_RESULT: `
    INSERT INTO ap.match_results (
      id, invoice_id, tenant_id, match_mode, match_policy_source,
      status, purchase_order_id, goods_receipt_id,
      price_variance_percent, qty_variance_percent, amount_variance_cents,
      within_tolerance, exception_reason, exception_code,
      created_by, version, created_at, evaluated_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 1, NOW(), NOW(), NOW()
    )
    RETURNING *
  `,

  FIND_MATCH_BY_ID: `
    SELECT * FROM ap.match_results
    WHERE id = $1 AND tenant_id = $2
  `,

  FIND_MATCH_BY_INVOICE: `
    SELECT * FROM ap.match_results
    WHERE invoice_id = $1 AND tenant_id = $2
  `,

  // OPTIMIZED: Added version increment
  UPDATE_MATCH_RESULT: `
    UPDATE ap.match_results
    SET status = COALESCE($1, status),
        is_overridden = COALESCE($2, is_overridden),
        override_approved_by = COALESCE($3, override_approved_by),
        override_approved_at = COALESCE($4, override_approved_at),
        override_reason = COALESCE($5, override_reason),
        version = version + 1,
        updated_at = NOW()
    WHERE id = $6 AND tenant_id = $7
    RETURNING *
  `,

  // Exception queries
  CREATE_EXCEPTION: `
    INSERT INTO ap.match_exceptions (
      id, match_result_id, tenant_id, exception_type, severity, message, created_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, NOW()
    )
    RETURNING *
  `,

  LIST_EXCEPTIONS: `
    SELECT * FROM ap.match_exceptions
    WHERE match_result_id = $1 AND tenant_id = $2
    ORDER BY created_at ASC
  `,

  RESOLVE_EXCEPTION: `
    UPDATE ap.match_exceptions
    SET resolution_status = $1,
        resolved_by = $2,
        resolved_at = NOW(),
        resolution_notes = $3
    WHERE id = $4 AND tenant_id = $5
    RETURNING *
  `,

  FIND_EXCEPTION_BY_ID: `
    SELECT * FROM ap.match_exceptions
    WHERE id = $1 AND tenant_id = $2
  `,
};

// ============================================================================
// ROW MAPPERS
// ============================================================================

function mapMatchResultRow(row: Record<string, unknown>): MatchResult {
  return {
    id: row.id as string,
    invoiceId: row.invoice_id as string,
    tenantId: row.tenant_id as string,
    matchMode: row.match_mode as MatchResult['matchMode'],
    matchPolicySource: row.match_policy_source as MatchResult['matchPolicySource'],
    status: row.status as MatchResult['status'],
    purchaseOrderId: row.purchase_order_id as string | undefined,
    goodsReceiptId: row.goods_receipt_id as string | undefined,
    priceVariancePercent: row.price_variance_percent ? parseFloat(row.price_variance_percent as string) : undefined,
    qtyVariancePercent: row.qty_variance_percent ? parseFloat(row.qty_variance_percent as string) : undefined,
    amountVarianceCents: row.amount_variance_cents ? parseInt(row.amount_variance_cents as string, 10) : undefined,
    withinTolerance: row.within_tolerance as boolean,
    exceptionReason: row.exception_reason as string | undefined,
    exceptionCode: row.exception_code as string | undefined,
    isOverridden: row.is_overridden as boolean,
    overrideApprovedBy: row.override_approved_by as string | undefined,
    overrideApprovedAt: row.override_approved_at ? new Date(row.override_approved_at as string) : undefined,
    overrideReason: row.override_reason as string | undefined,
    createdBy: row.created_by as string,
    createdAt: new Date(row.created_at as string),
    evaluatedAt: new Date(row.evaluated_at as string),
    version: parseInt(row.version as string, 10),
    updatedAt: new Date(row.updated_at as string),
  };
}

function mapExceptionRow(row: Record<string, unknown>): MatchException {
  return {
    id: row.id as string,
    matchResultId: row.match_result_id as string,
    tenantId: row.tenant_id as string,
    exceptionType: row.exception_type as MatchException['exceptionType'],
    severity: row.severity as string,
    message: row.message as string,
    resolutionStatus: row.resolution_status as string,
    resolvedBy: row.resolved_by as string | undefined,
    resolvedAt: row.resolved_at ? new Date(row.resolved_at as string) : undefined,
    resolutionNotes: row.resolution_notes as string | undefined,
    createdAt: new Date(row.created_at as string),
  };
}

// ============================================================================
// SQL ADAPTER
// ============================================================================

export class SqlMatchingRepository implements MatchingRepositoryPort {
  constructor(private pool: Pool) {}

  async withTransaction<T>(
    callback: (txContext: MatchTransactionContext) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();
    const correlationId = uuidv4();

    try {
      await client.query('BEGIN');

      const txContext: MatchTransactionContext = {
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

  // ========== Match Result Operations ==========

  async create(
    input: CreateMatchResultInput,
    txContext: MatchTransactionContext
  ): Promise<MatchResult> {
    const client = txContext.tx as PoolClient;
    const id = uuidv4();

    const result = await client.query(SQL.CREATE_MATCH_RESULT, [
      id,
      input.invoiceId,
      input.tenantId,
      input.matchMode,
      input.matchPolicySource,
      input.status,
      input.purchaseOrderId || null,
      input.goodsReceiptId || null,
      input.priceVariancePercent || null,
      input.qtyVariancePercent || null,
      input.amountVarianceCents || null,
      input.withinTolerance,
      input.exceptionReason || null,
      input.exceptionCode || null,
      input.createdBy,
    ]);

    return mapMatchResultRow(result.rows[0]);
  }

  async findById(id: string, tenantId: string): Promise<MatchResult | null> {
    const result = await this.pool.query(SQL.FIND_MATCH_BY_ID, [id, tenantId]);
    return result.rows[0] ? mapMatchResultRow(result.rows[0]) : null;
  }

  async findByInvoiceId(invoiceId: string, tenantId: string): Promise<MatchResult | null> {
    const result = await this.pool.query(SQL.FIND_MATCH_BY_INVOICE, [invoiceId, tenantId]);
    return result.rows[0] ? mapMatchResultRow(result.rows[0]) : null;
  }

  async update(
    id: string,
    input: UpdateMatchResultInput,
    txContext: MatchTransactionContext
  ): Promise<MatchResult> {
    const client = txContext.tx as PoolClient;

    const result = await client.query(SQL.UPDATE_MATCH_RESULT, [
      input.status || null,
      input.isOverridden ?? null,
      input.overrideApprovedBy || null,
      input.overrideApprovedAt || null,
      input.overrideReason || null,
      id,
      input.tenantId,
    ]);

    if (result.rows.length === 0) {
      throw new Error(`Match result not found: ${id}`);
    }

    return mapMatchResultRow(result.rows[0]);
  }

  async list(filters: MatchQueryFilters): Promise<{ results: MatchResult[]; total: number }> {
    const conditions: string[] = ['tenant_id = $1'];
    const values: unknown[] = [filters.tenantId];
    let paramIndex = 2;

    if (filters.invoiceId) {
      conditions.push(`invoice_id = $${paramIndex}`);
      values.push(filters.invoiceId);
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

    if (filters.matchMode) {
      conditions.push(`match_mode = $${paramIndex}`);
      values.push(filters.matchMode);
      paramIndex++;
    }

    if (filters.isOverridden !== undefined) {
      conditions.push(`is_overridden = $${paramIndex}`);
      values.push(filters.isOverridden);
      paramIndex++;
    }

    if (filters.fromDate) {
      conditions.push(`created_at >= $${paramIndex}`);
      values.push(filters.fromDate);
      paramIndex++;
    }

    if (filters.toDate) {
      conditions.push(`created_at <= $${paramIndex}`);
      values.push(filters.toDate);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    values.push(limit, offset);

    const result = await this.pool.query(
      `SELECT *, COUNT(*) OVER() as total
       FROM ap.match_results
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      values
    );

    const total = result.rows.length > 0 ? parseInt(result.rows[0].total as string, 10) : 0;

    return {
      results: result.rows.map(mapMatchResultRow),
      total,
    };
  }

  // ========== Exception Operations ==========

  async createException(
    input: CreateExceptionInput,
    txContext: MatchTransactionContext
  ): Promise<MatchException> {
    const client = txContext.tx as PoolClient;
    const id = uuidv4();

    const result = await client.query(SQL.CREATE_EXCEPTION, [
      id,
      input.matchResultId,
      input.tenantId,
      input.exceptionType,
      input.severity,
      input.message,
    ]);

    return mapExceptionRow(result.rows[0]);
  }

  async listExceptions(matchResultId: string, tenantId: string): Promise<MatchException[]> {
    const result = await this.pool.query(SQL.LIST_EXCEPTIONS, [matchResultId, tenantId]);
    return result.rows.map(mapExceptionRow);
  }

  async resolveException(
    id: string,
    input: ResolveExceptionInput,
    txContext: MatchTransactionContext
  ): Promise<MatchException> {
    const client = txContext.tx as PoolClient;

    const result = await client.query(SQL.RESOLVE_EXCEPTION, [
      input.resolutionStatus,
      input.resolvedBy,
      input.resolutionNotes || null,
      id,
      input.tenantId,
    ]);

    if (result.rows.length === 0) {
      throw new Error(`Match exception not found: ${id}`);
    }

    return mapExceptionRow(result.rows[0]);
  }

  async findExceptionById(id: string, tenantId: string): Promise<MatchException | null> {
    const result = await this.pool.query(SQL.FIND_EXCEPTION_BY_ID, [id, tenantId]);
    return result.rows[0] ? mapExceptionRow(result.rows[0]) : null;
  }
}

/**
 * Factory function
 */
export function createSqlMatchingRepository(pool: Pool): MatchingRepositoryPort {
  return new SqlMatchingRepository(pool);
}
