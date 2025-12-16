/**
 * BFF Route: /api/meta/fields/[id]/mappings
 * Serves: META_03 Prism Comparator
 * 
 * GET - Get field mappings across systems
 * 
 * Security: Requires authentication per security-rules.mdc
 */

import { NextRequest, NextResponse } from 'next/server';
import { metadataStudio, BackendError } from '@/lib/backend.server';
import { requireAuth } from '@/lib/auth.middleware';
import type { PrismComparisonResponse } from '@ai-bos/shared';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/meta/fields/[id]/mappings
 * Get mappings for a canonical field across different systems
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  // 1. Authenticate user (per security-rules.mdc)
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) {
    return auth; // Return error response
  }

  try {
    const { id } = await params;
    // ID here is the canonical_key
    const data = await metadataStudio.getFieldMappings(id) as PrismComparisonResponse;
    return NextResponse.json(data);
  } catch (error) {
    console.error('[BFF] GET /api/meta/fields/[id]/mappings error:', error);

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
      { error: 'Failed to fetch field mappings' },
      { status: 500 },
    );
  }
}
