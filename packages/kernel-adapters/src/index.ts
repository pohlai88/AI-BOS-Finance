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
export { InMemoryCredentialRepo } from './memory/credentialRepo.memory';
export { InMemorySessionRepo } from './memory/sessionRepo.memory';
export { InMemoryPermissionRepo } from './memory/permissionRepo.memory';
export { InMemoryRolePermissionRepo } from './memory/rolePermissionRepo.memory';

// AP-05 Payment Execution Cell Adapters (In-Memory)
export {
  createMemoryFiscalTimeAdapter,
  setPeriodStatus,
  clearPeriods,
} from './memory/fiscalTime.memory';
export {
  createMemoryPolicyAdapter,
  setUserRoles,
  addSoDExemption,
  clearPolicyData,
} from './memory/policy.memory';
export {
  createMemoryPaymentRepository,
  clearPaymentData,
  getPaymentCount,
  getRawPayment,
} from './memory/paymentRepo.memory';
export {
  createMemoryGLPostingAdapter,
  clearGLData,
  getJournalCount,
  getRawJournal,
} from './memory/glPosting.memory';

// SQL adapters (PostgreSQL)
export {
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
  SqlPaymentRepository,
  createSqlPaymentRepository,
} from './sql';

// Auth adapters (bcryptjs, jose)
export { BcryptPasswordHasher } from './auth/bcryptHasher';
export { JoseTokenSigner } from './auth/joseTokenSigner';

