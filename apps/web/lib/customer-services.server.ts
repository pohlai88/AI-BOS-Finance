/**
 * AR-01 Customer Master - Service Factory
 * 
 * Wires up CustomerService with adapters using hexagonal DI pattern.
 * Uses React's cache() for request-level deduplication.
 * 
 * @module AR-01
 */

import 'server-only';
import { cache } from 'react';
import { CustomerService } from '@/apps/canon/finance/dom04-accounts-receivable/cells/ar01-customer-master/CustomerService';
import { SqlCustomerAdapter, SqlSequenceAdapter, createPoolConfig } from '@aibos/kernel-adapters';
import { Pool } from 'pg';

// =============================================================================
// Database Pool (Singleton)
// =============================================================================

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool(createPoolConfig());
  }
  return pool;
}

// =============================================================================
// Sequence Port Adapter
// =============================================================================

class SequencePortAdapter {
  constructor(private readonly sequenceAdapter: SqlSequenceAdapter) {}
  
  async nextSequence(tenantId: string, sequenceType: string): Promise<string> {
    const prefix = sequenceType === 'CUSTOMER' ? 'CUS' : sequenceType.slice(0, 3);
    const number = await this.sequenceAdapter.nextValue(tenantId, sequenceType);
    return `${prefix}-${number.toString().padStart(6, '0')}`;
  }
}

// =============================================================================
// Audit Outbox Port Adapter (writes to ar.customer_audit_outbox)
// =============================================================================

class AuditOutboxPortAdapter {
  constructor(private readonly pool: Pool) {}
  
  async writeEvent(
    tenantId: string,
    eventType: string,
    aggregateId: string,
    aggregateType: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    // Note: In production, this is handled by the database trigger (trg_customer_audit_outbox)
    // This method is here for explicit audit events not covered by triggers
    const sql = `
      INSERT INTO ar.customer_audit_outbox (
        tenant_id, event_type, event_payload, aggregate_id, aggregate_type,
        sequence_number, correlation_id
      )
      SELECT 
        $1, $2, $3, $4, $5,
        COALESCE(MAX(sequence_number), 0) + 1,
        gen_random_uuid()
      FROM ar.customer_audit_outbox
      WHERE tenant_id = $1
    `;
    
    await this.pool.query(sql, [
      tenantId,
      eventType,
      JSON.stringify({ ...payload, timestamp: new Date().toISOString() }),
      aggregateId,
      aggregateType,
    ]);
  }
}

// =============================================================================
// Policy Port Adapter (stub - can be extended with K_POLICY integration)
// =============================================================================

class PolicyPortAdapter {
  async evaluate(
    _tenantId: string,
    _policyCode: string,
    _context: Record<string, unknown>
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Default: allow all operations
    // In production, integrate with K_POLICY kernel service
    return { allowed: true };
  }
}

// =============================================================================
// Service Factory (cached per request)
// =============================================================================

export const getCustomerService = cache(async (): Promise<CustomerService> => {
  const dbPool = getPool();
  
  const customerRepo = new SqlCustomerAdapter(dbPool);
  const sequenceAdapter = new SqlSequenceAdapter(dbPool);
  const sequencePort = new SequencePortAdapter(sequenceAdapter);
  const auditPort = new AuditOutboxPortAdapter(dbPool);
  const policyPort = new PolicyPortAdapter();
  
  return new CustomerService(
    customerRepo,
    sequencePort,
    auditPort,
    policyPort
  );
});

// =============================================================================
// Actor Context (from session)
// =============================================================================

export interface ActorContext {
  tenantId: string;
  userId: string;
  permissions?: string[];
}

export const getCustomerActorContext = cache(async (): Promise<ActorContext> => {
  // TODO: Integrate with actual session management
  // For now, return mock actor for development
  return {
    tenantId: process.env.DEFAULT_TENANT_ID ?? '00000000-0000-0000-0000-000000000001',
    userId: process.env.DEFAULT_USER_ID ?? '00000000-0000-0000-0000-000000000001',
    permissions: ['ar.customer.create', 'ar.customer.read', 'ar.customer.update', 'ar.customer.approve'],
  };
});
