/**
 * POST /api/ap/vendors/[id]/archive - Archive a vendor
 * 
 * AP-01 Vendor Master Cell - BFF Route
 * 
 * Archive vendor: approved/suspended → archived (terminal state)
 */

import { NextRequest, NextResponse } from 'next/server';
import { VersionInputSchema } from '@/features/vendor/schemas';
import { getVendorApprovalService, getVendorActorContext } from '@/lib/vendor-services.server';
import { handleVendorError, validationErrorResponse } from '@/lib/vendor-error-handler';

export async function POST(
  request: NextRequest,
  ctx: RouteContext<'/api/ap/vendors/[id]/archive'>
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

    // Get ApprovalService and archive vendor
    const approvalService = await getVendorApprovalService();

    const vendor = await approvalService.archive(
      vendorId,
      actor,
      validation.data.version
    );

    return NextResponse.json(vendor);
  } catch (error) {
    return handleVendorError(error, 'archiving');
  }
}
