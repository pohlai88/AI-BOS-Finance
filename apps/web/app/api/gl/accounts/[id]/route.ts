/**
 * GL-01 Chart of Accounts - Get, Update, Delete by ID
 * 
 * GET    /api/gl/accounts/:id - Get account by ID
 * PATCH  /api/gl/accounts/:id - Update account
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const updateAccountSchema = z.object({
  accountName: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  parentAccountId: z.string().uuid().nullable().optional(),
  isPostable: z.boolean().optional(),
  currency: z.string().length(3).optional(),
  effectiveDate: z.string().transform(s => new Date(s)).optional(),
  version: z.number().int().positive(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/gl/accounts/:id
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Call AccountService.getById()
    // const service = getAccountService();
    // const account = await service.getById(id, { tenantId, userId: session.userId });

    // Mock response
    return NextResponse.json({
      id,
      accountCode: '1000',
      accountName: 'Cash and Cash Equivalents',
      accountType: 'ASSET',
      normalBalance: 'DEBIT',
      isPostable: true,
      status: 'active',
      version: 1,
    });
  } catch (error) {
    console.error('GL Accounts GET by ID error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/gl/accounts/:id
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const tenantId = request.headers.get('x-tenant-id');
    const userId = request.headers.get('x-user-id');
    
    if (!tenantId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const input = updateAccountSchema.parse(body);

    // TODO: Call AccountService.update()
    // const service = getAccountService();
    // const account = await service.update(id, input, { tenantId, userId });

    return NextResponse.json({
      id,
      ...input,
      version: input.version + 1,
      updatedBy: userId,
      updatedAt: new Date(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    console.error('GL Accounts PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
