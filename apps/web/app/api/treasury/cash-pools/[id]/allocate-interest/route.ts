/**
 * TR-02 Cash Pooling - Allocate Interest
 * 
 * POST /api/treasury/cash-pools/:id/allocate-interest
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const allocateInterestSchema = z.object({
  periodStart: z.string().transform((s) => new Date(s)),
  periodEnd: z.string().transform((s) => new Date(s)),
  allocatedBy: z.string().uuid(),
  approver1Id: z.string().uuid(),
  approver2Id: z.string().uuid(),
  calculationMethod: z.enum(['daily_balance', 'average_balance']).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = request.headers.get('x-tenant-id');
    const userId = request.headers.get('x-user-id');
    
    if (!tenantId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const input = allocateInterestSchema.parse(body);

    // TODO: Wire up CashPoolingService
    // const service = await getCashPoolingService();
    // const actor = { tenantId, userId };
    // const allocations = await service.allocateInterest({ poolId: id, ...input }, actor);

    return NextResponse.json([]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    console.error('TR Cash Pool Allocate Interest error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
