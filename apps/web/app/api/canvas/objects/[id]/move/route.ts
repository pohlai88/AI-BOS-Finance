/**
 * Canvas Object Move API
 * 
 * POST /api/canvas/objects/:id/move - Move object to zone with optimistic locking
 * 
 * PROTOTYPE: Demonstrates production-ready mutation pattern:
 * - Rate limiting (for interactive canvas operations)
 * - Optimistic locking with ETag
 * - Proper conflict handling
 * - Cache invalidation on success
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  withErrorHandler,
  withRateLimit,
  RateLimitPresets,
  requirePermission,
  APPermissions,
  apiCache,
  CachePrefix,
  VersionConflictError,
  BadRequestError,
  NotFoundError,
  type ActorContext,
} from '@/lib/api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const MoveObjectSchema = z.object({
  zoneId: z.string().uuid().nullable().optional(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
  expectedVersion: z.number().int().positive(),
  reason: z.string().max(500).optional(),
});

// Disable caching for mutations
export const dynamic = 'force-dynamic';

/**
 * POST /api/canvas/objects/:id/move
 * 
 * Production-ready pattern for mutations:
 * 1. Error handling
 * 2. Rate limiting (higher for canvas interactivity)
 * 3. Authentication + Permission
 * 4. Input validation
 * 5. Optimistic locking
 * 6. Cache invalidation
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  return withErrorHandler(
    withRateLimit(RateLimitPresets.CANVAS_REALTIME,
      requirePermission(APPermissions.CANVAS_EDIT_TEAM,
        async (request: NextRequest, actor: ActorContext) => {
          const { id } = await params;
          
          // Validate UUID format
          if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
            throw new BadRequestError('Invalid object ID format');
          }
          
          const body = await request.json();
          
          // Validate input
          const parseResult = MoveObjectSchema.safeParse(body);
          if (!parseResult.success) {
            throw new BadRequestError('Invalid request data', {
              fieldErrors: parseResult.error.flatten().fieldErrors,
            });
          }
          
          const { zoneId, positionX, positionY, expectedVersion, reason } = parseResult.data;
          
          // TODO: In production, fetch object from database
          // const object = await canvasService.getObject(id, actor.tenantId);
          // if (!object) throw new NotFoundError('Canvas object', id);
          
          // Simulate version check
          const currentVersion = 1;
          const currentZoneId = 'zone-inbox';
          
          if (expectedVersion !== currentVersion) {
            // Use typed error - handler adds proper headers
            throw new VersionConflictError(id, expectedVersion, currentVersion);
          }
          
          // TODO: In production, perform the move
          // const result = await zoneTriggerService.moveToZone({
          //   objectId: id,
          //   targetZoneId: zoneId ?? null,
          //   expectedVersion,
          //   positionX,
          //   positionY,
          //   reason,
          // }, actor);
          
          // Mock successful move
          const newVersion = currentVersion + 1;
          const result = {
            success: true,
            object: {
              id,
              zoneId,
              positionX: positionX ?? 0,
              positionY: positionY ?? 0,
              version: newVersion,
              updatedAt: new Date().toISOString(),
            },
            newVersion,
            triggerFired: zoneId !== currentZoneId,
          };
          
          // Invalidate canvas cache for this tenant
          apiCache.invalidateByTag(`canvas:${actor.tenantId}`);
          apiCache.invalidateByTag(`tenant:${actor.tenantId}`);
          
          const response = NextResponse.json(result);
          
          // Set ETag for optimistic UI
          response.headers.set('ETag', `"v${newVersion}"`);
          response.headers.set('X-New-Version', String(newVersion));
          
          return response;
        }
      )
    )
  )(request);
}
