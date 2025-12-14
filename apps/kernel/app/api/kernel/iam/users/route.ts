/**
 * User Management API
 * 
 * POST /api/kernel/iam/users - Create user
 * GET /api/kernel/iam/users - List users for tenant
 * 
 * Build 3.1 (IAM Foundation)
 */

import { NextResponse, type NextRequest } from "next/server";
import { getKernelContainer } from "@/src/server/container";
import { getCorrelationId, createResponseHeaders } from "@/src/server/http";
import { IamUserCreateSchema, IamListQuerySchema } from "@aibos/contracts";
import { createUser, listUsers } from "@aibos/kernel-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireTenantId(req: NextRequest): string {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) throw new Error("Missing x-tenant-id header");
  return tenantId;
}

/**
 * POST /api/kernel/iam/users
 */
export async function POST(req: NextRequest) {
  const correlationId = getCorrelationId(req);
  const headers = createResponseHeaders(correlationId);

  try {
    const tenantId = requireTenantId(req);
    const json = await req.json().catch(() => null);
    const parsed = IamUserCreateSchema.safeParse(json);

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
    const user = await createUser(
      {
        users: c.userRepo,
        audit: c.audit,
        id: c.id,
        clock: c.clock,
      },
      {
        tenant_id: tenantId,
        correlation_id: correlationId,
        email: parsed.data.email,
        name: parsed.data.name,
      }
    );

    return NextResponse.json(
      { ok: true, data: user, correlation_id: correlationId },
      { status: 201, headers }
    );
  } catch (e: any) {
    const code = e?.message === "EMAIL_EXISTS" ? "EMAIL_EXISTS" : "INTERNAL_ERROR";
    const status = code === "EMAIL_EXISTS" ? 409 : 500;
    const message = code === "EMAIL_EXISTS"
      ? "Email already exists"
      : "An unexpected error occurred";

    console.error("[Kernel] POST /iam/users error:", e);

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
 * GET /api/kernel/iam/users
 */
export async function GET(req: NextRequest) {
  const correlationId = getCorrelationId(req);
  const headers = createResponseHeaders(correlationId);

  try {
    const tenantId = requireTenantId(req);
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
    const data = await listUsers(
      { users: c.userRepo },
      { tenant_id: tenantId, ...parsed.data }
    );

    return NextResponse.json(
      { ok: true, data, correlation_id: correlationId },
      { status: 200, headers }
    );
  } catch (e) {
    console.error("[Kernel] GET /iam/users error:", e);

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
