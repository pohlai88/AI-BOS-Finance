/**
 * GET /api/ap/vendors/[id] - Get vendor details
 * PUT /api/ap/vendors/[id] - Update vendor (draft only)
 * 
 * AP-01 Vendor Master Cell - BFF Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { UpdateVendorInputSchema } from '@/features/vendor/schemas';
import { getVendorService, getVendorActorContext } from '@/lib/vendor-services.server';
import {
  handleVendorError,
  validationErrorResponse,
  notFoundResponse,
} from '@/lib/vendor-error-handler';

// ============================================================================
// GET /api/ap/vendors/[id] - Get Vendor Details
// ============================================================================

export async function GET(
  request: NextRequest,
  ctx: RouteContext<'/api/ap/vendors/[id]'>
) {
  try {
    const { id: vendorId } = await ctx.params;

    // Get actor context
    const actor = await getVendorActorContext();

    // Get VendorService and fetch vendor
    const vendorService = await getVendorService();

    const vendor = await vendorService.getById(vendorId, actor);

    if (!vendor) {
      return notFoundResponse('Vendor', vendorId);
    }

    return NextResponse.json(vendor);
  } catch (error) {
    return handleVendorError(error, 'fetching');
  }
}

// ============================================================================
// PUT /api/ap/vendors/[id] - Update Vendor (draft only)
// ============================================================================

export async function PUT(
  request: NextRequest,
  ctx: RouteContext<'/api/ap/vendors/[id]'>
) {
  try {
    const { id: vendorId } = await ctx.params;

    // Parse and validate body
    const body = await request.json();
    const validation = UpdateVendorInputSchema.safeParse(body);

    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten().fieldErrors);
    }

    // Get actor context
    const actor = await getVendorActorContext();

    // Get VendorService and update vendor
    const vendorService = await getVendorService();

    const vendor = await vendorService.update(
      vendorId,
      {
        legalName: validation.data.legalName,
        displayName: validation.data.displayName,
        taxId: validation.data.taxId,
        registrationNumber: validation.data.registrationNumber,
        country: validation.data.country,
        currencyPreference: validation.data.currencyPreference,
        vendorCategory: validation.data.vendorCategory,
        riskLevel: validation.data.riskLevel,
        defaultPaymentTerms: validation.data.defaultPaymentTerms,
      },
      actor,
      validation.data.version
    );

    return NextResponse.json(vendor);
  } catch (error) {
    return handleVendorError(error, 'updating');
  }
}
