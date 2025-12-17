/**
 * TR-01 Bank Master - Reactivate Suspended Bank Account
 * 
 * POST /api/treasury/bank-accounts/:id/reactivate
 */

import { NextRequest, NextResponse } from 'next/server';

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

    // TODO: Call BankMasterService.reactivate()

    return NextResponse.json({
      id,
      status: 'active',
      updatedBy: userId,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('TR Bank Account reactivate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
