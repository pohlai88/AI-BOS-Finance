/**
 * RBAC Enforcement Helper
 * 
 * Helper for route handlers to enforce RBAC.
 * Checks permissions and writes DENY audit events if needed.
 * 
 * Build 3.3 (RBAC Enforcement)
 */

import { NextResponse, type NextRequest } from "next/server";
import { getKernelContainer } from "./container";
import { verifyJWT } from "./jwt";
import { authorize } from "@aibos/kernel-core";
import { getCorrelationId, createResponseHeaders } from "./http";

export type RBACEnforcement = {
  required_permissions: string[];
  resource?: string;
};

/**
 * Enforce RBAC on a route handler
 * 
 * Returns authenticated user context if authorized, or throws error
 */
export async function enforceRBAC(
  req: NextRequest | Request,
  enforcement: RBACEnforcement
): Promise<{ user_id: string; tenant_id: string; session_id: string; email: string }> {
  const correlationId = getCorrelationId(req);
  const c = getKernelContainer();

  // 1. Verify JWT (get authenticated user)
  const auth = await verifyJWT(req);

  // 2. Check authorization
  const decision = await authorize(
    {
      roles: c.roleRepo,
      rolePermissions: c.rolePermissionRepo,
    },
    {
      tenant_id: auth.tenant_id,
      actor_id: auth.user_id,
      required_permissions: enforcement.required_permissions,
      resource: enforcement.resource,
    }
  );

  // 3. If denied, write audit event and throw
  if (decision.decision === "DENY") {
    await c.audit.append({
      tenant_id: auth.tenant_id,
      actor_id: auth.user_id,
      action: "authz.deny",
      resource: enforcement.resource || "unknown",
      result: "DENY",
      correlation_id: correlationId,
      payload: {
        required_permissions: enforcement.required_permissions,
        missing_permissions: decision.missing || [],
      },
    });

    throw new Error("FORBIDDEN");
  }

  return auth;
}

/**
 * Create a 403 Forbidden response for RBAC denial
 */
export function createForbiddenResponse(
  correlationId: string,
  missingPermissions?: string[]
): NextResponse {
  const headers = createResponseHeaders(correlationId);
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "FORBIDDEN",
        message: "Insufficient permissions",
        ...(missingPermissions && { missing_permissions: missingPermissions }),
      },
      correlation_id: correlationId,
    },
    { status: 403, headers }
  );
}
