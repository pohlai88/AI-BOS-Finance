/**
 * GET /api/ar/customers - List customers
 * POST /api/ar/customers - Create a new customer
 * 
 * AR-01 Customer Master Cell - BFF Route
 * 
 * Uses apiRoute() composer for:
 * - Rate limiting
 * - Authentication
 * - Error handling
 */

import { NextResponse } from 'next/server';
import { CreateCustomerInputSchema, ListCustomersQuerySchema } from '@/src/features/customer/schemas';
import { getCustomerService } from '@/lib/customer-services.server';
import { 
  apiRoute, 
  RateLimitPresets, 
  ValidationError,
  apiCache,
  cacheKey,
  CacheTTL,
} from '@/lib/api';

// ============================================================================
// GET /api/ar/customers - List Customers
// ============================================================================

export const GET = apiRoute(
  RateLimitPresets.READ,
  async (request, actor) => {
    const { searchParams } = new URL(request.url);

    // Parse query params
    const queryParams = {
      status: searchParams.get('status') || undefined,
      customerCategory: searchParams.get('customerCategory') || undefined,
      riskLevel: searchParams.get('riskLevel') || undefined,
      collectionStatus: searchParams.get('collectionStatus') || undefined,
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit') || '50',
      offset: searchParams.get('offset') || '0',
    };

    // Validate query params
    const validation = ListCustomersQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      throw ValidationError.fromZod(validation.error);
    }

    // Cache key based on tenant and filter
    const key = cacheKey('customers', actor.tenantId, JSON.stringify(validation.data));

    // Get from cache or fetch
    const result = await apiCache.getOrSet(
      key,
      async () => {
        const customerService = await getCustomerService();
        return customerService.list(validation.data, actor);
      },
      { ttl: CacheTTL.SHORT, tags: ['customers', `tenant:${actor.tenantId}`] }
    );

    return NextResponse.json(result);
  }
);

// ============================================================================
// POST /api/ar/customers - Create Customer
// ============================================================================

export const POST = apiRoute(
  RateLimitPresets.MUTATION,
  async (request, actor) => {
    // Parse and validate body
    const body = await request.json();
    const validation = CreateCustomerInputSchema.safeParse(body);

    if (!validation.success) {
      throw ValidationError.fromZod(validation.error);
    }

    // Get CustomerService and create customer
    const customerService = await getCustomerService();

    const customer = await customerService.create(
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
      },
      actor
    );

    // Invalidate list cache
    await apiCache.invalidateByTag(`tenant:${actor.tenantId}`);

    return NextResponse.json(customer, { status: 201 });
  }
);
