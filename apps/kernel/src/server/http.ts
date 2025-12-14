/**
 * HTTP Utilities for Kernel
 * 
 * Shared utilities for API route handlers.
 * Handles correlation ID extraction, response building, and audit metadata.
 */

import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";

/**
 * Extract or generate correlation ID from request
 * 
 * If the client provides x-correlation-id, we use it (for tracing).
 * Otherwise, we generate a new UUID.
 * 
 * Note: This runs in Node.js runtime (API routes), so we can use node:crypto
 */
export function getCorrelationId(req: NextRequest): string {
  const incoming = req.headers.get("x-correlation-id");
  // Validate incoming ID (prevent injection)
  if (incoming && incoming.length > 0 && incoming.length < 128) {
    return incoming;
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
