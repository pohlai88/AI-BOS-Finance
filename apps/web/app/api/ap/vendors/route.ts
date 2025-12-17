/**
 * GET /api/ap/vendors - List vendors
 * POST /api/ap/vendors - Create a new vendor
 * 
 * AP-01 Vendor Master Cell - BFF Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { CreateVendorInputSchema, ListVendorsQuerySchema } from '@/features/vendor/schemas';
import { getVendorService, getVendorActorContext } from '@/lib/vendor-services.server';
import { handleVendorError, validationErrorResponse } from '@/lib/vendor-error-handler';

// ============================================================================
// GET /api/ap/vendors - List Vendors
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query params
    const queryParams = {
      status: searchParams.get('status') || undefined,
      vendorCategory: searchParams.get('vendorCategory') || undefined,
      riskLevel: searchParams.get('riskLevel') || undefined,
      isBlacklisted: searchParams.get('isBlacklisted') || undefined,
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit') || '50',
      offset: searchParams.get('offset') || '0',
    };

    // Validate query params
    const validation = ListVendorsQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten().fieldErrors);
    }

    // Get actor context
    const actor = await getVendorActorContext();

    // Get VendorService and list vendors
    const vendorService = await getVendorService();

    const result = await vendorService.list(
      {
        status: validation.data.status,
        vendorCategory: validation.data.vendorCategory,
        riskLevel: validation.data.riskLevel,
        isBlacklisted: validation.data.isBlacklisted,
        search: validation.data.search,
        limit: validation.data.limit,
        offset: validation.data.offset,
      },
      actor
    );

    return NextResponse.json(result);
  } catch (error) {
    return handleVendorError(error, 'listing');
  }
}

// ============================================================================
// POST /api/ap/vendors - Create Vendor
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Parse and validate body
    const body = await request.json();
    const validation = CreateVendorInputSchema.safeParse(body);

    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten().fieldErrors);
    }

    // Get actor context
    const actor = await getVendorActorContext();

    // Get VendorService and create vendor
    const vendorService = await getVendorService();

    const vendor = await vendorService.create(
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
      actor
    );

    return NextResponse.json(vendor, { status: 201 });
  } catch (error) {
    return handleVendorError(error, 'creating');
  }
}
