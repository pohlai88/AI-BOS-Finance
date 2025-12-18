/**
 * TR-05 Bank Reconciliation - Create Adjustment
 * 
 * POST /api/treasury/reconciliations/:id/adjustment - Create adjustment entry (dual auth)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createAdjustmentSchema = z.object({
  accountCode: z.string(),
  debitAmount: z.object({
    amount: z.string(),
    currency: z.string().length(3),
  }).optional(),
  creditAmount: z.object({
    amount: z.string(),
    currency: z.string().length(3),
  }).optional(),
  description: z.string(),
  reason: z.string(),
  approvedBy: z.string().uuid(),
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
    const input = createAdjustmentSchema.parse(body);

    // Verify dual authorization
    if (userId === input.approvedBy) {
      return NextResponse.json(
        { error: 'Dual authorization required: creator cannot be approver' },
        { status: 400 }
      );
    }

    // TODO: Wire up ReconciliationService
    // const service = await getReconciliationService();
    // const actor = { tenantId, userId };
    // const adjustment = await service.createAdjustment({
    //   statementId,
    //   ...input,
    //   createdBy: userId,
    // }, actor);

    return NextResponse.json({
      id: crypto.randomUUID(),
      statementId,
      journalEntryId: crypto.randomUUID(),
      ...input,
      createdBy: userId,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    console.error('TR Adjustment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
