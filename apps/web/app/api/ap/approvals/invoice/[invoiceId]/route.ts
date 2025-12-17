/**
 * Invoice Approval History API Route
 * 
 * GET /api/ap/approvals/invoice/{invoiceId} - Get approval history
 * POST /api/ap/approvals/invoice/{invoiceId}/request - Request approval
 * 
 * AP-04 Invoice Approval Workflow — BFF Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApprovalService, getApprovalActorContext } from '@/lib/approval-services.server';
import { handleApprovalError } from '@/lib/approval-error-handler';

type RouteContext = {
  params: Promise<{ invoiceId: string }>;
};

/**
 * GET /api/ap/approvals/invoice/{invoiceId}
 * 
 * Get approval history for an invoice
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const actor = await getApprovalActorContext();
    const approvalService = await getApprovalService();
    const { invoiceId } = await context.params;

    const approvals = await approvalService.getApprovalHistory(invoiceId, actor);

    return NextResponse.json({ approvals });
  } catch (error) {
    return handleApprovalError(error);
  }
}

/**
 * POST /api/ap/approvals/invoice/{invoiceId}
 * 
 * Request approval for an invoice (creates approval route)
 */
export async function POST(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const actor = await getApprovalActorContext();
    const approvalService = await getApprovalService();
    const { invoiceId } = await context.params;

    const route = await approvalService.requestApproval(invoiceId, actor);

    return NextResponse.json({
      ...route,
      message: 'Approval requested successfully',
    }, { status: 201 });
  } catch (error) {
    return handleApprovalError(error);
  }
}
