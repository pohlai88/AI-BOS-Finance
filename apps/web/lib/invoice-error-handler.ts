/**
 * Invoice Error Handler
 * 
 * Maps AP-02 Invoice Cell errors to HTTP responses.
 * 
 * @file apps/web/lib/invoice-error-handler.ts
 */

import { NextResponse } from 'next/server';

import {
  isInvoiceCellError,
  InvoiceCellError,
  InvoiceNotFoundError,
  InvoiceConcurrencyError,
  VendorNotApprovedError,
  DuplicateInvoiceError,
  PeriodClosedError,
  GLPostingError,
  InvalidInvoiceStatusError,
  InvoiceNotInDraftError,
  InvoiceLinesRequiredError,
  InvoiceAmountMismatchError,
  DueDateBeforeInvoiceDateError,
} from '../../canon/finance/dom03-accounts-payable/cells/ap02-invoice-entry';

/**
 * Handle invoice cell errors and return appropriate HTTP response
 */
export function handleInvoiceError(error: unknown): NextResponse {
  // Log all errors for debugging
  console.error('[INVOICE ERROR]', error);

  // Handle known invoice cell errors
  if (isInvoiceCellError(error)) {
    const cellError = error as InvoiceCellError;
    return NextResponse.json(cellError.toJSON(), { status: cellError.httpStatus });
  }

  // Handle specific error types with detailed messages
  if (error instanceof InvoiceNotFoundError) {
    return NextResponse.json(
      { error: error.message, code: 'INVOICE_NOT_FOUND' },
      { status: 404 }
    );
  }

  if (error instanceof InvoiceConcurrencyError) {
    return NextResponse.json(
      { error: error.message, code: 'INVOICE_CONCURRENCY_CONFLICT' },
      { status: 409 }
    );
  }

  if (error instanceof VendorNotApprovedError) {
    return NextResponse.json(
      { error: error.message, code: 'VENDOR_NOT_APPROVED' },
      { status: 422 }
    );
  }

  if (error instanceof DuplicateInvoiceError) {
    return NextResponse.json(
      { error: error.message, code: 'DUPLICATE_INVOICE' },
      { status: 409 }
    );
  }

  if (error instanceof PeriodClosedError) {
    return NextResponse.json(
      { error: error.message, code: 'PERIOD_CLOSED' },
      { status: 422 }
    );
  }

  if (error instanceof GLPostingError) {
    return NextResponse.json(
      { error: error.message, code: 'GL_POSTING_FAILED' },
      { status: 500 }
    );
  }

  if (error instanceof InvalidInvoiceStatusError) {
    return NextResponse.json(
      { error: error.message, code: 'INVALID_INVOICE_STATUS' },
      { status: 422 }
    );
  }

  if (error instanceof InvoiceNotInDraftError) {
    return NextResponse.json(
      { error: error.message, code: 'INVOICE_NOT_IN_DRAFT' },
      { status: 422 }
    );
  }

  if (error instanceof InvoiceLinesRequiredError) {
    return NextResponse.json(
      { error: error.message, code: 'INVOICE_LINES_REQUIRED' },
      { status: 422 }
    );
  }

  if (error instanceof InvoiceAmountMismatchError) {
    return NextResponse.json(
      { error: error.message, code: 'INVOICE_AMOUNT_MISMATCH' },
      { status: 422 }
    );
  }

  if (error instanceof DueDateBeforeInvoiceDateError) {
    return NextResponse.json(
      { error: error.message, code: 'DUE_DATE_BEFORE_INVOICE_DATE' },
      { status: 422 }
    );
  }

  // Handle generic errors
  if (error instanceof Error) {
    // Don't expose internal error details in production
    const isDev = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      {
        error: isDev ? error.message : 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }

  // Unknown error type
  return NextResponse.json(
    { error: 'An unexpected error occurred', code: 'UNKNOWN_ERROR' },
    { status: 500 }
  );
}

/**
 * Wrap an async handler with error handling
 */
export function withInvoiceErrorHandling<T>(
  handler: () => Promise<T>
): Promise<T | NextResponse> {
  return handler().catch(handleInvoiceError);
}
