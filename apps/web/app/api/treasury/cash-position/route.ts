/**
 * Treasury Cash Position Dashboard
 * 
 * GET /api/treasury/cash-position
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const querySchema = z.object({
  companyId: z.string().uuid().optional(),
  currency: z.string().length(3).optional(),
  asOfDate: z.string().optional(),
});

// GET /api/treasury/cash-position
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    // TODO: Aggregate cash balances from bank accounts

    return NextResponse.json({
      asOfDate: query.asOfDate || new Date().toISOString().split('T')[0],
      
      summary: {
        totalCash: 5250000,
        currency: 'USD',
      },
      
      byCurrency: [
        { currency: 'USD', balance: 3500000, accountCount: 3 },
        { currency: 'SGD', balance: 1250000, accountCount: 2 },
        { currency: 'EUR', balance: 500000, accountCount: 1 },
      ],
      
      byCompany: [
        { companyId: 'company-1', companyName: 'Acme US', balance: 2500000 },
        { companyId: 'company-2', companyName: 'Acme SG', balance: 1750000 },
        { companyId: 'company-3', companyName: 'Acme EU', balance: 1000000 },
      ],
      
      accounts: [
        { id: '1', bankName: 'Chase', accountType: 'checking', currency: 'USD', balance: 2000000, status: 'active' },
        { id: '2', bankName: 'DBS', accountType: 'checking', currency: 'SGD', balance: 1250000, status: 'active' },
        { id: '3', bankName: 'Chase', accountType: 'savings', currency: 'USD', balance: 1500000, status: 'active' },
        { id: '4', bankName: 'Deutsche Bank', accountType: 'checking', currency: 'EUR', balance: 500000, status: 'active' },
      ],
      
      generatedAt: new Date(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    console.error('Treasury cash position error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
