/**
 * Grant Permission Use-Case
 * 
 * Application logic for granting permissions to roles.
 * Validates role and permission exist before granting.
 * 
 * Anti-Gravity:
 * - No framework imports
 * - No adapter imports
 * - Dependencies injected via `deps` parameter
 */

import type { RoleRepoPort } from "../ports/roleRepoPort";
import type { PermissionRepoPort } from "../ports/permissionRepoPort";
import type { RolePermissionRepoPort } from "../ports/rolePermissionRepoPort";
import type { AuditPort } from "../ports/auditPort";
import type { KernelRolePermission } from "../domain/permission";

export type GrantPermissionDeps = {
  roles: RoleRepoPort;
  permissions: PermissionRepoPort;
  rolePermissions: RolePermissionRepoPort;
  audit: AuditPort;
  clock: { nowISO: () => string };
};

export type GrantPermissionInput = {
  tenant_id: string;
  actor_id?: string;
  correlation_id?: string;
  role_id: string;
  permission_code: string;
};

export async function grantPermission(
  deps: GrantPermissionDeps,
  input: GrantPermissionInput
): Promise<{ ok: true }> {
  // 1. Validate role exists
  const role = await deps.roles.findById({
    tenant_id: input.tenant_id,
    role_id: input.role_id,
  });

  if (!role) {
    await deps.audit.append({
      tenant_id: input.tenant_id,
      actor_id: input.actor_id,
      action: "kernel.iam.permission.grant",
      resource: `role:${input.role_id}`,
      result: "FAIL",
      correlation_id: input.correlation_id || "none",
      payload: { reason: "ROLE_NOT_FOUND", permission_code: input.permission_code },
    });
    throw new Error("ROLE_NOT_FOUND");
  }

  // 2. Validate permission exists
  const permission = await deps.permissions.getByCode(input.permission_code);

  if (!permission) {
    await deps.audit.append({
      tenant_id: input.tenant_id,
      actor_id: input.actor_id,
      action: "kernel.iam.permission.grant",
      resource: `role:${input.role_id}`,
      result: "FAIL",
      correlation_id: input.correlation_id || "none",
      payload: { reason: "PERMISSION_NOT_FOUND", permission_code: input.permission_code },
    });
    throw new Error("PERMISSION_NOT_FOUND");
  }

  // 3. Grant permission
  const rolePermission: KernelRolePermission = {
    tenant_id: input.tenant_id,
    role_id: input.role_id,
    permission_code: input.permission_code,
    created_at: deps.clock.nowISO(),
  };

  await deps.rolePermissions.grant(rolePermission);

  // 4. Append audit event
  await deps.audit.append({
    tenant_id: input.tenant_id,
    actor_id: input.actor_id,
    action: "kernel.iam.permission.grant",
    resource: `role:${input.role_id}`,
    result: "OK",
    correlation_id: input.correlation_id || "none",
    payload: {
      role_id: input.role_id,
      permission_code: input.permission_code,
    },
  });

  return { ok: true };
}
