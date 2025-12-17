/**
 * GL-04 Period Close — Period Close Service
 * 
 * Domain service for fiscal period lifecycle management.
 * 
 * @module GL-04
 */

import type { FiscalTimePort, FiscalPeriod, AuditPort, PolicyPort } from '@aibos/kernel-core';
import { PeriodCloseError } from './errors';

// =============================================================================
// Types
// =============================================================================

export interface ActorContext {
  tenantId: string;
  userId: string;
  permissions?: string[];
}

export type PeriodStatus = 'open' | 'soft_close' | 'hard_close' | 'controlled_reopen';

export interface Period {
  id: string;
  tenantId: string;
  companyId: string;
  periodCode: string;
  fiscalYear: number;
  fiscalPeriod: number;
  startDate: Date;
  endDate: Date;
  status: PeriodStatus;
  softClosedBy?: string;
  softClosedAt?: Date;
  hardClosedBy?: string;
  hardClosedAt?: Date;
  hardCloseApprovedBy?: string;
  hardCloseApprovedAt?: Date;
  reopenRequestedBy?: string;
  reopenRequestedAt?: Date;
  reopenApprovedBy?: string;
  reopenApprovedAt?: Date;
  reopenExpiresAt?: Date;
  reopenReason?: string;
  tbSnapshotId?: string;
  tbSnapshotHash?: string;
  version: number;
}

export interface PeriodCloseTask {
  id: string;
  periodId: string;
  taskCode: string;
  taskName: string;
  severity: 'blocking' | 'warning' | 'optional';
  status: 'pending' | 'completed' | 'skipped';
  completedBy?: string;
  completedAt?: Date;
  skippedBy?: string;
  skippedAt?: Date;
  skippedReason?: string;
}

export interface PeriodRepositoryPort {
  findById(id: string, tenantId: string): Promise<Period | null>;
  findByCode(periodCode: string, tenantId: string, companyId: string): Promise<Period | null>;
  findOpenPeriods(tenantId: string, companyId: string): Promise<Period[]>;
  updateStatus(id: string, tenantId: string, status: PeriodStatus, data: Partial<Period>, version: number): Promise<Period>;
  getCloseTasks(periodId: string): Promise<PeriodCloseTask[]>;
  updateTask(taskId: string, data: Partial<PeriodCloseTask>): Promise<PeriodCloseTask>;
  checkPendingEntries(periodId: string): Promise<number>;
}

export interface TrialBalancePort {
  createSnapshot(tenantId: string, companyId: string, periodCode: string): Promise<{ snapshotId: string; hash: string }>;
}

export interface PeriodCloseServiceDeps {
  repository: PeriodRepositoryPort;
  trialBalance: TrialBalancePort;
  audit: AuditPort;
  policy: PolicyPort;
}

// =============================================================================
// State Machine
// =============================================================================

const VALID_TRANSITIONS: Record<PeriodStatus, PeriodStatus[]> = {
  open: ['soft_close'],
  soft_close: ['open', 'hard_close'],
  hard_close: ['controlled_reopen'],
  controlled_reopen: ['hard_close'],
};

function canTransition(from: PeriodStatus, to: PeriodStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// =============================================================================
// Period Close Service
// =============================================================================

export class PeriodCloseService {
  private readonly repository: PeriodRepositoryPort;
  private readonly trialBalance: TrialBalancePort;
  private readonly audit: AuditPort;
  private readonly policy: PolicyPort;

  constructor(deps: PeriodCloseServiceDeps) {
    this.repository = deps.repository;
    this.trialBalance = deps.trialBalance;
    this.audit = deps.audit;
    this.policy = deps.policy;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIATE SOFT CLOSE
  // ═══════════════════════════════════════════════════════════════════════════

  async initiateSoftClose(
    periodCode: string,
    companyId: string,
    actor: ActorContext
  ): Promise<Period> {
    const period = await this.repository.findByCode(periodCode, actor.tenantId, companyId);
    if (!period) {
      throw PeriodCloseError.periodNotFound(periodCode);
    }

    if (!canTransition(period.status, 'soft_close')) {
      throw PeriodCloseError.invalidTransition(period.status, 'soft_close');
    }

    const updated = await this.repository.updateStatus(period.id, actor.tenantId, 'soft_close', {
      softClosedBy: actor.userId,
      softClosedAt: new Date(),
    }, period.version);

    await this.audit.emit({
      eventType: 'finance.gl.period.soft_closed',
      aggregateId: period.id,
      aggregateType: 'Period',
      tenantId: actor.tenantId,
      userId: actor.userId,
      payload: { periodCode, status: 'soft_close' },
    });

    return updated;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REQUEST HARD CLOSE
  // ═══════════════════════════════════════════════════════════════════════════

  async requestHardClose(
    periodCode: string,
    companyId: string,
    actor: ActorContext
  ): Promise<Period> {
    const period = await this.repository.findByCode(periodCode, actor.tenantId, companyId);
    if (!period) {
      throw PeriodCloseError.periodNotFound(periodCode);
    }

    if (period.status !== 'soft_close') {
      throw PeriodCloseError.invalidTransition(period.status, 'hard_close');
    }

    // Check blocking tasks
    const tasks = await this.repository.getCloseTasks(period.id);
    const blockingIncomplete = tasks.filter(
      (t) => t.severity === 'blocking' && t.status === 'pending'
    );
    if (blockingIncomplete.length > 0) {
      throw PeriodCloseError.checklistIncomplete(blockingIncomplete.map((t) => t.taskName));
    }

    // Check pending entries
    const pendingCount = await this.repository.checkPendingEntries(period.id);
    if (pendingCount > 0) {
      throw PeriodCloseError.pendingEntries(pendingCount);
    }

    const updated = await this.repository.updateStatus(period.id, actor.tenantId, period.status, {
      hardClosedBy: actor.userId,
      hardClosedAt: new Date(),
    }, period.version);

    await this.audit.emit({
      eventType: 'finance.gl.period.hard_close_requested',
      aggregateId: period.id,
      aggregateType: 'Period',
      tenantId: actor.tenantId,
      userId: actor.userId,
      payload: { periodCode },
    });

    return updated;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // APPROVE HARD CLOSE (CFO)
  // ═══════════════════════════════════════════════════════════════════════════

  async approveHardClose(
    periodCode: string,
    companyId: string,
    actor: ActorContext
  ): Promise<Period> {
    const period = await this.repository.findByCode(periodCode, actor.tenantId, companyId);
    if (!period) {
      throw PeriodCloseError.periodNotFound(periodCode);
    }

    // SoD: CFO cannot be the one who initiated hard close
    if (period.hardClosedBy === actor.userId) {
      throw PeriodCloseError.sodViolation(period.hardClosedBy, actor.userId);
    }

    // Create TB snapshot before hard close
    const snapshot = await this.trialBalance.createSnapshot(
      actor.tenantId,
      companyId,
      periodCode
    );

    const updated = await this.repository.updateStatus(period.id, actor.tenantId, 'hard_close', {
      hardCloseApprovedBy: actor.userId,
      hardCloseApprovedAt: new Date(),
      tbSnapshotId: snapshot.snapshotId,
      tbSnapshotHash: snapshot.hash,
    }, period.version);

    await this.audit.emit({
      eventType: 'finance.gl.period.hard_closed',
      aggregateId: period.id,
      aggregateType: 'Period',
      tenantId: actor.tenantId,
      userId: actor.userId,
      payload: { periodCode, snapshotId: snapshot.snapshotId, snapshotHash: snapshot.hash },
    });

    return updated;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REQUEST CONTROLLED REOPEN
  // ═══════════════════════════════════════════════════════════════════════════

  async requestControlledReopen(
    periodCode: string,
    companyId: string,
    reason: string,
    expiresInHours: number,
    actor: ActorContext
  ): Promise<Period> {
    const period = await this.repository.findByCode(periodCode, actor.tenantId, companyId);
    if (!period) {
      throw PeriodCloseError.periodNotFound(periodCode);
    }

    if (period.status !== 'hard_close') {
      throw PeriodCloseError.invalidTransition(period.status, 'controlled_reopen');
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    const updated = await this.repository.updateStatus(period.id, actor.tenantId, period.status, {
      reopenRequestedBy: actor.userId,
      reopenRequestedAt: new Date(),
      reopenReason: reason,
      reopenExpiresAt: expiresAt,
    }, period.version);

    await this.audit.emit({
      eventType: 'finance.gl.period.reopen_requested',
      aggregateId: period.id,
      aggregateType: 'Period',
      tenantId: actor.tenantId,
      userId: actor.userId,
      payload: { periodCode, reason, expiresAt },
    });

    return updated;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // APPROVE CONTROLLED REOPEN (CFO)
  // ═══════════════════════════════════════════════════════════════════════════

  async approveControlledReopen(
    periodCode: string,
    companyId: string,
    actor: ActorContext
  ): Promise<Period> {
    const period = await this.repository.findByCode(periodCode, actor.tenantId, companyId);
    if (!period) {
      throw PeriodCloseError.periodNotFound(periodCode);
    }

    // SoD: CFO cannot be the one who requested reopen
    if (period.reopenRequestedBy === actor.userId) {
      throw PeriodCloseError.sodViolation(period.reopenRequestedBy, actor.userId);
    }

    const updated = await this.repository.updateStatus(period.id, actor.tenantId, 'controlled_reopen', {
      reopenApprovedBy: actor.userId,
      reopenApprovedAt: new Date(),
    }, period.version);

    await this.audit.emit({
      eventType: 'finance.gl.period.reopened',
      aggregateId: period.id,
      aggregateType: 'Period',
      tenantId: actor.tenantId,
      userId: actor.userId,
      payload: { periodCode, expiresAt: period.reopenExpiresAt },
    });

    return updated;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GET PERIOD STATUS (for GL-03)
  // ═══════════════════════════════════════════════════════════════════════════

  async getPeriodStatus(
    postingDate: Date,
    tenantId: string,
    companyId: string
  ): Promise<{ canPost: boolean; status: PeriodStatus; period?: Period }> {
    const periods = await this.repository.findOpenPeriods(tenantId, companyId);
    
    const matchingPeriod = periods.find(
      (p) => postingDate >= p.startDate && postingDate <= p.endDate
    );

    if (!matchingPeriod) {
      return { canPost: false, status: 'hard_close' };
    }

    const canPost = matchingPeriod.status === 'open' || 
                    matchingPeriod.status === 'soft_close' ||
                    matchingPeriod.status === 'controlled_reopen';

    return {
      canPost,
      status: matchingPeriod.status,
      period: matchingPeriod,
    };
  }
}
