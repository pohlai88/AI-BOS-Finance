/**
 * In-Memory Role Permission Repository
 * 
 * Implementation for development and testing.
 * Stores role-permission mappings with multi-tenant isolation.
 * 
 * Production: Replace with PostgreSQL adapter.
 */

import type { RolePermissionRepoPort } from '@aibos/kernel-core';
import type { KernelRolePermission } from '@aibos/kernel-core';

export class InMemoryRolePermissionRepo implements RolePermissionRepoPort {
  // Map: tenant_id:role_id:permission_code -> rolePermission
  private rolePermissions: Map<string, KernelRolePermission> = new Map();

  private getKey(tenantId: string, roleId: string, permissionCode: string): string {
    return `${tenantId}:${roleId}:${permissionCode}`;
  }

  async grant(rolePermission: KernelRolePermission): Promise<void> {
    const key = this.getKey(
      rolePermission.tenant_id,
      rolePermission.role_id,
      rolePermission.permission_code
    );
    this.rolePermissions.set(key, rolePermission);
  }

  async revoke(params: {
    tenant_id: string;
    role_id: string;
    permission_code: string;
  }): Promise<void> {
    const key = this.getKey(params.tenant_id, params.role_id, params.permission_code);
    this.rolePermissions.delete(key);
  }

  async listByRole(params: {
    tenant_id: string;
    role_id: string;
  }): Promise<string[]> {
    const prefix = `${params.tenant_id}:${params.role_id}:`;
    const permissions: string[] = [];

    for (const [key, rp] of this.rolePermissions.entries()) {
      if (key.startsWith(prefix)) {
        permissions.push(rp.permission_code);
      }
    }

    return permissions;
  }

  async listEffectiveByUser(params: {
    tenant_id: string;
    user_id: string;
  }): Promise<string[]> {
    // This requires access to RoleRepo to get user's roles
    // For now, we'll throw an error - the use-case will handle this
    // by calling RoleRepo.listUserRoles first, then this.listByRole for each role
    throw new Error('Use authorize use-case instead - it handles user role lookup');
  }
}
