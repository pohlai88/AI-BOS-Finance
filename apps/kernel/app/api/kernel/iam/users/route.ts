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
import { verifyJWT } from "@/src/server/jwt";
import { enforceRBAC, createForbiddenResponse } from "@/src/server/rbac";
import { checkBootstrapGate } from "@/src/server/bootstrap";
import { IamUserCreateSchema, IamListQuerySchema } from "@aibos/contracts";
import { createUser, listUsers } from "@aibos/kernel-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/kernel/iam/users
 */
export async function POST(req: NextRequest) {
  const correlationId = getCorrelationId(req);
  const headers = createResponseHeaders(correlationId);

  try {
    // 1. Check bootstrap gate FIRST (before JSON parsing and RBAC)
    const bootstrapCheck = await checkBootstrapGate(req, "create_user");
    let tenantId: string;
    let auth: { user_id: string; tenant_id: string; session_id: string; email: string } | null = null;

    if (bootstrapCheck.allowed) {
      // Bootstrap: First user creation allowed with bootstrap key
      const headerTenantId = req.headers.get("x-tenant-id");
      if (!headerTenantId) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "MISSING_TENANT_ID",
              message: "Missing x-tenant-id header",
            },
            correlation_id: correlationId,
          },
          { status: 400, headers }
        );
      }
      tenantId = headerTenantId;
    } else {
      // Bootstrap denied - check if tenant is already bootstrapped
      // If tenant has users, require RBAC (even if bootstrap key was invalid/missing)
      const headerTenantId = req.headers.get("x-tenant-id");
      if (headerTenantId) {
        const c = getKernelContainer();
        const existingUsers = await c.userRepo.list({
          tenant_id: headerTenantId,
          limit: 1,
          offset: 0,
        });

        if (existingUsers.total > 0) {
          // Tenant already bootstrapped - require RBAC (ignore bootstrap key)
          auth = await enforceRBAC(req, {
            required_permissions: ["kernel.iam.user.create"],
            resource: "user/create",
          });
          tenantId = auth.tenant_id;
        } else {
          // Tenant not bootstrapped but bootstrap denied - return error
          return NextResponse.json(
            {
              ok: false,
              error: {
                code: "BOOTSTRAP_DENIED",
                message: bootstrapCheck.reason || "Bootstrap access denied",
              },
              correlation_id: correlationId,
            },
            { status: 403, headers }
          );
        }
      } else {
        // Missing tenant ID - return error
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "MISSING_TENANT_ID",
              message: "Missing x-tenant-id header",
            },
            correlation_id: correlationId,
          },
          { status: 400, headers }
        );
      }
    }

    // 2. Parse JSON body (only after bootstrap/RBAC check)
    const contentType = req.headers.get("content-type") || "";
    const shouldParseJson = contentType.includes("application/json");
    const json = shouldParseJson ? await req.json().catch(() => null) : null;
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
    const msg = e?.message || "INTERNAL_ERROR";

    // Handle bootstrap denial
    if (msg.includes("Bootstrap") || msg.includes("bootstrap")) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "BOOTSTRAP_DENIED",
            message: "Bootstrap access denied. Tenant may already be bootstrapped or bootstrap key invalid.",
          },
          correlation_id: correlationId,
        },
        { status: 403, headers }
      );
    }

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

    const code = msg === "EMAIL_EXISTS" ? "EMAIL_EXISTS" : "INTERNAL_ERROR";
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
    // Verify JWT (Build 3.2)
    const auth = await verifyJWT(req);
    const tenantId = auth.tenant_id; // Use tenant_id from JWT, not header
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
  } catch (e: any) {
    const msg = e?.message || "INTERNAL_ERROR";
    let code: string;
    let status: number;
    let message: string;

    if (msg === "INVALID_TOKEN") {
      code = "INVALID_TOKEN";
      status = 401;
      message = "Invalid or malformed token";
    } else if (msg === "UNAUTHORIZED" || msg === "SESSION_INVALID") {
      code = "UNAUTHORIZED";
      status = 401;
      message = "Missing or invalid authentication token";
    } else {
      code = "INTERNAL_ERROR";
      status = 500;
      message = "An unexpected error occurred";
    }

    console.error("[Kernel] GET /iam/users error:", e);

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
