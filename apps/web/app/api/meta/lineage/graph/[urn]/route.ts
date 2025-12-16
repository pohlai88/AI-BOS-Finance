/**
 * BFF Route: /api/meta/lineage/graph/[urn]
 * Fetches lineage graph for a specific node URN
 * 
 * Security: Requires authentication per security-rules.mdc
 */

import { NextRequest, NextResponse } from 'next/server';
import { metadataStudio, BackendError } from '@/lib/backend.server';
import { requireAuth } from '@/lib/auth.middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ urn: string }> }
) {
  // 1. Authenticate user (per security-rules.mdc)
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) {
    return auth; // Return error response
  }

  try {
    const { urn } = await params;
    const { searchParams } = new URL(request.url);

    const direction = searchParams.get('direction') || 'both';
    const depth = searchParams.get('depth') || '2';

    const data = await metadataStudio.getLineageGraph(urn, {
      direction,
      depth,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('[BFF] GET /api/meta/lineage/graph/[urn] error:', error);

    if (error instanceof BackendError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch lineage graph' },
      { status: 500 }
    );
  }
}
