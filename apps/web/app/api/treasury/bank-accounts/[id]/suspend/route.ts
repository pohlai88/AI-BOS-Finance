/**
 * TR-01 Bank Master - Suspend Bank Account
 * 
 * POST /api/treasury/bank-accounts/:id/suspend
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const suspendSchema = z.object({
  reason: z.string().min(1),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const tenantId = request.headers.get('x-tenant-id');
    const userId = request.headers.get('x-user-id');
    
    if (!tenantId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const input = suspendSchema.parse(body);

    // TODO: Call BankMasterService.suspend()

    return NextResponse.json({
      id,
      status: 'suspended',
      suspendedBy: userId,
      suspendedAt: new Date(),
      suspensionReason: input.reason,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    console.error('TR Bank Account suspend error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
