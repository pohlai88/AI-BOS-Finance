/**
 * SQL Canon Repository
 * 
 * PostgreSQL implementation of CanonRegistryPort.
 * Maps between domain Canon model and database schema.
 */

import type { CanonRegistryPort } from '@aibos/kernel-core';
import type { Canon } from '@aibos/kernel-core';
import type { Pool } from 'pg';

export class SqlCanonRepo implements CanonRegistryPort {
  constructor(private db: Pool) {}

  async register(input: Omit<Canon, 'id' | 'created_at'>): Promise<Canon> {
    // Map domain model to DB schema
    // Domain: canon_key, base_url, status, capabilities
    // DB: name, service_url, healthy
    const healthy = input.status === 'ACTIVE';
    const name = input.canon_key; // Use canon_key as name

    const result = await this.db.query<{
      id: string;
      tenant_id: string;
      name: string;
      service_url: string;
      healthy: boolean;
      created_at: Date;
    }>(
      `INSERT INTO canons (tenant_id, name, service_url, healthy)
       VALUES ($1, $2, $3, $4)
       RETURNING id, tenant_id, name, service_url, healthy, created_at`,
      [input.tenant_id, name, input.base_url, healthy]
    );

    const row = result.rows[0];
    return {
      id: row.id,
      tenant_id: row.tenant_id,
      canon_key: row.name,
      version: '1.0', // Default version (not stored in DB)
      base_url: row.service_url,
      status: row.healthy ? 'ACTIVE' : 'INACTIVE',
      capabilities: [], // Default empty (not stored in DB)
      created_at: row.created_at.toISOString(),
    };
  }

  async list(input: { tenant_id: string }): Promise<Canon[]> {
    const result = await this.db.query<{
      id: string;
      tenant_id: string;
      name: string;
      service_url: string;
      healthy: boolean;
      created_at: Date;
    }>(
      `SELECT id, tenant_id, name, service_url, healthy, created_at
       FROM canons
       WHERE tenant_id = $1
       ORDER BY created_at DESC`,
      [input.tenant_id]
    );

    return result.rows.map((row) => ({
      id: row.id,
      tenant_id: row.tenant_id,
      canon_key: row.name,
      version: '1.0',
      base_url: row.service_url,
      status: row.healthy ? 'ACTIVE' : 'INACTIVE',
      capabilities: [],
      created_at: row.created_at.toISOString(),
    }));
  }

  async getById(input: {
    tenant_id: string;
    canon_id: string;
  }): Promise<Canon | null> {
    const result = await this.db.query<{
      id: string;
      tenant_id: string;
      name: string;
      service_url: string;
      healthy: boolean;
      created_at: Date;
    }>(
      `SELECT id, tenant_id, name, service_url, healthy, created_at
       FROM canons
       WHERE tenant_id = $1 AND id = $2`,
      [input.tenant_id, input.canon_id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      tenant_id: row.tenant_id,
      canon_key: row.name,
      version: '1.0',
      base_url: row.service_url,
      status: row.healthy ? 'ACTIVE' : 'INACTIVE',
      capabilities: [],
      created_at: row.created_at.toISOString(),
    };
  }
}
