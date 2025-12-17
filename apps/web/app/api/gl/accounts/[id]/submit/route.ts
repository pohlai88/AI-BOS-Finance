/**
 * GL-01 Chart of Accounts - Submit for Approval
 * 
 * POST /api/gl/accounts/:id/submit
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

    // TODO: Call AccountService.submitForApproval()
    // const service = getAccountService();
    // const account = await service.submitForApproval(id, { tenantId, userId });

    return NextResponse.json({
      id,
      status: 'pending_approval',
      updatedBy: userId,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('GL Account submit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
