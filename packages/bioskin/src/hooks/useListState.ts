/**
 * useListState - Context preservation for list views
 *
 * Features:
 * - Preserve scroll position
 * - Preserve selection
 * - Preserve filters
 * - Preserve sort state
 * - Restore on back navigation
 */

'use client';

import * as React from 'react';

// ============================================================
// Types
// ============================================================

export interface ListState<TFilters = Record<string, unknown>> {
  /** Scroll position */
  scrollTop: number;
  /** Selected item IDs */
  selectedIds: string[];
  /** Active/focused item ID */
  activeId: string | null;
  /** Current filters */
  filters: TFilters;
  /** Sort column */
  sortColumn: string | null;
  /** Sort direction */
  sortDirection: 'asc' | 'desc';
  /** Page index */
  pageIndex: number;
  /** Search query */
  searchQuery: string;
  /** Timestamp of last update */
  timestamp: number;
}

export interface UseListStateOptions<TFilters = Record<string, unknown>> {
  /** Unique key for this list */
  listKey: string;
  /** Default filter values */
  defaultFilters?: TFilters;
  /** Default sort column */
  defaultSortColumn?: string;
  /** Default sort direction */
  defaultSortDirection?: 'asc' | 'desc';
  /** Scroll container ref */
  scrollContainerRef?: React.RefObject<HTMLElement>;
  /** Auto-save on changes */
  autoSave?: boolean;
  /** Persist to localStorage */
  persist?: boolean;
}

export interface UseListStateReturn<TFilters = Record<string, unknown>> {
  /** Current state */
  state: ListState<TFilters>;
  /** Set scroll position */
  setScrollTop: (value: number) => void;
  /** Set selected IDs */
  setSelectedIds: (ids: string[]) => void;
  /** Toggle selection */
  toggleSelection: (id: string) => void;
  /** Set active ID */
  setActiveId: (id: string | null) => void;
  /** Set filters */
  setFilters: (filters: TFilters | ((prev: TFilters) => TFilters)) => void;
  /** Set sort */
  setSort: (column: string, direction?: 'asc' | 'desc') => void;
  /** Set page index */
  setPageIndex: (index: number) => void;
  /** Set search query */
  setSearchQuery: (query: string) => void;
  /** Save current state */
  save: () => void;
  /** Restore saved state */
  restore: () => boolean;
  /** Clear saved state */
  clear: () => void;
  /** Reset to defaults */
  reset: () => void;
}

// ============================================================
// Default state
// ============================================================

function getDefaultState<TFilters>(
  defaultFilters: TFilters,
  defaultSortColumn?: string,
  defaultSortDirection?: 'asc' | 'desc'
): ListState<TFilters> {
  return {
    scrollTop: 0,
    selectedIds: [],
    activeId: null,
    filters: defaultFilters,
    sortColumn: defaultSortColumn || null,
    sortDirection: defaultSortDirection || 'asc',
    pageIndex: 0,
    searchQuery: '',
    timestamp: Date.now(),
  };
}

// ============================================================
// Hook
// ============================================================

export function useListState<TFilters = Record<string, unknown>>({
  listKey,
  defaultFilters = {} as TFilters,
  defaultSortColumn,
  defaultSortDirection = 'asc',
  scrollContainerRef,
  autoSave = true,
  persist = true,
}: UseListStateOptions<TFilters>): UseListStateReturn<TFilters> {
  const storageKey = `bioskin_list_state_${listKey}`;

  const [state, setState] = React.useState<ListState<TFilters>>(() =>
    getDefaultState(defaultFilters, defaultSortColumn, defaultSortDirection)
  );

  // Load saved state on mount
  React.useEffect(() => {
    if (persist) {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          setState(prev => ({ ...prev, ...parsed, timestamp: Date.now() }));
        }
      } catch (error) {
        console.error('Failed to load list state:', error);
      }
    }
  }, [storageKey, persist]);

  // Track scroll position
  React.useEffect(() => {
    const container = scrollContainerRef?.current;
    if (!container) return;

    const handleScroll = () => {
      setState(prev => ({ ...prev, scrollTop: container.scrollTop }));
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [scrollContainerRef]);

  // Restore scroll position
  React.useEffect(() => {
    const container = scrollContainerRef?.current;
    if (container && state.scrollTop > 0) {
      container.scrollTop = state.scrollTop;
    }
  }, [scrollContainerRef, state.scrollTop]);

  // Save state
  const save = React.useCallback(() => {
    if (persist) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(state));
      } catch (error) {
        console.error('Failed to save list state:', error);
      }
    }
  }, [storageKey, state, persist]);

  // Auto-save on state change
  React.useEffect(() => {
    if (autoSave && persist) {
      save();
    }
  }, [autoSave, persist, save]);

  // Restore state
  const restore = React.useCallback((): boolean => {
    if (!persist) return false;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setState(prev => ({ ...prev, ...parsed }));

        // Restore scroll position
        const container = scrollContainerRef?.current;
        if (container && parsed.scrollTop) {
          requestAnimationFrame(() => {
            container.scrollTop = parsed.scrollTop;
          });
        }

        return true;
      }
    } catch (error) {
      console.error('Failed to restore list state:', error);
    }
    return false;
  }, [storageKey, scrollContainerRef, persist]);

  // Clear saved state
  const clear = React.useCallback(() => {
    if (persist) {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey, persist]);

  // Reset to defaults
  const reset = React.useCallback(() => {
    setState(getDefaultState(defaultFilters, defaultSortColumn, defaultSortDirection));
    clear();
  }, [defaultFilters, defaultSortColumn, defaultSortDirection, clear]);

  // State setters
  const setScrollTop = React.useCallback((value: number) => {
    setState(prev => ({ ...prev, scrollTop: value, timestamp: Date.now() }));
  }, []);

  const setSelectedIds = React.useCallback((ids: string[]) => {
    setState(prev => ({ ...prev, selectedIds: ids, timestamp: Date.now() }));
  }, []);

  const toggleSelection = React.useCallback((id: string) => {
    setState(prev => {
      const isSelected = prev.selectedIds.includes(id);
      return {
        ...prev,
        selectedIds: isSelected
          ? prev.selectedIds.filter(i => i !== id)
          : [...prev.selectedIds, id],
        timestamp: Date.now(),
      };
    });
  }, []);

  const setActiveId = React.useCallback((id: string | null) => {
    setState(prev => ({ ...prev, activeId: id, timestamp: Date.now() }));
  }, []);

  const setFilters = React.useCallback((filters: TFilters | ((prev: TFilters) => TFilters)) => {
    setState(prev => ({
      ...prev,
      filters: typeof filters === 'function' ? filters(prev.filters) : filters,
      pageIndex: 0, // Reset page when filters change
      timestamp: Date.now(),
    }));
  }, []);

  const setSort = React.useCallback((column: string, direction?: 'asc' | 'desc') => {
    setState(prev => ({
      ...prev,
      sortColumn: column,
      sortDirection: direction || (prev.sortColumn === column && prev.sortDirection === 'asc' ? 'desc' : 'asc'),
      timestamp: Date.now(),
    }));
  }, []);

  const setPageIndex = React.useCallback((index: number) => {
    setState(prev => ({ ...prev, pageIndex: index, timestamp: Date.now() }));
  }, []);

  const setSearchQuery = React.useCallback((query: string) => {
    setState(prev => ({
      ...prev,
      searchQuery: query,
      pageIndex: 0, // Reset page when search changes
      timestamp: Date.now(),
    }));
  }, []);

  return {
    state,
    setScrollTop,
    setSelectedIds,
    toggleSelection,
    setActiveId,
    setFilters,
    setSort,
    setPageIndex,
    setSearchQuery,
    save,
    restore,
    clear,
    reset,
  };
}
