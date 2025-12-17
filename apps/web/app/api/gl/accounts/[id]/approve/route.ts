/**
 * GL-01 Chart of Accounts - Approve Account
 * 
 * POST /api/gl/accounts/:id/approve
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

    // TODO: Call AccountService.approve()
    // const service = getAccountService();
    // const account = await service.approve(id, { tenantId, userId });
    // Note: SoD check - approver != creator

    return NextResponse.json({
      id,
      status: 'active',
      approvedBy: userId,
      approvedAt: new Date(),
    });
  } catch (error) {
    console.error('GL Account approve error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
