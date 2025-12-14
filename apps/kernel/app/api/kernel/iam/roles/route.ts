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
import { IamRoleCreateSchema, IamListQuerySchema } from "@aibos/contracts";
import { createRole, listRoles } from "@aibos/kernel-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireTenantId(req: NextRequest): string {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) throw new Error("Missing x-tenant-id header");
  return tenantId;
}

/**
 * POST /api/kernel/iam/roles
 */
export async function POST(req: NextRequest) {
  const correlationId = getCorrelationId(req);
  const headers = createResponseHeaders(correlationId);

  try {
    const tenantId = requireTenantId(req);
    const json = await req.json().catch(() => null);
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
    const code = e?.message === "ROLE_EXISTS" ? "ROLE_EXISTS" : "INTERNAL_ERROR";
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
