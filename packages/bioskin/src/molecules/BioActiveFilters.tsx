'use client';

/**
 * BioActiveFilters - Always-visible filter transparency banner
 *
 * Controllers need to always know what filters are active.
 * This component displays active filters prominently and allows clearing.
 *
 * @example
 * <BioActiveFilters
 *   filters={[
 *     { field: 'entity', label: 'Entity', value: 'Company A' },
 *     { field: 'period', label: 'Period', value: '2025-01' },
 *   ]}
 *   onClear={(field) => clearFilter(field)}
 *   onClearAll={() => clearAllFilters()}
 * />
 *
 * @see FINANCE_ERP_GAP_ANALYSIS.md - Requirement #6
 */

import * as React from 'react';
import { motion as Motion, AnimatePresence } from 'motion/react';
import { X, Filter, AlertCircle, Share2, Link2, Check } from 'lucide-react';
import { cn } from '../atoms/utils';
import { Btn } from '../atoms/Btn';

// ============================================================
// Types
// ============================================================

export interface ActiveFilter {
  /** Field identifier */
  field: string;
  /** Human-readable label */
  label: string;
  /** Display value */
  value: string | number | Date;
  /** Operator for display */
  operator?: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'between';
  /** Second value for 'between' operator */
  valueTo?: string | number | Date;
  /** Is this a critical/restrictive filter */
  critical?: boolean;
}

export interface BioActiveFiltersProps {
  /** Active filters to display */
  filters: ActiveFilter[];
  /** Callback when a filter is cleared */
  onClear?: (field: string) => void;
  /** Callback when all filters are cleared */
  onClearAll?: () => void;
  /** Show warning if filters might hide data */
  showWarning?: boolean;
  /** Warning message */
  warningMessage?: string;
  /** Compact mode */
  compact?: boolean;
  /** Additional class names */
  className?: string;
  /** Maximum filters to show before collapsing */
  maxVisible?: number;
  /** Enable share functionality */
  enableShare?: boolean;
  /** Custom share URL generator */
  getShareUrl?: (filters: ActiveFilter[]) => string;
  /** Called when filters are shared */
  onShare?: (url: string) => void;
}

// ============================================================
// Animation Constants
// ============================================================

const FILTER_ANIMATION = {
  initial: { opacity: 0, scale: 0.9, x: -10 },
  animate: { opacity: 1, scale: 1, x: 0 },
  exit: { opacity: 0, scale: 0.9, x: 10 },
  transition: { duration: 0.15 },
};

const BANNER_ANIMATION = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0 },
  transition: { duration: 0.2 },
};

// ============================================================
// Helper Functions
// ============================================================

function formatOperator(operator?: string): string {
  switch (operator) {
    case 'gt':
      return '>';
    case 'lt':
      return '<';
    case 'gte':
      return '≥';
    case 'lte':
      return '≤';
    case 'contains':
      return 'contains';
    case 'between':
      return 'between';
    default:
      return '=';
  }
}

function formatValue(value: string | number | Date, valueTo?: string | number | Date): string {
  const formatSingle = (v: string | number | Date): string => {
    if (v instanceof Date) {
      return v.toLocaleDateString();
    }
    return String(v);
  };

  if (valueTo !== undefined) {
    return `${formatSingle(value)} and ${formatSingle(valueTo)}`;
  }
  return formatSingle(value);
}

// ============================================================
// Filter Chip Component
// ============================================================

const FilterChip = React.memo(function FilterChip({
  filter,
  onClear,
  compact,
}: {
  filter: ActiveFilter;
  onClear?: (field: string) => void;
  compact?: boolean;
}) {
  const handleClear = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClear?.(filter.field);
    },
    [onClear, filter.field]
  );

  return (
    <Motion.div
      layout
      {...FILTER_ANIMATION}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full',
        'bg-primary/10 text-primary',
        'border border-primary/20',
        compact ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        filter.critical && 'bg-amber-100 text-amber-800 border-amber-300'
      )}
    >
      {filter.critical && <AlertCircle size={compact ? 10 : 12} />}
      <span className="font-medium">{filter.label}</span>
      <span className="opacity-70">{formatOperator(filter.operator)}</span>
      <span className="font-mono">{formatValue(filter.value, filter.valueTo)}</span>
      {onClear && (
        <button
          type="button"
          onClick={handleClear}
          className={cn(
            'ml-0.5 rounded-full p-0.5',
            'hover:bg-primary/20 transition-colors',
            'focus:outline-none focus:ring-1 focus:ring-primary/30'
          )}
          aria-label={`Clear ${filter.label} filter`}
        >
          <X size={compact ? 10 : 12} />
        </button>
      )}
    </Motion.div>
  );
});

// ============================================================
// Main Component
// ============================================================

export const BioActiveFilters = React.memo(function BioActiveFilters({
  filters,
  onClear,
  onClearAll,
  showWarning = false,
  warningMessage = 'Filters are restricting the data shown',
  compact = false,
  className,
  maxVisible = 5,
  enableShare = false,
  getShareUrl,
  onShare,
}: BioActiveFiltersProps) {
  const [expanded, setExpanded] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const visibleFilters = React.useMemo(() => {
    if (expanded || filters.length <= maxVisible) {
      return filters;
    }
    return filters.slice(0, maxVisible);
  }, [filters, expanded, maxVisible]);

  const hiddenCount = filters.length - visibleFilters.length;
  const hasCriticalFilters = filters.some((f) => f.critical);

  // Generate shareable URL
  const generateShareUrl = React.useCallback(() => {
    if (getShareUrl) {
      return getShareUrl(filters);
    }

    // Default URL generation
    const url = new URL(window.location.href);
    const filterParams = filters.map(f => ({
      field: f.field,
      op: f.operator || 'eq',
      value: String(f.value),
      valueTo: f.valueTo ? String(f.valueTo) : undefined,
    }));
    url.searchParams.set('filters', btoa(JSON.stringify(filterParams)));
    return url.toString();
  }, [filters, getShareUrl]);

  // Handle share click
  const handleShare = React.useCallback(async () => {
    const url = generateShareUrl();

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onShare?.(url);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  }, [generateShareUrl, onShare]);

  if (filters.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <Motion.div
        {...BANNER_ANIMATION}
        className={cn(
          'flex flex-wrap items-center gap-2',
          'rounded-lg border bg-muted/30 p-2',
          hasCriticalFilters && 'border-amber-300 bg-amber-50',
          className
        )}
        role="region"
        aria-label="Active filters"
      >
        {/* Filter icon */}
        <div className={cn('flex items-center gap-1.5', compact ? 'text-xs' : 'text-sm')}>
          <Filter size={compact ? 12 : 14} className="text-muted-foreground" />
          <span className="font-medium text-muted-foreground">
            {filters.length === 1 ? '1 filter' : `${filters.length} filters`}:
          </span>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <AnimatePresence mode="popLayout">
            {visibleFilters.map((filter) => (
              <FilterChip
                key={filter.field}
                filter={filter}
                onClear={onClear}
                compact={compact}
              />
            ))}
          </AnimatePresence>

          {/* Show more button */}
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className={cn(
                'text-primary hover:underline',
                compact ? 'text-xs' : 'text-sm'
              )}
            >
              +{hiddenCount} more
            </button>
          )}

          {/* Show less button */}
          {expanded && filters.length > maxVisible && (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className={cn(
                'text-muted-foreground hover:underline',
                compact ? 'text-xs' : 'text-sm'
              )}
            >
              Show less
            </button>
          )}
        </div>

        {/* Warning */}
        {showWarning && (
          <div className="flex items-center gap-1.5 text-amber-700 text-sm">
            <AlertCircle size={14} />
            <span>{warningMessage}</span>
          </div>
        )}

        {/* Share and Clear buttons */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Share button */}
          {enableShare && filters.length > 0 && (
            <Btn
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="gap-1.5"
            >
              {copied ? (
                <>
                  <Check size={compact ? 12 : 14} className="text-status-success" />
                  Copied!
                </>
              ) : (
                <>
                  <Link2 size={compact ? 12 : 14} />
                  Share
                </>
              )}
            </Btn>
          )}

          {/* Clear all button */}
          {onClearAll && filters.length > 0 && (
            <Btn
              variant="ghost"
              size="sm"
              onClick={onClearAll}
            >
              Clear all
            </Btn>
          )}
        </div>
      </Motion.div>
    </AnimatePresence>
  );
});

BioActiveFilters.displayName = 'BioActiveFilters';

export default BioActiveFilters;
