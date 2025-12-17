/**
 * AP-03: 3-Way Match & Controls Engine — Memory Adapter
 * 
 * In-memory implementation of MatchingRepositoryPort for testing.
 */

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
// MEMORY ADAPTER
// ============================================================================

export class MemoryMatchingRepository implements MatchingRepositoryPort {
  private matchResults: Map<string, MatchResult> = new Map();
  private matchExceptions: Map<string, MatchException> = new Map();

  async withTransaction<T>(
    callback: (txContext: MatchTransactionContext) => Promise<T>
  ): Promise<T> {
    const txContext: MatchTransactionContext = {
      tx: null,
      correlationId: uuidv4(),
    };
    return callback(txContext);
  }

  // ========== Match Result Operations ==========

  async create(
    input: CreateMatchResultInput,
    _txContext: MatchTransactionContext
  ): Promise<MatchResult> {
    const now = new Date();
    const result: MatchResult = {
      id: uuidv4(),
      invoiceId: input.invoiceId,
      tenantId: input.tenantId,
      matchMode: input.matchMode,
      matchPolicySource: input.matchPolicySource,
      status: input.status,
      purchaseOrderId: input.purchaseOrderId,
      goodsReceiptId: input.goodsReceiptId,
      priceVariancePercent: input.priceVariancePercent,
      qtyVariancePercent: input.qtyVariancePercent,
      amountVarianceCents: input.amountVarianceCents,
      withinTolerance: input.withinTolerance,
      exceptionReason: input.exceptionReason,
      exceptionCode: input.exceptionCode,
      isOverridden: false,
      createdBy: input.createdBy,
      createdAt: now,
      evaluatedAt: now,
      version: 1,
      updatedAt: now,
    };

    this.matchResults.set(result.id, result);
    return { ...result };
  }

  async findById(id: string, tenantId: string): Promise<MatchResult | null> {
    const result = this.matchResults.get(id);
    if (!result || result.tenantId !== tenantId) {
      return null;
    }
    return { ...result };
  }

  async findByInvoiceId(invoiceId: string, tenantId: string): Promise<MatchResult | null> {
    for (const result of this.matchResults.values()) {
      if (result.invoiceId === invoiceId && result.tenantId === tenantId) {
        return { ...result };
      }
    }
    return null;
  }

  async update(
    id: string,
    input: UpdateMatchResultInput,
    _txContext: MatchTransactionContext
  ): Promise<MatchResult> {
    const existing = this.matchResults.get(id);
    if (!existing || existing.tenantId !== input.tenantId) {
      throw new Error(`Match result not found: ${id}`);
    }

    const updated: MatchResult = {
      ...existing,
      status: input.status ?? existing.status,
      isOverridden: input.isOverridden ?? existing.isOverridden,
      overrideApprovedBy: input.overrideApprovedBy ?? existing.overrideApprovedBy,
      overrideApprovedAt: input.overrideApprovedAt ?? existing.overrideApprovedAt,
      overrideReason: input.overrideReason ?? existing.overrideReason,
      version: existing.version + 1,
      updatedAt: new Date(),
    };

    this.matchResults.set(id, updated);
    return { ...updated };
  }

  async list(filters: MatchQueryFilters): Promise<{ results: MatchResult[]; total: number }> {
    let results = Array.from(this.matchResults.values())
      .filter(r => r.tenantId === filters.tenantId);

    if (filters.invoiceId) {
      results = results.filter(r => r.invoiceId === filters.invoiceId);
    }

    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      results = results.filter(r => statuses.includes(r.status));
    }

    if (filters.matchMode) {
      results = results.filter(r => r.matchMode === filters.matchMode);
    }

    if (filters.isOverridden !== undefined) {
      results = results.filter(r => r.isOverridden === filters.isOverridden);
    }

    if (filters.fromDate) {
      results = results.filter(r => r.createdAt >= filters.fromDate!);
    }

    if (filters.toDate) {
      results = results.filter(r => r.createdAt <= filters.toDate!);
    }

    // Sort by created date descending
    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = results.length;
    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;

    return {
      results: results.slice(offset, offset + limit).map(r => ({ ...r })),
      total,
    };
  }

  // ========== Exception Operations ==========

  async createException(
    input: CreateExceptionInput,
    _txContext: MatchTransactionContext
  ): Promise<MatchException> {
    const exception: MatchException = {
      id: uuidv4(),
      matchResultId: input.matchResultId,
      tenantId: input.tenantId,
      exceptionType: input.exceptionType,
      severity: input.severity,
      message: input.message,
      resolutionStatus: 'pending',
      createdAt: new Date(),
    };

    this.matchExceptions.set(exception.id, exception);
    return { ...exception };
  }

  async listExceptions(matchResultId: string, tenantId: string): Promise<MatchException[]> {
    return Array.from(this.matchExceptions.values())
      .filter(e => e.matchResultId === matchResultId && e.tenantId === tenantId)
      .map(e => ({ ...e }));
  }

  async resolveException(
    id: string,
    input: ResolveExceptionInput,
    _txContext: MatchTransactionContext
  ): Promise<MatchException> {
    const existing = this.matchExceptions.get(id);
    if (!existing || existing.tenantId !== input.tenantId) {
      throw new Error(`Match exception not found: ${id}`);
    }

    const updated: MatchException = {
      ...existing,
      resolutionStatus: input.resolutionStatus,
      resolvedBy: input.resolvedBy,
      resolvedAt: new Date(),
      resolutionNotes: input.resolutionNotes,
    };

    this.matchExceptions.set(id, updated);
    return { ...updated };
  }

  async findExceptionById(id: string, tenantId: string): Promise<MatchException | null> {
    const exception = this.matchExceptions.get(id);
    if (!exception || exception.tenantId !== tenantId) {
      return null;
    }
    return { ...exception };
  }

  // ========== Test Helpers ==========

  clear(): void {
    this.matchResults.clear();
    this.matchExceptions.clear();
  }

  getMatchResultCount(): number {
    return this.matchResults.size;
  }

  getExceptionCount(): number {
    return this.matchExceptions.size;
  }
}

/**
 * Factory function
 */
export function createMemoryMatchingRepository(): MatchingRepositoryPort {
  return new MemoryMatchingRepository();
}
