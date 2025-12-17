/**
 * Match Error Handler
 * 
 * Maps AP-03 Match Cell errors to HTTP responses.
 * 
 * @file apps/web/lib/match-error-handler.ts
 */

import { NextResponse } from 'next/server';

import {
  isMatchCellError,
  MatchCellError,
  MatchResultNotFoundError,
  MatchExceptionNotFoundError,
  InvoiceNotFoundForMatchError,
  MatchConcurrencyError,
  MatchAlreadyExistsError,
  InvoiceNotSubmittedError,
  MatchModeNotConfiguredError,
  PurchaseOrderNotFoundError,
  GoodsReceiptNotFoundError,
  OverrideNotAllowedError,
  OverrideSoDViolationError,
  OverrideAlreadyAppliedError,
  MatchResultImmutableError,
  InvalidMatchStatusError,
} from '../../canon/finance/dom03-accounts-payable/cells/ap03-3way-engine';

/**
 * Handle match cell errors and return appropriate HTTP response
 */
export function handleMatchError(error: unknown): NextResponse {
  console.error('[MATCH ERROR]', error);

  if (isMatchCellError(error)) {
    const cellError = error as MatchCellError;
    return NextResponse.json(cellError.toJSON(), { status: cellError.httpStatus });
  }

  // Handle specific error types
  if (error instanceof MatchResultNotFoundError) {
    return NextResponse.json(
      { error: error.message, code: 'MATCH_RESULT_NOT_FOUND' },
      { status: 404 }
    );
  }

  if (error instanceof OverrideSoDViolationError) {
    return NextResponse.json(
      { error: error.message, code: 'OVERRIDE_SOD_VIOLATION' },
      { status: 403 }
    );
  }

  if (error instanceof OverrideNotAllowedError) {
    return NextResponse.json(
      { error: error.message, code: 'OVERRIDE_NOT_ALLOWED' },
      { status: 403 }
    );
  }

  // Handle generic errors
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
