/**
 * Role Repository Port
 * 
 * Interface for role persistence and role assignments.
 * Adapters (in-memory, Drizzle, etc.) implement this.
 * 
 * Anti-Gravity: This is a PORT, not an adapter.
 * It defines WHAT we need, not HOW it's implemented.
 */

import type { KernelRole, KernelUserRole } from "../domain/iam";

export interface RoleRepoPort {
  /**
   * Create a new role
   */
  create(role: KernelRole): Promise<void>;

  /**
   * Find role by name (tenant-scoped)
   */
  findByName(input: {
    tenant_id: string;
    name: string
  }): Promise<KernelRole | null>;

  /**
   * Find role by ID (tenant-scoped)
   */
  findById(input: {
    tenant_id: string;
    role_id: string
  }): Promise<KernelRole | null>;

  /**
   * List roles for a tenant (paginated)
   */
  list(input: {
    tenant_id: string;
    limit: number;
    offset: number
  }): Promise<{
    items: KernelRole[];
    total: number
  }>;

  /**
   * Assign a role to a user
   */
  assign(input: KernelUserRole): Promise<void>;

  /**
   * Get all roles assigned to a user
   */
  listUserRoles(input: {
    tenant_id: string;
    user_id: string
  }): Promise<KernelRole[]>;
}
