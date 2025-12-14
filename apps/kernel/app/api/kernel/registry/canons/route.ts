/**
 * Canon Registry API Endpoint
 * 
 * POST /api/kernel/registry/canons - Register a new Canon
 * GET /api/kernel/registry/canons - List all Canons for tenant
 * 
 * Every request is validated by contracts schemas.
 * Every mutation writes an audit event.
 */

import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { getCorrelationId, createResponseHeaders } from "@/src/server/http";
import { getKernelContainer } from "@/src/server/container";
import {
  CanonCreateRequest,
  CanonDTO,
  CanonListResponse,
} from "@aibos/contracts";
import { registerCanon, listCanons } from "@aibos/kernel-core";

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
 * POST /api/kernel/registry/canons
 * Register a new Canon
 */
export async function POST(req: NextRequest) {
  const correlationId = getCorrelationId(req);
  const container = getKernelContainer();

  try {
    const tenant_id = requireTenantId(req);
    const body = await req.json();
    const parsed = CanonCreateRequest.parse(body);

    const canon = await registerCanon(
      { canonRegistry: container.canonRegistry, audit: container.audit },
      {
        tenant_id,
        correlation_id: correlationId,
        canon_key: parsed.canon_key,
        version: parsed.version,
        base_url: parsed.base_url,
        status: parsed.status,
        capabilities: parsed.capabilities,
      }
    );

    const dto = CanonDTO.parse(canon);
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

    // Log internal errors (don't expose to client)
    console.error("[Kernel] POST /registry/canons error:", error);

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
 * GET /api/kernel/registry/canons
 * List all Canons for tenant
 */
export async function GET(req: NextRequest) {
  const correlationId = getCorrelationId(req);
  const container = getKernelContainer();

  try {
    const tenant_id = requireTenantId(req);
    const items = await listCanons(
      { canonRegistry: container.canonRegistry },
      tenant_id
    );
    const response = CanonListResponse.parse({ items });

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

    console.error("[Kernel] GET /registry/canons error:", error);

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

