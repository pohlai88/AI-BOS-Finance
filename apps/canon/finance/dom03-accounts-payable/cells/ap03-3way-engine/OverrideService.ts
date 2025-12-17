/**
 * AP-03: 3-Way Match & Controls Engine — Override Service
 * 
 * Handles match exception overrides with SoD enforcement.
 */

import type { ActorContext } from '@aibos/canon-governance';
import type { AuditPort } from '@aibos/kernel-core';

import {
  MatchResultNotFoundError,
  MatchResultImmutableError,
  OverrideNotAllowedError,
  OverrideSoDViolationError,
  OverrideAlreadyAppliedError,
  OverrideReasonRequiredError,
  InvalidMatchStatusError,
} from './errors';

import type {
  MatchRepositoryPort,
  MatchTransactionContext,
  MatchResult,
  InvoiceValidationPort,
} from './MatchService';

// ============================================================================
// TYPES
// ============================================================================

export interface OverrideInput {
  reason: string;
}

export interface OverridePermissionPort {
  canOverrideMatch(userId: string, tenantId: string): Promise<boolean>;
}

// ============================================================================
// OVERRIDE SERVICE
// ============================================================================

export class OverrideService {
  constructor(
    private matchRepo: MatchRepositoryPort,
    private invoicePort: InvoiceValidationPort,
    private permissionPort: OverridePermissionPort,
    private auditPort: AuditPort
  ) {}

  /**
   * Override a match exception
   * 
   * AP03-C02: Override path requires policy-gated permission + audit event
   * - Must be a different user than the one who created the match (SoD)
   * - Must have override permission
   * - Must provide a reason
   */
  async override(
    matchResultId: string,
    input: OverrideInput,
    actor: ActorContext,
    version: number
  ): Promise<MatchResult> {
    // Validate input
    if (!input.reason || input.reason.trim().length === 0) {
      throw new OverrideReasonRequiredError();
    }

    // Get match result
    const match = await this.matchRepo.findById(matchResultId, actor.tenantId);
    if (!match) {
      throw new MatchResultNotFoundError(matchResultId);
    }

    // Validate version for optimistic locking
    if (match.version !== version) {
      throw new OverrideNotAllowedError(matchResultId, 'Version mismatch');
    }

    // Check if already overridden
    if (match.isOverridden) {
      throw new OverrideAlreadyAppliedError(matchResultId);
    }

    // Check match status - only 'exception' can be overridden
    if (match.status !== 'exception') {
      throw new InvalidMatchStatusError(match.status, 'exception');
    }

    // Check if invoice is immutable (posted/paid/closed)
    const invoice = await this.invoicePort.getInvoiceForMatch(match.invoiceId, actor.tenantId);
    if (invoice && ['posted', 'paid', 'closed', 'voided'].includes(invoice.status)) {
      throw new MatchResultImmutableError(matchResultId, invoice.status);
    }

    // SoD check: approver must be different from creator
    if (match.createdBy === actor.userId) {
      throw new OverrideSoDViolationError(matchResultId, match.createdBy, actor.userId);
    }

    // Permission check
    const hasPermission = await this.permissionPort.canOverrideMatch(actor.userId, actor.tenantId);
    if (!hasPermission) {
      throw new OverrideNotAllowedError(matchResultId, 'User does not have override permission');
    }

    // Apply override
    const now = new Date();

    return await this.matchRepo.withTransaction(async (txContext) => {
      const updated = await this.matchRepo.update(matchResultId, {
        tenantId: actor.tenantId,
        status: 'passed', // Override changes status to passed
        isOverridden: true,
        overrideApprovedBy: actor.userId,
        overrideApprovedAt: now,
        overrideReason: input.reason.trim(),
      }, txContext);

      // Update invoice match status
      await this.invoicePort.updateInvoiceMatchStatus(
        match.invoiceId,
        'passed',
        matchResultId,
        actor.tenantId
      );

      // Resolve all exceptions as overridden
      const exceptions = await this.matchRepo.listExceptions(matchResultId, actor.tenantId);
      for (const exception of exceptions) {
        if (exception.resolutionStatus === 'pending') {
          await this.matchRepo.resolveException(exception.id, {
            tenantId: actor.tenantId,
            resolutionStatus: 'overridden',
            resolvedBy: actor.userId,
            resolutionNotes: `Overridden by user ${actor.userId}: ${input.reason}`,
          }, txContext);
        }
      }

      // Emit audit event (CRITICAL for compliance)
      await this.auditPort.emitTransactional({
        eventType: 'finance.ap.match.overridden',
        entityId: matchResultId,
        entityUrn: `urn:finance:match:${matchResultId}`,
        actor: { userId: actor.userId, tenantId: actor.tenantId },
        action: 'override',
        timestamp: now,
        correlationId: txContext.correlationId,
        payload: {
          invoiceId: match.invoiceId,
          reason: input.reason,
          originalStatus: match.status,
          createdBy: match.createdBy,
          exceptionCount: exceptions.length,
        },
      }, txContext);

      return updated;
    });
  }

  /**
   * Check if a match can be overridden by a specific user
   */
  async canOverride(matchResultId: string, actor: ActorContext): Promise<{
    canOverride: boolean;
    reason?: string;
  }> {
    const match = await this.matchRepo.findById(matchResultId, actor.tenantId);
    if (!match) {
      return { canOverride: false, reason: 'Match result not found' };
    }

    if (match.isOverridden) {
      return { canOverride: false, reason: 'Already overridden' };
    }

    if (match.status !== 'exception') {
      return { canOverride: false, reason: `Match status is ${match.status}, not exception` };
    }

    if (match.createdBy === actor.userId) {
      return { canOverride: false, reason: 'SoD violation: cannot override own match' };
    }

    const hasPermission = await this.permissionPort.canOverrideMatch(actor.userId, actor.tenantId);
    if (!hasPermission) {
      return { canOverride: false, reason: 'Missing override permission' };
    }

    return { canOverride: true };
  }
}
