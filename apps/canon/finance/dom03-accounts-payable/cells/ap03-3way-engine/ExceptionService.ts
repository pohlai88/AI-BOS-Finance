/**
 * AP-03: 3-Way Match & Controls Engine — Exception Service
 * 
 * Manages the exception queue for failed matches.
 */

import type { ActorContext } from '@aibos/canon-governance';
import type { AuditPort } from '@aibos/kernel-core';

import {
  MatchExceptionNotFoundError,
  ExceptionAlreadyResolvedError,
  InvalidExceptionResolutionError,
  MatchResultNotFoundError,
} from './errors';

import type {
  MatchRepositoryPort,
  MatchException,
  MatchResult,
} from './MatchService';

import type { ExceptionType, ExceptionSeverity, ResolutionStatus } from './MatchTypes';

// ============================================================================
// TYPES
// ============================================================================

export interface ExceptionQueueItem {
  exception: MatchException;
  matchResult: MatchResult;
  invoiceId: string;
  invoiceNumber?: string;
  vendorName?: string;
}

export interface ResolveExceptionInput {
  resolutionNotes: string;
}

export interface ExceptionQueryFilters {
  tenantId: string;
  matchResultId?: string;
  exceptionType?: ExceptionType;
  severity?: ExceptionSeverity;
  resolutionStatus?: ResolutionStatus;
  limit?: number;
  offset?: number;
}

export interface ExceptionStatistics {
  totalPending: number;
  bySeverity: Record<ExceptionSeverity, number>;
  byType: Partial<Record<ExceptionType, number>>;
  oldestPendingDays: number;
}

// ============================================================================
// EXCEPTION SERVICE
// ============================================================================

export class ExceptionService {
  constructor(
    private matchRepo: MatchRepositoryPort,
    private auditPort: AuditPort
  ) {}

  /**
   * Get exception queue (pending exceptions)
   */
  async getExceptionQueue(
    actor: ActorContext,
    filters?: Partial<ExceptionQueryFilters>
  ): Promise<{ items: ExceptionQueueItem[]; total: number }> {
    const matchResults = await this.matchRepo.list({
      tenantId: actor.tenantId,
      status: 'exception',
      isOverridden: false,
      limit: filters?.limit || 50,
      offset: filters?.offset || 0,
    });

    const items: ExceptionQueueItem[] = [];

    for (const match of matchResults.results) {
      const exceptions = await this.matchRepo.listExceptions(match.id, actor.tenantId);
      const pendingExceptions = exceptions.filter(e => e.resolutionStatus === 'pending');

      for (const exception of pendingExceptions) {
        items.push({
          exception,
          matchResult: match,
          invoiceId: match.invoiceId,
        });
      }
    }

    return {
      items,
      total: items.length,
    };
  }

  /**
   * Get exceptions for a specific match result
   */
  async getExceptionsForMatch(
    matchResultId: string,
    actor: ActorContext
  ): Promise<MatchException[]> {
    const match = await this.matchRepo.findById(matchResultId, actor.tenantId);
    if (!match) {
      throw new MatchResultNotFoundError(matchResultId);
    }

    return this.matchRepo.listExceptions(matchResultId, actor.tenantId);
  }

  /**
   * Resolve an exception manually
   */
  async resolve(
    exceptionId: string,
    input: ResolveExceptionInput,
    actor: ActorContext
  ): Promise<MatchException> {
    // Find the exception (need to search through matches)
    const matchResults = await this.matchRepo.list({
      tenantId: actor.tenantId,
      status: 'exception',
      limit: 1000, // Large limit to find the exception
    });

    let foundException: MatchException | null = null;
    let foundMatch: MatchResult | null = null;

    for (const match of matchResults.results) {
      const exceptions = await this.matchRepo.listExceptions(match.id, actor.tenantId);
      const exception = exceptions.find(e => e.id === exceptionId);
      if (exception) {
        foundException = exception;
        foundMatch = match;
        break;
      }
    }

    if (!foundException || !foundMatch) {
      throw new MatchExceptionNotFoundError(exceptionId);
    }

    // Check if already resolved
    if (foundException.resolutionStatus !== 'pending') {
      throw new ExceptionAlreadyResolvedError(exceptionId);
    }

    // Validate resolution notes
    if (!input.resolutionNotes || input.resolutionNotes.trim().length === 0) {
      throw new InvalidExceptionResolutionError(exceptionId, 'Resolution notes are required');
    }

    // Resolve the exception
    const resolved = await this.matchRepo.withTransaction(async (txContext) => {
      const updatedException = await this.matchRepo.resolveException(exceptionId, {
        tenantId: actor.tenantId,
        resolutionStatus: 'resolved',
        resolvedBy: actor.userId,
        resolutionNotes: input.resolutionNotes.trim(),
      }, txContext);

      // Emit audit event
      await this.auditPort.emitTransactional({
        eventType: 'finance.ap.match.exception_resolved',
        entityId: exceptionId,
        entityUrn: `urn:finance:match-exception:${exceptionId}`,
        actor: { userId: actor.userId, tenantId: actor.tenantId },
        action: 'resolve',
        timestamp: new Date(),
        correlationId: txContext.correlationId,
        payload: {
          matchResultId: foundMatch.id,
          invoiceId: foundMatch.invoiceId,
          exceptionType: foundException.exceptionType,
          resolutionNotes: input.resolutionNotes,
        },
      }, txContext);

      return updatedException;
    });

    // Check if all exceptions for this match are now resolved
    await this.checkAndUpdateMatchStatus(foundMatch.id, actor);

    return resolved;
  }

  /**
   * Check if all exceptions are resolved and update match status if so
   */
  private async checkAndUpdateMatchStatus(
    matchResultId: string,
    actor: ActorContext
  ): Promise<void> {
    const exceptions = await this.matchRepo.listExceptions(matchResultId, actor.tenantId);
    const pendingCount = exceptions.filter(e => e.resolutionStatus === 'pending').length;

    if (pendingCount === 0) {
      // All exceptions resolved - update match status to passed
      await this.matchRepo.withTransaction(async (txContext) => {
        await this.matchRepo.update(matchResultId, {
          tenantId: actor.tenantId,
          status: 'passed',
        }, txContext);

        await this.auditPort.emitTransactional({
          eventType: 'finance.ap.match.all_exceptions_resolved',
          entityId: matchResultId,
          entityUrn: `urn:finance:match:${matchResultId}`,
          actor: { userId: actor.userId, tenantId: actor.tenantId },
          action: 'resolve_all',
          timestamp: new Date(),
          correlationId: txContext.correlationId,
          payload: {
            resolvedCount: exceptions.length,
          },
        }, txContext);
      });
    }
  }

  /**
   * Get exception statistics for dashboard
   */
  async getStatistics(actor: ActorContext): Promise<ExceptionStatistics> {
    const matchResults = await this.matchRepo.list({
      tenantId: actor.tenantId,
      status: 'exception',
      isOverridden: false,
      limit: 1000,
    });

    let totalPending = 0;
    const bySeverity: Record<ExceptionSeverity, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };
    const byType: Partial<Record<ExceptionType, number>> = {};
    let oldestPendingDate: Date | null = null;

    for (const match of matchResults.results) {
      const exceptions = await this.matchRepo.listExceptions(match.id, actor.tenantId);

      for (const exception of exceptions) {
        if (exception.resolutionStatus === 'pending') {
          totalPending++;
          bySeverity[exception.severity as ExceptionSeverity] =
            (bySeverity[exception.severity as ExceptionSeverity] || 0) + 1;
          byType[exception.exceptionType as ExceptionType] =
            (byType[exception.exceptionType as ExceptionType] || 0) + 1;

          if (!oldestPendingDate || exception.createdAt < oldestPendingDate) {
            oldestPendingDate = exception.createdAt;
          }
        }
      }
    }

    const now = new Date();
    const oldestPendingDays = oldestPendingDate
      ? Math.floor((now.getTime() - oldestPendingDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      totalPending,
      bySeverity,
      byType,
      oldestPendingDays,
    };
  }
}
