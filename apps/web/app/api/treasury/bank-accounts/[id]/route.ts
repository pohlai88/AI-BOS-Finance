/**
 * TR-01 Bank Master - Get/Update Bank Account by ID
 * 
 * GET   /api/treasury/bank-accounts/:id
 * PATCH /api/treasury/bank-accounts/:id
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const updateBankAccountSchema = z.object({
  bankName: z.string().min(1).max(255).optional(),
  branchName: z.string().max(255).optional(),
  bankAddress: z.string().optional(),
  accountName: z.string().min(1).max(255).optional(),
  swiftCode: z.string().max(11).optional(),
  iban: z.string().max(34).optional(),
  routingNumber: z.string().max(9).optional(),
  sortCode: z.string().max(8).optional(),
  glAccountCode: z.string().min(1).optional(),
  version: z.number().int().positive(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/treasury/bank-accounts/:id
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Call BankMasterService.getById()

    return NextResponse.json({
      id,
      bankName: 'DBS Bank',
      accountNumber: '****1234',
      accountName: 'Acme Corp Operating Account',
      accountType: 'checking',
      currency: 'SGD',
      status: 'active',
      glAccountCode: '1000',
      version: 1,
    });
  } catch (error) {
    console.error('TR Bank Account GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/treasury/bank-accounts/:id
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const tenantId = request.headers.get('x-tenant-id');
    const userId = request.headers.get('x-user-id');
    
    if (!tenantId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const input = updateBankAccountSchema.parse(body);

    // TODO: Call BankMasterService.update()

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
    console.error('TR Bank Account PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
