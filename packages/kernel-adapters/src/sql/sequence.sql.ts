/**
 * Sequence Adapter - SQL Implementation (PostgreSQL)
 * 
 * Implements SequencePort for governed sequence generation.
 * Uses PostgreSQL sequences for atomic, gap-free number generation.
 * 
 * @file packages/kernel-adapters/src/sql/sequence.sql.ts
 */

import type { Pool, PoolClient } from 'pg';
import type {
  SequencePort,
  SequenceConfig,
  SequenceResult,
  SequenceInfo,
  SequenceType,
} from '@aibos/kernel-core';
import { getSequencePrefix, formatSequenceNumber } from '@aibos/kernel-core';

// ============================================================================
// 1. SQL QUERIES
// ============================================================================

const SQL = {
  // Create sequence tracking table
  CREATE_SEQUENCE_TABLE: `
    CREATE TABLE IF NOT EXISTS kernel.sequences (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      tenant_id UUID NOT NULL,
      company_id UUID,
      sequence_type VARCHAR(50) NOT NULL,
      fiscal_year INTEGER NOT NULL,
      current_value BIGINT NOT NULL DEFAULT 0,
      prefix VARCHAR(20) NOT NULL,
      padding INTEGER NOT NULL DEFAULT 6,
      last_generated_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (tenant_id, company_id, sequence_type, fiscal_year)
    )
  `,

  // Get and increment sequence (atomic)
  GET_AND_INCREMENT: `
    INSERT INTO kernel.sequences (
      tenant_id, company_id, sequence_type, fiscal_year, 
      current_value, prefix, padding, last_generated_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, 
      $5, $6, $7, NOW(), NOW()
    )
    ON CONFLICT (tenant_id, company_id, sequence_type, fiscal_year)
    DO UPDATE SET 
      current_value = kernel.sequences.current_value + 1,
      last_generated_at = NOW(),
      updated_at = NOW()
    RETURNING current_value, prefix, padding
  `,

  // Get sequence info without incrementing
  GET_SEQUENCE_INFO: `
    SELECT 
      sequence_type, current_value, last_generated_at, 
      tenant_id, company_id, fiscal_year
    FROM kernel.sequences
    WHERE tenant_id = $1 
      AND COALESCE(company_id, '00000000-0000-0000-0000-000000000000') = COALESCE($2, '00000000-0000-0000-0000-000000000000')
      AND sequence_type = $3
      AND fiscal_year = $4
  `,

  // Initialize/reset sequence
  INITIALIZE_SEQUENCE: `
    INSERT INTO kernel.sequences (
      tenant_id, company_id, sequence_type, fiscal_year,
      current_value, prefix, padding, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()
    )
    ON CONFLICT (tenant_id, company_id, sequence_type, fiscal_year)
    DO UPDATE SET 
      current_value = $5,
      updated_at = NOW()
    RETURNING *
  `,

  // Reserve batch (increment by N)
  RESERVE_BATCH: `
    INSERT INTO kernel.sequences (
      tenant_id, company_id, sequence_type, fiscal_year,
      current_value, prefix, padding, last_generated_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()
    )
    ON CONFLICT (tenant_id, company_id, sequence_type, fiscal_year)
    DO UPDATE SET 
      current_value = kernel.sequences.current_value + $8,
      last_generated_at = NOW(),
      updated_at = NOW()
    RETURNING current_value - $8 + 1 as start_value, current_value as end_value, prefix, padding
  `,
};

// ============================================================================
// 2. ADAPTER IMPLEMENTATION
// ============================================================================

/**
 * SQL Sequence Adapter
 */
export class SqlSequenceAdapter implements SequencePort {
  private pool: Pool;
  private initialized = false;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Initialize adapter (create table if needed)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    const client = await this.pool.connect();
    try {
      await client.query(SQL.CREATE_SEQUENCE_TABLE);
      this.initialized = true;
    } finally {
      client.release();
    }
  }

  /**
   * Generate next sequence number
   */
  async nextSequence(config: SequenceConfig): Promise<SequenceResult> {
    const client = await this.pool.connect();
    try {
      const year = config.fiscalYear || new Date().getFullYear();
      const prefix = config.prefix || getSequencePrefix(config.type);
      const padding = config.padding ?? 6;
      const startAt = config.startAt ?? 1;

      const result = await client.query(SQL.GET_AND_INCREMENT, [
        config.tenantId,
        config.companyId || null,
        config.type,
        year,
        startAt, // This is used only for initial insert
        prefix,
        padding,
      ]);

      const row = result.rows[0];
      const sequenceValue = parseInt(row.current_value, 10);

      return {
        formattedNumber: formatSequenceNumber(prefix, year, sequenceValue, padding),
        sequenceValue,
        prefix,
        year,
        tenantId: config.tenantId,
        companyId: config.companyId,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get current sequence info
   */
  async getSequenceInfo(
    type: SequenceType,
    tenantId: string,
    companyId?: string,
    fiscalYear?: number
  ): Promise<SequenceInfo | null> {
    const client = await this.pool.connect();
    try {
      const year = fiscalYear || new Date().getFullYear();
      
      const result = await client.query(SQL.GET_SEQUENCE_INFO, [
        tenantId,
        companyId || null,
        type,
        year,
      ]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        type: row.sequence_type as SequenceType,
        currentValue: parseInt(row.current_value, 10),
        lastGeneratedAt: row.last_generated_at,
        tenantId: row.tenant_id,
        companyId: row.company_id || undefined,
        fiscalYear: row.fiscal_year,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Initialize or reset a sequence
   */
  async initializeSequence(
    config: SequenceConfig,
    startValue?: number
  ): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const year = config.fiscalYear || new Date().getFullYear();
      const prefix = config.prefix || getSequencePrefix(config.type);
      const padding = config.padding ?? 6;
      const value = startValue ?? config.startAt ?? 0;

      await client.query(SQL.INITIALIZE_SEQUENCE, [
        config.tenantId,
        config.companyId || null,
        config.type,
        year,
        value,
        prefix,
        padding,
      ]);

      return true;
    } finally {
      client.release();
    }
  }

  /**
   * Reserve a batch of sequence numbers
   */
  async reserveBatch(
    config: SequenceConfig,
    count: number
  ): Promise<SequenceResult[]> {
    const client = await this.pool.connect();
    try {
      const year = config.fiscalYear || new Date().getFullYear();
      const prefix = config.prefix || getSequencePrefix(config.type);
      const padding = config.padding ?? 6;
      const startAt = config.startAt ?? count;

      const result = await client.query(SQL.RESERVE_BATCH, [
        config.tenantId,
        config.companyId || null,
        config.type,
        year,
        startAt,
        prefix,
        padding,
        count,
      ]);

      const row = result.rows[0];
      const startValue = parseInt(row.start_value, 10);
      const results: SequenceResult[] = [];

      for (let i = 0; i < count; i++) {
        const sequenceValue = startValue + i;
        results.push({
          formattedNumber: formatSequenceNumber(prefix, year, sequenceValue, padding),
          sequenceValue,
          prefix,
          year,
          tenantId: config.tenantId,
          companyId: config.companyId,
        });
      }

      return results;
    } finally {
      client.release();
    }
  }
}

// ============================================================================
// 3. FACTORY FUNCTION
// ============================================================================

/**
 * Create SQL Sequence Adapter
 */
export function createSqlSequenceAdapter(pool: Pool): SequencePort {
  return new SqlSequenceAdapter(pool);
}

/**
 * Create and initialize SQL Sequence Adapter
 */
export async function createAndInitSequenceAdapter(pool: Pool): Promise<SequencePort> {
  const adapter = new SqlSequenceAdapter(pool);
  await adapter.initialize();
  return adapter;
}
