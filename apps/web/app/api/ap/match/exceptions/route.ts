/**
 * Match Exceptions API Route
 * 
 * GET /api/ap/match/exceptions - List exception queue
 * 
 * AP-03 3-Way Match & Controls Engine — BFF Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getExceptionService, getMatchActorContext } from '@/lib/match-services.server';
import { handleMatchError } from '@/lib/match-error-handler';

/**
 * GET /api/ap/match/exceptions
 * 
 * List pending match exceptions (exception queue)
 */
export async function GET(request: NextRequest) {
  try {
    const actor = await getMatchActorContext();
    const exceptionService = await getExceptionService();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const result = await exceptionService.getExceptionQueue(actor, { limit, offset });

    return NextResponse.json({
      items: result.items,
      total: result.total,
      limit,
      offset,
    });
  } catch (error) {
    return handleMatchError(error);
  }
}
