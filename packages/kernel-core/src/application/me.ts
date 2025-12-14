/**
 * Me (Get Current User) Use-Case
 * 
 * Application logic for retrieving current authenticated user context.
 * Verifies JWT and validates session is not revoked.
 * 
 * Anti-Gravity:
 * - No framework imports
 * - No adapter imports
 * - Dependencies injected via `deps` parameter
 */

import type { UserRepoPort } from "../ports/userRepoPort";
import type { TokenSignerPort } from "../ports/tokenSignerPort";
import type { SessionRepoPort } from "../ports/sessionRepoPort";
import type { RoleRepoPort } from "../ports/roleRepoPort";

export type MeDeps = {
  users: UserRepoPort;
  tokenSigner: TokenSignerPort;
  sessions: SessionRepoPort;
  roles: RoleRepoPort;
  clock: { nowISO: () => string };
};

export type MeInput = {
  token: string;
};

export type MeOutput = {
  tenant_id: string;
  user_id: string;
  email: string;
  name: string;
  roles: string[];
  session_id: string;
};

export async function me(
  deps: MeDeps,
  input: MeInput
): Promise<MeOutput> {
  // 1. Verify JWT
  const payload = await deps.tokenSigner.verify(input.token);

  // 2. Validate session is not revoked or expired
  const isValid = await deps.sessions.isValid({
    tenant_id: payload.tid,
    session_id: payload.sid,
    now: deps.clock.nowISO(),
  });

  if (!isValid) {
    throw new Error("SESSION_INVALID");
  }

  // 3. Get user
  const user = await deps.users.findById({
    tenant_id: payload.tid,
    user_id: payload.sub,
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  // 4. Get user roles
  const rolesResult = await deps.roles.list({
    tenant_id: payload.tid,
    limit: 100,
    offset: 0,
  });

  // Filter roles assigned to this user (simplified - in production use user_roles join)
  // For MVP, we'll return empty roles array since we don't have getRolesForUser yet
  const userRoles: string[] = [];

  return {
    tenant_id: user.tenant_id,
    user_id: user.user_id,
    email: user.email,
    name: user.name,
    roles: userRoles,
    session_id: payload.sid,
  };
}
