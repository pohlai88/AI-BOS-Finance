/**
 * List Registry Use-Cases
 * 
 * Application logic for listing Canons and Routes.
 * Simple read operations - no audit required.
 * 
 * Anti-Gravity:
 * - No framework imports
 * - No adapter imports
 * - Dependencies injected via `deps` parameter
 */

import type { CanonRegistryPort } from "../ports/canonRegistryPort.ts";
import type { RouteRegistryPort } from "../ports/routeRegistryPort.ts";
import type { Canon } from "../domain/registry.ts";
import type { RouteMapping } from "../domain/registry.ts";

export interface ListCanonsDeps {
  canonRegistry: CanonRegistryPort;
}

export async function listCanons(
  deps: ListCanonsDeps,
  tenant_id: string
): Promise<Canon[]> {
  return deps.canonRegistry.list({ tenant_id });
}

export interface ListRoutesDeps {
  routes: RouteRegistryPort;
}

export async function listRoutes(
  deps: ListRoutesDeps,
  tenant_id: string
): Promise<RouteMapping[]> {
  return deps.routes.list({ tenant_id });
}

