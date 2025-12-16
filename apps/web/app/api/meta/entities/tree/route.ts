/**
 * BFF Route: GET /api/meta/entities/tree
 * Serves: META_05 Canon Matrix (Entity Hierarchy)
 * 
 * Security: Requires authentication per security-rules.mdc
 */

import { NextRequest, NextResponse } from 'next/server';
import { metadataStudio, BackendError } from '@/lib/backend.server';
import { requireAuth } from '@/lib/auth.middleware';
import type { EntityTreeResponse } from '@ai-bos/shared';

export async function GET(request: NextRequest) {
  // 1. Authenticate user (per security-rules.mdc)
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) {
    return auth; // Return error response
  }

  try {
    const data = await metadataStudio.getEntityTree() as EntityTreeResponse;
    return NextResponse.json(data);
  } catch (error) {
    console.error('[BFF] GET /api/meta/entities/tree error:', error);

    if (error instanceof BackendError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch entity tree' },
      { status: 500 },
    );
  }
}
