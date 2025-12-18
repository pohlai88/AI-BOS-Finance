/**
 * TR-02 Cash Pooling - Memory Repository Adapter
 * 
 * In-memory implementation of CashPoolRepositoryPort for testing.
 * 
 * @module TR-02
 */

import { v4 as uuidv4 } from 'uuid';
import type { CashPoolRepositoryPort } from '@aibos/kernel-core';
import type {
  CashPool,
  CashSweep,
  InterestAllocation,
  PoolConfigChange,
  PoolConfigHistory,
  CashPoolFilter,
} from '../../../../apps/canon/finance/dom06-treasury/cells/tr02-cash-pooling/types';

// =============================================================================
// MEMORY ADAPTER
// =============================================================================

export class MemoryCashPoolRepository implements CashPoolRepositoryPort {
  private pools: Map<string, CashPool> = new Map();
  private sweeps: Map<string, CashSweep> = new Map();
  private interestAllocations: Map<string, InterestAllocation> = new Map();
  private configChanges: Map<string, PoolConfigChange> = new Map();
  private configHistory: Map<string, PoolConfigHistory> = new Map();

  /**
   * Clear all data (for test reset)
   */
  clear(): void {
    this.pools.clear();
    this.sweeps.clear();
    this.interestAllocations.clear();
    this.configChanges.clear();
    this.configHistory.clear();
  }

  // Pool CRUD
  async create(data: Omit<CashPool, 'id' | 'version' | 'createdAt'>): Promise<CashPool> {
    const pool: CashPool = {
      ...data,
      id: uuidv4(),
      version: 1,
      createdAt: new Date(),
    };
    this.pools.set(pool.id, pool);
    return { ...pool };
  }

  async findById(id: string, tenantId: string): Promise<CashPool | null> {
    const pool = this.pools.get(id);
    if (!pool || pool.tenantId !== tenantId) return null;
    return { ...pool };
  }

  async update(
    id: string,
    tenantId: string,
    data: Partial<CashPool>,
    expectedVersion: number
  ): Promise<CashPool> {
    const existing = this.pools.get(id);
    if (!existing || existing.tenantId !== tenantId || existing.version !== expectedVersion) {
      throw new Error('Version conflict or pool not found');
    }

    const updated: CashPool = {
      ...existing,
      ...data,
      version: existing.version + 1,
    };
    this.pools.set(id, updated);
    return { ...updated };
  }

  async list(
    filter: CashPoolFilter,
    limit: number,
    offset: number
  ): Promise<{ data: CashPool[]; total: number }> {
    let filtered = Array.from(this.pools.values()).filter(
      (p) => p.tenantId === filter.tenantId
    );

    if (filter.poolType) {
      const typeArray = Array.isArray(filter.poolType) ? filter.poolType : [filter.poolType];
      filtered = filtered.filter((p) => typeArray.includes(p.poolType));
    }

    if (filter.status) {
      const statusArray = Array.isArray(filter.status) ? filter.status : [filter.status];
      filtered = filtered.filter((p) => statusArray.includes(p.status));
    }

    if (filter.masterCompanyId) {
      filtered = filtered.filter((p) => p.masterCompanyId === filter.masterCompanyId);
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.poolName.toLowerCase().includes(searchLower) ||
          p.poolCode.toLowerCase().includes(searchLower)
      );
    }

    const total = filtered.length;
    const data = filtered
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit)
      .map((p) => ({ ...p }));

    return { data, total };
  }

  // Sweeps
  async createSweep(data: Omit<CashSweep, 'id' | 'version' | 'createdAt'>): Promise<CashSweep> {
    const sweep: CashSweep = {
      ...data,
      id: uuidv4(),
      version: 1,
      createdAt: new Date(),
    };
    this.sweeps.set(sweep.id, sweep);
    return { ...sweep };
  }

  async findSweepById(id: string): Promise<CashSweep | null> {
    const sweep = this.sweeps.get(id);
    return sweep ? { ...sweep } : null;
  }

  async findSweepByKey(idempotencyKey: string): Promise<CashSweep | null> {
    for (const sweep of this.sweeps.values()) {
      if (sweep.idempotencyKey === idempotencyKey) {
        return { ...sweep };
      }
    }
    return null;
  }

  async findSweepsByPool(poolId: string, executionDate?: Date): Promise<CashSweep[]> {
    return Array.from(this.sweeps.values())
      .filter((s) => {
        if (s.poolId !== poolId) return false;
        if (executionDate) {
          return s.executionDate.getTime() === executionDate.getTime();
        }
        return true;
      })
      .sort((a, b) => b.executionDate.getTime() - a.executionDate.getTime())
      .map((s) => ({ ...s }));
  }

  async updateSweep(
    id: string,
    data: Partial<CashSweep>,
    expectedVersion: number
  ): Promise<CashSweep> {
    const existing = this.sweeps.get(id);
    if (!existing || existing.version !== expectedVersion) {
      throw new Error('Version conflict or sweep not found');
    }

    const updated: CashSweep = {
      ...existing,
      ...data,
      version: existing.version + 1,
    };
    this.sweeps.set(id, updated);
    return { ...updated };
  }

  // Interest Allocations
  async createInterestAllocation(
    data: Omit<InterestAllocation, 'id' | 'version' | 'createdAt'>
  ): Promise<InterestAllocation> {
    const allocation: InterestAllocation = {
      ...data,
      id: uuidv4(),
      version: 1,
      createdAt: new Date(),
    };
    this.interestAllocations.set(allocation.id, allocation);
    return { ...allocation };
  }

  async findInterestAllocationsByPool(
    poolId: string,
    periodStart?: Date,
    periodEnd?: Date
  ): Promise<InterestAllocation[]> {
    return Array.from(this.interestAllocations.values())
      .filter((a) => {
        if (a.poolId !== poolId) return false;
        if (periodStart && a.periodStart < periodStart) return false;
        if (periodEnd && a.periodEnd > periodEnd) return false;
        return true;
      })
      .sort((a, b) => b.periodStart.getTime() - a.periodStart.getTime())
      .map((a) => ({ ...a }));
  }

  // Config Changes
  async createConfigChange(
    data: Omit<PoolConfigChange, 'id' | 'version' | 'requestedAt'>
  ): Promise<PoolConfigChange> {
    const change: PoolConfigChange = {
      ...data,
      id: uuidv4(),
      version: 1,
      requestedAt: new Date(),
    };
    this.configChanges.set(change.id, change);
    return { ...change };
  }

  async findConfigChangeById(id: string): Promise<PoolConfigChange | null> {
    const change = this.configChanges.get(id);
    return change ? { ...change } : null;
  }

  async findConfigChangesByPool(
    poolId: string,
    status?: PoolConfigChange['status']
  ): Promise<PoolConfigChange[]> {
    return Array.from(this.configChanges.values())
      .filter((c) => {
        if (c.poolId !== poolId) return false;
        if (status && c.status !== status) return false;
        return true;
      })
      .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime())
      .map((c) => ({ ...c }));
  }

  async updateConfigChange(
    id: string,
    data: Partial<PoolConfigChange>,
    expectedVersion: number
  ): Promise<PoolConfigChange> {
    const existing = this.configChanges.get(id);
    if (!existing || existing.version !== expectedVersion) {
      throw new Error('Version conflict or config change not found');
    }

    const updated: PoolConfigChange = {
      ...existing,
      ...data,
      version: existing.version + 1,
    };
    this.configChanges.set(id, updated);
    return { ...updated };
  }

  // Config History
  async createConfigHistory(
    data: Omit<PoolConfigHistory, 'id'>
  ): Promise<PoolConfigHistory> {
    const history: PoolConfigHistory = {
      ...data,
      id: uuidv4(),
    };
    this.configHistory.set(`${data.poolId}-${data.version}`, history);
    return { ...history };
  }

  async findConfigHistoryByPool(poolId: string): Promise<PoolConfigHistory[]> {
    return Array.from(this.configHistory.values())
      .filter((h) => h.poolId === poolId)
      .sort((a, b) => b.version - a.version)
      .map((h) => ({ ...h }));
  }

  async findConfigHistoryByVersion(
    poolId: string,
    version: number
  ): Promise<PoolConfigHistory | null> {
    const history = this.configHistory.get(`${poolId}-${version}`);
    return history ? { ...history } : null;
  }
}
