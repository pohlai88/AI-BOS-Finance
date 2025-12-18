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

// AP-01 Vendor Master Cell
export { SqlVendorRepository, createSqlVendorRepository } from './vendorRepo.sql';

// AP-02 Invoice Entry Cell
export { SqlInvoiceRepository, createSqlInvoiceRepository } from './invoiceRepo.sql';

// AP-03 3-Way Match Engine
export { SqlMatchingRepository, createSqlMatchingRepository } from './matchingRepo.sql';

// AP-04 Invoice Approval Workflow
export { SqlApprovalRepository, createSqlApprovalRepository } from './approvalRepo.sql';

// AR-01 Customer Master Cell
export { SqlCustomerAdapter, createSqlCustomerAdapter } from './customerRepo.sql';

// GL-02 Journal Entry Cell
export { createJournalEntryRepository } from './journalEntryRepo.sql';

// TR-02 Cash Pooling Cell
export { SqlCashPoolRepository } from './cashPoolRepo.sql';

// TR-05 Bank Reconciliation Cell
export { SqlReconciliationRepository } from './reconciliationRepo.sql';

// GL Posting (GL-03)
export {
  SqlGLPostingAdapter,
  createSqlGLPostingAdapter,
  createAndInitGLPostingAdapter,
} from './glPosting.sql';

// Kernel Services (K_SEQ, K_COA)
export {
  SqlSequenceAdapter,
  createSqlSequenceAdapter,
  createAndInitSequenceAdapter,
} from './sequence.sql';

export {
  SqlCOAAdapter,
  createSqlCOAAdapter,
} from './coa.sql';

// Database utilities
export * from './pool-config';
export * from './db-errors';
export {
  OutboxDispatcher,
  createOutboxDispatcher,
  type OutboxEvent,
  type EventHandler,
  type OutboxDispatcherConfig,
} from './outboxDispatcher.sql';
