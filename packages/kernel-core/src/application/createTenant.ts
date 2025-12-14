/**
 * Create Tenant Use-Case
 * 
 * Application logic for creating a new tenant.
 * This is a pure function that orchestrates domain + ports.
 * 
 * Anti-Gravity:
 * - No framework imports
 * - No adapter imports
 * - Dependencies injected via `deps` parameter
 */

import type { TenantRepoPort } from "../ports/tenantRepo.ts";
import type { AuditPort } from "../ports/auditPort.ts";
import type { Tenant } from "../domain/tenant.ts";

export interface CreateTenantDeps {
  tenantRepo: TenantRepoPort;
  audit: AuditPort;
}

export interface CreateTenantInput {
  name: string;
  correlation_id: string;
  actor_id?: string;
}

export async function createTenant(
  deps: CreateTenantDeps,
  input: CreateTenantInput
): Promise<Tenant> {
  // 1. Create the tenant via the repository port
  const tenant = await deps.tenantRepo.create({ name: input.name });

  // 2. Append audit event (immutable)
  await deps.audit.append({
    tenant_id: tenant.id,
    actor_id: input.actor_id,
    action: "kernel.tenant.create",
    resource: "kernel_tenant",
    result: "OK",
    correlation_id: input.correlation_id,
    payload: { name: tenant.name },
  });

  return tenant;
}

