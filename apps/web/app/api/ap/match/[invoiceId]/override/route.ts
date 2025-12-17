/**
 * Match Override API Route
 * 
 * POST /api/ap/match/{invoiceId}/override - Override match exception
 * 
 * AP-03 3-Way Match & Controls Engine — BFF Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMatchService, getOverrideService, getMatchActorContext } from '@/lib/match-services.server';
import { handleMatchError } from '@/lib/match-error-handler';
import { z } from 'zod';

type RouteContext = {
  params: Promise<{ invoiceId: string }>;
};

const OverrideSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500),
  version: z.number().int().positive('Version is required'),
});

/**
 * POST /api/ap/match/{invoiceId}/override
 * 
 * Override a match exception (requires SoD - different user)
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const actor = await getMatchActorContext();
    const matchService = await getMatchService();
    const overrideService = await getOverrideService();
    const { invoiceId } = await context.params;

    const body = await request.json();

    const parseResult = OverrideSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    // Get match result for this invoice
    const matchResult = await matchService.getByInvoiceId(invoiceId, actor);
    if (!matchResult) {
      return NextResponse.json(
        { error: `No match result found for invoice: ${invoiceId}`, code: 'MATCH_NOT_FOUND' },
        { status: 404 }
      );
    }

    const overridden = await overrideService.override(
      matchResult.id,
      { reason: parseResult.data.reason },
      actor,
      parseResult.data.version
    );

    return NextResponse.json({
      ...overridden,
      message: 'Match exception overridden successfully',
    });
  } catch (error) {
    return handleMatchError(error);
  }
}

/**
 * GET /api/ap/match/{invoiceId}/override
 * 
 * Check if match can be overridden by current user
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const actor = await getMatchActorContext();
    const matchService = await getMatchService();
    const overrideService = await getOverrideService();
    const { invoiceId } = await context.params;

    const matchResult = await matchService.getByInvoiceId(invoiceId, actor);
    if (!matchResult) {
      return NextResponse.json(
        { error: `No match result found for invoice: ${invoiceId}`, code: 'MATCH_NOT_FOUND' },
        { status: 404 }
      );
    }

    const canOverrideResult = await overrideService.canOverride(matchResult.id, actor);

    return NextResponse.json(canOverrideResult);
  } catch (error) {
    return handleMatchError(error);
  }
}
