/**
 * List Roles Use-Case
 * 
 * Application logic for listing roles in a tenant.
 * 
 * Anti-Gravity:
 * - No framework imports
 * - No adapter imports
 * - Dependencies injected via `deps` parameter
 */

import type { RoleRepoPort } from "../ports/roleRepoPort";

export type ListRolesDeps = {
  roles: RoleRepoPort
};

export async function listRoles(
  deps: ListRolesDeps,
  input: { tenant_id: string; limit: number; offset: number }
) {
  return deps.roles.list(input);
}
