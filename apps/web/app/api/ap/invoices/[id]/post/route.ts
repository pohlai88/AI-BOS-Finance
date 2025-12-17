/**
 * Invoice Post to GL API Route
 * 
 * POST /api/ap/invoices/{id}/post - Post invoice to General Ledger
 * 
 * AP-02 Invoice Entry Cell - BFF Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPostingService, getInvoiceActorContext } from '@/lib/invoice-services.server';
import { handleInvoiceError } from '@/lib/invoice-error-handler';
import { PostInvoiceSchema } from '@/src/features/invoice/schemas/invoiceZodSchemas';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/ap/invoices/{id}/post
 * 
 * Post approved invoice to General Ledger (GL-03)
 * - Validates period is open (K_TIME)
 * - Validates account codes (K_COA)
 * - Creates journal entries
 * - Transitions status from 'approved' to 'posted'
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const actor = await getInvoiceActorContext();
    const postingService = await getPostingService();
    const { id } = await context.params;

    const body = await request.json();

    // Validate request body
    const parseResult = PostInvoiceSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const invoice = await postingService.postToGL(id, actor, parseResult.data.version);

    return NextResponse.json({
      ...invoice,
      message: 'Invoice posted to General Ledger successfully',
    });
  } catch (error) {
    return handleInvoiceError(error);
  }
}
