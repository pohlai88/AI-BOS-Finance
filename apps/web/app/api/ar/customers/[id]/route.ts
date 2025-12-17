/**
 * GET /api/ar/customers/:id - Get customer details
 * PUT /api/ar/customers/:id - Update customer (draft only)
 * 
 * AR-01 Customer Master Cell - BFF Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { UpdateCustomerInputSchema } from '@/src/features/customer/schemas';
import { getCustomerService } from '@/lib/customer-services.server';
import { 
  apiRoute, 
  RateLimitPresets, 
  ValidationError,
  NotFoundError,
  apiCache,
  cacheKey,
  CacheTTL,
} from '@/lib/api';

type RouteContext = { params: Promise<{ id: string }> };

// ============================================================================
// GET /api/ar/customers/:id - Get Customer
// ============================================================================

export const GET = apiRoute(
  RateLimitPresets.READ,
  async (request: NextRequest, actor, context?: RouteContext) => {
    const { id } = await context!.params;

    // Cache key for single customer
    const key = cacheKey('customer', actor.tenantId, id);

    const customer = await apiCache.getOrSet(
      key,
      async () => {
        const customerService = await getCustomerService();
        return customerService.getById(id, actor);
      },
      { ttl: CacheTTL.SHORT, tags: ['customers', `customer:${id}`, `tenant:${actor.tenantId}`] }
    );

    if (!customer) {
      throw new NotFoundError('Customer', id);
    }

    return NextResponse.json(customer);
  }
);

// ============================================================================
// PUT /api/ar/customers/:id - Update Customer
// ============================================================================

export const PUT = apiRoute(
  RateLimitPresets.MUTATION,
  async (request: NextRequest, actor, context?: RouteContext) => {
    const { id } = await context!.params;
    const body = await request.json();

    const validation = UpdateCustomerInputSchema.safeParse(body);
    if (!validation.success) {
      throw ValidationError.fromZod(validation.error);
    }

    const customerService = await getCustomerService();

    const customer = await customerService.update(
      id,
      {
        legalName: validation.data.legalName,
        displayName: validation.data.displayName,
        taxId: validation.data.taxId,
        registrationNumber: validation.data.registrationNumber,
        country: validation.data.country,
        currencyPreference: validation.data.currencyPreference,
        customerCategory: validation.data.customerCategory,
        riskLevel: validation.data.riskLevel,
        creditLimit: validation.data.creditLimit,
        defaultPaymentTerms: validation.data.defaultPaymentTerms,
        version: validation.data.version,
      },
      actor
    );

    // Invalidate cache
    await apiCache.invalidateByTag(`customer:${id}`);

    return NextResponse.json(customer);
  }
);
