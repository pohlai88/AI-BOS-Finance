/**
 * Invoice Duplicate Check API Route
 * 
 * POST /api/ap/invoices/{id}/duplicate-check - Check for duplicate invoices
 * 
 * AP-02 Invoice Entry Cell - BFF Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getDuplicateDetectionService,
  getInvoiceService,
  getInvoiceActorContext,
} from '@/lib/invoice-services.server';
import { handleInvoiceError } from '@/lib/invoice-error-handler';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/ap/invoices/{id}/duplicate-check
 * 
 * Analyze potential duplicates for an existing invoice
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const actor = await getInvoiceActorContext();
    const invoiceService = await getInvoiceService();
    const duplicateService = await getDuplicateDetectionService();
    const { id } = await context.params;

    // Get the invoice
    const invoice = await invoiceService.getById(id, actor);
    if (!invoice) {
      return NextResponse.json(
        { error: `Invoice not found: ${id}`, code: 'INVOICE_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Analyze for duplicates
    const analysis = await duplicateService.analyzeDuplicates(
      {
        vendorId: invoice.vendorId,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        totalAmountCents: invoice.totalAmountCents,
        excludeInvoiceId: id,
      },
      actor
    );

    return NextResponse.json({
      invoiceId: id,
      ...analysis,
    });
  } catch (error) {
    return handleInvoiceError(error);
  }
}

/**
 * POST /api/ap/invoices/{id}/duplicate-check
 * 
 * Mark invoice as duplicate of another invoice
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const actor = await getInvoiceActorContext();
    const duplicateService = await getDuplicateDetectionService();
    const { id } = await context.params;

    const body = await request.json();
    const { duplicateOfId } = body;

    if (!duplicateOfId) {
      return NextResponse.json(
        { error: 'duplicateOfId is required', code: 'MISSING_DUPLICATE_OF_ID' },
        { status: 400 }
      );
    }

    const invoice = await duplicateService.markAsDuplicate(id, duplicateOfId, actor);

    return NextResponse.json({
      ...invoice,
      message: 'Invoice marked as duplicate',
    });
  } catch (error) {
    return handleInvoiceError(error);
  }
}
