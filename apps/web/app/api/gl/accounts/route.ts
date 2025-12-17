/**
 * GL-01 Chart of Accounts - List & Create
 * 
 * GET  /api/gl/accounts - List accounts
 * POST /api/gl/accounts - Create new account
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schemas
const createAccountSchema = z.object({
  companyId: z.string().uuid(),
  accountCode: z.string().optional(),
  accountName: z.string().min(1).max(255),
  accountType: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']),
  normalBalance: z.enum(['DEBIT', 'CREDIT']),
  parentAccountId: z.string().uuid().optional(),
  isPostable: z.boolean().default(true),
  currency: z.string().length(3).optional(),
  description: z.string().optional(),
  effectiveDate: z.string().transform(s => new Date(s)),
});

const listQuerySchema = z.object({
  companyId: z.string().uuid().optional(),
  accountType: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']).optional(),
  status: z.enum(['draft', 'pending_approval', 'active', 'inactive']).optional(),
  postableOnly: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  search: z.string().optional(),
  limit: z.string().transform(Number).default('50'),
  offset: z.string().transform(Number).default('0'),
});

// GET /api/gl/accounts
export async function GET(request: NextRequest) {
  try {
    // TODO: Get session and tenant context
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = listQuerySchema.parse(Object.fromEntries(searchParams));

    // TODO: Call AccountService.list()
    // const service = getAccountService();
    // const result = await service.list(query, { tenantId, userId: session.userId });

    // Mock response
    return NextResponse.json({
      data: [],
      total: 0,
      limit: query.limit,
      offset: query.offset,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    console.error('GL Accounts GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/gl/accounts
export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const userId = request.headers.get('x-user-id');
    
    if (!tenantId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const input = createAccountSchema.parse(body);

    // TODO: Call AccountService.create()
    // const service = getAccountService();
    // const account = await service.create(input, { tenantId, userId });

    // Mock response
    const account = {
      id: crypto.randomUUID(),
      ...input,
      status: 'draft',
      version: 1,
      createdBy: userId,
      createdAt: new Date(),
    };

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    console.error('GL Accounts POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
