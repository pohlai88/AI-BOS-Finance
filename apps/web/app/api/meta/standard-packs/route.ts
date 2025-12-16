/**
 * BFF Route: GET /api/meta/standard-packs
 * List all standard packs
 * 
 * Security: Requires authentication per security-rules.mdc
 */

import { NextRequest, NextResponse } from 'next/server';
import { metadataStudio, BackendError } from '@/lib/backend.server';
import { requireAuth } from '@/lib/auth.middleware';

/**
 * GET /api/meta/standard-packs
 * List all standard packs
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

    if (searchParams.get('category')) params.category = searchParams.get('category')!;
    if (searchParams.get('tier')) params.tier = searchParams.get('tier')!;
    if (searchParams.get('q')) params.q = searchParams.get('q')!;

    const data = await metadataStudio.getStandardPacks(
      Object.keys(params).length > 0 ? params : undefined
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error('[BFF] GET /api/meta/standard-packs error:', error);

    if (error instanceof BackendError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch standard packs' },
      { status: 500 }
    );
  }
}
