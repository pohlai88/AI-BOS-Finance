/**
 * TR-02 Cash Pooling - SQL Repository Adapter
 * 
 * PostgreSQL implementation of CashPoolRepositoryPort.
 * 
 * @module TR-02
 */

import { Pool } from 'pg';
import type { CashPoolRepositoryPort } from '@aibos/kernel-core';
import type {
  CashPool,
  CashSweep,
  InterestAllocation,
  PoolConfigChange,
  PoolConfigHistory,
  CashPoolFilter,
  Money,
} from '../../../../apps/canon/finance/dom06-treasury/cells/tr02-cash-pooling/types';

// =============================================================================
// SQL Queries
// =============================================================================

const SQL = {
  // Pool queries
  INSERT_POOL: `
    INSERT INTO treasury.cash_pools (
      tenant_id, pool_code, pool_name, pool_type,
      master_account_id, master_company_id, master_gl_account_code, interest_income_account,
      participants, sweep_frequency, sweep_time, dual_authorization_required,
      interest_rate, interest_calculation_method, interest_allocation_frequency,
      day_count_convention, compounding, skip_non_business_days,
      agreement_reference, agreement_date, jurisdictions,
      interest_benchmark, withholding_tax_rules, entity_limits,
      status, effective_date, deactivation_date,
      created_by, version
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
      $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25,
      $26, $27, $28, $29, 1
    )
    RETURNING *
  `,
  
  SELECT_POOL_BY_ID: `
    SELECT * FROM treasury.cash_pools 
    WHERE id = $1 AND tenant_id = $2
  `,
  
  UPDATE_POOL: `
    UPDATE treasury.cash_pools
    SET 
      pool_name = COALESCE($3, pool_name),
      participants = COALESCE($4::jsonb, participants),
      sweep_frequency = COALESCE($5::treasury_sweep_frequency, sweep_frequency),
      sweep_time = COALESCE($6, sweep_time),
      interest_rate = COALESCE($7, interest_rate),
      status = COALESCE($8::treasury_pool_status, status),
      effective_date = COALESCE($9, effective_date),
      deactivation_date = COALESCE($10, deactivation_date),
      updated_by = $11,
      updated_at = NOW(),
      version = version + 1
    WHERE id = $1 AND tenant_id = $2 AND version = $12
    RETURNING *
  `,
  
  LIST_POOLS: `
    SELECT * FROM treasury.cash_pools
    WHERE tenant_id = $1
      AND ($2::treasury_pool_type[] IS NULL OR pool_type = ANY($2))
      AND ($3::treasury_pool_status[] IS NULL OR status = ANY($3))
      AND ($4::uuid IS NULL OR master_company_id = $4)
      AND ($5::text IS NULL OR pool_name ILIKE '%' || $5 || '%' OR pool_code ILIKE '%' || $5 || '%')
    ORDER BY created_at DESC
    LIMIT $6 OFFSET $7
  `,
  
  COUNT_POOLS: `
    SELECT COUNT(*) as total FROM treasury.cash_pools
    WHERE tenant_id = $1
      AND ($2::treasury_pool_type[] IS NULL OR pool_type = ANY($2))
      AND ($3::treasury_pool_status[] IS NULL OR status = ANY($3))
      AND ($4::uuid IS NULL OR master_company_id = $4)
      AND ($5::text IS NULL OR pool_name ILIKE '%' || $5 || '%' OR pool_code ILIKE '%' || $5 || '%')
  `,
  
  // Sweep queries
  INSERT_SWEEP: `
    INSERT INTO treasury.cash_sweeps (
      tenant_id, pool_id, execution_date, sweep_type,
      participant_account_id, participant_company_id, master_account_id,
      amount, currency, initiator_id, approver1_id, approver2_id,
      participant_journal_entry_id, master_journal_entry_id, ic_loan_id,
      idempotency_key, retry_count, max_retries, next_retry_at,
      status, error_message, payment_id, payment_status,
      balance_source, balance_as_of, version
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11, $12,
      $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, 1
    )
    RETURNING *
  `,
  
  SELECT_SWEEP_BY_ID: `
    SELECT * FROM treasury.cash_sweeps WHERE id = $1
  `,
  
  SELECT_SWEEP_BY_KEY: `
    SELECT * FROM treasury.cash_sweeps WHERE idempotency_key = $1
  `,
  
  SELECT_SWEEPS_BY_POOL: `
    SELECT * FROM treasury.cash_sweeps
    WHERE pool_id = $1
      AND ($2::date IS NULL OR execution_date = $2)
    ORDER BY execution_date DESC, created_at DESC
  `,
  
  UPDATE_SWEEP: `
    UPDATE treasury.cash_sweeps
    SET 
      status = COALESCE($2::treasury_sweep_status, status),
      participant_journal_entry_id = COALESCE($3, participant_journal_entry_id),
      master_journal_entry_id = COALESCE($4, master_journal_entry_id),
      ic_loan_id = COALESCE($5, ic_loan_id),
      payment_id = COALESCE($6, payment_id),
      payment_status = COALESCE($7, payment_status),
      error_message = COALESCE($8, error_message),
      executed_at = COALESCE($9, executed_at),
      reconciled_at = COALESCE($10, reconciled_at),
      retry_count = COALESCE($11, retry_count),
      next_retry_at = COALESCE($12, next_retry_at),
      version = version + 1
    WHERE id = $1 AND version = $13
    RETURNING *
  `,
  
  // Interest allocation queries
  INSERT_INTEREST_ALLOCATION: `
    INSERT INTO treasury.interest_allocations (
      tenant_id, pool_id, participant_account_id, participant_company_id, master_company_id,
      period_start, period_end, interest_amount, calculation_method,
      day_count_convention, compounding, daily_balances,
      participant_journal_entry_id, master_journal_entry_id, ic_loan_id,
      allocated_by, approver1_id, approver2_id, status, version
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11, $12::jsonb,
      $13, $14, $15, $16, $17, $18, $19, 1
    )
    RETURNING *
  `,
  
  SELECT_INTEREST_ALLOCATIONS_BY_POOL: `
    SELECT * FROM treasury.interest_allocations
    WHERE pool_id = $1
      AND ($2::date IS NULL OR period_start >= $2)
      AND ($3::date IS NULL OR period_end <= $3)
    ORDER BY period_start DESC
  `,
  
  // Config change queries
  INSERT_CONFIG_CHANGE: `
    INSERT INTO treasury.pool_config_changes (
      tenant_id, pool_id, change_type, before_value, after_value, diff,
      requested_by, status, pool_version_before, version
    ) VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb, $7, $8, $9, 1)
    RETURNING *
  `,
  
  SELECT_CONFIG_CHANGE_BY_ID: `
    SELECT * FROM treasury.pool_config_changes WHERE id = $1
  `,
  
  SELECT_CONFIG_CHANGES_BY_POOL: `
    SELECT * FROM treasury.pool_config_changes
    WHERE pool_id = $1
      AND ($2::treasury_pool_config_change_status IS NULL OR status = $2)
    ORDER BY requested_at DESC
  `,
  
  UPDATE_CONFIG_CHANGE: `
    UPDATE treasury.pool_config_changes
    SET 
      status = COALESCE($2::treasury_pool_config_change_status, status),
      approved_by = COALESCE($3, approved_by),
      rejected_by = COALESCE($4, rejected_by),
      rejection_reason = COALESCE($5, rejection_reason),
      effective_date = COALESCE($6, effective_date),
      approved_at = COALESCE($7, approved_at),
      rejected_at = COALESCE($8, rejected_at),
      effective_at = COALESCE($9, effective_at),
      pool_version_after = COALESCE($10, pool_version_after),
      version = version + 1
    WHERE id = $1 AND version = $11
    RETURNING *
  `,
  
  // Config history queries
  INSERT_CONFIG_HISTORY: `
    INSERT INTO treasury.pool_config_history (
      tenant_id, pool_id, version, configuration, change_request_id,
      changed_by, changed_at, change_reason, is_current, rolled_back_from_version
    ) VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `,
  
  SELECT_CONFIG_HISTORY_BY_POOL: `
    SELECT * FROM treasury.pool_config_history
    WHERE pool_id = $1
    ORDER BY version DESC
  `,
  
  SELECT_CONFIG_HISTORY_BY_VERSION: `
    SELECT * FROM treasury.pool_config_history
    WHERE pool_id = $1 AND version = $2
  `,
};

// =============================================================================
// Row Mappers
// =============================================================================

function mapPoolRow(row: Record<string, unknown>): CashPool {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    poolCode: row.pool_code as string,
    poolName: row.pool_name as string,
    poolType: row.pool_type as CashPool['poolType'],
    masterAccountId: row.master_account_id as string,
    masterCompanyId: row.master_company_id as string,
    masterGlAccountCode: row.master_gl_account_code as string,
    interestIncomeAccount: row.interest_income_account as string | undefined,
    participants: row.participants as CashPool['participants'],
    sweepFrequency: row.sweep_frequency as CashPool['sweepFrequency'],
    sweepTime: row.sweep_time as string,
    dualAuthorizationRequired: row.dual_authorization_required as boolean,
    interestRate: parseFloat(row.interest_rate as string),
    interestCalculationMethod: row.interest_calculation_method as CashPool['interestCalculationMethod'],
    interestAllocationFrequency: row.interest_allocation_frequency as CashPool['interestAllocationFrequency'],
    dayCountConvention: row.day_count_convention as CashPool['dayCountConvention'],
    compounding: row.compounding as CashPool['compounding'],
    skipNonBusinessDays: row.skip_non_business_days as boolean,
    agreementReference: row.agreement_reference as string,
    agreementDate: new Date(row.agreement_date as string),
    jurisdictions: row.jurisdictions as string[],
    interestBenchmark: row.interest_benchmark as CashPool['interestBenchmark'],
    withholdingTaxRules: row.withholding_tax_rules as CashPool['withholdingTaxRules'],
    entityLimits: row.entity_limits as CashPool['entityLimits'],
    status: row.status as CashPool['status'],
    effectiveDate: row.effective_date ? new Date(row.effective_date as string) : undefined,
    deactivationDate: row.deactivation_date ? new Date(row.deactivation_date as string) : undefined,
    createdBy: row.created_by as string,
    createdAt: new Date(row.created_at as string),
    updatedBy: row.updated_by as string | undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at as string) : undefined,
    version: row.version as number,
  };
}

function mapSweepRow(row: Record<string, unknown>): CashSweep {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    poolId: row.pool_id as string,
    executionDate: new Date(row.execution_date as string),
    sweepType: row.sweep_type as CashSweep['sweepType'],
    participantAccountId: row.participant_account_id as string,
    participantCompanyId: row.participant_company_id as string,
    masterAccountId: row.master_account_id as string,
    amount: row.amount as Money,
    currency: row.currency as string,
    initiatorId: row.initiator_id as string,
    approver1Id: row.approver1_id as string,
    approver2Id: row.approver2_id as string,
    participantJournalEntryId: row.participant_journal_entry_id as string | undefined,
    masterJournalEntryId: row.master_journal_entry_id as string | undefined,
    icLoanId: row.ic_loan_id as string | undefined,
    idempotencyKey: row.idempotency_key as string,
    retryCount: row.retry_count as number,
    maxRetries: row.max_retries as number,
    nextRetryAt: row.next_retry_at ? new Date(row.next_retry_at as string) : undefined,
    status: row.status as CashSweep['status'],
    errorMessage: row.error_message as string | undefined,
    paymentId: row.payment_id as string | undefined,
    paymentStatus: row.payment_status as string | undefined,
    balanceSource: row.balance_source as CashSweep['balanceSource'],
    balanceAsOf: new Date(row.balance_as_of as string),
    createdAt: new Date(row.created_at as string),
    executedAt: row.executed_at ? new Date(row.executed_at as string) : undefined,
    reconciledAt: row.reconciled_at ? new Date(row.reconciled_at as string) : undefined,
    version: row.version as number,
  };
}

function mapInterestAllocationRow(row: Record<string, unknown>): InterestAllocation {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    poolId: row.pool_id as string,
    participantAccountId: row.participant_account_id as string,
    participantCompanyId: row.participant_company_id as string,
    masterCompanyId: row.master_company_id as string,
    periodStart: new Date(row.period_start as string),
    periodEnd: new Date(row.period_end as string),
    interestAmount: row.interest_amount as Money,
    calculationMethod: row.calculation_method as InterestAllocation['calculationMethod'],
    dayCountConvention: row.day_count_convention as InterestAllocation['dayCountConvention'],
    compounding: row.compounding as InterestAllocation['compounding'],
    dailyBalances: (row.daily_balances as InterestAllocation['dailyBalances']) || [],
    participantJournalEntryId: row.participant_journal_entry_id as string | undefined,
    masterJournalEntryId: row.master_journal_entry_id as string | undefined,
    icLoanId: row.ic_loan_id as string | undefined,
    allocatedBy: row.allocated_by as string,
    approver1Id: row.approver1_id as string,
    approver2Id: row.approver2_id as string,
    status: row.status as InterestAllocation['status'],
    createdAt: new Date(row.created_at as string),
    allocatedAt: row.allocated_at ? new Date(row.allocated_at as string) : undefined,
    version: row.version as number,
  };
}

function mapConfigChangeRow(row: Record<string, unknown>): PoolConfigChange {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    poolId: row.pool_id as string,
    changeType: row.change_type as PoolConfigChange['changeType'],
    beforeValue: row.before_value as Record<string, unknown>,
    afterValue: row.after_value as Record<string, unknown>,
    diff: (row.diff as PoolConfigChange['diff']) || [],
    requestedBy: row.requested_by as string,
    approvedBy: row.approved_by as string | undefined,
    rejectedBy: row.rejected_by as string | undefined,
    rejectionReason: row.rejection_reason as string | undefined,
    effectiveDate: row.effective_date ? new Date(row.effective_date as string) : undefined,
    status: row.status as PoolConfigChange['status'],
    poolVersionBefore: row.pool_version_before as number,
    poolVersionAfter: row.pool_version_after as number | undefined,
    requestedAt: new Date(row.requested_at as string),
    approvedAt: row.approved_at ? new Date(row.approved_at as string) : undefined,
    rejectedAt: row.rejected_at ? new Date(row.rejected_at as string) : undefined,
    effectiveAt: row.effective_at ? new Date(row.effective_at as string) : undefined,
    version: row.version as number,
  };
}

function mapConfigHistoryRow(row: Record<string, unknown>): PoolConfigHistory {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    poolId: row.pool_id as string,
    version: row.version as number,
    configuration: row.configuration as CashPool,
    changeRequestId: row.change_request_id as string | undefined,
    changedBy: row.changed_by as string,
    changedAt: new Date(row.changed_at as string),
    changeReason: row.change_reason as string | undefined,
    isCurrent: row.is_current as boolean,
    rolledBackFromVersion: row.rolled_back_from_version as number | undefined,
  };
}

// =============================================================================
// SQL Repository Implementation
// =============================================================================

export class SqlCashPoolRepository implements CashPoolRepositoryPort {
  constructor(private db: Pool) {}

  // Pool CRUD
  async create(data: Omit<CashPool, 'id' | 'version' | 'createdAt'>): Promise<CashPool> {
    const result = await this.db.query(SQL.INSERT_POOL, [
      data.tenantId,
      data.poolCode,
      data.poolName,
      data.poolType,
      data.masterAccountId,
      data.masterCompanyId,
      data.masterGlAccountCode,
      data.interestIncomeAccount || null,
      JSON.stringify(data.participants),
      data.sweepFrequency,
      data.sweepTime,
      data.dualAuthorizationRequired,
      data.interestRate,
      data.interestCalculationMethod,
      data.interestAllocationFrequency,
      data.dayCountConvention,
      data.compounding,
      data.skipNonBusinessDays,
      data.agreementReference,
      data.agreementDate,
      data.jurisdictions,
      JSON.stringify(data.interestBenchmark),
      JSON.stringify(data.withholdingTaxRules),
      JSON.stringify(data.entityLimits),
      data.status,
      data.effectiveDate || null,
      data.deactivationDate || null,
      data.createdBy,
    ]);

    return mapPoolRow(result.rows[0]);
  }

  async findById(id: string, tenantId: string): Promise<CashPool | null> {
    const result = await this.db.query(SQL.SELECT_POOL_BY_ID, [id, tenantId]);
    if (result.rows.length === 0) return null;
    return mapPoolRow(result.rows[0]);
  }

  async update(
    id: string,
    tenantId: string,
    data: Partial<CashPool>,
    expectedVersion: number
  ): Promise<CashPool> {
    const result = await this.db.query(SQL.UPDATE_POOL, [
      id,
      tenantId,
      data.poolName || null,
      data.participants ? JSON.stringify(data.participants) : null,
      data.sweepFrequency || null,
      data.sweepTime || null,
      data.interestRate !== undefined ? data.interestRate : null,
      data.status || null,
      data.effectiveDate || null,
      data.deactivationDate || null,
      data.updatedBy || null,
      expectedVersion,
    ]);

    if (result.rows.length === 0) {
      throw new Error('Version conflict or pool not found');
    }

    return mapPoolRow(result.rows[0]);
  }

  async list(
    filter: CashPoolFilter,
    limit: number,
    offset: number
  ): Promise<{ data: CashPool[]; total: number }> {
    const typeArray = filter.poolType
      ? Array.isArray(filter.poolType)
        ? filter.poolType
        : [filter.poolType]
      : null;

    const statusArray = filter.status
      ? Array.isArray(filter.status)
        ? filter.status
        : [filter.status]
      : null;

    const [dataResult, countResult] = await Promise.all([
      this.db.query(SQL.LIST_POOLS, [
        filter.tenantId,
        typeArray,
        statusArray,
        filter.masterCompanyId || null,
        filter.search || null,
        limit,
        offset,
      ]),
      this.db.query(SQL.COUNT_POOLS, [
        filter.tenantId,
        typeArray,
        statusArray,
        filter.masterCompanyId || null,
        filter.search || null,
      ]),
    ]);

    return {
      data: dataResult.rows.map(mapPoolRow),
      total: parseInt(countResult.rows[0].total as string, 10),
    };
  }

  // Sweeps
  async createSweep(data: Omit<CashSweep, 'id' | 'version' | 'createdAt'>): Promise<CashSweep> {
    const result = await this.db.query(SQL.INSERT_SWEEP, [
      data.tenantId,
      data.poolId,
      data.executionDate,
      data.sweepType,
      data.participantAccountId,
      data.participantCompanyId,
      data.masterAccountId,
      JSON.stringify(data.amount),
      data.currency,
      data.initiatorId,
      data.approver1Id,
      data.approver2Id,
      data.participantJournalEntryId || null,
      data.masterJournalEntryId || null,
      data.icLoanId || null,
      data.idempotencyKey,
      data.retryCount,
      data.maxRetries,
      data.nextRetryAt || null,
      data.status,
      data.errorMessage || null,
      data.paymentId || null,
      data.paymentStatus || null,
      data.balanceSource,
      data.balanceAsOf,
    ]);

    return mapSweepRow(result.rows[0]);
  }

  async findSweepById(id: string): Promise<CashSweep | null> {
    const result = await this.db.query(SQL.SELECT_SWEEP_BY_ID, [id]);
    if (result.rows.length === 0) return null;
    return mapSweepRow(result.rows[0]);
  }

  async findSweepByKey(idempotencyKey: string): Promise<CashSweep | null> {
    const result = await this.db.query(SQL.SELECT_SWEEP_BY_KEY, [idempotencyKey]);
    if (result.rows.length === 0) return null;
    return mapSweepRow(result.rows[0]);
  }

  async findSweepsByPool(poolId: string, executionDate?: Date): Promise<CashSweep[]> {
    const result = await this.db.query(SQL.SELECT_SWEEPS_BY_POOL, [poolId, executionDate || null]);
    return result.rows.map(mapSweepRow);
  }

  async updateSweep(
    id: string,
    data: Partial<CashSweep>,
    expectedVersion: number
  ): Promise<CashSweep> {
    const result = await this.db.query(SQL.UPDATE_SWEEP, [
      id,
      data.status || null,
      data.participantJournalEntryId || null,
      data.masterJournalEntryId || null,
      data.icLoanId || null,
      data.paymentId || null,
      data.paymentStatus || null,
      data.errorMessage || null,
      data.executedAt || null,
      data.reconciledAt || null,
      data.retryCount !== undefined ? data.retryCount : null,
      data.nextRetryAt || null,
      expectedVersion,
    ]);

    if (result.rows.length === 0) {
      throw new Error('Version conflict or sweep not found');
    }

    return mapSweepRow(result.rows[0]);
  }

  // Interest Allocations
  async createInterestAllocation(
    data: Omit<InterestAllocation, 'id' | 'version' | 'createdAt'>
  ): Promise<InterestAllocation> {
    const result = await this.db.query(SQL.INSERT_INTEREST_ALLOCATION, [
      data.tenantId,
      data.poolId,
      data.participantAccountId,
      data.participantCompanyId,
      data.masterCompanyId,
      data.periodStart,
      data.periodEnd,
      JSON.stringify(data.interestAmount),
      data.calculationMethod,
      data.dayCountConvention,
      data.compounding,
      JSON.stringify(data.dailyBalances),
      data.participantJournalEntryId || null,
      data.masterJournalEntryId || null,
      data.icLoanId || null,
      data.allocatedBy,
      data.approver1Id,
      data.approver2Id,
      data.status,
    ]);

    return mapInterestAllocationRow(result.rows[0]);
  }

  async findInterestAllocationsByPool(
    poolId: string,
    periodStart?: Date,
    periodEnd?: Date
  ): Promise<InterestAllocation[]> {
    const result = await this.db.query(SQL.SELECT_INTEREST_ALLOCATIONS_BY_POOL, [
      poolId,
      periodStart || null,
      periodEnd || null,
    ]);
    return result.rows.map(mapInterestAllocationRow);
  }

  // Config Changes
  async createConfigChange(
    data: Omit<PoolConfigChange, 'id' | 'version' | 'requestedAt'>
  ): Promise<PoolConfigChange> {
    const result = await this.db.query(SQL.INSERT_CONFIG_CHANGE, [
      data.tenantId,
      data.poolId,
      data.changeType,
      JSON.stringify(data.beforeValue),
      JSON.stringify(data.afterValue),
      JSON.stringify(data.diff),
      data.requestedBy,
      data.status,
      data.poolVersionBefore,
    ]);

    return mapConfigChangeRow(result.rows[0]);
  }

  async findConfigChangeById(id: string): Promise<PoolConfigChange | null> {
    const result = await this.db.query(SQL.SELECT_CONFIG_CHANGE_BY_ID, [id]);
    if (result.rows.length === 0) return null;
    return mapConfigChangeRow(result.rows[0]);
  }

  async findConfigChangesByPool(
    poolId: string,
    status?: PoolConfigChange['status']
  ): Promise<PoolConfigChange[]> {
    const result = await this.db.query(SQL.SELECT_CONFIG_CHANGES_BY_POOL, [poolId, status || null]);
    return result.rows.map(mapConfigChangeRow);
  }

  async updateConfigChange(
    id: string,
    data: Partial<PoolConfigChange>,
    expectedVersion: number
  ): Promise<PoolConfigChange> {
    const result = await this.db.query(SQL.UPDATE_CONFIG_CHANGE, [
      id,
      data.status || null,
      data.approvedBy || null,
      data.rejectedBy || null,
      data.rejectionReason || null,
      data.effectiveDate || null,
      data.approvedAt || null,
      data.rejectedAt || null,
      data.effectiveAt || null,
      data.poolVersionAfter || null,
      expectedVersion,
    ]);

    if (result.rows.length === 0) {
      throw new Error('Version conflict or config change not found');
    }

    return mapConfigChangeRow(result.rows[0]);
  }

  // Config History
  async createConfigHistory(
    data: Omit<PoolConfigHistory, 'id'>
  ): Promise<PoolConfigHistory> {
    const result = await this.db.query(SQL.INSERT_CONFIG_HISTORY, [
      data.tenantId,
      data.poolId,
      data.version,
      JSON.stringify(data.configuration),
      data.changeRequestId || null,
      data.changedBy,
      data.changedAt,
      data.changeReason || null,
      data.isCurrent,
      data.rolledBackFromVersion || null,
    ]);

    return mapConfigHistoryRow(result.rows[0]);
  }

  async findConfigHistoryByPool(poolId: string): Promise<PoolConfigHistory[]> {
    const result = await this.db.query(SQL.SELECT_CONFIG_HISTORY_BY_POOL, [poolId]);
    return result.rows.map(mapConfigHistoryRow);
  }

  async findConfigHistoryByVersion(
    poolId: string,
    version: number
  ): Promise<PoolConfigHistory | null> {
    const result = await this.db.query(SQL.SELECT_CONFIG_HISTORY_BY_VERSION, [poolId, version]);
    if (result.rows.length === 0) return null;
    return mapConfigHistoryRow(result.rows[0]);
  }
}
