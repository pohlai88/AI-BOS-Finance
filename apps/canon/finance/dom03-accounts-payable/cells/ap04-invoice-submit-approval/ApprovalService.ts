/**
 * AP-04: Invoice Approval Workflow — Approval Service
 * 
 * Core domain service for invoice approval workflow.
 * Enforces SoD, multi-step approvals, and immutability.
 */

import { v4 as uuidv4 } from 'uuid';
import type { ActorContext } from '@aibos/canon-governance';
import type { AuditPort } from '@aibos/kernel-core';

import {
  ApprovalNotFoundError,
  InvoiceNotFoundForApprovalError,
  SoDViolationError,
  NotAuthorizedToApproveError,
  NotPendingApprovalError,
  InvoiceNotMatchedError,
  AlreadyApprovedError,
  AlreadyRejectedError,
  ApprovalAlreadyActionedError,
} from './errors';

import {
  type ApprovalDecision,
  type ApprovalRecord,
  type ApprovalRoute,
  type ApprovalInboxItem,
  type ApprovalRouteConfig,
  type ApproveInput,
  type RejectInput,
  isFullyApproved,
  calculateApprovalLevels,
} from './ApprovalTypes';

// ============================================================================
// PORT INTERFACES
// ============================================================================

export interface ApprovalRepositoryPort {
  withTransaction<T>(callback: (txContext: ApprovalTransactionContext) => Promise<T>): Promise<T>;
  createApproval(input: CreateApprovalInput, txContext: ApprovalTransactionContext): Promise<ApprovalRecord>;
  findApprovalById(id: string, tenantId: string): Promise<ApprovalRecord | null>;
  listApprovalsForInvoice(invoiceId: string, tenantId: string): Promise<ApprovalRecord[]>;
  updateApproval(id: string, input: UpdateApprovalInput, txContext: ApprovalTransactionContext): Promise<ApprovalRecord>;
  createRoute(input: CreateRouteInput, txContext: ApprovalTransactionContext): Promise<ApprovalRoute>;
  findRouteByInvoiceId(invoiceId: string, tenantId: string): Promise<ApprovalRoute | null>;
  updateRoute(id: string, input: UpdateRouteInput, txContext: ApprovalTransactionContext): Promise<ApprovalRoute>;
  listPendingApprovals(approverId: string, tenantId: string, limit?: number, offset?: number): Promise<{ items: ApprovalRecord[]; total: number }>;
  invalidateApprovals(invoiceId: string, tenantId: string, txContext: ApprovalTransactionContext): Promise<void>;
}

export interface InvoiceApprovalPort {
  getInvoiceForApproval(invoiceId: string, tenantId: string): Promise<InvoiceForApproval | null>;
  updateInvoiceApprovalStatus(invoiceId: string, status: string, tenantId: string): Promise<void>;
}

export interface ApprovalPolicyPort {
  getApprovalRoute(invoiceId: string, amountCents: number, tenantId: string, vendorId: string): Promise<ApprovalRouteConfig>;
  isUserApprover(userId: string, level: number, tenantId: string): Promise<boolean>;
  getDelegateFor(userId: string, tenantId: string): Promise<string | null>;
}

// ============================================================================
// TYPES
// ============================================================================

export interface ApprovalTransactionContext {
  tx: unknown;
  correlationId: string;
}

export interface InvoiceForApproval {
  id: string;
  tenantId: string;
  vendorId: string;
  vendorName?: string;
  invoiceNumber: string;
  status: string;
  matchStatus?: string;
  totalAmountCents: number;
  currency: string;
  createdBy: string;
  submittedAt?: Date;
}

export interface CreateApprovalInput {
  invoiceId: string;
  tenantId: string;
  approvalLevel: number;
  totalLevels: number;
  approverId: string;
  approverRole?: string;
  decision: ApprovalDecision;
  comments?: string;
  isDelegated?: boolean;
  delegatedFromUserId?: string;
  delegationReason?: string;
}

export interface UpdateApprovalInput {
  tenantId: string;
  decision?: ApprovalDecision;
  comments?: string;
  actionedAt?: Date;
}

export interface CreateRouteInput {
  invoiceId: string;
  tenantId: string;
  totalLevels: number;
  routePolicySource: string;
  routeConfig: ApprovalRouteConfig;
}

export interface UpdateRouteInput {
  tenantId: string;
  isComplete?: boolean;
  completedAt?: Date;
}

// ============================================================================
// APPROVAL SERVICE
// ============================================================================

export class ApprovalService {
  constructor(
    private approvalRepo: ApprovalRepositoryPort,
    private invoicePort: InvoiceApprovalPort,
    private policyPort: ApprovalPolicyPort,
    private auditPort: AuditPort
  ) {}

  /**
   * Request approval for an invoice (creates approval route)
   */
  async requestApproval(invoiceId: string, actor: ActorContext): Promise<ApprovalRoute> {
    // Get invoice
    const invoice = await this.invoicePort.getInvoiceForApproval(invoiceId, actor.tenantId);
    if (!invoice) {
      throw new InvoiceNotFoundForApprovalError(invoiceId);
    }

    // Verify match status
    if (invoice.matchStatus !== 'passed' && invoice.matchStatus !== 'skipped') {
      throw new InvoiceNotMatchedError(invoiceId, invoice.matchStatus || 'none');
    }

    // Get approval route from policy
    const routeConfig = await this.policyPort.getApprovalRoute(
      invoiceId,
      invoice.totalAmountCents,
      actor.tenantId,
      invoice.vendorId
    );

    return await this.approvalRepo.withTransaction(async (txContext) => {
      // Create approval route
      const route = await this.approvalRepo.createRoute({
        invoiceId,
        tenantId: actor.tenantId,
        totalLevels: routeConfig.levels.length,
        routePolicySource: routeConfig.policySource,
        routeConfig,
      }, txContext);

      // Create pending approvals for level 1
      const level1Config = routeConfig.levels.find(l => l.level === 1);
      if (level1Config) {
        await this.approvalRepo.createApproval({
          invoiceId,
          tenantId: actor.tenantId,
          approvalLevel: 1,
          totalLevels: routeConfig.levels.length,
          approverId: '', // Will be assigned when approved
          approverRole: level1Config.role,
          decision: 'pending',
        }, txContext);
      }

      // Update invoice status
      await this.invoicePort.updateInvoiceApprovalStatus(
        invoiceId,
        'pending_approval',
        actor.tenantId
      );

      // Emit audit event
      await this.auditPort.emitTransactional({
        eventType: 'finance.ap.approval.requested',
        entityId: route.id,
        entityUrn: `urn:finance:approval-route:${route.id}`,
        actor: { userId: actor.userId, tenantId: actor.tenantId },
        action: 'request',
        timestamp: new Date(),
        correlationId: txContext.correlationId,
        payload: {
          invoiceId,
          totalLevels: routeConfig.levels.length,
          policySource: routeConfig.policySource,
        },
      }, txContext);

      return route;
    });
  }

  /**
   * Approve an invoice at the current level
   */
  async approve(invoiceId: string, input: ApproveInput, actor: ActorContext): Promise<ApprovalRecord> {
    // Get invoice
    const invoice = await this.invoicePort.getInvoiceForApproval(invoiceId, actor.tenantId);
    if (!invoice) {
      throw new InvoiceNotFoundForApprovalError(invoiceId);
    }

    // SoD check: Cannot approve own invoice
    if (invoice.createdBy === actor.userId) {
      throw new SoDViolationError(invoice.createdBy, actor.userId);
    }

    // Get approval route
    const route = await this.approvalRepo.findRouteByInvoiceId(invoiceId, actor.tenantId);
    if (!route) {
      throw new NotPendingApprovalError(invoiceId, invoice.status);
    }

    if (route.isComplete) {
      throw new AlreadyApprovedError(invoiceId);
    }

    // Get current pending approvals
    const approvals = await this.approvalRepo.listApprovalsForInvoice(invoiceId, actor.tenantId);
    const pendingApproval = approvals.find(a => a.decision === 'pending');

    if (!pendingApproval) {
      throw new NotPendingApprovalError(invoiceId, invoice.status);
    }

    const currentLevel = pendingApproval.approvalLevel;
    const now = new Date();

    // Check if user can approve at this level
    const canApprove = await this.policyPort.isUserApprover(actor.userId, currentLevel, actor.tenantId);
    if (!canApprove) {
      throw new NotAuthorizedToApproveError(actor.userId, `level_${currentLevel}_approver`);
    }

    return await this.approvalRepo.withTransaction(async (txContext) => {
      // Update the pending approval
      const approval = await this.approvalRepo.updateApproval(pendingApproval.id, {
        tenantId: actor.tenantId,
        decision: 'approved',
        comments: input.comments,
        actionedAt: now,
      }, txContext);

      // Check if fully approved
      const isFinalApproval = isFullyApproved(currentLevel, route.totalLevels);

      if (isFinalApproval) {
        // Mark route as complete
        await this.approvalRepo.updateRoute(route.id, {
          tenantId: actor.tenantId,
          isComplete: true,
          completedAt: now,
        }, txContext);

        // Update invoice to approved
        await this.invoicePort.updateInvoiceApprovalStatus(invoiceId, 'approved', actor.tenantId);
      } else {
        // Create pending approval for next level
        const nextLevel = currentLevel + 1;
        const nextLevelConfig = route.routeConfig.levels.find(l => l.level === nextLevel);
        
        if (nextLevelConfig) {
          await this.approvalRepo.createApproval({
            invoiceId,
            tenantId: actor.tenantId,
            approvalLevel: nextLevel,
            totalLevels: route.totalLevels,
            approverId: '',
            approverRole: nextLevelConfig.role,
            decision: 'pending',
          }, txContext);
        }

        // Update invoice to next approval level
        await this.invoicePort.updateInvoiceApprovalStatus(
          invoiceId,
          `approved_level_${currentLevel}`,
          actor.tenantId
        );
      }

      // Emit audit event
      await this.auditPort.emitTransactional({
        eventType: 'finance.ap.approval.approved',
        entityId: approval.id,
        entityUrn: `urn:finance:approval:${approval.id}`,
        actor: { userId: actor.userId, tenantId: actor.tenantId },
        action: 'approve',
        timestamp: now,
        correlationId: txContext.correlationId,
        payload: {
          invoiceId,
          level: currentLevel,
          totalLevels: route.totalLevels,
          isFinalApproval,
          comments: input.comments,
        },
      }, txContext);

      return approval;
    });
  }

  /**
   * Reject an invoice
   */
  async reject(invoiceId: string, input: RejectInput, actor: ActorContext): Promise<ApprovalRecord> {
    const invoice = await this.invoicePort.getInvoiceForApproval(invoiceId, actor.tenantId);
    if (!invoice) {
      throw new InvoiceNotFoundForApprovalError(invoiceId);
    }

    // SoD check
    if (invoice.createdBy === actor.userId) {
      throw new SoDViolationError(invoice.createdBy, actor.userId);
    }

    const route = await this.approvalRepo.findRouteByInvoiceId(invoiceId, actor.tenantId);
    if (!route) {
      throw new NotPendingApprovalError(invoiceId, invoice.status);
    }

    if (invoice.status === 'rejected') {
      throw new AlreadyRejectedError(invoiceId);
    }

    const approvals = await this.approvalRepo.listApprovalsForInvoice(invoiceId, actor.tenantId);
    const pendingApproval = approvals.find(a => a.decision === 'pending');

    if (!pendingApproval) {
      throw new NotPendingApprovalError(invoiceId, invoice.status);
    }

    const now = new Date();

    return await this.approvalRepo.withTransaction(async (txContext) => {
      const approval = await this.approvalRepo.updateApproval(pendingApproval.id, {
        tenantId: actor.tenantId,
        decision: 'rejected',
        comments: input.reason,
        actionedAt: now,
      }, txContext);

      // Update invoice to rejected
      await this.invoicePort.updateInvoiceApprovalStatus(invoiceId, 'rejected', actor.tenantId);

      // Emit audit event
      await this.auditPort.emitTransactional({
        eventType: 'finance.ap.approval.rejected',
        entityId: approval.id,
        entityUrn: `urn:finance:approval:${approval.id}`,
        actor: { userId: actor.userId, tenantId: actor.tenantId },
        action: 'reject',
        timestamp: now,
        correlationId: txContext.correlationId,
        payload: {
          invoiceId,
          reason: input.reason,
          level: pendingApproval.approvalLevel,
        },
      }, txContext);

      return approval;
    });
  }

  /**
   * Get approval inbox for a user
   */
  async getInbox(actor: ActorContext, limit = 50, offset = 0): Promise<{ items: ApprovalInboxItem[]; total: number }> {
    // Also check for delegated approvals
    const delegateFor = await this.policyPort.getDelegateFor(actor.userId, actor.tenantId);
    
    const result = await this.approvalRepo.listPendingApprovals(
      actor.userId,
      actor.tenantId,
      limit,
      offset
    );

    const items: ApprovalInboxItem[] = [];

    for (const approval of result.items) {
      const invoice = await this.invoicePort.getInvoiceForApproval(approval.invoiceId, actor.tenantId);
      if (invoice) {
        const now = new Date();
        const waitingDays = Math.floor(
          (now.getTime() - (invoice.submittedAt?.getTime() || now.getTime())) / (1000 * 60 * 60 * 24)
        );

        items.push({
          approval,
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          vendorName: invoice.vendorName || 'Unknown Vendor',
          totalAmountCents: invoice.totalAmountCents,
          currency: invoice.currency,
          currentLevel: approval.approvalLevel,
          totalLevels: approval.totalLevels,
          submittedAt: invoice.submittedAt || new Date(),
          waitingDays,
        });
      }
    }

    return { items, total: result.total };
  }

  /**
   * Get approval history for an invoice
   */
  async getApprovalHistory(invoiceId: string, actor: ActorContext): Promise<ApprovalRecord[]> {
    return this.approvalRepo.listApprovalsForInvoice(invoiceId, actor.tenantId);
  }

  /**
   * Invalidate approvals when invoice is changed
   */
  async invalidateApprovals(invoiceId: string, actor: ActorContext): Promise<void> {
    await this.approvalRepo.withTransaction(async (txContext) => {
      await this.approvalRepo.invalidateApprovals(invoiceId, actor.tenantId, txContext);

      await this.auditPort.emitTransactional({
        eventType: 'finance.ap.approval.invalidated',
        entityId: invoiceId,
        entityUrn: `urn:finance:invoice:${invoiceId}`,
        actor: { userId: actor.userId, tenantId: actor.tenantId },
        action: 'invalidate',
        timestamp: new Date(),
        correlationId: txContext.correlationId,
        payload: {
          reason: 'Invoice modified after submission',
        },
      }, txContext);
    });
  }
}
