/**
 * Payment Dashboard Service Tests
 * 
 * AP-05 Payment Execution Cell - Dashboard metrics and aggregations.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createMemoryPaymentRepository,
  clearPaymentData,
} from '@aibos/kernel-adapters';
import type { PaymentRepositoryPort, TransactionContext } from '@aibos/kernel-core';
import { PaymentDashboardService } from '../DashboardService';
import type { ActorContext } from '@aibos/canon-governance';

describe('PaymentDashboardService', () => {
  let paymentRepo: PaymentRepositoryPort;
  let dashboardService: PaymentDashboardService;
  
  const tenantId = '00000000-0000-0000-0000-000000000001';
  const companyId = '00000000-0000-0000-0000-000000000001';
  const userId = '00000000-0000-0000-0000-000000000002';

  const mockActor: ActorContext = {
    userId,
    tenantId,
    companyId,
    type: 'user',
    roles: ['ap_maker'],
  };

  beforeEach(() => {
    clearPaymentData();
    paymentRepo = createMemoryPaymentRepository();
    dashboardService = new PaymentDashboardService(paymentRepo);
  });

  // Helper to create test payments
  async function createTestPayment(overrides: Partial<{
    status: string;
    amount: string;
    companyId: string;
    paymentDate: Date;
  }> = {}) {
    return paymentRepo.withTransaction(async (tx: TransactionContext) => {
      const payment = await paymentRepo.create({
        tenantId,
        companyId: overrides.companyId || companyId,
        vendorId: 'vendor-001',
        vendorName: 'Test Vendor',
        amount: overrides.amount || '1000.00',
        currency: 'USD',
        paymentDate: overrides.paymentDate || new Date(),
        createdBy: userId,
      }, tx);

      // Update status if provided
      if (overrides.status && overrides.status !== 'draft') {
        return paymentRepo.updateStatus(payment.id, {
          status: overrides.status as any,
        }, tx);
      }

      return payment;
    });
  }

  // ==========================================================================
  // DASHBOARD TESTS
  // ==========================================================================

  describe('getDashboard', () => {
    it('should return empty dashboard for no payments', async () => {
      const result = await dashboardService.getDashboard(mockActor);

      expect(result).toBeDefined();
      expect(result.byStatus).toHaveLength(0);
      expect(result.byCompany).toHaveLength(0);
      expect(result.controlHealth.pendingApprovals).toBe(0);
      expect(result.generatedAt).toBeInstanceOf(Date);
    });

    it('should aggregate payments by status', async () => {
      // Create payments in different statuses
      await createTestPayment({ status: 'draft', amount: '1000.00' });
      await createTestPayment({ status: 'draft', amount: '2000.00' });
      await createTestPayment({ status: 'pending_approval', amount: '3000.00' });
      await createTestPayment({ status: 'completed', amount: '4000.00' });

      const result = await dashboardService.getDashboard(mockActor);

      expect(result.byStatus.length).toBeGreaterThan(0);

      const draftAggregate = result.byStatus.find(s => s.status === 'draft');
      expect(draftAggregate?.count).toBe(2);
      expect(draftAggregate?.totalAmount).toBe('3000.00');

      const pendingAggregate = result.byStatus.find(s => s.status === 'pending_approval');
      expect(pendingAggregate?.count).toBe(1);
      expect(pendingAggregate?.totalAmount).toBe('3000.00');
    });

    it('should include control health metrics', async () => {
      await createTestPayment({ status: 'pending_approval', amount: '5000.00' });
      await createTestPayment({ status: 'pending_approval', amount: '3000.00' });

      const result = await dashboardService.getDashboard(mockActor);

      expect(result.controlHealth.sodComplianceRate).toBe(100);
      expect(result.controlHealth.pendingApprovals).toBe(2);
      expect(result.controlHealth.pendingApprovalAmount).toBe('8000.00');
      expect(result.controlHealth.auditCoverage).toBe(100);
      expect(result.controlHealth.hasViolations).toBe(false);
    });
  });

  // ==========================================================================
  // CASH POSITION TESTS
  // ==========================================================================

  describe('getCashPosition', () => {
    it('should return empty position for no scheduled payments', async () => {
      const result = await dashboardService.getCashPosition(mockActor, 30);

      expect(result.daily).toHaveLength(0);
      expect(result.summary.today.paymentCount).toBe(0);
    });

    it('should calculate cash position for scheduled payments', async () => {
      // Use dates in the future to avoid timezone issues with "today"
      const day1 = new Date();
      day1.setDate(day1.getDate() + 1);
      day1.setHours(12, 0, 0, 0);

      const day2 = new Date(day1);
      day2.setDate(day2.getDate() + 1);

      await createTestPayment({ status: 'pending_approval', amount: '1000.00', paymentDate: day1 });
      await createTestPayment({ status: 'approved', amount: '2000.00', paymentDate: day1 });
      await createTestPayment({ status: 'pending_approval', amount: '3000.00', paymentDate: day2 });

      const result = await dashboardService.getCashPosition(mockActor, 30);

      // All 3 payments should be in the projection (next90Days covers them)
      expect(result.summary.next90Days.amount).toBe('6000.00');
      expect(result.summary.next90Days.paymentCount).toBe(3);
      expect(result.daily.length).toBeGreaterThanOrEqual(2);
      expect(result.currency).toBe('USD');
    });

    it('should exclude completed and failed payments from projection', async () => {
      // Use a date in the future
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);
      futureDate.setHours(12, 0, 0, 0);

      await createTestPayment({ status: 'pending_approval', amount: '1000.00', paymentDate: futureDate });
      await createTestPayment({ status: 'completed', amount: '5000.00', paymentDate: futureDate });
      await createTestPayment({ status: 'failed', amount: '3000.00', paymentDate: futureDate });

      const result = await dashboardService.getCashPosition(mockActor, 7);

      // Only pending_approval should be counted
      expect(result.summary.thisWeek.amount).toBe('1000.00');
      expect(result.summary.thisWeek.paymentCount).toBe(1);
    });
  });

  // ==========================================================================
  // CONTROL HEALTH TESTS
  // ==========================================================================

  describe('getControlHealth', () => {
    it('should return healthy status with no pending approvals', async () => {
      const result = await dashboardService.getControlHealth(mockActor);

      expect(result.status.sod).toBe('healthy');
      expect(result.status.approvals).toBe('healthy');
      expect(result.status.overall).toBe('healthy');
    });

    it('should return warning status with many pending approvals', async () => {
      // Create 25 pending approvals (above warning threshold of 20)
      for (let i = 0; i < 25; i++) {
        await createTestPayment({ status: 'pending_approval', amount: '100.00' });
      }

      const result = await dashboardService.getControlHealth(mockActor);

      expect(result.status.approvals).toBe('warning');
      expect(result.metrics.pendingApprovals).toBe(25);
    });

    it('should return critical status with too many pending approvals', async () => {
      // Create 55 pending approvals (above critical threshold of 50)
      for (let i = 0; i < 55; i++) {
        await createTestPayment({ status: 'pending_approval', amount: '100.00' });
      }

      const result = await dashboardService.getControlHealth(mockActor);

      expect(result.status.approvals).toBe('critical');
      expect(result.status.overall).toBe('critical');
    });
  });

  // ==========================================================================
  // COMPANY BREAKDOWN TESTS
  // ==========================================================================

  describe('getByCompany', () => {
    it('should aggregate payments by company', async () => {
      const company1 = '00000000-0000-0000-0000-000000000001';
      const company2 = '00000000-0000-0000-0000-000000000002';

      await createTestPayment({ companyId: company1, amount: '1000.00', status: 'pending_approval' });
      await createTestPayment({ companyId: company1, amount: '2000.00', status: 'completed' });
      await createTestPayment({ companyId: company2, amount: '5000.00', status: 'pending_approval' });

      const result = await dashboardService.getByCompany(mockActor);

      expect(result.companies).toHaveLength(2);
      expect(result.totals.paymentCount).toBe(3);
      expect(result.totals.totalAmount).toBe('8000.00');

      const company1Data = result.companies.find(c => c.companyId === company1);
      expect(company1Data?.pendingAmount).toBe('1000.00');
      expect(company1Data?.completedAmount).toBe('2000.00');

      const company2Data = result.companies.find(c => c.companyId === company2);
      expect(company2Data?.pendingAmount).toBe('5000.00');
    });
  });

  // ==========================================================================
  // PENDING FOR APPROVER TESTS
  // ==========================================================================

  describe('getPendingForApprover', () => {
    it('should count pending approvals', async () => {
      await createTestPayment({ status: 'pending_approval' });
      await createTestPayment({ status: 'pending_approval' });
      await createTestPayment({ status: 'draft' });
      await createTestPayment({ status: 'completed' });

      const count = await dashboardService.getPendingForApprover(mockActor);

      expect(count).toBe(2);
    });
  });
});
