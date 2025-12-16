/**
 * Single Webhook Management API
 * 
 * GET /api/webhooks/[webhookId] - Get webhook details
 * PATCH /api/webhooks/[webhookId] - Update webhook status
 * DELETE /api/webhooks/[webhookId] - Delete webhook
 * 
 * Phase 6b Enhancement: Integration Kit
 */

import { NextRequest, NextResponse, type RouteContext } from 'next/server';
import { z } from 'zod';
import { getPool } from '@/lib/db';
import { getActorContext } from '@/lib/payment-services.server';
import { WebhookService } from '@aibos/canon';

// ============================================================================
// SCHEMAS
// ============================================================================

const UpdateWebhookSchema = z.object({
  status: z.enum(['active', 'paused', 'disabled']),
});

// ============================================================================
// HANDLERS
// ============================================================================

/**
 * GET /api/webhooks/[webhookId] - Get webhook details
 */
export async function GET(
  request: NextRequest,
  ctx: RouteContext<'/api/webhooks/[webhookId]'>
) {
  try {
    const params = await ctx.params;
    const webhookId = params.webhookId;

    const actor = await getActorContext(request);
    const pool = getPool();

    const webhookService = new WebhookService(pool);
    const webhook = await webhookService.get(webhookId, actor.tenantId);

    if (!webhook) {
      return NextResponse.json(
        { success: false, error: 'Webhook not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...webhook,
        targetUrl: maskUrl(webhook.targetUrl),
      },
    });
  } catch (error) {
    console.error('Failed to get webhook:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get webhook' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/webhooks/[webhookId] - Update webhook status
 */
export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<'/api/webhooks/[webhookId]'>
) {
  try {
    const params = await ctx.params;
    const webhookId = params.webhookId;

    const actor = await getActorContext(request);
    const pool = getPool();
    const body = await request.json();

    const input = UpdateWebhookSchema.parse(body);

    const webhookService = new WebhookService(pool);

    // Verify webhook exists
    const existing = await webhookService.get(webhookId, actor.tenantId);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Webhook not found' },
        { status: 404 }
      );
    }

    await webhookService.updateStatus(webhookId, input.status, actor);

    return NextResponse.json({
      success: true,
      data: {
        id: webhookId,
        status: input.status,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Failed to update webhook:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update webhook' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/webhooks/[webhookId] - Delete webhook
 */
export async function DELETE(
  request: NextRequest,
  ctx: RouteContext<'/api/webhooks/[webhookId]'>
) {
  try {
    const params = await ctx.params;
    const webhookId = params.webhookId;

    const actor = await getActorContext(request);
    const pool = getPool();

    const webhookService = new WebhookService(pool);

    // Verify webhook exists
    const existing = await webhookService.get(webhookId, actor.tenantId);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Webhook not found' },
        { status: 404 }
      );
    }

    await webhookService.delete(webhookId, actor);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Failed to delete webhook:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete webhook' },
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
