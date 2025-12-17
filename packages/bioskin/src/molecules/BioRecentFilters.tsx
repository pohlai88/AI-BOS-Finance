/**
 * BioRecentFilters - Recently used filters dropdown
 *
 * Features:
 * - Track recent filter combinations
 * - Quick apply recent filters
 * - Persist to localStorage
 * - Clear recent filters
 */

'use client';

import * as React from 'react';
import { History, Clock, X, ChevronDown, Trash2 } from 'lucide-react';
import { cn } from '../atoms/utils';
import { Txt } from '../atoms/Txt';
import { type ActiveFilter } from './BioActiveFilters';

// ============================================================
// Types
// ============================================================

export interface RecentFilterSet {
  id: string;
  filters: ActiveFilter[];
  usedAt: Date;
  name?: string;
}

export interface BioRecentFiltersProps {
  /** Current active filters */
  currentFilters?: ActiveFilter[];
  /** Called when a recent filter set is applied */
  onApply: (filters: ActiveFilter[]) => void;
  /** Storage key for persistence */
  storageKey?: string;
  /** Maximum recent filter sets to store */
  maxRecent?: number;
  /** Additional className */
  className?: string;
}

// ============================================================
// Hook for managing recent filters
// ============================================================

export interface UseRecentFiltersOptions {
  /** Storage key */
  storageKey: string;
  /** Max items to store */
  maxItems?: number;
}

export interface UseRecentFiltersReturn {
  /** Recent filter sets */
  recentFilters: RecentFilterSet[];
  /** Add filter set to recent */
  addRecent: (filters: ActiveFilter[]) => void;
  /** Clear all recent */
  clearRecent: () => void;
  /** Remove specific recent */
  removeRecent: (id: string) => void;
}

export function useRecentFilters({
  storageKey,
  maxItems = 10,
}: UseRecentFiltersOptions): UseRecentFiltersReturn {
  const [recentFilters, setRecentFilters] = React.useState<RecentFilterSet[]>([]);

  // Load from localStorage
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(`bioskin_recent_filters_${storageKey}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Rehydrate dates
        const hydrated = parsed.map((item: RecentFilterSet) => ({
          ...item,
          usedAt: new Date(item.usedAt),
        }));
        setRecentFilters(hydrated);
      }
    } catch (e) {
      console.error('Failed to load recent filters:', e);
    }
  }, [storageKey]);

  // Save to localStorage
  const saveToStorage = React.useCallback((filters: RecentFilterSet[]) => {
    try {
      localStorage.setItem(
        `bioskin_recent_filters_${storageKey}`,
        JSON.stringify(filters)
      );
    } catch (e) {
      console.error('Failed to save recent filters:', e);
    }
  }, [storageKey]);

  const addRecent = React.useCallback((filters: ActiveFilter[]) => {
    if (filters.length === 0) return;

    // Create a unique ID based on filter content
    const id = filters
      .map(f => `${f.field}:${f.operator || 'eq'}:${f.value}`)
      .sort()
      .join('|');

    setRecentFilters(prev => {
      // Remove existing if same filter set
      const filtered = prev.filter(r => r.id !== id);

      // Add to front
      const updated: RecentFilterSet[] = [
        { id, filters, usedAt: new Date() },
        ...filtered,
      ].slice(0, maxItems);

      saveToStorage(updated);
      return updated;
    });
  }, [maxItems, saveToStorage]);

  const clearRecent = React.useCallback(() => {
    setRecentFilters([]);
    localStorage.removeItem(`bioskin_recent_filters_${storageKey}`);
  }, [storageKey]);

  const removeRecent = React.useCallback((id: string) => {
    setRecentFilters(prev => {
      const updated = prev.filter(r => r.id !== id);
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  return {
    recentFilters,
    addRecent,
    clearRecent,
    removeRecent,
  };
}

// ============================================================
// Component
// ============================================================

export const BioRecentFilters = React.memo(function BioRecentFilters({
  currentFilters = [],
  onApply,
  storageKey = 'default',
  maxRecent = 10,
  className,
}: BioRecentFiltersProps) {
  // Stable ID for accessibility
  const menuId = React.useId();

  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const {
    recentFilters,
    addRecent,
    clearRecent,
    removeRecent,
  } = useRecentFilters({ storageKey, maxItems: maxRecent });

  // Track current filters when they change
  React.useEffect(() => {
    if (currentFilters.length > 0) {
      addRecent(currentFilters);
    }
  }, [currentFilters, addRecent]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const formatFilters = (filters: ActiveFilter[]): string => {
    return filters.map(f => `${f.label}: ${f.value}`).join(', ');
  };

  if (recentFilters.length === 0) {
    return null;
  }

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={isOpen ? menuId : undefined}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors',
          'hover:bg-surface-hover',
          isOpen
            ? 'border-accent-primary bg-accent-primary/5'
            : 'border-default bg-surface-base'
        )}
      >
        <History className="h-4 w-4 text-text-muted" aria-hidden="true" />
        <span className="text-small text-text-secondary">Recent</span>
        <ChevronDown className={cn(
          'h-4 w-4 text-text-muted transition-transform',
          isOpen && 'rotate-180'
        )} aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          id={menuId}
          role="menu"
          aria-label="Recent filters"
          className="absolute left-0 top-full mt-1 z-50 w-80 bg-surface-base border border-default rounded-lg shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-default">
            <Txt variant="label" weight="medium">
              Recent Filters
            </Txt>
            <button
              onClick={clearRecent}
              className="flex items-center gap-1 text-small text-text-tertiary hover:text-status-danger transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear all
            </button>
          </div>

          {/* Recent filter list */}
          <div className="max-h-64 overflow-y-auto">
            {recentFilters.map((recent) => (
              <div
                key={recent.id}
                className="flex items-center gap-2 px-3 py-2 hover:bg-surface-hover transition-colors group"
              >
                <button
                  onClick={() => {
                    onApply(recent.filters);
                    setIsOpen(false);
                  }}
                  className="flex-1 text-left min-w-0"
                >
                  <Txt variant="small" className="truncate block">
                    {formatFilters(recent.filters)}
                  </Txt>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3 text-text-disabled" />
                    <Txt variant="micro" color="tertiary">
                      {formatTimeAgo(recent.usedAt)}
                    </Txt>
                  </div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRecent(recent.id);
                  }}
                  className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-surface-nested transition-all"
                >
                  <X className="h-3.5 w-3.5 text-text-muted" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

BioRecentFilters.displayName = 'BioRecentFilters';
