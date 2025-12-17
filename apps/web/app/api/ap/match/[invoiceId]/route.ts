/**
 * Match Result by Invoice API Route
 * 
 * GET /api/ap/match/{invoiceId} - Get match result for invoice
 * 
 * AP-03 3-Way Match & Controls Engine — BFF Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMatchService, getMatchActorContext } from '@/lib/match-services.server';
import { handleMatchError } from '@/lib/match-error-handler';

type RouteContext = {
  params: Promise<{ invoiceId: string }>;
};

/**
 * GET /api/ap/match/{invoiceId}
 * 
 * Get match result for a specific invoice
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const actor = await getMatchActorContext();
    const matchService = await getMatchService();
    const { invoiceId } = await context.params;

    const matchResult = await matchService.getByInvoiceId(invoiceId, actor);

    if (!matchResult) {
      return NextResponse.json(
        { error: `No match result found for invoice: ${invoiceId}`, code: 'MATCH_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(matchResult);
  } catch (error) {
    return handleMatchError(error);
  }
}
