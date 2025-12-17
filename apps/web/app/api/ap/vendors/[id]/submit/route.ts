/**
 * POST /api/ap/vendors/[id]/submit - Submit vendor for approval
 * 
 * AP-01 Vendor Master Cell - BFF Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { VersionInputSchema } from '@/features/vendor/schemas';
import { getVendorService, getVendorActorContext } from '@/lib/vendor-services.server';
import { handleVendorError, validationErrorResponse } from '@/lib/vendor-error-handler';

export async function POST(
  request: NextRequest,
  ctx: RouteContext<'/api/ap/vendors/[id]/submit'>
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

    // Get VendorService and submit vendor
    const vendorService = await getVendorService();

    const vendor = await vendorService.submit(
      vendorId,
      actor,
      validation.data.version
    );

    return NextResponse.json(vendor);
  } catch (error) {
    return handleVendorError(error, 'submitting');
  }
}
