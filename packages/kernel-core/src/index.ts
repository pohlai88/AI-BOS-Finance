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
export * from './ports/vendorRepositoryPort';
export * from './ports/glPostingPort';

// AP-02 Invoice Entry Cell Ports
export * from './ports/invoiceRepositoryPort';

// AP-03 3-Way Match Engine Ports
export * from './ports/matchingRepositoryPort';

// AP-04 Invoice Approval Workflow Ports
export * from './ports/approvalRepositoryPort';

// AR-01 Customer Master Ports
export * from './ports/customerRepositoryPort';

// AR-02 Sales Invoice Ports
export * from './ports/invoiceRepositoryPort';

// AR-03 Receipt Processing Ports
export * from './ports/receiptRepositoryPort';

// AR-04 Credit Note Ports
export * from './ports/creditNoteRepositoryPort';

// AR-05 AR Aging Ports
export * from './ports/agingRepositoryPort';

// GL-02 Journal Entry Ports
export * from './ports/journalEntryRepositoryPort';

// TR-02 Cash Pooling Ports
export * from './ports/cashPoolRepositoryPort';

// TR-05 Bank Reconciliation Ports
export * from './ports/reconciliationRepositoryPort';

// Kernel Services Ports
export * from './ports/sequencePort';  // K_SEQ - Sequence generation
export * from './ports/coaPort';        // K_COA - Chart of Accounts
export * from './ports/fxPort';         // K_FX - Foreign Exchange (Multi-Currency)

// Procurement Integration Ports (for AP-03)
export * from './ports/purchaseOrderPort';   // PO data
export * from './ports/goodsReceiptPort';    // GRN data

// Canvas/Lively Layer Ports (DOM-03)
export * from './ports/canvasRepositoryPort'; // Canvas objects & zones

// Export TransactionContext for use in other ports
export type { TransactionContext } from './ports/paymentRepositoryPort';
export type { AuditEvent } from './ports/auditPort';

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

