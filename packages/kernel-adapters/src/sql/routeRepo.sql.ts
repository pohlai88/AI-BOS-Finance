/**
 * SQL Route Repository
 * 
 * PostgreSQL implementation of RouteRegistryPort.
 * Maps between domain RouteMapping model and database schema.
 */

import type { RouteRegistryPort } from '@aibos/kernel-core';
import type { RouteMapping } from '@aibos/kernel-core';
import type { Pool } from 'pg';

export class SqlRouteRepo implements RouteRegistryPort {
  constructor(private db: Pool) {}

  async create(
    input: Omit<RouteMapping, 'id' | 'created_at'>
  ): Promise<RouteMapping> {
    // Map domain model to DB schema
    // Domain: route_prefix, canon_id, required_permissions
    // DB: path, method, canon_id, required_permissions
    // Note: DB has method field, domain doesn't - we'll use '*' as default
    const method = '*'; // Default method (not in domain model)

    const result = await this.db.query<{
      id: string;
      tenant_id: string;
      canon_id: string;
      method: string;
      path: string;
      required_permissions: string[] | null;
      created_at: Date;
    }>(
      `INSERT INTO routes (tenant_id, canon_id, method, path, required_permissions)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, tenant_id, canon_id, method, path, required_permissions, created_at`,
      [
        input.tenant_id,
        input.canon_id,
        method,
        input.route_prefix,
        input.required_permissions || [],
      ]
    );

    const row = result.rows[0];
    return {
      id: row.id,
      tenant_id: row.tenant_id,
      route_prefix: row.path,
      canon_id: row.canon_id,
      required_permissions: row.required_permissions || [],
      created_at: row.created_at.toISOString(),
    };
  }

  async list(input: { tenant_id: string }): Promise<RouteMapping[]> {
    const result = await this.db.query<{
      id: string;
      tenant_id: string;
      canon_id: string;
      method: string;
      path: string;
      required_permissions: string[] | null;
      active: boolean;
      created_at: Date;
    }>(
      `SELECT id, tenant_id, canon_id, method, path, required_permissions, active, created_at
       FROM routes
       WHERE tenant_id = $1 AND active = true
       ORDER BY created_at DESC`,
      [input.tenant_id]
    );

    return result.rows.map((row) => ({
      id: row.id,
      tenant_id: row.tenant_id,
      route_prefix: row.path,
      canon_id: row.canon_id,
      required_permissions: row.required_permissions || [],
      created_at: row.created_at.toISOString(),
    }));
  }
}
