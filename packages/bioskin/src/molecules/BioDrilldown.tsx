'use client';

/**
 * BioDrilldown - Clickable financial numbers with drill-down navigation
 *
 * Every number in an accounting system should be drillable to its source.
 * This component wraps a value and makes it clickable with pre-applied filters.
 *
 * @example
 * <BioDrilldown
 *   value={1500000}
 *   format="currency"
 *   filters={{ account: '4000', period: '2025-01' }}
 *   onDrilldown={(filters) => router.push(`/gl?${qs.stringify(filters)}`)}
 * />
 *
 * @see FINANCE_ERP_GAP_ANALYSIS.md - Requirement #1
 */

import * as React from 'react';
import { motion as Motion } from 'motion/react';
import { ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../atoms/utils';
import { useLocale } from '../providers/BioLocaleProvider';

// ============================================================
// Types
// ============================================================

export type DrilldownFormat = 'currency' | 'number' | 'percent' | 'integer';

export interface DrilldownFilter {
  field: string;
  value: string | number | boolean | Date;
  operator?: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'between';
}

export interface BioDrilldownProps {
  /** The numeric value to display */
  value: number;
  /** Display format */
  format?: DrilldownFormat;
  /** Currency code for currency format */
  currency?: string;
  /** Decimal places */
  decimals?: number;
  /** Filters to pass when drilling down */
  filters?: Record<string, unknown> | DrilldownFilter[];
  /** Entity type for drill-down (e.g., 'gl', 'invoices', 'payments') */
  entity?: string;
  /** Callback when user clicks to drill down */
  onDrilldown?: (params: { entity?: string; filters: Record<string, unknown> }) => void;
  /** Show trend indicator (up/down/neutral) */
  trend?: 'up' | 'down' | 'neutral';
  /** Comparison value for trend calculation */
  compareValue?: number;
  /** Label for accessibility */
  label?: string;
  /** Additional class names */
  className?: string;
  /** Disable drill-down interaction */
  disabled?: boolean;
  /** Show drill-down icon */
  showIcon?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

// ============================================================
// Animation Constants
// ============================================================

const HOVER_ANIMATION = {
  scale: 1.02,
  transition: { duration: 0.15 },
};

const TAP_ANIMATION = {
  scale: 0.98,
};

// ============================================================
// Size Mappings
// ============================================================

const SIZE_CLASSES = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg font-semibold',
} as const;

const ICON_SIZES = {
  sm: 12,
  md: 14,
  lg: 16,
} as const;

// ============================================================
// Component
// ============================================================

export const BioDrilldown = React.memo(function BioDrilldown({
  value,
  format = 'number',
  currency = 'USD',
  decimals,
  filters = {},
  entity,
  onDrilldown,
  trend,
  compareValue,
  label,
  className,
  disabled = false,
  showIcon = true,
  size = 'md',
}: BioDrilldownProps) {
  const locale = useLocale();

  // Calculate trend from comparison if not provided
  const calculatedTrend = React.useMemo(() => {
    if (trend) return trend;
    if (compareValue === undefined) return undefined;
    if (value > compareValue) return 'up';
    if (value < compareValue) return 'down';
    return 'neutral';
  }, [trend, compareValue, value]);

  // Format the value based on format type
  const formattedValue = React.useMemo(() => {
    const decimalPlaces = decimals ?? (format === 'currency' ? 2 : format === 'percent' ? 1 : 0);

    switch (format) {
      case 'currency':
        return locale.formatCurrency(value, currency);
      case 'percent':
        return locale.formatPercent(value / 100);
      case 'integer':
        return locale.formatNumber(Math.round(value), { maximumFractionDigits: 0 });
      case 'number':
      default:
        return locale.formatNumber(value, {
          minimumFractionDigits: decimalPlaces,
          maximumFractionDigits: decimalPlaces,
        });
    }
  }, [value, format, currency, decimals, locale]);

  // Normalize filters to object format
  const normalizedFilters = React.useMemo(() => {
    if (Array.isArray(filters)) {
      return filters.reduce((acc, f) => {
        acc[f.field] = f.value;
        return acc;
      }, {} as Record<string, unknown>);
    }
    return filters;
  }, [filters]);

  // Handle click
  const handleClick = React.useCallback(() => {
    if (disabled || !onDrilldown) return;
    onDrilldown({ entity, filters: normalizedFilters });
  }, [disabled, onDrilldown, entity, normalizedFilters]);

  // Handle keyboard
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  // Trend icon
  const TrendIcon = React.useMemo(() => {
    if (!calculatedTrend) return null;
    switch (calculatedTrend) {
      case 'up':
        return <TrendingUp size={ICON_SIZES[size]} className="text-green-600" />;
      case 'down':
        return <TrendingDown size={ICON_SIZES[size]} className="text-red-600" />;
      case 'neutral':
        return <Minus size={ICON_SIZES[size]} className="text-muted-foreground" />;
    }
  }, [calculatedTrend, size]);

  const isInteractive = !disabled && !!onDrilldown;

  return (
    <Motion.button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled || !onDrilldown}
      whileHover={isInteractive ? HOVER_ANIMATION : undefined}
      whileTap={isInteractive ? TAP_ANIMATION : undefined}
      className={cn(
        'inline-flex items-center gap-1.5 rounded px-1.5 py-0.5',
        'font-mono tabular-nums',
        SIZE_CLASSES[size],
        isInteractive && [
          'cursor-pointer',
          'hover:bg-primary/5 hover:text-primary',
          'focus:outline-none focus:ring-2 focus:ring-primary/20',
          'transition-colors',
        ],
        disabled && 'cursor-not-allowed opacity-50',
        !isInteractive && 'cursor-default',
        value < 0 && 'text-red-600',
        className
      )}
      aria-label={label || `${formattedValue}, click to drill down`}
      tabIndex={isInteractive ? 0 : -1}
    >
      {TrendIcon}
      <span>{formattedValue}</span>
      {isInteractive && showIcon && (
        <ExternalLink size={ICON_SIZES[size]} className="opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </Motion.button>
  );
});

BioDrilldown.displayName = 'BioDrilldown';

export default BioDrilldown;
