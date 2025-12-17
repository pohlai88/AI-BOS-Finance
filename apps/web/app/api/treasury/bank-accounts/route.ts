/**
 * TR-01 Bank Master - List & Create Bank Accounts
 * 
 * GET  /api/treasury/bank-accounts - List bank accounts
 * POST /api/treasury/bank-accounts - Create new bank account
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schemas
const createBankAccountSchema = z.object({
  companyId: z.string().uuid(),
  bankName: z.string().min(1).max(255),
  branchName: z.string().max(255).optional(),
  bankAddress: z.string().optional(),
  bankCountry: z.string().length(3),
  accountNumber: z.string().min(1).max(100),
  accountName: z.string().min(1).max(255),
  accountType: z.enum(['checking', 'savings', 'payroll', 'lockbox', 'sweep', 'imprest']),
  currency: z.string().length(3),
  swiftCode: z.string().max(11).optional(),
  iban: z.string().max(34).optional(),
  routingNumber: z.string().max(9).optional(),
  sortCode: z.string().max(8).optional(),
  glAccountCode: z.string().min(1),
  verificationType: z.enum(['micro_deposit', 'statement_upload', 'external_service', 'manual']).optional(),
});

const listQuerySchema = z.object({
  companyId: z.string().uuid().optional(),
  status: z.enum(['draft', 'verification', 'active', 'suspended', 'inactive', 'rejected', 'cancelled']).optional(),
  accountType: z.enum(['checking', 'savings', 'payroll', 'lockbox', 'sweep', 'imprest']).optional(),
  currency: z.string().length(3).optional(),
  search: z.string().optional(),
  limit: z.string().transform(Number).default('50'),
  offset: z.string().transform(Number).default('0'),
});

// GET /api/treasury/bank-accounts
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = listQuerySchema.parse(Object.fromEntries(searchParams));

    // TODO: Call BankMasterService.list()

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
    console.error('TR Bank Accounts GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/treasury/bank-accounts
export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const userId = request.headers.get('x-user-id');
    
    if (!tenantId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const input = createBankAccountSchema.parse(body);

    // TODO: Call BankMasterService.create()

    const bankAccount = {
      id: crypto.randomUUID(),
      ...input,
      accountNumberLast4: input.accountNumber.slice(-4),
      accountNumber: '****' + input.accountNumber.slice(-4),
      status: 'draft',
      version: 1,
      createdBy: userId,
      createdAt: new Date(),
    };

    return NextResponse.json(bankAccount, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    console.error('TR Bank Accounts POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
