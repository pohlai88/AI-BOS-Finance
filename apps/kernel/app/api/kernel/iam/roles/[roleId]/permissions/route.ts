/**
 * Role Permission Management API
 * 
 * POST /api/kernel/iam/roles/[roleId]/permissions - Grant permission to role
 * 
 * Build 3.3 (RBAC Enforcement)
 */

import { NextResponse, type NextRequest } from "next/server";
import { getKernelContainer } from "@/src/server/container";
import { getCorrelationId, createResponseHeaders } from "@/src/server/http";
import { enforceRBAC, createForbiddenResponse } from "@/src/server/rbac";
import { grantPermission } from "@aibos/kernel-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/kernel/iam/roles/[roleId]/permissions
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ roleId: string }> }
) {
  const correlationId = getCorrelationId(req);
  const headers = createResponseHeaders(correlationId);

  try {
    // Enforce RBAC (Build 3.3) - Note: This endpoint itself needs admin permission
    // For MVP, we'll allow if user has kernel.iam.role.create (admin function)
    const auth = await enforceRBAC(req, {
      required_permissions: ["kernel.iam.role.create"], // Admin permission
      resource: `role:${(await ctx.params).roleId}/permissions`,
    });

    const tenantId = auth.tenant_id;
    const { roleId } = await ctx.params;

    const json = await req.json().catch(() => null);

    if (!json || typeof json.permission_code !== "string") {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body - permission_code required",
          },
          correlation_id: correlationId,
        },
        { status: 400, headers }
      );
    }

    const c = getKernelContainer();
    const result = await grantPermission(
      {
        roles: c.roleRepo,
        permissions: c.permissionRepo,
        rolePermissions: c.rolePermissionRepo,
        audit: c.audit,
        clock: c.clock,
      },
      {
        tenant_id: tenantId,
        actor_id: auth.user_id,
        correlation_id: correlationId,
        role_id: roleId,
        permission_code: json.permission_code,
      }
    );

    return NextResponse.json(
      { ok: true, data: result, correlation_id: correlationId },
      { status: 200, headers }
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

    const code = msg === "ROLE_NOT_FOUND" || msg === "PERMISSION_NOT_FOUND"
      ? e.message
      : "INTERNAL_ERROR";
    const status = code === "INTERNAL_ERROR" ? 500 : 404;
    const message = code === "ROLE_NOT_FOUND"
      ? "Role not found"
      : code === "PERMISSION_NOT_FOUND"
        ? "Permission not found"
        : "An unexpected error occurred";

    console.error("[Kernel] POST /iam/roles/:roleId/permissions error:", e);

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
