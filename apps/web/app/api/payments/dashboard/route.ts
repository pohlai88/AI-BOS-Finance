/**
 * GET /api/payments/dashboard - Full Payment Hub dashboard metrics
 * 
 * AP-05 Payment Execution Cell - Dashboard BFF Route
 * 
 * Returns:
 * - Cash position projection (today, week, month, 90 days)
 * - Payment counts by status
 * - Payments by company (for groups)
 * - Control health indicators
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDashboardService, getActorContext } from '@/lib/payment-services.server';
import { handlePaymentError } from '@/lib/payment-error-handler';

export async function GET(_request: NextRequest) {
  try {
    const actor = await getActorContext();
    const dashboardService = await getDashboardService();

    const metrics = await dashboardService.getDashboard(actor);

    return NextResponse.json(metrics);
  } catch (error) {
    return handlePaymentError(error, 'fetching dashboard');
  }
}
