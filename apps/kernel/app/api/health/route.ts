/**
 * Health Check Endpoint
 * 
 * Verifies Kernel subsystems are operational.
 * Used for monitoring, load balancers, and readiness probes.
 */

import { NextResponse } from "next/server";
import { getKernelContainer } from "@/src/server/container";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/health
 * 
 * Returns health status of all Kernel subsystems.
 * 
 * Response: 200 (healthy) | 503 (degraded) | 500 (unhealthy)
 */
export async function GET() {
  const container = getKernelContainer();
  const start = performance.now();

  try {
    // Parallel health checks for all subsystems
    // ✅ Read-only checks, no data creation
    // ✅ Uses isolated tenant_id="health-check"
    const [registry, events, audit] = await Promise.all([
      // Check Registry: Can list canons
      container.canonRegistry
        .list({ tenant_id: "health-check" })
        .then(() => ({ status: "up" as const }))
        .catch((e: Error) => ({ status: "down" as const, error: e.message })),

      // Check Event Bus: Can list events
      container.eventBus
        .list("health-check", 1)
        .then(() => ({ status: "up" as const }))
        .catch((e: Error) => ({ status: "down" as const, error: e.message })),

      // Check Audit: Can query audit log
      container.audit
        .query({ tenant_id: "health-check", limit: 1, offset: 0 })
        .then(() => ({ status: "up" as const }))
        .catch((e: Error) => ({ status: "down" as const, error: e.message })),
    ]);

    const duration = Math.round(performance.now() - start);
    const isHealthy =
      registry.status === "up" &&
      events.status === "up" &&
      audit.status === "up";

    // ✅ FIX: Return 200 (healthy) or 503 (degraded), never 500 for subsystem down
    return NextResponse.json(
      {
        status: isHealthy ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        duration_ms: duration,
        services: {
          canonRegistry: registry,
          eventBus: events,
          auditLog: audit,
        },
        version: "2.0.0", // Build 2 Complete
        build: "Build 2 - Core Platform (Complete)",
      },
      { status: isHealthy ? 200 : 503 } // 200=healthy, 503=degraded
    );
  } catch (error) {
    // ✅ FIX: 500 only for unexpected crashes (not routine subsystem failures)
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
        version: "2.0.0",
      },
      { status: 500 } // 500=unexpected crash
    );
  }
}
