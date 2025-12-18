/**
 * TR-05 Bank Reconciliation - Finalize
 * 
 * POST /api/treasury/reconciliations/:id/finalize - Finalize reconciliation (dual auth)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const finalizeSchema = z.object({
  approver1Id: z.string().uuid(),
  approver2Id: z.string().uuid(),
  notes: z.string().optional(),
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
    const input = finalizeSchema.parse(body);

    // TODO: Wire up ReconciliationService
    // const service = await getReconciliationService();
    // const actor = { tenantId, userId };
    // const result = await service.finalizeReconciliation({
    //   statementId,
    //   finalizedBy: userId,
    //   ...input,
    // }, actor);

    return NextResponse.json({
      statementId,
      finalizedAt: new Date(),
      adjustedGLBalance: { amount: '0', currency: 'USD' },
      bankBalance: { amount: '0', currency: 'USD' },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    console.error('TR Finalize error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
