/**
 * BFF Route: GET /api/meta/governance/risks
 * Serves: META_04 Risk Radar
 * 
 * Security: Requires authentication per security-rules.mdc
 */

import { NextRequest, NextResponse } from 'next/server';
import { metadataStudio, BackendError } from '@/lib/backend.server';
import { requireAuth } from '@/lib/auth.middleware';
import type { RiskRadarResponse } from '@ai-bos/shared';

export async function GET(request: NextRequest) {
  // 1. Authenticate user (per security-rules.mdc)
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) {
    return auth; // Return error response
  }

  try {
    const data = await metadataStudio.getRiskRadar() as RiskRadarResponse;
    return NextResponse.json(data);
  } catch (error) {
    console.error('[BFF] GET /api/meta/governance/risks error:', error);

    if (error instanceof BackendError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch risk radar' },
      { status: 500 },
    );
  }
}
