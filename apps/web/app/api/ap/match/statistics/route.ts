/**
 * Match Statistics API Route
 * 
 * GET /api/ap/match/statistics - Get exception queue statistics
 * 
 * AP-03 3-Way Match & Controls Engine — BFF Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getExceptionService, getMatchActorContext } from '@/lib/match-services.server';
import { handleMatchError } from '@/lib/match-error-handler';

/**
 * GET /api/ap/match/statistics
 * 
 * Get exception queue statistics for dashboard
 */
export async function GET(_request: NextRequest) {
  try {
    const actor = await getMatchActorContext();
    const exceptionService = await getExceptionService();

    const statistics = await exceptionService.getStatistics(actor);

    return NextResponse.json(statistics);
  } catch (error) {
    return handleMatchError(error);
  }
}
