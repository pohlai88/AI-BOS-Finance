/**
 * Health Check Endpoint
 * 
 * Verifies Kernel subsystems are operational.
 * Used for monitoring, load balancers, and readiness probes.
 */

import { NextResponse } from "next/server";
import { getKernelContainer } from "@/src/server/container";
import { checkDbConnection } from "@/src/server/db";
import { SYSTEM_TENANT_ID, NULL_UUID } from "@aibos/kernel-core";

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
    // Check database connection first
    const dbStatus = await checkDbConnection()
      .then(() => ({ status: "up" as const }))
      .catch((e: Error) => ({ status: "down" as const, error: e.message }));

    // Parallel health checks for all subsystems
    // Uses SSOT constants from @aibos/kernel-core
    // ✅ Read-only checks, no data creation
    // ✅ Uses isolated system tenant for non-tenant operations
    const [registry, events, audit, users, roles, sessions, credentials] = await Promise.all([
      // Check Registry: Can list canons
      container.canonRegistry
        .list({ tenant_id: SYSTEM_TENANT_ID })
        .then(() => ({ status: "up" as const }))
        .catch((e: Error) => ({ status: "down" as const, error: e.message })),

      // Check Event Bus: Can list events
      container.eventBus
        .list(SYSTEM_TENANT_ID, 1)
        .then(() => ({ status: "up" as const }))
        .catch((e: Error) => ({ status: "down" as const, error: e.message })),

      // Check Audit: Can query audit log
      container.audit
        .query({ tenant_id: SYSTEM_TENANT_ID, limit: 1, offset: 0 })
        .then(() => ({ status: "up" as const }))
        .catch((e: Error) => ({ status: "down" as const, error: e.message })),

      // Check IAM Users: Can list users
      container.userRepo
        .list({ tenant_id: SYSTEM_TENANT_ID, limit: 1, offset: 0 })
        .then(() => ({ status: "up" as const }))
        .catch((e: Error) => ({ status: "down" as const, error: e.message })),

      // Check IAM Roles: Can list roles
      container.roleRepo
        .list({ tenant_id: SYSTEM_TENANT_ID, limit: 1, offset: 0 })
        .then(() => ({ status: "up" as const }))
        .catch((e: Error) => ({ status: "down" as const, error: e.message })),

      // Check Auth Sessions: Can check session validity
      container.sessionRepo
        .isValid({ tenant_id: SYSTEM_TENANT_ID, session_id: NULL_UUID, now: new Date().toISOString() })
        .then(() => ({ status: "up" as const }))
        .catch((e: Error) => ({ status: "down" as const, error: e.message })),

      // Check Auth Credentials: Can get credentials
      container.credentialRepo
        .getByUserId({ tenant_id: SYSTEM_TENANT_ID, user_id: NULL_UUID })
        .then(() => ({ status: "up" as const }))
        .catch((e: Error) => ({ status: "down" as const, error: e.message })),
    ]);

    const duration = Math.round(performance.now() - start);
    const isHealthy =
      dbStatus.status === "up" &&
      registry.status === "up" &&
      events.status === "up" &&
      audit.status === "up" &&
      users.status === "up" &&
      roles.status === "up" &&
      sessions.status === "up" &&
      credentials.status === "up";

    // ✅ FIX: Return 200 (healthy) or 503 (degraded), never 500 for subsystem down
    return NextResponse.json(
      {
        status: isHealthy ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        duration_ms: duration,
        services: {
          database: dbStatus,
          canonRegistry: registry,
          eventBus: events,
          auditLog: audit,
          iam: {
            users: users,
            roles: roles,
          },
          auth: {
            sessions: sessions,
            credentials: credentials,
            jwt: { status: "up" }, // JWT signer initialized in container
            password_hasher: { status: "up" }, // Bcrypt initialized in container
          },
        },
        version: "3.2.0", // Build 3.2 - JWT Authentication
        build: "Build 3.2 - JWT Authentication (Complete)",
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
