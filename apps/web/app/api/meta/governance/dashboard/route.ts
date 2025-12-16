/**
 * BFF Route: GET /api/meta/governance/dashboard
 * Serves: META_01 Schema Governance Control Center
 * 
 * Security: Requires authentication per security-rules.mdc
 */

import { NextRequest, NextResponse } from 'next/server';
import { metadataStudio, BackendError } from '@/lib/backend.server';
import { requireAuth } from '@/lib/auth.middleware';
import type { GovernanceDashboardResponse } from '@ai-bos/shared';

export async function GET(request: NextRequest) {
  // 1. Authenticate user (per security-rules.mdc)
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) {
    return auth; // Return error response
  }

  try {
    const data = await metadataStudio.getGovernanceDashboard() as GovernanceDashboardResponse;
    return NextResponse.json(data);
  } catch (error) {
    console.error('[BFF] GET /api/meta/governance/dashboard error:', error);

    if (error instanceof BackendError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch governance dashboard' },
      { status: 500 },
    );
  }
}
