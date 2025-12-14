/**
 * Create Route Use-Case
 * 
 * Application logic for creating a route mapping.
 * Validates Canon exists before creating route.
 * 
 * Anti-Gravity:
 * - No framework imports
 * - No adapter imports
 * - Dependencies injected via `deps` parameter
 */

import type { RouteRegistryPort } from "../ports/routeRegistryPort.ts";
import type { CanonRegistryPort } from "../ports/canonRegistryPort.ts";
import type { AuditPort } from "../ports/auditPort.ts";
import type { RouteMapping } from "../domain/registry.ts";

/**
 * Normalize route prefix (ensure starts with "/", remove trailing slashes)
 */
function normalizePrefix(p: string): string {
  const x = p.trim();
  if (!x.startsWith("/")) return `/${x}`;
  return x.replace(/\/+$/, "") || "/";
}

export interface CreateRouteDeps {
  routes: RouteRegistryPort;
  canonRegistry: CanonRegistryPort;
  audit: AuditPort;
}

export interface CreateRouteInput {
  tenant_id: string;
  actor_id?: string;
  correlation_id: string;
  route_prefix: string;
  canon_id: string;
}

export async function createRoute(
  deps: CreateRouteDeps,
  input: CreateRouteInput
): Promise<RouteMapping> {
  // 1. Validate Canon exists for this tenant
  const canon = await deps.canonRegistry.getById({
    tenant_id: input.tenant_id,
    canon_id: input.canon_id,
  });

  if (!canon) {
    // Append audit event for failure (immutable)
    await deps.audit.append({
      tenant_id: input.tenant_id,
      actor_id: input.actor_id,
      action: "kernel.registry.route.create",
      resource: "kernel_route_registry",
      result: "FAIL",
      correlation_id: input.correlation_id,
      payload: {
        reason: "CANON_NOT_FOUND",
        canon_id: input.canon_id,
      },
    });
    throw new Error("Canon not found for this tenant.");
  }

  // 2. Create route mapping with normalized prefix
  const route = await deps.routes.create({
    tenant_id: input.tenant_id,
    route_prefix: normalizePrefix(input.route_prefix),
    canon_id: input.canon_id,
  });

  // 3. Append audit event for success (immutable)
  await deps.audit.append({
    tenant_id: input.tenant_id,
    actor_id: input.actor_id,
    action: "kernel.registry.route.create",
    resource: "kernel_route_registry",
    result: "OK",
    correlation_id: input.correlation_id,
    payload: {
      route_id: route.id,
      route_prefix: route.route_prefix,
      canon_id: route.canon_id,
    },
  });

  return route;
}

