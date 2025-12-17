/**
 * GL-02 Journal Entry - Approve
 * 
 * POST /api/gl/journal-entries/:id/approve
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

    // TODO: Call JournalEntryService.approve()
    // const service = getJournalEntryService();
    // const entry = await service.approve({ journalEntryId: id }, { tenantId, userId });
    // Note: SoD check - approver != creator
    // Note: This will trigger posting to GL-03

    return NextResponse.json({
      id,
      status: 'approved',
      approvedBy: userId,
      approvedAt: new Date(),
    });
  } catch (error) {
    console.error('GL Journal Entry approve error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
