/**
 * Canvas Pre-Flight Acknowledge API
 * 
 * POST /api/canvas/preflight/acknowledge - Acknowledge urgent items
 * 
 * Optimizations:
 * - Input validation with shared schema
 * - Hard stop validation (individual acknowledgment required)
 * - Returns updated pre-flight status
 */

import { NextRequest, NextResponse } from 'next/server';
import { AcknowledgeSchema, formatValidationError } from '../../_schemas';

// Disable caching for mutations
export const dynamic = 'force-dynamic';

// Mock hard stop IDs (in production: query from DB)
const HARD_STOP_IDS = new Set(['550e8400-e29b-41d4-a716-446655440010']);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const parseResult = AcknowledgeSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        formatValidationError(parseResult.error),
        { status: 400 }
      );
    }
    
    const { objectIds, comment, isBatchAcknowledgment } = parseResult.data;
    
    // Check for hard stops in batch acknowledgment
    if (isBatchAcknowledgment) {
      const hardStopsInBatch = objectIds.filter(id => HARD_STOP_IDS.has(id));
      if (hardStopsInBatch.length > 0) {
        return NextResponse.json({
          success: false,
          error: 'HARD_STOP_REQUIRES_INDIVIDUAL',
          message: 'High-priority items must be acknowledged individually',
          hardStopIds: hardStopsInBatch,
        }, { status: 400 });
      }
    }
    
    // Mock acknowledgment creation
    const acknowledgments = objectIds.map((objectId: string) => ({
      id: crypto.randomUUID(),
      objectId,
      userId: 'current-user', // From session in production
      acknowledgedAt: new Date().toISOString(),
      comment: comment || null,
    }));
    
    // Calculate remaining pre-flight status
    const remainingHardStops = [...HARD_STOP_IDS].filter(
      id => !objectIds.includes(id)
    );
    
    return NextResponse.json({
      success: true,
      acknowledged: acknowledgments.length,
      acknowledgments,
      updatedPreFlightStatus: {
        requiresAcknowledgment: remainingHardStops.length > 0,
        remainingHardStops: remainingHardStops.length,
        canProceed: remainingHardStops.length === 0,
      },
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'INVALID_JSON', message: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    console.error('Failed to acknowledge items:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to acknowledge items' },
      { status: 500 }
    );
  }
}
