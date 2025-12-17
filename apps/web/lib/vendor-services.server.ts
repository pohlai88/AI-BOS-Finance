/**
 * Vendor Services - Server-side Dependency Injection
 * 
 * Provides initialized vendor services for BFF routes.
 * Uses memory adapters by default (for development).
 * In production, inject SQL adapters via environment config.
 * 
 * AP-01 Vendor Master Cell - Service Container
 * 
 * @file apps/web/lib/vendor-services.server.ts
 */

import {
  createMemoryVendorRepository,
  createMemoryPolicyAdapter,
} from '@aibos/kernel-adapters';

import type {
  VendorRepositoryPort,
  AuditPort,
  PolicyPort,
  AuditEvent,
  TransactionContext,
} from '@aibos/kernel-core';

// ============================================================================
// 1. MOCK AUDIT ADAPTER (logs to console)
// ============================================================================

class MockVendorAuditAdapter implements AuditPort {
  async append(): Promise<void> {
    // No-op for mock
  }

  async emitTransactional(event: AuditEvent, _txContext: TransactionContext): Promise<void> {
    console.log('[VENDOR AUDIT]', event.eventType, event.entityId, JSON.stringify(event.payload));
  }

  async query() {
    return { events: [], total: 0 };
  }
}

// ============================================================================
// 2. SERVICE CONTAINER (Singleton)
// ============================================================================

interface VendorServiceContainer {
  vendorRepo: VendorRepositoryPort;
  auditPort: AuditPort;
  policyPort: PolicyPort;
}

let _container: VendorServiceContainer | null = null;

/**
 * Get or create the service container
 * 
 * Uses memory adapters for development.
 * In production, this would use SQL adapters with a real database pool.
 */
export function getVendorServiceContainer(): VendorServiceContainer {
  if (!_container) {
    _container = {
      vendorRepo: createMemoryVendorRepository(),
      auditPort: new MockVendorAuditAdapter(),
      policyPort: createMemoryPolicyAdapter(),
    };
  }
  return _container;
}

// ============================================================================
// 3. SERVICE FACTORY FUNCTIONS
// ============================================================================

// Dynamic imports to avoid bundling issues in Edge runtime
let VendorServiceClass: typeof import('../../canon/finance/dom03-accounts-payable/cells/ap01-vendor-master').VendorService | null = null;
let ApprovalServiceClass: typeof import('../../canon/finance/dom03-accounts-payable/cells/ap01-vendor-master').ApprovalService | null = null;
let BankAccountServiceClass: typeof import('../../canon/finance/dom03-accounts-payable/cells/ap01-vendor-master').BankAccountService | null = null;

async function loadVendorServices() {
  if (!VendorServiceClass || !ApprovalServiceClass || !BankAccountServiceClass) {
    const module = await import('../../canon/finance/dom03-accounts-payable/cells/ap01-vendor-master');
    VendorServiceClass = module.VendorService;
    ApprovalServiceClass = module.ApprovalService;
    BankAccountServiceClass = module.BankAccountService;
  }
}

/**
 * Get VendorService instance
 */
export async function getVendorService() {
  await loadVendorServices();
  const container = getVendorServiceContainer();

  return new VendorServiceClass!(
    container.vendorRepo,
    container.auditPort
  );
}

/**
 * Get ApprovalService instance (for vendor approval workflow)
 */
export async function getVendorApprovalService() {
  await loadVendorServices();
  const container = getVendorServiceContainer();

  return new ApprovalServiceClass!(
    container.vendorRepo,
    container.auditPort,
    container.policyPort
  );
}

/**
 * Get BankAccountService instance
 */
export async function getBankAccountService() {
  await loadVendorServices();
  const container = getVendorServiceContainer();

  return new BankAccountServiceClass!(
    container.vendorRepo,
    container.auditPort,
    container.policyPort
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
export async function getVendorActorContext(): Promise<ActorContext> {
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
export async function getVendorTenantId(): Promise<string> {
  const actor = await getVendorActorContext();
  return actor.tenantId;
}
