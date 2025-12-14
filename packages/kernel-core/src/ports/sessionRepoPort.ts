/**
 * Session Repository Port
 * 
 * Interface for session storage and management.
 * Implementations must enforce multi-tenant isolation.
 */

import type { KernelSession } from "../domain/auth";

export interface SessionRepoPort {
  /**
   * Create a new session
   */
  create(session: KernelSession): Promise<void>;

  /**
   * Get session by ID
   */
  get(params: {
    tenant_id: string;
    session_id: string;
  }): Promise<KernelSession | null>;

  /**
   * Revoke a session (soft delete)
   */
  revoke(params: {
    tenant_id: string;
    session_id: string;
    revoked_at: string;
  }): Promise<void>;

  /**
   * Check if session is valid (exists and not expired/revoked)
   */
  isValid(params: {
    tenant_id: string;
    session_id: string;
    now: string;
  }): Promise<boolean>;
}
