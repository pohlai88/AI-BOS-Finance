/**
 * SQL Adapters
 * 
 * PostgreSQL implementations of kernel-core ports.
 * Uses pg library for database access.
 */

export { SqlTenantRepo } from './tenantRepo.sql';
export { SqlUserRepo } from './userRepo.sql';
export { SqlRoleRepo } from './roleRepo.sql';
export { SqlSessionRepo } from './sessionRepo.sql';
export { SqlPermissionRepo } from './permissionRepo.sql';
export { SqlRolePermissionRepo } from './rolePermissionRepo.sql';
export { SqlCanonRepo } from './canonRepo.sql';
export { SqlRouteRepo } from './routeRepo.sql';
export { SqlEventBus } from './eventBus.sql';
export { SqlAuditRepo } from './auditRepo.sql';
export { SqlCredentialRepo } from './credentialRepo.sql';

// AP-05 Payment Execution Cell
export { SqlPaymentRepository, createSqlPaymentRepository } from './paymentRepo.sql';
export {
  OutboxDispatcher,
  createOutboxDispatcher,
  type OutboxEvent,
  type EventHandler,
  type OutboxDispatcherConfig,
} from './outboxDispatcher.sql';
