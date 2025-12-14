/**
 * @aibos/kernel-adapters - Infrastructure Implementations
 * 
 * This package contains concrete implementations of kernel-core ports.
 * 
 * Anti-Gravity Rules:
 * - CAN import from @aibos/kernel-core (ports)
 * - CAN import from @aibos/contracts (schemas)
 * - NO imports from apps/*
 * - NO imports from UI components
 */

// In-memory adapters (for development and testing)
export { InMemoryTenantRepo } from './memory/tenantRepo.memory';
export { InMemoryAudit } from './memory/audit.memory';
export { InMemoryCanonRegistry } from './memory/canonRegistry.memory';
export { InMemoryRouteRegistry } from './memory/routeRegistry.memory';
export { InMemoryEventBus } from './memory/eventBus.memory';
export { InMemoryUserRepo } from './memory/userRepo.memory';
export { InMemoryRoleRepo } from './memory/roleRepo.memory';

