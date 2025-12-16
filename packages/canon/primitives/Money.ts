/**
 * Money Value Object
 * 
 * ENTERPRISE REQUIREMENT: Never use JavaScript floats for money.
 * All operations use string-based decimal arithmetic.
 * 
 * Key Principles:
 * - Immutable: Operations return new instances
 * - Precision: Up to 4 decimal places (NUMERIC(19,4) in DB)
 * - Type-safe: Currency mismatches throw errors
 * - Serializable: toJSON() returns { amount: string, currency: string }
 */

import Decimal from 'decimal.js';

// ============================================================================
// 1. TYPES
// ============================================================================

/**
 * ISO 4217 Currency Codes (common subset)
 */
export type CurrencyCode =
  | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CHF' | 'CAD' | 'AUD' | 'NZD'
  | 'HKD' | 'SGD' | 'SEK' | 'NOK' | 'DKK' | 'CNY' | 'INR' | 'BRL'
  | 'MXN' | 'ZAR' | 'KRW' | 'THB' | 'MYR' | 'PHP' | 'IDR' | 'VND';

/**
 * Money JSON representation
 */
export interface MoneyJSON {
  amount: string;
  currency: string;
}

// ============================================================================
// 2. ERRORS
// ============================================================================

export class InvalidMoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidMoneyError';
  }
}

export class CurrencyMismatchError extends Error {
  constructor(a: string, b: string) {
    super(`Currency mismatch: cannot perform operation between ${a} and ${b}`);
    this.name = 'CurrencyMismatchError';
  }
}

export class NegativeMoneyError extends Error {
  constructor(amount: string) {
    super(`Money cannot be negative: ${amount}`);
    this.name = 'NegativeMoneyError';
  }
}

// ============================================================================
// 3. CONFIGURATION
// ============================================================================

// Configure decimal.js for financial precision
Decimal.set({
  precision: 20,    // Enough for NUMERIC(19,4)
  rounding: Decimal.ROUND_HALF_EVEN, // Banker's rounding
  toExpNeg: -7,     // Avoid exponential notation
  toExpPos: 20,
});

/**
 * Maximum decimal places for money
 */
const MAX_DECIMAL_PLACES = 4;

/**
 * Regex for valid money string format
 */
const MONEY_FORMAT_REGEX = /^-?\d+(\.\d{1,4})?$/;

// ============================================================================
// 4. MONEY VALUE OBJECT
// ============================================================================

/**
 * Money Value Object - Immutable representation of monetary values
 * 
 * NEVER use JavaScript floats for money. This class ensures:
 * - All operations use Decimal.js for precision
 * - All serialization produces strings, not numbers
 * - Currency mismatches are caught at runtime
 * 
 * @example
 * ```typescript
 * const price = Money.fromString('1250.00', 'USD');
 * const tax = Money.fromString('100.00', 'USD');
 * const total = price.add(tax); // Money('1350.00', 'USD')
 * 
 * console.log(total.toString()); // "1350.0000"
 * console.log(total.toJSON()); // { amount: "1350.0000", currency: "USD" }
 * ```
 */
export class Money {
  private readonly value: Decimal;
  readonly currency: CurrencyCode;

  /**
   * Private constructor - use factory methods
   */
  private constructor(value: Decimal, currency: CurrencyCode) {
    this.value = value;
    this.currency = currency;
    Object.freeze(this);
  }

  // ==========================================================================
  // FACTORY METHODS
  // ==========================================================================

  /**
   * Create Money from a string amount
   * 
   * @param amount - Decimal string (e.g., "1250.00")
   * @param currency - ISO 4217 currency code
   * @throws InvalidMoneyError if format is invalid
   */
  static fromString(amount: string, currency: CurrencyCode): Money {
    // Validate format
    if (!MONEY_FORMAT_REGEX.test(amount)) {
      throw new InvalidMoneyError(
        `Invalid amount format: "${amount}". Expected decimal string with up to 4 decimal places.`
      );
    }

    const decimal = new Decimal(amount);

    // Validate non-negative (for most use cases)
    // Use fromStringAllowNegative for corrections/reversals
    if (decimal.isNegative()) {
      throw new NegativeMoneyError(amount);
    }

    return new Money(decimal, currency);
  }

  /**
   * Create Money from a string, allowing negative values
   * Use for corrections and reversals only
   */
  static fromStringAllowNegative(amount: string, currency: CurrencyCode): Money {
    if (!MONEY_FORMAT_REGEX.test(amount)) {
      throw new InvalidMoneyError(
        `Invalid amount format: "${amount}". Expected decimal string with up to 4 decimal places.`
      );
    }

    return new Money(new Decimal(amount), currency);
  }

  /**
   * Create Money from minor units (cents)
   * 
   * @param cents - Amount in minor units (e.g., 125000 for $1,250.00)
   * @param currency - ISO 4217 currency code
   */
  static fromMinorUnits(cents: bigint, currency: CurrencyCode): Money {
    const decimal = new Decimal(cents.toString()).div(100);
    return new Money(decimal, currency);
  }

  /**
   * Create Money with zero value
   */
  static zero(currency: CurrencyCode): Money {
    return new Money(new Decimal(0), currency);
  }

  /**
   * Parse from JSON representation
   */
  static fromJSON(json: MoneyJSON): Money {
    return Money.fromString(json.amount, json.currency as CurrencyCode);
  }

  // ==========================================================================
  // SERIALIZATION
  // ==========================================================================

  /**
   * Convert to string with 4 decimal places
   */
  toString(): string {
    return this.value.toFixed(MAX_DECIMAL_PLACES);
  }

  /**
   * Convert to string with 2 decimal places (for display)
   */
  toDisplayString(): string {
    return this.value.toFixed(2);
  }

  /**
   * Convert to formatted string with currency symbol
   */
  toFormattedString(locale: string = 'en-US'): string {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return formatter.format(this.value.toNumber());
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): MoneyJSON {
    return {
      amount: this.toString(),
      currency: this.currency,
    };
  }

  /**
   * Convert to minor units (cents) as bigint
   */
  toMinorUnits(): bigint {
    return BigInt(this.value.mul(100).round().toString());
  }

  // ==========================================================================
  // ARITHMETIC OPERATIONS
  // ==========================================================================

  /**
   * Add two money values
   * @throws CurrencyMismatchError if currencies don't match
   */
  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.value.plus(other.value), this.currency);
  }

  /**
   * Subtract a money value
   * @throws CurrencyMismatchError if currencies don't match
   */
  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.value.minus(other.value), this.currency);
  }

  /**
   * Multiply by a scalar (e.g., for quantity)
   */
  multiply(scalar: number | string): Money {
    return new Money(this.value.mul(scalar), this.currency);
  }

  /**
   * Divide by a scalar
   */
  divide(scalar: number | string): Money {
    return new Money(this.value.div(scalar), this.currency);
  }

  /**
   * Negate the value (for reversals)
   */
  negate(): Money {
    return new Money(this.value.neg(), this.currency);
  }

  /**
   * Get absolute value
   */
  abs(): Money {
    return new Money(this.value.abs(), this.currency);
  }

  // ==========================================================================
  // COMPARISON OPERATIONS
  // ==========================================================================

  /**
   * Check if greater than another money value
   */
  isGreaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.value.greaterThan(other.value);
  }

  /**
   * Check if greater than or equal to another money value
   */
  isGreaterThanOrEqual(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.value.greaterThanOrEqualTo(other.value);
  }

  /**
   * Check if less than another money value
   */
  isLessThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.value.lessThan(other.value);
  }

  /**
   * Check if less than or equal to another money value
   */
  isLessThanOrEqual(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.value.lessThanOrEqualTo(other.value);
  }

  /**
   * Check if equal to another money value
   */
  equals(other: Money): boolean {
    return this.currency === other.currency && this.value.equals(other.value);
  }

  /**
   * Check if zero
   */
  isZero(): boolean {
    return this.value.isZero();
  }

  /**
   * Check if positive
   */
  isPositive(): boolean {
    return this.value.isPositive();
  }

  /**
   * Check if negative
   */
  isNegative(): boolean {
    return this.value.isNegative();
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  /**
   * Assert that two money values have the same currency
   */
  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new CurrencyMismatchError(this.currency, other.currency);
    }
  }

  /**
   * Compare two money values (for sorting)
   * Returns -1, 0, or 1
   */
  compareTo(other: Money): -1 | 0 | 1 {
    this.assertSameCurrency(other);
    return this.value.comparedTo(other.value) as -1 | 0 | 1;
  }
}

// ============================================================================
// 5. EXPORTS
// ============================================================================

export default Money;
