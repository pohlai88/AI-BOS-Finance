/**
 * In-Memory Tenant Repository
 * 
 * Fast, no-setup implementation for development and testing.
 * Data is lost on server restart.
 */

import crypto from "node:crypto";
import type { TenantRepoPort } from "@aibos/kernel-core";
import type { Tenant } from "@aibos/kernel-core";

export class InMemoryTenantRepo implements TenantRepoPort {
  private items: Tenant[] = [];

  async create(input: { name: string }): Promise<Tenant> {
    const now = new Date().toISOString();
    const tenant: Tenant = {
      id: crypto.randomUUID(),
      name: input.name,
      status: "ACTIVE",
      created_at: now,
    };
    this.items.unshift(tenant);
    return tenant;
  }

  async list(): Promise<Tenant[]> {
    return [...this.items];
  }

  async findById(id: string): Promise<Tenant | null> {
    return this.items.find((t) => t.id === id) ?? null;
  }

  // Debug helper - not part of the port interface
  clear(): void {
    this.items = [];
  }
}

