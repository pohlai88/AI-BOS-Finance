/**
 * GET /api/ap/vendors/[id]/bank-accounts - List bank accounts for a vendor
 * POST /api/ap/vendors/[id]/bank-accounts - Add bank account to vendor
 * 
 * AP-01 Vendor Master Cell - BFF Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { CreateBankAccountInputSchema } from '@/features/vendor/schemas';
import { getBankAccountService, getVendorActorContext } from '@/lib/vendor-services.server';
import { handleVendorError, validationErrorResponse } from '@/lib/vendor-error-handler';

// ============================================================================
// GET /api/ap/vendors/[id]/bank-accounts - List Bank Accounts
// ============================================================================

export async function GET(
  request: NextRequest,
  ctx: RouteContext<'/api/ap/vendors/[id]/bank-accounts'>
) {
  try {
    const { id: vendorId } = await ctx.params;

    // Get actor context
    const actor = await getVendorActorContext();

    // Get BankAccountService and list accounts
    const bankAccountService = await getBankAccountService();

    const accounts = await bankAccountService.listBankAccounts(vendorId, actor);

    return NextResponse.json({ accounts, total: accounts.length });
  } catch (error) {
    return handleVendorError(error, 'listing bank accounts');
  }
}

// ============================================================================
// POST /api/ap/vendors/[id]/bank-accounts - Add Bank Account
// ============================================================================

export async function POST(
  request: NextRequest,
  ctx: RouteContext<'/api/ap/vendors/[id]/bank-accounts'>
) {
  try {
    const { id: vendorId } = await ctx.params;

    // Parse and validate body
    const body = await request.json();
    const validation = CreateBankAccountInputSchema.safeParse(body);

    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten().fieldErrors);
    }

    // Get actor context
    const actor = await getVendorActorContext();

    // Get BankAccountService and add bank account
    const bankAccountService = await getBankAccountService();

    const account = await bankAccountService.addBankAccount(
      {
        vendorId,
        bankName: validation.data.bankName,
        accountNumber: validation.data.accountNumber,
        accountName: validation.data.accountName,
        routingNumber: validation.data.routingNumber,
        swiftCode: validation.data.swiftCode,
        iban: validation.data.iban,
        currency: validation.data.currency,
        isPrimary: validation.data.isPrimary,
      },
      actor
    );

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    return handleVendorError(error, 'adding bank account');
  }
}
