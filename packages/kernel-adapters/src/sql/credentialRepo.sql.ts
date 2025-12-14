/**
 * SQL Credential Repository
 * 
 * PostgreSQL implementation of CredentialRepoPort.
 * Stores credentials in the users table's password_hash field.
 */

import type { CredentialRepoPort } from '@aibos/kernel-core';
import type { KernelCredential } from '@aibos/kernel-core';
import type { Pool } from 'pg';

export class SqlCredentialRepo implements CredentialRepoPort {
  constructor(private db: Pool) {}

  async set(credential: KernelCredential): Promise<void> {
    await this.db.query(
      `UPDATE users
       SET password_hash = $1, updated_at = $2
       WHERE tenant_id = $3 AND id = $4`,
      [
        credential.password_hash,
        credential.updated_at,
        credential.tenant_id,
        credential.user_id,
      ]
    );
  }

  async getByUserId(params: {
    tenant_id: string;
    user_id: string;
  }): Promise<KernelCredential | null> {
    const result = await this.db.query<{
      id: string;
      tenant_id: string;
      password_hash: string | null;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT id, tenant_id, password_hash, created_at, updated_at
       FROM users
       WHERE tenant_id = $1 AND id = $2`,
      [params.tenant_id, params.user_id]
    );

    if (result.rows.length === 0 || !result.rows[0].password_hash) {
      return null;
    }

    const row = result.rows[0];
    // password_hash is guaranteed to be non-null after the check above
    return {
      tenant_id: row.tenant_id,
      user_id: row.id,
      password_hash: row.password_hash!,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
    };
  }

  async getByEmail(params: {
    tenant_id: string;
    email: string;
  }): Promise<KernelCredential | null> {
    // Look up user by email first, then get credentials
    const result = await this.db.query<{
      id: string;
      tenant_id: string;
      password_hash: string | null;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT id, tenant_id, password_hash, created_at, updated_at
       FROM users
       WHERE tenant_id = $1 AND email = $2`,
      [params.tenant_id, params.email]
    );

    if (result.rows.length === 0 || !result.rows[0].password_hash) {
      return null;
    }

    const row = result.rows[0];
    // password_hash is guaranteed to be non-null after the check above
    return {
      tenant_id: row.tenant_id,
      user_id: row.id,
      password_hash: row.password_hash!,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
    };
  }
}
