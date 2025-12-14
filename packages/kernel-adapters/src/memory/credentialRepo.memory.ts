/**
 * In-Memory Credential Repository
 * 
 * Implementation for development and testing.
 * Stores credentials in memory with multi-tenant isolation.
 * 
 * Production: Replace with PostgreSQL/Redis adapter.
 */

import type { CredentialRepoPort } from '@aibos/kernel-core';
import type { KernelCredential } from '@aibos/kernel-core';

export class InMemoryCredentialRepo implements CredentialRepoPort {
  // Map: tenant_id:user_id -> credential
  private credentials: Map<string, KernelCredential> = new Map();

  // Map: tenant_id:email -> user_id (for login lookup)
  private emailIndex: Map<string, string> = new Map();

  async set(credential: KernelCredential): Promise<void> {
    const key = `${credential.tenant_id}:${credential.user_id}`;
    const emailKey = `${credential.tenant_id}:${credential.user_id}`; // Store with user_id for lookup

    this.credentials.set(key, credential);

    // Note: We need email from user record, not stored in credential
    // This is handled by getByEmail which looks up user first
  }

  async getByUserId(params: {
    tenant_id: string;
    user_id: string;
  }): Promise<KernelCredential | null> {
    const key = `${params.tenant_id}:${params.user_id}`;
    return this.credentials.get(key) || null;
  }

  async getByEmail(params: {
    tenant_id: string;
    email: string;
  }): Promise<KernelCredential | null> {
    // Find credential by email (requires email -> user_id mapping)
    // For MVP, iterate through credentials (inefficient but works)
    // Production: Use proper email index in database

    // This will be handled in the login use-case by looking up user first,
    // then getting credentials by user_id
    throw new Error('getByEmail not implemented - use user lookup + getByUserId');
  }
}
