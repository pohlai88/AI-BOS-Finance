/**
 * AP-04: Invoice Approval Workflow — Test Setup
 * 
 * Provides test utilities and mock factories.
 */

import { v4 as uuidv4 } from 'uuid';
import type { ActorContext } from '@aibos/canon-governance';
import type { InvoiceForApproval, ApprovalRouteConfig } from '../ApprovalTypes';

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
    roles: options.roles || ['ap-clerk', 'finance_manager'],
  };
}

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

export function createTestInvoice(overrides: Partial<InvoiceForApproval> = {}): InvoiceForApproval {
  const tenantId = overrides.tenantId || uuidv4();
  return {
    id: uuidv4(),
    tenantId,
    vendorId: uuidv4(),
    vendorName: 'Test Vendor',
    invoiceNumber: `INV-${Date.now()}`,
    status: 'matched',
    matchStatus: 'passed',
    totalAmountCents: 50000, // $500
    currency: 'USD',
    createdBy: uuidv4(),
    submittedAt: new Date(),
    ...overrides,
  };
}

// ============================================================================
// MOCK ADAPTERS
// ============================================================================

export function createMockInvoicePort() {
  const invoices = new Map<string, InvoiceForApproval>();

  return {
    getInvoiceForApproval: async (invoiceId: string, tenantId: string) => {
      const invoice = invoices.get(invoiceId);
      if (!invoice || invoice.tenantId !== tenantId) return null;
      return invoice;
    },
    updateInvoiceApprovalStatus: async () => {},
    addInvoice: (invoice: InvoiceForApproval) => {
      invoices.set(invoice.id, invoice);
    },
    clear: () => invoices.clear(),
  };
}

export function createMockPolicyPort() {
  return {
    getApprovalRoute: async (_invoiceId: string, amountCents: number): Promise<ApprovalRouteConfig> => {
      if (amountCents >= 1000000) {
        return {
          levels: [
            { level: 1, role: 'finance_manager' },
            { level: 2, role: 'controller' },
          ],
          policySource: 'amount',
        };
      }
      return {
        levels: [{ level: 1, role: 'finance_manager' }],
        policySource: 'default',
      };
    },
    isUserApprover: async () => true,
    getDelegateFor: async () => null,
  };
}

export function createMockAuditPort() {
  const events: unknown[] = [];

  return {
    emit: async (event: unknown) => events.push(event),
    emitTransactional: async (event: unknown) => events.push(event),
    getEvents: () => [...events],
    clear: () => { events.length = 0; },
  };
}
