/**
 * Webhook Service
 * 
 * AP-05 Payment Execution Cell - Phase 6b Enhancement
 * 
 * Responsibilities:
 * - Register and manage webhook subscriptions
 * - Trigger webhooks for payment events
 * - Handle webhook delivery via outbox pattern
 * - Support filtering and signature verification
 * 
 * CONT_08 Compliance: Part of Cell's integration layer
 */

import crypto from 'crypto';
import type { Pool } from 'pg';
import type { ActorContext } from '@aibos/canon-governance';

// ============================================================================
// 1. TYPES
// ============================================================================

export interface WebhookRegistration {
  id: string;
  tenantId: string;
  eventType: string;
  targetUrl: string;
  status: 'active' | 'paused' | 'disabled';
  filters?: WebhookFilter[];
  createdAt: Date;
  updatedAt: Date;
  lastTriggeredAt?: Date;
  failureCount: number;
}

export interface WebhookFilter {
  field: string;
  operator: 'eq' | 'neq' | 'in' | 'gt' | 'lt' | 'contains';
  value: unknown;
}

export interface WebhookPayload {
  eventId: string;
  eventType: string;
  timestamp: string;
  tenantId: string;
  companyId?: string;
  entityId: string;
  entityType: string;
  entityUrn: string;
  action: string;
  actor: {
    userId: string;
    email?: string;
    name?: string;
  };
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  correlationId: string;
  causationId?: string;
  links: {
    self: string;
    related?: Record<string, string>;
  };
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  payload: WebhookPayload;
  signature: string;
  status: 'pending' | 'delivered' | 'failed';
  attemptCount: number;
  lastAttemptAt?: Date;
  deliveredAt?: Date;
  errorMessage?: string;
}

export interface CreateWebhookInput {
  eventType: string;
  targetUrl: string;
  secret: string;
  filters?: WebhookFilter[];
}

// Supported event types
export const PAYMENT_EVENT_TYPES = [
  'finance.ap.payment.created',
  'finance.ap.payment.submitted',
  'finance.ap.payment.approved',
  'finance.ap.payment.rejected',
  'finance.ap.payment.executed',
  'finance.ap.payment.completed',
  'finance.ap.payment.failed',
  'finance.ap.payment.retried',
] as const;

export type PaymentEventType = typeof PAYMENT_EVENT_TYPES[number];

// ============================================================================
// 2. SERVICE
// ============================================================================

/**
 * WebhookService - Manages webhook registrations and delivery
 */
export class WebhookService {
  constructor(private pool: Pool) { }

  /**
   * Register a new webhook
   */
  async register(
    input: CreateWebhookInput,
    actor: ActorContext
  ): Promise<WebhookRegistration> {
    // Validate event type
    if (!PAYMENT_EVENT_TYPES.includes(input.eventType as PaymentEventType)) {
      throw new Error(`Invalid event type: ${input.eventType}. Valid types: ${PAYMENT_EVENT_TYPES.join(', ')}`);
    }

    // Validate URL
    try {
      new URL(input.targetUrl);
    } catch {
      throw new Error('Invalid target URL');
    }

    // Hash the secret for storage
    const secretHash = await this.hashSecret(input.secret);

    const result = await this.pool.query<{
      id: string;
      tenant_id: string;
      event_type: string;
      target_url: string;
      status: string;
      filters: WebhookFilter[] | null;
      created_at: Date;
      updated_at: Date;
      failure_count: number;
    }>(`
      INSERT INTO finance.webhook_registrations 
        (tenant_id, event_type, target_url, secret_hash, filters, status, created_by)
      VALUES ($1, $2, $3, $4, $5, 'active', $6)
      RETURNING id, tenant_id, event_type, target_url, status, filters, 
                created_at, updated_at, failure_count
    `, [
      actor.tenantId,
      input.eventType,
      input.targetUrl,
      secretHash,
      JSON.stringify(input.filters || []),
      actor.userId,
    ]);

    const row = result.rows[0];
    return {
      id: row.id,
      tenantId: row.tenant_id,
      eventType: row.event_type,
      targetUrl: row.target_url,
      status: row.status as 'active' | 'paused' | 'disabled',
      filters: row.filters || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      failureCount: row.failure_count,
    };
  }

  /**
   * List all webhooks for a tenant
   */
  async list(tenantId: string): Promise<WebhookRegistration[]> {
    const result = await this.pool.query<{
      id: string;
      tenant_id: string;
      event_type: string;
      target_url: string;
      status: string;
      filters: WebhookFilter[] | null;
      created_at: Date;
      updated_at: Date;
      last_triggered_at: Date | null;
      failure_count: number;
    }>(`
      SELECT id, tenant_id, event_type, target_url, status, filters,
             created_at, updated_at, last_triggered_at, failure_count
      FROM finance.webhook_registrations
      WHERE tenant_id = $1
      ORDER BY created_at DESC
    `, [tenantId]);

    return result.rows.map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      eventType: row.event_type,
      targetUrl: row.target_url,
      status: row.status as 'active' | 'paused' | 'disabled',
      filters: row.filters || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastTriggeredAt: row.last_triggered_at || undefined,
      failureCount: row.failure_count,
    }));
  }

  /**
   * Get a single webhook
   */
  async get(webhookId: string, tenantId: string): Promise<WebhookRegistration | null> {
    const result = await this.pool.query<{
      id: string;
      tenant_id: string;
      event_type: string;
      target_url: string;
      status: string;
      filters: WebhookFilter[] | null;
      created_at: Date;
      updated_at: Date;
      last_triggered_at: Date | null;
      failure_count: number;
    }>(`
      SELECT id, tenant_id, event_type, target_url, status, filters,
             created_at, updated_at, last_triggered_at, failure_count
      FROM finance.webhook_registrations
      WHERE id = $1 AND tenant_id = $2
    `, [webhookId, tenantId]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      tenantId: row.tenant_id,
      eventType: row.event_type,
      targetUrl: row.target_url,
      status: row.status as 'active' | 'paused' | 'disabled',
      filters: row.filters || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastTriggeredAt: row.last_triggered_at || undefined,
      failureCount: row.failure_count,
    };
  }

  /**
   * Update webhook status
   */
  async updateStatus(
    webhookId: string,
    status: 'active' | 'paused' | 'disabled',
    actor: ActorContext
  ): Promise<void> {
    await this.pool.query(`
      UPDATE finance.webhook_registrations
      SET status = $1, updated_at = NOW()
      WHERE id = $2 AND tenant_id = $3
    `, [status, webhookId, actor.tenantId]);
  }

  /**
   * Delete a webhook
   */
  async delete(webhookId: string, actor: ActorContext): Promise<void> {
    await this.pool.query(`
      DELETE FROM finance.webhook_registrations
      WHERE id = $1 AND tenant_id = $2
    `, [webhookId, actor.tenantId]);
  }

  /**
   * Trigger webhooks for an event
   */
  async trigger(
    tenantId: string,
    eventType: string,
    payload: WebhookPayload
  ): Promise<number> {
    // Find matching active webhooks
    const webhooks = await this.pool.query<{
      id: string;
      target_url: string;
      secret_hash: string;
      filters: WebhookFilter[] | null;
    }>(`
      SELECT id, target_url, secret_hash, filters
      FROM finance.webhook_registrations
      WHERE tenant_id = $1 
        AND event_type = $2
        AND status = 'active'
    `, [tenantId, eventType]);

    let triggered = 0;

    for (const webhook of webhooks.rows) {
      // Check filters
      if (!this.matchesFilters(payload, webhook.filters || [])) {
        continue;
      }

      // Sign payload
      const signature = this.signPayload(payload, webhook.secret_hash);

      // Queue webhook delivery (outbox pattern)
      await this.pool.query(`
        INSERT INTO finance.webhook_deliveries 
          (webhook_id, payload, signature, status, attempt_count)
        VALUES ($1, $2, $3, 'pending', 0)
      `, [webhook.id, JSON.stringify(payload), signature]);

      // Update last triggered
      await this.pool.query(`
        UPDATE finance.webhook_registrations
        SET last_triggered_at = NOW()
        WHERE id = $1
      `, [webhook.id]);

      triggered++;
    }

    return triggered;
  }

  /**
   * Create a webhook payload for a payment event
   */
  createPaymentPayload(
    eventType: PaymentEventType,
    payment: {
      id: string;
      paymentNumber: string;
      vendorId: string;
      vendorName: string;
      amount: string;
      currency: string;
      status: string;
    },
    actor: ActorContext,
    options?: {
      before?: Record<string, unknown>;
      correlationId?: string;
      causationId?: string;
    }
  ): WebhookPayload {
    const eventId = crypto.randomUUID();
    const action = eventType.split('.').pop() || 'unknown';

    return {
      eventId,
      eventType,
      timestamp: new Date().toISOString(),
      tenantId: actor.tenantId,
      companyId: actor.companyId,
      entityId: payment.id,
      entityType: 'payment',
      entityUrn: `urn:finance:payment:${payment.id}`,
      action,
      actor: {
        userId: actor.userId,
        email: actor.email,
        name: actor.displayName,
      },
      before: options?.before,
      after: {
        id: payment.id,
        paymentNumber: payment.paymentNumber,
        vendorId: payment.vendorId,
        vendorName: payment.vendorName,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
      },
      correlationId: options?.correlationId || eventId,
      causationId: options?.causationId,
      links: {
        self: `/api/payments/${payment.id}`,
        related: {
          vendor: `/api/vendors/${payment.vendorId}`,
        },
      },
    };
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private async hashSecret(secret: string): Promise<string> {
    return crypto
      .createHash('sha256')
      .update(secret)
      .digest('hex');
  }

  private signPayload(payload: WebhookPayload, secretHash: string): string {
    const body = JSON.stringify(payload);
    return crypto
      .createHmac('sha256', secretHash)
      .update(body)
      .digest('hex');
  }

  private matchesFilters(
    payload: WebhookPayload,
    filters: WebhookFilter[]
  ): boolean {
    if (!filters || filters.length === 0) return true;

    return filters.every(filter => {
      const value = this.getNestedValue(payload as unknown, filter.field);

      switch (filter.operator) {
        case 'eq':
          return value === filter.value;
        case 'neq':
          return value !== filter.value;
        case 'in':
          return Array.isArray(filter.value) && filter.value.includes(value);
        case 'gt':
          return typeof value === 'number' && typeof filter.value === 'number' && value > filter.value;
        case 'lt':
          return typeof value === 'number' && typeof filter.value === 'number' && value < filter.value;
        case 'contains':
          return typeof value === 'string' && typeof filter.value === 'string' && value.includes(filter.value);
        default:
          return true;
      }
    });
  }

  private getNestedValue(obj: unknown, path: string): unknown {
    return path.split('.').reduce((acc: unknown, part) => {
      if (acc && typeof acc === 'object' && acc !== null && part in acc) {
        return (acc as Record<string, unknown>)[part];
      }
      return undefined;
    }, obj);
  }
}

// ============================================================================
// 3. SIGNATURE VERIFICATION HELPER (for external systems)
// ============================================================================

/**
 * Verify webhook signature
 * Export this function for consumers to verify webhook authenticity
 */
export function verifyWebhookSignature(
  payload: string | object,
  signature: string,
  secret: string
): boolean {
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const secretHash = crypto
    .createHash('sha256')
    .update(secret)
    .digest('hex');

  const expected = crypto
    .createHmac('sha256', secretHash)
    .update(body)
    .digest('hex');

  // Use timing-safe comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex')
    );
  } catch {
    return false;
  }
}
