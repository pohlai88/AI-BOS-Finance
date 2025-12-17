/**
 * Approve Invoice API Route
 * 
 * POST /api/ap/approvals/invoice/{invoiceId}/approve - Approve invoice
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

const ApproveSchema = z.object({
  comments: z.string().max(1000).optional(),
});

/**
 * POST /api/ap/approvals/invoice/{invoiceId}/approve
 * 
 * Approve invoice at current level
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const actor = await getApprovalActorContext();
    const approvalService = await getApprovalService();
    const { invoiceId } = await context.params;

    const body = await request.json().catch(() => ({}));

    const parseResult = ApproveSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const approval = await approvalService.approve(
      invoiceId,
      { comments: parseResult.data.comments },
      actor
    );

    return NextResponse.json({
      ...approval,
      message: 'Invoice approved successfully',
    });
  } catch (error) {
    return handleApprovalError(error);
  }
}
