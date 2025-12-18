/**
 * TR-02 Cash Pooling - Get Pool Details
 * 
 * GET /api/treasury/cash-pools/:id - Get pool details
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
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

    // TODO: Wire up CashPoolingService
    // const service = await getCashPoolingService();
    // const actor = { tenantId, userId };
    // const pool = await service.getPoolById(id, actor);

    return NextResponse.json({
      id,
      status: 'draft',
    });
  } catch (error) {
    console.error('TR Cash Pool GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
