/**
 * API Gateway Route Handler (Next.js 16)
 * 
 * Phase 2: API Gateway
 * 
 * Single ingress point that:
 * 1. Validates tenant_id header
 * 2. Resolves route to Canon via Registry
 * 3. Forwards HTTP request to Canon
 * 4. Propagates x-correlation-id and x-tenant-id
 * 5. Streams response back to client
 * 
 * Supports: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
 * Timeout: 30s default (configurable via KERNEL_GATEWAY_TIMEOUT_MS)
 * 
 * Anti-Gravity:
 * - Uses resolveRoute() from kernel-core (Phase 1)
 * - Uses container for registry access
 * - No direct adapter imports
 */

import { NextResponse, type NextRequest } from "next/server";
import { getCorrelationId, createResponseHeaders } from "@/src/server/http";
import { getKernelContainer } from "@/src/server/container";
import { verifyJWT } from "@/src/server/jwt";
import { resolveRoute, authorize } from "@aibos/kernel-core";

/**
 * Check if error is an authentication/authorization error
 * Handles both string messages and error objects with code properties
 */
function isAuthnError(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const anyE = e as any;
  const code = anyE.code ?? anyE.error?.code;
  const msg = anyE.message;
  return (
    code === "UNAUTHORIZED" ||
    code === "INVALID_TOKEN" ||
    code === "SESSION_INVALID" ||
    msg === "UNAUTHORIZED" ||
    msg === "INVALID_TOKEN" ||
    msg === "SESSION_INVALID"
  );
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GatewayParams = { path?: string[] };
type GatewayContext = { params: Promise<GatewayParams> };
type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";

const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Hop-by-hop headers that should NOT be forwarded
 * (per RFC 2616 Section 13.5.1)
 */
const HOP_BY_HOP_REQUEST_HEADERS = new Set([
  "host",
  "connection",
  "content-length",
  "transfer-encoding",
  "upgrade",
  "proxy-connection",
  "keep-alive",
  "te",
  "trailer",
]);

const HOP_BY_HOP_RESPONSE_HEADERS = new Set([
  "connection",
  "transfer-encoding",
  "content-encoding",
  "upgrade",
  "proxy-connection",
  "keep-alive",
  "te",
  "trailer",
]);

/**
 * GET /api/gateway/[...path]
 */
export async function GET(req: NextRequest, ctx: GatewayContext) {
  return handleGatewayRequest(req, await ctx.params, "GET");
}

/**
 * POST /api/gateway/[...path]
 */
export async function POST(req: NextRequest, ctx: GatewayContext) {
  return handleGatewayRequest(req, await ctx.params, "POST");
}

/**
 * PUT /api/gateway/[...path]
 */
export async function PUT(req: NextRequest, ctx: GatewayContext) {
  return handleGatewayRequest(req, await ctx.params, "PUT");
}

/**
 * DELETE /api/gateway/[...path]
 */
export async function DELETE(req: NextRequest, ctx: GatewayContext) {
  return handleGatewayRequest(req, await ctx.params, "DELETE");
}

/**
 * PATCH /api/gateway/[...path]
 */
export async function PATCH(req: NextRequest, ctx: GatewayContext) {
  return handleGatewayRequest(req, await ctx.params, "PATCH");
}

/**
 * HEAD /api/gateway/[...path]
 */
export async function HEAD(req: NextRequest, ctx: GatewayContext) {
  return handleGatewayRequest(req, await ctx.params, "HEAD");
}

/**
 * OPTIONS /api/gateway/[...path]
 */
export async function OPTIONS(req: NextRequest, ctx: GatewayContext) {
  return handleGatewayRequest(req, await ctx.params, "OPTIONS");
}

/**
 * Core gateway logic
 * 
 * Flow:
 * 1. Extract tenant_id from header
 * 2. Extract path from [...path] catch-all segment
 * 3. Resolve route → Canon via Registry
 * 4. Forward request to Canon with proper headers
 * 5. Stream response back to client
 */
async function handleGatewayRequest(
  req: NextRequest,
  params: GatewayParams,
  method: Method
): Promise<NextResponse> {
  const correlationId = getCorrelationId(req);
  const timeoutMs = readTimeoutMs();

  try {
    // 1. Extract path from catch-all segment
    // Example: /api/gateway/canon/hrm/users → /canon/hrm/users
    const pathSegments = params.path ?? [];
    const gatewayPath = "/" + pathSegments.join("/");

    // 2. Resolve route → Canon via Registry
    // For public routes (no required_permissions), we still need tenant_id from header
    // For protected routes, tenant_id comes from JWT (enforced below)
    const headerTenantId = req.headers.get("x-tenant-id");

    const container = getKernelContainer();

    // 3. Check if route requires authentication (has required_permissions)
    // If yes, verify JWT first to get tenant_id from token (more secure)
    let tenantId: string;
    let auth: { user_id: string; tenant_id: string; session_id: string; email: string } | null = null;

    // Try to resolve route first to check if it requires permissions
    // Note: This requires tenant_id, so we'll use header for initial resolution
    // but then re-resolve with JWT tenant_id if route is protected
    if (!headerTenantId) {
      return jsonError(400, "MISSING_TENANT_ID", "Missing x-tenant-id header", correlationId);
    }

    let resolved = await resolveRoute(
      { routes: container.routes, canonRegistry: container.canonRegistry },
      { tenant_id: headerTenantId, path: gatewayPath }
    );

    if (!resolved) {
      return jsonError(404, "ROUTE_NOT_FOUND", "No route found for path", correlationId);
    }

    // 4. Enforce RBAC if required_permissions specified (Build 3.3)
    // Safely handle undefined required_permissions (legacy routes or domain objects)
    const requiredPerms = Array.isArray((resolved as any)?.required_permissions)
      ? (resolved as any).required_permissions
      : [];

    if (requiredPerms.length > 0) {
      try {
        // Verify JWT and get user context (tenant_id from JWT is authoritative)
        auth = await verifyJWT(req);
        tenantId = auth.tenant_id; // Use tenant_id from JWT, not header

        // Re-resolve route with JWT tenant_id to prevent tenant boundary bypass
        resolved = await resolveRoute(
          { routes: container.routes, canonRegistry: container.canonRegistry },
          { tenant_id: tenantId, path: gatewayPath }
        );

        if (!resolved) {
          return jsonError(404, "ROUTE_NOT_FOUND", "No route found for path", correlationId);
        }

        // Re-check required_permissions after re-resolution (may have changed)
        const jwtRequiredPerms = Array.isArray((resolved as any)?.required_permissions)
          ? (resolved as any).required_permissions
          : requiredPerms;

        // Check authorization
        const decision = await authorize(
          {
            roles: container.roleRepo,
            rolePermissions: container.rolePermissionRepo,
          },
          {
            tenant_id: tenantId, // Use JWT tenant_id
            actor_id: auth.user_id,
            required_permissions: jwtRequiredPerms,
            resource: `gateway:${req.method}:${gatewayPath}:${(resolved as any)?.canon_id ?? "unknown"}`,
          }
        );

        // If denied, write audit event and return 403
        if (decision.decision === "DENY") {
          await container.audit.append({
            tenant_id: tenantId, // Use JWT tenant_id
            actor_id: auth.user_id,
            action: "authz.deny",
            resource: `gateway:${req.method}:${gatewayPath}:${(resolved as any)?.canon_id ?? "unknown"}`,
            result: "DENY",
            correlation_id: correlationId,
            payload: {
              required_permissions: jwtRequiredPerms,
              missing_permissions: decision.missing ?? [],
            },
          });

          return NextResponse.json(
            {
              ok: false,
              error: {
                code: "FORBIDDEN",
                message: "Insufficient permissions",
                missing_permissions: decision.missing ?? [],
              },
              correlation_id: correlationId,
            },
            { status: 403, headers: createResponseHeaders(correlationId) }
          );
        }
      } catch (e: any) {
        // Handle JWT errors (robust error detection)
        if (isAuthnError(e)) {
          return jsonError(401, "UNAUTHORIZED", "Missing or invalid authentication token", correlationId);
        }
        // Re-throw other errors
        throw e;
      }
    } else {
      // Public route - use tenant_id from header
      tenantId = headerTenantId;
    }

    // 5. Build Canon URL with query parameters
    const canonUrl = new URL(resolved.forward_path, resolved.canon_base_url);
    canonUrl.search = req.nextUrl.search; // preserve query string exactly

    // 6. Build forward headers (correlation ID + tenant ID + filtered headers)
    // Use tenant_id from JWT if authenticated, otherwise from header
    const forwardTenantId = auth?.tenant_id || tenantId;
    const forwardHeaders = buildForwardHeaders(req.headers, correlationId, forwardTenantId);

    // 7. Read request body for POST/PUT/PATCH (binary safe)
    const body =
      method === "POST" || method === "PUT" || method === "PATCH"
        ? await readRequestBody(req)
        : undefined;

    // 8. Forward request with timeout
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const canonResponse = await fetch(canonUrl.toString(), {
        method,
        headers: forwardHeaders,
        body,
        signal: controller.signal,
        redirect: "manual", // Don't follow redirects automatically
      });

      clearTimeout(timer);

      // 8. Merge response headers (preserve Set-Cookie, filter hop-by-hop)
      const responseHeaders = mergeResponseHeaders(
        canonResponse.headers,
        createResponseHeaders(correlationId)
      );

      // 10. Stream body back to client (efficient + binary safe)
      return new NextResponse(canonResponse.body, {
        status: canonResponse.status,
        statusText: canonResponse.statusText,
        headers: responseHeaders,
      });
    } catch (err: unknown) {
      clearTimeout(timer);

      // Handle timeout
      if (isAbortError(err)) {
        return jsonError(504, "GATEWAY_TIMEOUT", "Request to Canon timed out", correlationId);
      }

      // Handle connection errors
      return jsonError(502, "GATEWAY_ERROR", "Failed to connect to Canon", correlationId);
    }
  } catch (err) {
    // Catch-all for unexpected errors
    console.error("[Kernel][Gateway]", { correlationId, err });
    return jsonError(500, "INTERNAL_ERROR", "An unexpected error occurred", correlationId);
  }
}

/**
 * Build standardized JSON error response
 * (matches existing route handler pattern)
 */
function jsonError(status: number, code: string, message: string, correlationId: string) {
  return NextResponse.json(
    { ok: false, error: { code, message }, correlation_id: correlationId },
    { status, headers: createResponseHeaders(correlationId) }
  );
}

/**
 * Build headers to forward to Canon
 * 
 * Rules:
 * - Always include x-correlation-id and x-tenant-id
 * - Filter out hop-by-hop headers
 * - Forward all other headers (content-type, authorization, etc.)
 */
function buildForwardHeaders(
  incoming: Headers,
  correlationId: string,
  tenantId: string
): Headers {
  const out = new Headers();

  // Required upstream trace headers
  out.set("x-correlation-id", correlationId);
  out.set("x-tenant-id", tenantId);

  // Forward everything else except hop-by-hop + ones we explicitly manage
  incoming.forEach((value, key) => {
    const k = key.toLowerCase();
    if (HOP_BY_HOP_REQUEST_HEADERS.has(k)) return;
    if (k === "x-correlation-id" || k === "x-tenant-id") return;
    out.set(key, value);
  });

  return out;
}

/**
 * Merge response headers from Canon with base headers
 * 
 * Rules:
 * - Preserve base headers (correlation ID, content-type)
 * - Filter out hop-by-hop headers
 * - Preserve multiple Set-Cookie values (use append)
 */
function mergeResponseHeaders(upstream: Headers, base: HeadersInit): Headers {
  const out = new Headers(base);

  upstream.forEach((value, key) => {
    const k = key.toLowerCase();
    if (HOP_BY_HOP_RESPONSE_HEADERS.has(k)) return;

    // Preserve multiple Set-Cookie values
    if (k === "set-cookie") {
      out.append(key, value);
      return;
    }

    out.set(key, value);
  });

  return out;
}

/**
 * Read request body as ArrayBuffer (binary safe)
 * 
 * Returns undefined if body is empty (don't send empty body)
 */
async function readRequestBody(req: NextRequest): Promise<BodyInit | undefined> {
  // Preserve binary (not just text). If empty, do not send a body.
  const buf = await req.arrayBuffer();
  return buf.byteLength > 0 ? buf : undefined;
}

/**
 * Read timeout from environment variable
 * 
 * Default: 30s
 * Override: KERNEL_GATEWAY_TIMEOUT_MS=60000
 */
function readTimeoutMs(): number {
  const raw = process.env.KERNEL_GATEWAY_TIMEOUT_MS;
  if (!raw) return DEFAULT_TIMEOUT_MS;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_TIMEOUT_MS;
}

/**
 * Check if error is an AbortError (timeout)
 */
function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === "AbortError";
}
