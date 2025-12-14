/**
 * List Tenants Use-Case
 * 
 * Application logic for listing all tenants.
 * Simple read operation - no audit required.
 * 
 * Anti-Gravity:
 * - No framework imports
 * - No adapter imports
 * - Dependencies injected via `deps` parameter
 */

import type { TenantRepoPort } from "../ports/tenantRepo.ts";
import type { Tenant } from "../domain/tenant.ts";

export interface ListTenantsDeps {
  tenantRepo: TenantRepoPort;
}

export async function listTenants(deps: ListTenantsDeps): Promise<Tenant[]> {
  return deps.tenantRepo.list();
}

