/**
 * Resolve Exception API Route
 * 
 * POST /api/ap/match/exceptions/{id}/resolve - Resolve a match exception
 * 
 * AP-03 3-Way Match & Controls Engine — BFF Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getExceptionService, getMatchActorContext } from '@/lib/match-services.server';
import { handleMatchError } from '@/lib/match-error-handler';
import { z } from 'zod';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const ResolveSchema = z.object({
  resolutionNotes: z.string().min(1, 'Resolution notes are required').max(1000),
});

/**
 * POST /api/ap/match/exceptions/{id}/resolve
 * 
 * Resolve a specific match exception
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const actor = await getMatchActorContext();
    const exceptionService = await getExceptionService();
    const { id } = await context.params;

    const body = await request.json();

    const parseResult = ResolveSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const resolved = await exceptionService.resolve(
      id,
      { resolutionNotes: parseResult.data.resolutionNotes },
      actor
    );

    return NextResponse.json({
      ...resolved,
      message: 'Exception resolved successfully',
    });
  } catch (error) {
    return handleMatchError(error);
  }
}
