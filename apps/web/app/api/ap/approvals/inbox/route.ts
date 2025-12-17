/**
 * Approval Inbox API Route
 * 
 * GET /api/ap/approvals/inbox - List pending approvals for current user
 * 
 * AP-04 Invoice Approval Workflow — BFF Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApprovalService, getApprovalActorContext } from '@/lib/approval-services.server';
import { handleApprovalError } from '@/lib/approval-error-handler';

/**
 * GET /api/ap/approvals/inbox
 * 
 * Get pending approvals for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const actor = await getApprovalActorContext();
    const approvalService = await getApprovalService();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const result = await approvalService.getInbox(actor, limit, offset);

    return NextResponse.json({
      items: result.items,
      total: result.total,
      limit,
      offset,
    });
  } catch (error) {
    return handleApprovalError(error);
  }
}
