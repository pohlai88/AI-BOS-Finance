/**
 * Match Services - Server-side Dependency Injection
 * 
 * Provides initialized match services for BFF routes.
 * 
 * AP-03 3-Way Match & Controls Engine — Service Container
 * 
 * @file apps/web/lib/match-services.server.ts
 */

import {
  createMemoryMatchingRepository,
} from '@aibos/kernel-adapters';

import type {
  AuditPort,
  AuditEvent,
  MatchingRepositoryPort,
} from '@aibos/kernel-core';

import type {
  InvoiceValidationPort,
  PurchaseOrderPort,
  GoodsReceiptPort,
  MatchPolicyPort,
  MatchTransactionContext,
  InvoiceForMatch,
  ToleranceConfig,
  MatchMode,
  PolicySource,
  PurchaseOrderData,
  GoodsReceiptData,
  OverridePermissionPort,
} from '../../canon/finance/dom03-accounts-payable/cells/ap03-3way-engine';

// ============================================================================
// 1. MOCK ADAPTERS
// ============================================================================

class MockMatchAuditAdapter implements AuditPort {
  async append(): Promise<void> {}

  async emitTransactional(event: AuditEvent, _txContext: MatchTransactionContext): Promise<void> {
    console.log('[MATCH AUDIT]', event.eventType, event.entityId, JSON.stringify(event.payload));
  }

  async query() {
    return { events: [], total: 0 };
  }
}

class MockInvoiceValidationAdapter implements InvoiceValidationPort {
  private invoices: Map<string, InvoiceForMatch> = new Map();

  async getInvoiceForMatch(invoiceId: string, tenantId: string): Promise<InvoiceForMatch | null> {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice || invoice.tenantId !== tenantId) return null;
    return invoice;
  }

  async updateInvoiceMatchStatus(
    invoiceId: string,
    matchStatus: string,
    matchResultId: string,
    _tenantId: string
  ): Promise<void> {
    const invoice = this.invoices.get(invoiceId);
    if (invoice) {
      // Update in-memory (in production this would call invoice repo)
      console.log('[MATCH] Updated invoice', invoiceId, 'match status to', matchStatus);
    }
  }

  // Test helper
  addInvoice(invoice: InvoiceForMatch): void {
    this.invoices.set(invoice.id, invoice);
  }
}

class MockPurchaseOrderAdapter implements PurchaseOrderPort {
  private orders: Map<string, PurchaseOrderData> = new Map();

  async getPurchaseOrder(poNumber: string, _tenantId: string): Promise<PurchaseOrderData | null> {
    return this.orders.get(poNumber) || null;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  // Test helper
  addOrder(order: PurchaseOrderData): void {
    this.orders.set(order.poNumber, order);
  }
}

class MockGoodsReceiptAdapter implements GoodsReceiptPort {
  private receipts: Map<string, GoodsReceiptData[]> = new Map();

  async getGoodsReceipt(grnNumber: string, _tenantId: string): Promise<GoodsReceiptData | null> {
    for (const grns of this.receipts.values()) {
      const grn = grns.find(g => g.grnNumber === grnNumber);
      if (grn) return grn;
    }
    return null;
  }

  async getGoodsReceiptsForPO(poNumber: string, _tenantId: string): Promise<GoodsReceiptData[]> {
    return this.receipts.get(poNumber) || [];
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  // Test helper
  addReceipt(poNumber: string, receipt: GoodsReceiptData): void {
    const existing = this.receipts.get(poNumber) || [];
    existing.push(receipt);
    this.receipts.set(poNumber, existing);
  }
}

class MockMatchPolicyAdapter implements MatchPolicyPort {
  private defaultMode: MatchMode = '3-way';
  private vendorModes: Map<string, MatchMode> = new Map();

  async getMatchMode(
    _tenantId: string,
    vendorId: string,
    _categoryCode?: string
  ): Promise<{ mode: MatchMode; source: PolicySource }> {
    const vendorMode = this.vendorModes.get(vendorId);
    if (vendorMode) {
      return { mode: vendorMode, source: 'vendor' };
    }
    return { mode: this.defaultMode, source: 'tenant' };
  }

  async getTolerances(_tenantId: string, _vendorId?: string): Promise<ToleranceConfig> {
    return {
      priceTolerancePercent: 5,
      qtyTolerancePercent: 2,
      amountToleranceCents: 10000,
    };
  }

  // Test helpers
  setDefaultMode(mode: MatchMode): void {
    this.defaultMode = mode;
  }

  setVendorMode(vendorId: string, mode: MatchMode): void {
    this.vendorModes.set(vendorId, mode);
  }
}

class MockOverridePermissionAdapter implements OverridePermissionPort {
  private allowedUsers: Set<string> = new Set();

  async canOverrideMatch(userId: string, _tenantId: string): Promise<boolean> {
    // By default, allow all users in development
    return this.allowedUsers.size === 0 || this.allowedUsers.has(userId);
  }

  // Test helper
  allowUser(userId: string): void {
    this.allowedUsers.add(userId);
  }
}

// ============================================================================
// 2. SERVICE CONTAINER (Singleton)
// ============================================================================

interface MatchServiceContainer {
  matchRepo: MatchingRepositoryPort;
  auditPort: AuditPort;
  invoicePort: InvoiceValidationPort;
  poPort: PurchaseOrderPort;
  grnPort: GoodsReceiptPort;
  policyPort: MatchPolicyPort;
  permissionPort: OverridePermissionPort;
}

let _container: MatchServiceContainer | null = null;

/**
 * Get or create the service container
 */
export function getMatchServiceContainer(): MatchServiceContainer {
  if (!_container) {
    _container = {
      matchRepo: createMemoryMatchingRepository(),
      auditPort: new MockMatchAuditAdapter(),
      invoicePort: new MockInvoiceValidationAdapter(),
      poPort: new MockPurchaseOrderAdapter(),
      grnPort: new MockGoodsReceiptAdapter(),
      policyPort: new MockMatchPolicyAdapter(),
      permissionPort: new MockOverridePermissionAdapter(),
    };
  }
  return _container;
}

// ============================================================================
// 3. SERVICE FACTORY FUNCTIONS
// ============================================================================

let MatchServiceClass: typeof import('../../canon/finance/dom03-accounts-payable/cells/ap03-3way-engine').MatchService | null = null;
let OverrideServiceClass: typeof import('../../canon/finance/dom03-accounts-payable/cells/ap03-3way-engine').OverrideService | null = null;
let ExceptionServiceClass: typeof import('../../canon/finance/dom03-accounts-payable/cells/ap03-3way-engine').ExceptionService | null = null;

async function loadMatchServices() {
  if (!MatchServiceClass || !OverrideServiceClass || !ExceptionServiceClass) {
    const module = await import('../../canon/finance/dom03-accounts-payable/cells/ap03-3way-engine');
    MatchServiceClass = module.MatchService;
    OverrideServiceClass = module.OverrideService;
    ExceptionServiceClass = module.ExceptionService;
  }
}

/**
 * Get MatchService instance
 */
export async function getMatchService() {
  await loadMatchServices();
  const container = getMatchServiceContainer();

  return new MatchServiceClass!(
    container.matchRepo,
    container.invoicePort,
    container.poPort,
    container.grnPort,
    container.policyPort,
    container.auditPort
  );
}

/**
 * Get OverrideService instance
 */
export async function getOverrideService() {
  await loadMatchServices();
  const container = getMatchServiceContainer();

  return new OverrideServiceClass!(
    container.matchRepo,
    container.invoicePort,
    container.permissionPort,
    container.auditPort
  );
}

/**
 * Get ExceptionService instance
 */
export async function getExceptionService() {
  await loadMatchServices();
  const container = getMatchServiceContainer();

  return new ExceptionServiceClass!(
    container.matchRepo,
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
 */
export async function getMatchActorContext(): Promise<ActorContext> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session_id')?.value;

  return {
    userId: '00000000-0000-0000-0000-000000000002',
    tenantId: '00000000-0000-0000-0000-000000000001',
    companyId: '00000000-0000-0000-0000-000000000001',
    sessionId: sessionId || 'dev-session',
    type: 'user' as const,
    roles: ['ap_maker', 'ap_approver', 'ap_viewer', 'ap_match_override'],
  };
}
