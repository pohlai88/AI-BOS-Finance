/**
 * Tenants API Endpoint
 * 
 * POST /api/kernel/tenants - Create a new tenant
 * GET /api/kernel/tenants - List all tenants
 * 
 * Every request is validated by contracts schemas.
 * Every mutation writes an audit event.
 */

import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { getCorrelationId, createResponseHeaders } from "@/src/server/http";
import { getKernelContainer } from "@/src/server/container";
import { TenantCreateRequest, TenantDTO, TenantListResponse } from "@aibos/contracts";
import { createTenant, listTenants } from "@aibos/kernel-core";

export const runtime = "nodejs";

/**
 * POST /api/kernel/tenants
 * Create a new tenant
 */
export async function POST(req: NextRequest) {
  const correlationId = getCorrelationId(req);
  const container = getKernelContainer();

  try {
    // 1. Parse and validate request body
    const body = await req.json();
    const parsed = TenantCreateRequest.parse(body);

    // 2. Execute use-case
    const tenant = await createTenant(container, {
      name: parsed.name,
      correlation_id: correlationId,
      // actor_id would come from auth session in production
    });

    // 3. Validate output against contract
    const dto = TenantDTO.parse(tenant);

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

    // Log internal errors (don't expose to client)
    console.error("[Kernel] POST /tenants error:", error);

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
 * GET /api/kernel/tenants
 * List all tenants
 */
export async function GET(req: NextRequest) {
  const correlationId = getCorrelationId(req);
  const container = getKernelContainer();

  try {
    // 1. Execute use-case
    const items = await listTenants(container);

    // 2. Validate output against contract
    const response = TenantListResponse.parse({ items });

    return NextResponse.json(response, {
      status: 200,
      headers: createResponseHeaders(correlationId),
    });
  } catch (error) {
    console.error("[Kernel] GET /tenants error:", error);

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

