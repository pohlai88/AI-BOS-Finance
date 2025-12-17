/**
 * POST /api/ap/vendors/[id]/bank-accounts/[bankId]/approve-change
 * 
 * Approve a pending bank account change request.
 * SoD: Approver cannot be the same as requester.
 * 
 * AP-01 Vendor Master Cell - BFF Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApproveBankAccountChangeInputSchema } from '@/features/vendor/schemas';
import { getBankAccountService, getVendorActorContext } from '@/lib/vendor-services.server';
import { handleVendorError, validationErrorResponse } from '@/lib/vendor-error-handler';

export async function POST(
  request: NextRequest,
  ctx: RouteContext<'/api/ap/vendors/[id]/bank-accounts/[bankId]/approve-change'>
) {
  try {
    const { bankId } = await ctx.params;

    // Parse and validate body
    const body = await request.json();
    const validation = ApproveBankAccountChangeInputSchema.safeParse(body);

    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten().fieldErrors);
    }

    // Get actor context
    const actor = await getVendorActorContext();

    // Get BankAccountService and approve change
    const bankAccountService = await getBankAccountService();

    const account = await bankAccountService.approveBankAccountChange(
      { bankAccountId: bankId },
      actor,
      validation.data.version
    );

    return NextResponse.json(account);
  } catch (error) {
    return handleVendorError(error, 'approving bank account change');
  }
}
