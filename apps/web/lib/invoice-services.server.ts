/**
 * Invoice Services - Server-side Dependency Injection
 * 
 * Provides initialized invoice services for BFF routes.
 * Uses memory adapters by default (for development).
 * In production, inject SQL adapters via environment config.
 * 
 * AP-02 Invoice Entry Cell - Service Container
 * 
 * @file apps/web/lib/invoice-services.server.ts
 */

import {
  createMemoryInvoiceRepository,
  createMemoryFiscalTimeAdapter,
  createMemoryGLPostingAdapter,
} from '@aibos/kernel-adapters';

import type {
  InvoiceRepositoryPort,
  AuditPort,
  AuditEvent,
  InvoiceTransactionContext,
} from '@aibos/kernel-core';

import type {
  VendorValidationPort,
  COAValidationPort,
} from '../../canon/finance/dom03-accounts-payable/cells/ap02-invoice-entry';

// ============================================================================
// 1. MOCK ADAPTERS
// ============================================================================

class MockInvoiceAuditAdapter implements AuditPort {
  async append(): Promise<void> {
    // No-op for mock
  }

  async emitTransactional(event: AuditEvent, _txContext: InvoiceTransactionContext): Promise<void> {
    console.log('[INVOICE AUDIT]', event.eventType, event.entityId, JSON.stringify(event.payload));
  }

  async query() {
    return { events: [], total: 0 };
  }
}

class MockVendorValidationAdapter implements VendorValidationPort {
  private approvedVendors: Map<string, { code: string; name: string }> = new Map();

  constructor() {
    // Add some default approved vendors for development
    this.approvedVendors.set('00000000-0000-0000-0000-000000000010', {
      code: 'V001',
      name: 'Acme Corporation',
    });
    this.approvedVendors.set('00000000-0000-0000-0000-000000000011', {
      code: 'V002',
      name: 'Global Supplies Ltd',
    });
    this.approvedVendors.set('00000000-0000-0000-0000-000000000012', {
      code: 'V003',
      name: 'Tech Services Inc',
    });
  }

  async isVendorApproved(vendorId: string, _tenantId: string): Promise<boolean> {
    return this.approvedVendors.has(vendorId);
  }

  async getVendorInfo(vendorId: string, _tenantId: string): Promise<{ code: string; name: string } | null> {
    return this.approvedVendors.get(vendorId) || null;
  }

  // Test helper
  addApprovedVendor(vendorId: string, code: string, name: string): void {
    this.approvedVendors.set(vendorId, { code, name });
  }
}

class MockCOAValidationAdapter implements COAValidationPort {
  private accounts: Map<string, { code: string; name: string; type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense' }> = new Map();

  constructor() {
    // Add default accounts for development
    this.accounts.set('1100', { code: '1100', name: 'Inventory', type: 'asset' });
    this.accounts.set('1200', { code: '1200', name: 'Prepaid Expenses', type: 'asset' });
    this.accounts.set('2000', { code: '2000', name: 'Accounts Payable', type: 'liability' });
    this.accounts.set('5100', { code: '5100', name: 'Operating Expenses', type: 'expense' });
    this.accounts.set('5200', { code: '5200', name: 'Office Supplies', type: 'expense' });
    this.accounts.set('5300', { code: '5300', name: 'Professional Fees', type: 'expense' });
    this.accounts.set('6100', { code: '6100', name: 'Tax Expense', type: 'expense' });
  }

  async isValidAccountCode(accountCode: string, _tenantId: string): Promise<boolean> {
    return this.accounts.has(accountCode);
  }

  async getAccountDetails(accountCode: string, _tenantId: string): Promise<{ code: string; name: string; type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense' } | null> {
    return this.accounts.get(accountCode) || null;
  }
}

// ============================================================================
// 2. SERVICE CONTAINER (Singleton)
// ============================================================================

interface InvoiceServiceContainer {
  invoiceRepo: InvoiceRepositoryPort;
  auditPort: AuditPort;
  vendorPort: VendorValidationPort;
  coaPort: COAValidationPort;
  fiscalTimePort: ReturnType<typeof createMemoryFiscalTimeAdapter>;
  glPostingPort: ReturnType<typeof createMemoryGLPostingAdapter>;
}

let _container: InvoiceServiceContainer | null = null;

/**
 * Get or create the service container
 * 
 * Uses memory adapters for development.
 * In production, this would use SQL adapters with a real database pool.
 */
export function getInvoiceServiceContainer(): InvoiceServiceContainer {
  if (!_container) {
    _container = {
      invoiceRepo: createMemoryInvoiceRepository(),
      auditPort: new MockInvoiceAuditAdapter(),
      vendorPort: new MockVendorValidationAdapter(),
      coaPort: new MockCOAValidationAdapter(),
      fiscalTimePort: createMemoryFiscalTimeAdapter(),
      glPostingPort: createMemoryGLPostingAdapter(),
    };
  }
  return _container;
}

// ============================================================================
// 3. SERVICE FACTORY FUNCTIONS
// ============================================================================

// Dynamic imports to avoid bundling issues in Edge runtime
let InvoiceServiceClass: typeof import('../../canon/finance/dom03-accounts-payable/cells/ap02-invoice-entry').InvoiceService | null = null;
let PostingServiceClass: typeof import('../../canon/finance/dom03-accounts-payable/cells/ap02-invoice-entry').PostingService | null = null;
let DuplicateDetectionServiceClass: typeof import('../../canon/finance/dom03-accounts-payable/cells/ap02-invoice-entry').DuplicateDetectionService | null = null;

async function loadInvoiceServices() {
  if (!InvoiceServiceClass || !PostingServiceClass || !DuplicateDetectionServiceClass) {
    const module = await import('../../canon/finance/dom03-accounts-payable/cells/ap02-invoice-entry');
    InvoiceServiceClass = module.InvoiceService;
    PostingServiceClass = module.PostingService;
    DuplicateDetectionServiceClass = module.DuplicateDetectionService;
  }
}

/**
 * Get InvoiceService instance
 */
export async function getInvoiceService() {
  await loadInvoiceServices();
  const container = getInvoiceServiceContainer();

  return new InvoiceServiceClass!(
    container.invoiceRepo,
    container.vendorPort,
    container.auditPort
  );
}

/**
 * Get PostingService instance (for GL posting workflow)
 */
export async function getPostingService() {
  await loadInvoiceServices();
  const container = getInvoiceServiceContainer();

  return new PostingServiceClass!(
    container.invoiceRepo,
    container.glPostingPort,
    container.fiscalTimePort,
    container.coaPort,
    container.auditPort
  );
}

/**
 * Get DuplicateDetectionService instance
 */
export async function getDuplicateDetectionService() {
  await loadInvoiceServices();
  const container = getInvoiceServiceContainer();

  return new DuplicateDetectionServiceClass!(
    container.invoiceRepo,
    container.auditPort
  );
}

// ============================================================================
// 4. ACTOR CONTEXT HELPERS
// ============================================================================

import { cookies } from 'next/headers';
import type { ActorContext } from '@aibos/canon-governance';

/**
 * Get actor context from the current request
 * 
 * In production, this would:
 * 1. Validate JWT from Authorization header
 * 2. Extract user info from session
 * 3. Verify tenant access
 * 
 * For development, returns a mock actor.
 */
export async function getInvoiceActorContext(): Promise<ActorContext> {
  // Try to get session from cookies
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session_id')?.value;

  // TODO: In production, validate session and extract user info
  // For now, return mock actor for development
  return {
    userId: '00000000-0000-0000-0000-000000000002',
    tenantId: '00000000-0000-0000-0000-000000000001',
    companyId: '00000000-0000-0000-0000-000000000001',
    sessionId: sessionId || 'dev-session',
    type: 'user' as const,
    roles: ['ap_maker', 'ap_approver', 'ap_viewer'],
  };
}

/**
 * Get tenant ID from request context
 */
export async function getInvoiceTenantId(): Promise<string> {
  const actor = await getInvoiceActorContext();
  return actor.tenantId;
}
