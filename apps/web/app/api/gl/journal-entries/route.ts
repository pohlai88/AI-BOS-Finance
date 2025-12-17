/**
 * GL-02 Journal Entry - List & Create
 * 
 * GET  /api/gl/journal-entries - List journal entries
 * POST /api/gl/journal-entries - Create new journal entry
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schemas
const journalLineSchema = z.object({
  accountCode: z.string().min(1),
  debitAmount: z.string().regex(/^\d+(\.\d{2})?$/).optional(),
  creditAmount: z.string().regex(/^\d+(\.\d{2})?$/).optional(),
  costCenter: z.string().optional(),
  department: z.string().optional(),
  project: z.string().optional(),
  memo: z.string().optional(),
}).refine(
  (line) => (line.debitAmount && !line.creditAmount) || (!line.debitAmount && line.creditAmount),
  { message: 'Line must have exactly one of debitAmount or creditAmount' }
);

const createJournalEntrySchema = z.object({
  companyId: z.string().uuid(),
  entryDate: z.string().transform(s => new Date(s)),
  entryType: z.enum(['adjusting', 'accrual', 'reclassification', 'opening', 'closing', 'reversal', 'correction']),
  reference: z.string().min(1).max(100),
  description: z.string().min(1),
  lines: z.array(journalLineSchema).min(2),
  autoReverse: z.boolean().default(false),
  reverseDate: z.string().transform(s => new Date(s)).optional(),
  isRecurring: z.boolean().default(false),
  recurringSchedule: z.object({
    frequency: z.enum(['monthly', 'quarterly', 'yearly']),
    startDate: z.string().transform(s => new Date(s)),
    endDate: z.string().transform(s => new Date(s)).optional(),
  }).optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    fileUrl: z.string().url(),
    fileType: z.string(),
    fileSizeBytes: z.number().int().positive(),
  })).optional(),
});

const listQuerySchema = z.object({
  companyId: z.string().uuid().optional(),
  status: z.enum(['draft', 'submitted', 'approved', 'rejected', 'posted', 'cancelled', 'closed']).optional(),
  entryType: z.enum(['adjusting', 'accrual', 'reclassification', 'opening', 'closing', 'reversal', 'correction']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  reference: z.string().optional(),
  limit: z.string().transform(Number).default('50'),
  offset: z.string().transform(Number).default('0'),
});

// GET /api/gl/journal-entries
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = listQuerySchema.parse(Object.fromEntries(searchParams));

    // TODO: Call JournalEntryService.list()
    // const service = getJournalEntryService();
    // const result = await service.list(query);

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
    console.error('GL Journal Entries GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/gl/journal-entries
export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const userId = request.headers.get('x-user-id');
    
    if (!tenantId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const input = createJournalEntrySchema.parse(body);

    // Validate balance
    let totalDebit = 0;
    let totalCredit = 0;
    for (const line of input.lines) {
      if (line.debitAmount) totalDebit += parseFloat(line.debitAmount);
      if (line.creditAmount) totalCredit += parseFloat(line.creditAmount);
    }
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json({
        error: 'Entry is not balanced',
        details: { totalDebit: totalDebit.toFixed(2), totalCredit: totalCredit.toFixed(2) },
      }, { status: 400 });
    }

    // TODO: Call JournalEntryService.create()
    // const service = getJournalEntryService();
    // const entry = await service.create(input, { tenantId, userId });

    const entry = {
      id: crypto.randomUUID(),
      entryNumber: `JE-2024-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      ...input,
      totalDebit: totalDebit.toFixed(2),
      totalCredit: totalCredit.toFixed(2),
      isBalanced: true,
      status: 'draft',
      version: 1,
      createdBy: userId,
      createdAt: new Date(),
    };

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    console.error('GL Journal Entries POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
