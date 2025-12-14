/**
 * Event Publish API Endpoint (HARDENED - Day 3)
 *
 * POST /api/kernel/events/publish - Publish event to event bus
 *
 * Security:
 * - JWT verification (authentication)
 * - RBAC enforcement: kernel.event.publish (authorization)
 * - tenant_id derived from JWT (prevents cross-tenant injection)
 * - actor_id derived from JWT
 * - Audit logging for DENY decisions
 *
 * Build 3.4 (Event Security)
 */

import { NextResponse, type NextRequest } from "next/server";
import { ZodError, z } from "zod";
import { getCorrelationId, createResponseHeaders } from "@/src/server/http";
import { getKernelContainer } from "@/src/server/container";
import { enforceRBAC, createForbiddenResponse } from "@/src/server/rbac";
import { EventPublishResponse } from "@aibos/contracts";
import { publishEvent } from "@aibos/kernel-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Request body schema (without tenant_id - derived from JWT)
 *
 * Note: We accept tenant_id in body for backward compatibility but
 * ALWAYS override with JWT tenant_id. If body tenant_id differs from
 * JWT, we reject with 400 (cross-tenant injection attempt).
 */
const HardenedEventPublishRequest = z.object({
  event_name: z.string().min(1).max(128),
  source: z.enum(["kernel", "canon", "molecule", "cell"]).optional().default("canon"),
  tenant_id: z.string().uuid().optional(), // Optional - JWT is authority
  actor_id: z.string().uuid().optional(), // Optional - JWT is authority
  correlation_id: z.string().uuid().optional(), // Enriched if missing
  timestamp: z.string().datetime().optional(), // Enriched if missing
  payload: z.unknown(),
});

/**
 * POST /api/kernel/events/publish
 *
 * Publishes an event to the event bus.
 *
 * Security:
 * - Requires valid JWT
 * - Requires kernel.event.publish permission
 * - tenant_id MUST come from JWT (body value is validated if present)
 */
export async function POST(req: NextRequest) {
  const correlationId = getCorrelationId(req);
  const headers = createResponseHeaders(correlationId);

  try {
    // 1. Enforce RBAC (JWT verification + permission check)
    const auth = await enforceRBAC(req, {
      required_permissions: ["kernel.event.publish"],
      resource: "kernel.event.publish",
    });

    // Auth contains: user_id, tenant_id, session_id, email
    const jwtTenantId = auth.tenant_id;
    const jwtActorId = auth.user_id;

    // 2. Parse and validate request body
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid JSON body",
          },
          correlation_id: correlationId,
        },
        { status: 400, headers }
      );
    }

    const parsed = HardenedEventPublishRequest.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body",
            details: parsed.error.issues,
          },
          correlation_id: correlationId,
        },
        { status: 400, headers }
      );
    }

    // 3. Cross-tenant injection check
    // If tenant_id is provided in body, it MUST match JWT tenant_id
    if (parsed.data.tenant_id && parsed.data.tenant_id !== jwtTenantId) {
      // Log security event
      const container = getKernelContainer();
      await container.audit.append({
        tenant_id: jwtTenantId,
        actor_id: jwtActorId,
        action: "security.cross_tenant_attempt",
        resource: "kernel.event.publish",
        result: "DENY",
        correlation_id: correlationId,
        payload: {
          jwt_tenant_id: jwtTenantId,
          body_tenant_id: parsed.data.tenant_id,
          event_name: parsed.data.event_name,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "tenant_id in body does not match authenticated tenant",
          },
          correlation_id: correlationId,
        },
        { status: 400, headers }
      );
    }

    // 4. Publish event with JWT-derived tenant_id and actor_id
    const container = getKernelContainer();
    const result = await publishEvent(
      { eventBus: container.eventBus, audit: container.audit },
      {
        event_name: parsed.data.event_name,
        source: parsed.data.source,
        tenant_id: jwtTenantId, // CRITICAL: From JWT, not body
        actor_id: jwtActorId, // CRITICAL: From JWT, not body
        correlation_id: parsed.data.correlation_id ?? correlationId,
        timestamp: parsed.data.timestamp,
        payload: parsed.data.payload,
      }
    );

    // 5. Build response
    const response = EventPublishResponse.parse({
      ok: true,
      event_id: result.event_id,
      correlation_id: result.correlation_id,
      timestamp: result.timestamp,
    });

    return NextResponse.json(response, { status: 201, headers });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "INTERNAL_ERROR";

    // Handle authentication errors
    if (
      errorMessage === "UNAUTHORIZED" ||
      errorMessage === "INVALID_TOKEN" ||
      errorMessage === "SESSION_INVALID"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Missing or invalid authentication token",
          },
          correlation_id: correlationId,
        },
        { status: 401, headers }
      );
    }

    // Handle authorization errors (RBAC denial)
    if (errorMessage === "FORBIDDEN") {
      return createForbiddenResponse(correlationId, ["kernel.event.publish"]);
    }

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body",
            details: error.issues,
          },
          correlation_id: correlationId,
        },
        { status: 400, headers }
      );
    }

    // Log internal errors (don't expose to client)
    console.error("[Kernel] POST /events/publish error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
        correlation_id: correlationId,
      },
      { status: 500, headers }
    );
  }
}
