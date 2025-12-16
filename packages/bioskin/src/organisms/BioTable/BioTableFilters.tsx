/**
 * BioTableFilters - Global search and column filters
 * 
 * Sprint 2 Day 8 per BIOSKIN 2.1 PRD
 * Provides global search and per-column filtering.
 */

'use client';

import * as React from 'react';
import { type Table, type Column } from '@tanstack/react-table';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Filter } from 'lucide-react';
import { cn } from '../../atoms/utils';
import { Txt } from '../../atoms/Txt';

// ============================================================
// Global Filter (Search)
// ============================================================

export interface BioTableGlobalFilterProps {
  /** Current filter value */
  value: string;
  /** Callback when filter changes */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Additional className */
  className?: string;
  /** Debounce delay in ms (default: 300) */
  debounceMs?: number;
}

export function BioTableGlobalFilter({
  value,
  onChange,
  placeholder = 'Search...',
  className,
  debounceMs = 300,
}: BioTableGlobalFilterProps) {
  const [localValue, setLocalValue] = React.useState(value);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Debounced update
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(localValue);
    }, debounceMs);

    return () => clearTimeout(timeout);
  }, [localValue, onChange, debounceMs]);

  // Sync external changes
  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleClear = () => {
    setLocalValue('');
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full pl-9 pr-9 py-2 rounded-lg',
          'bg-surface-subtle border border-default',
          'text-body text-text-primary placeholder:text-text-muted',
          'focus:outline-none focus:ring-2 focus:ring-accent-primary/30 focus:border-accent-primary',
          'transition-colors'
        )}
      />
      <AnimatePresence>
        {localValue && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            onClick={handleClear}
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2',
              'p-1 rounded-full hover:bg-surface-hover',
              'text-text-muted hover:text-text-secondary',
              'transition-colors'
            )}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// Column Filter
// ============================================================

export interface BioTableColumnFilterProps<TData, TValue> {
  /** TanStack column instance */
  column: Column<TData, TValue>;
  /** Placeholder text */
  placeholder?: string;
  /** Additional className */
  className?: string;
}

export function BioTableColumnFilter<TData, TValue>({
  column,
  placeholder,
  className,
}: BioTableColumnFilterProps<TData, TValue>) {
  const columnFilterValue = column.getFilterValue() as string | undefined;
  const [localValue, setLocalValue] = React.useState(columnFilterValue ?? '');

  // Debounced update
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      column.setFilterValue(localValue || undefined);
    }, 300);

    return () => clearTimeout(timeout);
  }, [localValue, column]);

  // Sync external changes
  React.useEffect(() => {
    setLocalValue(columnFilterValue ?? '');
  }, [columnFilterValue]);

  const columnName = typeof column.columnDef.header === 'string'
    ? column.columnDef.header
    : column.id;

  return (
    <input
      type="text"
      value={localValue}
      onChange={e => setLocalValue(e.target.value)}
      placeholder={placeholder ?? `Filter ${columnName}...`}
      className={cn(
        'w-full px-2 py-1 rounded',
        'bg-surface-base border border-default',
        'text-small text-text-primary placeholder:text-text-muted',
        'focus:outline-none focus:ring-1 focus:ring-accent-primary/30 focus:border-accent-primary',
        'transition-colors',
        className
      )}
    />
  );
}

// ============================================================
// Filter Bar (combines global + active filter badges)
// ============================================================

export interface BioTableFilterBarProps<TData> {
  /** TanStack table instance */
  table: Table<TData>;
  /** Global filter value */
  globalFilter: string;
  /** Callback when global filter changes */
  onGlobalFilterChange: (value: string) => void;
  /** Callback to clear all filters */
  onClearFilters: () => void;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Show result count */
  showResultCount?: boolean;
  /** Additional className */
  className?: string;
}

export function BioTableFilterBar<TData>({
  table,
  globalFilter,
  onGlobalFilterChange,
  onClearFilters,
  searchPlaceholder = 'Search all columns...',
  showResultCount = true,
  className,
}: BioTableFilterBarProps<TData>) {
  const columnFilters = table.getState().columnFilters;
  const hasActiveFilters = globalFilter || columnFilters.length > 0;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const totalCount = table.getCoreRowModel().rows.length;
  const isFiltered = filteredCount !== totalCount;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center gap-3">
        {/* Global search */}
        <BioTableGlobalFilter
          value={globalFilter}
          onChange={onGlobalFilterChange}
          placeholder={searchPlaceholder}
          className="flex-1 max-w-sm"
        />

        {/* Clear all filters */}
        <AnimatePresence>
          {hasActiveFilters && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              onClick={onClearFilters}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg',
                'bg-surface-subtle hover:bg-surface-hover',
                'text-small text-text-secondary hover:text-text-primary',
                'border border-default',
                'transition-colors'
              )}
            >
              <X className="h-3.5 w-3.5" />
              Clear filters
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Active filter badges + result count */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Column filter badges */}
        {columnFilters.map(filter => (
          <motion.span
            key={filter.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
              'inline-flex items-center gap-1 px-2 py-1 rounded-full',
              'bg-accent-primary/10 text-accent-primary',
              'text-small font-medium'
            )}
          >
            <Filter className="h-3 w-3" />
            <span>{filter.id}: {String(filter.value)}</span>
            <button
              onClick={() => table.getColumn(filter.id)?.setFilterValue(undefined)}
              className="hover:bg-accent-primary/20 rounded-full p-0.5 transition-colors"
              aria-label={`Clear ${filter.id} filter`}
            >
              <X className="h-3 w-3" />
            </button>
          </motion.span>
        ))}

        {/* Result count */}
        {showResultCount && isFiltered && (
          <Txt variant="caption" color="secondary" className="ml-auto">
            Showing {filteredCount} of {totalCount} results
          </Txt>
        )}
      </div>
    </div>
  );
}

BioTableGlobalFilter.displayName = 'BioTableGlobalFilter';
BioTableColumnFilter.displayName = 'BioTableColumnFilter';
BioTableFilterBar.displayName = 'BioTableFilterBar';
