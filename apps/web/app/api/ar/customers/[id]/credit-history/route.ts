/**
 * GET /api/ar/customers/:id/credit-history - List credit history
 * 
 * AR-01 Customer Master Cell - BFF Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCustomerService } from '@/lib/customer-services.server';
import { apiRoute, RateLimitPresets, apiCache, cacheKey, CacheTTL } from '@/lib/api';

type RouteContext = { params: Promise<{ id: string }> };

// ============================================================================
// GET /api/ar/customers/:id/credit-history - List Credit History
// ============================================================================

export const GET = apiRoute(
  RateLimitPresets.READ,
  async (request: NextRequest, actor, context?: RouteContext) => {
    const { id } = await context!.params;

    const key = cacheKey('customer-credit-history', actor.tenantId, id);

    const history = await apiCache.getOrSet(
      key,
      async () => {
        const customerService = await getCustomerService();
        return customerService.getCreditHistory(id, actor);
      },
      { ttl: CacheTTL.SHORT, tags: [`customer:${id}`, `tenant:${actor.tenantId}`] }
    );

    return NextResponse.json(history);
  }
);
