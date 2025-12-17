/**
 * useUrlSyncedFilters - Hook for URL-synced filter state
 *
 * Enables shareable filter links by syncing filter state to URL params.
 *
 * @example
 * const { filters, setFilters, copyLink, clearFilters } = useUrlSyncedFilters({
 *   entityType: 'invoice',
 *   defaultFilters: { status: 'all' },
 * });
 */

'use client';

import * as React from 'react';

// ============================================================
// Types
// ============================================================

export type FilterValue = string | number | boolean | string[] | null | undefined;

export interface Filters {
  [key: string]: FilterValue;
}

export interface UseUrlSyncedFiltersOptions<T extends Filters = Filters> {
  /** Entity type for namespacing */
  entityType: string;
  /** Default filter values */
  defaultFilters?: Partial<T>;
  /** Sync to URL parameters */
  syncToUrl?: boolean;
  /** URL param prefix */
  paramPrefix?: string;
  /** Callback when filters change */
  onFiltersChange?: (filters: T) => void;
}

export interface UseUrlSyncedFiltersReturn<T extends Filters = Filters> {
  /** Current filters */
  filters: T;
  /** Set all filters */
  setFilters: (filters: T | ((prev: T) => T)) => void;
  /** Set a single filter */
  setFilter: <K extends keyof T>(key: K, value: T[K]) => void;
  /** Clear all filters */
  clearFilters: () => void;
  /** Copy shareable filter link to clipboard */
  copyLink: () => Promise<boolean>;
  /** Get shareable URL */
  getShareableUrl: () => string;
  /** Is filter active (different from default) */
  isFilterActive: (key: keyof T) => boolean;
  /** Has any active filters */
  hasActiveFilters: boolean;
}

// ============================================================
// Utility Functions
// ============================================================

function encodeFilters(filters: Filters, prefix: string = ''): URLSearchParams {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') continue;

    const paramKey = prefix ? `${prefix}_${key}` : key;

    if (Array.isArray(value)) {
      value.forEach((v) => params.append(paramKey, String(v)));
    } else {
      params.set(paramKey, String(value));
    }
  }

  return params;
}

function decodeFilters<T extends Filters>(
  searchParams: URLSearchParams,
  prefix: string = '',
  defaults: Partial<T> = {}
): T {
  const filters: Filters = { ...defaults };

  searchParams.forEach((value, key) => {
    const filterKey = prefix ? key.replace(`${prefix}_`, '') : key;

    // Skip keys that don't match the prefix
    if (prefix && !key.startsWith(`${prefix}_`)) return;

    // Handle arrays (multiple values with same key)
    const existingValue = filters[filterKey];
    if (existingValue !== undefined) {
      if (Array.isArray(existingValue)) {
        (existingValue as string[]).push(value);
      } else {
        filters[filterKey] = [String(existingValue), value];
      }
    } else {
      // Try to parse as number or boolean
      if (value === 'true') {
        filters[filterKey] = true;
      } else if (value === 'false') {
        filters[filterKey] = false;
      } else if (!isNaN(Number(value)) && value !== '') {
        filters[filterKey] = Number(value);
      } else {
        filters[filterKey] = value;
      }
    }
  });

  return filters as T;
}

// ============================================================
// Hook
// ============================================================

export function useUrlSyncedFilters<T extends Filters = Filters>({
  entityType,
  defaultFilters = {} as Partial<T>,
  syncToUrl = true,
  paramPrefix,
  onFiltersChange,
}: UseUrlSyncedFiltersOptions<T>): UseUrlSyncedFiltersReturn<T> {
  const prefix = paramPrefix || entityType;

  // Initialize from URL or defaults
  const getInitialFilters = (): T => {
    if (typeof window === 'undefined' || !syncToUrl) {
      return defaultFilters as T;
    }

    const searchParams = new URLSearchParams(window.location.search);
    return decodeFilters<T>(searchParams, prefix, defaultFilters);
  };

  const [filters, setFiltersState] = React.useState<T>(getInitialFilters);

  // Sync to URL when filters change
  React.useEffect(() => {
    if (!syncToUrl || typeof window === 'undefined') return;

    const url = new URL(window.location.href);

    // Remove existing filter params
    Array.from(url.searchParams.keys())
      .filter((key) => key.startsWith(`${prefix}_`))
      .forEach((key) => url.searchParams.delete(key));

    // Add current filters
    const filterParams = encodeFilters(filters, prefix);
    filterParams.forEach((value, key) => url.searchParams.append(key, value));

    // Update URL without reload
    window.history.replaceState({}, '', url.toString());
  }, [filters, syncToUrl, prefix]);

  const setFilters = React.useCallback(
    (newFilters: T | ((prev: T) => T)) => {
      setFiltersState((prev) => {
        const updated =
          typeof newFilters === 'function' ? newFilters(prev) : newFilters;
        onFiltersChange?.(updated);
        return updated;
      });
    },
    [onFiltersChange]
  );

  const setFilter = React.useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [setFilters]
  );

  const clearFilters = React.useCallback(() => {
    setFilters(defaultFilters as T);
  }, [defaultFilters, setFilters]);

  const getShareableUrl = React.useCallback((): string => {
    if (typeof window === 'undefined') return '';

    const url = new URL(window.location.href);

    // Clear and set filter params
    Array.from(url.searchParams.keys())
      .filter((key) => key.startsWith(`${prefix}_`))
      .forEach((key) => url.searchParams.delete(key));

    const filterParams = encodeFilters(filters, prefix);
    filterParams.forEach((value, key) => url.searchParams.append(key, value));

    return url.toString();
  }, [filters, prefix]);

  const copyLink = React.useCallback(async (): Promise<boolean> => {
    try {
      const url = getShareableUrl();
      await navigator.clipboard.writeText(url);
      return true;
    } catch (error) {
      console.error('Failed to copy link:', error);
      return false;
    }
  }, [getShareableUrl]);

  const isFilterActive = React.useCallback(
    (key: keyof T): boolean => {
      const currentValue = filters[key];
      const defaultValue = defaultFilters[key as keyof typeof defaultFilters];

      if (currentValue === undefined || currentValue === null) return false;
      if (Array.isArray(currentValue) && currentValue.length === 0) return false;
      if (currentValue === '') return false;

      return JSON.stringify(currentValue) !== JSON.stringify(defaultValue);
    },
    [filters, defaultFilters]
  );

  const hasActiveFilters = React.useMemo(() => {
    return Object.keys(filters).some((key) => isFilterActive(key as keyof T));
  }, [filters, isFilterActive]);

  return {
    filters,
    setFilters,
    setFilter,
    clearFilters,
    copyLink,
    getShareableUrl,
    isFilterActive,
    hasActiveFilters,
  };
}
