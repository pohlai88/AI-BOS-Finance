/**
 * BFF Route: /api/meta/lineage/impact
 * Performs impact analysis for a proposed change
 * 
 * Security: Requires authentication per security-rules.mdc
 */

import { NextRequest, NextResponse } from 'next/server';
import { metadataStudio, BackendError } from '@/lib/backend.server';
import { requireAuth } from '@/lib/auth.middleware';

export async function POST(request: NextRequest) {
  // 1. Authenticate user (per security-rules.mdc)
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) {
    return auth; // Return error response
  }

  try {
    const body = await request.json();

    const data = await metadataStudio.analyzeImpact(body);

    return NextResponse.json(data);
  } catch (error) {
    console.error('[BFF] POST /api/meta/lineage/impact error:', error);

    if (error instanceof BackendError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: 'Failed to perform impact analysis' },
      { status: 500 }
    );
  }
}
