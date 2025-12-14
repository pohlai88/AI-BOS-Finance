/**
 * In-Memory Role Repository
 * 
 * Fast, no-setup implementation for development and testing.
 * Data is lost on server restart.
 * 
 * Production: Replace with DrizzleRoleRepo (Build 3.1 Phase 2)
 */

import type { RoleRepoPort } from "@aibos/kernel-core";
import type { KernelRole, KernelUserRole } from "@aibos/kernel-core";

export class InMemoryRoleRepo implements RoleRepoPort {
  private rolesByTenant = new Map<string, KernelRole[]>();
  private userRolesByTenant = new Map<string, KernelUserRole[]>();

  async create(role: KernelRole): Promise<void> {
    const arr = this.rolesByTenant.get(role.tenant_id) ?? [];
    arr.push(role);
    this.rolesByTenant.set(role.tenant_id, arr);
  }

  async findByName(input: {
    tenant_id: string;
    name: string
  }): Promise<KernelRole | null> {
    const arr = this.rolesByTenant.get(input.tenant_id) ?? [];
    return arr.find(r => r.name === input.name) ?? null;
  }

  async findById(input: {
    tenant_id: string;
    role_id: string
  }): Promise<KernelRole | null> {
    const arr = this.rolesByTenant.get(input.tenant_id) ?? [];
    return arr.find(r => r.role_id === input.role_id) ?? null;
  }

  async list(input: {
    tenant_id: string;
    limit: number;
    offset: number
  }): Promise<{ items: KernelRole[]; total: number }> {
    const arr = this.rolesByTenant.get(input.tenant_id) ?? [];
    const total = arr.length;
    const items = arr.slice(input.offset, input.offset + input.limit);
    return { items, total };
  }

  async assign(input: KernelUserRole): Promise<void> {
    const arr = this.userRolesByTenant.get(input.tenant_id) ?? [];
    const exists = arr.some(
      x => x.user_id === input.user_id && x.role_id === input.role_id
    );
    if (!exists) {
      arr.push(input);
    }
    this.userRolesByTenant.set(input.tenant_id, arr);
  }

  async listUserRoles(input: {
    tenant_id: string;
    user_id: string
  }): Promise<KernelRole[]> {
    const links = (this.userRolesByTenant.get(input.tenant_id) ?? [])
      .filter(x => x.user_id === input.user_id);
    const roles = this.rolesByTenant.get(input.tenant_id) ?? [];
    const roleIdSet = new Set(links.map(l => l.role_id));
    return roles.filter(r => roleIdSet.has(r.role_id));
  }
}
