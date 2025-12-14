/**
 * Set Password API (Admin Endpoint)
 * 
 * POST /api/kernel/iam/users/[userId]/set-password - Set user password
 * 
 * Build 3.2 (JWT Authentication)
 * Note: This is a temporary admin endpoint for MVP. 
 * In production, this should require admin RBAC (Build 3.3).
 */

import { NextResponse, type NextRequest } from "next/server";
import { getKernelContainer } from "@/src/server/container";
import { getCorrelationId, createResponseHeaders } from "@/src/server/http";
import { IamSetPasswordSchema } from "@aibos/contracts";
import { setPassword } from "@aibos/kernel-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireTenantId(req: NextRequest): string {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) throw new Error("Missing x-tenant-id header");
  return tenantId;
}

/**
 * POST /api/kernel/iam/users/[userId]/set-password
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ userId: string }> }
) {
  const correlationId = getCorrelationId(req);
  const headers = createResponseHeaders(correlationId);

  try {
    const tenantId = requireTenantId(req);
    const { userId } = await ctx.params;

    const json = await req.json().catch(() => null);

    // Validate input (merge userId from URL with body)
    const parsed = IamSetPasswordSchema.safeParse({
      ...json,
      user_id: userId,
    });

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
    const result = await setPassword(
      {
        users: c.userRepo,
        credentials: c.credentialRepo,
        passwordHasher: c.passwordHasher,
        audit: c.audit,
        clock: c.clock,
      },
      {
        tenant_id: tenantId,
        correlation_id: correlationId,
        user_id: parsed.data.user_id,
        password: parsed.data.password,
      }
    );

    return NextResponse.json(
      { ok: true, data: result, correlation_id: correlationId },
      { status: 200, headers }
    );
  } catch (e: any) {
    const code = e?.message === "USER_NOT_FOUND" ? "USER_NOT_FOUND" : "INTERNAL_ERROR";
    const status = code === "USER_NOT_FOUND" ? 404 : 500;
    const message = code === "USER_NOT_FOUND"
      ? "User not found"
      : "An unexpected error occurred";

    console.error("[Kernel] POST /iam/users/:id/set-password error:", e);

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
