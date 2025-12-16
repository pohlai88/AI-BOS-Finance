/**
 * BFF Route: /api/meta/entities
 * Serves: META_05 Canon Matrix
 * 
 * GET  - List entities with filters
 * POST - Create new entity
 * 
 * Security: Requires authentication per security-rules.mdc
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { metadataStudio, BackendError } from '@/lib/backend.server';
import { requireAuth } from '@/lib/auth.middleware';
import type { EntityDto } from '@ai-bos/shared';

/**
 * GET /api/meta/entities
 * List entities with optional filters
 */
export async function GET(request: NextRequest) {
  // 1. Authenticate user (per security-rules.mdc)
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) {
    return auth; // Return error response
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const params: Record<string, string> = {};

    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const data = await metadataStudio.getEntities(params);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[BFF] GET /api/meta/entities error:', error);

    if (error instanceof BackendError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch entities' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/meta/entities
 * Create a new entity
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
    if (!body.entity_urn || !body.entity_name || !body.domain) {
      return NextResponse.json(
        { error: 'Missing required fields: entity_urn, entity_name, domain' },
        { status: 400 },
      );
    }

    const data = await metadataStudio.createEntity(body) as EntityDto;

    // Revalidate cache
    revalidateTag('entities', 'max');
    revalidateTag('entity-tree', 'max');

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('[BFF] POST /api/meta/entities error:', error);

    if (error instanceof BackendError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: 'Failed to create entity' },
      { status: 500 },
    );
  }
}
