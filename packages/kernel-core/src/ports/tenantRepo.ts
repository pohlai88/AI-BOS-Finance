/**
 * Tenant Repository Port
 * 
 * Interface for tenant persistence.
 * Adapters (in-memory, PostgreSQL, etc.) implement this.
 * 
 * Anti-Gravity: This is a PORT, not an adapter.
 * It defines WHAT we need, not HOW it's implemented.
 */

import type { Tenant } from "../domain/tenant.ts";

export interface TenantRepoPort {
  /**
   * Create a new tenant
   */
  create(input: { name: string }): Promise<Tenant>;

  /**
   * List all tenants
   */
  list(): Promise<Tenant[]>;

  /**
   * Find tenant by ID (optional for Build 1)
   */
  findById?(id: string): Promise<Tenant | null>;
}

