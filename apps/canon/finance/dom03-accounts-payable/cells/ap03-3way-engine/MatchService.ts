/**
 * AP-03: 3-Way Match & Controls Engine — Match Service
 * 
 * Core domain service for match evaluation. Evaluates invoices against
 * PO and GRN data based on configurable match modes.
 */

import { v4 as uuidv4 } from 'uuid';
import type { ActorContext } from '@aibos/canon-governance';
import type { AuditPort } from '@aibos/kernel-core';

import {
  InvoiceNotFoundForMatchError,
  InvoiceNotSubmittedError,
  MatchAlreadyExistsError,
  MatchResultNotFoundError,
  MatchModeNotConfiguredError,
  PurchaseOrderNotFoundError,
  GoodsReceiptNotFoundError,
  InsufficientGoodsReceivedError,
  MatchConcurrencyError,
} from './errors';

import {
  type MatchMode,
  type MatchStatus,
  type ExceptionType,
  type PolicySource,
  type ToleranceConfig,
  type MatchEvaluationResult,
  type PurchaseOrderData,
  type GoodsReceiptData,
  DEFAULT_TOLERANCES,
  getExceptionSeverity,
} from './MatchTypes';

// ============================================================================
// PORT INTERFACES
// ============================================================================

export interface MatchRepositoryPort {
  withTransaction<T>(callback: (txContext: MatchTransactionContext) => Promise<T>): Promise<T>;
  create(input: CreateMatchResultInput, txContext: MatchTransactionContext): Promise<MatchResult>;
  findById(id: string, tenantId: string): Promise<MatchResult | null>;
  findByInvoiceId(invoiceId: string, tenantId: string): Promise<MatchResult | null>;
  update(id: string, input: UpdateMatchResultInput, txContext: MatchTransactionContext): Promise<MatchResult>;
  list(filters: MatchQueryFilters): Promise<{ results: MatchResult[]; total: number }>;
  createException(input: CreateExceptionInput, txContext: MatchTransactionContext): Promise<MatchException>;
  listExceptions(matchResultId: string, tenantId: string): Promise<MatchException[]>;
  resolveException(id: string, input: ResolveExceptionInput, txContext: MatchTransactionContext): Promise<MatchException>;
}

export interface InvoiceValidationPort {
  getInvoiceForMatch(invoiceId: string, tenantId: string): Promise<InvoiceForMatch | null>;
  updateInvoiceMatchStatus(invoiceId: string, matchStatus: MatchStatus, matchResultId: string, tenantId: string): Promise<void>;
}

export interface PurchaseOrderPort {
  getPurchaseOrder(poNumber: string, tenantId: string): Promise<PurchaseOrderData | null>;
  isAvailable(): Promise<boolean>;
}

export interface GoodsReceiptPort {
  getGoodsReceipt(grnNumber: string, tenantId: string): Promise<GoodsReceiptData | null>;
  getGoodsReceiptsForPO(poNumber: string, tenantId: string): Promise<GoodsReceiptData[]>;
  isAvailable(): Promise<boolean>;
}

export interface MatchPolicyPort {
  getMatchMode(tenantId: string, vendorId: string, categoryCode?: string): Promise<{ mode: MatchMode; source: PolicySource }>;
  getTolerances(tenantId: string, vendorId?: string): Promise<ToleranceConfig>;
}

// ============================================================================
// TYPES
// ============================================================================

export interface MatchTransactionContext {
  tx: unknown;
  correlationId: string;
}

export interface MatchResult {
  id: string;
  invoiceId: string;
  tenantId: string;
  matchMode: MatchMode;
  matchPolicySource: PolicySource;
  status: MatchStatus;
  purchaseOrderId?: string;
  goodsReceiptId?: string;
  priceVariancePercent?: number;
  qtyVariancePercent?: number;
  amountVarianceCents?: number;
  withinTolerance: boolean;
  exceptionReason?: string;
  exceptionCode?: string;
  isOverridden: boolean;
  overrideApprovedBy?: string;
  overrideApprovedAt?: Date;
  overrideReason?: string;
  createdBy: string;
  createdAt: Date;
  evaluatedAt: Date;
  version: number;
  updatedAt: Date;
}

export interface MatchException {
  id: string;
  matchResultId: string;
  tenantId: string;
  exceptionType: ExceptionType;
  severity: string;
  message: string;
  resolutionStatus: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolutionNotes?: string;
  createdAt: Date;
}

export interface InvoiceForMatch {
  id: string;
  tenantId: string;
  vendorId: string;
  invoiceNumber: string;
  status: string;
  subtotalCents: number;
  taxAmountCents: number;
  totalAmountCents: number;
  currency: string;
  poNumber?: string;
  grnNumber?: string;
  categoryCode?: string;
  lines: {
    lineNumber: number;
    description: string;
    quantity: number;
    unitPriceCents: number;
    lineAmountCents: number;
  }[];
}

export interface CreateMatchResultInput {
  invoiceId: string;
  tenantId: string;
  matchMode: MatchMode;
  matchPolicySource: PolicySource;
  status: MatchStatus;
  purchaseOrderId?: string;
  goodsReceiptId?: string;
  priceVariancePercent?: number;
  qtyVariancePercent?: number;
  amountVarianceCents?: number;
  withinTolerance: boolean;
  exceptionReason?: string;
  exceptionCode?: string;
  createdBy: string;
}

export interface UpdateMatchResultInput {
  tenantId: string;
  status?: MatchStatus;
  isOverridden?: boolean;
  overrideApprovedBy?: string;
  overrideApprovedAt?: Date;
  overrideReason?: string;
}

export interface CreateExceptionInput {
  matchResultId: string;
  tenantId: string;
  exceptionType: ExceptionType;
  severity: string;
  message: string;
}

export interface ResolveExceptionInput {
  tenantId: string;
  resolutionStatus: 'resolved' | 'overridden';
  resolvedBy: string;
  resolutionNotes?: string;
}

export interface MatchQueryFilters {
  tenantId: string;
  invoiceId?: string;
  status?: MatchStatus | MatchStatus[];
  matchMode?: MatchMode;
  isOverridden?: boolean;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

// ============================================================================
// MATCH SERVICE
// ============================================================================

export class MatchService {
  constructor(
    private matchRepo: MatchRepositoryPort,
    private invoicePort: InvoiceValidationPort,
    private poPort: PurchaseOrderPort,
    private grnPort: GoodsReceiptPort,
    private policyPort: MatchPolicyPort,
    private auditPort: AuditPort
  ) {}

  /**
   * Evaluate an invoice for match
   */
  async evaluate(invoiceId: string, actor: ActorContext): Promise<MatchResult> {
    // Check if match already exists
    const existingMatch = await this.matchRepo.findByInvoiceId(invoiceId, actor.tenantId);
    if (existingMatch) {
      throw new MatchAlreadyExistsError(invoiceId, existingMatch.id);
    }

    // Get invoice
    const invoice = await this.invoicePort.getInvoiceForMatch(invoiceId, actor.tenantId);
    if (!invoice) {
      throw new InvoiceNotFoundForMatchError(invoiceId);
    }

    // Invoice must be in 'submitted' status
    if (invoice.status !== 'submitted') {
      throw new InvoiceNotSubmittedError(invoiceId, invoice.status);
    }

    // Get match mode from policy
    const { mode, source } = await this.policyPort.getMatchMode(
      actor.tenantId,
      invoice.vendorId,
      invoice.categoryCode
    );

    if (!mode) {
      throw new MatchModeNotConfiguredError(actor.tenantId, invoice.vendorId);
    }

    // Evaluate based on mode
    const evaluation = await this.performEvaluation(invoice, mode, source, actor);

    // Create match result
    const matchResult = await this.matchRepo.withTransaction(async (txContext) => {
      const result = await this.matchRepo.create({
        invoiceId,
        tenantId: actor.tenantId,
        matchMode: mode,
        matchPolicySource: source,
        status: evaluation.status,
        purchaseOrderId: evaluation.purchaseOrderId,
        goodsReceiptId: evaluation.goodsReceiptId,
        priceVariancePercent: evaluation.priceVariancePercent,
        qtyVariancePercent: evaluation.qtyVariancePercent,
        amountVarianceCents: evaluation.amountVarianceCents,
        withinTolerance: evaluation.withinTolerance,
        exceptionReason: evaluation.exceptions.length > 0
          ? evaluation.exceptions.map(e => e.message).join('; ')
          : undefined,
        exceptionCode: evaluation.exceptions.length > 0
          ? evaluation.exceptions[0].type
          : undefined,
        createdBy: actor.userId,
      }, txContext);

      // Create exception records
      for (const exception of evaluation.exceptions) {
        await this.matchRepo.createException({
          matchResultId: result.id,
          tenantId: actor.tenantId,
          exceptionType: exception.type,
          severity: exception.severity,
          message: exception.message,
        }, txContext);
      }

      // Update invoice match status
      await this.invoicePort.updateInvoiceMatchStatus(
        invoiceId,
        evaluation.status,
        result.id,
        actor.tenantId
      );

      // Emit audit event
      await this.auditPort.emitTransactional({
        eventType: 'finance.ap.match.evaluated',
        entityId: result.id,
        entityUrn: `urn:finance:match:${result.id}`,
        actor: { userId: actor.userId, tenantId: actor.tenantId },
        action: 'evaluate',
        timestamp: new Date(),
        correlationId: txContext.correlationId,
        payload: {
          invoiceId,
          matchMode: mode,
          policySource: source,
          status: evaluation.status,
          exceptionCount: evaluation.exceptions.length,
        },
      }, txContext);

      return result;
    });

    return matchResult;
  }

  /**
   * Get match result by ID
   */
  async getById(matchResultId: string, actor: ActorContext): Promise<MatchResult | null> {
    return this.matchRepo.findById(matchResultId, actor.tenantId);
  }

  /**
   * Get match result for an invoice
   */
  async getByInvoiceId(invoiceId: string, actor: ActorContext): Promise<MatchResult | null> {
    return this.matchRepo.findByInvoiceId(invoiceId, actor.tenantId);
  }

  /**
   * List match results with exceptions (exception queue)
   */
  async listExceptionQueue(actor: ActorContext, limit = 50, offset = 0): Promise<{ results: MatchResult[]; total: number }> {
    return this.matchRepo.list({
      tenantId: actor.tenantId,
      status: 'exception',
      isOverridden: false,
      limit,
      offset,
    });
  }

  /**
   * Perform the actual match evaluation
   */
  private async performEvaluation(
    invoice: InvoiceForMatch,
    mode: MatchMode,
    source: PolicySource,
    actor: ActorContext
  ): Promise<MatchEvaluationResult> {
    const tolerances = await this.policyPort.getTolerances(actor.tenantId, invoice.vendorId);
    const exceptions: MatchEvaluationResult['exceptions'] = [];
    let purchaseOrderId: string | undefined;
    let goodsReceiptId: string | undefined;
    let priceVariancePercent: number | undefined;
    let qtyVariancePercent: number | undefined;
    let amountVarianceCents: number | undefined;
    let withinTolerance = true;

    // 1-Way: Invoice-only validation
    if (mode === '1-way') {
      // Basic validations done during invoice entry
      return {
        status: 'passed',
        matchMode: mode,
        policySource: source,
        withinTolerance: true,
        exceptions: [],
      };
    }

    // 2-Way and 3-Way: Need PO
    if (mode === '2-way' || mode === '3-way') {
      if (!invoice.poNumber) {
        exceptions.push({
          type: 'missing_po',
          severity: getExceptionSeverity('missing_po'),
          message: 'Purchase order number not provided on invoice',
        });
        withinTolerance = false;
      } else {
        const po = await this.poPort.getPurchaseOrder(invoice.poNumber, actor.tenantId);
        if (!po) {
          exceptions.push({
            type: 'missing_po',
            severity: getExceptionSeverity('missing_po'),
            message: `Purchase order ${invoice.poNumber} not found`,
          });
          withinTolerance = false;
        } else {
          purchaseOrderId = invoice.poNumber;

          // Check vendor match
          if (po.vendorId !== invoice.vendorId) {
            exceptions.push({
              type: 'vendor_mismatch',
              severity: getExceptionSeverity('vendor_mismatch'),
              message: `Invoice vendor does not match PO vendor`,
            });
            withinTolerance = false;
          }

          // Check currency match
          if (po.currency !== invoice.currency) {
            exceptions.push({
              type: 'currency_mismatch',
              severity: getExceptionSeverity('currency_mismatch'),
              message: `Invoice currency (${invoice.currency}) does not match PO currency (${po.currency})`,
            });
            withinTolerance = false;
          }

          // Check amount tolerance
          amountVarianceCents = invoice.totalAmountCents - po.totalCents;
          const amountVariancePercent = (Math.abs(amountVarianceCents) / po.totalCents) * 100;

          if (Math.abs(amountVarianceCents) > tolerances.amountToleranceCents) {
            exceptions.push({
              type: 'amount_mismatch',
              severity: getExceptionSeverity('amount_mismatch', amountVariancePercent),
              message: `Invoice amount variance ${amountVarianceCents} cents exceeds tolerance ±${tolerances.amountToleranceCents} cents`,
            });
            withinTolerance = false;
          }

          // Check line-level price and quantity
          for (const invLine of invoice.lines) {
            const poLine = po.lines.find(l => l.lineNumber === invLine.lineNumber);
            if (!poLine) continue;

            // Price variance
            const priceDiff = invLine.unitPriceCents - poLine.unitPriceCents;
            const priceDiffPercent = (Math.abs(priceDiff) / poLine.unitPriceCents) * 100;
            if (priceVariancePercent === undefined || priceDiffPercent > priceVariancePercent) {
              priceVariancePercent = priceDiffPercent;
            }

            if (priceDiffPercent > tolerances.priceTolerancePercent) {
              exceptions.push({
                type: 'price_mismatch',
                severity: getExceptionSeverity('price_mismatch', priceDiffPercent),
                message: `Line ${invLine.lineNumber}: price variance ${priceDiffPercent.toFixed(2)}% exceeds tolerance ±${tolerances.priceTolerancePercent}%`,
                lineNumber: invLine.lineNumber,
              });
              withinTolerance = false;
            }

            // Quantity variance
            const qtyDiff = invLine.quantity - poLine.quantity;
            const qtyDiffPercent = (Math.abs(qtyDiff) / poLine.quantity) * 100;
            if (qtyVariancePercent === undefined || qtyDiffPercent > qtyVariancePercent) {
              qtyVariancePercent = qtyDiffPercent;
            }

            if (qtyDiffPercent > tolerances.qtyTolerancePercent) {
              exceptions.push({
                type: 'qty_mismatch',
                severity: getExceptionSeverity('qty_mismatch', qtyDiffPercent),
                message: `Line ${invLine.lineNumber}: quantity variance ${qtyDiffPercent.toFixed(2)}% exceeds tolerance ±${tolerances.qtyTolerancePercent}%`,
                lineNumber: invLine.lineNumber,
              });
              withinTolerance = false;
            }
          }
        }
      }
    }

    // 3-Way: Also need GRN
    if (mode === '3-way' && purchaseOrderId) {
      const grns = await this.grnPort.getGoodsReceiptsForPO(purchaseOrderId, actor.tenantId);
      if (grns.length === 0) {
        exceptions.push({
          type: 'missing_grn',
          severity: getExceptionSeverity('missing_grn'),
          message: `No goods receipt found for PO ${purchaseOrderId}`,
        });
        withinTolerance = false;
      } else {
        // Sum up received quantities
        const totalReceivedByLine = new Map<number, number>();
        for (const grn of grns) {
          goodsReceiptId = goodsReceiptId || grn.grnNumber;
          for (const grnLine of grn.lines) {
            const current = totalReceivedByLine.get(grnLine.poLineNumber) || 0;
            totalReceivedByLine.set(grnLine.poLineNumber, current + grnLine.receivedQty);
          }
        }

        // Check each invoice line against received quantity
        for (const invLine of invoice.lines) {
          const receivedQty = totalReceivedByLine.get(invLine.lineNumber) || 0;
          if (receivedQty < invLine.quantity) {
            exceptions.push({
              type: 'insufficient_receipt',
              severity: getExceptionSeverity('insufficient_receipt'),
              message: `Line ${invLine.lineNumber}: invoiced qty ${invLine.quantity}, received only ${receivedQty}`,
              lineNumber: invLine.lineNumber,
            });
            withinTolerance = false;
          }
        }
      }
    }

    const status: MatchStatus = exceptions.length > 0 ? 'exception' : 'passed';

    return {
      status,
      matchMode: mode,
      policySource: source,
      purchaseOrderId,
      goodsReceiptId,
      priceVariancePercent,
      qtyVariancePercent,
      amountVarianceCents,
      withinTolerance,
      exceptions,
    };
  }
}
