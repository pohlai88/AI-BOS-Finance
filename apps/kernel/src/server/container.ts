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
  BcryptPasswordHasher,
  JoseTokenSigner,
} from "@aibos/kernel-adapters";

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
    passwordHasher: new BcryptPasswordHasher(),
    tokenSigner: new JoseTokenSigner(jwtSecret),
    id: { uuid: () => randomUUID() },
    clock: { nowISO: () => new Date().toISOString() },
  };
  setGlobalContainer(created);
  console.log("[Kernel] Container initialized with in-memory adapters + JWT auth");
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

