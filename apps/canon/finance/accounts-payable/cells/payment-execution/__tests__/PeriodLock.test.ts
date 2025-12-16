/**
 * Period Lock Tests
 * 
 * AP-05 Control Tests: Period Lock Enforcement = 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createMemoryFiscalTimeAdapter,
  setPeriodStatus,
  clearPeriods,
} from '@aibos/kernel-adapters';

describe('Period Lock Enforcement', () => {
  let fiscalTimeAdapter: ReturnType<typeof createMemoryFiscalTimeAdapter>;
  const tenantId = '00000000-0000-0000-0000-000000000001';

  beforeEach(() => {
    clearPeriods();
    fiscalTimeAdapter = createMemoryFiscalTimeAdapter();
  });

  // ==========================================================================
  // PERIOD STATUS TESTS
  // ==========================================================================

  describe('test_closed_period_payment_rejected', () => {
    it('OPEN period allows posting', async () => {
      const result = await fiscalTimeAdapter.getPeriodStatus(
        new Date(),
        tenantId
      );

      expect(result.status).toBe('OPEN');
      expect(result.canPost).toBe(true);
      expect(result.message).toContain('open for posting');
    });

    it('SOFT_CLOSE period allows adjustments only', async () => {
      // Set current month to soft close
      const now = new Date();
      const periodId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      setPeriodStatus(tenantId, periodId, 'SOFT_CLOSE');

      const result = await fiscalTimeAdapter.getPeriodStatus(now, tenantId);

      expect(result.status).toBe('SOFT_CLOSE');
      expect(result.canPost).toBe(true); // Adjustments allowed
      expect(result.message).toContain('soft close');
    });

    it('HARD_CLOSE period blocks all posting', async () => {
      // Set previous month to hard close
      const now = new Date();
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);
      const periodId = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
      setPeriodStatus(tenantId, periodId, 'HARD_CLOSE');

      const result = await fiscalTimeAdapter.getPeriodStatus(prevMonth, tenantId);

      expect(result.status).toBe('HARD_CLOSE');
      expect(result.canPost).toBe(false);
      expect(result.message).toContain('closed');
    });
  });

  // ==========================================================================
  // OPEN PERIODS TESTS
  // ==========================================================================

  describe('getOpenPeriods', () => {
    it('returns current and previous month as open by default', async () => {
      const openPeriods = await fiscalTimeAdapter.getOpenPeriods(tenantId);

      expect(openPeriods.length).toBeGreaterThanOrEqual(1);
      expect(openPeriods.every(p => p.status === 'OPEN')).toBe(true);
    });

    it('respects explicitly closed periods', async () => {
      const now = new Date();
      const currentPeriodId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      // Close current period
      setPeriodStatus(tenantId, currentPeriodId, 'HARD_CLOSE');

      const result = await fiscalTimeAdapter.getPeriodStatus(now, tenantId);

      expect(result.status).toBe('HARD_CLOSE');
      expect(result.canPost).toBe(false);
    });
  });

  // ==========================================================================
  // CURRENT PERIOD TESTS
  // ==========================================================================

  describe('getCurrentPeriod', () => {
    it('returns current month as open period', async () => {
      const currentPeriod = await fiscalTimeAdapter.getCurrentPeriod(tenantId);

      expect(currentPeriod).not.toBeNull();
      expect(currentPeriod?.status).toBe('OPEN');

      const now = new Date();
      const expectedPeriodId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      expect(currentPeriod?.periodId).toBe(expectedPeriodId);
    });
  });
});
