/**
 * TR-05 Bank Reconciliation - SQL Repository Adapter
 * 
 * PostgreSQL implementation of ReconciliationRepositoryPort.
 * 
 * @module TR-05
 */

import { Pool } from 'pg';
import type { ReconciliationRepositoryPort } from '@aibos/kernel-core';
import type {
  BankStatement,
  StatementItem,
  ReconMatch,
  ReconMatchAllocation,
  BankAccountBalanceSnapshot,
  ReconciliationFilter,
  Money,
} from '../../../../apps/canon/finance/dom06-treasury/cells/tr05-bank-reconciliation/types';

// =============================================================================
// SQL Queries
// =============================================================================

const SQL = {
  // Statement queries
  INSERT_STATEMENT: `
    INSERT INTO treasury.bank_statements (
      tenant_id, bank_account_id, statement_number, statement_date,
      period_start, period_end, opening_balance_date, closing_balance_date,
      opening_balance, closing_balance, currency,
      gl_balance, adjusted_gl_balance, difference,
      status, exception_reason, exception_threshold, escalated_to,
      import_format, import_source, file_hash,
      total_items, matched_items, unmatched_items,
      imported_by, imported_at, finalized_by, finalized_at,
      approver1_id, approver2_id, notes, version
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8,
      $9, $10, $11,
      $12, $13, $14,
      $15, $16, $17, $18,
      $19, $20, $21,
      $22, $23, $24,
      $25, $26, $27, $28,
      $29, $30, $31, 1
    )
    RETURNING *
  `,
  
  SELECT_STATEMENT_BY_ID: `
    SELECT * FROM treasury.bank_statements 
    WHERE id = $1 AND tenant_id = $2
  `,
  
  SELECT_STATEMENT_BY_KEYS: `
    SELECT * FROM treasury.bank_statements
    WHERE bank_account_id = $1
      AND statement_number = $2
      AND statement_date = $3
      AND opening_balance = $4::jsonb
      AND closing_balance = $5::jsonb
      AND period_start = $6
      AND period_end = $7
    LIMIT 1
  `,
  
  UPDATE_STATEMENT: `
    UPDATE treasury.bank_statements
    SET 
      gl_balance = COALESCE($3::jsonb, gl_balance),
      adjusted_gl_balance = COALESCE($4::jsonb, adjusted_gl_balance),
      difference = COALESCE($5::jsonb, difference),
      status = COALESCE($6::treasury_reconciliation_status, status),
      exception_reason = COALESCE($7, exception_reason),
      exception_threshold = COALESCE($8::jsonb, exception_threshold),
      escalated_to = COALESCE($9, escalated_to),
      matched_items = COALESCE($10, matched_items),
      unmatched_items = COALESCE($11, unmatched_items),
      finalized_by = COALESCE($12, finalized_by),
      finalized_at = COALESCE($13, finalized_at),
      approver1_id = COALESCE($14, approver1_id),
      approver2_id = COALESCE($15, approver2_id),
      notes = COALESCE($16, notes),
      version = version + 1
    WHERE id = $1 AND tenant_id = $2 AND version = $17
    RETURNING *
  `,
  
  LIST_STATEMENTS: `
    SELECT * FROM treasury.bank_statements
    WHERE tenant_id = $1
      AND ($2::uuid IS NULL OR bank_account_id = $2)
      AND ($3::treasury_reconciliation_status[] IS NULL OR status = ANY($3))
      AND ($4::date IS NULL OR period_start >= $4)
      AND ($5::date IS NULL OR period_end <= $5)
      AND ($6::text IS NULL OR statement_number ILIKE '%' || $6 || '%')
    ORDER BY statement_date DESC, created_at DESC
    LIMIT $7 OFFSET $8
  `,
  
  COUNT_STATEMENTS: `
    SELECT COUNT(*) as total FROM treasury.bank_statements
    WHERE tenant_id = $1
      AND ($2::uuid IS NULL OR bank_account_id = $2)
      AND ($3::treasury_reconciliation_status[] IS NULL OR status = ANY($3))
      AND ($4::date IS NULL OR period_start >= $4)
      AND ($5::date IS NULL OR period_end <= $5)
      AND ($6::text IS NULL OR statement_number ILIKE '%' || $6 || '%')
  `,
  
  // Statement item queries
  INSERT_STATEMENT_ITEM: `
    INSERT INTO treasury.statement_items (
      statement_id, value_date, entry_date, amount, debit_credit,
      reference, description, counterparty, status, reconciling_item_type,
      expected_clearing_date
    ) VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `,
  
  SELECT_STATEMENT_ITEMS_BY_STATEMENT: `
    SELECT * FROM treasury.statement_items
    WHERE statement_id = $1
    ORDER BY value_date ASC, entry_date ASC
  `,
  
  SELECT_UNMATCHED_ITEMS: `
    SELECT * FROM treasury.statement_items
    WHERE statement_id = $1 AND status = 'unmatched'
    ORDER BY value_date ASC
  `,
  
  UPDATE_STATEMENT_ITEM: `
    UPDATE treasury.statement_items
    SET 
      status = COALESCE($2::treasury_statement_item_status, status),
      reconciling_item_type = COALESCE($3::treasury_reconciling_item_type, reconciling_item_type),
      expected_clearing_date = COALESCE($4, expected_clearing_date)
    WHERE id = $1
    RETURNING *
  `,
  
  // Match queries
  INSERT_MATCH: `
    INSERT INTO treasury.recon_matches (
      tenant_id, statement_id, bank_item_id, gl_transaction_id,
      match_type, allocated_amount, confidence, match_reason,
      status, matched_by, matched_at, idempotency_key, version
    ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11, $12, 1)
    RETURNING *
  `,
  
  SELECT_MATCHES_BY_STATEMENT: `
    SELECT * FROM treasury.recon_matches
    WHERE statement_id = $1
    ORDER BY matched_at DESC
  `,
  
  SELECT_MATCH_BY_ID: `
    SELECT * FROM treasury.recon_matches WHERE id = $1
  `,
  
  UPDATE_MATCH: `
    UPDATE treasury.recon_matches
    SET 
      status = COALESCE($2::treasury_match_status, status),
      unmatched_reason = COALESCE($3, unmatched_reason),
      unmatched_by = COALESCE($4, unmatched_by),
      unmatched_at = COALESCE($5, unmatched_at),
      superseded_by_version = COALESCE($6, superseded_by_version),
      version = version + 1
    WHERE id = $1 AND version = $7
    RETURNING *
  `,
  
  // Match allocation queries
  INSERT_MATCH_ALLOCATION: `
    INSERT INTO treasury.recon_match_allocations (
      match_id, bank_item_id, gl_transaction_id, allocated_amount, allocation_order
    ) VALUES ($1, $2, $3, $4::jsonb, $5)
    RETURNING *
  `,
  
  SELECT_MATCH_ALLOCATIONS_BY_MATCH: `
    SELECT * FROM treasury.recon_match_allocations
    WHERE match_id = $1
    ORDER BY allocation_order ASC
  `,
  
  // Balance snapshot queries
  INSERT_BALANCE_SNAPSHOT: `
    INSERT INTO treasury.bank_account_balance_snapshots (
      tenant_id, bank_account_id, statement_id, balance_date,
      balance, source, reconciled_at, reconciled_by
    ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8)
    RETURNING *
  `,
  
  SELECT_LATEST_BALANCE_SNAPSHOT: `
    SELECT * FROM treasury.bank_account_balance_snapshots
    WHERE bank_account_id = $1 AND tenant_id = $2
    ORDER BY balance_date DESC, created_at DESC
    LIMIT 1
  `,
};

// =============================================================================
// Row Mappers
// =============================================================================

function mapStatementRow(row: Record<string, unknown>): BankStatement {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    bankAccountId: row.bank_account_id as string,
    statementNumber: row.statement_number as string,
    statementDate: new Date(row.statement_date as string),
    periodStart: new Date(row.period_start as string),
    periodEnd: new Date(row.period_end as string),
    openingBalanceDate: new Date(row.opening_balance_date as string),
    closingBalanceDate: new Date(row.closing_balance_date as string),
    openingBalance: row.opening_balance as Money,
    closingBalance: row.closing_balance as Money,
    currency: row.currency as string,
    glBalance: row.gl_balance as Money | undefined,
    adjustedGLBalance: row.adjusted_gl_balance as Money | undefined,
    difference: row.difference as Money | undefined,
    status: row.status as BankStatement['status'],
    exceptionReason: row.exception_reason as string | undefined,
    exceptionThreshold: row.exception_threshold as Money | undefined,
    escalatedTo: row.escalated_to as 'ic_manager' | 'controller' | 'cfo' | undefined,
    importFormat: row.import_format as BankStatement['importFormat'],
    importSource: row.import_source as string | undefined,
    fileHash: row.file_hash as string | undefined,
    totalItems: row.total_items as number,
    matchedItems: row.matched_items as number,
    unmatchedItems: row.unmatched_items as number,
    importedBy: row.imported_by as string,
    importedAt: new Date(row.imported_at as string),
    finalizedBy: row.finalized_by as string | undefined,
    finalizedAt: row.finalized_at ? new Date(row.finalized_at as string) : undefined,
    approver1Id: row.approver1_id as string | undefined,
    approver2Id: row.approver2_id as string | undefined,
    notes: row.notes as string | undefined,
    version: row.version as number,
  };
}

function mapStatementItemRow(row: Record<string, unknown>): StatementItem {
  return {
    id: row.id as string,
    statementId: row.statement_id as string,
    valueDate: new Date(row.value_date as string),
    entryDate: new Date(row.entry_date as string),
    amount: row.amount as Money,
    debitCredit: row.debit_credit as 'D' | 'C',
    reference: row.reference as string,
    description: row.description as string,
    counterparty: row.counterparty as string | undefined,
    status: row.status as StatementItem['status'],
    reconcilingItemType: row.reconciling_item_type as StatementItem['reconcilingItemType'],
    expectedClearingDate: row.expected_clearing_date ? new Date(row.expected_clearing_date as string) : undefined,
  };
}

function mapMatchRow(row: Record<string, unknown>): ReconMatch {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    statementId: row.statement_id as string,
    bankItemId: row.bank_item_id as string | undefined,
    glTransactionId: row.gl_transaction_id as string | undefined,
    matchType: row.match_type as ReconMatch['matchType'],
    allocatedAmount: row.allocated_amount as Money,
    confidence: parseFloat(row.confidence as string),
    matchReason: row.match_reason as string | undefined,
    status: row.status as ReconMatch['status'],
    unmatchedReason: row.unmatched_reason as string | undefined,
    unmatchedBy: row.unmatched_by as string | undefined,
    unmatchedAt: row.unmatched_at ? new Date(row.unmatched_at as string) : undefined,
    matchedBy: row.matched_by as string,
    matchedAt: new Date(row.matched_at as string),
    idempotencyKey: row.idempotency_key as string | undefined,
    version: row.version as number,
    supersededByVersion: row.superseded_by_version as number | undefined,
  };
}

function mapMatchAllocationRow(row: Record<string, unknown>): ReconMatchAllocation {
  return {
    id: row.id as string,
    matchId: row.match_id as string,
    bankItemId: row.bank_item_id as string | undefined,
    glTransactionId: row.gl_transaction_id as string | undefined,
    allocatedAmount: row.allocated_amount as Money,
    allocationOrder: row.allocation_order as number,
    createdAt: new Date(row.created_at as string),
  };
}

function mapBalanceSnapshotRow(row: Record<string, unknown>): BankAccountBalanceSnapshot {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    bankAccountId: row.bank_account_id as string,
    statementId: row.statement_id as string,
    balanceDate: new Date(row.balance_date as string),
    balance: row.balance as Money,
    source: row.source as BankAccountBalanceSnapshot['source'],
    reconciledAt: new Date(row.reconciled_at as string),
    reconciledBy: row.reconciled_by as string,
    createdAt: new Date(row.created_at as string),
  };
}

// =============================================================================
// SQL Repository Implementation
// =============================================================================

export class SqlReconciliationRepository implements ReconciliationRepositoryPort {
  constructor(private db: Pool) {}

  // Statement CRUD
  async createStatement(data: Omit<BankStatement, 'id' | 'version'>): Promise<BankStatement> {
    const result = await this.db.query(SQL.INSERT_STATEMENT, [
      data.tenantId,
      data.bankAccountId,
      data.statementNumber,
      data.statementDate,
      data.periodStart,
      data.periodEnd,
      data.openingBalanceDate,
      data.closingBalanceDate,
      JSON.stringify(data.openingBalance),
      JSON.stringify(data.closingBalance),
      data.currency,
      data.glBalance ? JSON.stringify(data.glBalance) : null,
      data.adjustedGLBalance ? JSON.stringify(data.adjustedGLBalance) : null,
      data.difference ? JSON.stringify(data.difference) : null,
      data.status,
      data.exceptionReason || null,
      data.exceptionThreshold ? JSON.stringify(data.exceptionThreshold) : null,
      data.escalatedTo || null,
      data.importFormat,
      data.importSource || null,
      data.fileHash || null,
      data.totalItems,
      data.matchedItems,
      data.unmatchedItems,
      data.importedBy,
      data.importedAt,
      data.finalizedBy || null,
      data.finalizedAt || null,
      data.approver1Id || null,
      data.approver2Id || null,
      data.notes || null,
    ]);

    return mapStatementRow(result.rows[0]);
  }

  async findStatementById(id: string, tenantId: string): Promise<BankStatement | null> {
    const result = await this.db.query(SQL.SELECT_STATEMENT_BY_ID, [id, tenantId]);
    if (result.rows.length === 0) return null;
    return mapStatementRow(result.rows[0]);
  }

  async findStatementByKeys(keys: {
    bankAccountId: string;
    statementNumber: string;
    statementDate: Date;
    openingBalance: Money;
    closingBalance: Money;
    periodStart: Date;
    periodEnd: Date;
  }): Promise<BankStatement | null> {
    const result = await this.db.query(SQL.SELECT_STATEMENT_BY_KEYS, [
      keys.bankAccountId,
      keys.statementNumber,
      keys.statementDate,
      JSON.stringify(keys.openingBalance),
      JSON.stringify(keys.closingBalance),
      keys.periodStart,
      keys.periodEnd,
    ]);
    if (result.rows.length === 0) return null;
    return mapStatementRow(result.rows[0]);
  }

  async updateStatement(
    id: string,
    tenantId: string,
    data: Partial<BankStatement>,
    expectedVersion: number
  ): Promise<BankStatement> {
    const result = await this.db.query(SQL.UPDATE_STATEMENT, [
      id,
      tenantId,
      data.glBalance ? JSON.stringify(data.glBalance) : null,
      data.adjustedGLBalance ? JSON.stringify(data.adjustedGLBalance) : null,
      data.difference ? JSON.stringify(data.difference) : null,
      data.status || null,
      data.exceptionReason || null,
      data.exceptionThreshold ? JSON.stringify(data.exceptionThreshold) : null,
      data.escalatedTo || null,
      data.matchedItems !== undefined ? data.matchedItems : null,
      data.unmatchedItems !== undefined ? data.unmatchedItems : null,
      data.finalizedBy || null,
      data.finalizedAt || null,
      data.approver1Id || null,
      data.approver2Id || null,
      data.notes || null,
      expectedVersion,
    ]);

    if (result.rows.length === 0) {
      throw new Error('Version conflict or statement not found');
    }

    return mapStatementRow(result.rows[0]);
  }

  async listStatements(
    filter: ReconciliationFilter,
    limit: number,
    offset: number
  ): Promise<{ data: BankStatement[]; total: number }> {
    const statusArray = filter.status
      ? Array.isArray(filter.status)
        ? filter.status
        : [filter.status]
      : null;

    const [dataResult, countResult] = await Promise.all([
      this.db.query(SQL.LIST_STATEMENTS, [
        filter.tenantId,
        filter.bankAccountId || null,
        statusArray,
        filter.periodStart || null,
        filter.periodEnd || null,
        filter.search || null,
        limit,
        offset,
      ]),
      this.db.query(SQL.COUNT_STATEMENTS, [
        filter.tenantId,
        filter.bankAccountId || null,
        statusArray,
        filter.periodStart || null,
        filter.periodEnd || null,
        filter.search || null,
      ]),
    ]);

    return {
      data: dataResult.rows.map(mapStatementRow),
      total: parseInt(countResult.rows[0].total as string, 10),
    };
  }

  // Statement Items
  async createStatementItem(data: Omit<StatementItem, 'id'>): Promise<StatementItem> {
    const result = await this.db.query(SQL.INSERT_STATEMENT_ITEM, [
      data.statementId,
      data.valueDate,
      data.entryDate,
      JSON.stringify(data.amount),
      data.debitCredit,
      data.reference || null,
      data.description,
      data.counterparty || null,
      data.status,
      data.reconcilingItemType || null,
      data.expectedClearingDate || null,
    ]);

    return mapStatementItemRow(result.rows[0]);
  }

  async findStatementItemsByStatement(statementId: string): Promise<StatementItem[]> {
    const result = await this.db.query(SQL.SELECT_STATEMENT_ITEMS_BY_STATEMENT, [statementId]);
    return result.rows.map(mapStatementItemRow);
  }

  async findUnmatchedItems(statementId: string): Promise<StatementItem[]> {
    const result = await this.db.query(SQL.SELECT_UNMATCHED_ITEMS, [statementId]);
    return result.rows.map(mapStatementItemRow);
  }

  async updateStatementItem(id: string, data: Partial<StatementItem>): Promise<StatementItem> {
    const result = await this.db.query(SQL.UPDATE_STATEMENT_ITEM, [
      id,
      data.status || null,
      data.reconcilingItemType || null,
      data.expectedClearingDate || null,
    ]);

    return mapStatementItemRow(result.rows[0]);
  }

  // Matches
  async createMatch(data: Omit<ReconMatch, 'id' | 'matchedAt' | 'version'>): Promise<ReconMatch> {
    const result = await this.db.query(SQL.INSERT_MATCH, [
      data.tenantId,
      data.statementId,
      data.bankItemId || null,
      data.glTransactionId || null,
      data.matchType,
      JSON.stringify(data.allocatedAmount),
      data.confidence,
      data.matchReason || null,
      data.status,
      data.matchedBy,
      new Date(),
      data.idempotencyKey || null,
    ]);

    return mapMatchRow(result.rows[0]);
  }

  async findMatchesByStatement(statementId: string): Promise<ReconMatch[]> {
    const result = await this.db.query(SQL.SELECT_MATCHES_BY_STATEMENT, [statementId]);
    return result.rows.map(mapMatchRow);
  }

  async findMatchById(id: string): Promise<ReconMatch | null> {
    const result = await this.db.query(SQL.SELECT_MATCH_BY_ID, [id]);
    if (result.rows.length === 0) return null;
    return mapMatchRow(result.rows[0]);
  }

  async updateMatch(
    id: string,
    data: Partial<ReconMatch>,
    expectedVersion: number
  ): Promise<ReconMatch> {
    const result = await this.db.query(SQL.UPDATE_MATCH, [
      id,
      data.status || null,
      data.unmatchedReason || null,
      data.unmatchedBy || null,
      data.unmatchedAt || null,
      data.supersededByVersion || null,
      expectedVersion,
    ]);

    if (result.rows.length === 0) {
      throw new Error('Version conflict or match not found');
    }

    return mapMatchRow(result.rows[0]);
  }

  // Match Allocations
  async createMatchAllocation(
    data: Omit<ReconMatchAllocation, 'id' | 'createdAt'>
  ): Promise<ReconMatchAllocation> {
    const result = await this.db.query(SQL.INSERT_MATCH_ALLOCATION, [
      data.matchId,
      data.bankItemId || null,
      data.glTransactionId || null,
      JSON.stringify(data.allocatedAmount),
      data.allocationOrder,
    ]);

    return mapMatchAllocationRow(result.rows[0]);
  }

  async findMatchAllocationsByMatch(matchId: string): Promise<ReconMatchAllocation[]> {
    const result = await this.db.query(SQL.SELECT_MATCH_ALLOCATIONS_BY_MATCH, [matchId]);
    return result.rows.map(mapMatchAllocationRow);
  }

  // Balance Snapshots
  async createBalanceSnapshot(
    data: Omit<BankAccountBalanceSnapshot, 'id' | 'createdAt'>
  ): Promise<BankAccountBalanceSnapshot> {
    const result = await this.db.query(SQL.INSERT_BALANCE_SNAPSHOT, [
      data.tenantId,
      data.bankAccountId,
      data.statementId,
      data.balanceDate,
      JSON.stringify(data.balance),
      data.source,
      data.reconciledAt,
      data.reconciledBy,
    ]);

    return mapBalanceSnapshotRow(result.rows[0]);
  }

  async findLatestBalanceSnapshot(
    bankAccountId: string,
    tenantId: string
  ): Promise<BankAccountBalanceSnapshot | null> {
    const result = await this.db.query(SQL.SELECT_LATEST_BALANCE_SNAPSHOT, [
      bankAccountId,
      tenantId,
    ]);
    if (result.rows.length === 0) return null;
    return mapBalanceSnapshotRow(result.rows[0]);
  }
}
