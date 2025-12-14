/**
 * Canon Registry Port
 * 
 * Interface for Canon registration and lookup.
 * Adapters (in-memory, PostgreSQL, etc.) implement this.
 * 
 * Anti-Gravity: This is a PORT, not an adapter.
 * It defines WHAT we need, not HOW it's implemented.
 */

import type { Canon } from "../domain/registry.ts";

export interface CanonRegistryPort {
  /**
   * Register a new Canon
   */
  register(input: Omit<Canon, "id" | "created_at">): Promise<Canon>;

  /**
   * List all Canons for a tenant
   */
  list(input: { tenant_id: string }): Promise<Canon[]>;

  /**
   * Get Canon by ID (tenant-scoped)
   */
  getById(input: { tenant_id: string; canon_id: string }): Promise<Canon | null>;
}

