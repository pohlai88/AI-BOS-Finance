/**
 * GL-05 Trial Balance - Create/Get Snapshot
 * 
 * POST /api/gl/trial-balance/snapshot - Create snapshot
 * GET  /api/gl/trial-balance/snapshot - Get snapshot by period
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createSnapshotSchema = z.object({
  companyId: z.string().uuid(),
  periodCode: z.string(),
});

const getSnapshotSchema = z.object({
  companyId: z.string().uuid(),
  periodCode: z.string(),
});

// GET /api/gl/trial-balance/snapshot
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = getSnapshotSchema.parse({
      companyId: searchParams.get('companyId'),
      periodCode: searchParams.get('periodCode'),
    });

    // TODO: Call TrialBalanceService.getSnapshot()

    return NextResponse.json({
      id: crypto.randomUUID(),
      periodCode: query.periodCode,
      companyId: query.companyId,
      snapshotHash: 'abc123...', // SHA-256
      isImmutable: true,
      createdAt: new Date(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    console.error('GL TB Snapshot GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/gl/trial-balance/snapshot
export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const userId = request.headers.get('x-user-id');
    
    if (!tenantId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const input = createSnapshotSchema.parse(body);

    // TODO: Call TrialBalanceService.createSnapshot()
    // const service = getTrialBalanceService();
    // const result = await service.createSnapshot(input.periodCode, input.companyId, { tenantId, userId });

    return NextResponse.json({
      snapshotId: crypto.randomUUID(),
      hash: 'sha256:abc123...',
      periodCode: input.periodCode,
      createdBy: userId,
      createdAt: new Date(),
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    console.error('GL TB Snapshot POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
