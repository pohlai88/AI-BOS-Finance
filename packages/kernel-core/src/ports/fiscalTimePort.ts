/**
 * Fiscal Time Port (K_TIME)
 * 
 * Interface for fiscal calendar and period management.
 * Used by AP-05 to validate payment dates against open periods.
 * 
 * Anti-Gravity: This is a PORT, not an adapter.
 * It defines WHAT we need, not HOW it's implemented.
 */

// ============================================================================
// 1. TYPES
// ============================================================================

/**
 * Period status - determines if transactions can be posted
 */
export type PeriodStatus = 'OPEN' | 'SOFT_CLOSE' | 'HARD_CLOSE';

/**
 * Period information
 */
export interface FiscalPeriod {
  /** Period ID (e.g., "2024-03") */
  periodId: string;
  /** Period start date */
  startDate: Date;
  /** Period end date */
  endDate: Date;
  /** Current status */
  status: PeriodStatus;
  /** Tenant ID */
  tenantId: string;
  /** Company ID */
  companyId?: string;
}

/**
 * Period status result with metadata
 */
export interface PeriodStatusResult {
  /** Status of the period */
  status: PeriodStatus;
  /** The period containing this date */
  period?: FiscalPeriod;
  /** Human-readable message */
  message?: string;
  /** Can transactions be posted? */
  canPost: boolean;
}

// ============================================================================
// 2. PORT INTERFACE
// ============================================================================

export interface FiscalTimePort {
  /**
   * Get the status of a fiscal period for a given date
   * 
   * @param date - The date to check
   * @param tenantId - Tenant identifier
   * @param companyId - Optional company identifier
   * @returns Period status (OPEN, SOFT_CLOSE, HARD_CLOSE)
   * 
   * Business Rules:
   * - OPEN: Normal posting allowed
   * - SOFT_CLOSE: Adjustments only (requires override permission)
   * - HARD_CLOSE: No posting allowed (audit locked)
   */
  getPeriodStatus(
    date: Date,
    tenantId: string,
    companyId?: string
  ): Promise<PeriodStatusResult>;

  /**
   * Get the current fiscal period for a tenant
   * 
   * @param tenantId - Tenant identifier
   * @param companyId - Optional company identifier
   * @returns Current open period or null if all closed
   */
  getCurrentPeriod(
    tenantId: string,
    companyId?: string
  ): Promise<FiscalPeriod | null>;

  /**
   * Get all open periods for a tenant
   * 
   * @param tenantId - Tenant identifier
   * @param companyId - Optional company identifier
   * @returns List of open periods
   */
  getOpenPeriods(
    tenantId: string,
    companyId?: string
  ): Promise<FiscalPeriod[]>;
}
