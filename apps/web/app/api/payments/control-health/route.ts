/**
 * GET /api/payments/control-health - Control health metrics
 * 
 * AP-05 Payment Execution Cell - Control Health BFF Route
 * 
 * Returns:
 * - SoD compliance rate
 * - Pending approvals count and amount
 * - Exception counts by severity
 * - Audit coverage percentage
 * - Overall health status (healthy/warning/critical)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDashboardService, getActorContext } from '@/lib/payment-services.server';
import { handlePaymentError } from '@/lib/payment-error-handler';

export async function GET(_request: NextRequest) {
  try {
    const actor = await getActorContext();
    const dashboardService = await getDashboardService();

    const controlHealth = await dashboardService.getControlHealth(actor);

    return NextResponse.json(controlHealth);
  } catch (error) {
    return handlePaymentError(error, 'fetching control health');
  }
}
