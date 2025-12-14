/**
 * SQL Role Repository
 * 
 * PostgreSQL implementation of RoleRepoPort.
 * Handles role persistence and role assignments with multi-tenant isolation.
 */

import type { RoleRepoPort } from '@aibos/kernel-core';
import type { KernelRole, KernelUserRole } from '@aibos/kernel-core';
import type { Pool } from 'pg';

export class SqlRoleRepo implements RoleRepoPort {
  constructor(private db: Pool) {}

  async create(role: KernelRole): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO roles (id, tenant_id, name, created_at)
         VALUES ($1, $2, $3, $4)`,
        [role.role_id, role.tenant_id, role.name, role.created_at]
      );
    } catch (error: any) {
      // Handle unique constraint violation (duplicate role name)
      if (error.code === '23505') {
        throw new Error(`Role with name ${role.name} already exists in tenant ${role.tenant_id}`);
      }
      throw error;
    }
  }

  async findByName(input: {
    tenant_id: string;
    name: string;
  }): Promise<KernelRole | null> {
    const result = await this.db.query<{
      id: string;
      tenant_id: string;
      name: string;
      created_at: Date;
    }>(
      `SELECT id, tenant_id, name, created_at
       FROM roles
       WHERE tenant_id = $1 AND name = $2`,
      [input.tenant_id, input.name]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      role_id: row.id,
      tenant_id: row.tenant_id,
      name: row.name,
      created_at: row.created_at.toISOString(),
    };
  }

  async findById(input: {
    tenant_id: string;
    role_id: string;
  }): Promise<KernelRole | null> {
    const result = await this.db.query<{
      id: string;
      tenant_id: string;
      name: string;
      created_at: Date;
    }>(
      `SELECT id, tenant_id, name, created_at
       FROM roles
       WHERE tenant_id = $1 AND id = $2`,
      [input.tenant_id, input.role_id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      role_id: row.id,
      tenant_id: row.tenant_id,
      name: row.name,
      created_at: row.created_at.toISOString(),
    };
  }

  async list(input: {
    tenant_id: string;
    limit: number;
    offset: number;
  }): Promise<{ items: KernelRole[]; total: number }> {
    // Get total count
    const countResult = await this.db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM roles WHERE tenant_id = $1`,
      [input.tenant_id]
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated results
    const result = await this.db.query<{
      id: string;
      tenant_id: string;
      name: string;
      created_at: Date;
    }>(
      `SELECT id, tenant_id, name, created_at
       FROM roles
       WHERE tenant_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [input.tenant_id, input.limit, input.offset]
    );

    const items = result.rows.map((row) => ({
      role_id: row.id,
      tenant_id: row.tenant_id,
      name: row.name,
      created_at: row.created_at.toISOString(),
    }));

    return { items, total };
  }

  async assign(input: KernelUserRole): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO user_roles (tenant_id, user_id, role_id, created_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (tenant_id, user_id, role_id) DO NOTHING`,
        [input.tenant_id, input.user_id, input.role_id, input.created_at]
      );
    } catch (error: any) {
      // Handle foreign key violations
      if (error.code === '23503') {
        throw new Error(`Invalid tenant_id, user_id, or role_id for role assignment`);
      }
      throw error;
    }
  }

  async listUserRoles(input: {
    tenant_id: string;
    user_id: string;
  }): Promise<KernelRole[]> {
    const result = await this.db.query<{
      id: string;
      tenant_id: string;
      name: string;
      created_at: Date;
    }>(
      `SELECT r.id, r.tenant_id, r.name, r.created_at
       FROM roles r
       INNER JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.tenant_id = $1 AND ur.user_id = $2`,
      [input.tenant_id, input.user_id]
    );

    return result.rows.map((row) => ({
      role_id: row.id,
      tenant_id: row.tenant_id,
      name: row.name,
      created_at: row.created_at.toISOString(),
    }));
  }
}
