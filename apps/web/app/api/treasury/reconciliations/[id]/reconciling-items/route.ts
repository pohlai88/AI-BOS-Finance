/**
 * TR-05 Bank Reconciliation - Create Reconciling Items
 * 
 * POST /api/treasury/reconciliations/:id/reconciling-items - Create reconciling items
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createReconcilingItemSchema = z.object({
  bankItemId: z.string().uuid().optional(),
  itemType: z.enum(['deposit_in_transit', 'outstanding_check', 'bank_error', 'book_error', 'bank_charge', 'interest']),
  amount: z.object({
    amount: z.string(),
    currency: z.string().length(3),
  }),
  description: z.string(),
  expectedClearingDate: z.string().datetime().optional(),
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
    const input = createReconcilingItemSchema.parse(body);

    // TODO: Wire up ReconciliationService
    // const service = await getReconciliationService();
    // const actor = { tenantId, userId };
    // const item = await service.createReconcilingItem({
    //   statementId,
    //   ...input,
    //   expectedClearingDate: input.expectedClearingDate ? new Date(input.expectedClearingDate) : undefined,
    // }, actor);

    return NextResponse.json({
      id: crypto.randomUUID(),
      statementId,
      ...input,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    console.error('TR Reconciling Items error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
