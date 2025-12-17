/**
 * POST /api/ap/vendors/[id]/bank-accounts/[bankId]/change-request
 * 
 * Request a change to bank account details.
 * Changes require approval (SoD: requester ≠ approver).
 * 
 * AP-01 Vendor Master Cell - BFF Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { RequestBankAccountChangeInputSchema } from '@/features/vendor/schemas';
import { getBankAccountService, getVendorActorContext } from '@/lib/vendor-services.server';
import { handleVendorError, validationErrorResponse } from '@/lib/vendor-error-handler';

export async function POST(
  request: NextRequest,
  ctx: RouteContext<'/api/ap/vendors/[id]/bank-accounts/[bankId]/change-request'>
) {
  try {
    const { bankId } = await ctx.params;

    // Parse and validate body
    const body = await request.json();
    const validation = RequestBankAccountChangeInputSchema.safeParse(body);

    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten().fieldErrors);
    }

    // Get actor context
    const actor = await getVendorActorContext();

    // Get BankAccountService and request change
    const bankAccountService = await getBankAccountService();

    const account = await bankAccountService.requestBankAccountChange(
      {
        bankAccountId: bankId,
        bankName: validation.data.bankName,
        accountNumber: validation.data.accountNumber,
        accountName: validation.data.accountName,
        routingNumber: validation.data.routingNumber,
        swiftCode: validation.data.swiftCode,
        iban: validation.data.iban,
        currency: validation.data.currency,
      },
      actor,
      validation.data.version
    );

    return NextResponse.json(account);
  } catch (error) {
    return handleVendorError(error, 'requesting bank account change');
  }
}
