/**
 * Payment Service
 * 
 * AP-05 Payment Execution Cell - Payment creation and lifecycle management.
 * 
 * Responsibilities:
 * - Create new payments (draft status)
 * - Validate fiscal period is open
 * - Enforce idempotency
 * - Emit transactional audit events
 */

import type {
  PaymentRepositoryPort,
  Payment,
  CreatePaymentInput as RepoCreateInput,
  TransactionContext,
  FiscalTimePort,
  AuditPort,
  EventBusPort,
  AuditEvent,
} from '@aibos/kernel-core';
import type { ActorContext } from '@aibos/canon-governance';
import { Money, type CurrencyCode } from '@aibos/canon-governance';
import {
  PeriodClosedError,
  InvalidAmountError,
  InvalidCurrencyError,
} from './errors';

// ============================================================================
// 1. TYPES
// ============================================================================

export interface CreatePaymentInput {
  vendorId: string;
  vendorName: string;
  amount: string; // Always string
  currency: string;
  paymentDate: Date;
  dueDate?: Date;
  sourceDocumentId?: string;
  sourceDocumentType?: 'invoice' | 'tax' | 'payroll' | 'bank_fee' | 'deposit' | 'prepayment' | 'other';
}

// ============================================================================
// 2. VALIDATION
// ============================================================================

// Valid ISO 4217 currency codes (must match CurrencyCode type)
const VALID_CURRENCIES: Set<string> = new Set([
  'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD',
  'HKD', 'SGD', 'SEK', 'NOK', 'DKK', 'CNY', 'INR', 'BRL',
  'MXN', 'ZAR', 'KRW', 'THB', 'MYR', 'PHP', 'IDR', 'VND',
]);

function validateCurrency(currency: string): CurrencyCode {
  if (!VALID_CURRENCIES.has(currency)) {
    throw new InvalidCurrencyError(currency);
  }
  return currency as CurrencyCode;
}

// ============================================================================
// 3. SERVICE
// ============================================================================

/**
 * PaymentService - Creates and manages payment lifecycle
 */
export class PaymentService {
  constructor(
    private paymentRepo: PaymentRepositoryPort,
    private auditPort: AuditPort,
    private timePort: FiscalTimePort,
    private eventBus: EventBusPort
  ) { }

  /**
   * Create a new payment
   * 
   * @param input - Payment creation data
   * @param actor - Who is creating the payment
   * @param idempotencyKey - Client-generated key to prevent duplicates
   * @returns Created payment
   */
  async create(
    input: CreatePaymentInput,
    actor: ActorContext,
    idempotencyKey: string
  ): Promise<Payment> {
    // 1. Validate period is open
    const periodStatus = await this.timePort.getPeriodStatus(
      input.paymentDate,
      actor.tenantId
    );
    if (!periodStatus.canPost) {
      throw new PeriodClosedError(input.paymentDate);
    }

    // 2. Validate currency code
    const validatedCurrency = validateCurrency(input.currency);

    // 3. Validate money format (creates Money value object)
    let money: Money;
    try {
      money = Money.fromString(input.amount, validatedCurrency);
    } catch (error) {
      throw new InvalidAmountError(
        error instanceof Error ? error.message : 'Invalid amount'
      );
    }

    // 4. Begin transaction
    return this.paymentRepo.withTransaction(async (txContext) => {
      // 5. Check idempotency
      const existing = await this.paymentRepo.findByIdempotencyKey(
        idempotencyKey,
        actor.tenantId,
        txContext
      );
      if (existing) {
        return existing; // Return original, don't re-create
      }

      // 6. Create payment (state: draft)
      const repoInput: RepoCreateInput = {
        tenantId: actor.tenantId,
        companyId: actor.companyId || actor.tenantId, // Fallback to tenant
        vendorId: input.vendorId,
        vendorName: input.vendorName,
        amount: money.toString(),
        currency: input.currency,
        paymentDate: input.paymentDate,
        dueDate: input.dueDate,
        createdBy: actor.userId,
        sourceDocumentId: input.sourceDocumentId,
        sourceDocumentType: input.sourceDocumentType,
        idempotencyKey,
      };

      const payment = await this.paymentRepo.create(repoInput, txContext);

      // 7. Emit audit (TRANSACTIONAL - same transaction)
      const auditEvent: AuditEvent = {
        eventType: 'finance.ap.payment.created',
        entityId: payment.id,
        entityUrn: `urn:finance:payment:${payment.id}`,
        actor: {
          userId: actor.userId,
          tenantId: actor.tenantId,
          sessionId: actor.sessionId,
          ipAddress: actor.ipAddress,
        },
        payload: { action: 'created', after: payment },
      };
      await this.auditPort.emitTransactional(auditEvent, txContext);

      // 8. Write event to transactional outbox (same transaction)
      await this.eventBus.writeToOutbox(
        'finance.ap.payment.created',
        { paymentId: payment.id, tenantId: actor.tenantId },
        txContext
      );

      // 9. Transaction commits here (audit + payment + outbox are atomic)
      return payment;
    });
  }

  /**
   * Get a payment by ID
   */
  async getById(id: string, tenantId: string): Promise<Payment | null> {
    return this.paymentRepo.findById(id, tenantId);
  }

  /**
   * List payments with filters
   */
  async list(filters: {
    tenantId: string;
    companyId?: string;
    status?: string | string[];
    limit?: number;
    offset?: number;
  }): Promise<{ payments: Payment[]; total: number }> {
    return this.paymentRepo.list(filters as Parameters<PaymentRepositoryPort['list']>[0]);
  }
}
