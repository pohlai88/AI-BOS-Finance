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
import { getCorrelationId, createResponseHeaders, requireTenantId } from "@/src/server/http";
import { enforceRBAC, createForbiddenResponse } from "@/src/server/rbac";
import { checkBootstrapGate, checkUserHasNoCredentials } from "@/src/server/bootstrap";
import { IamSetPasswordSchema } from "@aibos/contracts";
import { setPassword } from "@aibos/kernel-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    const { userId } = await ctx.params;
    const headerTenantId = req.headers.get("x-tenant-id");

    // 1. Check bootstrap gate FIRST (before JSON parsing and RBAC)
    // Pass userId to bootstrap gate to ensure it matches the first user
    const bootstrapCheck = await checkBootstrapGate(req, "set_password", { subjectUserId: userId });
    let tenantId: string;
    let auth: { user_id: string; tenant_id: string; session_id: string; email: string } | null = null;

    // Check if user has no credentials (bootstrap condition)
    const hasNoCreds = headerTenantId ? await checkUserHasNoCredentials(headerTenantId, userId) : false;

    if (bootstrapCheck.allowed && hasNoCreds) {
      // Bootstrap: Allow password setting for first user without credentials (with bootstrap key)
      // Validate UUID format (Day 2 requirement)
      try {
        tenantId = requireTenantId(req);
      } catch (e: any) {
        const errorCode = e?.message === "INVALID_TENANT_ID_FORMAT"
          ? "VALIDATION_ERROR"
          : "MISSING_TENANT_ID";
        const errorMessage = e?.message === "INVALID_TENANT_ID_FORMAT"
          ? "tenant_id must be a valid UUID format"
          : "Missing x-tenant-id header";
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: errorCode,
              message: errorMessage,
            },
            correlation_id: correlationId,
          },
          { status: 400, headers }
        );
      }
    } else {
      // Bootstrap denied or user already has credentials
      // Check if bootstrap was denied (return error instead of falling through to RBAC)
      if (!bootstrapCheck.allowed) {
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

      // User already has credentials - require RBAC
      // Enforce RBAC (Build 3.3) - require kernel.iam.credential.set_password permission
      auth = await enforceRBAC(req, {
        required_permissions: ["kernel.iam.credential.set_password"],
        resource: `user:${userId}/set-password`,
      });
      tenantId = auth.tenant_id;
    }

    // 2. Parse JSON body (only after bootstrap/RBAC check)
    const contentType = req.headers.get("content-type") || "";
    const shouldParseJson = contentType.includes("application/json");
    const json = shouldParseJson ? await req.json().catch(() => null) : null;

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
    const msg = e?.message || "INTERNAL_ERROR";

    // Handle bootstrap denial
    if (msg.includes("Bootstrap") || msg.includes("bootstrap")) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "BOOTSTRAP_DENIED",
            message: "Bootstrap access denied. User may already have credentials or bootstrap key invalid.",
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

    const code = msg === "USER_NOT_FOUND" ? "USER_NOT_FOUND" : "INTERNAL_ERROR";
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
