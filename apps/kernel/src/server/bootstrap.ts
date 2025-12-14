/**
 * Bootstrap Gate Helper
 * 
 * Determines if a request is allowed via bootstrap path (before RBAC).
 * Bootstrap is only allowed for:
 * 1. First user creation in a tenant
 * 2. First password setting for a user
 * 3. Login (always public)
 * 
 * Requires explicit bootstrap key header to prevent accidental public access.
 * 
 * Build 3.3 (RBAC Enforcement)
 */

import type { NextRequest } from "next/server";
import { getKernelContainer } from "./container";

export type BootstrapCheckResult = {
  allowed: boolean;
  reason?: string;
};

/**
 * Check if request is allowed via bootstrap path
 * 
 * Bootstrap is allowed only if:
 * 1. Endpoint is in bootstrap allowlist
 * 2. Tenant state matches endpoint requirements:
 *    - create_user: tenant has 0 users
 *    - set_password: tenant has exactly 1 user (and userId matches)
 * 3. Bootstrap key header matches environment variable
 */
export async function checkBootstrapGate(
  req: NextRequest,
  endpoint: "create_user" | "set_password" | "login",
  opts?: { subjectUserId?: string }
): Promise<BootstrapCheckResult> {
  // Login is always public (no bootstrap check needed)
  if (endpoint === "login") {
    return { allowed: true };
  }

  // Get bootstrap key from environment
  const expectedBootstrapKey = process.env.KERNEL_BOOTSTRAP_KEY;
  if (!expectedBootstrapKey) {
    return { allowed: false, reason: "Bootstrap key not configured" };
  }

  // Check bootstrap key header
  const providedKey = req.headers.get("x-kernel-bootstrap-key");
  if (providedKey !== expectedBootstrapKey) {
    return { allowed: false, reason: "Invalid bootstrap key" };
  }

  // Require explicit tenant id (avoid accidental "system" bootstraps)
  // Validate UUID format (Day 2 requirement)
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) {
    return { allowed: false, reason: "Missing x-tenant-id" };
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(tenantId)) {
    return { allowed: false, reason: "tenant_id must be a valid UUID format" };
  }

  const container = getKernelContainer();

  try {
    const existingUsers = await container.userRepo.list({
      tenant_id: tenantId,
      limit: 2,
      offset: 0,
    });

    // create_user only allowed when tenant has zero users
    if (endpoint === "create_user") {
      if (existingUsers.total > 0) {
        return { allowed: false, reason: "Tenant already bootstrapped" };
      }
      return { allowed: true };
    }

    // set_password only allowed for the first user during bootstrap
    if (endpoint === "set_password") {
      if (existingUsers.total === 0) {
        return { allowed: false, reason: "No users to set password for" };
      }
      if (existingUsers.total > 1) {
        return { allowed: false, reason: "Tenant already bootstrapped" };
      }
      const onlyUser = existingUsers.items?.[0];
      if (opts?.subjectUserId && onlyUser?.user_id && opts.subjectUserId !== onlyUser.user_id) {
        return { allowed: false, reason: "set_password allowed only for bootstrap admin user" };
      }
      return { allowed: true };
    }

    return { allowed: false, reason: "Invalid bootstrap endpoint" };
  } catch (err) {
    // If check fails, deny bootstrap (fail closed)
    return { allowed: false, reason: `Bootstrap check failed: ${err instanceof Error ? err.message : String(err)}` };
  }
}

/**
 * Check if user has no credentials (for password setting bootstrap)
 */
export async function checkUserHasNoCredentials(
  tenantId: string,
  userId: string
): Promise<boolean> {
  const container = getKernelContainer();

  try {
    const creds = await container.credentialRepo.getByUserId({
      tenant_id: tenantId,
      user_id: userId,
    }).catch(() => null);

    return creds === null;
  } catch {
    return false; // Fail closed
  }
}
