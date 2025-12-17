/**
 * GL-04 Period Close - Request/Approve Hard Close
 * 
 * POST /api/gl/periods/:periodCode/hard-close - Request hard close
 * PUT  /api/gl/periods/:periodCode/hard-close - Approve hard close (CFO)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const hardCloseSchema = z.object({
  companyId: z.string().uuid(),
});

interface RouteParams {
  params: Promise<{ periodCode: string }>;
}

// POST - Request hard close
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { periodCode } = await params;
    const tenantId = request.headers.get('x-tenant-id');
    const userId = request.headers.get('x-user-id');
    
    if (!tenantId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const input = hardCloseSchema.parse(body);

    // TODO: Call PeriodCloseService.requestHardClose()
    // const service = getPeriodCloseService();
    // const period = await service.requestHardClose(periodCode, input.companyId, { tenantId, userId });

    return NextResponse.json({
      periodCode,
      status: 'soft_close',
      hardCloseRequested: true,
      hardClosedBy: userId,
      hardClosedAt: new Date(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    console.error('GL Period hard-close request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Approve hard close (CFO)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { periodCode } = await params;
    const tenantId = request.headers.get('x-tenant-id');
    const userId = request.headers.get('x-user-id');
    
    if (!tenantId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const input = hardCloseSchema.parse(body);

    // TODO: Call PeriodCloseService.approveHardClose()
    // const service = getPeriodCloseService();
    // const period = await service.approveHardClose(periodCode, input.companyId, { tenantId, userId });
    // Note: SoD check - approver != requester
    // Note: Creates TB snapshot before closing

    return NextResponse.json({
      periodCode,
      status: 'hard_close',
      hardCloseApprovedBy: userId,
      hardCloseApprovedAt: new Date(),
      tbSnapshotId: crypto.randomUUID(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    console.error('GL Period hard-close approve error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
