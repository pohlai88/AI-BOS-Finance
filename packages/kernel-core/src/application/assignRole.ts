/**
 * Assign Role Use-Case
 * 
 * Application logic for assigning a role to a user.
 * Validates user and role existence before assignment.
 * 
 * Anti-Gravity:
 * - No framework imports
 * - No adapter imports
 * - Dependencies injected via `deps` parameter
 */

import type { RoleRepoPort } from "../ports/roleRepoPort";
import type { UserRepoPort } from "../ports/userRepoPort";
import type { AuditPort } from "../ports/auditPort";

export type AssignRoleDeps = {
  users: UserRepoPort;
  roles: RoleRepoPort;
  audit: AuditPort;
  clock: { nowISO: () => string };
};

export async function assignRole(
  deps: AssignRoleDeps,
  input: {
    tenant_id: string;
    actor_id?: string;
    correlation_id?: string;
    user_id: string;
    role_id: string
  }
) {
  // 1. Validate user exists
  const user = await deps.users.findById({
    tenant_id: input.tenant_id,
    user_id: input.user_id
  });

  if (!user) {
    await deps.audit.append({
      tenant_id: input.tenant_id,
      actor_id: input.actor_id,
      action: "kernel.iam.role.assign",
      resource: `user:${input.user_id}`,
      result: "FAIL",
      correlation_id: input.correlation_id || "none",
      payload: { reason: "USER_NOT_FOUND" },
    });
    throw new Error("USER_NOT_FOUND");
  }

  // 2. Validate role exists
  const role = await deps.roles.findById({
    tenant_id: input.tenant_id,
    role_id: input.role_id
  });

  if (!role) {
    await deps.audit.append({
      tenant_id: input.tenant_id,
      actor_id: input.actor_id,
      action: "kernel.iam.role.assign",
      resource: `user:${input.user_id}`,
      result: "FAIL",
      correlation_id: input.correlation_id || "none",
      payload: { reason: "ROLE_NOT_FOUND" },
    });
    throw new Error("ROLE_NOT_FOUND");
  }

  // 3. Assign role
  await deps.roles.assign({
    tenant_id: input.tenant_id,
    user_id: input.user_id,
    role_id: input.role_id,
    created_at: deps.clock.nowISO(),
  });

  // 4. Append audit event
  await deps.audit.append({
    tenant_id: input.tenant_id,
    actor_id: input.actor_id,
    action: "kernel.iam.role.assign",
    resource: `user:${input.user_id}`,
    result: "OK",
    correlation_id: input.correlation_id || "none",
    payload: {
      user_id: input.user_id,
      role_id: input.role_id
    },
  });

  return { ok: true };
}
