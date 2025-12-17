/**
 * Reject Invoice API Route
 * 
 * POST /api/ap/approvals/invoice/{invoiceId}/reject - Reject invoice
 * 
 * AP-04 Invoice Approval Workflow — BFF Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApprovalService, getApprovalActorContext } from '@/lib/approval-services.server';
import { handleApprovalError } from '@/lib/approval-error-handler';
import { z } from 'zod';

type RouteContext = {
  params: Promise<{ invoiceId: string }>;
};

const RejectSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(1000),
});

/**
 * POST /api/ap/approvals/invoice/{invoiceId}/reject
 * 
 * Reject invoice
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const actor = await getApprovalActorContext();
    const approvalService = await getApprovalService();
    const { invoiceId } = await context.params;

    const body = await request.json();

    const parseResult = RejectSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const approval = await approvalService.reject(
      invoiceId,
      { reason: parseResult.data.reason },
      actor
    );

    return NextResponse.json({
      ...approval,
      message: 'Invoice rejected',
    });
  } catch (error) {
    return handleApprovalError(error);
  }
}
