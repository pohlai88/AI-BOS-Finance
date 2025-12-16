/**
 * @aibos/kernel-core - Pure Business Logic Layer
 * 
 * This package contains:
 * - Domain models (pure data types)
 * - Ports (interfaces for external dependencies)
 * - Application use-cases (orchestration logic)
 * 
 * Anti-Gravity Rules:
 * - NO imports from apps/*
 * - NO imports from kernel-adapters
 * - NO imports from Next.js, Express, or any framework
 * - ONLY pure TypeScript + contracts
 */

// Domain
export * from './domain/tenant';
export * from './domain/registry';
export * from './domain/event';
export * from './domain/iam';
export * from './domain/auth';
export * from './domain/permission';

// Ports
export * from './ports/tenantRepo';
export * from './ports/auditPort';
export * from './ports/canonRegistryPort';
export * from './ports/routeRegistryPort';
export * from './ports/eventBusPort';
export * from './ports/userRepoPort';
export * from './ports/roleRepoPort';
export * from './ports/credentialRepoPort';
export * from './ports/sessionRepoPort';
export * from './ports/passwordHasherPort';
export * from './ports/tokenSignerPort';
export * from './ports/permissionRepoPort';
export * from './ports/rolePermissionRepoPort';

// AP-05 Payment Execution Cell Ports
export * from './ports/fiscalTimePort';
export * from './ports/policyPort';
export * from './ports/paymentRepositoryPort';
export * from './ports/glPostingPort';

// Export TransactionContext for use in other ports
export type { TransactionContext } from './ports/paymentRepositoryPort';

// Constants
export { KERNEL_PERMISSIONS } from './constants/permissions';
export { SYSTEM_TENANT_ID, NULL_UUID, TABLES, COLUMNS } from './constants/system';

// Database Schema Types (SSOT for adapters)
export * from './db';

// Application (use-cases)
export { createTenant } from './application/createTenant';
export { listTenants } from './application/listTenants';
export { registerCanon } from './application/registerCanon';
export { createRoute } from './application/createRoute';
export { listCanons, listRoutes } from './application/listRegistry';
export { resolveRoute } from './application/resolveRoute';
export { publishEvent } from './application/publishEvent';
export { queryAudit } from './application/queryAudit';
export { createUser } from './application/createUser';
export { listUsers } from './application/listUsers';
export { createRole } from './application/createRole';
export { listRoles } from './application/listRoles';
export { assignRole } from './application/assignRole';
export { setPassword } from './application/setPassword';
export { login } from './application/login';
export { me } from './application/me';
export { logout } from './application/logout';
export { authorize } from './application/authorize';
export { grantPermission } from './application/grantPermission';

