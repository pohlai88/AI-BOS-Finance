/**
 * In-Memory User Repository
 * 
 * Fast, no-setup implementation for development and testing.
 * Data is lost on server restart.
 * 
 * Production: Replace with DrizzleUserRepo (Build 3.1 Phase 2)
 */

import type { UserRepoPort } from "@aibos/kernel-core";
import type { KernelUser } from "@aibos/kernel-core";

export class InMemoryUserRepo implements UserRepoPort {
  private byTenant = new Map<string, KernelUser[]>();

  async create(user: KernelUser): Promise<void> {
    const arr = this.byTenant.get(user.tenant_id) ?? [];
    arr.push(user);
    this.byTenant.set(user.tenant_id, arr);
  }

  async findByEmail(input: {
    tenant_id: string;
    email: string
  }): Promise<KernelUser | null> {
    const arr = this.byTenant.get(input.tenant_id) ?? [];
    return arr.find(u => u.email === input.email) ?? null;
  }

  async findById(input: {
    tenant_id: string;
    user_id: string
  }): Promise<KernelUser | null> {
    const arr = this.byTenant.get(input.tenant_id) ?? [];
    return arr.find(u => u.user_id === input.user_id) ?? null;
  }

  async list(input: {
    tenant_id: string;
    limit: number;
    offset: number
  }): Promise<{ items: KernelUser[]; total: number }> {
    const arr = this.byTenant.get(input.tenant_id) ?? [];
    const total = arr.length;
    const items = arr.slice(input.offset, input.offset + input.limit);
    return { items, total };
  }
}
