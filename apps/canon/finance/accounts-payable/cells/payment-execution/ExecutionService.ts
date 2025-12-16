/**
 * Execution Service
 * 
 * AP-05 Payment Execution Cell - Payment execution lifecycle.
 * 
 * Responsibilities:
 * - Submit payments for approval (draft → pending_approval)
 * - Execute approved payments (approved → processing)
 * - Complete payments with GL posting (processing → completed)
 * - Handle failures (processing → failed)
 * - Retry failed payments (failed → pending_approval)
 */

import type {
  PaymentRepositoryPort,
  Payment,
  TransactionContext,
  AuditPort,
  EventBusPort,
  GLPostingPort,
  AuditEvent,
} from '@aibos/kernel-core';
import type { ActorContext } from '@aibos/canon-governance';
import { PaymentStateMachine, IllegalStateTransitionError } from '@aibos/canon-governance';
import type { BeneficiarySnapshot } from '../../types';
import {
  PaymentNotFoundError,
  ConcurrencyConflictError,
} from './errors';

// ============================================================================
// 1. TYPES
// ============================================================================

export interface SubmissionResult {
  success: boolean;
  payment: Payment;
}

export interface ExecutionResult {
  success: boolean;
  payment: Payment;
}

export interface CompletionResult {
  success: boolean;
  payment: Payment;
  glEntry?: { journalHeaderId: string };
}

export interface FailureResult {
  success: boolean;
  payment: Payment;
}

export interface RetryResult {
  success: boolean;
  payment: Payment;
}

// ============================================================================
// 2. SERVICE
// ============================================================================

/**
 * ExecutionService - Manages payment execution lifecycle
 */
export class ExecutionService {
  constructor(
    private paymentRepo: PaymentRepositoryPort,
    private auditPort: AuditPort,
    private eventBus: EventBusPort,
    private glPostingPort: GLPostingPort
  ) { }

  /**
   * Submit a draft payment for approval
   */
  async submit(
    paymentId: string,
    actor: ActorContext,
    expectedVersion: number
  ): Promise<SubmissionResult> {
    return this.paymentRepo.withTransaction(async (txContext) => {
      const payment = await this.paymentRepo.findByIdForUpdate(
        paymentId,
        actor.tenantId,
        txContext
      );

      if (!payment) throw new PaymentNotFoundError(paymentId);
      if (payment.version !== expectedVersion) {
        throw new ConcurrencyConflictError(expectedVersion, payment.version);
      }

      if (!PaymentStateMachine.canTransition(payment.status, 'submit')) {
        throw new IllegalStateTransitionError(payment.status, 'submit');
      }

      const nextStatus = PaymentStateMachine.getNextStatus(payment.status, 'submit');
      const updatedPayment = await this.paymentRepo.updateStatus(
        paymentId,
        { status: nextStatus },
        txContext
      );

      const auditEvent: AuditEvent = {
        eventType: 'finance.ap.payment.submitted',
        entityId: paymentId,
        entityUrn: `urn:finance:payment:${paymentId}`,
        actor: {
          userId: actor.userId,
          tenantId: actor.tenantId,
          sessionId: actor.sessionId,
          ipAddress: actor.ipAddress,
        },
        payload: {
          action: 'submitted',
          before: { status: payment.status },
          after: { status: nextStatus },
        },
      };
      await this.auditPort.emitTransactional(auditEvent, txContext);

      await this.eventBus.writeToOutbox(
        'finance.ap.payment.submitted',
        { paymentId, tenantId: actor.tenantId },
        txContext
      );

      return { success: true, payment: updatedPayment };
    });
  }

  /**
   * Execute an approved payment (send to bank)
   */
  async execute(
    paymentId: string,
    actor: ActorContext,
    expectedVersion: number,
    beneficiarySnapshot: BeneficiarySnapshot
  ): Promise<ExecutionResult> {
    return this.paymentRepo.withTransaction(async (txContext) => {
      const payment = await this.paymentRepo.findByIdForUpdate(
        paymentId,
        actor.tenantId,
        txContext
      );

      if (!payment) throw new PaymentNotFoundError(paymentId);
      if (payment.version !== expectedVersion) {
        throw new ConcurrencyConflictError(expectedVersion, payment.version);
      }

      if (!PaymentStateMachine.canTransition(payment.status, 'execute')) {
        throw new IllegalStateTransitionError(payment.status, 'execute');
      }

      // Snapshot beneficiary details at execution time (audit-proof)
      const nextStatus = PaymentStateMachine.getNextStatus(payment.status, 'execute');
      const updatedPayment = await this.paymentRepo.updateStatus(
        paymentId,
        {
          status: nextStatus,
          executedBy: actor.userId,
          executedAt: new Date(),
          beneficiaryAccountNumber: beneficiarySnapshot.accountNumber,
          beneficiaryRoutingNumber: beneficiarySnapshot.routingNumber,
          beneficiaryBankName: beneficiarySnapshot.bankName,
          beneficiaryAccountName: beneficiarySnapshot.accountName,
          beneficiarySwiftCode: beneficiarySnapshot.swiftCode,
          beneficiarySnapshotAt: new Date(),
        },
        txContext
      );

      // Write payment instruction to outbox (for bank integration dispatcher)
      await this.eventBus.writeToOutbox(
        'finance.ap.payment.instruction.created',
        {
          paymentId,
          beneficiary: beneficiarySnapshot,
          amount: payment.amount,
          currency: payment.currency,
          tenantId: actor.tenantId,
        },
        txContext
      );

      const auditEvent: AuditEvent = {
        eventType: 'finance.ap.payment.executed',
        entityId: paymentId,
        entityUrn: `urn:finance:payment:${paymentId}`,
        actor: {
          userId: actor.userId,
          tenantId: actor.tenantId,
          sessionId: actor.sessionId,
          ipAddress: actor.ipAddress,
        },
        payload: {
          action: 'executed',
          before: { status: payment.status },
          after: { status: nextStatus, beneficiary: beneficiarySnapshot },
        },
      };
      await this.auditPort.emitTransactional(auditEvent, txContext);

      await this.eventBus.writeToOutbox(
        'finance.ap.payment.executed',
        { paymentId, executedBy: actor.userId, tenantId: actor.tenantId },
        txContext
      );

      return { success: true, payment: updatedPayment };
    });
  }

  /**
   * Complete a processing payment (bank confirmed)
   */
  async complete(
    paymentId: string,
    actor: ActorContext,
    expectedVersion: number,
    bankConfirmationRef: string
  ): Promise<CompletionResult> {
    return this.paymentRepo.withTransaction(async (txContext) => {
      const payment = await this.paymentRepo.findByIdForUpdate(
        paymentId,
        actor.tenantId,
        txContext
      );

      if (!payment) throw new PaymentNotFoundError(paymentId);
      if (payment.version !== expectedVersion) {
        throw new ConcurrencyConflictError(expectedVersion, payment.version);
      }

      if (!PaymentStateMachine.canTransition(payment.status, 'complete')) {
        throw new IllegalStateTransitionError(payment.status, 'complete');
      }

      const nextStatus = PaymentStateMachine.getNextStatus(payment.status, 'complete');

      // GL Posting: Create GL entry on completion (bank-confirmed)
      // Dr AP Liability, Cr Cash
      const glEntry = await this.glPostingPort.createPaymentPosting(
        {
          paymentId,
          tenantId: actor.tenantId,
          companyId: payment.companyId,
          amount: payment.functionalAmount || payment.amount,
          currency: payment.functionalCurrency || payment.currency,
          paymentDate: payment.paymentDate,
          bankConfirmationRef,
        },
        txContext
      );

      const updatedPayment = await this.paymentRepo.updateStatus(
        paymentId,
        {
          status: nextStatus,
          journalHeaderId: glEntry.journalHeaderId,
        },
        txContext
      );

      const auditEvent: AuditEvent = {
        eventType: 'finance.ap.payment.completed',
        entityId: paymentId,
        entityUrn: `urn:finance:payment:${paymentId}`,
        actor: {
          userId: actor.userId,
          tenantId: actor.tenantId,
          sessionId: actor.sessionId,
          ipAddress: actor.ipAddress,
        },
        payload: {
          action: 'completed',
          before: { status: payment.status },
          after: { status: nextStatus, journalHeaderId: glEntry.journalHeaderId },
          bankConfirmationRef,
        },
      };
      await this.auditPort.emitTransactional(auditEvent, txContext);

      await this.eventBus.writeToOutbox(
        'finance.ap.payment.completed',
        { paymentId, journalHeaderId: glEntry.journalHeaderId, bankConfirmationRef, tenantId: actor.tenantId },
        txContext
      );

      return { success: true, payment: updatedPayment, glEntry };
    });
  }

  /**
   * Mark a processing payment as failed
   */
  async fail(
    paymentId: string,
    actor: ActorContext,
    expectedVersion: number,
    failureReason: string
  ): Promise<FailureResult> {
    return this.paymentRepo.withTransaction(async (txContext) => {
      const payment = await this.paymentRepo.findByIdForUpdate(
        paymentId,
        actor.tenantId,
        txContext
      );

      if (!payment) throw new PaymentNotFoundError(paymentId);
      if (payment.version !== expectedVersion) {
        throw new ConcurrencyConflictError(expectedVersion, payment.version);
      }

      if (!PaymentStateMachine.canTransition(payment.status, 'fail')) {
        throw new IllegalStateTransitionError(payment.status, 'fail');
      }

      const nextStatus = PaymentStateMachine.getNextStatus(payment.status, 'fail');
      const updatedPayment = await this.paymentRepo.updateStatus(
        paymentId,
        { status: nextStatus },
        txContext
      );

      const auditEvent: AuditEvent = {
        eventType: 'finance.ap.payment.failed',
        entityId: paymentId,
        entityUrn: `urn:finance:payment:${paymentId}`,
        actor: {
          userId: actor.userId,
          tenantId: actor.tenantId,
          sessionId: actor.sessionId,
          ipAddress: actor.ipAddress,
        },
        payload: {
          action: 'failed',
          before: { status: payment.status },
          after: { status: nextStatus },
          failureReason,
        },
      };
      await this.auditPort.emitTransactional(auditEvent, txContext);

      await this.eventBus.writeToOutbox(
        'finance.ap.payment.failed',
        { paymentId, failureReason, tenantId: actor.tenantId },
        txContext
      );

      return { success: true, payment: updatedPayment };
    });
  }

  /**
   * Retry a failed payment
   */
  async retry(
    paymentId: string,
    actor: ActorContext,
    expectedVersion: number
  ): Promise<RetryResult> {
    return this.paymentRepo.withTransaction(async (txContext) => {
      const payment = await this.paymentRepo.findByIdForUpdate(
        paymentId,
        actor.tenantId,
        txContext
      );

      if (!payment) throw new PaymentNotFoundError(paymentId);
      if (payment.version !== expectedVersion) {
        throw new ConcurrencyConflictError(expectedVersion, payment.version);
      }

      if (!PaymentStateMachine.canTransition(payment.status, 'retry')) {
        throw new IllegalStateTransitionError(payment.status, 'retry');
      }

      const nextStatus = PaymentStateMachine.getNextStatus(payment.status, 'retry');
      const updatedPayment = await this.paymentRepo.updateStatus(
        paymentId,
        { status: nextStatus },
        txContext
      );

      const auditEvent: AuditEvent = {
        eventType: 'finance.ap.payment.retried',
        entityId: paymentId,
        entityUrn: `urn:finance:payment:${paymentId}`,
        actor: {
          userId: actor.userId,
          tenantId: actor.tenantId,
          sessionId: actor.sessionId,
          ipAddress: actor.ipAddress,
        },
        payload: {
          action: 'retried',
          before: { status: payment.status },
          after: { status: nextStatus },
        },
      };
      await this.auditPort.emitTransactional(auditEvent, txContext);

      await this.eventBus.writeToOutbox(
        'finance.ap.payment.retried',
        { paymentId, tenantId: actor.tenantId },
        txContext
      );

      return { success: true, payment: updatedPayment };
    });
  }
}
