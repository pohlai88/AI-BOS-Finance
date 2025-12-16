/**
 * Money Value Object Tests
 * 
 * AP-05 Control Tests: Money Precision Integrity
 */

import { describe, it, expect } from 'vitest';
import {
  Money,
  InvalidMoneyError,
  CurrencyMismatchError,
  NegativeMoneyError,
} from '@aibos/canon-governance';

describe('Money Value Object', () => {
  // ==========================================================================
  // CONSTRUCTION TESTS
  // ==========================================================================

  describe('fromString', () => {
    it('creates Money from valid string', () => {
      const money = Money.fromString('1250.00', 'USD');
      expect(money.toString()).toBe('1250.0000');
      expect(money.currency).toBe('USD');
    });

    it('accepts integer strings', () => {
      const money = Money.fromString('1000', 'USD');
      expect(money.toString()).toBe('1000.0000');
    });

    it('accepts up to 4 decimal places', () => {
      const money = Money.fromString('1250.1234', 'USD');
      expect(money.toString()).toBe('1250.1234');
    });

    it('throws InvalidMoneyError for invalid format', () => {
      expect(() => Money.fromString('1,250.00', 'USD'))
        .toThrow(InvalidMoneyError);

      expect(() => Money.fromString('$1250', 'USD'))
        .toThrow(InvalidMoneyError);

      expect(() => Money.fromString('abc', 'USD'))
        .toThrow(InvalidMoneyError);
    });

    it('throws InvalidMoneyError for more than 4 decimal places', () => {
      expect(() => Money.fromString('1250.12345', 'USD'))
        .toThrow(InvalidMoneyError);
    });

    it('throws NegativeMoneyError for negative amounts', () => {
      expect(() => Money.fromString('-100.00', 'USD'))
        .toThrow(NegativeMoneyError);
    });
  });

  describe('fromMinorUnits', () => {
    it('creates Money from cents', () => {
      const money = Money.fromMinorUnits(125000n, 'USD');
      expect(money.toString()).toBe('1250.0000');
    });

    it('handles small amounts', () => {
      const money = Money.fromMinorUnits(1n, 'USD');
      expect(money.toString()).toBe('0.0100');
    });
  });

  describe('zero', () => {
    it('creates zero Money', () => {
      const money = Money.zero('USD');
      expect(money.isZero()).toBe(true);
      expect(money.toString()).toBe('0.0000');
    });
  });

  // ==========================================================================
  // PRECISION TESTS (Critical for Finance)
  // ==========================================================================

  describe('precision', () => {
    it('test_money_addition_preserves_precision', () => {
      // This test verifies the PRD KPI: Money Precision = 0.0001
      const a = Money.fromString('0.1', 'USD');
      const b = Money.fromString('0.2', 'USD');
      const result = a.add(b);

      // 0.1 + 0.2 should equal 0.3 exactly, not 0.30000000000000004
      expect(result.toString()).toBe('0.3000');
    });

    it('handles large numbers without precision loss', () => {
      const a = Money.fromString('9999999999999.9999', 'USD');
      const b = Money.fromString('0.0001', 'USD');
      const result = a.add(b);

      expect(result.toString()).toBe('10000000000000.0000');
    });

    it('division maintains 4 decimal precision', () => {
      const money = Money.fromString('100.00', 'USD');
      const result = money.divide(3);

      // Should be 33.3333... but truncated/rounded to 4 decimals
      expect(result.toString()).toMatch(/^33\.33/);
    });
  });

  // ==========================================================================
  // ARITHMETIC TESTS
  // ==========================================================================

  describe('arithmetic', () => {
    it('adds two money values correctly', () => {
      const a = Money.fromString('1250.00', 'USD');
      const b = Money.fromString('500.50', 'USD');
      const result = a.add(b);

      expect(result.toString()).toBe('1750.5000');
    });

    it('subtracts two money values correctly', () => {
      const a = Money.fromString('1250.00', 'USD');
      const b = Money.fromString('500.00', 'USD');
      const result = a.subtract(b);

      expect(result.toString()).toBe('750.0000');
    });

    it('multiplies by scalar', () => {
      const money = Money.fromString('100.00', 'USD');
      const result = money.multiply(3);

      expect(result.toString()).toBe('300.0000');
    });

    it('throws CurrencyMismatchError when adding different currencies', () => {
      const usd = Money.fromString('100.00', 'USD');
      const eur = Money.fromString('100.00', 'EUR');

      expect(() => usd.add(eur)).toThrow(CurrencyMismatchError);
    });
  });

  // ==========================================================================
  // COMPARISON TESTS
  // ==========================================================================

  describe('comparison', () => {
    it('compares money values correctly', () => {
      const a = Money.fromString('100.00', 'USD');
      const b = Money.fromString('200.00', 'USD');
      const c = Money.fromString('100.00', 'USD');

      expect(a.isLessThan(b)).toBe(true);
      expect(b.isGreaterThan(a)).toBe(true);
      expect(a.equals(c)).toBe(true);
    });

    it('throws on currency mismatch in comparison', () => {
      const usd = Money.fromString('100.00', 'USD');
      const eur = Money.fromString('100.00', 'EUR');

      expect(() => usd.isGreaterThan(eur)).toThrow(CurrencyMismatchError);
    });
  });

  // ==========================================================================
  // SERIALIZATION TESTS
  // ==========================================================================

  describe('serialization', () => {
    it('toJSON returns correct format', () => {
      const money = Money.fromString('1250.50', 'USD');
      const json = money.toJSON();

      expect(json).toEqual({
        amount: '1250.5000',
        currency: 'USD',
      });
    });

    it('fromJSON round-trips correctly', () => {
      const original = Money.fromString('1250.50', 'USD');
      const json = original.toJSON();
      const restored = Money.fromJSON(json);

      expect(restored.equals(original)).toBe(true);
    });

    it('toDisplayString formats for display', () => {
      const money = Money.fromString('1250.5678', 'USD');
      expect(money.toDisplayString()).toBe('1250.57'); // Rounded to 2 decimals
    });
  });

  // ==========================================================================
  // IMMUTABILITY TESTS
  // ==========================================================================

  describe('immutability', () => {
    it('operations return new instances', () => {
      const original = Money.fromString('100.00', 'USD');
      const added = original.add(Money.fromString('50.00', 'USD'));

      expect(original.toString()).toBe('100.0000'); // Original unchanged
      expect(added.toString()).toBe('150.0000');
    });
  });
});
