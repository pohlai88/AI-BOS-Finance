/**
 * Role Assignment API
 * 
 * POST /api/kernel/iam/roles/[roleId]/assign - Assign role to user
 * 
 * Build 3.1 (IAM Foundation)
 */

import { NextResponse, type NextRequest } from "next/server";
import { getKernelContainer } from "@/src/server/container";
import { getCorrelationId, createResponseHeaders } from "@/src/server/http";
import { IamRoleAssignSchema } from "@aibos/contracts";
import { assignRole } from "@aibos/kernel-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireTenantId(req: NextRequest): string {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) throw new Error("Missing x-tenant-id header");
  return tenantId;
}

/**
 * POST /api/kernel/iam/roles/[roleId]/assign
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ roleId: string }> }
) {
  const correlationId = getCorrelationId(req);
  const headers = createResponseHeaders(correlationId);

  try {
    const tenantId = requireTenantId(req);
    const { roleId } = await ctx.params;

    const json = await req.json().catch(() => null);
    const parsed = IamRoleAssignSchema.safeParse(json);

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
    await assignRole(
      {
        users: c.userRepo,
        roles: c.roleRepo,
        audit: c.audit,
        clock: c.clock,
      },
      {
        tenant_id: tenantId,
        correlation_id: correlationId,
        user_id: parsed.data.user_id,
        role_id: roleId,
      }
    );

    return NextResponse.json(
      { ok: true, data: { ok: true }, correlation_id: correlationId },
      { status: 200, headers }
    );
  } catch (e: any) {
    const msg = e?.message ?? "INTERNAL_ERROR";
    const code =
      msg === "USER_NOT_FOUND" || msg === "ROLE_NOT_FOUND"
        ? msg
        : "INTERNAL_ERROR";
    const status = code === "INTERNAL_ERROR" ? 500 : 404;

    console.error("[Kernel] POST /iam/roles/:roleId/assign error:", e);

    return NextResponse.json(
      {
        ok: false,
        error: { code, message: msg },
        correlation_id: correlationId,
      },
      { status, headers }
    );
  }
}
