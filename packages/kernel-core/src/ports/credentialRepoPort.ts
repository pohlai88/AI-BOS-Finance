/**
 * Credential Repository Port
 * 
 * Interface for credential storage and retrieval.
 * Implementations must enforce multi-tenant isolation.
 */

import type { KernelCredential } from "../domain/auth";

export interface CredentialRepoPort {
  /**
   * Store credentials for a user
   */
  set(credential: KernelCredential): Promise<void>;

  /**
   * Get credentials by user ID
   */
  getByUserId(params: {
    tenant_id: string;
    user_id: string;
  }): Promise<KernelCredential | null>;

  /**
   * Get credentials by email (for login)
   */
  getByEmail(params: {
    tenant_id: string;
    email: string;
  }): Promise<KernelCredential | null>;
}
