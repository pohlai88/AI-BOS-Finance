/**
 * TR-05 Bank Reconciliation - Auto Match
 * 
 * POST /api/treasury/reconciliations/:id/auto-match - Auto-match items
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const autoMatchSchema = z.object({
  matchingRules: z.object({
    exactMatchEnabled: z.boolean().default(true),
    fuzzyMatchEnabled: z.boolean().default(true),
    dateToleranceDays: z.number().default(3),
  }).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: statementId } = await params;
    const tenantId = request.headers.get('x-tenant-id');
    const userId = request.headers.get('x-user-id');
    
    if (!tenantId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const input = autoMatchSchema.parse(body);

    // TODO: Wire up ReconciliationService
    // const service = await getReconciliationService();
    // const actor = { tenantId, userId };
    // const result = await service.autoMatch({
    //   statementId,
    //   ...input,
    // }, actor);

    return NextResponse.json({
      matches: [],
      matchedCount: 0,
      unmatchedBankItems: [],
      unmatchedGLTransactions: [],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    console.error('TR Auto Match error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
