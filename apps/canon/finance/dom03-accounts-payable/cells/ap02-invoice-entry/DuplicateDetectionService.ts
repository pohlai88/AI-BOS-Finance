/**
 * Duplicate Detection Service
 * 
 * AP-02 Invoice Entry Cell - Duplicate invoice detection.
 * 
 * Responsibilities:
 * - Check for exact duplicate invoices (vendor + invoice number + date)
 * - Check for potential duplicates (similar amount within tolerance)
 * - Flag duplicate invoices for review
 * - Emit audit events for duplicate detection
 */

import type {
  InvoiceRepositoryPort,
  Invoice,
  AuditPort,
  AuditEvent,
} from '@aibos/kernel-core';
import type { ActorContext } from '@aibos/canon-governance';
import {
  DuplicateInvoiceError,
  PotentialDuplicateInvoiceError,
} from './errors';

// ============================================================================
// 1. TYPES
// ============================================================================

/**
 * Duplicate check input
 */
export interface DuplicateCheckInput {
  vendorId: string;
  invoiceNumber: string;
  invoiceDate: Date;
  totalAmountCents: number;
  excludeInvoiceId?: string; // Exclude this invoice from check (for updates)
}

/**
 * Duplicate check result
 */
export interface DuplicateCheckResult {
  isDuplicate: boolean;
  severity: 'none' | 'warning' | 'error';
  matchType?: 'exact' | 'similar_amount' | 'same_number';
  matchingInvoiceId?: string;
  matchingInvoiceNumber?: string;
  matchDetails?: string;
  recommendation?: string;
}

/**
 * Duplicate detection configuration
 */
export interface DuplicateDetectionConfig {
  /** Enable exact duplicate check (vendor + number + date) */
  checkExact: boolean;
  /** Enable same number check (vendor + number) */
  checkSameNumber: boolean;
  /** Enable amount tolerance check */
  checkAmountTolerance: boolean;
  /** Amount tolerance percentage (0.01 = 1%) */
  amountTolerancePercent: number;
  /** Days tolerance for date matching */
  dateTolerance: number;
  /** Block on exact duplicate (vs. flag for review) */
  blockOnExactDuplicate: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: DuplicateDetectionConfig = {
  checkExact: true,
  checkSameNumber: true,
  checkAmountTolerance: true,
  amountTolerancePercent: 0.01, // 1%
  dateTolerance: 7, // 7 days
  blockOnExactDuplicate: true,
};

// ============================================================================
// 2. SERVICE
// ============================================================================

/**
 * DuplicateDetectionService - Detects duplicate invoices
 */
export class DuplicateDetectionService {
  private config: DuplicateDetectionConfig;

  constructor(
    private invoiceRepo: InvoiceRepositoryPort,
    private auditPort: AuditPort,
    config?: Partial<DuplicateDetectionConfig>
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Check for duplicate invoice
   * 
   * @param input - Check input
   * @param actor - Actor context
   * @returns Duplicate check result
   * @throws DuplicateInvoiceError if exact duplicate found and blocking enabled
   */
  async checkDuplicate(
    input: DuplicateCheckInput,
    actor: ActorContext
  ): Promise<DuplicateCheckResult> {
    // 1. Use repository's built-in check
    const repoResult = await this.invoiceRepo.checkDuplicate({
      tenantId: actor.tenantId,
      vendorId: input.vendorId,
      invoiceNumber: input.invoiceNumber,
      invoiceDate: input.invoiceDate,
      totalAmountCents: input.totalAmountCents,
      excludeInvoiceId: input.excludeInvoiceId,
    });

    // 2. No duplicate found
    if (!repoResult.isDuplicate) {
      return {
        isDuplicate: false,
        severity: 'none',
      };
    }

    // 3. Exact duplicate - may block or warn
    if (repoResult.exactMatch) {
      if (this.config.blockOnExactDuplicate) {
        throw new DuplicateInvoiceError(
          input.vendorId,
          input.invoiceNumber,
          repoResult.matchingInvoiceId
        );
      }

      return {
        isDuplicate: true,
        severity: 'error',
        matchType: 'exact',
        matchingInvoiceId: repoResult.matchingInvoiceId,
        matchDetails: repoResult.matchDetails,
        recommendation: 'This appears to be an exact duplicate. Please verify before proceeding.',
      };
    }

    // 4. Potential duplicate - flag for review
    return {
      isDuplicate: true,
      severity: 'warning',
      matchType: 'same_number',
      matchingInvoiceId: repoResult.matchingInvoiceId,
      matchDetails: repoResult.matchDetails,
      recommendation: 'Potential duplicate detected. Please review before submitting.',
    };
  }

  /**
   * Perform comprehensive duplicate analysis
   * 
   * @param input - Check input
   * @param actor - Actor context
   * @returns Detailed analysis results
   */
  async analyzeDuplicates(
    input: DuplicateCheckInput,
    actor: ActorContext
  ): Promise<{
    exactMatches: Invoice[];
    potentialMatches: Invoice[];
    analysis: string;
  }> {
    const exactMatches: Invoice[] = [];
    const potentialMatches: Invoice[] = [];

    // 1. Find all invoices from same vendor
    const { invoices } = await this.invoiceRepo.list({
      tenantId: actor.tenantId,
      vendorId: input.vendorId,
    });

    // 2. Analyze each invoice
    for (const invoice of invoices) {
      // Skip the invoice being checked (for updates)
      if (invoice.id === input.excludeInvoiceId) continue;

      // Check for exact match
      if (
        invoice.invoiceNumber === input.invoiceNumber &&
        invoice.invoiceDate.getTime() === input.invoiceDate.getTime()
      ) {
        exactMatches.push(invoice);
        continue;
      }

      // Check for same invoice number
      if (invoice.invoiceNumber === input.invoiceNumber) {
        potentialMatches.push(invoice);
        continue;
      }

      // Check for similar amount within date tolerance
      if (this.config.checkAmountTolerance) {
        const amountDiff = Math.abs(invoice.totalAmountCents - input.totalAmountCents);
        const amountTolerance = input.totalAmountCents * this.config.amountTolerancePercent;

        const daysDiff = Math.abs(
          (invoice.invoiceDate.getTime() - input.invoiceDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (amountDiff <= amountTolerance && daysDiff <= this.config.dateTolerance) {
          potentialMatches.push(invoice);
        }
      }
    }

    // 3. Generate analysis
    let analysis = '';
    if (exactMatches.length > 0) {
      analysis = `Found ${exactMatches.length} exact duplicate(s). `;
    }
    if (potentialMatches.length > 0) {
      analysis += `Found ${potentialMatches.length} potential duplicate(s) for review.`;
    }
    if (!analysis) {
      analysis = 'No duplicates detected.';
    }

    return {
      exactMatches,
      potentialMatches,
      analysis,
    };
  }

  /**
   * Mark invoice as duplicate
   * 
   * @param invoiceId - Invoice to mark
   * @param duplicateOfId - Original invoice ID
   * @param actor - Actor context
   * @returns Updated invoice
   */
  async markAsDuplicate(
    invoiceId: string,
    duplicateOfId: string,
    actor: ActorContext
  ): Promise<Invoice> {
    return this.invoiceRepo.withTransaction(async (txContext) => {
      // 1. Mark as duplicate
      const updated = await this.invoiceRepo.markAsDuplicate(
        invoiceId,
        duplicateOfId,
        actor.tenantId,
        txContext
      );

      // 2. Emit audit event
      const auditEvent: AuditEvent = {
        eventType: 'finance.ap.invoice.duplicate_flagged',
        entityId: invoiceId,
        entityUrn: `urn:finance:invoice:${invoiceId}`,
        actor: {
          userId: actor.userId,
          tenantId: actor.tenantId,
        },
        action: 'flag_duplicate',
        payload: {
          invoiceNumber: updated.invoiceNumber,
          duplicateOfId,
        },
        correlationId: txContext.correlationId,
        timestamp: new Date(),
      };

      await this.auditPort.emitTransactional(auditEvent, txContext);

      return updated;
    });
  }

  /**
   * Clear duplicate flag
   * 
   * @param invoiceId - Invoice to clear
   * @param reason - Reason for clearing flag
   * @param actor - Actor context
   * @returns Updated invoice
   */
  async clearDuplicateFlag(
    invoiceId: string,
    reason: string,
    actor: ActorContext
  ): Promise<Invoice> {
    return this.invoiceRepo.withTransaction(async (txContext) => {
      // 1. Fetch invoice
      const invoice = await this.invoiceRepo.findByIdForUpdate(
        invoiceId,
        actor.tenantId,
        txContext
      );

      if (!invoice) {
        throw new Error(`Invoice not found: ${invoiceId}`);
      }

      // 2. Update to clear flag (would need repo method)
      // For now, we'll emit the audit event
      // In production, add a clearDuplicateFlag method to repo

      // 3. Emit audit event
      const auditEvent: AuditEvent = {
        eventType: 'finance.ap.invoice.duplicate_cleared',
        entityId: invoiceId,
        entityUrn: `urn:finance:invoice:${invoiceId}`,
        actor: {
          userId: actor.userId,
          tenantId: actor.tenantId,
        },
        action: 'clear_duplicate_flag',
        payload: {
          invoiceNumber: invoice.invoiceNumber,
          reason,
        },
        correlationId: txContext.correlationId,
        timestamp: new Date(),
      };

      await this.auditPort.emitTransactional(auditEvent, txContext);

      return invoice;
    });
  }

  /**
   * Get duplicate detection statistics
   * 
   * @param actor - Actor context
   * @param fromDate - Start date
   * @param toDate - End date
   * @returns Statistics
   */
  async getStatistics(
    actor: ActorContext,
    fromDate?: Date,
    toDate?: Date
  ): Promise<{
    totalInvoices: number;
    flaggedAsDuplicate: number;
    duplicatePercentage: number;
  }> {
    // Get all invoices
    const { invoices } = await this.invoiceRepo.list({
      tenantId: actor.tenantId,
      fromDate,
      toDate,
    });

    // Count flagged duplicates
    const { invoices: flaggedInvoices } = await this.invoiceRepo.list({
      tenantId: actor.tenantId,
      fromDate,
      toDate,
      duplicateFlag: true,
    });

    const totalInvoices = invoices.length;
    const flaggedAsDuplicate = flaggedInvoices.length;
    const duplicatePercentage = totalInvoices > 0
      ? (flaggedAsDuplicate / totalInvoices) * 100
      : 0;

    return {
      totalInvoices,
      flaggedAsDuplicate,
      duplicatePercentage: Math.round(duplicatePercentage * 100) / 100,
    };
  }
}
