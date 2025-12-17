/**
 * POST /api/ar/customers/:id/submit - Submit customer for approval
 * 
 * AR-01 Customer Master Cell - BFF Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { VersionInputSchema } from '@/src/features/customer/schemas';
import { getCustomerService } from '@/lib/customer-services.server';
import { apiRoute, RateLimitPresets, ValidationError, apiCache } from '@/lib/api';

type RouteContext = { params: Promise<{ id: string }> };

export const POST = apiRoute(
  RateLimitPresets.MUTATION,
  async (request: NextRequest, actor, context?: RouteContext) => {
    const { id } = await context!.params;
    const body = await request.json();

    const validation = VersionInputSchema.safeParse(body);
    if (!validation.success) {
      throw ValidationError.fromZod(validation.error);
    }

    const customerService = await getCustomerService();

    const customer = await customerService.submit(
      id,
      { version: validation.data.version },
      actor
    );

    await apiCache.invalidateByTag(`customer:${id}`);

    return NextResponse.json(customer);
  }
);
