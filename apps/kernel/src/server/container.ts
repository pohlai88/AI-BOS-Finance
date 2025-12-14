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
 */

import {
  InMemoryTenantRepo,
  InMemoryAudit,
  InMemoryCanonRegistry,
  InMemoryRouteRegistry,
  InMemoryEventBus,
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

  const created: KernelContainer = {
    tenantRepo: new InMemoryTenantRepo(),
    audit: new InMemoryAudit(),
    canonRegistry: new InMemoryCanonRegistry(),
    routes: new InMemoryRouteRegistry(),
    eventBus: new InMemoryEventBus(),
  };
  setGlobalContainer(created);
  console.log("[Kernel] Container initialized with in-memory adapters");
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

