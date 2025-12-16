/**
 * BFF Route: /api/meta/entities/[urn]
 * Serves: META_05 Entity Detail
 * 
 * GET - Get single entity by URN
 * 
 * Security: Requires authentication per security-rules.mdc
 */

import { NextRequest, NextResponse } from 'next/server';
import { metadataStudio, BackendError } from '@/lib/backend.server';
import { requireAuth } from '@/lib/auth.middleware';
import type { EntityDto } from '@ai-bos/shared';

interface RouteParams {
  params: Promise<{ urn: string }>;
}

/**
 * GET /api/meta/entities/[urn]
 * Get a single entity by URN
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  // 1. Authenticate user (per security-rules.mdc)
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) {
    return auth; // Return error response
  }

  try {
    const { urn } = await params;
    const data = await metadataStudio.getEntity(urn) as EntityDto;
    return NextResponse.json(data);
  } catch (error) {
    console.error('[BFF] GET /api/meta/entities/[urn] error:', error);

    if (error instanceof BackendError) {
      if (error.status === 404) {
        return NextResponse.json(
          { error: 'Entity not found' },
          { status: 404 },
        );
      }
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch entity' },
      { status: 500 },
    );
  }
}
