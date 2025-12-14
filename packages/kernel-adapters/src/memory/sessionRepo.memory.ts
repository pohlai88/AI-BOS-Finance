/**
 * In-Memory Session Repository
 * 
 * Implementation for development and testing.
 * Stores sessions in memory with multi-tenant isolation.
 * 
 * Production: Replace with Redis adapter for session storage.
 */

import type { SessionRepoPort } from '@aibos/kernel-core';
import type { KernelSession } from '@aibos/kernel-core';

export class InMemorySessionRepo implements SessionRepoPort {
  // Map: tenant_id:session_id -> session
  private sessions: Map<string, KernelSession> = new Map();

  async create(session: KernelSession): Promise<void> {
    const key = `${session.tenant_id}:${session.session_id}`;
    this.sessions.set(key, session);
  }

  async get(params: {
    tenant_id: string;
    session_id: string;
  }): Promise<KernelSession | null> {
    const key = `${params.tenant_id}:${params.session_id}`;
    return this.sessions.get(key) || null;
  }

  async revoke(params: {
    tenant_id: string;
    session_id: string;
    revoked_at: string;
  }): Promise<void> {
    const key = `${params.tenant_id}:${params.session_id}`;
    const session = this.sessions.get(key);

    if (session) {
      session.revoked_at = params.revoked_at;
      this.sessions.set(key, session);
    }
  }

  async isValid(params: {
    tenant_id: string;
    session_id: string;
    now: string;
  }): Promise<boolean> {
    const key = `${params.tenant_id}:${params.session_id}`;
    const session = this.sessions.get(key);

    if (!session) {
      return false;
    }

    // Check if revoked
    if (session.revoked_at) {
      return false;
    }

    // Check if expired
    const nowTime = new Date(params.now).getTime();
    const expiresTime = new Date(session.expires_at).getTime();

    if (nowTime >= expiresTime) {
      return false;
    }

    return true;
  }
}
