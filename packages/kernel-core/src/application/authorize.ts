/**
 * Authorization Use-Case
 * 
 * Pure policy engine for RBAC authorization decisions.
 * Returns ALLOW or DENY with missing permissions if denied.
 * 
 * Anti-Gravity:
 * - No framework imports
 * - No adapter imports
 * - Dependencies injected via `deps` parameter
 */

import type { RoleRepoPort } from "../ports/roleRepoPort";
import type { RolePermissionRepoPort } from "../ports/rolePermissionRepoPort";

export type AuthorizeDeps = {
  roles: RoleRepoPort;
  rolePermissions: RolePermissionRepoPort;
};

export type AuthorizeInput = {
  tenant_id: string;
  actor_id: string;
  required_permissions: string[];
  resource?: string; // Optional context (e.g., route path, endpoint name)
};

export type AuthorizeOutput = {
  decision: "ALLOW" | "DENY";
  missing?: string[]; // Permissions that are missing (only if DENY)
};

export async function authorize(
  deps: AuthorizeDeps,
  input: AuthorizeInput
): Promise<AuthorizeOutput> {
  // If no permissions required, allow
  if (input.required_permissions.length === 0) {
    return { decision: "ALLOW" };
  }

  // 1. Get user's roles
  const userRoles = await deps.roles.listUserRoles({
    tenant_id: input.tenant_id,
    user_id: input.actor_id,
  });

  // 2. Collect all permissions from user's roles
  const effectivePermissions = new Set<string>();

  for (const role of userRoles) {
    const rolePerms = await deps.rolePermissions.listByRole({
      tenant_id: input.tenant_id,
      role_id: role.role_id,
    });

    for (const perm of rolePerms) {
      effectivePermissions.add(perm);
    }
  }

  // 3. Check if user has all required permissions
  const missing: string[] = [];

  for (const required of input.required_permissions) {
    if (!effectivePermissions.has(required)) {
      missing.push(required);
    }
  }

  // 4. Decision
  if (missing.length === 0) {
    return { decision: "ALLOW" };
  } else {
    return { decision: "DENY", missing };
  }
}
