/**
 * GL-05 Trial Balance - Generate Trial Balance
 * 
 * GET /api/gl/trial-balance
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const querySchema = z.object({
  companyId: z.string().uuid(),
  periodCode: z.string(),
});

// GET /api/gl/trial-balance
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = querySchema.parse({
      companyId: searchParams.get('companyId'),
      periodCode: searchParams.get('periodCode'),
    });

    // TODO: Call TrialBalanceService.generateTrialBalance()
    // const service = getTrialBalanceService();
    // const tb = await service.generateTrialBalance(query.periodCode, query.companyId, { tenantId, userId });

    // Mock response
    return NextResponse.json({
      periodCode: query.periodCode,
      companyId: query.companyId,
      generatedAt: new Date(),
      lines: [
        { accountCode: '1000', accountName: 'Cash', accountType: 'ASSET', periodDebit: '125000.00', periodCredit: '0.00', closingDebit: '125000.00', closingCredit: '0.00' },
        { accountCode: '1100', accountName: 'Accounts Receivable', accountType: 'ASSET', periodDebit: '245000.00', periodCredit: '0.00', closingDebit: '245000.00', closingCredit: '0.00' },
        { accountCode: '2000', accountName: 'Accounts Payable', accountType: 'LIABILITY', periodDebit: '0.00', periodCredit: '85000.00', closingDebit: '0.00', closingCredit: '85000.00' },
        { accountCode: '3000', accountName: 'Equity', accountType: 'EQUITY', periodDebit: '0.00', periodCredit: '200000.00', closingDebit: '0.00', closingCredit: '200000.00' },
        { accountCode: '4000', accountName: 'Revenue', accountType: 'REVENUE', periodDebit: '0.00', periodCredit: '180000.00', closingDebit: '0.00', closingCredit: '180000.00' },
        { accountCode: '5000', accountName: 'Expenses', accountType: 'EXPENSE', periodDebit: '95000.00', periodCredit: '0.00', closingDebit: '95000.00', closingCredit: '0.00' },
      ],
      totalPeriodDebit: '465000.00',
      totalPeriodCredit: '465000.00',
      totalClosingDebit: '465000.00',
      totalClosingCredit: '465000.00',
      isBalanced: true,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    console.error('GL Trial Balance GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
