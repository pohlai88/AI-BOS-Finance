/**
 * Kernel Proxy (Next.js 16+)
 * 
 * Replaces deprecated middleware.ts
 * Runs before every request to:
 * 1. Ensure correlation ID is present
 * 2. Add standard response headers
 * 
 * This enables request tracing across the system.
 * 
 * Note: proxy.ts runs on Node.js runtime (not Edge Runtime)
 */

import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";

export function proxy(req: NextRequest) {
  // Get or generate correlation ID
  // Use Node.js crypto (proxy.ts runs on Node.js runtime)
  const correlationId =
    req.headers.get("x-correlation-id") ?? randomUUID();

  // Clone the response and add correlation ID header
  const res = NextResponse.next();
  res.headers.set("x-correlation-id", correlationId);

  return res;
}

// Apply proxy to all API routes
export const config = {
  matcher: "/api/:path*",
};

