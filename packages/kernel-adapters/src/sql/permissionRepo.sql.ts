/**
 * SQL Permission Repository
 * 
 * PostgreSQL implementation of PermissionRepoPort.
 * Permissions are global (not tenant-scoped).
 */

import type { PermissionRepoPort } from '@aibos/kernel-core';
import type { KernelPermission } from '@aibos/kernel-core';
import type { Pool } from 'pg';

export class SqlPermissionRepo implements PermissionRepoPort {
  constructor(private db: Pool) {}

  async upsert(permission: KernelPermission): Promise<void> {
    await this.db.query(
      `INSERT INTO permissions (permission_code, description, created_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (permission_code) 
       DO UPDATE SET description = EXCLUDED.description`,
      [permission.permission_code, permission.description, permission.created_at]
    );
  }

  async getByCode(code: string): Promise<KernelPermission | null> {
    const result = await this.db.query<{
      permission_code: string;
      description: string;
      created_at: Date;
    }>(
      `SELECT permission_code, description, created_at
       FROM permissions
       WHERE permission_code = $1`,
      [code]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      permission_code: row.permission_code,
      description: row.description,
      created_at: row.created_at.toISOString(),
    };
  }

  async list(): Promise<KernelPermission[]> {
    const result = await this.db.query<{
      permission_code: string;
      description: string;
      created_at: Date;
    }>(`SELECT permission_code, description, created_at FROM permissions ORDER BY permission_code`);

    return result.rows.map((row) => ({
      permission_code: row.permission_code,
      description: row.description,
      created_at: row.created_at.toISOString(),
    }));
  }
}
