/**
 * Health Check Endpoint
 * 
 * GET /api/kernel/health
 * 
 * Returns service health status with correlation ID.
 * Used for:
 * - Load balancer health checks
 * - Service discovery
 * - Basic connectivity testing
 */

import { NextResponse, type NextRequest } from "next/server";
import { getCorrelationId, createResponseHeaders } from "@/src/server/http";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const correlationId = getCorrelationId(req);

  const response = {
    ok: true,
    service: "kernel",
    version: "0.1.0",
    correlation_id: correlationId,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response, {
    status: 200,
    headers: createResponseHeaders(correlationId),
  });
}

