/**
 * Role Management API
 * 
 * POST /api/kernel/iam/roles - Create role
 * GET /api/kernel/iam/roles - List roles for tenant
 * 
 * Build 3.1 (IAM Foundation)
 */

import { NextResponse, type NextRequest } from "next/server";
import { getKernelContainer } from "@/src/server/container";
import { getCorrelationId, createResponseHeaders } from "@/src/server/http";
import { verifyJWT } from "@/src/server/jwt";
import { enforceRBAC, createForbiddenResponse } from "@/src/server/rbac";
import { IamRoleCreateSchema, IamListQuerySchema } from "@aibos/contracts";
import { createRole, listRoles } from "@aibos/kernel-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/kernel/iam/roles
 */
export async function POST(req: NextRequest) {
  const correlationId = getCorrelationId(req);
  const headers = createResponseHeaders(correlationId);

  try {
    // Note: Role creation bootstrap removed - roles should be created after users exist
    // This ensures proper RBAC from the start
    // Enforce RBAC (Build 3.3) - require kernel.iam.role.create permission
    const auth = await enforceRBAC(req, {
      required_permissions: ["kernel.iam.role.create"],
      resource: "role/create",
    });
    const tenantId = auth.tenant_id;

    // Parse JSON body (only after RBAC check)
    const contentType = req.headers.get("content-type") || "";
    const shouldParseJson = contentType.includes("application/json");
    const json = shouldParseJson ? await req.json().catch(() => null) : null;
    const parsed = IamRoleCreateSchema.safeParse(json);

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

    const c = getKernelContainer();
    const role = await createRole(
      {
        roles: c.roleRepo,
        audit: c.audit,
        id: c.id,
        clock: c.clock,
      },
      {
        tenant_id: tenantId,
        correlation_id: correlationId,
        name: parsed.data.name,
      }
    );

    return NextResponse.json(
      { ok: true, data: role, correlation_id: correlationId },
      { status: 201, headers }
    );
  } catch (e: any) {
    const msg = e?.message || "INTERNAL_ERROR";

    // Handle JWT/auth errors
    if (msg === "UNAUTHORIZED" || msg === "INVALID_TOKEN" || msg === "SESSION_INVALID") {
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

    // Handle RBAC denial
    if (msg === "FORBIDDEN") {
      return createForbiddenResponse(correlationId);
    }

    const code = msg === "ROLE_EXISTS" ? "ROLE_EXISTS" : "INTERNAL_ERROR";
    const status = code === "ROLE_EXISTS" ? 409 : 500;
    const message = code === "ROLE_EXISTS"
      ? "Role already exists"
      : "An unexpected error occurred";

    console.error("[Kernel] POST /iam/roles error:", e);

    return NextResponse.json(
      {
        ok: false,
        error: { code, message },
        correlation_id: correlationId,
      },
      { status, headers }
    );
  }
}

/**
 * GET /api/kernel/iam/roles
 */
export async function GET(req: NextRequest) {
  const correlationId = getCorrelationId(req);
  const headers = createResponseHeaders(correlationId);

  try {
    // Enforce RBAC (Build 3.3) - JWT required, but list is allowed for authenticated users
    const auth = await verifyJWT(req);
    const tenantId = auth.tenant_id;
    const raw = Object.fromEntries(req.nextUrl.searchParams.entries());
    const parsed = IamListQuerySchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters",
            details: parsed.error.issues,
          },
          correlation_id: correlationId,
        },
        { status: 400, headers }
      );
    }

    const c = getKernelContainer();
    const data = await listRoles(
      { roles: c.roleRepo },
      { tenant_id: tenantId, ...parsed.data }
    );

    return NextResponse.json(
      { ok: true, data, correlation_id: correlationId },
      { status: 200, headers }
    );
  } catch (e) {
    console.error("[Kernel] GET /iam/roles error:", e);

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
