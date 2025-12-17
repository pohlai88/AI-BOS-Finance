/**
 * K_FX — Foreign Exchange Kernel Service Port
 * 
 * Purpose: Multi-currency support for AR/AP/GL operations
 * Version: 1.0.0
 * Authority: CONT_07 (Finance Canon Architecture)
 * 
 * This port provides:
 * - FX rate retrieval (historical + current)
 * - Currency conversion with rate locking
 * - Period-end FX revaluation for open AR/AP balances
 * - Rate governance (period lock, audit trail)
 * 
 * @module K_FX
 */

// =============================================================================
// Types
// =============================================================================

/**
 * Supported currency code (ISO 4217)
 */
export type CurrencyCode = string;  // e.g., 'USD', 'EUR', 'GBP', 'JPY'

/**
 * FX rate source (for audit trail)
 */
export type FXRateSource = 
  | 'MANUAL'           // User-entered rate
  | 'ECB'              // European Central Bank
  | 'OPENEXCHANGE'     // OpenExchangeRates API
  | 'BLOOMBERG'        // Bloomberg terminal
  | 'REUTERS'          // Reuters/Refinitiv
  | 'CUSTOM_API';      // Custom enterprise API

/**
 * FX rate type
 */
export type FXRateType =
  | 'SPOT'             // Current market rate
  | 'AVERAGE'          // Period average rate
  | 'CLOSING'          // Period closing rate
  | 'CONTRACTED';      // Contracted/hedged rate

/**
 * Stored FX rate with full audit trail
 */
export interface FXRate {
  id: string;  // UUID
  tenantId: string;
  
  // Currency pair
  fromCurrency: CurrencyCode;   // Source currency (e.g., 'EUR')
  toCurrency: CurrencyCode;     // Target/functional currency (e.g., 'USD')
  
  // Rate details
  rate: number;                  // e.g., 1.0850 (1 EUR = 1.0850 USD)
  inverseRate: number;           // e.g., 0.9217 (1 USD = 0.9217 EUR)
  rateType: FXRateType;
  
  // Validity
  effectiveDate: Date;           // Rate effective from this date
  expiryDate?: Date;             // Rate expires after this date (optional)
  
  // Source & audit
  source: FXRateSource;
  sourceReferenceId?: string;    // External reference (e.g., Bloomberg ticker)
  fetchedAt: Date;               // When rate was fetched from source
  
  // Period lock (for period-end controls)
  lockedForPeriod?: string;      // e.g., '2025-01' — rate cannot be changed after period close
  lockedBy?: string;             // User who locked the rate
  lockedAt?: Date;
  
  // Audit
  createdBy: string;
  createdAt: Date;
  version: number;
}

/**
 * Currency conversion result with locked rate reference
 */
export interface ConversionResult {
  // Amounts
  sourceAmount: number;          // Original amount
  sourceCurrency: CurrencyCode;
  targetAmount: number;          // Converted amount (rounded)
  targetCurrency: CurrencyCode;
  
  // Rate used
  rateId: string;                // FK to FXRate (for audit trail)
  rate: number;                  // Rate applied
  rateType: FXRateType;
  rateDate: Date;                // Effective date of rate
  
  // Rounding
  roundingMethod: 'HALF_UP' | 'HALF_EVEN' | 'FLOOR' | 'CEIL';
  precision: number;             // Decimal places for target currency
}

/**
 * FX revaluation result (for period-end adjustment)
 */
export interface RevaluationResult {
  documentId: string;            // Invoice/Receipt/Payment ID
  documentType: 'AR_INVOICE' | 'AR_RECEIPT' | 'AP_INVOICE' | 'AP_PAYMENT';
  
  // Original booking
  originalCurrency: CurrencyCode;
  originalAmount: number;
  originalRate: number;
  originalFunctionalAmount: number;
  
  // Revaluation
  revaluationRate: number;
  revaluatedFunctionalAmount: number;
  
  // FX gain/loss
  fxGainLossCents: number;       // Positive = gain, negative = loss
  unrealized: boolean;           // True if document still open
  
  // Posting
  journalHeaderId?: string;      // FK to journal entry (if posted)
}

/**
 * FX rate query filter
 */
export interface FXRateFilter {
  fromCurrency?: CurrencyCode;
  toCurrency?: CurrencyCode;
  effectiveDate?: Date;          // Get rate effective on this date
  rateType?: FXRateType;
  source?: FXRateSource;
}

// =============================================================================
// Port Interface
// =============================================================================

/**
 * K_FX — Foreign Exchange Kernel Service Port
 * 
 * Provides multi-currency support for the Finance module.
 */
export interface FXPort {
  // -------------------------------------------------------------------------
  // Rate Management
  // -------------------------------------------------------------------------
  
  /**
   * Get FX rate for a currency pair on a specific date
   * Returns the most specific applicable rate (contracted > spot > average)
   */
  getRate(
    tenantId: string,
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode,
    effectiveDate: Date,
    rateType?: FXRateType
  ): Promise<FXRate | null>;
  
  /**
   * Get the latest available rate for a currency pair
   */
  getLatestRate(
    tenantId: string,
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode
  ): Promise<FXRate | null>;
  
  /**
   * Create or update an FX rate
   * Throws if rate is locked for a closed period
   */
  upsertRate(
    tenantId: string,
    rate: Omit<FXRate, 'id' | 'tenantId' | 'createdAt' | 'version'>
  ): Promise<FXRate>;
  
  /**
   * Import rates from external source (batch)
   * Returns number of rates imported/updated
   */
  importRates(
    tenantId: string,
    rates: Array<Omit<FXRate, 'id' | 'tenantId' | 'createdAt' | 'version'>>,
    source: FXRateSource
  ): Promise<{ imported: number; updated: number; skipped: number }>;
  
  /**
   * Lock rates for a period (prevents modification after period close)
   */
  lockRatesForPeriod(
    tenantId: string,
    period: string,      // e.g., '2025-01'
    lockedBy: string
  ): Promise<number>;    // Number of rates locked
  
  // -------------------------------------------------------------------------
  // Currency Conversion
  // -------------------------------------------------------------------------
  
  /**
   * Convert amount from one currency to another
   * Uses rate effective on the specified date
   * Returns locked rate reference for audit trail
   */
  convert(
    tenantId: string,
    amount: number,
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode,
    effectiveDate: Date,
    options?: {
      rateType?: FXRateType;
      roundingMethod?: 'HALF_UP' | 'HALF_EVEN' | 'FLOOR' | 'CEIL';
      precision?: number;
    }
  ): Promise<ConversionResult>;
  
  /**
   * Convert using a specific rate ID (for locked rates)
   */
  convertWithRate(
    tenantId: string,
    amount: number,
    fromCurrency: CurrencyCode,
    rateId: string,
    options?: {
      roundingMethod?: 'HALF_UP' | 'HALF_EVEN' | 'FLOOR' | 'CEIL';
      precision?: number;
    }
  ): Promise<ConversionResult>;
  
  // -------------------------------------------------------------------------
  // Period-End Revaluation
  // -------------------------------------------------------------------------
  
  /**
   * Calculate FX revaluation for open AR/AP documents
   * Returns unrealized FX gain/loss for each document
   */
  calculateRevaluation(
    tenantId: string,
    companyId: string,
    asOfDate: Date,
    documentType: 'AR_INVOICE' | 'AR_RECEIPT' | 'AP_INVOICE' | 'AP_PAYMENT'
  ): Promise<RevaluationResult[]>;
  
  /**
   * Post FX revaluation journal entries
   * Creates adjustment entries for unrealized FX gain/loss
   */
  postRevaluation(
    tenantId: string,
    companyId: string,
    asOfDate: Date,
    revaluations: RevaluationResult[],
    postedBy: string
  ): Promise<string>;  // Returns journal_header_id
  
  // -------------------------------------------------------------------------
  // Query
  // -------------------------------------------------------------------------
  
  /**
   * List FX rates with filtering
   */
  listRates(
    tenantId: string,
    filter: FXRateFilter,
    pagination?: { limit: number; offset: number }
  ): Promise<{ rates: FXRate[]; total: number }>;
  
  /**
   * Get all supported currencies for a tenant
   */
  getSupportedCurrencies(tenantId: string): Promise<CurrencyCode[]>;
  
  /**
   * Get functional (reporting) currency for a company
   */
  getFunctionalCurrency(
    tenantId: string,
    companyId: string
  ): Promise<CurrencyCode>;
}

// =============================================================================
// Factory
// =============================================================================

/**
 * Create FX port from adapter
 */
export function createFXPort(adapter: FXPort): FXPort {
  return adapter;
}
