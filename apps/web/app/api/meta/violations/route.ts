/**
 * BFF Route: GET /api/meta/violations
 * 
 * Security: Requires authentication per security-rules.mdc
 */

import { NextRequest, NextResponse } from 'next/server';
import { metadataStudio, BackendError } from '@/lib/backend.server';
import { requireAuth } from '@/lib/auth.middleware';

/**
 * GET /api/meta/violations
 * List violations for current tenant
 */
export async function GET(request: NextRequest) {
  // 1. Authenticate user (per security-rules.mdc)
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) {
    return auth; // Return error response
  }

  try {
    const { searchParams } = new URL(request.url);
    const params: Record<string, string> = {};

    if (searchParams.get('status')) params.status = searchParams.get('status')!;
    if (searchParams.get('severity')) params.severity = searchParams.get('severity')!;
    if (searchParams.get('code')) params.code = searchParams.get('code')!;
    if (searchParams.get('page')) params.page = searchParams.get('page')!;
    if (searchParams.get('limit')) params.limit = searchParams.get('limit')!;

    const data = await metadataStudio.getViolations(
      Object.keys(params).length > 0 ? params : undefined
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error('[BFF] GET /api/meta/violations error:', error);

    if (error instanceof BackendError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch violations' },
      { status: 500 }
    );
  }
}
