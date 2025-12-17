/**
 * GL-05 Trial Balance — Trial Balance Service
 * 
 * Domain service for trial balance generation and verification.
 * 
 * @module GL-05
 */

import type { COAPort, Account, AuditPort } from '@aibos/kernel-core';
import { TrialBalanceError } from './errors';
import * as crypto from 'crypto';

// =============================================================================
// Types
// =============================================================================

export interface ActorContext {
  tenantId: string;
  userId: string;
  permissions?: string[];
}

export interface TrialBalanceLine {
  accountCode: string;
  accountName: string;
  accountType: string;
  openingDebit: string;
  openingCredit: string;
  periodDebit: string;
  periodCredit: string;
  closingDebit: string;
  closingCredit: string;
}

export interface TrialBalance {
  periodCode: string;
  companyId: string;
  generatedAt: Date;
  lines: TrialBalanceLine[];
  totalOpeningDebit: string;
  totalOpeningCredit: string;
  totalPeriodDebit: string;
  totalPeriodCredit: string;
  totalClosingDebit: string;
  totalClosingCredit: string;
  isBalanced: boolean;
}

export interface TBSnapshot {
  id: string;
  tenantId: string;
  companyId: string;
  periodCode: string;
  snapshotHash: string;
  snapshotData: TrialBalance;
  isImmutable: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface TBVariance {
  accountCode: string;
  accountName: string;
  period1Balance: string;
  period2Balance: string;
  variance: string;
  variancePercent: number;
}

export interface LedgerQueryPort {
  getAccountBalances(
    tenantId: string,
    companyId: string,
    periodCode: string
  ): Promise<Array<{
    accountCode: string;
    debitSum: string;
    creditSum: string;
  }>>;
  getOpeningBalances(
    tenantId: string,
    companyId: string,
    asOfDate: Date
  ): Promise<Array<{
    accountCode: string;
    balance: string;
    normalBalance: 'DEBIT' | 'CREDIT';
  }>>;
}

export interface TBSnapshotRepositoryPort {
  findById(id: string, tenantId: string): Promise<TBSnapshot | null>;
  findByPeriod(periodCode: string, tenantId: string, companyId: string): Promise<TBSnapshot | null>;
  create(snapshot: Omit<TBSnapshot, 'id'>): Promise<TBSnapshot>;
  findAll(tenantId: string, companyId: string): Promise<TBSnapshot[]>;
}

export interface TrialBalanceServiceDeps {
  snapshotRepository: TBSnapshotRepositoryPort;
  ledgerQuery: LedgerQueryPort;
  coa: COAPort;
  audit: AuditPort;
}

// =============================================================================
// Trial Balance Service
// =============================================================================

export class TrialBalanceService {
  private readonly snapshotRepo: TBSnapshotRepositoryPort;
  private readonly ledgerQuery: LedgerQueryPort;
  private readonly coa: COAPort;
  private readonly audit: AuditPort;

  constructor(deps: TrialBalanceServiceDeps) {
    this.snapshotRepo = deps.snapshotRepository;
    this.ledgerQuery = deps.ledgerQuery;
    this.coa = deps.coa;
    this.audit = deps.audit;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GENERATE TRIAL BALANCE (Live Calculation)
  // ═══════════════════════════════════════════════════════════════════════════

  async generateTrialBalance(
    periodCode: string,
    companyId: string,
    actor: ActorContext
  ): Promise<TrialBalance> {
    // Get account balances from ledger
    const balances = await this.ledgerQuery.getAccountBalances(
      actor.tenantId,
      companyId,
      periodCode
    );

    if (balances.length === 0) {
      throw TrialBalanceError.noLedgerData(periodCode);
    }

    // Get account details from COA
    const accounts = await this.coa.searchAccounts({
      tenantId: actor.tenantId,
      companyId,
      postableOnly: true,
    });

    const accountMap = new Map(accounts.map((a) => [a.accountCode, a]));

    // Build TB lines
    const lines: TrialBalanceLine[] = balances.map((b) => {
      const account = accountMap.get(b.accountCode);
      const debit = parseFloat(b.debitSum);
      const credit = parseFloat(b.creditSum);
      const netDebit = debit > credit ? (debit - credit).toFixed(2) : '0.00';
      const netCredit = credit > debit ? (credit - debit).toFixed(2) : '0.00';

      return {
        accountCode: b.accountCode,
        accountName: account?.accountName || 'Unknown',
        accountType: account?.accountType || 'UNKNOWN',
        openingDebit: '0.00',  // Simplified - would need opening balance calc
        openingCredit: '0.00',
        periodDebit: b.debitSum,
        periodCredit: b.creditSum,
        closingDebit: netDebit,
        closingCredit: netCredit,
      };
    });

    // Sort by account code
    lines.sort((a, b) => a.accountCode.localeCompare(b.accountCode));

    // Calculate totals
    const totals = this.calculateTotals(lines);

    const tb: TrialBalance = {
      periodCode,
      companyId,
      generatedAt: new Date(),
      lines,
      ...totals,
      isBalanced: this.isBalanced(totals.totalClosingDebit, totals.totalClosingCredit),
    };

    // Log access
    await this.audit.emit({
      eventType: 'finance.gl.tb.generated',
      aggregateId: periodCode,
      aggregateType: 'TrialBalance',
      tenantId: actor.tenantId,
      userId: actor.userId,
      payload: { periodCode, lineCount: lines.length, isBalanced: tb.isBalanced },
    });

    return tb;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CREATE SNAPSHOT (Called by GL-04 on Period Close)
  // ═══════════════════════════════════════════════════════════════════════════

  async createSnapshot(
    periodCode: string,
    companyId: string,
    actor: ActorContext
  ): Promise<{ snapshotId: string; hash: string }> {
    // Check if snapshot already exists
    const existing = await this.snapshotRepo.findByPeriod(periodCode, actor.tenantId, companyId);
    if (existing) {
      throw TrialBalanceError.snapshotAlreadyExists(periodCode);
    }

    // Generate TB
    const tb = await this.generateTrialBalance(periodCode, companyId, actor);

    // Compute canonical hash
    const hash = this.computeCanonicalHash(tb);

    // Create snapshot
    const snapshot = await this.snapshotRepo.create({
      tenantId: actor.tenantId,
      companyId,
      periodCode,
      snapshotHash: hash,
      snapshotData: tb,
      isImmutable: true,
      createdBy: actor.userId,
      createdAt: new Date(),
    });

    // Log creation
    await this.audit.emit({
      eventType: 'finance.gl.tb.snapshot_created',
      aggregateId: snapshot.id,
      aggregateType: 'TBSnapshot',
      tenantId: actor.tenantId,
      userId: actor.userId,
      payload: { periodCode, hash, lineCount: tb.lines.length },
    });

    return { snapshotId: snapshot.id, hash };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VERIFY SNAPSHOT (Called on Access)
  // ═══════════════════════════════════════════════════════════════════════════

  async verifySnapshot(
    snapshotId: string,
    actor: ActorContext
  ): Promise<{ valid: boolean; snapshot: TBSnapshot }> {
    const snapshot = await this.snapshotRepo.findById(snapshotId, actor.tenantId);
    if (!snapshot) {
      throw TrialBalanceError.snapshotNotFound(snapshotId);
    }

    // Recompute hash
    const recomputedHash = this.computeCanonicalHash(snapshot.snapshotData);
    const valid = recomputedHash === snapshot.snapshotHash;

    // Log access
    await this.audit.emit({
      eventType: 'finance.gl.tb.accessed',
      aggregateId: snapshotId,
      aggregateType: 'TBSnapshot',
      tenantId: actor.tenantId,
      userId: actor.userId,
      payload: {
        periodCode: snapshot.periodCode,
        hashValid: valid,
        storedHash: snapshot.snapshotHash,
        recomputedHash,
      },
    });

    if (!valid) {
      // CRITICAL ALERT
      await this.audit.emit({
        eventType: 'finance.gl.tb.hash_mismatch',
        aggregateId: snapshotId,
        aggregateType: 'TBSnapshot',
        tenantId: actor.tenantId,
        userId: actor.userId,
        payload: {
          periodCode: snapshot.periodCode,
          storedHash: snapshot.snapshotHash,
          recomputedHash,
          severity: 'CRITICAL',
        },
      });
    }

    return { valid, snapshot };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GET VARIANCE BETWEEN PERIODS
  // ═══════════════════════════════════════════════════════════════════════════

  async getVariance(
    period1Code: string,
    period2Code: string,
    companyId: string,
    actor: ActorContext
  ): Promise<TBVariance[]> {
    const [snapshot1, snapshot2] = await Promise.all([
      this.snapshotRepo.findByPeriod(period1Code, actor.tenantId, companyId),
      this.snapshotRepo.findByPeriod(period2Code, actor.tenantId, companyId),
    ]);

    if (!snapshot1) throw TrialBalanceError.snapshotNotFound(period1Code);
    if (!snapshot2) throw TrialBalanceError.snapshotNotFound(period2Code);

    // Build variance report
    const period1Map = new Map(
      snapshot1.snapshotData.lines.map((l) => [l.accountCode, l])
    );
    const period2Map = new Map(
      snapshot2.snapshotData.lines.map((l) => [l.accountCode, l])
    );

    const allAccounts = new Set([...period1Map.keys(), ...period2Map.keys()]);
    const variances: TBVariance[] = [];

    for (const accountCode of allAccounts) {
      const p1 = period1Map.get(accountCode);
      const p2 = period2Map.get(accountCode);

      const p1Balance = parseFloat(p1?.closingDebit || '0') - parseFloat(p1?.closingCredit || '0');
      const p2Balance = parseFloat(p2?.closingDebit || '0') - parseFloat(p2?.closingCredit || '0');
      const variance = p2Balance - p1Balance;
      const variancePercent = p1Balance !== 0 ? (variance / Math.abs(p1Balance)) * 100 : 0;

      variances.push({
        accountCode,
        accountName: p1?.accountName || p2?.accountName || 'Unknown',
        period1Balance: p1Balance.toFixed(2),
        period2Balance: p2Balance.toFixed(2),
        variance: variance.toFixed(2),
        variancePercent: parseFloat(variancePercent.toFixed(2)),
      });
    }

    return variances.sort((a, b) => a.accountCode.localeCompare(b.accountCode));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  private calculateTotals(lines: TrialBalanceLine[]): {
    totalOpeningDebit: string;
    totalOpeningCredit: string;
    totalPeriodDebit: string;
    totalPeriodCredit: string;
    totalClosingDebit: string;
    totalClosingCredit: string;
  } {
    let openingDebit = 0, openingCredit = 0;
    let periodDebit = 0, periodCredit = 0;
    let closingDebit = 0, closingCredit = 0;

    for (const line of lines) {
      openingDebit += parseFloat(line.openingDebit);
      openingCredit += parseFloat(line.openingCredit);
      periodDebit += parseFloat(line.periodDebit);
      periodCredit += parseFloat(line.periodCredit);
      closingDebit += parseFloat(line.closingDebit);
      closingCredit += parseFloat(line.closingCredit);
    }

    return {
      totalOpeningDebit: openingDebit.toFixed(2),
      totalOpeningCredit: openingCredit.toFixed(2),
      totalPeriodDebit: periodDebit.toFixed(2),
      totalPeriodCredit: periodCredit.toFixed(2),
      totalClosingDebit: closingDebit.toFixed(2),
      totalClosingCredit: closingCredit.toFixed(2),
    };
  }

  private isBalanced(totalDebit: string, totalCredit: string): boolean {
    return Math.abs(parseFloat(totalDebit) - parseFloat(totalCredit)) < 0.01;
  }

  private computeCanonicalHash(tb: TrialBalance): string {
    // Canonical format: sorted by account_code, fixed precision
    const canonical = {
      periodCode: tb.periodCode,
      lines: tb.lines
        .slice()
        .sort((a, b) => a.accountCode.localeCompare(b.accountCode))
        .map((l) => ({
          account_code: l.accountCode,
          opening_debit: parseFloat(l.openingDebit).toFixed(2),
          opening_credit: parseFloat(l.openingCredit).toFixed(2),
          period_debit: parseFloat(l.periodDebit).toFixed(2),
          period_credit: parseFloat(l.periodCredit).toFixed(2),
          closing_debit: parseFloat(l.closingDebit).toFixed(2),
          closing_credit: parseFloat(l.closingCredit).toFixed(2),
        })),
      total_opening_debit: parseFloat(tb.totalOpeningDebit).toFixed(2),
      total_opening_credit: parseFloat(tb.totalOpeningCredit).toFixed(2),
      total_period_debit: parseFloat(tb.totalPeriodDebit).toFixed(2),
      total_period_credit: parseFloat(tb.totalPeriodCredit).toFixed(2),
      total_closing_debit: parseFloat(tb.totalClosingDebit).toFixed(2),
      total_closing_credit: parseFloat(tb.totalClosingCredit).toFixed(2),
    };

    const canonicalJson = JSON.stringify(canonical);
    return crypto.createHash('sha256').update(canonicalJson).digest('hex');
  }
}
