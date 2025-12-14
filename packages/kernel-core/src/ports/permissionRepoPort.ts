/**
 * Permission Repository Port
 * 
 * Interface for permission storage and retrieval.
 * Permissions are global (not tenant-scoped).
 */

import type { KernelPermission } from "../domain/permission";

export interface PermissionRepoPort {
  /**
   * Upsert a permission (idempotent)
   */
  upsert(permission: KernelPermission): Promise<void>;

  /**
   * Get permission by code
   */
  getByCode(code: string): Promise<KernelPermission | null>;

  /**
   * List all permissions
   */
  list(): Promise<KernelPermission[]>;
}
