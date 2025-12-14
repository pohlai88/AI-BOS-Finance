/**
 * List Users Use-Case
 * 
 * Application logic for listing users in a tenant.
 * 
 * Anti-Gravity:
 * - No framework imports
 * - No adapter imports
 * - Dependencies injected via `deps` parameter
 */

import type { UserRepoPort } from "../ports/userRepoPort";

export type ListUsersDeps = {
  users: UserRepoPort
};

export async function listUsers(
  deps: ListUsersDeps,
  input: { tenant_id: string; limit: number; offset: number }
) {
  return deps.users.list(input);
}
