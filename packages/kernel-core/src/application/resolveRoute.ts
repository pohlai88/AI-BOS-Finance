/**
 * Resolve Route Use-Case
 * 
 * Application logic for resolving a request path to a Canon.
 * Uses longest prefix matching algorithm.
 * 
 * Anti-Gravity:
 * - No framework imports
 * - No adapter imports
 * - Dependencies injected via `deps` parameter
 */

import type { RouteRegistryPort } from "../ports/routeRegistryPort.ts";
import type { CanonRegistryPort } from "../ports/canonRegistryPort.ts";

/**
 * Normalize path (ensure starts with "/")
 */
function normalizePath(p: string): string {
  const x = p.trim();
  return x.startsWith("/") ? x : `/${x}`;
}

export interface ResolveRouteDeps {
  routes: RouteRegistryPort;
  canonRegistry: CanonRegistryPort;
}

export interface ResolveRouteInput {
  tenant_id: string;
  path: string;
}

export interface ResolvedRoute {
  canon_id: string;
  canon_base_url: string;
  forward_path: string;
}

/**
 * Resolve a request path to a Canon using longest prefix matching.
 * 
 * Algorithm:
 * 1. Normalize the request path
 * 2. Find all routes where path matches or starts with route_prefix
 * 3. Sort by prefix length (longest first)
 * 4. Take the first match (longest prefix)
 * 5. Lookup Canon
 * 6. Calculate forward path (strip prefix from original path)
 */
export async function resolveRoute(
  deps: ResolveRouteDeps,
  input: ResolveRouteInput
): Promise<ResolvedRoute | null> {
  const path = normalizePath(input.path);
  const routes = await deps.routes.list({ tenant_id: input.tenant_id });

  // Longest prefix match
  const match = routes
    .filter(
      (r) =>
        path === r.route_prefix ||
        path.startsWith(r.route_prefix + "/") ||
        r.route_prefix === "/"
    )
    .sort((a, b) => b.route_prefix.length - a.route_prefix.length)[0];

  if (!match) return null;

  const canon = await deps.canonRegistry.getById({
    tenant_id: input.tenant_id,
    canon_id: match.canon_id,
  });

  if (!canon) return null;

  // Forward path = strip prefix (keep leading "/")
  const forwardPath =
    match.route_prefix === "/" ? path : path.slice(match.route_prefix.length) || "/";

  return {
    canon_id: canon.id,
    canon_base_url: canon.base_url,
    forward_path: forwardPath,
  };
}

