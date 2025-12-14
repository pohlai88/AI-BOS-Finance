/**
 * SQL Role Permission Repository
 * 
 * PostgreSQL implementation of RolePermissionRepoPort.
 * Handles role-permission mappings with multi-tenant isolation.
 */

import type { RolePermissionRepoPort } from '@aibos/kernel-core';
import type { KernelRolePermission } from '@aibos/kernel-core';
import type { Pool } from 'pg';

export class SqlRolePermissionRepo implements RolePermissionRepoPort {
  constructor(private db: Pool) {}

  async grant(rolePermission: KernelRolePermission): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO role_permissions (tenant_id, role_id, permission_code, created_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (tenant_id, role_id, permission_code) DO NOTHING`,
        [
          rolePermission.tenant_id,
          rolePermission.role_id,
          rolePermission.permission_code,
          rolePermission.created_at,
        ]
      );
    } catch (error: any) {
      // Handle foreign key violations
      if (error.code === '23503') {
        throw new Error(`Invalid tenant_id, role_id, or permission_code`);
      }
      throw error;
    }
  }

  async revoke(params: {
    tenant_id: string;
    role_id: string;
    permission_code: string;
  }): Promise<void> {
    await this.db.query(
      `DELETE FROM role_permissions
       WHERE tenant_id = $1 AND role_id = $2 AND permission_code = $3`,
      [params.tenant_id, params.role_id, params.permission_code]
    );
  }

  async listByRole(params: {
    tenant_id: string;
    role_id: string;
  }): Promise<string[]> {
    const result = await this.db.query<{ permission_code: string }>(
      `SELECT permission_code
       FROM role_permissions
       WHERE tenant_id = $1 AND role_id = $2`,
      [params.tenant_id, params.role_id]
    );

    return result.rows.map((row) => row.permission_code);
  }

  async listEffectiveByUser(params: {
    tenant_id: string;
    user_id: string;
  }): Promise<string[]> {
    // Get all permissions for all roles assigned to the user
    const result = await this.db.query<{ permission_code: string }>(
      `SELECT DISTINCT rp.permission_code
       FROM role_permissions rp
       INNER JOIN user_roles ur ON rp.tenant_id = ur.tenant_id AND rp.role_id = ur.role_id
       WHERE ur.tenant_id = $1 AND ur.user_id = $2`,
      [params.tenant_id, params.user_id]
    );

    return result.rows.map((row) => row.permission_code);
  }
}
