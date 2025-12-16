// ============================================================================
// COM_PAY_06: AMOUNT INPUT (String-Only)
// Enterprise-grade money input for AP-05 Payment Execution Cell
// ============================================================================
// PHILOSOPHY: "Money is always a string. Never parseFloat until display."
// - All internal state is string
// - All onChange callbacks emit string
// - Display formatting is deferred to blur/display
// ============================================================================

'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// ============================================================================
// 1. TYPES
// ============================================================================

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CHF' | 'CAD' | 'AUD' | 'CNY';

interface AmountInputProps {
  /** Current value as string (e.g., "1250.00") */
  value: string;
  /** Callback when value changes - always emits string */
  onChange: (value: string) => void;
  /** Currency code for symbol display */
  currency?: CurrencyCode;
  /** Placeholder text */
  placeholder?: string;
  /** Is the input disabled? */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Input ID for form association */
  id?: string;
  /** Error state */
  error?: boolean;
  /** Blur callback */
  onBlur?: () => void;
  /** Maximum decimal places (default: 4 for enterprise precision) */
  maxDecimalPlaces?: number;
}

// ============================================================================
// 2. CURRENCY SYMBOLS
// ============================================================================

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CHF: 'CHF',
  CAD: 'C$',
  AUD: 'A$',
  CNY: '¥',
};

function getCurrencySymbol(currency: CurrencyCode): string {
  return CURRENCY_SYMBOLS[currency] || currency;
}

// ============================================================================
// 3. VALIDATION HELPERS
// ============================================================================

/**
 * Validate and sanitize input to only allow valid decimal formats
 * 
 * @param raw - Raw input string
 * @param maxDecimals - Maximum decimal places allowed
 * @returns Sanitized string or null if invalid
 */
function sanitizeAmountInput(raw: string, maxDecimals: number = 4): string | null {
  // Remove all non-numeric except decimal point
  const cleaned = raw.replace(/[^0-9.]/g, '');

  // Don't allow multiple decimal points
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    return null;
  }

  // Validate format: up to maxDecimals decimal places
  const regex = new RegExp(`^\\d*(\\.\\d{0,${maxDecimals}})?$`);
  if (!regex.test(cleaned)) {
    return null;
  }

  return cleaned;
}

/**
 * Format amount for display (on blur)
 * 
 * @param value - Raw string value
 * @returns Formatted string with 2 decimal places
 */
function formatForDisplay(value: string): string {
  if (!value || value === '') return '';

  // Parse and reformat to ensure consistent display
  const num = parseFloat(value);
  if (isNaN(num)) return value;

  // Format with 2 decimal places for display
  return num.toFixed(2);
}

// ============================================================================
// 4. COMPONENT
// ============================================================================

/**
 * AmountInput - Enterprise money input component
 * 
 * Key Features:
 * - String-only value handling (never JavaScript numbers)
 * - Configurable decimal precision (default: 4 places)
 * - Currency symbol display
 * - Right-aligned monospace text for alignment
 * - Display formatting on blur
 * 
 * @example
 * ```tsx
 * const [amount, setAmount] = useState('');
 * 
 * <AmountInput
 *   value={amount}
 *   onChange={setAmount}
 *   currency="USD"
 *   placeholder="0.00"
 * />
 * ```
 */
export function AmountInput({
  value,
  onChange,
  currency = 'USD',
  placeholder = '0.00',
  disabled = false,
  className,
  id,
  error = false,
  onBlur,
  maxDecimalPlaces = 4,
}: AmountInputProps) {
  // Track if we're focused (for display formatting)
  const [isFocused, setIsFocused] = React.useState(false);

  // Display value - raw when focused, formatted when blurred
  const displayValue = React.useMemo(() => {
    if (isFocused) return value;
    return formatForDisplay(value);
  }, [value, isFocused]);

  // Handle input change
  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;

      // Allow empty value
      if (raw === '') {
        onChange('');
        return;
      }

      // Sanitize and validate
      const sanitized = sanitizeAmountInput(raw, maxDecimalPlaces);
      if (sanitized !== null) {
        onChange(sanitized);
      }
      // If sanitization fails, don't update (reject invalid input)
    },
    [onChange, maxDecimalPlaces]
  );

  // Handle focus
  const handleFocus = React.useCallback(() => {
    setIsFocused(true);
  }, []);

  // Handle blur
  const handleBlur = React.useCallback(() => {
    setIsFocused(false);

    // Normalize on blur (e.g., "5." becomes "5.00")
    if (value && value !== '') {
      const formatted = formatForDisplay(value);
      // Only emit if different (avoid infinite loops)
      if (formatted !== value) {
        // Keep full precision internally, only display is formatted
        // Don't change the actual value, just let display update
      }
    }

    onBlur?.();
  }, [value, onBlur]);

  const currencySymbol = getCurrencySymbol(currency);

  return (
    <div className="relative">
      {/* Currency symbol */}
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">
        {currencySymbol}
      </span>

      {/* Input */}
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          // Base styles
          'pl-8 text-right font-mono',
          // Error state
          error && 'border-destructive focus-visible:ring-destructive',
          // Custom classes
          className
        )}
        autoComplete="off"
        spellCheck={false}
      />
    </div>
  );
}

// ============================================================================
// 5. EXPORTS
// ============================================================================

export { getCurrencySymbol, sanitizeAmountInput, formatForDisplay };
