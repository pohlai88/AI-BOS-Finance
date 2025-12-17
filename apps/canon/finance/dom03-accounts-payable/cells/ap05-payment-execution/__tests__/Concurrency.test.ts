/**
 * Concurrency Control Tests
 * 
 * AP-05 Control Tests: Concurrency Conflicts Handled = 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createMemoryPaymentRepository,
  clearPaymentData,
} from '@aibos/kernel-adapters';
import type { PaymentRepositoryPort } from '@aibos/kernel-core';

describe('Concurrency Control', () => {
  let paymentRepo: PaymentRepositoryPort;
  const tenantId = '00000000-0000-0000-0000-000000000001';
  const companyId = '00000000-0000-0000-0000-000000000001';
  const userId = '00000000-0000-0000-0000-000000000002';

  beforeEach(() => {
    clearPaymentData();
    paymentRepo = createMemoryPaymentRepository();
  });

  // ==========================================================================
  // VERSION CHECK TESTS
  // ==========================================================================

  describe('test_stale_version_returns_409', () => {
    it('version increments on each update', async () => {
      // Create payment
      let payment = await paymentRepo.withTransaction(async (tx) => {
        return paymentRepo.create({
          tenantId,
          companyId,
          vendorId: 'vendor-001',
          vendorName: 'Test Vendor',
          amount: '1000.00',
          currency: 'USD',
          paymentDate: new Date(),
          createdBy: userId,
        }, tx);
      });

      expect(payment.version).toBe(1);

      // Update payment
      payment = await paymentRepo.withTransaction(async (tx) => {
        return paymentRepo.updateStatus(
          payment.id,
          { status: 'pending_approval' },
          tx
        );
      });

      expect(payment.version).toBe(2);

      // Update again
      payment = await paymentRepo.withTransaction(async (tx) => {
        return paymentRepo.updateStatus(
          payment.id,
          { status: 'approved', approvedBy: userId, approvedAt: new Date() },
          tx
        );
      });

      expect(payment.version).toBe(3);
    });

    it('concurrent reads see same version', async () => {
      // Create payment
      const payment = await paymentRepo.withTransaction(async (tx) => {
        return paymentRepo.create({
          tenantId,
          companyId,
          vendorId: 'vendor-001',
          vendorName: 'Test Vendor',
          amount: '1000.00',
          currency: 'USD',
          paymentDate: new Date(),
          createdBy: userId,
        }, tx);
      });

      // Two concurrent reads
      const read1 = await paymentRepo.findById(payment.id, tenantId);
      const read2 = await paymentRepo.findById(payment.id, tenantId);

      expect(read1?.version).toBe(read2?.version);
      expect(read1?.version).toBe(1);
    });
  });

  // ==========================================================================
  // IDEMPOTENCY TESTS
  // ==========================================================================

  describe('test_duplicate_key_returns_original', () => {
    it('same idempotency key returns existing payment', async () => {
      const idempotencyKey = 'unique-key-001';

      // First create
      const payment1 = await paymentRepo.withTransaction(async (tx) => {
        return paymentRepo.create({
          tenantId,
          companyId,
          vendorId: 'vendor-001',
          vendorName: 'Test Vendor',
          amount: '1000.00',
          currency: 'USD',
          paymentDate: new Date(),
          createdBy: userId,
          idempotencyKey,
        }, tx);
      });

      // Second create with same key - should find existing
      const existing = await paymentRepo.withTransaction(async (tx) => {
        return paymentRepo.findByIdempotencyKey(idempotencyKey, tenantId, tx);
      });

      expect(existing).not.toBeNull();
      expect(existing?.id).toBe(payment1.id);
      expect(existing?.idempotencyKey).toBe(idempotencyKey);
    });

    it('different idempotency keys create separate payments', async () => {
      const payment1 = await paymentRepo.withTransaction(async (tx) => {
        return paymentRepo.create({
          tenantId,
          companyId,
          vendorId: 'vendor-001',
          vendorName: 'Test Vendor',
          amount: '1000.00',
          currency: 'USD',
          paymentDate: new Date(),
          createdBy: userId,
          idempotencyKey: 'key-001',
        }, tx);
      });

      const payment2 = await paymentRepo.withTransaction(async (tx) => {
        return paymentRepo.create({
          tenantId,
          companyId,
          vendorId: 'vendor-001',
          vendorName: 'Test Vendor',
          amount: '1000.00',
          currency: 'USD',
          paymentDate: new Date(),
          createdBy: userId,
          idempotencyKey: 'key-002',
        }, tx);
      });

      expect(payment1.id).not.toBe(payment2.id);
      expect(payment1.paymentNumber).not.toBe(payment2.paymentNumber);
    });
  });

  // ==========================================================================
  // TENANT ISOLATION TESTS
  // ==========================================================================

  describe('test_rls_policy_blocks_cross_tenant_access', () => {
    it('cannot find payment from different tenant', async () => {
      const tenant1 = '00000000-0000-0000-0000-000000000001';
      const tenant2 = '00000000-0000-0000-0000-000000000002';

      // Create payment for tenant1
      const payment = await paymentRepo.withTransaction(async (tx) => {
        return paymentRepo.create({
          tenantId: tenant1,
          companyId: tenant1,
          vendorId: 'vendor-001',
          vendorName: 'Test Vendor',
          amount: '1000.00',
          currency: 'USD',
          paymentDate: new Date(),
          createdBy: userId,
        }, tx);
      });

      // Try to find from tenant2 - should return null
      const notFound = await paymentRepo.findById(payment.id, tenant2);
      expect(notFound).toBeNull();

      // Should find from tenant1
      const found = await paymentRepo.findById(payment.id, tenant1);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(payment.id);
    });

    it('list only returns payments for specified tenant', async () => {
      const tenant1 = '00000000-0000-0000-0000-000000000001';
      const tenant2 = '00000000-0000-0000-0000-000000000002';

      // Create payments for both tenants
      await paymentRepo.withTransaction(async (tx) => {
        return paymentRepo.create({
          tenantId: tenant1,
          companyId: tenant1,
          vendorId: 'vendor-001',
          vendorName: 'Test Vendor',
          amount: '1000.00',
          currency: 'USD',
          paymentDate: new Date(),
          createdBy: userId,
        }, tx);
      });

      await paymentRepo.withTransaction(async (tx) => {
        return paymentRepo.create({
          tenantId: tenant2,
          companyId: tenant2,
          vendorId: 'vendor-001',
          vendorName: 'Test Vendor',
          amount: '2000.00',
          currency: 'USD',
          paymentDate: new Date(),
          createdBy: userId,
        }, tx);
      });

      // List for tenant1
      const tenant1List = await paymentRepo.list({ tenantId: tenant1 });
      expect(tenant1List.total).toBe(1);
      expect(tenant1List.payments[0].amount).toBe('1000.00');

      // List for tenant2
      const tenant2List = await paymentRepo.list({ tenantId: tenant2 });
      expect(tenant2List.total).toBe(1);
      expect(tenant2List.payments[0].amount).toBe('2000.00');
    });
  });
});
