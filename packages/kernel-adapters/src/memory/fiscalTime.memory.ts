/**
 * Fiscal Time Adapter - In-Memory Implementation
 * 
 * Mock implementation for development and testing.
 * All periods are OPEN by default.
 */

import type {
  FiscalTimePort,
  PeriodStatusResult,
  FiscalPeriod,
} from '@aibos/kernel-core';

// ============================================================================
// 1. IN-MEMORY STORE
// ============================================================================

interface StoredPeriod extends FiscalPeriod {
  id: string;
}

const periods = new Map<string, StoredPeriod>();

// ============================================================================
// 2. HELPER FUNCTIONS
// ============================================================================

function getPeriodKey(tenantId: string, periodId: string): string {
  return `${tenantId}:${periodId}`;
}

function dateToPeriodId(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getPeriodDates(periodId: string): { startDate: Date; endDate: Date } {
  const [year, month] = periodId.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // Last day of month
  return { startDate, endDate };
}

// ============================================================================
// 3. ADAPTER IMPLEMENTATION
// ============================================================================

export function createMemoryFiscalTimeAdapter(): FiscalTimePort {
  return {
    async getPeriodStatus(
      date: Date,
      tenantId: string,
      _companyId?: string
    ): Promise<PeriodStatusResult> {
      const periodId = dateToPeriodId(date);
      const key = getPeriodKey(tenantId, periodId);

      // Check if period exists in store
      const stored = periods.get(key);

      if (stored) {
        return {
          status: stored.status,
          period: stored,
          message: stored.status === 'OPEN'
            ? 'Period is open for posting'
            : stored.status === 'SOFT_CLOSE'
              ? 'Period is in soft close - adjustments only'
              : 'Period is closed - no posting allowed',
          canPost: stored.status === 'OPEN' || stored.status === 'SOFT_CLOSE',
        };
      }

      // Default: all periods are OPEN (mock behavior)
      const { startDate, endDate } = getPeriodDates(periodId);
      const defaultPeriod: FiscalPeriod = {
        periodId,
        startDate,
        endDate,
        status: 'OPEN',
        tenantId,
      };

      return {
        status: 'OPEN',
        period: defaultPeriod,
        message: 'Period is open for posting',
        canPost: true,
      };
    },

    async getCurrentPeriod(
      tenantId: string,
      _companyId?: string
    ): Promise<FiscalPeriod | null> {
      const now = new Date();
      const periodId = dateToPeriodId(now);
      const key = getPeriodKey(tenantId, periodId);

      const stored = periods.get(key);
      if (stored && stored.status === 'OPEN') {
        return stored;
      }

      // Default: current month is open
      const { startDate, endDate } = getPeriodDates(periodId);
      return {
        periodId,
        startDate,
        endDate,
        status: 'OPEN',
        tenantId,
      };
    },

    async getOpenPeriods(
      tenantId: string,
      _companyId?: string
    ): Promise<FiscalPeriod[]> {
      const openPeriods: FiscalPeriod[] = [];

      // Get stored open periods
      periods.forEach((period) => {
        if (period.tenantId === tenantId && period.status === 'OPEN') {
          openPeriods.push(period);
        }
      });

      // If no stored periods, return current and previous month as open
      if (openPeriods.length === 0) {
        const now = new Date();
        const currentPeriodId = dateToPeriodId(now);
        const { startDate, endDate } = getPeriodDates(currentPeriodId);

        openPeriods.push({
          periodId: currentPeriodId,
          startDate,
          endDate,
          status: 'OPEN',
          tenantId,
        });

        // Previous month
        const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevPeriodId = dateToPeriodId(prevDate);
        const prevDates = getPeriodDates(prevPeriodId);

        openPeriods.push({
          periodId: prevPeriodId,
          startDate: prevDates.startDate,
          endDate: prevDates.endDate,
          status: 'OPEN',
          tenantId,
        });
      }

      return openPeriods;
    },
  };
}

// ============================================================================
// 4. TEST HELPERS
// ============================================================================

/**
 * Set a period's status (for testing)
 */
export function setPeriodStatus(
  tenantId: string,
  periodId: string,
  status: 'OPEN' | 'SOFT_CLOSE' | 'HARD_CLOSE'
): void {
  const { startDate, endDate } = getPeriodDates(periodId);
  const key = getPeriodKey(tenantId, periodId);

  periods.set(key, {
    id: key,
    periodId,
    startDate,
    endDate,
    status,
    tenantId,
  });
}

/**
 * Clear all periods (for testing)
 */
export function clearPeriods(): void {
  periods.clear();
}
