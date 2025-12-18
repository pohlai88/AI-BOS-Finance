/**
 * TR-02 Cash Pooling - List & Create Pools
 * 
 * GET  /api/treasury/cash-pools - List pools
 * POST /api/treasury/cash-pools - Create pool
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const listQuerySchema = z.object({
  poolType: z.enum(['physical', 'notional', 'zero_balance']).optional(),
  status: z.enum(['draft', 'active', 'suspended', 'inactive', 'cancelled']).optional(),
  masterCompanyId: z.string().uuid().optional(),
  search: z.string().optional(),
  limit: z.string().transform(Number).default('20'),
  offset: z.string().transform(Number).default('0'),
});

// GET /api/treasury/cash-pools
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const userId = request.headers.get('x-user-id');
    
    if (!tenantId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = listQuerySchema.parse(Object.fromEntries(searchParams));

    // TODO: Wire up CashPoolingService
    // const service = await getCashPoolingService();
    // const actor = { tenantId, userId };
    // const result = await service.listPools(query, query.limit, query.offset, actor);

    return NextResponse.json({
      data: [],
      total: 0,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    console.error('TR Cash Pools GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/treasury/cash-pools
export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const userId = request.headers.get('x-user-id');
    
    if (!tenantId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    // TODO: Add proper schema validation

    // TODO: Wire up CashPoolingService
    // const service = await getCashPoolingService();
    // const actor = { tenantId, userId };
    // const pool = await service.createPool(body, actor);

    return NextResponse.json({
      id: crypto.randomUUID(),
      ...body,
      status: 'draft',
      createdBy: userId,
      createdAt: new Date(),
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    console.error('TR Cash Pools POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
