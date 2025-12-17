/**
 * POST /api/ap/vendors/[id]/suspend - Suspend a vendor
 * 
 * AP-01 Vendor Master Cell - BFF Route
 * 
 * Suspend vendor: approved → suspended
 */

import { NextRequest, NextResponse } from 'next/server';
import { VersionInputSchema } from '@/features/vendor/schemas';
import { getVendorApprovalService, getVendorActorContext } from '@/lib/vendor-services.server';
import { handleVendorError, validationErrorResponse } from '@/lib/vendor-error-handler';

export async function POST(
  request: NextRequest,
  ctx: RouteContext<'/api/ap/vendors/[id]/suspend'>
) {
  try {
    const { id: vendorId } = await ctx.params;

    // Parse and validate body
    const body = await request.json();
    const validation = VersionInputSchema.safeParse(body);

    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten().fieldErrors);
    }

    // Get actor context
    const actor = await getVendorActorContext();

    // Get ApprovalService and suspend vendor
    const approvalService = await getVendorApprovalService();

    const vendor = await approvalService.suspend(
      vendorId,
      actor,
      validation.data.version
    );

    return NextResponse.json(vendor);
  } catch (error) {
    return handleVendorError(error, 'suspending');
  }
}
