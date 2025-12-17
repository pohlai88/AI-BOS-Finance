/**
 * AP-02 Invoice Entry Cell - Test Setup
 * 
 * Provides test utilities and mock factories for invoice testing.
 */

import { v4 as uuidv4 } from 'uuid';
import type { ActorContext } from '@aibos/canon-governance';

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
    roles: options.roles || ['ap-clerk'],
  };
}

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

export function createTestInvoiceInput(overrides: Record<string, unknown> = {}) {
  return {
    companyId: uuidv4(),
    invoiceNumber: `INV-${Date.now()}`,
    invoiceDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    vendorId: uuidv4(),
    currency: 'USD',
    lines: [
      {
        description: 'Test Item 1',
        quantity: 1,
        unitPriceCents: 10000, // $100.00
        debitAccountCode: '5100', // Expenses
      },
    ],
    ...overrides,
  };
}

export function createTestInvoiceLineInput(overrides: Record<string, unknown> = {}) {
  return {
    description: 'Test Item',
    quantity: 1,
    unitPriceCents: 10000, // $100.00
    debitAccountCode: '5100', // Expenses
    creditAccountCode: '2000', // AP Payable
    ...overrides,
  };
}

// ============================================================================
// MOCK ADAPTERS
// ============================================================================

/**
 * Create a mock vendor validation port
 */
export function createMockVendorPort(options: {
  approvedVendors?: Set<string>;
  vendorInfo?: Map<string, { code: string; name: string }>;
} = {}) {
  const approvedVendors = options.approvedVendors || new Set<string>();
  const vendorInfo = options.vendorInfo || new Map<string, { code: string; name: string }>();

  return {
    isVendorApproved: async (vendorId: string, _tenantId: string) => {
      return approvedVendors.has(vendorId);
    },
    getVendorInfo: async (vendorId: string, _tenantId: string) => {
      return vendorInfo.get(vendorId) || null;
    },
    // Test helpers
    addApprovedVendor: (vendorId: string, code: string, name: string) => {
      approvedVendors.add(vendorId);
      vendorInfo.set(vendorId, { code, name });
    },
    clear: () => {
      approvedVendors.clear();
      vendorInfo.clear();
    },
  };
}

/**
 * Create a mock audit port
 */
export function createMockAuditPort() {
  const events: unknown[] = [];

  return {
    emit: async (event: unknown) => {
      events.push(event);
    },
    emitTransactional: async (event: unknown, _txContext: unknown) => {
      events.push(event);
    },
    // Test helpers
    getEvents: () => [...events],
    clear: () => {
      events.length = 0;
    },
  };
}

/**
 * Create a mock fiscal time port
 */
export function createMockFiscalTimePort(options: {
  openPeriods?: Set<string>; // Set of date strings in YYYY-MM format
} = {}) {
  const openPeriods = options.openPeriods || new Set(['2025-01', '2025-02', '2025-03']);

  return {
    isPeriodOpen: async (date: Date, _tenantId: string) => {
      const periodKey = date.toISOString().slice(0, 7); // YYYY-MM
      return openPeriods.has(periodKey);
    },
    getCurrentPeriod: async (_tenantId: string) => {
      const now = new Date();
      return {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        isOpen: true,
      };
    },
    // Test helpers
    setOpenPeriod: (periodKey: string, isOpen: boolean) => {
      if (isOpen) {
        openPeriods.add(periodKey);
      } else {
        openPeriods.delete(periodKey);
      }
    },
    clear: () => {
      openPeriods.clear();
    },
  };
}

/**
 * Create a mock COA validation port
 */
export function createMockCOAPort(options: {
  validAccounts?: Map<string, { code: string; name: string; type: string }>;
} = {}) {
  const validAccounts = options.validAccounts || new Map([
    ['2000', { code: '2000', name: 'Accounts Payable', type: 'liability' }],
    ['5100', { code: '5100', name: 'Operating Expenses', type: 'expense' }],
    ['6100', { code: '6100', name: 'Tax Expense', type: 'expense' }],
    ['1100', { code: '1100', name: 'Inventory', type: 'asset' }],
  ]);

  return {
    isValidAccountCode: async (accountCode: string, _tenantId: string) => {
      return validAccounts.has(accountCode);
    },
    getAccountDetails: async (accountCode: string, _tenantId: string) => {
      return validAccounts.get(accountCode) || null;
    },
    // Test helpers
    addAccount: (code: string, name: string, type: string) => {
      validAccounts.set(code, { code, name, type });
    },
    clear: () => {
      validAccounts.clear();
    },
  };
}

/**
 * Create a mock GL posting port
 */
export function createMockGLPostingPort() {
  const journals: Map<string, unknown> = new Map();
  let shouldFail = false;
  let failureReason = '';

  return {
    postJournal: async (input: unknown) => {
      if (shouldFail) {
        return {
          success: false,
          error: failureReason,
        };
      }

      const journalHeaderId = uuidv4();
      const journalNumber = `JE-${Date.now()}`;
      journals.set(journalHeaderId, { ...input as object, journalHeaderId, journalNumber });

      return {
        success: true,
        journalHeaderId,
        journalNumber,
      };
    },
    // Test helpers
    setFailure: (reason: string) => {
      shouldFail = true;
      failureReason = reason;
    },
    clearFailure: () => {
      shouldFail = false;
      failureReason = '';
    },
    getJournals: () => journals,
    clear: () => {
      journals.clear();
      shouldFail = false;
      failureReason = '';
    },
  };
}

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Wait for a specified duration
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a random amount in cents
 */
export function randomAmountCents(min = 1000, max = 100000): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random invoice number
 */
export function randomInvoiceNumber(): string {
  return `INV-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}
