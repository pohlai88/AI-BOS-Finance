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
  BcryptPasswordHasher,
  JoseTokenSigner,
} from "@aibos/kernel-adapters";
import { KERNEL_PERMISSIONS } from "@aibos/kernel-core";

/**
 * Kernel container type
 */
export interface KernelContainer {
  tenantRepo: InMemoryTenantRepo;
  audit: InMemoryAudit;
  canonRegistry: InMemoryCanonRegistry;
  routes: InMemoryRouteRegistry;
  eventBus: InMemoryEventBus;
  userRepo: InMemoryUserRepo;
  roleRepo: InMemoryRoleRepo;
  credentialRepo: InMemoryCredentialRepo;
  sessionRepo: InMemorySessionRepo;
  permissionRepo: InMemoryPermissionRepo;
  rolePermissionRepo: InMemoryRolePermissionRepo;
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
 */
export function getKernelContainer(): KernelContainer {
  const existing = getGlobalContainer();
  if (existing) return existing;

  // Get JWT secret from environment
  const jwtSecret = process.env.KERNEL_JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("KERNEL_JWT_SECRET environment variable is required");
  }

  const permissionRepo = new InMemoryPermissionRepo();
  const rolePermissionRepo = new InMemoryRolePermissionRepo();

  // Seed permissions (idempotent) - fail fast if seeding fails
  // For in-memory repo, upsert() calls Map.set which is synchronous
  // Since getKernelContainer() is synchronous, we seed synchronously
  // In production with DB adapter, this would need async initialization
  const now = new Date().toISOString();

  // Seed all permissions synchronously (in-memory Map.set is instant and can't fail)
  // For in-memory repo, upsert() is effectively synchronous
  // We call it without await since Map.set is synchronous and can't throw
  for (const perm of KERNEL_PERMISSIONS) {
    // Directly call the Map.set operation (synchronous, can't fail)
    // In production with DB adapter, this would need to be awaited
    permissionRepo.upsert({
      permission_code: perm.code,
      description: perm.description,
      created_at: now,
    }).catch((err) => {
      // This should never happen for in-memory repo, but fail fast if it does
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

