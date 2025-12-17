/**
 * Invoice API Routes
 * 
 * GET  /api/ap/invoices - List invoices
 * POST /api/ap/invoices - Create invoice
 * 
 * AP-02 Invoice Entry Cell - BFF Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getInvoiceService, getInvoiceActorContext } from '@/lib/invoice-services.server';
import { handleInvoiceError } from '@/lib/invoice-error-handler';
import {
  CreateInvoiceSchema,
  ListInvoicesQuerySchema,
} from '@/src/features/invoice/schemas/invoiceZodSchemas';

/**
 * GET /api/ap/invoices
 * 
 * List invoices with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const actor = await getInvoiceActorContext();
    const invoiceService = await getInvoiceService();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    
    const parseResult = ListInvoicesQuerySchema.safeParse(query);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const result = await invoiceService.list(parseResult.data, actor);

    return NextResponse.json({
      invoices: result.invoices,
      total: result.total,
      limit: parseResult.data.limit,
      offset: parseResult.data.offset,
    });
  } catch (error) {
    return handleInvoiceError(error);
  }
}

/**
 * POST /api/ap/invoices
 * 
 * Create a new invoice (draft status)
 */
export async function POST(request: NextRequest) {
  try {
    const actor = await getInvoiceActorContext();
    const invoiceService = await getInvoiceService();

    const body = await request.json();
    
    const parseResult = CreateInvoiceSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const invoice = await invoiceService.create(parseResult.data, actor);

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    return handleInvoiceError(error);
  }
}
