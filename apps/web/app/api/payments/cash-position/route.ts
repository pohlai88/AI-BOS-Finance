/**
 * GET /api/payments/cash-position - Cash outflow projection
 * 
 * AP-05 Payment Execution Cell - Cash Position BFF Route
 * 
 * Query Parameters:
 * - days: Number of days to project (default: 90)
 * 
 * Returns:
 * - Summary (today, week, month, 90 days)
 * - Daily breakdown of scheduled payments
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDashboardService, getActorContext } from '@/lib/payment-services.server';
import { handlePaymentError } from '@/lib/payment-error-handler';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '90', 10);

    // Validate days parameter
    if (days < 1 || days > 365) {
      return NextResponse.json(
        { error: 'Days parameter must be between 1 and 365' },
        { status: 400 }
      );
    }

    const actor = await getActorContext();
    const dashboardService = await getDashboardService();

    const cashPosition = await dashboardService.getCashPosition(actor, days);

    return NextResponse.json(cashPosition);
  } catch (error) {
    return handlePaymentError(error, 'fetching cash position');
  }
}
