/**
 * Register Canon Use-Case
 * 
 * Application logic for registering a new Canon.
 * This orchestrates domain + ports + audit.
 * 
 * Anti-Gravity:
 * - No framework imports
 * - No adapter imports
 * - Dependencies injected via `deps` parameter
 */

import type { CanonRegistryPort } from "../ports/canonRegistryPort.ts";
import type { AuditPort } from "../ports/auditPort.ts";
import type { Canon } from "../domain/registry.ts";

export interface RegisterCanonDeps {
  canonRegistry: CanonRegistryPort;
  audit: AuditPort;
}

export interface RegisterCanonInput {
  tenant_id: string;
  actor_id?: string;
  correlation_id: string;
  canon_key: string;
  version: string;
  base_url: string;
  status: "ACTIVE" | "INACTIVE";
  capabilities: string[];
}

export async function registerCanon(
  deps: RegisterCanonDeps,
  input: RegisterCanonInput
): Promise<Canon> {
  // 1. Register the Canon via the registry port
  const canon = await deps.canonRegistry.register({
    tenant_id: input.tenant_id,
    canon_key: input.canon_key,
    version: input.version,
    base_url: input.base_url,
    status: input.status,
    capabilities: input.capabilities,
  });

  // 2. Append audit event (immutable)
  await deps.audit.append({
    tenant_id: input.tenant_id,
    actor_id: input.actor_id,
    action: "kernel.registry.canon.register",
    resource: "kernel_canon_registry",
    result: "OK",
    correlation_id: input.correlation_id,
    payload: {
      canon_id: canon.id,
      canon_key: canon.canon_key,
      version: canon.version,
    },
  });

  return canon;
}

