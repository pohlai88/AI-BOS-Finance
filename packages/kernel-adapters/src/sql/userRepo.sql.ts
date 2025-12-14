/**
 * SQL User Repository
 * 
 * PostgreSQL implementation of UserRepoPort.
 * Handles user persistence with multi-tenant isolation.
 */

import type { UserRepoPort } from '@aibos/kernel-core';
import type { KernelUser } from '@aibos/kernel-core';
import type { Pool } from 'pg';

export class SqlUserRepo implements UserRepoPort {
  constructor(private db: Pool) {}

  async create(user: KernelUser): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO users (id, tenant_id, email, name, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          user.user_id,
          user.tenant_id,
          user.email,
          user.name,
          user.created_at,
          user.updated_at,
        ]
      );
    } catch (error: any) {
      // Handle unique constraint violation (duplicate email)
      if (error.code === '23505') {
        throw new Error(`User with email ${user.email} already exists in tenant ${user.tenant_id}`);
      }
      throw error;
    }
  }

  async findByEmail(input: {
    tenant_id: string;
    email: string;
  }): Promise<KernelUser | null> {
    const result = await this.db.query<{
      id: string;
      tenant_id: string;
      email: string;
      name: string | null;
      password_hash: string | null;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT id, tenant_id, email, name, password_hash, created_at, updated_at
       FROM users
       WHERE tenant_id = $1 AND email = $2`,
      [input.tenant_id, input.email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      user_id: row.id,
      tenant_id: row.tenant_id,
      email: row.email,
      name: row.name || '',
      status: 'ACTIVE' as const, // Default status
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
    };
  }

  async findById(input: {
    tenant_id: string;
    user_id: string;
  }): Promise<KernelUser | null> {
    const result = await this.db.query<{
      id: string;
      tenant_id: string;
      email: string;
      name: string | null;
      password_hash: string | null;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT id, tenant_id, email, name, password_hash, created_at, updated_at
       FROM users
       WHERE tenant_id = $1 AND id = $2`,
      [input.tenant_id, input.user_id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      user_id: row.id,
      tenant_id: row.tenant_id,
      email: row.email,
      name: row.name || '',
      status: 'ACTIVE' as const,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
    };
  }

  async list(input: {
    tenant_id: string;
    limit: number;
    offset: number;
  }): Promise<{ items: KernelUser[]; total: number }> {
    // Get total count
    const countResult = await this.db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM users WHERE tenant_id = $1`,
      [input.tenant_id]
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated results
    const result = await this.db.query<{
      id: string;
      tenant_id: string;
      email: string;
      name: string | null;
      password_hash: string | null;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT id, tenant_id, email, name, password_hash, created_at, updated_at
       FROM users
       WHERE tenant_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [input.tenant_id, input.limit, input.offset]
    );

    const items = result.rows.map((row) => ({
      user_id: row.id,
      tenant_id: row.tenant_id,
      email: row.email,
      name: row.name || '',
      status: 'ACTIVE' as const,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
    }));

    return { items, total };
  }
}
