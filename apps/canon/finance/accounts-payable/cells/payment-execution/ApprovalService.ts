/**
 * Approval Service
 * 
 * AP-05 Payment Execution Cell - Payment approval workflow.
 * 
 * Responsibilities:
 * - Approve payments (pending_approval → approved)
 * - Reject payments (pending_approval → rejected)
 * - Enforce Segregation of Duties (SoD)
 * - Record approval history
 * - Emit transactional audit events
 */

import type {
  PaymentRepositoryPort,
  Payment,
  TransactionContext,
  PolicyPort,
  AuditPort,
  EventBusPort,
  AuditEvent,
} from '@aibos/kernel-core';
import type { ActorContext } from '@aibos/canon-governance';
import { PaymentStateMachine, IllegalStateTransitionError } from '@aibos/canon-governance';
import {
  PaymentNotFoundError,
  ConcurrencyConflictError,
  SoDViolationError,
} from './errors';

// ============================================================================
// 1. TYPES
// ============================================================================

export interface ApprovalResult {
  success: boolean;
  payment: Payment;
}

export interface RejectionResult {
  success: boolean;
  payment: Payment;
}

// ============================================================================
// 2. SERVICE
// ============================================================================

/**
 * ApprovalService - Manages payment approval workflow
 */
export class ApprovalService {
  constructor(
    private paymentRepo: PaymentRepositoryPort,
    private auditPort: AuditPort,
    private policyPort: PolicyPort,
    private eventBus: EventBusPort
  ) { }

  /**
   * Approve a payment
   * 
   * @param paymentId - Payment ID
   * @param actor - Who is approving
   * @param expectedVersion - Expected version (optimistic locking)
   * @param comment - Optional approval comment
   */
  async approve(
    paymentId: string,
    actor: ActorContext,
    expectedVersion: number,
    comment?: string
  ): Promise<ApprovalResult> {
    return this.paymentRepo.withTransaction(async (txContext) => {
      // 1. Fetch payment with version check
      const payment = await this.paymentRepo.findByIdForUpdate(
        paymentId,
        actor.tenantId,
        txContext
      );

      if (!payment) {
        throw new PaymentNotFoundError(paymentId);
      }

      // 2. Version check (concurrency control)
      if (payment.version !== expectedVersion) {
        throw new ConcurrencyConflictError(expectedVersion, payment.version);
      }

      // 3. State machine check
      if (!PaymentStateMachine.canTransition(payment.status, 'approve')) {
        throw new IllegalStateTransitionError(payment.status, 'approve');
      }

      // 4. SoD check (Maker cannot be Checker)
      const sodResult = await this.policyPort.evaluateSoD(
        payment.createdBy,
        actor.userId
      );
      if (!sodResult.allowed) {
        throw new SoDViolationError(sodResult.reason || 'Maker cannot approve own payment');
      }

      // 5. Update status
      const nextStatus = PaymentStateMachine.getNextStatus(payment.status, 'approve');
      const updatedPayment = await this.paymentRepo.updateStatus(
        paymentId,
        {
          status: nextStatus,
          approvedBy: actor.userId,
          approvedAt: new Date(),
        },
        txContext
      );

      // 6. Record approval
      await this.paymentRepo.recordApproval(
        {
          paymentId,
          tenantId: actor.tenantId,
          level: 1,
          approverId: actor.userId,
          action: 'approved',
          comment,
        },
        txContext
      );

      // 7. Emit audit (TRANSACTIONAL)
      const auditEvent: AuditEvent = {
        eventType: 'finance.ap.payment.approved',
        entityId: paymentId,
        entityUrn: `urn:finance:payment:${paymentId}`,
        actor: {
          userId: actor.userId,
          tenantId: actor.tenantId,
          sessionId: actor.sessionId,
          ipAddress: actor.ipAddress,
        },
        payload: {
          action: 'approved',
          before: { status: payment.status },
          after: { status: nextStatus },
        },
      };
      await this.auditPort.emitTransactional(auditEvent, txContext);

      // 8. Write event to transactional outbox (same transaction)
      await this.eventBus.writeToOutbox(
        'finance.ap.payment.approved',
        { paymentId, approvedBy: actor.userId, tenantId: actor.tenantId },
        txContext
      );

      // 9. COMMIT (audit + payment + approval + outbox are atomic)
      return { success: true, payment: updatedPayment };
    });
  }

  /**
   * Reject a payment
   * 
   * @param paymentId - Payment ID
   * @param actor - Who is rejecting
   * @param expectedVersion - Expected version (optimistic locking)
   * @param comment - Optional rejection reason
   */
  async reject(
    paymentId: string,
    actor: ActorContext,
    expectedVersion: number,
    comment?: string
  ): Promise<RejectionResult> {
    return this.paymentRepo.withTransaction(async (txContext) => {
      // 1. Fetch payment
      const payment = await this.paymentRepo.findByIdForUpdate(
        paymentId,
        actor.tenantId,
        txContext
      );

      if (!payment) {
        throw new PaymentNotFoundError(paymentId);
      }

      // 2. Version check
      if (payment.version !== expectedVersion) {
        throw new ConcurrencyConflictError(expectedVersion, payment.version);
      }

      // 3. State machine check
      if (!PaymentStateMachine.canTransition(payment.status, 'reject')) {
        throw new IllegalStateTransitionError(payment.status, 'reject');
      }

      // 4. Update status
      const nextStatus = PaymentStateMachine.getNextStatus(payment.status, 'reject');
      const updatedPayment = await this.paymentRepo.updateStatus(
        paymentId,
        { status: nextStatus },
        txContext
      );

      // 5. Record rejection
      await this.paymentRepo.recordApproval(
        {
          paymentId,
          tenantId: actor.tenantId,
          level: 1,
          approverId: actor.userId,
          action: 'rejected',
          comment,
        },
        txContext
      );

      // 6. Emit audit
      const auditEvent: AuditEvent = {
        eventType: 'finance.ap.payment.rejected',
        entityId: paymentId,
        entityUrn: `urn:finance:payment:${paymentId}`,
        actor: {
          userId: actor.userId,
          tenantId: actor.tenantId,
          sessionId: actor.sessionId,
          ipAddress: actor.ipAddress,
        },
        payload: {
          action: 'rejected',
          before: { status: payment.status },
          after: { status: nextStatus },
          comment,
        },
      };
      await this.auditPort.emitTransactional(auditEvent, txContext);

      // 7. Write event to outbox
      await this.eventBus.writeToOutbox(
        'finance.ap.payment.rejected',
        { paymentId, rejectedBy: actor.userId, comment, tenantId: actor.tenantId },
        txContext
      );

      return { success: true, payment: updatedPayment };
    });
  }
}
