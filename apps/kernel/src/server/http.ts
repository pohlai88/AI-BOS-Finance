/**
 * HTTP Utilities for Kernel
 * 
 * Shared utilities for API route handlers.
 * Handles correlation ID extraction, response building, and audit metadata.
 */

import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";

/**
 * Strict UUID regex for correlation ID validation (Day 7 Hardening)
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Extract or generate correlation ID from request
 * 
 * If the client provides a valid UUID x-correlation-id, we use it (for tracing).
 * Otherwise, we generate a new UUID.
 * 
 * Day 7 Hardening: Strict UUID format enforcement.
 * Invalid formats are logged and rejected (new UUID generated).
 * 
 * Note: This runs in Node.js runtime (API routes), so we can use node:crypto
 */
export function getCorrelationId(req: NextRequest | Request): string {
  const incoming = req.headers.get("x-correlation-id");

  // Strict UUID validation (Day 7 Hardening)
  if (incoming && UUID_REGEX.test(incoming)) {
    return incoming;
  }

  // Log warning if invalid format was provided (observability)
  if (incoming) {
    console.warn(`[Correlation] Invalid correlation ID format received: "${incoming.substring(0, 50)}". Regenerating.`);
  }

  return randomUUID();
}

/**
 * Create standard response headers with correlation ID
 */
export function createResponseHeaders(correlationId: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-correlation-id": correlationId,
  };
}

/**
 * Extract HTTP metadata for audit events (Phase 4 enhancement)
 * 
 * Captures HTTP context for security and forensics:
 * - Method, path, status code
 * - Client IP address
 * - User agent
 */
export interface HttpAuditMetadata {
  http_method?: string;
  http_path?: string;
  http_status?: number;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Extract HTTP metadata from request for audit
 */
export function getHttpAuditMetadata(
  req: NextRequest,
  statusCode?: number
): HttpAuditMetadata {
  return {
    http_method: req.method,
    http_path: req.nextUrl.pathname,
    http_status: statusCode,
    ip_address: getClientIp(req),
    user_agent: req.headers.get("user-agent") || undefined,
  };
}

/**
 * Extract client IP address from request
 * 
 * Checks multiple headers (reverse proxy support):
 * - x-forwarded-for (standard)
 * - x-real-ip (nginx)
 * - cf-connecting-ip (Cloudflare)
 */
function getClientIp(req: NextRequest): string | undefined {
  // Check x-forwarded-for (may contain multiple IPs)
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded.split(",").map((ip) => ip.trim());
    return ips[0]; // First IP is the client
  }

  // Check x-real-ip
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;

  // Check cf-connecting-ip (Cloudflare)
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;

  // Fallback: req.ip (may not be available in all environments)
  return undefined;
}

/**
 * Validate UUID format (uses UUID_REGEX defined at top of file)
 */
function isValidUUID(str: string): boolean {
  return UUID_REGEX.test(str);
}

/**
 * Require tenant ID from header and validate UUID format
 * 
 * Throws error if missing or invalid format.
 * Used for bootstrap and public endpoints.
 */
export function requireTenantId(req: NextRequest): string {
  const tenantId = req.headers.get("x-tenant-id");

  if (!tenantId) {
    throw new Error("MISSING_TENANT_ID");
  }

  // Validate UUID format (Day 2 requirement)
  if (!isValidUUID(tenantId)) {
    throw new Error("INVALID_TENANT_ID_FORMAT");
  }

  return tenantId;
}
