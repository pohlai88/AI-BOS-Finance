/**
 * Audit Query API Endpoint
 * 
 * GET /api/kernel/audit/events - Query audit events
 * 
 * Phase 4: Audit Query
 * 
 * Features:
 * - Filters by tenant_id (from header)
 * - Filters by correlation_id, actor_id, action, resource, result
 * - Time range filtering (start_time, end_time)
 * - Pagination (limit, offset)
 * - Returns total count for pagination UI
 */

import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { getCorrelationId, createResponseHeaders } from "@/src/server/http";
import { getKernelContainer } from "@/src/server/container";
import { enforceRBAC, createForbiddenResponse } from "@/src/server/rbac";
import { AuditQueryFilters, AuditQueryResponse } from "@aibos/contracts";
import { queryAudit } from "@aibos/kernel-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/kernel/audit/events
 * Query audit events with filters and pagination
 */
export async function GET(req: NextRequest) {
  const correlationId = getCorrelationId(req);
  const container = getKernelContainer();

  try {
    // Get tenant_id from header (required for multi-tenant isolation)
    const tenantId = req.headers.get("x-tenant-id");
    if (!tenantId) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "MISSING_TENANT_ID",
            message: "Missing x-tenant-id header",
          },
          correlation_id: correlationId,
        },
        {
          status: 400,
          headers: createResponseHeaders(correlationId),
        }
      );
    }

    // Parse query parameters
    const queryParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const parsed = AuditQueryFilters.parse(queryParams);

    // Query audit events
    const result = await queryAudit(
      { audit: container.audit },
      {
        tenant_id: tenantId,
        correlation_id: parsed.correlation_id,
        actor_id: parsed.actor_id,
        action: parsed.action,
        resource: parsed.resource,
        result: parsed.result,
        start_time: parsed.start_time,
        end_time: parsed.end_time,
        limit: parsed.limit,
        offset: parsed.offset,
      }
    );

    // Build response
    const response = AuditQueryResponse.parse({
      ok: true,
      data: {
        events: result.events,
        total: result.total,
        limit: parsed.limit,
        offset: parsed.offset,
      },
      correlation_id: correlationId,
    });

    return NextResponse.json(response, {
      status: 200,
      headers: createResponseHeaders(correlationId),
    });
  } catch (error: any) {
    // Handle RBAC denial
    if (error?.message === "FORBIDDEN") {
      return createForbiddenResponse(correlationId);
    }

    // Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters",
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
    console.error("[Kernel] GET /audit/events error:", error);

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
