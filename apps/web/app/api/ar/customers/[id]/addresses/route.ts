/**
 * GET /api/ar/customers/:id/addresses - List customer addresses
 * POST /api/ar/customers/:id/addresses - Add customer address
 * 
 * AR-01 Customer Master Cell - BFF Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { CreateAddressInputSchema } from '@/src/features/customer/schemas';
import { getCustomerService } from '@/lib/customer-services.server';
import { apiRoute, RateLimitPresets, ValidationError, apiCache, cacheKey, CacheTTL } from '@/lib/api';

type RouteContext = { params: Promise<{ id: string }> };

// ============================================================================
// GET /api/ar/customers/:id/addresses - List Addresses
// ============================================================================

export const GET = apiRoute(
  RateLimitPresets.READ,
  async (request: NextRequest, actor, context?: RouteContext) => {
    const { id } = await context!.params;

    const key = cacheKey('customer-addresses', actor.tenantId, id);

    const addresses = await apiCache.getOrSet(
      key,
      async () => {
        const customerService = await getCustomerService();
        return customerService.getAddresses(id, actor);
      },
      { ttl: CacheTTL.SHORT, tags: [`customer:${id}`, `tenant:${actor.tenantId}`] }
    );

    return NextResponse.json(addresses);
  }
);

// ============================================================================
// POST /api/ar/customers/:id/addresses - Add Address
// ============================================================================

export const POST = apiRoute(
  RateLimitPresets.MUTATION,
  async (request: NextRequest, actor, context?: RouteContext) => {
    const { id } = await context!.params;
    const body = await request.json();

    const validation = CreateAddressInputSchema.safeParse(body);
    if (!validation.success) {
      throw ValidationError.fromZod(validation.error);
    }

    const customerService = await getCustomerService();

    const address = await customerService.addAddress(
      id,
      {
        customerId: id,
        tenantId: actor.tenantId,
        addressType: validation.data.addressType,
        addressLine1: validation.data.addressLine1,
        addressLine2: validation.data.addressLine2,
        city: validation.data.city,
        stateProvince: validation.data.stateProvince,
        postalCode: validation.data.postalCode,
        country: validation.data.country,
        isPrimary: validation.data.isPrimary,
      },
      actor
    );

    await apiCache.invalidateByTag(`customer:${id}`);

    return NextResponse.json(address, { status: 201 });
  }
);
