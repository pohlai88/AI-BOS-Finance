/**
 * POST /api/payments/[id]/complete - Complete payment (bank confirmed)
 * 
 * AP-05 Payment Execution Cell - BFF Route
 * 
 * @improvement Added RouteContext<> for strongly typed params (Next.js 16)
 */

import { NextRequest, NextResponse } from 'next/server';
import { CompletionInputSchema } from '@/modules/payment/schemas';
import { getExecutionService, getActorContext } from '@/lib/payment-services.server';
import {
  handlePaymentError,
  validationErrorResponse,
  missingIdempotencyKeyResponse,
} from '@/lib/payment-error-handler';

export async function POST(
  request: NextRequest,
  ctx: RouteContext<'/api/payments/[id]/complete'>
) {
  try {
    const { id: paymentId } = await ctx.params;
    const idempotencyKey = request.headers.get('X-Idempotency-Key');

    if (!idempotencyKey) {
      return missingIdempotencyKeyResponse();
    }

    const body = await request.json();
    const validation = CompletionInputSchema.safeParse(body);

    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten().fieldErrors);
    }

    // Get actor context
    const actor = await getActorContext();

    // Get ExecutionService and complete payment
    const executionService = await getExecutionService();

    const result = await executionService.complete(
      paymentId,
      actor,
      validation.data.version,
      validation.data.bankConfirmationRef
    );

    return NextResponse.json(result);
  } catch (error) {
    return handlePaymentError(error, 'completing');
  }
}
