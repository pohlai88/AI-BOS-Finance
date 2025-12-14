/**
 * In-Memory Route Registry
 * 
 * Fast, no-setup implementation for development and testing.
 * Data is lost on server restart.
 */

import crypto from "node:crypto";
import type { RouteRegistryPort } from "@aibos/kernel-core";
import type { RouteMapping } from "@aibos/kernel-core";

export class InMemoryRouteRegistry implements RouteRegistryPort {
  private items: RouteMapping[] = [];

  async create(
    input: Omit<RouteMapping, "id" | "created_at">
  ): Promise<RouteMapping> {
    const route: RouteMapping = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      ...input,
    };
    this.items.unshift(route);
    return route;
  }

  async list(input: { tenant_id: string }): Promise<RouteMapping[]> {
    return this.items.filter((x) => x.tenant_id === input.tenant_id);
  }

  // Debug helper - not part of the port interface
  clear(): void {
    this.items = [];
  }
}

