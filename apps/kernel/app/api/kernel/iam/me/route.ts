/**
 * Me (Current User) API
 * 
 * GET /api/kernel/iam/me - Get current authenticated user context
 * 
 * Build 3.2 (JWT Authentication)
 */

import { NextResponse, type NextRequest } from "next/server";
import { getKernelContainer } from "@/src/server/container";
import { getCorrelationId, createResponseHeaders } from "@/src/server/http";
import { me } from "@aibos/kernel-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/kernel/iam/me
 */
export async function GET(req: NextRequest) {
  const correlationId = getCorrelationId(req);
  const headers = createResponseHeaders(correlationId);

  try {
    // Extract JWT from Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Missing or invalid Authorization header",
          },
          correlation_id: correlationId,
        },
        { status: 401, headers }
      );
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    const c = getKernelContainer();
    const result = await me(
      {
        users: c.userRepo,
        tokenSigner: c.tokenSigner,
        sessions: c.sessionRepo,
        roles: c.roleRepo,
        clock: c.clock,
      },
      { token }
    );

    return NextResponse.json(
      { ok: true, data: result, correlation_id: correlationId },
      { status: 200, headers }
    );
  } catch (e: any) {
    const msg = e?.message || "INTERNAL_ERROR";
    const code =
      msg === "INVALID_TOKEN" || msg === "SESSION_INVALID" || msg === "USER_NOT_FOUND"
        ? "UNAUTHORIZED"
        : "INTERNAL_ERROR";
    const status = code === "UNAUTHORIZED" ? 401 : 500;
    const message = code === "UNAUTHORIZED"
      ? "Invalid or expired token"
      : "An unexpected error occurred";

    console.error("[Kernel] GET /iam/me error:", e);

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
