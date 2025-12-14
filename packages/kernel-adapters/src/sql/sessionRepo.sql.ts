/**
 * SQL Session Repository
 * 
 * PostgreSQL implementation of SessionRepoPort.
 * Handles session storage and management with multi-tenant isolation.
 */

import type { SessionRepoPort } from '@aibos/kernel-core';
import type { KernelSession } from '@aibos/kernel-core';
import type { Pool } from 'pg';

export class SqlSessionRepo implements SessionRepoPort {
  constructor(private db: Pool) {}

  async create(session: KernelSession): Promise<void> {
    await this.db.query(
      `INSERT INTO sessions (id, tenant_id, user_id, expires_at, created_at, revoked_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        session.session_id,
        session.tenant_id,
        session.user_id,
        session.expires_at,
        session.created_at,
        session.revoked_at || null,
      ]
    );
  }

  async get(params: {
    tenant_id: string;
    session_id: string;
  }): Promise<KernelSession | null> {
    const result = await this.db.query<{
      id: string;
      tenant_id: string;
      user_id: string;
      expires_at: Date;
      created_at: Date;
      revoked_at: Date | null;
    }>(
      `SELECT id, tenant_id, user_id, expires_at, created_at, revoked_at
       FROM sessions
       WHERE tenant_id = $1 AND id = $2`,
      [params.tenant_id, params.session_id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      session_id: row.id,
      tenant_id: row.tenant_id,
      user_id: row.user_id,
      expires_at: row.expires_at.toISOString(),
      created_at: row.created_at.toISOString(),
      revoked_at: row.revoked_at ? row.revoked_at.toISOString() : undefined,
    };
  }

  async revoke(params: {
    tenant_id: string;
    session_id: string;
    revoked_at: string;
  }): Promise<void> {
    await this.db.query(
      `UPDATE sessions
       SET revoked_at = $3
       WHERE tenant_id = $1 AND id = $2`,
      [params.tenant_id, params.session_id, params.revoked_at]
    );
  }

  async isValid(params: {
    tenant_id: string;
    session_id: string;
    now: string;
  }): Promise<boolean> {
    const result = await this.db.query<{
      expires_at: Date;
      revoked_at: Date | null;
    }>(
      `SELECT expires_at, revoked_at
       FROM sessions
       WHERE tenant_id = $1 AND id = $2`,
      [params.tenant_id, params.session_id]
    );

    if (result.rows.length === 0) {
      return false;
    }

    const row = result.rows[0];

    // Check if revoked
    if (row.revoked_at) {
      return false;
    }

    // Check if expired
    const nowTime = new Date(params.now).getTime();
    const expiresTime = row.expires_at.getTime();

    return nowTime < expiresTime;
  }
}
