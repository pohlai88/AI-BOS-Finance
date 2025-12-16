/**
 * BFF Route: /api/meta/lineage
 * Proxies lineage node list requests to metadata-studio backend
 * 
 * Security: Requires authentication per security-rules.mdc
 */

import { NextRequest, NextResponse } from 'next/server';
import { metadataStudio, BackendError } from '@/lib/backend.server';
import { requireAuth } from '@/lib/auth.middleware';

export async function GET(request: NextRequest) {
  // 1. Authenticate user (per security-rules.mdc)
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) {
    return auth; // Return error response
  }

  try {
    const { searchParams } = new URL(request.url);
    const params: Record<string, string> = {};

    if (searchParams.get('type')) params.type = searchParams.get('type')!;
    if (searchParams.get('layer')) params.layer = searchParams.get('layer')!;
    if (searchParams.get('q')) params.q = searchParams.get('q')!;
    if (searchParams.get('limit')) params.limit = searchParams.get('limit')!;
    if (searchParams.get('offset')) params.offset = searchParams.get('offset')!;

    const data = await metadataStudio.getLineageNodes(
      Object.keys(params).length > 0 ? params : undefined
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error('[BFF] GET /api/meta/lineage error:', error);

    if (error instanceof BackendError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch lineage nodes' },
      { status: 500 }
    );
  }
}
