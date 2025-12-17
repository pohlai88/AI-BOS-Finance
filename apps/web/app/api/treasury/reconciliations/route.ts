/**
 * TR-05 Bank Reconciliation - List Reconciliations
 * 
 * GET  /api/treasury/reconciliations - List reconciliations
 * POST /api/treasury/reconciliations - Start new reconciliation
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const listQuerySchema = z.object({
  bankAccountId: z.string().uuid().optional(),
  periodCode: z.string().optional(),
  status: z.enum(['in_progress', 'reconciled', 'variance', 'approved']).optional(),
  limit: z.string().transform(Number).default('20'),
  offset: z.string().transform(Number).default('0'),
});

const createReconciliationSchema = z.object({
  bankAccountId: z.string().uuid(),
  periodCode: z.string(),
  bankStatementId: z.string().uuid().optional(),
});

// GET /api/treasury/reconciliations
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = listQuerySchema.parse(Object.fromEntries(searchParams));

    // TODO: Call ReconciliationService.list()

    return NextResponse.json({
      data: [
        {
          id: crypto.randomUUID(),
          bankAccountId: 'acc-1',
          bankName: 'Chase Operating',
          periodCode: '2024-11',
          glBalance: 2450000,
          bankBalance: 2491200,
          adjustedGLBalance: 2491200,
          variance: 0,
          status: 'reconciled',
          preparedAt: '2024-12-01',
          approvedAt: '2024-12-02',
        },
        {
          id: crypto.randomUUID(),
          bankAccountId: 'acc-1',
          bankName: 'Chase Operating',
          periodCode: '2024-12',
          glBalance: 2550000,
          bankBalance: 2595000,
          adjustedGLBalance: 2593500,
          variance: 1500,
          status: 'in_progress',
          preparedAt: '2024-12-15',
        },
      ],
      total: 2,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    console.error('TR Reconciliations GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/treasury/reconciliations
export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const userId = request.headers.get('x-user-id');
    
    if (!tenantId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const input = createReconciliationSchema.parse(body);

    // TODO: Call ReconciliationService.create()

    return NextResponse.json({
      id: crypto.randomUUID(),
      ...input,
      status: 'in_progress',
      preparedBy: userId,
      preparedAt: new Date(),
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    console.error('TR Reconciliations POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
