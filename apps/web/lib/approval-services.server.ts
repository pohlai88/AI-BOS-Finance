/**
 * Approval Services - Server-side Dependency Injection
 * 
 * AP-04 Invoice Approval Workflow — Service Container
 * 
 * @file apps/web/lib/approval-services.server.ts
 */

import { createMemoryApprovalRepository } from '@aibos/kernel-adapters';

import type {
  ApprovalRepositoryPort,
  AuditPort,
  AuditEvent,
} from '@aibos/kernel-core';

import type {
  ApprovalTransactionContext,
  InvoiceForApproval,
  ApprovalRouteConfig,
  InvoiceApprovalPort,
  ApprovalPolicyPort,
} from '../../canon/finance/dom03-accounts-payable/cells/ap04-invoice-submit-approval';

// ============================================================================
// 1. MOCK ADAPTERS
// ============================================================================

class MockApprovalAuditAdapter implements AuditPort {
  async append(): Promise<void> {}

  async emitTransactional(event: AuditEvent, _txContext: ApprovalTransactionContext): Promise<void> {
    console.log('[APPROVAL AUDIT]', event.eventType, event.entityId);
  }

  async query() {
    return { events: [], total: 0 };
  }
}

class MockInvoiceApprovalAdapter implements InvoiceApprovalPort {
  private invoices: Map<string, InvoiceForApproval> = new Map();

  async getInvoiceForApproval(invoiceId: string, tenantId: string): Promise<InvoiceForApproval | null> {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice || invoice.tenantId !== tenantId) return null;
    return invoice;
  }

  async updateInvoiceApprovalStatus(invoiceId: string, status: string, _tenantId: string): Promise<void> {
    console.log('[APPROVAL] Updated invoice', invoiceId, 'to status', status);
  }

  addInvoice(invoice: InvoiceForApproval): void {
    this.invoices.set(invoice.id, invoice);
  }
}

class MockApprovalPolicyAdapter implements ApprovalPolicyPort {
  async getApprovalRoute(
    _invoiceId: string,
    amountCents: number,
    _tenantId: string,
    _vendorId: string
  ): Promise<ApprovalRouteConfig> {
    // Amount-based routing
    if (amountCents >= 5000000) { // $50,000+
      return {
        levels: [
          { level: 1, role: 'finance_manager' },
          { level: 2, role: 'controller' },
          { level: 3, role: 'cfo' },
        ],
        policySource: 'amount',
      };
    }
    if (amountCents >= 1000000) { // $10,000+
      return {
        levels: [
          { level: 1, role: 'finance_manager' },
          { level: 2, role: 'controller' },
        ],
        policySource: 'amount',
      };
    }
    return {
      levels: [
        { level: 1, role: 'finance_manager' },
      ],
      policySource: 'default',
    };
  }

  async isUserApprover(_userId: string, _level: number, _tenantId: string): Promise<boolean> {
    return true; // Allow all in development
  }

  async getDelegateFor(_userId: string, _tenantId: string): Promise<string | null> {
    return null;
  }
}

// ============================================================================
// 2. SERVICE CONTAINER
// ============================================================================

interface ApprovalServiceContainer {
  approvalRepo: ApprovalRepositoryPort;
  auditPort: AuditPort;
  invoicePort: InvoiceApprovalPort;
  policyPort: ApprovalPolicyPort;
}

let _container: ApprovalServiceContainer | null = null;

export function getApprovalServiceContainer(): ApprovalServiceContainer {
  if (!_container) {
    _container = {
      approvalRepo: createMemoryApprovalRepository(),
      auditPort: new MockApprovalAuditAdapter(),
      invoicePort: new MockInvoiceApprovalAdapter(),
      policyPort: new MockApprovalPolicyAdapter(),
    };
  }
  return _container;
}

// ============================================================================
// 3. SERVICE FACTORY
// ============================================================================

let ApprovalServiceClass: typeof import('../../canon/finance/dom03-accounts-payable/cells/ap04-invoice-submit-approval').ApprovalService | null = null;

async function loadApprovalServices() {
  if (!ApprovalServiceClass) {
    const module = await import('../../canon/finance/dom03-accounts-payable/cells/ap04-invoice-submit-approval');
    ApprovalServiceClass = module.ApprovalService;
  }
}

export async function getApprovalService() {
  await loadApprovalServices();
  const container = getApprovalServiceContainer();

  return new ApprovalServiceClass!(
    container.approvalRepo,
    container.invoicePort,
    container.policyPort,
    container.auditPort
  );
}

// ============================================================================
// 4. ACTOR CONTEXT
// ============================================================================

import { cookies } from 'next/headers';
import type { ActorContext } from '@aibos/canon-governance';

export async function getApprovalActorContext(): Promise<ActorContext> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session_id')?.value;

  return {
    userId: '00000000-0000-0000-0000-000000000002',
    tenantId: '00000000-0000-0000-0000-000000000001',
    companyId: '00000000-0000-0000-0000-000000000001',
    sessionId: sessionId || 'dev-session',
    type: 'user' as const,
    roles: ['ap_maker', 'ap_approver', 'finance_manager'],
  };
}
