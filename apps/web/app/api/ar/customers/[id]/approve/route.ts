/**
 * POST /api/ar/customers/:id/approve - Approve customer
 * 
 * AR-01 Customer Master Cell - BFF Route
 * Enforces SoD: approver ≠ creator
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApprovalInputSchema } from '@/src/features/customer/schemas';
import { getCustomerService } from '@/lib/customer-services.server';
import { 
  apiRoute, 
  RateLimitPresets, 
  ValidationError,
  requirePermission,
  apiCache,
  ARPermissions,
} from '@/lib/api';

type RouteContext = { params: Promise<{ id: string }> };

export const POST = apiRoute(
  RateLimitPresets.MUTATION,
  requirePermission(
    ARPermissions.CUSTOMER_APPROVE,
    async (request: NextRequest, actor, context?: RouteContext) => {
      const { id } = await context!.params;
      const body = await request.json();

      const validation = ApprovalInputSchema.safeParse(body);
      if (!validation.success) {
        throw ValidationError.fromZod(validation.error);
      }

      const customerService = await getCustomerService();

      const customer = await customerService.approve(
        id,
        {
          version: validation.data.version,
          comments: validation.data.comments,
        },
        actor
      );

      // Invalidate cache
      await apiCache.invalidateByTag(`customer:${id}`);

      return NextResponse.json(customer);
    }
  )
);
