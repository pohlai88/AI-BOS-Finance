/**
 * GL-02 Journal Entry - Next.js API Route Handler (Example)
 * 
 * REST API endpoints for journal entry operations.
 * This is a reference implementation showing how to wire up the service.
 * 
 * Place this in: apps/web/app/api/gl/journal-entries/route.ts
 * 
 * @module GL-02
 */

import { NextRequest, NextResponse } from 'next/server';
import { JournalEntryService, JournalEntryError } from './index';
import type {
  CreateJournalEntryInput,
  SubmitForApprovalInput,
  ApproveJournalEntryInput,
  RejectJournalEntryInput,
  ReverseJournalEntryInput,
  JournalEntryFilter,
  ActorContext,
} from './types';

// ============================================================================
// Dependency Injection (Replace with actual implementations)
// ============================================================================

// These would come from your DI container / service locator
function getJournalEntryService(): JournalEntryService {
  // TODO: Wire up actual implementations
  throw new Error('Not implemented - wire up dependencies');
}

function getActorFromRequest(request: NextRequest): ActorContext {
  // TODO: Extract from session/JWT
  return {
    tenantId: 'tenant-uuid',
    userId: 'user-uuid',
    permissions: [],
  };
}

// ============================================================================
// POST /api/gl/journal-entries (Create)
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const service = getJournalEntryService();
    const actor = getActorFromRequest(request);
    const input: CreateJournalEntryInput = await request.json();

    const entry = await service.create(input, actor);

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

// ============================================================================
// GET /api/gl/journal-entries (List)
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const service = getJournalEntryService();
    const { searchParams } = new URL(request.url);

    const filter: JournalEntryFilter = {
      companyId: searchParams.get('companyId') || undefined,
      status: searchParams.get('status')?.split(',') as any,
      entryType: searchParams.get('entryType')?.split(',') as any,
      searchTerm: searchParams.get('q') || undefined,
      pageSize: searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : undefined,
      pageToken: searchParams.get('pageToken') || undefined,
    };

    const result = await service.list(filter);

    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}

// ============================================================================
// GET /api/gl/journal-entries/[id] (Get by ID)
// ============================================================================

export async function GET_BY_ID(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const service = getJournalEntryService();
    const { searchParams } = new URL(request.url);
    const includeLines = searchParams.get('includeLines') === 'true';

    const entry = await service.getById(params.id, includeLines);

    return NextResponse.json(entry);
  } catch (error) {
    return handleError(error);
  }
}

// ============================================================================
// POST /api/gl/journal-entries/[id]/submit (Submit for Approval)
// ============================================================================

export async function POST_SUBMIT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const service = getJournalEntryService();
    const actor = getActorFromRequest(request);
    const body = await request.json();

    const input: SubmitForApprovalInput = {
      journalEntryId: params.id,
      submissionNotes: body.submissionNotes,
    };

    const entry = await service.submit(input, actor);

    return NextResponse.json(entry);
  } catch (error) {
    return handleError(error);
  }
}

// ============================================================================
// POST /api/gl/journal-entries/[id]/approve (Approve)
// ============================================================================

export async function POST_APPROVE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const service = getJournalEntryService();
    const actor = getActorFromRequest(request);
    const body = await request.json();

    const input: ApproveJournalEntryInput = {
      journalEntryId: params.id,
      approvalNotes: body.approvalNotes,
    };

    const entry = await service.approve(input, actor);

    return NextResponse.json(entry);
  } catch (error) {
    return handleError(error);
  }
}

// ============================================================================
// POST /api/gl/journal-entries/[id]/reject (Reject)
// ============================================================================

export async function POST_REJECT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const service = getJournalEntryService();
    const actor = getActorFromRequest(request);
    const body = await request.json();

    const input: RejectJournalEntryInput = {
      journalEntryId: params.id,
      rejectionReason: body.rejectionReason,
      suggestedChanges: body.suggestedChanges,
    };

    const entry = await service.reject(input, actor);

    return NextResponse.json(entry);
  } catch (error) {
    return handleError(error);
  }
}

// ============================================================================
// POST /api/gl/journal-entries/[id]/reverse (Create Reversal)
// ============================================================================

export async function POST_REVERSE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const service = getJournalEntryService();
    const actor = getActorFromRequest(request);
    const body = await request.json();

    const input: ReverseJournalEntryInput = {
      originalJournalEntryId: params.id,
      reversalDate: new Date(body.reversalDate),
      reversalReason: body.reversalReason,
    };

    const reversalEntry = await service.reverse(input, actor);

    return NextResponse.json(reversalEntry);
  } catch (error) {
    return handleError(error);
  }
}

// ============================================================================
// Error Handler
// ============================================================================

function handleError(error: unknown): NextResponse {
  // Journal Entry Cell Errors
  if (error instanceof JournalEntryError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          metadata: error.metadata,
        },
      },
      { status: error.statusCode }
    );
  }

  // Unknown errors
  console.error('Unexpected error:', error);
  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      },
    },
    { status: 500 }
  );
}

// ============================================================================
// Idempotency Helper (Optional but Recommended)
// ============================================================================

/**
 * Idempotency key middleware (for submit/approve actions)
 * 
 * Usage:
 * const idempotencyKey = request.headers.get('Idempotency-Key');
 * if (idempotencyKey) {
 *   const cached = await getFromCache(idempotencyKey);
 *   if (cached) return NextResponse.json(cached);
 * }
 * 
 * // ... perform operation ...
 * 
 * if (idempotencyKey) {
 *   await setCache(idempotencyKey, result, 3600); // 1 hour TTL
 * }
 */
