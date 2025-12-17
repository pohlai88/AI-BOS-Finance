/**
 * GET /api/payments/by-company - Multi-company payment breakdown
 * 
 * AP-05 Payment Execution Cell - Company Breakdown BFF Route
 * 
 * For groups of companies, returns:
 * - Payment aggregates per company
 * - Pending vs completed amounts
 * - Total across all companies
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDashboardService, getActorContext } from '@/lib/payment-services.server';
import { handlePaymentError } from '@/lib/payment-error-handler';

export async function GET(_request: NextRequest) {
  try {
    const actor = await getActorContext();
    const dashboardService = await getDashboardService();

    const companyBreakdown = await dashboardService.getByCompany(actor);

    return NextResponse.json(companyBreakdown);
  } catch (error) {
    return handlePaymentError(error, 'fetching company breakdown');
  }
}
