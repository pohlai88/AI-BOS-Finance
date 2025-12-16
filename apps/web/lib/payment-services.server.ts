/**
 * Payment Services - Server-side Dependency Injection
 * 
 * Provides initialized payment services for BFF routes.
 * Uses memory adapters by default (for development).
 * In production, inject SQL adapters via environment config.
 * 
 * @file apps/web/lib/payment-services.server.ts
 */

import {
  createMemoryPaymentRepository,
  createMemoryFiscalTimeAdapter,
  createMemoryPolicyAdapter,
  createMemoryGLPostingAdapter,
} from '@aibos/kernel-adapters';

import type {
  PaymentRepositoryPort,
  FiscalTimePort,
  AuditPort,
  EventBusPort,
  PolicyPort,
  GLPostingPort,
  AuditEvent,
  TransactionContext,
} from '@aibos/kernel-core';

// ============================================================================
// 1. MOCK AUDIT ADAPTER (logs to console)
// ============================================================================

class MockAuditAdapter implements AuditPort {
  async append(): Promise<void> {
    // No-op for mock
  }

  async emitTransactional(event: AuditEvent, _txContext: TransactionContext): Promise<void> {
    console.log('[AUDIT]', event.eventType, event.entityId, JSON.stringify(event.payload));
  }

  async query() {
    return { events: [], total: 0 };
  }
}

// ============================================================================
// 2. MOCK EVENT BUS ADAPTER (logs to console)
// ============================================================================

class MockEventBusAdapter implements EventBusPort {
  async writeToOutbox(
    eventType: string,
    payload: Record<string, unknown>,
    _txContext: TransactionContext
  ): Promise<void> {
    console.log('[OUTBOX]', eventType, JSON.stringify(payload));
  }
}

// ============================================================================
// 3. SERVICE CONTAINER (Singleton)
// ============================================================================

interface PaymentServiceContainer {
  paymentRepo: PaymentRepositoryPort;
  fiscalTimePort: FiscalTimePort;
  auditPort: AuditPort;
  eventBusPort: EventBusPort;
  policyPort: PolicyPort;
  glPostingPort: GLPostingPort;
}

let _container: PaymentServiceContainer | null = null;

/**
 * Get or create the service container
 * 
 * Uses memory adapters for development.
 * In production, this would use SQL adapters with a real database pool.
 */
export function getPaymentServiceContainer(): PaymentServiceContainer {
  if (!_container) {
    _container = {
      paymentRepo: createMemoryPaymentRepository(),
      fiscalTimePort: createMemoryFiscalTimeAdapter(),
      auditPort: new MockAuditAdapter(),
      eventBusPort: new MockEventBusAdapter(),
      policyPort: createMemoryPolicyAdapter(),
      glPostingPort: createMemoryGLPostingAdapter(),
    };
  }
  return _container;
}

// ============================================================================
// 4. SERVICE FACTORY FUNCTIONS
// ============================================================================

// Dynamic imports to avoid bundling issues in Edge runtime
let PaymentServiceClass: typeof import('../../canon/finance/accounts-payable/cells/payment-execution').PaymentService | null = null;
let ApprovalServiceClass: typeof import('../../canon/finance/accounts-payable/cells/payment-execution').ApprovalService | null = null;
let ExecutionServiceClass: typeof import('../../canon/finance/accounts-payable/cells/payment-execution').ExecutionService | null = null;

async function loadServices() {
  if (!PaymentServiceClass || !ApprovalServiceClass || !ExecutionServiceClass) {
    const module = await import('../../canon/finance/accounts-payable/cells/payment-execution');
    PaymentServiceClass = module.PaymentService;
    ApprovalServiceClass = module.ApprovalService;
    ExecutionServiceClass = module.ExecutionService;
  }
}

/**
 * Get PaymentService instance
 */
export async function getPaymentService() {
  await loadServices();
  const container = getPaymentServiceContainer();

  return new PaymentServiceClass!(
    container.paymentRepo,
    container.auditPort,
    container.fiscalTimePort,
    container.eventBusPort
  );
}

/**
 * Get ApprovalService instance
 */
export async function getApprovalService() {
  await loadServices();
  const container = getPaymentServiceContainer();

  return new ApprovalServiceClass!(
    container.paymentRepo,
    container.auditPort,
    container.policyPort,
    container.eventBusPort
  );
}

/**
 * Get ExecutionService instance
 */
export async function getExecutionService() {
  await loadServices();
  const container = getPaymentServiceContainer();

  return new ExecutionServiceClass!(
    container.paymentRepo,
    container.auditPort,
    container.eventBusPort,
    container.glPostingPort
  );
}

// ============================================================================
// 5. ACTOR CONTEXT HELPERS
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
export async function getActorContext(): Promise<ActorContext> {
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
    roles: ['ap_maker', 'ap_viewer'],
  };
}

/**
 * Get tenant ID from request context
 */
export async function getTenantId(): Promise<string> {
  const actor = await getActorContext();
  return actor.tenantId;
}
