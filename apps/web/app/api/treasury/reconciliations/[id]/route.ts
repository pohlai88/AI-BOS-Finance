/**
 * TR-05 Bank Reconciliation - Get Reconciliation Details
 * 
 * GET /api/treasury/reconciliations/:id - Get reconciliation details
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

    // TODO: Wire up ReconciliationService
    // const service = await getReconciliationService();
    // const actor = { tenantId, userId };
    // const statement = await service.getStatementById(id, actor);

    return NextResponse.json({
      id,
      status: 'draft',
    });
  } catch (error) {
    console.error('TR Reconciliation GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
