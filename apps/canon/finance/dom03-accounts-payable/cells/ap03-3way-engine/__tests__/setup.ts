/**
 * AP-03: 3-Way Match & Controls Engine — Test Setup
 * 
 * Provides test utilities and mock factories for match testing.
 */

import { v4 as uuidv4 } from 'uuid';
import type { ActorContext } from '@aibos/canon-governance';
import type {
  MatchMode,
  PolicySource,
  ToleranceConfig,
  InvoiceForMatch,
  PurchaseOrderData,
  GoodsReceiptData,
} from '../MatchTypes';

// ============================================================================
// TEST ACTOR FACTORY
// ============================================================================

export interface TestActorOptions {
  userId?: string;
  tenantId?: string;
  roles?: string[];
}

export function createTestActor(options: TestActorOptions = {}): ActorContext {
  return {
    userId: options.userId || uuidv4(),
    tenantId: options.tenantId || uuidv4(),
    roles: options.roles || ['ap-clerk', 'ap-match-override'],
  };
}

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

export function createTestInvoice(overrides: Partial<InvoiceForMatch> = {}): InvoiceForMatch {
  const tenantId = overrides.tenantId || uuidv4();
  return {
    id: uuidv4(),
    tenantId,
    vendorId: uuidv4(),
    invoiceNumber: `INV-${Date.now()}`,
    status: 'submitted',
    subtotalCents: 10000,
    taxAmountCents: 0,
    totalAmountCents: 10000,
    currency: 'USD',
    lines: [
      {
        lineNumber: 1,
        description: 'Test Item',
        quantity: 1,
        unitPriceCents: 10000,
        lineAmountCents: 10000,
      },
    ],
    ...overrides,
  };
}

export function createTestPO(overrides: Partial<PurchaseOrderData> = {}): PurchaseOrderData {
  return {
    poNumber: `PO-${Date.now()}`,
    vendorId: uuidv4(),
    currency: 'USD',
    totalCents: 10000,
    status: 'open',
    createdAt: new Date(),
    lines: [
      {
        lineNumber: 1,
        description: 'Test Item',
        quantity: 1,
        unitPriceCents: 10000,
        totalCents: 10000,
      },
    ],
    ...overrides,
  };
}

export function createTestGRN(overrides: Partial<GoodsReceiptData> = {}): GoodsReceiptData {
  return {
    grnNumber: `GRN-${Date.now()}`,
    poNumber: `PO-${Date.now()}`,
    vendorId: uuidv4(),
    totalReceivedQty: 1,
    status: 'received',
    receivedAt: new Date(),
    lines: [
      {
        lineNumber: 1,
        poLineNumber: 1,
        receivedQty: 1,
        receivedAt: new Date(),
      },
    ],
    ...overrides,
  };
}

// ============================================================================
// MOCK ADAPTERS
// ============================================================================

export function createMockInvoicePort() {
  const invoices = new Map<string, InvoiceForMatch>();

  return {
    getInvoiceForMatch: async (invoiceId: string, tenantId: string) => {
      const invoice = invoices.get(invoiceId);
      if (!invoice || invoice.tenantId !== tenantId) return null;
      return invoice;
    },
    updateInvoiceMatchStatus: async () => {},
    addInvoice: (invoice: InvoiceForMatch) => {
      invoices.set(invoice.id, invoice);
    },
    clear: () => invoices.clear(),
  };
}

export function createMockPOPort() {
  const orders = new Map<string, PurchaseOrderData>();

  return {
    getPurchaseOrder: async (poNumber: string) => {
      return orders.get(poNumber) || null;
    },
    isAvailable: async () => true,
    addOrder: (order: PurchaseOrderData) => {
      orders.set(order.poNumber, order);
    },
    clear: () => orders.clear(),
  };
}

export function createMockGRNPort() {
  const receipts = new Map<string, GoodsReceiptData[]>();

  return {
    getGoodsReceipt: async (grnNumber: string) => {
      for (const grns of receipts.values()) {
        const grn = grns.find(g => g.grnNumber === grnNumber);
        if (grn) return grn;
      }
      return null;
    },
    getGoodsReceiptsForPO: async (poNumber: string) => {
      return receipts.get(poNumber) || [];
    },
    isAvailable: async () => true,
    addReceipt: (poNumber: string, receipt: GoodsReceiptData) => {
      const existing = receipts.get(poNumber) || [];
      existing.push(receipt);
      receipts.set(poNumber, existing);
    },
    clear: () => receipts.clear(),
  };
}

export function createMockPolicyPort(defaultMode: MatchMode = '3-way') {
  const vendorModes = new Map<string, MatchMode>();

  return {
    getMatchMode: async (_tenantId: string, vendorId: string): Promise<{ mode: MatchMode; source: PolicySource }> => {
      const mode = vendorModes.get(vendorId) || defaultMode;
      return { mode, source: vendorModes.has(vendorId) ? 'vendor' : 'tenant' };
    },
    getTolerances: async (): Promise<ToleranceConfig> => ({
      priceTolerancePercent: 5,
      qtyTolerancePercent: 2,
      amountToleranceCents: 10000,
    }),
    setVendorMode: (vendorId: string, mode: MatchMode) => {
      vendorModes.set(vendorId, mode);
    },
    clear: () => vendorModes.clear(),
  };
}

export function createMockAuditPort() {
  const events: unknown[] = [];

  return {
    emit: async (event: unknown) => {
      events.push(event);
    },
    emitTransactional: async (event: unknown) => {
      events.push(event);
    },
    getEvents: () => [...events],
    clear: () => {
      events.length = 0;
    },
  };
}

export function createMockPermissionPort(allowAll = true) {
  const allowedUsers = new Set<string>();

  return {
    canOverrideMatch: async (userId: string) => {
      return allowAll || allowedUsers.has(userId);
    },
    allowUser: (userId: string) => {
      allowedUsers.add(userId);
    },
    clear: () => allowedUsers.clear(),
  };
}
