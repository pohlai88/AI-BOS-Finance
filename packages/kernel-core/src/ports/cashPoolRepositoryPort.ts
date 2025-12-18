/**
 * TR-02 Cash Pooling Repository Port
 * 
 * Interface for cash pool persistence operations.
 * Adapters (in-memory, PostgreSQL, etc.) implement this.
 * 
 * @module TR-02
 */

import type {
  CashPool,
  CashSweep,
  InterestAllocation,
  PoolConfigChange,
  PoolConfigHistory,
  CashPoolFilter,
} from '../../../apps/canon/finance/dom06-treasury/cells/tr02-cash-pooling/types';

/**
 * Cash Pool Repository Port
 * 
 * ENTERPRISE REQUIREMENTS:
 * - Transactional integrity (pool + sweeps + allocations)
 * - Optimistic locking (version conflicts)
 * - Tenant isolation
 * - Audit trail
 */
export interface CashPoolRepositoryPort {
  // -------------------------------------------------------------------------
  // Pool CRUD
  // -------------------------------------------------------------------------
  
  /**
   * Create a new cash pool
   */
  create(data: Omit<CashPool, 'id' | 'version' | 'createdAt'>): Promise<CashPool>;
  
  /**
   * Find pool by ID
   */
  findById(id: string, tenantId: string): Promise<CashPool | null>;
  
  /**
   * Update pool (with optimistic locking)
   */
  update(
    id: string,
    tenantId: string,
    data: Partial<CashPool>,
    expectedVersion: number
  ): Promise<CashPool>;
  
  /**
   * List pools with filtering
   */
  list(
    filter: CashPoolFilter,
    limit: number,
    offset: number
  ): Promise<{ data: CashPool[]; total: number }>;
  
  // -------------------------------------------------------------------------
  // Sweeps
  // -------------------------------------------------------------------------
  
  /**
   * Create a sweep record
   */
  createSweep(data: Omit<CashSweep, 'id' | 'version' | 'createdAt'>): Promise<CashSweep>;
  
  /**
   * Find sweep by ID
   */
  findSweepById(id: string): Promise<CashSweep | null>;
  
  /**
   * Find sweep by idempotency key
   */
  findSweepByKey(idempotencyKey: string): Promise<CashSweep | null>;
  
  /**
   * Find sweeps by pool
   */
  findSweepsByPool(poolId: string, executionDate?: Date): Promise<CashSweep[]>;
  
  /**
   * Update sweep (with optimistic locking)
   */
  updateSweep(
    id: string,
    data: Partial<CashSweep>,
    expectedVersion: number
  ): Promise<CashSweep>;
  
  // -------------------------------------------------------------------------
  // Interest Allocations
  // -------------------------------------------------------------------------
  
  /**
   * Create an interest allocation
   */
  createInterestAllocation(
    data: Omit<InterestAllocation, 'id' | 'version' | 'createdAt'>
  ): Promise<InterestAllocation>;
  
  /**
   * Find interest allocations by pool
   */
  findInterestAllocationsByPool(
    poolId: string,
    periodStart?: Date,
    periodEnd?: Date
  ): Promise<InterestAllocation[]>;
  
  // -------------------------------------------------------------------------
  // Config Changes
  // -------------------------------------------------------------------------
  
  /**
   * Create a config change request
   */
  createConfigChange(
    data: Omit<PoolConfigChange, 'id' | 'version' | 'requestedAt'>
  ): Promise<PoolConfigChange>;
  
  /**
   * Find config change by ID
   */
  findConfigChangeById(id: string): Promise<PoolConfigChange | null>;
  
  /**
   * Find config changes by pool
   */
  findConfigChangesByPool(
    poolId: string,
    status?: PoolConfigChange['status']
  ): Promise<PoolConfigChange[]>;
  
  /**
   * Update config change (with optimistic locking)
   */
  updateConfigChange(
    id: string,
    data: Partial<PoolConfigChange>,
    expectedVersion: number
  ): Promise<PoolConfigChange>;
  
  // -------------------------------------------------------------------------
  // Config History
  // -------------------------------------------------------------------------
  
  /**
   * Create config history snapshot
   */
  createConfigHistory(
    data: Omit<PoolConfigHistory, 'id'>
  ): Promise<PoolConfigHistory>;
  
  /**
   * Find config history by pool
   */
  findConfigHistoryByPool(poolId: string): Promise<PoolConfigHistory[]>;
  
  /**
   * Find config history by version
   */
  findConfigHistoryByVersion(
    poolId: string,
    version: number
  ): Promise<PoolConfigHistory | null>;
}
