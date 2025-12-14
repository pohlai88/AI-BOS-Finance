/**
 * Role Permission Repository Port
 * 
 * Interface for role-permission mapping storage.
 * Implementations must enforce multi-tenant isolation.
 */

import type { KernelRolePermission } from "../domain/permission";

export interface RolePermissionRepoPort {
  /**
   * Grant permission to role
   */
  grant(rolePermission: KernelRolePermission): Promise<void>;

  /**
   * Revoke permission from role
   */
  revoke(params: {
    tenant_id: string;
    role_id: string;
    permission_code: string;
  }): Promise<void>;

  /**
   * List permissions for a role
   */
  listByRole(params: {
    tenant_id: string;
    role_id: string;
  }): Promise<string[]>; // Returns permission codes

  /**
   * Get effective permissions for a user (all roles combined)
   */
  listEffectiveByUser(params: {
    tenant_id: string;
    user_id: string;
  }): Promise<string[]>; // Returns permission codes
}
