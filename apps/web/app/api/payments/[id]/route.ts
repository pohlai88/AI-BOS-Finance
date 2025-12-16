/**
 * GET /api/payments/[id] - Get a single payment
 * 
 * AP-05 Payment Execution Cell - BFF Route
 * 
 * @improvement Added RouteContext<> for strongly typed params (Next.js 16)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPaymentService, getTenantId } from '@/lib/payment-services.server';
import { handlePaymentError } from '@/lib/payment-error-handler';

export async function GET(
  request: NextRequest,
  ctx: RouteContext<'/api/payments/[id]'>
) {
  try {
    const { id: paymentId } = await ctx.params;

    // Get tenant context
    const tenantId = await getTenantId();

    // Get PaymentService and fetch payment
    const paymentService = await getPaymentService();

    const payment = await paymentService.getById(paymentId, tenantId);

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(payment);
  } catch (error) {
    return handlePaymentError(error, 'fetching');
  }
}
