/**
 * Login API
 * 
 * POST /api/kernel/iam/login - Authenticate user and issue JWT
 * 
 * Build 3.2 (JWT Authentication)
 */

import { NextResponse, type NextRequest } from "next/server";
import { getKernelContainer } from "@/src/server/container";
import { getCorrelationId, createResponseHeaders } from "@/src/server/http";
import { IamLoginSchema } from "@aibos/contracts";
import { login } from "@aibos/kernel-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireTenantId(req: NextRequest): string {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) throw new Error("Missing x-tenant-id header");
  return tenantId;
}

/**
 * POST /api/kernel/iam/login
 */
export async function POST(req: NextRequest) {
  const correlationId = getCorrelationId(req);
  const headers = createResponseHeaders(correlationId);

  try {
    const tenantId = requireTenantId(req);
    const json = await req.json().catch(() => null);
    const parsed = IamLoginSchema.safeParse(json);

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
    const result = await login(
      {
        users: c.userRepo,
        credentials: c.credentialRepo,
        passwordHasher: c.passwordHasher,
        tokenSigner: c.tokenSigner,
        sessions: c.sessionRepo,
        audit: c.audit,
        id: c.id,
        clock: c.clock,
      },
      {
        tenant_id: tenantId,
        correlation_id: correlationId,
        email: parsed.data.email,
        password: parsed.data.password,
      },
      parseInt(process.env.KERNEL_JWT_TTL_SECONDS || "3600")
    );

    return NextResponse.json(
      { ok: true, data: result, correlation_id: correlationId },
      { status: 200, headers }
    );
  } catch (e: any) {
    const code = e?.message === "INVALID_CREDENTIALS" ? "INVALID_CREDENTIALS" : "INTERNAL_ERROR";
    const status = code === "INVALID_CREDENTIALS" ? 401 : 500;
    const message = code === "INVALID_CREDENTIALS"
      ? "Invalid email or password"
      : "An unexpected error occurred";

    console.error("[Kernel] POST /iam/login error:", e);

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
