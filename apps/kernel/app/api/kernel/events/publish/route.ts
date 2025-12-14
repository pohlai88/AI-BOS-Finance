/**
 * Event Publish API Endpoint
 * 
 * POST /api/kernel/events/publish - Publish event to event bus
 * 
 * Phase 3: Event Bus
 * 
 * Features:
 * - Validates event envelope
 * - Enriches correlation_id if missing
 * - Enriches timestamp if missing
 * - Publishes to event bus
 * - Writes audit event
 * - Returns event_id and correlation_id
 */

import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { getCorrelationId, createResponseHeaders } from "@/src/server/http";
import { getKernelContainer } from "@/src/server/container";
import { EventPublishRequest, EventPublishResponse } from "@aibos/contracts";
import { publishEvent } from "@aibos/kernel-core";

export const runtime = "nodejs";

/**
 * POST /api/kernel/events/publish
 * Publish an event to the event bus
 */
export async function POST(req: NextRequest) {
  const correlationId = getCorrelationId(req);
  const container = getKernelContainer();

  try {
    const body = await req.json();
    const parsed = EventPublishRequest.parse(body);

    // Publish event (use-case will enrich missing fields)
    const result = await publishEvent(
      { eventBus: container.eventBus, audit: container.audit },
      {
        event_name: parsed.event_name,
        source: parsed.source,
        tenant_id: parsed.tenant_id,
        actor_id: parsed.actor_id,
        correlation_id: parsed.correlation_id ?? correlationId,
        timestamp: parsed.timestamp,
        payload: parsed.payload,
      }
    );

    // Build response
    const response = EventPublishResponse.parse({
      ok: true,
      event_id: result.event_id,
      correlation_id: result.correlation_id,
      timestamp: result.timestamp,
    });

    return NextResponse.json(response, {
      status: 201,
      headers: createResponseHeaders(correlationId),
    });
  } catch (error) {
    // Handle validation errors
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
        {
          status: 400,
          headers: createResponseHeaders(correlationId),
        }
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
      {
        status: 500,
        headers: createResponseHeaders(correlationId),
      }
    );
  }
}
