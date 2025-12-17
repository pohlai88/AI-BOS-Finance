/**
 * GL-02 Journal Entry - Get by ID
 * 
 * GET /api/gl/journal-entries/:id
 */

import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/gl/journal-entries/:id
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Call JournalEntryService.getById()
    // const service = getJournalEntryService();
    // const entry = await service.getById(id, true);

    return NextResponse.json({
      id,
      entryNumber: 'JE-2024-0001',
      entryDate: new Date(),
      entryType: 'adjusting',
      reference: 'ADJ-001',
      description: 'Month-end adjustment',
      totalDebit: '1000.00',
      totalCredit: '1000.00',
      isBalanced: true,
      status: 'draft',
      lines: [
        { lineNumber: 1, accountCode: '1000', debitAmount: '1000.00' },
        { lineNumber: 2, accountCode: '2000', creditAmount: '1000.00' },
      ],
      version: 1,
    });
  } catch (error) {
    console.error('GL Journal Entry GET by ID error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
