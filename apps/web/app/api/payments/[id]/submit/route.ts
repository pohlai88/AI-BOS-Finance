/**
 * POST /api/payments/[id]/submit - Submit payment for approval
 * 
 * AP-05 Payment Execution Cell - BFF Route
 * 
 * @improvement Added RouteContext<> for strongly typed params (Next.js 16)
 */

import { NextRequest, NextResponse } from 'next/server';
import { SubmissionInputSchema } from '@/modules/payment/schemas';
import { getExecutionService, getActorContext } from '@/lib/payment-services.server';
import {
  handlePaymentError,
  validationErrorResponse,
  missingIdempotencyKeyResponse,
} from '@/lib/payment-error-handler';

export async function POST(
  request: NextRequest,
  ctx: RouteContext<'/api/payments/[id]/submit'>
) {
  try {
    const { id: paymentId } = await ctx.params;
    const idempotencyKey = request.headers.get('X-Idempotency-Key');

    if (!idempotencyKey) {
      return missingIdempotencyKeyResponse();
    }

    const body = await request.json();
    const validation = SubmissionInputSchema.safeParse(body);

    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten().fieldErrors);
    }

    // Get actor context
    const actor = await getActorContext();

    // Get ExecutionService and submit payment
    const executionService = await getExecutionService();

    const result = await executionService.submit(
      paymentId,
      actor,
      validation.data.version
    );

    return NextResponse.json(result);
  } catch (error) {
    return handlePaymentError(error, 'submitting');
  }
}
