/**
 * GL-04 Period Close - List Periods
 * 
 * GET /api/gl/periods
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const listQuerySchema = z.object({
  companyId: z.string().uuid().optional(),
  fiscalYear: z.string().transform(Number).optional(),
  status: z.enum(['open', 'soft_close', 'hard_close', 'controlled_reopen']).optional(),
  limit: z.string().transform(Number).default('12'),
  offset: z.string().transform(Number).default('0'),
});

// GET /api/gl/periods
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = listQuerySchema.parse(Object.fromEntries(searchParams));

    // TODO: Call PeriodCloseService.listPeriods()

    // Mock response - return fiscal year periods
    const currentYear = new Date().getFullYear();
    const periods = Array.from({ length: 12 }, (_, i) => ({
      id: crypto.randomUUID(),
      periodCode: `${currentYear}-${String(i + 1).padStart(2, '0')}`,
      fiscalYear: currentYear,
      fiscalPeriod: i + 1,
      startDate: new Date(currentYear, i, 1),
      endDate: new Date(currentYear, i + 1, 0),
      status: i < 10 ? 'hard_close' : i === 10 ? 'soft_close' : 'open',
    }));

    return NextResponse.json({
      data: periods,
      total: periods.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    console.error('GL Periods GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
