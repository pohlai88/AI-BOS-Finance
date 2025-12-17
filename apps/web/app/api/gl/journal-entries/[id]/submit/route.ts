/**
 * GL-02 Journal Entry - Submit for Approval
 * 
 * POST /api/gl/journal-entries/:id/submit
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

    // TODO: Call JournalEntryService.submit()
    // const service = getJournalEntryService();
    // const entry = await service.submit({ journalEntryId: id }, { tenantId, userId });

    return NextResponse.json({
      id,
      status: 'submitted',
      submittedBy: userId,
      submittedAt: new Date(),
    });
  } catch (error) {
    console.error('GL Journal Entry submit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
