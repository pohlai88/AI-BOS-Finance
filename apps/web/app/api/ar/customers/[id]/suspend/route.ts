/**
 * POST /api/ar/customers/:id/suspend - Suspend customer
 * 
 * AR-01 Customer Master Cell - BFF Route
 * Enforces SoD: suspender ≠ creator
 */

import { NextRequest, NextResponse } from 'next/server';
import { SuspendInputSchema } from '@/src/features/customer/schemas';
import { getCustomerService } from '@/lib/customer-services.server';
import { apiRoute, RateLimitPresets, ValidationError, requirePermission, apiCache, ARPermissions } from '@/lib/api';

type RouteContext = { params: Promise<{ id: string }> };

export const POST = apiRoute(
  RateLimitPresets.MUTATION,
  requirePermission(
    ARPermissions.CUSTOMER_SUSPEND,
    async (request: NextRequest, actor, context?: RouteContext) => {
      const { id } = await context!.params;
      const body = await request.json();

      const validation = SuspendInputSchema.safeParse(body);
      if (!validation.success) {
        throw ValidationError.fromZod(validation.error);
      }

      const customerService = await getCustomerService();

      const customer = await customerService.suspend(
        id,
        {
          version: validation.data.version,
          reason: validation.data.reason,
        },
        actor
      );

      await apiCache.invalidateByTag(`customer:${id}`);

      return NextResponse.json(customer);
    }
  )
);
