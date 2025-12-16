7294911/**
 * Webhook Management API
 * 
 * GET /api/webhooks - List all webhooks
 * POST /api/webhooks - Register a new webhook
 * 
 * Phase 6b Enhancement: Integration Kit
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getPool } from '@/lib/db';
import { getActorContext } from '@/lib/payment-services.server';
import { WebhookService, PAYMENT_EVENT_TYPES } from '@aibos/canon';

// ============================================================================
// SCHEMAS
// ============================================================================

const WebhookFilterSchema = z.object({
  field: z.string(),
  operator: z.enum(['eq', 'neq', 'in', 'gt', 'lt', 'contains']),
  value: z.unknown(),
});

const CreateWebhookSchema = z.object({
  eventType: z.enum(PAYMENT_EVENT_TYPES as unknown as [string, ...string[]]),
  targetUrl: z.string().url(),
  secret: z.string().min(32, 'Secret must be at least 32 characters'),
  filters: z.array(WebhookFilterSchema).optional(),
});

// ============================================================================
// HANDLERS
// ============================================================================

/**
 * GET /api/webhooks - List all webhooks for tenant
 */
export async function GET(request: NextRequest) {
  try {
    const actor = await getActorContext(request);
    const pool = getPool();

    const webhookService = new WebhookService(pool);
    const webhooks = await webhookService.list(actor.tenantId);

    // Mask target URLs for security (only show domain)
    const masked = webhooks.map(wh => ({
      ...wh,
      targetUrl: maskUrl(wh.targetUrl),
    }));

    return NextResponse.json({
      success: true,
      data: {
        webhooks: masked,
        supportedEvents: PAYMENT_EVENT_TYPES,
      },
    });
  } catch (error) {
    console.error('Failed to list webhooks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list webhooks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/webhooks - Register a new webhook
 */
export async function POST(request: NextRequest) {
  try {
    const actor = await getActorContext(request);
    const pool = getPool();
    const body = await request.json();

    // Validate input
    const input = CreateWebhookSchema.parse(body);

    const webhookService = new WebhookService(pool);
    const webhook = await webhookService.register(input, actor);

    return NextResponse.json({
      success: true,
      data: {
        ...webhook,
        targetUrl: maskUrl(webhook.targetUrl),
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Failed to create webhook:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create webhook' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function maskUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname}/***`;
  } catch {
    return '***';
  }
}
