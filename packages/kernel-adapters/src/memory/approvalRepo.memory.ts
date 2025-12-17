/**
 * AP-04: Invoice Approval Workflow — Memory Adapter
 * 
 * In-memory implementation for testing.
 */

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

export class MemoryApprovalRepository implements ApprovalRepositoryPort {
  private approvals: Map<string, ApprovalRecord> = new Map();
  private routes: Map<string, ApprovalRoute> = new Map();

  async withTransaction<T>(
    callback: (txContext: ApprovalTransactionContext) => Promise<T>
  ): Promise<T> {
    return callback({ tx: null, correlationId: uuidv4() });
  }

  // ========== Approval Operations ==========

  async createApproval(
    input: CreateApprovalInput,
    _txContext: ApprovalTransactionContext
  ): Promise<ApprovalRecord> {
    const approval: ApprovalRecord = {
      id: uuidv4(),
      invoiceId: input.invoiceId,
      tenantId: input.tenantId,
      approvalLevel: input.approvalLevel,
      totalLevels: input.totalLevels,
      approverId: input.approverId,
      approverRole: input.approverRole,
      decision: input.decision,
      comments: input.comments,
      isDelegated: input.isDelegated || false,
      delegatedFromUserId: input.delegatedFromUserId,
      delegationReason: input.delegationReason,
      createdAt: new Date(),
    };

    this.approvals.set(approval.id, approval);
    return { ...approval };
  }

  async findApprovalById(id: string, tenantId: string): Promise<ApprovalRecord | null> {
    const approval = this.approvals.get(id);
    if (!approval || approval.tenantId !== tenantId) return null;
    return { ...approval };
  }

  async listApprovalsForInvoice(invoiceId: string, tenantId: string): Promise<ApprovalRecord[]> {
    return Array.from(this.approvals.values())
      .filter(a => a.invoiceId === invoiceId && a.tenantId === tenantId)
      .sort((a, b) => a.approvalLevel - b.approvalLevel)
      .map(a => ({ ...a }));
  }

  async updateApproval(
    id: string,
    input: UpdateApprovalInput,
    _txContext: ApprovalTransactionContext
  ): Promise<ApprovalRecord> {
    const existing = this.approvals.get(id);
    if (!existing || existing.tenantId !== input.tenantId) {
      throw new Error(`Approval not found: ${id}`);
    }

    const updated: ApprovalRecord = {
      ...existing,
      decision: input.decision ?? existing.decision,
      comments: input.comments ?? existing.comments,
      actionedAt: input.actionedAt ?? existing.actionedAt,
    };

    this.approvals.set(id, updated);
    return { ...updated };
  }

  async listPendingApprovals(
    _approverId: string,
    tenantId: string,
    limit = 50,
    offset = 0
  ): Promise<{ items: ApprovalRecord[]; total: number }> {
    const pending = Array.from(this.approvals.values())
      .filter(a => a.tenantId === tenantId && a.decision === 'pending')
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    return {
      items: pending.slice(offset, offset + limit).map(a => ({ ...a })),
      total: pending.length,
    };
  }

  async invalidateApprovals(
    invoiceId: string,
    tenantId: string,
    _txContext: ApprovalTransactionContext
  ): Promise<void> {
    for (const [id, approval] of this.approvals.entries()) {
      if (approval.invoiceId === invoiceId && approval.tenantId === tenantId) {
        this.approvals.delete(id);
      }
    }

    for (const [id, route] of this.routes.entries()) {
      if (route.invoiceId === invoiceId && route.tenantId === tenantId) {
        this.routes.delete(id);
      }
    }
  }

  // ========== Route Operations ==========

  async createRoute(
    input: CreateRouteInput,
    _txContext: ApprovalTransactionContext
  ): Promise<ApprovalRoute> {
    const now = new Date();
    const route: ApprovalRoute = {
      id: uuidv4(),
      invoiceId: input.invoiceId,
      tenantId: input.tenantId,
      totalLevels: input.totalLevels,
      routePolicySource: input.routePolicySource,
      routeConfig: input.routeConfig,
      isComplete: false,
      createdAt: now,
      updatedAt: now,
    };

    this.routes.set(route.id, route);
    return { ...route };
  }

  async findRouteByInvoiceId(invoiceId: string, tenantId: string): Promise<ApprovalRoute | null> {
    for (const route of this.routes.values()) {
      if (route.invoiceId === invoiceId && route.tenantId === tenantId) {
        return { ...route };
      }
    }
    return null;
  }

  async updateRoute(
    id: string,
    input: UpdateRouteInput,
    _txContext: ApprovalTransactionContext
  ): Promise<ApprovalRoute> {
    const existing = this.routes.get(id);
    if (!existing || existing.tenantId !== input.tenantId) {
      throw new Error(`Route not found: ${id}`);
    }

    const updated: ApprovalRoute = {
      ...existing,
      isComplete: input.isComplete ?? existing.isComplete,
      completedAt: input.completedAt ?? existing.completedAt,
      updatedAt: new Date(),
    };

    this.routes.set(id, updated);
    return { ...updated };
  }

  // ========== Test Helpers ==========

  clear(): void {
    this.approvals.clear();
    this.routes.clear();
  }
}

export function createMemoryApprovalRepository(): ApprovalRepositoryPort {
  return new MemoryApprovalRepository();
}
