/**
 * Invoice Detail API Routes
 * 
 * GET /api/ap/invoices/{id} - Get invoice by ID
 * PUT /api/ap/invoices/{id} - Update invoice (draft only)
 * 
 * AP-02 Invoice Entry Cell - BFF Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getInvoiceService, getInvoiceActorContext } from '@/lib/invoice-services.server';
import { handleInvoiceError } from '@/lib/invoice-error-handler';
import { UpdateInvoiceSchema } from '@/src/features/invoice/schemas/invoiceZodSchemas';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/ap/invoices/{id}
 * 
 * Get invoice by ID with lines
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const actor = await getInvoiceActorContext();
    const invoiceService = await getInvoiceService();
    const { id } = await context.params;

    const invoice = await invoiceService.getByIdWithLines(id, actor);

    if (!invoice) {
      return NextResponse.json(
        { error: `Invoice not found: ${id}`, code: 'INVOICE_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    return handleInvoiceError(error);
  }
}

/**
 * PUT /api/ap/invoices/{id}
 * 
 * Update invoice (draft only)
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const actor = await getInvoiceActorContext();
    const invoiceService = await getInvoiceService();
    const { id } = await context.params;

    const body = await request.json();

    // Validate request body
    const parseResult = UpdateInvoiceSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    // Version is required for optimistic locking
    const version = body.version;
    if (typeof version !== 'number') {
      return NextResponse.json(
        { error: 'Version is required for update', code: 'VERSION_REQUIRED' },
        { status: 400 }
      );
    }

    const invoice = await invoiceService.update(id, parseResult.data, actor, version);

    return NextResponse.json(invoice);
  } catch (error) {
    return handleInvoiceError(error);
  }
}
