/**
 * GET /api/ap/vendors/[id]/bank-accounts/[bankId] - Get bank account details
 * 
 * AP-01 Vendor Master Cell - BFF Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { getBankAccountService, getVendorActorContext } from '@/lib/vendor-services.server';
import { handleVendorError, notFoundResponse } from '@/lib/vendor-error-handler';

// ============================================================================
// GET /api/ap/vendors/[id]/bank-accounts/[bankId] - Get Bank Account Details
// ============================================================================

export async function GET(
  request: NextRequest,
  ctx: RouteContext<'/api/ap/vendors/[id]/bank-accounts/[bankId]'>
) {
  try {
    const { bankId } = await ctx.params;

    // Get actor context
    const actor = await getVendorActorContext();

    // Get BankAccountService and fetch account
    const bankAccountService = await getBankAccountService();

    const account = await bankAccountService.getBankAccountById(bankId, actor);

    if (!account) {
      return notFoundResponse('Bank account', bankId);
    }

    return NextResponse.json(account);
  } catch (error) {
    return handleVendorError(error, 'fetching bank account');
  }
}
