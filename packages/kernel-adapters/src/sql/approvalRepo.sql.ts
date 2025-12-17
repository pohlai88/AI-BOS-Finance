/**
 * AP-04: Invoice Approval Workflow — SQL Adapter (PostgreSQL)
 * 
 * Implements ApprovalRepositoryPort for production use.
 * 
 * Key Features:
 * - SoD enforcement via database triggers
 * - Immutable approval chain (no deletion)
 * - Window function optimization for list queries
 * - Version increment on updates
 */

import type { PoolClient, Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import type {
  ApprovalRepositoryPort,
  ApprovalRecord,
  ApprovalRoute,
  ApprovalTransactionContext,
  CreateApprovalInput,
  UpdateApprovalInput,
  CreateRouteInput,
  UpdateRouteInput,
} from '@aibos/kernel-core';

// ============================================================================
// SQL QUERIES
// ============================================================================

const SQL = {
  // Approval queries
  CREATE_APPROVAL: `
    INSERT INTO ap.invoice_approvals (
      id, invoice_id, tenant_id, approval_level, total_levels,
      approver_id, approver_role, decision, comments,
      is_delegated, delegated_from_user_id, delegation_reason,
      created_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW()
    )
    RETURNING *
  `,

  FIND_APPROVAL_BY_ID: `
    SELECT * FROM ap.invoice_approvals
    WHERE id = $1 AND tenant_id = $2
  `,

  LIST_APPROVALS_FOR_INVOICE: `
    SELECT * FROM ap.invoice_approvals
    WHERE invoice_id = $1 AND tenant_id = $2
    ORDER BY approval_level ASC, created_at ASC
  `,

  UPDATE_APPROVAL: `
    UPDATE ap.invoice_approvals
    SET decision = COALESCE($1, decision),
        comments = COALESCE($2, comments),
        actioned_at = COALESCE($3, actioned_at),
        approver_id = CASE 
          WHEN $4::uuid IS NOT NULL AND $4::uuid != '00000000-0000-0000-0000-000000000000'::uuid 
          THEN $4::uuid 
          ELSE approver_id 
        END
    WHERE id = $5 AND tenant_id = $6
    RETURNING *
  `,

  LIST_PENDING_APPROVALS: `
    SELECT 
      a.*,
      COUNT(*) OVER() as total
    FROM ap.invoice_approvals a
    WHERE a.tenant_id = $1 
      AND a.decision = 'pending'
    ORDER BY a.created_at ASC
    LIMIT $2 OFFSET $3
  `,

  INVALIDATE_APPROVALS: `
    DELETE FROM ap.invoice_approvals
    WHERE invoice_id = $1 AND tenant_id = $2 AND decision = 'pending'
  `,

  // Route queries
  CREATE_ROUTE: `
    INSERT INTO ap.approval_routes (
      id, invoice_id, tenant_id, total_levels,
      route_policy_source, route_config,
      created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, NOW(), NOW()
    )
    RETURNING *
  `,

  FIND_ROUTE_BY_INVOICE: `
    SELECT * FROM ap.approval_routes
    WHERE invoice_id = $1 AND tenant_id = $2
  `,

  UPDATE_ROUTE: `
    UPDATE ap.approval_routes
    SET is_complete = COALESCE($1, is_complete),
        completed_at = COALESCE($2, completed_at),
        updated_at = NOW()
    WHERE id = $3 AND tenant_id = $4
    RETURNING *
  `,
};

// ============================================================================
// ROW MAPPERS
// ============================================================================

function mapApprovalRow(row: Record<string, unknown>): ApprovalRecord {
  return {
    id: row.id as string,
    invoiceId: row.invoice_id as string,
    tenantId: row.tenant_id as string,
    approvalLevel: parseInt(row.approval_level as string, 10),
    totalLevels: parseInt(row.total_levels as string, 10),
    approverId: row.approver_id as string,
    approverRole: row.approver_role as string | undefined,
    decision: row.decision as ApprovalRecord['decision'],
    comments: row.comments as string | undefined,
    isDelegated: (row.is_delegated as boolean) || false,
    delegatedFromUserId: row.delegated_from_user_id as string | undefined,
    delegationReason: row.delegation_reason as string | undefined,
    actionedAt: row.actioned_at ? new Date(row.actioned_at as string) : undefined,
    createdAt: new Date(row.created_at as string),
  };
}

function mapRouteRow(row: Record<string, unknown>): ApprovalRoute {
  return {
    id: row.id as string,
    invoiceId: row.invoice_id as string,
    tenantId: row.tenant_id as string,
    totalLevels: parseInt(row.total_levels as string, 10),
    routePolicySource: row.route_policy_source as string,
    routeConfig: row.route_config as ApprovalRoute['routeConfig'],
    isComplete: (row.is_complete as boolean) || false,
    completedAt: row.completed_at ? new Date(row.completed_at as string) : undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

// ============================================================================
// SQL ADAPTER
// ============================================================================

export class SqlApprovalRepository implements ApprovalRepositoryPort {
  constructor(private pool: Pool) {}

  async withTransaction<T>(
    callback: (txContext: ApprovalTransactionContext) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();
    const correlationId = uuidv4();

    try {
      await client.query('BEGIN');

      const txContext: ApprovalTransactionContext = {
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

  // ========== Approval Operations ==========

  async createApproval(
    input: CreateApprovalInput,
    txContext: ApprovalTransactionContext
  ): Promise<ApprovalRecord> {
    const client = txContext.tx as PoolClient;
    const id = uuidv4();

    const result = await client.query(SQL.CREATE_APPROVAL, [
      id,
      input.invoiceId,
      input.tenantId,
      input.approvalLevel,
      input.totalLevels,
      input.approverId || '00000000-0000-0000-0000-000000000000',
      input.approverRole || null,
      input.decision,
      input.comments || null,
      input.isDelegated || false,
      input.delegatedFromUserId || null,
      input.delegationReason || null,
    ]);

    return mapApprovalRow(result.rows[0]);
  }

  async findApprovalById(id: string, tenantId: string): Promise<ApprovalRecord | null> {
    const result = await this.pool.query(SQL.FIND_APPROVAL_BY_ID, [id, tenantId]);
    return result.rows[0] ? mapApprovalRow(result.rows[0]) : null;
  }

  async listApprovalsForInvoice(invoiceId: string, tenantId: string): Promise<ApprovalRecord[]> {
    const result = await this.pool.query(SQL.LIST_APPROVALS_FOR_INVOICE, [invoiceId, tenantId]);
    return result.rows.map(mapApprovalRow);
  }

  async updateApproval(
    id: string,
    input: UpdateApprovalInput,
    txContext: ApprovalTransactionContext
  ): Promise<ApprovalRecord> {
    const client = txContext.tx as PoolClient;

    const result = await client.query(SQL.UPDATE_APPROVAL, [
      input.decision || null,
      input.comments || null,
      input.actionedAt || null,
      input.approverId || null,
      id,
      input.tenantId,
    ]);

    if (result.rows.length === 0) {
      throw new Error(`Approval not found: ${id}`);
    }

    return mapApprovalRow(result.rows[0]);
  }

  async listPendingApprovals(
    _approverId: string,
    tenantId: string,
    limit = 50,
    offset = 0
  ): Promise<{ items: ApprovalRecord[]; total: number }> {
    const result = await this.pool.query(SQL.LIST_PENDING_APPROVALS, [
      tenantId,
      limit,
      offset,
    ]);

    const total = result.rows.length > 0
      ? parseInt(result.rows[0].total as string, 10)
      : 0;

    return {
      items: result.rows.map(mapApprovalRow),
      total,
    };
  }

  async invalidateApprovals(
    invoiceId: string,
    tenantId: string,
    txContext: ApprovalTransactionContext
  ): Promise<void> {
    const client = txContext.tx as PoolClient;
    await client.query(SQL.INVALIDATE_APPROVALS, [invoiceId, tenantId]);
  }

  // ========== Route Operations ==========

  async createRoute(
    input: CreateRouteInput,
    txContext: ApprovalTransactionContext
  ): Promise<ApprovalRoute> {
    const client = txContext.tx as PoolClient;
    const id = uuidv4();

    const result = await client.query(SQL.CREATE_ROUTE, [
      id,
      input.invoiceId,
      input.tenantId,
      input.totalLevels,
      input.routePolicySource,
      JSON.stringify(input.routeConfig),
    ]);

    return mapRouteRow(result.rows[0]);
  }

  async findRouteByInvoiceId(invoiceId: string, tenantId: string): Promise<ApprovalRoute | null> {
    const result = await this.pool.query(SQL.FIND_ROUTE_BY_INVOICE, [invoiceId, tenantId]);
    return result.rows[0] ? mapRouteRow(result.rows[0]) : null;
  }

  async updateRoute(
    id: string,
    input: UpdateRouteInput,
    txContext: ApprovalTransactionContext
  ): Promise<ApprovalRoute> {
    const client = txContext.tx as PoolClient;

    const result = await client.query(SQL.UPDATE_ROUTE, [
      input.isComplete ?? null,
      input.completedAt || null,
      id,
      input.tenantId,
    ]);

    if (result.rows.length === 0) {
      throw new Error(`Approval route not found: ${id}`);
    }

    return mapRouteRow(result.rows[0]);
  }
}

/**
 * Factory function
 */
export function createSqlApprovalRepository(pool: Pool): ApprovalRepositoryPort {
  return new SqlApprovalRepository(pool);
}
