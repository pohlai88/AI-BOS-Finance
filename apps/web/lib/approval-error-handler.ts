/**
 * Approval Error Handler
 * 
 * Maps AP-04 errors to HTTP responses.
 * 
 * @file apps/web/lib/approval-error-handler.ts
 */

import { NextResponse } from 'next/server';

import {
  isApprovalCellError,
  ApprovalCellError,
  ApprovalNotFoundError,
  SoDViolationError,
  CannotApproveOwnInvoiceError,
  NotAuthorizedToApproveError,
  NotPendingApprovalError,
  AlreadyApprovedError,
  AlreadyRejectedError,
} from '../../canon/finance/dom03-accounts-payable/cells/ap04-invoice-submit-approval';

export function handleApprovalError(error: unknown): NextResponse {
  console.error('[APPROVAL ERROR]', error);

  if (isApprovalCellError(error)) {
    const cellError = error as ApprovalCellError;
    return NextResponse.json(cellError.toJSON(), { status: cellError.httpStatus });
  }

  if (error instanceof SoDViolationError || error instanceof CannotApproveOwnInvoiceError) {
    return NextResponse.json(
      { error: (error as Error).message, code: 'SOD_VIOLATION' },
      { status: 403 }
    );
  }

  if (error instanceof Error) {
    const isDev = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      {
        error: isDev ? error.message : 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { error: 'An unexpected error occurred', code: 'UNKNOWN_ERROR' },
    { status: 500 }
  );
}
