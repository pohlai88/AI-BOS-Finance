/**
 * TR-05 Bank Reconciliation - Memory Repository Adapter
 * 
 * In-memory implementation of ReconciliationRepositoryPort for testing.
 * 
 * @module TR-05
 */

import { v4 as uuidv4 } from 'uuid';
import type { ReconciliationRepositoryPort } from '@aibos/kernel-core';
import type {
  BankStatement,
  StatementItem,
  ReconMatch,
  ReconMatchAllocation,
  BankAccountBalanceSnapshot,
  ReconciliationFilter,
} from '../../../../apps/canon/finance/dom06-treasury/cells/tr05-bank-reconciliation/types';

// =============================================================================
// MEMORY ADAPTER
// =============================================================================

export class MemoryReconciliationRepository implements ReconciliationRepositoryPort {
  private statements: Map<string, BankStatement> = new Map();
  private statementItems: Map<string, StatementItem> = new Map();
  private matches: Map<string, ReconMatch> = new Map();
  private matchAllocations: Map<string, ReconMatchAllocation> = new Map();
  private balanceSnapshots: Map<string, BankAccountBalanceSnapshot> = new Map();

  /**
   * Clear all data (for test reset)
   */
  clear(): void {
    this.statements.clear();
    this.statementItems.clear();
    this.matches.clear();
    this.matchAllocations.clear();
    this.balanceSnapshots.clear();
  }

  // Statement CRUD
  async createStatement(data: Omit<BankStatement, 'id' | 'version'>): Promise<BankStatement> {
    const statement: BankStatement = {
      ...data,
      id: uuidv4(),
      version: 1,
    };
    this.statements.set(statement.id, statement);
    return { ...statement };
  }

  async findStatementById(id: string, tenantId: string): Promise<BankStatement | null> {
    const statement = this.statements.get(id);
    if (!statement || statement.tenantId !== tenantId) return null;
    return { ...statement };
  }

  async findStatementByKeys(keys: {
    bankAccountId: string;
    statementNumber: string;
    statementDate: Date;
    openingBalance: { amount: string; currency: string };
    closingBalance: { amount: string; currency: string };
    periodStart: Date;
    periodEnd: Date;
  }): Promise<BankStatement | null> {
    for (const statement of this.statements.values()) {
      if (
        statement.bankAccountId === keys.bankAccountId &&
        statement.statementNumber === keys.statementNumber &&
        statement.statementDate.getTime() === keys.statementDate.getTime() &&
        statement.openingBalance.amount === keys.openingBalance.amount &&
        statement.openingBalance.currency === keys.openingBalance.currency &&
        statement.closingBalance.amount === keys.closingBalance.amount &&
        statement.closingBalance.currency === keys.closingBalance.currency &&
        statement.periodStart.getTime() === keys.periodStart.getTime() &&
        statement.periodEnd.getTime() === keys.periodEnd.getTime()
      ) {
        return { ...statement };
      }
    }
    return null;
  }

  async updateStatement(
    id: string,
    tenantId: string,
    data: Partial<BankStatement>,
    expectedVersion: number
  ): Promise<BankStatement> {
    const existing = this.statements.get(id);
    if (!existing || existing.tenantId !== tenantId || existing.version !== expectedVersion) {
      throw new Error('Version conflict or statement not found');
    }

    const updated: BankStatement = {
      ...existing,
      ...data,
      version: existing.version + 1,
    };
    this.statements.set(id, updated);
    return { ...updated };
  }

  async listStatements(
    filter: ReconciliationFilter,
    limit: number,
    offset: number
  ): Promise<{ data: BankStatement[]; total: number }> {
    let filtered = Array.from(this.statements.values()).filter(
      (s) => s.tenantId === filter.tenantId
    );

    if (filter.bankAccountId) {
      filtered = filtered.filter((s) => s.bankAccountId === filter.bankAccountId);
    }

    if (filter.status) {
      const statusArray = Array.isArray(filter.status) ? filter.status : [filter.status];
      filtered = filtered.filter((s) => statusArray.includes(s.status));
    }

    if (filter.periodStart) {
      filtered = filtered.filter((s) => s.periodStart >= filter.periodStart!);
    }

    if (filter.periodEnd) {
      filtered = filtered.filter((s) => s.periodEnd <= filter.periodEnd!);
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.statementNumber.toLowerCase().includes(searchLower) ||
          s.importSource?.toLowerCase().includes(searchLower)
      );
    }

    const total = filtered.length;
    const data = filtered
      .sort((a, b) => b.statementDate.getTime() - a.statementDate.getTime())
      .slice(offset, offset + limit)
      .map((s) => ({ ...s }));

    return { data, total };
  }

  // Statement Items
  async createStatementItem(data: Omit<StatementItem, 'id'>): Promise<StatementItem> {
    const item: StatementItem = {
      ...data,
      id: uuidv4(),
    };
    this.statementItems.set(item.id, item);
    return { ...item };
  }

  async findStatementItemsByStatement(statementId: string): Promise<StatementItem[]> {
    return Array.from(this.statementItems.values())
      .filter((item) => item.statementId === statementId)
      .sort((a, b) => a.valueDate.getTime() - b.valueDate.getTime())
      .map((item) => ({ ...item }));
  }

  async findUnmatchedItems(statementId: string): Promise<StatementItem[]> {
    return Array.from(this.statementItems.values())
      .filter((item) => item.statementId === statementId && item.status === 'unmatched')
      .map((item) => ({ ...item }));
  }

  async updateStatementItem(id: string, data: Partial<StatementItem>): Promise<StatementItem> {
    const existing = this.statementItems.get(id);
    if (!existing) {
      throw new Error('Statement item not found');
    }

    const updated: StatementItem = {
      ...existing,
      ...data,
    };
    this.statementItems.set(id, updated);
    return { ...updated };
  }

  // Matches
  async createMatch(data: Omit<ReconMatch, 'id' | 'matchedAt' | 'version'>): Promise<ReconMatch> {
    const match: ReconMatch = {
      ...data,
      id: uuidv4(),
      matchedAt: new Date(),
      version: 1,
    };
    this.matches.set(match.id, match);
    return { ...match };
  }

  async findMatchesByStatement(statementId: string): Promise<ReconMatch[]> {
    return Array.from(this.matches.values())
      .filter((m) => m.statementId === statementId)
      .sort((a, b) => b.matchedAt.getTime() - a.matchedAt.getTime())
      .map((m) => ({ ...m }));
  }

  async findMatchById(id: string): Promise<ReconMatch | null> {
    const match = this.matches.get(id);
    return match ? { ...match } : null;
  }

  async updateMatch(
    id: string,
    data: Partial<ReconMatch>,
    expectedVersion: number
  ): Promise<ReconMatch> {
    const existing = this.matches.get(id);
    if (!existing || existing.version !== expectedVersion) {
      throw new Error('Version conflict or match not found');
    }

    const updated: ReconMatch = {
      ...existing,
      ...data,
      version: existing.version + 1,
    };
    this.matches.set(id, updated);
    return { ...updated };
  }

  // Match Allocations
  async createMatchAllocation(
    data: Omit<ReconMatchAllocation, 'id' | 'createdAt'>
  ): Promise<ReconMatchAllocation> {
    const allocation: ReconMatchAllocation = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
    };
    this.matchAllocations.set(allocation.id, allocation);
    return { ...allocation };
  }

  async findMatchAllocationsByMatch(matchId: string): Promise<ReconMatchAllocation[]> {
    return Array.from(this.matchAllocations.values())
      .filter((a) => a.matchId === matchId)
      .sort((a, b) => a.allocationOrder - b.allocationOrder)
      .map((a) => ({ ...a }));
  }

  // Balance Snapshots
  async createBalanceSnapshot(
    data: Omit<BankAccountBalanceSnapshot, 'id' | 'createdAt'>
  ): Promise<BankAccountBalanceSnapshot> {
    const snapshot: BankAccountBalanceSnapshot = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
    };
    this.balanceSnapshots.set(snapshot.id, snapshot);
    return { ...snapshot };
  }

  async findLatestBalanceSnapshot(
    bankAccountId: string,
    tenantId: string
  ): Promise<BankAccountBalanceSnapshot | null> {
    const snapshots = Array.from(this.balanceSnapshots.values())
      .filter((s) => s.bankAccountId === bankAccountId && s.tenantId === tenantId)
      .sort((a, b) => b.balanceDate.getTime() - a.balanceDate.getTime());

    return snapshots.length > 0 ? { ...snapshots[0] } : null;
  }
}
