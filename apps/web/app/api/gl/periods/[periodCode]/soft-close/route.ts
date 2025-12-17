/**
 * GL-04 Period Close - Initiate Soft Close
 * 
 * POST /api/gl/periods/:periodCode/soft-close
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const softCloseSchema = z.object({
  companyId: z.string().uuid(),
});

interface RouteParams {
  params: Promise<{ periodCode: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { periodCode } = await params;
    const tenantId = request.headers.get('x-tenant-id');
    const userId = request.headers.get('x-user-id');
    
    if (!tenantId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const input = softCloseSchema.parse(body);

    // TODO: Call PeriodCloseService.initiateSoftClose()
    // const service = getPeriodCloseService();
    // const period = await service.initiateSoftClose(periodCode, input.companyId, { tenantId, userId });

    return NextResponse.json({
      periodCode,
      status: 'soft_close',
      softClosedBy: userId,
      softClosedAt: new Date(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    console.error('GL Period soft-close error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
