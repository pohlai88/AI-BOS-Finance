/**
 * Logout API
 * 
 * POST /api/kernel/iam/logout - Revoke session and invalidate JWT
 * 
 * Build 3.2 (JWT Authentication)
 */

import { NextResponse, type NextRequest } from "next/server";
import { getKernelContainer } from "@/src/server/container";
import { getCorrelationId, createResponseHeaders } from "@/src/server/http";
import { logout } from "@aibos/kernel-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/kernel/iam/logout
 */
export async function POST(req: NextRequest) {
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
    const result = await logout(
      {
        tokenSigner: c.tokenSigner,
        sessions: c.sessionRepo,
        audit: c.audit,
        clock: c.clock,
      },
      {
        token,
        correlation_id: correlationId,
      }
    );

    return NextResponse.json(
      { ok: true, data: result, correlation_id: correlationId },
      { status: 200, headers }
    );
  } catch (e: any) {
    const msg = e?.message || "INTERNAL_ERROR";
    const code = msg === "INVALID_TOKEN" ? "UNAUTHORIZED" : "INTERNAL_ERROR";
    const status = code === "UNAUTHORIZED" ? 401 : 500;
    const message = code === "UNAUTHORIZED"
      ? "Invalid or expired token"
      : "An unexpected error occurred";

    console.error("[Kernel] POST /iam/logout error:", e);

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
