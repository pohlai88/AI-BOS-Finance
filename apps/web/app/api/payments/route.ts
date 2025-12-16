/**
 * POST /api/payments - Create a new payment
 * GET /api/payments - List payments
 * 
 * AP-05 Payment Execution Cell - BFF Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { CreatePaymentInputSchema } from '@/modules/payment/schemas';
import { getPaymentService, getActorContext, getTenantId } from '@/lib/payment-services.server';
import {
  handlePaymentError,
  validationErrorResponse,
  missingIdempotencyKeyResponse,
} from '@/lib/payment-error-handler';

// ============================================================================
// POST /api/payments - Create Payment
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // 1. Get idempotency key from header
    const idempotencyKey = request.headers.get('X-Idempotency-Key');
    if (!idempotencyKey) {
      return missingIdempotencyKeyResponse();
    }

    // 2. Parse and validate body
    const body = await request.json();
    const validation = CreatePaymentInputSchema.safeParse(body);

    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten().fieldErrors);
    }

    // 3. Get actor context (authenticated user)
    const actor = await getActorContext();

    // 4. Get PaymentService and create payment
    const paymentService = await getPaymentService();

    const payment = await paymentService.create(
      {
        vendorId: validation.data.vendorId,
        vendorName: validation.data.vendorName,
        amount: validation.data.amount,
        currency: validation.data.currency || 'USD',
        paymentDate: new Date(validation.data.paymentDate),
        dueDate: validation.data.dueDate ? new Date(validation.data.dueDate) : undefined,
        sourceDocumentId: validation.data.sourceDocumentId,
        sourceDocumentType: validation.data.sourceDocumentType,
      },
      actor,
      idempotencyKey
    );

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    return handlePaymentError(error, 'creating');
  }
}

// ============================================================================
// GET /api/payments - List Payments
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Get tenant context
    const tenantId = await getTenantId();

    // Get PaymentService and list payments
    const paymentService = await getPaymentService();

    const result = await paymentService.list({
      tenantId,
      status: status || undefined,
      limit,
      offset,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handlePaymentError(error, 'listing');
  }
}
