/**
 * BFF Route: GET /api/meta/governance/health
 * Serves: META_06 Health Scan
 * 
 * Security: Requires authentication per security-rules.mdc
 */

import { NextRequest, NextResponse } from 'next/server';
import { metadataStudio, BackendError } from '@/lib/backend.server';
import { requireAuth } from '@/lib/auth.middleware';
import type { HealthScanResponse } from '@ai-bos/shared';

export async function GET(request: NextRequest) {
  // 1. Authenticate user (per security-rules.mdc)
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) {
    return auth; // Return error response
  }

  try {
    const data = await metadataStudio.getHealthScan() as HealthScanResponse;
    return NextResponse.json(data);
  } catch (error) {
    console.error('[BFF] GET /api/meta/governance/health error:', error);

    if (error instanceof BackendError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch health scan' },
      { status: 500 },
    );
  }
}
