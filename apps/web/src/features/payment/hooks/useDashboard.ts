/**
 * useDashboard - Payment Hub Dashboard Data Hook
 * 
 * Fetches real-time dashboard metrics from AP-05 backend APIs.
 * Powers the Payment Hub with CFO-ready insights.
 */

import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// TYPES (matching backend DashboardService types)
// ============================================================================

export interface CashSummary {
  amount: string;
  paymentCount: number;
  currency: string;
}

export interface StatusAggregate {
  status: string;
  count: number;
  totalAmount: string;
  currency: string;
}

export interface CompanyAggregate {
  companyId: string;
  companyName?: string;
  pendingCount: number;
  pendingAmount: string;
  completedCount: number;
  completedAmount: string;
  totalCount: number;
  totalAmount: string;
  currency: string;
}

export interface ControlHealthMetrics {
  sodComplianceRate: number;
  pendingApprovals: number;
  pendingApprovalAmount: string;
  exceptions: {
    total: number;
    high: number;
    medium: number;
    low: number;
  };
  auditCoverage: number;
  hasViolations: boolean;
}

export interface DashboardMetrics {
  cashPosition: {
    today: CashSummary;
    thisWeek: CashSummary;
    thisMonth: CashSummary;
    next90Days: CashSummary;
  };
  byStatus: StatusAggregate[];
  byCompany: CompanyAggregate[];
  controlHealth: ControlHealthMetrics;
  generatedAt: string;
}

export interface CashPositionEntry {
  date: string;
  scheduledAmount: string;
  paymentCount: number;
  currency: string;
}

export interface CashPositionResponse {
  summary: DashboardMetrics['cashPosition'];
  daily: CashPositionEntry[];
  currency: string;
  generatedAt: string;
}

export interface ControlHealthResponse {
  metrics: ControlHealthMetrics;
  status: {
    sod: 'healthy' | 'warning' | 'critical';
    approvals: 'healthy' | 'warning' | 'critical';
    exceptions: 'healthy' | 'warning' | 'critical';
    overall: 'healthy' | 'warning' | 'critical';
  };
  generatedAt: string;
}

export interface CompanyBreakdownResponse {
  companies: CompanyAggregate[];
  totals: {
    pendingAmount: string;
    completedAmount: string;
    totalAmount: string;
    paymentCount: number;
  };
  currency: string;
  generatedAt: string;
}

// ============================================================================
// HOOK: useDashboard
// ============================================================================

interface UseDashboardReturn {
  data: DashboardMetrics | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
  lastUpdated: Date | null;
}

export function useDashboard(): UseDashboardReturn {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/dashboard');
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard: ${response.statusText}`);
      }
      const result = await response.json();
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { data, isLoading, error, refresh: fetchDashboard, lastUpdated };
}

// ============================================================================
// HOOK: useCashPosition
// ============================================================================

interface UseCashPositionReturn {
  data: CashPositionResponse | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useCashPosition(days: number = 90): UseCashPositionReturn {
  const [data, setData] = useState<CashPositionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCashPosition = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/payments/cash-position?days=${days}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch cash position: ${response.statusText}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchCashPosition();
  }, [fetchCashPosition]);

  return { data, isLoading, error, refresh: fetchCashPosition };
}

// ============================================================================
// HOOK: useControlHealth
// ============================================================================

interface UseControlHealthReturn {
  data: ControlHealthResponse | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useControlHealth(): UseControlHealthReturn {
  const [data, setData] = useState<ControlHealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchControlHealth = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/control-health');
      if (!response.ok) {
        throw new Error(`Failed to fetch control health: ${response.statusText}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchControlHealth();
  }, [fetchControlHealth]);

  return { data, isLoading, error, refresh: fetchControlHealth };
}

// ============================================================================
// HOOK: useCompanyBreakdown
// ============================================================================

interface UseCompanyBreakdownReturn {
  data: CompanyBreakdownResponse | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useCompanyBreakdown(): UseCompanyBreakdownReturn {
  const [data, setData] = useState<CompanyBreakdownResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCompanyBreakdown = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/by-company');
      if (!response.ok) {
        throw new Error(`Failed to fetch company breakdown: ${response.statusText}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanyBreakdown();
  }, [fetchCompanyBreakdown]);

  return { data, isLoading, error, refresh: fetchCompanyBreakdown };
}
