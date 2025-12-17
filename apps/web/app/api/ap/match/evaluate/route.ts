/**
 * Match Evaluation API Route
 * 
 * POST /api/ap/match/evaluate - Evaluate invoice for match
 * 
 * AP-03 3-Way Match & Controls Engine — BFF Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMatchService, getMatchActorContext } from '@/lib/match-services.server';
import { handleMatchError } from '@/lib/match-error-handler';
import { z } from 'zod';

const EvaluateMatchSchema = z.object({
  invoiceId: z.string().uuid('Invalid invoice ID'),
});

/**
 * POST /api/ap/match/evaluate
 * 
 * Evaluate an invoice for match based on configured match mode
 */
export async function POST(request: NextRequest) {
  try {
    const actor = await getMatchActorContext();
    const matchService = await getMatchService();

    const body = await request.json();

    const parseResult = EvaluateMatchSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const matchResult = await matchService.evaluate(
      parseResult.data.invoiceId,
      actor
    );

    return NextResponse.json(matchResult, { status: 201 });
  } catch (error) {
    return handleMatchError(error);
  }
}
