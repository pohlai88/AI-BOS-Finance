// metadata-studio/services/approval.service.ts
import { db } from '../db/client';
import { mdmApproval } from '../db/schema/approval.tables';
import { eq } from 'drizzle-orm';
import {
  ApprovalRequestSchema,
  ApprovalStatusEnum,
  type ApprovalRequest,
} from '../schemas/approval.schema';

type Role = 'kernel_architect' | 'metadata_steward' | 'business_admin' | 'user';

export const approvalService = {
  /**
   * Create a new approval request from a proposed change.
   */
  async createRequest(raw: unknown): Promise<ApprovalRequest> {
    const parsed = ApprovalRequestSchema.parse(raw);

    const [inserted] = await db
      .insert(mdmApproval)
      .values({
        tenantId: parsed.tenantId,
        entityType: parsed.entityType,
        entityId: parsed.entityId ?? null,
        entityKey: parsed.entityKey,
        tier: parsed.tier,
        lane: parsed.lane,
        payload: parsed.payload,
        currentState: parsed.currentState ?? null,
        status: 'pending',
        decisionReason: null,
        requestedBy: parsed.requestedBy,
        decidedBy: null,
        requestedAt: new Date(),
        decidedAt: null,
        requiredRole: parsed.requiredRole,
      })
      .returning();

    return {
      ...parsed,
      id: inserted.id,
      status: inserted.status as (typeof ApprovalStatusEnum._type)[number],
      requestedAt: inserted.requestedAt?.toISOString(),
    };
  },

  /**
   * List pending approvals for a given tenant and role.
   */
  async listPendingForRole(tenantId: string, role: Role) {
    const rows = await db
      .select()
      .from(mdmApproval)
      .where(eq(mdmApproval.tenantId, tenantId))
      .where(eq(mdmApproval.status, 'pending'))
      .where(eq(mdmApproval.requiredRole, role));

    return rows;
  },

  /**
   * Approve an existing request.
   * NOTE: This does NOT yet apply the change; the caller (traffic cop / orchestrator)
   * is responsible for actually committing the payload into the target table.
   */
  async approveRequest(
    approvalId: string,
    actorId: string,
  ): Promise<ApprovalRequest> {
    const [row] = await db
      .update(mdmApproval)
      .set({
        status: 'approved',
        decidedBy: actorId,
        decidedAt: new Date(),
      })
      .where(eq(mdmApproval.id, approvalId))
      .returning();

    if (!row) {
      throw new Error(`Approval request not found: ${approvalId}`);
    }

    return {
      id: row.id,
      tenantId: row.tenantId,
      entityType: row.entityType as any,
      entityId: row.entityId ?? undefined,
      entityKey: row.entityKey ?? undefined,
      tier: row.tier as any,
      lane: row.lane as any,
      payload: row.payload,
      currentState: row.currentState ?? undefined,
      status: row.status as any,
      decisionReason: row.decisionReason ?? undefined,
      requestedBy: row.requestedBy,
      decidedBy: row.decidedBy ?? undefined,
      requestedAt: row.requestedAt?.toISOString(),
      decidedAt: row.decidedAt?.toISOString(),
      requiredRole: row.requiredRole,
    };
  },

  /**
   * Reject an existing request.
   */
  async rejectRequest(
    approvalId: string,
    actorId: string,
    reason: string,
  ): Promise<ApprovalRequest> {
    const [row] = await db
      .update(mdmApproval)
      .set({
        status: 'rejected',
        decidedBy: actorId,
        decidedAt: new Date(),
        decisionReason: reason,
      })
      .where(eq(mdmApproval.id, approvalId))
      .returning();

    if (!row) {
      throw new Error(`Approval request not found: ${approvalId}`);
    }

    return {
      id: row.id,
      tenantId: row.tenantId,
      entityType: row.entityType as any,
      entityId: row.entityId ?? undefined,
      entityKey: row.entityKey ?? undefined,
      tier: row.tier as any,
      lane: row.lane as any,
      payload: row.payload,
      currentState: row.currentState ?? undefined,
      status: row.status as any,
      decisionReason: row.decisionReason ?? undefined,
      requestedBy: row.requestedBy,
      decidedBy: row.decidedBy ?? undefined,
      requestedAt: row.requestedAt?.toISOString(),
      decidedAt: row.decidedAt?.toISOString(),
      requiredRole: row.requiredRole,
    };
  },
};

