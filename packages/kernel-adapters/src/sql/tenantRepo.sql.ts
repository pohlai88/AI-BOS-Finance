/**
 * SQL Tenant Repository
 * 
 * PostgreSQL implementation of TenantRepoPort.
 */

import type { TenantRepoPort } from '@aibos/kernel-core';
import type { Tenant } from '@aibos/kernel-core';
import type { Pool } from 'pg';

export class SqlTenantRepo implements TenantRepoPort {
  constructor(private db: Pool) {}

  async create(input: { name: string }): Promise<Tenant> {
    const result = await this.db.query<{
      id: string;
      name: string;
      created_at: Date;
    }>(
      `INSERT INTO tenants (name) VALUES ($1) RETURNING id, name, created_at`,
      [input.name]
    );

    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      status: 'ACTIVE', // Default status
      created_at: row.created_at.toISOString(),
    };
  }

  async list(): Promise<Tenant[]> {
    const result = await this.db.query<{
      id: string;
      name: string;
      created_at: Date;
    }>(`SELECT id, name, created_at FROM tenants ORDER BY created_at DESC`);

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      status: 'ACTIVE' as const, // Default status
      created_at: row.created_at.toISOString(),
    }));
  }

  async findById(id: string): Promise<Tenant | null> {
    const result = await this.db.query<{
      id: string;
      name: string;
      created_at: Date;
    }>(`SELECT id, name, created_at FROM tenants WHERE id = $1`, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      status: 'ACTIVE' as const,
      created_at: row.created_at.toISOString(),
    };
  }
}
