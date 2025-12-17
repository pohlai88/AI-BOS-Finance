/**
 * Invoice Submit API Route
 * 
 * POST /api/ap/invoices/{id}/submit - Submit invoice for matching/approval
 * 
 * AP-02 Invoice Entry Cell - BFF Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getInvoiceService, getInvoiceActorContext } from '@/lib/invoice-services.server';
import { handleInvoiceError } from '@/lib/invoice-error-handler';
import { SubmitInvoiceSchema } from '@/src/features/invoice/schemas/invoiceZodSchemas';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/ap/invoices/{id}/submit
 * 
 * Submit invoice for matching (AP-03) and approval (AP-04)
 * Transitions status from 'draft' to 'submitted'
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
    const parseResult = SubmitInvoiceSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const invoice = await invoiceService.submit(id, actor, parseResult.data.version);

    return NextResponse.json({
      ...invoice,
      message: 'Invoice submitted successfully',
    });
  } catch (error) {
    return handleInvoiceError(error);
  }
}
