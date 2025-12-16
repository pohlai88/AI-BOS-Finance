/**
 * BFF Route: /api/meta/fields
 * Serves: META_02 God View
 * 
 * GET  - List fields with filters
 * POST - Create new field (Lite Mode)
 * 
 * Security: Requires authentication per security-rules.mdc
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { metadataStudio, BackendError } from '@/lib/backend.server';
import { requireAuth } from '@/lib/auth.middleware';
import type { MetadataFieldsResponse, MetadataFieldDto } from '@ai-bos/shared';

/**
 * GET /api/meta/fields
 * List metadata fields with optional filters
 */
export async function GET(request: NextRequest) {
  // 1. Authenticate user (per security-rules.mdc)
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) {
    return auth; // Return error response
  }

  try {
    // Extract query params
    const searchParams = request.nextUrl.searchParams;
    const params: Record<string, string> = {};

    // Forward all query params
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const data = await metadataStudio.getFields(params) as MetadataFieldsResponse;
    return NextResponse.json(data);
  } catch (error) {
    console.error('[BFF] GET /api/meta/fields error:', error);

    if (error instanceof BackendError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch fields' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/meta/fields
 * Create a new metadata field
 */
export async function POST(request: NextRequest) {
  // 1. Authenticate user (per security-rules.mdc)
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) {
    return auth; // Return error response
  }

  try {
    const body = await request.json();

    // Basic validation
    if (!body.entity_urn || !body.field_name || !body.label) {
      return NextResponse.json(
        { error: 'Missing required fields: entity_urn, field_name, label' },
        { status: 400 },
      );
    }

    const data = await metadataStudio.createField(body) as MetadataFieldDto;

    // Revalidate cache
    revalidateTag('metadata-fields', 'max');

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('[BFF] POST /api/meta/fields error:', error);

    if (error instanceof BackendError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: 'Failed to create field' },
      { status: 500 },
    );
  }
}
