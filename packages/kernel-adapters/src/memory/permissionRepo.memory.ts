/**
 * In-Memory Permission Repository
 * 
 * Implementation for development and testing.
 * Permissions are global (not tenant-scoped).
 * 
 * Production: Replace with PostgreSQL adapter.
 */

import type { PermissionRepoPort } from '@aibos/kernel-core';
import type { KernelPermission } from '@aibos/kernel-core';

export class InMemoryPermissionRepo implements PermissionRepoPort {
  // Map: permission_code -> permission
  private permissions: Map<string, KernelPermission> = new Map();

  async upsert(permission: KernelPermission): Promise<void> {
    this.permissions.set(permission.permission_code, permission);
  }

  async getByCode(code: string): Promise<KernelPermission | null> {
    return this.permissions.get(code) || null;
  }

  async list(): Promise<KernelPermission[]> {
    return Array.from(this.permissions.values());
  }
}
