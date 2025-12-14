/**
 * Route Registry API Endpoint
 * 
 * POST /api/kernel/registry/routes - Create a route mapping
 * GET /api/kernel/registry/routes - List all route mappings for tenant
 * 
 * Every request is validated by contracts schemas.
 * Every mutation writes an audit event.
 */

import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { getCorrelationId, createResponseHeaders } from "@/src/server/http";
import { getKernelContainer } from "@/src/server/container";
import {
  RouteCreateRequest,
  RouteDTO,
  RouteListResponse,
} from "@aibos/contracts";
import { createRoute, listRoutes } from "@aibos/kernel-core";

export const runtime = "nodejs";

/**
 * Extract tenant_id from request header
 * 
 * TODO: In Build 3, derive from JWT token instead of header
 */
function requireTenantId(req: NextRequest): string {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) {
    throw new Error("Missing x-tenant-id header");
  }
  return tenantId;
}

/**
 * POST /api/kernel/registry/routes
 * Create a route mapping
 */
export async function POST(req: NextRequest) {
  const correlationId = getCorrelationId(req);
  const container = getKernelContainer();

  try {
    const tenant_id = requireTenantId(req);
    const body = await req.json();
    const parsed = RouteCreateRequest.parse(body);

    const route = await createRoute(
      {
        routes: container.routes,
        canonRegistry: container.canonRegistry,
        audit: container.audit,
      },
      {
        tenant_id,
        correlation_id: correlationId,
        route_prefix: parsed.route_prefix,
        canon_id: parsed.canon_id,
      }
    );

    const dto = RouteDTO.parse(route);
    return NextResponse.json(dto, {
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

    // Handle missing tenant ID
    if (error instanceof Error && error.message.includes("x-tenant-id")) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "MISSING_TENANT_ID",
            message: error.message,
          },
          correlation_id: correlationId,
        },
        {
          status: 400,
          headers: createResponseHeaders(correlationId),
        }
      );
    }

    // Handle Canon not found
    if (error instanceof Error && error.message.includes("Canon not found")) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "CANON_NOT_FOUND",
            message: error.message,
          },
          correlation_id: correlationId,
        },
        {
          status: 404,
          headers: createResponseHeaders(correlationId),
        }
      );
    }

    // Log internal errors (don't expose to client)
    console.error("[Kernel] POST /registry/routes error:", error);

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

/**
 * GET /api/kernel/registry/routes
 * List all route mappings for tenant
 */
export async function GET(req: NextRequest) {
  const correlationId = getCorrelationId(req);
  const container = getKernelContainer();

  try {
    const tenant_id = requireTenantId(req);
    const items = await listRoutes({ routes: container.routes }, tenant_id);
    const response = RouteListResponse.parse({ items });

    return NextResponse.json(response, {
      status: 200,
      headers: createResponseHeaders(correlationId),
    });
  } catch (error) {
    // Handle missing tenant ID
    if (error instanceof Error && error.message.includes("x-tenant-id")) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "MISSING_TENANT_ID",
            message: error.message,
          },
          correlation_id: correlationId,
        },
        {
          status: 400,
          headers: createResponseHeaders(correlationId),
        }
      );
    }

    console.error("[Kernel] GET /registry/routes error:", error);

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

