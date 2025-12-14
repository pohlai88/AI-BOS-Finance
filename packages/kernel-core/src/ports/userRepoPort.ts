/**
 * User Repository Port
 * 
 * Interface for user persistence.
 * Adapters (in-memory, Drizzle, etc.) implement this.
 * 
 * Anti-Gravity: This is a PORT, not an adapter.
 * It defines WHAT we need, not HOW it's implemented.
 */

import type { KernelUser } from "../domain/iam";

export interface UserRepoPort {
  /**
   * Create a new user
   */
  create(user: KernelUser): Promise<void>;

  /**
   * Find user by email (tenant-scoped)
   */
  findByEmail(input: {
    tenant_id: string;
    email: string
  }): Promise<KernelUser | null>;

  /**
   * Find user by ID (tenant-scoped)
   */
  findById(input: {
    tenant_id: string;
    user_id: string
  }): Promise<KernelUser | null>;

  /**
   * List users for a tenant (paginated)
   */
  list(input: {
    tenant_id: string;
    limit: number;
    offset: number
  }): Promise<{
    items: KernelUser[];
    total: number
  }>;
}
