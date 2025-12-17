/**
 * Exception Detection Service
 * 
 * AP-05 Payment Execution Cell - Phase 6a Enhancement
 * 
 * Responsibilities:
 * - Detect payment exceptions (missing invoice, stale approval, duplicates, etc.)
 * - Provide exception counts for Risk Queue dashboard
 * - Allow exception resolution tracking
 * 
 * CONT_08 Compliance: Part of Cell's integration layer
 */

import type { Pool, PoolClient } from 'pg';
import type { ActorContext } from '@aibos/canon-governance';
import type { PolicyPort, PaymentRepositoryPort } from '@aibos/kernel-core';

// ============================================================================
// 1. TYPES
// ============================================================================

export type ExceptionType =
  | 'MISSING_INVOICE'
  | 'STALE_APPROVAL'
  | 'DUPLICATE_RISK'
  | 'BANK_DETAIL_CHANGED'
  | 'OVER_LIMIT'
  | 'PERIOD_WARNING';

export type ExceptionSeverity = 'info' | 'warning' | 'critical' | 'block';

export interface PaymentException {
  id: string;
  paymentId: string;
  paymentNumber: string;
  type: ExceptionType;
  severity: ExceptionSeverity;
  message: string;
  detectedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;
  metadata?: Record<string, unknown>;
}

export interface ExceptionCounts {
  critical: number;
  warning: number;
  block: number;
  info: number;
  total: number;
}

export interface ExceptionResolution {
  exceptionId: string;
  resolution: string;
  resolvedBy: string;
  resolvedAt: Date;
}

export interface ExceptionConfig {
  staleApprovalHours: number;
  duplicateWindowHours: number;
  enableMissingInvoice: boolean;
  enableStaleApproval: boolean;
  enableDuplicateRisk: boolean;
  enableBankDetailChanged: boolean;
  enableOverLimit: boolean;
  enablePeriodWarning: boolean;
}

const DEFAULT_CONFIG: ExceptionConfig = {
  staleApprovalHours: 48,
  duplicateWindowHours: 24,
  enableMissingInvoice: true,
  enableStaleApproval: true,
  enableDuplicateRisk: true,
  enableBankDetailChanged: true,
  enableOverLimit: true,
  enablePeriodWarning: true,
};

// ============================================================================
// 2. SERVICE
// ============================================================================

/**
 * ExceptionService - Detects and manages payment exceptions
 */
export class ExceptionService {
  private config: ExceptionConfig;

  constructor(
    private pool: Pool,
    private policyPort?: PolicyPort,
    config?: Partial<ExceptionConfig>
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Detect all exceptions for a tenant
   */
  async detectExceptions(tenantId: string): Promise<PaymentException[]> {
    const exceptions: PaymentException[] = [];

    // Run all detection queries in parallel for performance
    const [
      missingInvoice,
      staleApprovals,
      duplicates,
      bankChanges,
      periodWarnings,
    ] = await Promise.all([
      this.config.enableMissingInvoice ? this.detectMissingInvoice(tenantId) : [],
      this.config.enableStaleApproval ? this.detectStaleApprovals(tenantId) : [],
      this.config.enableDuplicateRisk ? this.detectDuplicates(tenantId) : [],
      this.config.enableBankDetailChanged ? this.detectBankChanges(tenantId) : [],
      this.config.enablePeriodWarning ? this.detectPeriodWarnings(tenantId) : [],
    ]);

    exceptions.push(
      ...missingInvoice,
      ...staleApprovals,
      ...duplicates,
      ...bankChanges,
      ...periodWarnings
    );

    // Filter out resolved exceptions
    const resolved = await this.getResolvedExceptionIds(tenantId);
    return exceptions.filter(exc => !resolved.has(exc.id));
  }

  /**
   * Detect payments without source documents
   */
  private async detectMissingInvoice(tenantId: string): Promise<PaymentException[]> {
    const result = await this.pool.query<{
      id: string;
      payment_number: string;
      vendor_name: string;
      amount: string;
      status: string;
    }>(`
      SELECT id, payment_number, vendor_name, amount, status
      FROM finance.payments
      WHERE tenant_id = $1
        AND source_document_id IS NULL
        AND status NOT IN ('draft', 'rejected', 'failed')
    `, [tenantId]);

    return result.rows.map(row => ({
      id: `exc_${row.id}_missing_invoice`,
      paymentId: row.id,
      paymentNumber: row.payment_number,
      type: 'MISSING_INVOICE' as ExceptionType,
      severity: 'warning' as ExceptionSeverity,
      message: `Payment ${row.payment_number} has no source document`,
      detectedAt: new Date(),
      metadata: {
        amount: row.amount,
        vendor: row.vendor_name,
        status: row.status,
      },
    }));
  }

  /**
   * Detect payments pending approval for too long
   */
  private async detectStaleApprovals(tenantId: string): Promise<PaymentException[]> {
    const result = await this.pool.query<{
      id: string;
      payment_number: string;
      vendor_name: string;
      amount: string;
      updated_at: Date;
    }>(`
      SELECT id, payment_number, vendor_name, amount, updated_at
      FROM finance.payments
      WHERE tenant_id = $1
        AND status = 'pending_approval'
        AND updated_at < NOW() - INTERVAL '${this.config.staleApprovalHours} hours'
    `, [tenantId]);

    return result.rows.map(row => {
      const hoursStale = Math.floor(
        (Date.now() - new Date(row.updated_at).getTime()) / 3600000
      );
      return {
        id: `exc_${row.id}_stale_approval`,
        paymentId: row.id,
        paymentNumber: row.payment_number,
        type: 'STALE_APPROVAL' as ExceptionType,
        severity: 'critical' as ExceptionSeverity,
        message: `Payment ${row.payment_number} pending approval for ${hoursStale}h`,
        detectedAt: new Date(),
        metadata: {
          hoursStale,
          amount: row.amount,
          vendor: row.vendor_name,
          updatedAt: row.updated_at,
        },
      };
    });
  }

  /**
   * Detect potential duplicate payments
   */
  private async detectDuplicates(tenantId: string): Promise<PaymentException[]> {
    const result = await this.pool.query<{
      id: string;
      payment_number: string;
      vendor_id: string;
      vendor_name: string;
      amount: string;
      payment_date: Date;
      dupe_count: number;
    }>(`
      WITH potential_dupes AS (
        SELECT 
          id, payment_number, vendor_id, vendor_name, amount, payment_date,
          COUNT(*) OVER (
            PARTITION BY vendor_id, amount, payment_date
          ) as dupe_count
        FROM finance.payments
        WHERE tenant_id = $1
          AND status NOT IN ('rejected', 'failed', 'completed')
          AND created_at > NOW() - INTERVAL '${this.config.duplicateWindowHours} hours'
      )
      SELECT * FROM potential_dupes WHERE dupe_count > 1
    `, [tenantId]);

    return result.rows.map(row => ({
      id: `exc_${row.id}_duplicate_risk`,
      paymentId: row.id,
      paymentNumber: row.payment_number,
      type: 'DUPLICATE_RISK' as ExceptionType,
      severity: 'block' as ExceptionSeverity,
      message: `Potential duplicate: ${row.vendor_name} - ${row.amount} (${row.dupe_count} matches)`,
      detectedAt: new Date(),
      metadata: {
        vendor: row.vendor_name,
        vendorId: row.vendor_id,
        amount: row.amount,
        paymentDate: row.payment_date,
        duplicateCount: row.dupe_count,
      },
    }));
  }

  /**
   * Detect payments where beneficiary bank details changed after capture
   */
  private async detectBankChanges(tenantId: string): Promise<PaymentException[]> {
    // This requires comparing beneficiary_snapshot with current vendor bank details
    // For now, we detect if there's a snapshot mismatch flag
    const result = await this.pool.query<{
      id: string;
      payment_number: string;
      vendor_name: string;
      amount: string;
    }>(`
      SELECT p.id, p.payment_number, p.vendor_name, p.amount
      FROM finance.payments p
      WHERE p.tenant_id = $1
        AND p.status IN ('approved', 'processing')
        AND p.beneficiary_snapshot_at IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM mdm.vendors v
          WHERE v.id = p.vendor_id
            AND v.bank_updated_at > p.beneficiary_snapshot_at
        )
    `, [tenantId]);

    return result.rows.map(row => ({
      id: `exc_${row.id}_bank_changed`,
      paymentId: row.id,
      paymentNumber: row.payment_number,
      type: 'BANK_DETAIL_CHANGED' as ExceptionType,
      severity: 'warning' as ExceptionSeverity,
      message: `Bank details changed for ${row.vendor_name} after payment capture`,
      detectedAt: new Date(),
      metadata: {
        vendor: row.vendor_name,
        amount: row.amount,
      },
    }));
  }

  /**
   * Detect payments in soft-close periods
   */
  private async detectPeriodWarnings(tenantId: string): Promise<PaymentException[]> {
    // Query payments where payment_date is in a soft-close period
    const result = await this.pool.query<{
      id: string;
      payment_number: string;
      vendor_name: string;
      amount: string;
      payment_date: Date;
    }>(`
      SELECT p.id, p.payment_number, p.vendor_name, p.amount, p.payment_date
      FROM finance.payments p
      WHERE p.tenant_id = $1
        AND p.status NOT IN ('completed', 'failed', 'rejected')
        AND EXISTS (
          SELECT 1 FROM kernel.fiscal_periods fp
          WHERE fp.tenant_id = p.tenant_id
            AND p.payment_date >= fp.start_date
            AND p.payment_date <= fp.end_date
            AND fp.status = 'soft_close'
        )
    `, [tenantId]);

    return result.rows.map(row => ({
      id: `exc_${row.id}_period_warning`,
      paymentId: row.id,
      paymentNumber: row.payment_number,
      type: 'PERIOD_WARNING' as ExceptionType,
      severity: 'warning' as ExceptionSeverity,
      message: `Payment ${row.payment_number} is in a soft-close period`,
      detectedAt: new Date(),
      metadata: {
        vendor: row.vendor_name,
        amount: row.amount,
        paymentDate: row.payment_date,
      },
    }));
  }

  /**
   * Get IDs of resolved exceptions
   */
  private async getResolvedExceptionIds(tenantId: string): Promise<Set<string>> {
    try {
      const result = await this.pool.query<{ exception_id: string }>(`
        SELECT exception_id
        FROM finance.payment_exception_resolutions
        WHERE tenant_id = $1
      `, [tenantId]);

      return new Set(result.rows.map(r => r.exception_id));
    } catch {
      // Table might not exist yet
      return new Set();
    }
  }

  /**
   * Get exception counts by severity
   */
  async getExceptionCounts(tenantId: string): Promise<ExceptionCounts> {
    const exceptions = await this.detectExceptions(tenantId);

    return {
      critical: exceptions.filter(e => e.severity === 'critical').length,
      warning: exceptions.filter(e => e.severity === 'warning').length,
      block: exceptions.filter(e => e.severity === 'block').length,
      info: exceptions.filter(e => e.severity === 'info').length,
      total: exceptions.length,
    };
  }

  /**
   * Get exceptions for a specific payment
   */
  async getExceptionsForPayment(
    tenantId: string,
    paymentId: string
  ): Promise<PaymentException[]> {
    const allExceptions = await this.detectExceptions(tenantId);
    return allExceptions.filter(exc => exc.paymentId === paymentId);
  }

  /**
   * Resolve an exception
   */
  async resolveException(
    exceptionId: string,
    resolution: string,
    actor: ActorContext
  ): Promise<ExceptionResolution> {
    // Parse exception ID to get payment ID and type
    const parts = exceptionId.split('_');
    const paymentId = parts[1];
    const exceptionType = parts.slice(2).join('_').toUpperCase();

    const result = await this.pool.query<{
      id: string;
      exception_id: string;
      resolution: string;
      resolved_by: string;
      resolved_at: Date;
    }>(`
      INSERT INTO finance.payment_exception_resolutions 
        (tenant_id, exception_id, payment_id, exception_type, resolution, resolved_by, resolved_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (tenant_id, exception_id) 
      DO UPDATE SET resolution = $5, resolved_by = $6, resolved_at = NOW()
      RETURNING exception_id, resolution, resolved_by, resolved_at
    `, [
      actor.tenantId,
      exceptionId,
      paymentId,
      exceptionType,
      resolution,
      actor.userId,
    ]);

    const row = result.rows[0];
    return {
      exceptionId: row.exception_id,
      resolution: row.resolution,
      resolvedBy: row.resolved_by,
      resolvedAt: row.resolved_at,
    };
  }

  /**
   * Unresolve an exception (reopen)
   */
  async unresolveException(
    exceptionId: string,
    actor: ActorContext
  ): Promise<void> {
    await this.pool.query(`
      DELETE FROM finance.payment_exception_resolutions
      WHERE tenant_id = $1 AND exception_id = $2
    `, [actor.tenantId, exceptionId]);
  }

  /**
   * Get all resolutions for a tenant
   */
  async getResolutions(tenantId: string): Promise<ExceptionResolution[]> {
    try {
      const result = await this.pool.query<{
        exception_id: string;
        resolution: string;
        resolved_by: string;
        resolved_at: Date;
      }>(`
        SELECT exception_id, resolution, resolved_by, resolved_at
        FROM finance.payment_exception_resolutions
        WHERE tenant_id = $1
        ORDER BY resolved_at DESC
      `, [tenantId]);

      return result.rows.map(row => ({
        exceptionId: row.exception_id,
        resolution: row.resolution,
        resolvedBy: row.resolved_by,
        resolvedAt: row.resolved_at,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Confirm a duplicate is intentional
   */
  async confirmDuplicate(
    paymentId: string,
    reason: string,
    actor: ActorContext
  ): Promise<ExceptionResolution> {
    const exceptionId = `exc_${paymentId}_duplicate_risk`;
    return this.resolveException(exceptionId, `Confirmed: ${reason}`, actor);
  }

  /**
   * Acknowledge a bank detail change
   */
  async acknowledgeBankChange(
    paymentId: string,
    actor: ActorContext
  ): Promise<ExceptionResolution> {
    const exceptionId = `exc_${paymentId}_bank_changed`;
    return this.resolveException(exceptionId, 'Acknowledged bank detail change', actor);
  }
}
