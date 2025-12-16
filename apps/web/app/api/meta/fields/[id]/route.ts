/**
 * BFF Route: /api/meta/fields/[id]
 * Serves: META_02 Field Detail, META_03 Prism
 * 
 * GET - Get single field by ID
 * 
 * Security: Requires authentication per security-rules.mdc
 */

import { NextRequest, NextResponse } from 'next/server';
import { metadataStudio, BackendError } from '@/lib/backend.server';
import { requireAuth } from '@/lib/auth.middleware';
import type { MetadataFieldDto } from '@ai-bos/shared';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/meta/fields/[id]
 * Get a single metadata field by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  // 1. Authenticate user (per security-rules.mdc)
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) {
    return auth; // Return error response
  }

  try {
    const { id } = await params;
    const data = await metadataStudio.getField(id) as MetadataFieldDto;
    return NextResponse.json(data);
  } catch (error) {
    console.error('[BFF] GET /api/meta/fields/[id] error:', error);

    if (error instanceof BackendError) {
      if (error.status === 404) {
        return NextResponse.json(
          { error: 'Field not found' },
          { status: 404 },
        );
      }
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch field' },
      { status: 500 },
    );
  }
}
