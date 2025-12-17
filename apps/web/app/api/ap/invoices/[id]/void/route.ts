/**
 * Invoice Void API Route
 * 
 * POST /api/ap/invoices/{id}/void - Void an invoice
 * 
 * AP-02 Invoice Entry Cell - BFF Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getInvoiceService, getInvoiceActorContext } from '@/lib/invoice-services.server';
import { handleInvoiceError } from '@/lib/invoice-error-handler';
import { VoidInvoiceSchema } from '@/src/features/invoice/schemas/invoiceZodSchemas';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/ap/invoices/{id}/void
 * 
 * Void an invoice (creates reversal journal if posted)
 * Transitions status to 'voided'
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const actor = await getInvoiceActorContext();
    const invoiceService = await getInvoiceService();
    const { id } = await context.params;

    const body = await request.json();

    // Validate request body
    const parseResult = VoidInvoiceSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const invoice = await invoiceService.void(
      id,
      parseResult.data.reason,
      actor,
      parseResult.data.version
    );

    return NextResponse.json({
      ...invoice,
      message: 'Invoice voided successfully',
    });
  } catch (error) {
    return handleInvoiceError(error);
  }
}
