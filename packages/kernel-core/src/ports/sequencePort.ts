/**
 * Sequence Port (K_SEQ)
 * 
 * Interface for governed sequence/number generation.
 * Used by AP-01 (vendor codes), AP-02 (invoice numbers), etc.
 * 
 * Anti-Gravity: This is a PORT, not an adapter.
 * It defines WHAT we need, not HOW it's implemented.
 * 
 * @file packages/kernel-core/src/ports/sequencePort.ts
 */

// ============================================================================
// 1. TYPES
// ============================================================================

/**
 * Sequence type for categorizing different number series
 */
export type SequenceType =
  | 'VENDOR'        // V-YYYY-NNNNNN (AP-01)
  | 'INVOICE'       // INV-YYYY-NNNNNN (AP-02)
  | 'PAYMENT'       // PAY-YYYY-NNNNNN (AP-05)
  | 'JOURNAL'       // JE-YYYY-NNNNNN (GL-03)
  | 'MATCH'         // MR-YYYY-NNNNNN (AP-03)
  | 'APPROVAL'      // APR-YYYY-NNNNNN (AP-04)
  | 'CUSTOM';       // Custom prefix

/**
 * Sequence configuration
 */
export interface SequenceConfig {
  /** Sequence type */
  type: SequenceType;
  /** Custom prefix (only for CUSTOM type) */
  prefix?: string;
  /** Tenant ID */
  tenantId: string;
  /** Company ID (optional - for company-specific sequences) */
  companyId?: string;
  /** Fiscal year (optional - for year-specific sequences) */
  fiscalYear?: number;
  /** Starting number (default: 1) */
  startAt?: number;
  /** Increment by (default: 1) */
  incrementBy?: number;
  /** Number padding (default: 6 digits) */
  padding?: number;
}

/**
 * Generated sequence result
 */
export interface SequenceResult {
  /** The generated sequence number (formatted) */
  formattedNumber: string;
  /** Raw sequence value */
  sequenceValue: number;
  /** Prefix used */
  prefix: string;
  /** Year component */
  year: number;
  /** Tenant ID */
  tenantId: string;
  /** Company ID (if applicable) */
  companyId?: string;
}

/**
 * Sequence info for querying
 */
export interface SequenceInfo {
  /** Sequence type */
  type: SequenceType;
  /** Current value */
  currentValue: number;
  /** Last generated at */
  lastGeneratedAt: Date;
  /** Tenant ID */
  tenantId: string;
  /** Company ID */
  companyId?: string;
  /** Fiscal year */
  fiscalYear: number;
}

// ============================================================================
// 2. PORT INTERFACE
// ============================================================================

/**
 * Sequence Port for governed number generation
 * 
 * ENTERPRISE REQUIREMENTS:
 * - Thread-safe sequence generation
 * - No gaps in sequences (atomic increment)
 * - Tenant/company isolated
 * - Year-based sequences
 * - Audit trail for generated numbers
 */
export interface SequencePort {
  /**
   * Generate next sequence number
   * 
   * @param config - Sequence configuration
   * @returns Generated sequence result
   * 
   * Business Rules:
   * - Must be atomic (no duplicate numbers)
   * - Must be tenant-isolated
   * - Should be gap-free
   */
  nextSequence(config: SequenceConfig): Promise<SequenceResult>;

  /**
   * Get current sequence info (without incrementing)
   * 
   * @param type - Sequence type
   * @param tenantId - Tenant ID
   * @param companyId - Company ID (optional)
   * @param fiscalYear - Fiscal year (optional, defaults to current)
   * @returns Current sequence info or null if not initialized
   */
  getSequenceInfo(
    type: SequenceType,
    tenantId: string,
    companyId?: string,
    fiscalYear?: number
  ): Promise<SequenceInfo | null>;

  /**
   * Initialize or reset a sequence
   * 
   * @param config - Sequence configuration
   * @param startValue - Starting value (default: config.startAt or 1)
   * @returns True if initialized/reset
   * 
   * Business Rules:
   * - Only allowed for new sequences or with admin permission
   * - Should log audit event
   */
  initializeSequence(
    config: SequenceConfig,
    startValue?: number
  ): Promise<boolean>;

  /**
   * Reserve a batch of sequence numbers
   * 
   * @param config - Sequence configuration
   * @param count - Number of sequences to reserve
   * @returns Array of generated sequence results
   * 
   * Use Cases:
   * - Batch imports
   * - Pre-allocation for offline use
   */
  reserveBatch(
    config: SequenceConfig,
    count: number
  ): Promise<SequenceResult[]>;
}

// ============================================================================
// 3. UTILITY FUNCTIONS
// ============================================================================

/**
 * Get default prefix for sequence type
 */
export function getSequencePrefix(type: SequenceType): string {
  switch (type) {
    case 'VENDOR':
      return 'V';
    case 'INVOICE':
      return 'INV';
    case 'PAYMENT':
      return 'PAY';
    case 'JOURNAL':
      return 'JE';
    case 'MATCH':
      return 'MR';
    case 'APPROVAL':
      return 'APR';
    case 'CUSTOM':
      return '';
    default:
      return 'SEQ';
  }
}

/**
 * Format sequence number
 */
export function formatSequenceNumber(
  prefix: string,
  year: number,
  value: number,
  padding: number = 6
): string {
  const paddedValue = String(value).padStart(padding, '0');
  return `${prefix}-${year}-${paddedValue}`;
}
