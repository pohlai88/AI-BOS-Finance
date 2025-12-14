/**
 * Route Registry Port
 * 
 * Interface for route mapping storage.
 * Adapters (in-memory, PostgreSQL, etc.) implement this.
 * 
 * Anti-Gravity: This is a PORT, not an adapter.
 * It defines WHAT we need, not HOW it's implemented.
 */

import type { RouteMapping } from "../domain/registry.ts";

export interface RouteRegistryPort {
  /**
   * Create a route mapping
   */
  create(input: Omit<RouteMapping, "id" | "created_at">): Promise<RouteMapping>;

  /**
   * List all route mappings for a tenant
   */
  list(input: { tenant_id: string }): Promise<RouteMapping[]>;
}

