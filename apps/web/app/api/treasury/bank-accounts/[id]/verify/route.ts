/**
 * TR-01 Bank Master - Complete Verification
 * 
 * POST /api/treasury/bank-accounts/:id/verify
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const verifySchema = z.object({
  microDepositAmounts: z.tuple([z.number(), z.number()]).optional(),
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
    const input = verifySchema.parse(body);

    // TODO: Call BankMasterService.verify()
    // Note: SoD check - verifier != creator

    return NextResponse.json({
      id,
      status: 'active',
      verifiedBy: userId,
      verifiedAt: new Date(),
      approvedBy: userId,
      approvedAt: new Date(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    console.error('TR Bank Account verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
