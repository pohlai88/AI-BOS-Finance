/**
 * POST /api/payments/[id]/approve - Approve a payment
 * 
 * AP-05 Payment Execution Cell - BFF Route
 * 
 * @improvement Added RouteContext<> for strongly typed params (Next.js 16)
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApprovalInputSchema } from '@/modules/payment/schemas';
import { getApprovalService, getActorContext } from '@/lib/payment-services.server';
import {
  handlePaymentError,
  validationErrorResponse,
  missingIdempotencyKeyResponse,
} from '@/lib/payment-error-handler';

export async function POST(
  request: NextRequest,
  ctx: RouteContext<'/api/payments/[id]/approve'>
) {
  try {
    const { id: paymentId } = await ctx.params;
    const idempotencyKey = request.headers.get('X-Idempotency-Key');

    if (!idempotencyKey) {
      return missingIdempotencyKeyResponse();
    }

    const body = await request.json();
    const validation = ApprovalInputSchema.safeParse(body);

    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten().fieldErrors);
    }

    // Get actor context
    const actor = await getActorContext();

    // Get ApprovalService and approve payment
    const approvalService = await getApprovalService();

    const result = await approvalService.approve(
      paymentId,
      actor,
      validation.data.version,
      validation.data.comment
    );

    return NextResponse.json(result);
  } catch (error) {
    return handlePaymentError(error, 'approving');
  }
}
