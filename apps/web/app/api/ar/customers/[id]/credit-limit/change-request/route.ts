/**
 * POST /api/ar/customers/:id/credit-limit/change-request - Request credit limit change
 * 
 * AR-01 Customer Master Cell - BFF Route
 * Creates a pending credit limit change request that requires approval
 */

import { NextRequest, NextResponse } from 'next/server';
import { CreditLimitChangeRequestInputSchema } from '@/src/features/customer/schemas';
import { getCustomerService } from '@/lib/customer-services.server';
import { apiRoute, RateLimitPresets, ValidationError, requirePermission, apiCache, ARPermissions } from '@/lib/api';

type RouteContext = { params: Promise<{ id: string }> };

export const POST = apiRoute(
  RateLimitPresets.MUTATION,
  requirePermission(
    ARPermissions.CREDIT_LIMIT_REQUEST,
    async (request: NextRequest, actor, context?: RouteContext) => {
      const { id } = await context!.params;
      const body = await request.json();

      const validation = CreditLimitChangeRequestInputSchema.safeParse(body);
      if (!validation.success) {
        throw ValidationError.fromZod(validation.error);
      }

      const customerService = await getCustomerService();

      const creditHistory = await customerService.requestCreditLimitChange(
        id,
        {
          newCreditLimit: validation.data.newCreditLimit,
          reason: validation.data.reason,
          version: validation.data.version,
        },
        actor
      );

      await apiCache.invalidateByTag(`customer:${id}`);

      return NextResponse.json(creditHistory, { status: 201 });
    }
  )
);
