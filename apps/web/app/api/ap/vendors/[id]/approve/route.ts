/**
 * POST /api/ap/vendors/[id]/approve - Approve a vendor
 * 
 * AP-01 Vendor Master Cell - BFF Route
 * 
 * SoD: Approver cannot be the same as creator.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApprovalInputSchema } from '@/features/vendor/schemas';
import { getVendorApprovalService, getVendorActorContext } from '@/lib/vendor-services.server';
import { handleVendorError, validationErrorResponse } from '@/lib/vendor-error-handler';

export async function POST(
  request: NextRequest,
  ctx: RouteContext<'/api/ap/vendors/[id]/approve'>
) {
  try {
    const { id: vendorId } = await ctx.params;

    // Parse and validate body
    const body = await request.json();
    const validation = ApprovalInputSchema.safeParse(body);

    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten().fieldErrors);
    }

    // Get actor context
    const actor = await getVendorActorContext();

    // Get ApprovalService and approve vendor
    const approvalService = await getVendorApprovalService();

    const result = await approvalService.approve(
      vendorId,
      actor,
      validation.data.version
    );

    return NextResponse.json(result);
  } catch (error) {
    return handleVendorError(error, 'approving');
  }
}
