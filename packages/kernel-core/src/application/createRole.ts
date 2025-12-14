/**
 * Create Role Use-Case
 * 
 * Application logic for role creation.
 * Validates role name uniqueness and writes audit events.
 * 
 * Anti-Gravity:
 * - No framework imports
 * - No adapter imports
 * - Dependencies injected via `deps` parameter
 */

import type { RoleRepoPort } from "../ports/roleRepoPort";
import type { AuditPort } from "../ports/auditPort";
import type { KernelRole } from "../domain/iam";

export type CreateRoleDeps = {
  roles: RoleRepoPort;
  audit: AuditPort;
  id: { uuid: () => string };
  clock: { nowISO: () => string };
};

export async function createRole(
  deps: CreateRoleDeps,
  input: {
    tenant_id: string;
    actor_id?: string;
    correlation_id?: string;
    name: string
  }
): Promise<KernelRole> {
  const name = input.name.trim();

  // 1. Validate role name uniqueness
  const existing = await deps.roles.findByName({
    tenant_id: input.tenant_id,
    name
  });

  if (existing) {
    await deps.audit.append({
      tenant_id: input.tenant_id,
      actor_id: input.actor_id,
      action: "kernel.iam.role.create",
      resource: `role:${name}`,
      result: "FAIL",
      correlation_id: input.correlation_id || "none",
      payload: { reason: "ROLE_EXISTS" },
    });
    throw new Error("ROLE_EXISTS");
  }

  // 2. Create role
  const role: KernelRole = {
    role_id: deps.id.uuid(),
    tenant_id: input.tenant_id,
    name,
    created_at: deps.clock.nowISO(),
  };

  await deps.roles.create(role);

  // 3. Append audit event
  await deps.audit.append({
    tenant_id: input.tenant_id,
    actor_id: input.actor_id,
    action: "kernel.iam.role.create",
    resource: `role:${role.role_id}`,
    result: "OK",
    correlation_id: input.correlation_id || "none",
    payload: {
      role_id: role.role_id,
      name: role.name
    },
  });

  return role;
}
