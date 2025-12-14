/**
 * Kernel Dependency Container
 * 
 * Wires up adapters to be used by application use-cases.
 * This is the composition root - the ONLY place adapters are instantiated.
 * 
 * Anti-Gravity:
 * - This file CAN import from kernel-core and kernel-adapters
 * - Route handlers ONLY import from this container
 * - UI pages NEVER import this directly
 * 
 * Dev Note: globalThis storage is for dev convenience only (HMR survival).
 * Production persistence requires Redis/Postgres (Build 3.2+).
 */

import { randomUUID } from "node:crypto";
import {
  InMemoryTenantRepo,
  InMemoryAudit,
  InMemoryCanonRegistry,
  InMemoryRouteRegistry,
  InMemoryEventBus,
  InMemoryUserRepo,
  InMemoryRoleRepo,
  InMemoryCredentialRepo,
  InMemorySessionRepo,
  InMemoryPermissionRepo,
  InMemoryRolePermissionRepo,
  SqlTenantRepo,
  SqlUserRepo,
  SqlRoleRepo,
  SqlCredentialRepo,
  SqlSessionRepo,
  SqlPermissionRepo,
  SqlRolePermissionRepo,
  SqlCanonRepo,
  SqlRouteRepo,
  SqlEventBus,
  SqlAuditRepo,
  BcryptPasswordHasher,
  JoseTokenSigner,
} from "@aibos/kernel-adapters";
import type {
  TenantRepoPort,
  UserRepoPort,
  RoleRepoPort,
  CredentialRepoPort,
  SessionRepoPort,
  PermissionRepoPort,
  RolePermissionRepoPort,
  CanonRegistryPort,
  RouteRegistryPort,
  EventBusPort,
  AuditPort,
} from "@aibos/kernel-core";
import { KERNEL_PERMISSIONS } from "@aibos/kernel-core";
import { db } from "./db";

/**
 * Kernel container type
 * Uses port interfaces to support both memory and SQL adapters
 */
export interface KernelContainer {
  tenantRepo: TenantRepoPort;
  audit: AuditPort;
  canonRegistry: CanonRegistryPort;
  routes: RouteRegistryPort;
  eventBus: EventBusPort;
  userRepo: UserRepoPort;
  roleRepo: RoleRepoPort;
  credentialRepo: CredentialRepoPort;
  sessionRepo: SessionRepoPort;
  permissionRepo: PermissionRepoPort;
  rolePermissionRepo: RolePermissionRepoPort;
  passwordHasher: BcryptPasswordHasher;
  tokenSigner: JoseTokenSigner;

  // Helper services (keep core pure)
  id: { uuid: () => string };
  clock: { nowISO: () => string };
}

declare global {
  // eslint-disable-next-line no-var
  var __aibosKernelContainer: KernelContainer | undefined;
}

const getGlobalContainer = (): KernelContainer | undefined => globalThis.__aibosKernelContainer;
const setGlobalContainer = (c: KernelContainer): void => {
  globalThis.__aibosKernelContainer = c;
};

/**
 * Get or create the kernel container
 * 
 * Uses singleton pattern so in-memory data persists
 * across requests during development (HMR-safe via globalThis).
 * 
 * Supports ADAPTER_TYPE environment variable:
 * - "sql" -> PostgreSQL adapters
 * - "memory" or undefined -> In-memory adapters (default)
 */
export function getKernelContainer(): KernelContainer {
  const existing = getGlobalContainer();
  if (existing) return existing;

  // Get JWT secret from environment
  const jwtSecret = process.env.KERNEL_JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("KERNEL_JWT_SECRET environment variable is required");
  }

  // Determine adapter type
  const adapterType = process.env.ADAPTER_TYPE || "memory";
  const useSql = adapterType === "sql";

  if (useSql) {
    return createSqlContainer(jwtSecret);
  } else {
    return createMemoryContainer(jwtSecret);
  }
}

/**
 * Create container with SQL adapters
 */
function createSqlContainer(jwtSecret: string): KernelContainer {
  const permissionRepo = new SqlPermissionRepo(db);
  const rolePermissionRepo = new SqlRolePermissionRepo(db);

  // Seed permissions asynchronously (SQL requires async)
  const now = new Date().toISOString();
  Promise.all(
    KERNEL_PERMISSIONS.map((perm) =>
      permissionRepo.upsert({
        permission_code: perm.code,
        description: perm.description,
        created_at: now,
      })
    )
  ).catch((err) => {
    console.error(`[Kernel] Permission seeding failed:`, err);
    // Don't throw - permissions may already exist
  });

  const created: KernelContainer = {
    tenantRepo: new SqlTenantRepo(db),
    audit: new SqlAuditRepo(db),
    canonRegistry: new SqlCanonRepo(db),
    routes: new SqlRouteRepo(db),
    eventBus: new SqlEventBus(db),
    userRepo: new SqlUserRepo(db),
    roleRepo: new SqlRoleRepo(db),
    credentialRepo: new SqlCredentialRepo(db),
    sessionRepo: new SqlSessionRepo(db),
    permissionRepo,
    rolePermissionRepo,
    passwordHasher: new BcryptPasswordHasher(),
    tokenSigner: new JoseTokenSigner(jwtSecret),
    id: { uuid: () => randomUUID() },
    clock: { nowISO: () => new Date().toISOString() },
  };
  setGlobalContainer(created);
  console.log(`[Kernel] Container initialized with SQL adapters + JWT auth + RBAC (${KERNEL_PERMISSIONS.length} permissions seeding)`);
  return created;
}

/**
 * Create container with in-memory adapters
 */
function createMemoryContainer(jwtSecret: string): KernelContainer {
  const permissionRepo = new InMemoryPermissionRepo();
  const rolePermissionRepo = new InMemoryRolePermissionRepo();

  // Seed permissions synchronously (in-memory Map.set is instant)
  const now = new Date().toISOString();
  for (const perm of KERNEL_PERMISSIONS) {
    permissionRepo.upsert({
      permission_code: perm.code,
      description: perm.description,
      created_at: now,
    }).catch((err) => {
      const errorMsg = `Permission seeding failed for ${perm.code}: ${err instanceof Error ? err.message : String(err)}`;
      console.error(`[Kernel] ${errorMsg}`);
      throw new Error(errorMsg);
    });
  }

  const created: KernelContainer = {
    tenantRepo: new InMemoryTenantRepo(),
    audit: new InMemoryAudit(),
    canonRegistry: new InMemoryCanonRegistry(),
    routes: new InMemoryRouteRegistry(),
    eventBus: new InMemoryEventBus(),
    userRepo: new InMemoryUserRepo(),
    roleRepo: new InMemoryRoleRepo(),
    credentialRepo: new InMemoryCredentialRepo(),
    sessionRepo: new InMemorySessionRepo(),
    permissionRepo,
    rolePermissionRepo,
    passwordHasher: new BcryptPasswordHasher(),
    tokenSigner: new JoseTokenSigner(jwtSecret),
    id: { uuid: () => randomUUID() },
    clock: { nowISO: () => new Date().toISOString() },
  };
  setGlobalContainer(created);
  console.log(`[Kernel] Container initialized with in-memory adapters + JWT auth + RBAC (${KERNEL_PERMISSIONS.length} permissions seeded)`);
  return created;
}

/**
 * Make kernel container (alias for getKernelContainer for consistency)
 */
export function makeKernelContainer(): KernelContainer {
  return getKernelContainer();
}

/**
 * Reset container (useful for testing)
 */
export function resetKernelContainer(): void {
  globalThis.__aibosKernelContainer = undefined;
}

