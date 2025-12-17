/**
 * POST /api/ar/customers/:id/credit-limit/approve-change - Approve credit limit change
 * 
 * AR-01 Customer Master Cell - BFF Route
 * Enforces SoD: approver ≠ requester
 */

import { NextRequest, NextResponse } from 'next/server';
import { CreditLimitChangeApprovalInputSchema } from '@/src/features/customer/schemas';
import { getCustomerService } from '@/lib/customer-services.server';
import { apiRoute, RateLimitPresets, ValidationError, requirePermission, apiCache, ARPermissions } from '@/lib/api';

type RouteContext = { params: Promise<{ id: string }> };

export const POST = apiRoute(
  RateLimitPresets.MUTATION,
  requirePermission(
    ARPermissions.CREDIT_LIMIT_APPROVE,
    async (request: NextRequest, actor, context?: RouteContext) => {
      const { id } = await context!.params;
      const body = await request.json();

      const validation = CreditLimitChangeApprovalInputSchema.safeParse(body);
      if (!validation.success) {
        throw ValidationError.fromZod(validation.error);
      }

      const customerService = await getCustomerService();

      const customer = await customerService.approveCreditLimitChange(
        id,
        {
          changeRequestId: validation.data.changeRequestId,
          version: validation.data.version,
          comments: validation.data.comments,
        },
        actor
      );

      await apiCache.invalidateByTag(`customer:${id}`);

      return NextResponse.json(customer);
    }
  )
);
