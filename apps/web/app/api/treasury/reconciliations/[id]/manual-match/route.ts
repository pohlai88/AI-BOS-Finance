/**
 * TR-05 Bank Reconciliation - Manual Match
 * 
 * POST /api/treasury/reconciliations/:id/manual-match - Manual match items
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const manualMatchSchema = z.object({
  matches: z.array(z.object({
    bankItemId: z.string().uuid(),
    glTransactionIds: z.array(z.string().uuid()),
    matchType: z.enum(['exact', 'fuzzy', 'manual']),
    confidence: z.number().min(0).max(1).optional(),
    reason: z.string().optional(),
  })),
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
    const input = manualMatchSchema.parse(body);

    // TODO: Wire up ReconciliationService
    // const service = await getReconciliationService();
    // const actor = { tenantId, userId };
    // await service.manualMatch({
    //   statementId,
    //   ...input,
    //   matchedBy: userId,
    // }, actor);

    return NextResponse.json({
      success: true,
      matchedCount: input.matches.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    console.error('TR Manual Match error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
