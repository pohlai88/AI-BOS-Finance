/**
 * Payment Exceptions API
 * 
 * GET /api/payments/exceptions - List all exceptions with counts
 * 
 * Phase 6a Enhancement: Risk Queue
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { getActorContext } from '@/lib/payment-services.server';
import { ExceptionService } from '@aibos/canon';

export async function GET(request: NextRequest) {
  try {
    const actor = await getActorContext(request);
    const pool = getPool();

    const exceptionService = new ExceptionService(pool);

    // Get query params for filtering
    const searchParams = request.nextUrl.searchParams;
    const severity = searchParams.get('severity');
    const type = searchParams.get('type');
    const paymentId = searchParams.get('paymentId');

    let exceptions;

    if (paymentId) {
      // Get exceptions for specific payment
      exceptions = await exceptionService.getExceptionsForPayment(actor.tenantId, paymentId);
    } else {
      // Get all exceptions
      exceptions = await exceptionService.detectExceptions(actor.tenantId);
    }

    // Apply filters
    if (severity) {
      exceptions = exceptions.filter(e => e.severity === severity);
    }
    if (type) {
      exceptions = exceptions.filter(e => e.type === type);
    }

    const counts = await exceptionService.getExceptionCounts(actor.tenantId);

    return NextResponse.json({
      success: true,
      data: {
        exceptions,
        counts,
      },
    });
  } catch (error) {
    console.error('Exception detection failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to detect exceptions' },
      { status: 500 }
    );
  }
}
