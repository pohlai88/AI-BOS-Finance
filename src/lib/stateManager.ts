// ============================================================================
// STATE MANAGER - URL + localStorage Persistence
// Figma Best Practice: Persist user state across sessions like Linear/Notion
// ============================================================================

import { useEffect, useState, useCallback } from 'react';
import { useRouterAdapter } from '@/hooks/useRouterAdapter';

// ============================================================================
// URL STATE MANAGEMENT
// ============================================================================

/**
 * Hook for syncing state with URL query parameters
 * Like Linear: Filters, selections, views all in URL for shareability
 */
export function useUrlState<T>(
  key: string,
  defaultValue: T,
  serialize: (value: T) => string = JSON.stringify,
  deserialize: (value: string) => T = JSON.parse,
): [T, (value: T) => void] {
  const { searchParams, setSearchParams } = useRouterAdapter();

  // Get initial value from URL or use default
  const getInitialValue = (): T => {
    const urlValue = searchParams.get(key);
    if (urlValue) {
      try {
        return deserialize(urlValue);
      } catch {
        return defaultValue;
      }
    }
    return defaultValue;
  };

  const [state, setState] = useState<T>(getInitialValue);

  // Update URL when state changes
  const updateState = (newValue: T) => {
    setState(newValue);

    const newSearchParams = new URLSearchParams(searchParams);

    if (newValue === defaultValue || newValue === null || newValue === undefined) {
      // Remove from URL if default value
      newSearchParams.delete(key);
    } else {
      // Add/update in URL
      newSearchParams.set(key, serialize(newValue));
    }

    setSearchParams(newSearchParams, { replace: true });
  };

  return [state, updateState];
}

// ============================================================================
// LOCALSTORAGE STATE MANAGEMENT
// ============================================================================

interface StorageOptions {
  ttl?: number; // Time to live in milliseconds
  namespace?: string; // Prefix for keys
}

/**
 * Hook for localStorage with expiration support
 * Like Notion: User preferences persist across sessions
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  options: StorageOptions = {},
): [T, (value: T) => void, () => void] {
  const { ttl, namespace = 'nexuscanon' } = options;
  const fullKey = `${namespace}:${key}`;

  // Get initial value from localStorage
  const getInitialValue = (): T => {
    try {
      const item = localStorage.getItem(fullKey);
      if (!item) return defaultValue;

      const parsed = JSON.parse(item);

      // Check expiration if TTL set
      if (ttl && parsed.expiry && Date.now() > parsed.expiry) {
        localStorage.removeItem(fullKey);
        return defaultValue;
      }

      return parsed.value ?? defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [state, setState] = useState<T>(getInitialValue);

  // Update localStorage when state changes
  const updateState = (newValue: T) => {
    setState(newValue);

    try {
      const item = {
        value: newValue,
        expiry: ttl ? Date.now() + ttl : null,
      };
      localStorage.setItem(fullKey, JSON.stringify(item));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  };

  // Clear specific key
  const clearState = () => {
    setState(defaultValue);
    localStorage.removeItem(fullKey);
  };

  return [state, updateState, clearState];
}

// ============================================================================
// RECENT PAGES TRACKING
// ============================================================================

export interface RecentPage {
  path: string;
  title: string;
  code: string;
  timestamp: number;
}

const RECENT_PAGES_KEY = 'recent-pages';
const MAX_RECENT_PAGES = 10;

/**
 * Track recently visited META pages
 * Like Linear: Quick access to recent issues/projects
 */
export function useRecentPages() {
  const [recentPages, setRecentPages] = useLocalStorage<RecentPage[]>(
    RECENT_PAGES_KEY,
    [],
    { ttl: 7 * 24 * 60 * 60 * 1000 }, // 7 days
  );

  const addRecentPage = useCallback(
    (page: Omit<RecentPage, 'timestamp'>) => {
      const newPage: RecentPage = {
        ...page,
        timestamp: Date.now(),
      };

      setRecentPages((prevPages) => {
        // Remove if already exists, then add to front
        const filtered = prevPages.filter((p) => p.path !== page.path);
        const updated = [newPage, ...filtered].slice(0, MAX_RECENT_PAGES);
        return updated;
      });
    },
    [setRecentPages],
  );

  const clearRecentPages = useCallback(() => {
    setRecentPages([]);
  }, [setRecentPages]);

  return {
    recentPages,
    addRecentPage,
    clearRecentPages,
  };
}

// ============================================================================
// USER PREFERENCES
// ============================================================================

export interface UserPreferences {
  // Table preferences
  tableDensity: 'comfortable' | 'compact';
  defaultPageSize: number;

  // UI preferences
  sideNavCollapsed: boolean;
  theme: 'dark' | 'light'; // Future-proof

  // Feature flags
  enableKeyboardShortcuts: boolean;
  enableAnimations: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  tableDensity: 'comfortable',
  defaultPageSize: 50,
  sideNavCollapsed: false,
  theme: 'dark',
  enableKeyboardShortcuts: true,
  enableAnimations: true,
};

/**
 * Manage user preferences
 * Like Figma: UI settings persist across sessions
 */
export function useUserPreferences() {
  const [preferences, setPreferences, clearPreferences] = useLocalStorage<UserPreferences>(
    'user-preferences',
    DEFAULT_PREFERENCES,
  );

  const updatePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPreferences({
      ...preferences,
      [key]: value,
    });
  };

  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
  };

  return {
    preferences,
    updatePreference,
    resetPreferences,
    clearPreferences,
  };
}

// ============================================================================
// SCROLL POSITION RESTORATION
// ============================================================================

/**
 * Restore scroll position on back navigation
 * Like browser native behavior but better
 */
export function useScrollRestoration(key: string) {
  useEffect(() => {
    // Save scroll position before unmount
    const handleScroll = () => {
      sessionStorage.setItem(
        `scroll:${key}`,
        JSON.stringify({
          x: window.scrollX,
          y: window.scrollY,
        }),
      );
    };

    // Restore scroll position on mount
    const savedPosition = sessionStorage.getItem(`scroll:${key}`);
    if (savedPosition) {
      try {
        const { x, y } = JSON.parse(savedPosition);
        window.scrollTo(x, y);
      } catch {
        // Ignore invalid data
      }
    }

    // Save on scroll
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [key]);
}

// ============================================================================
// SELECTED ITEMS PERSISTENCE
// ============================================================================

/**
 * Persist selected items (e.g., dataset in META_03)
 * Like Linear: Clicking issue -> URL updates -> shareable
 */
export function useSelectedItem(defaultId: string | null = null) {
  const [selectedId, setSelectedId] = useUrlState<string | null>('selected', defaultId);

  return [selectedId, setSelectedId] as const;
}

// ============================================================================
// FILTER STATE PERSISTENCE
// ============================================================================

export interface FilterState {
  search: string;
  tags: string[];
  status: string[];
  dateRange: [string, string] | null;
}

/**
 * Persist filter state in URL
 * Like Linear: Filters in URL -> shareable views
 */
export function useFilterState(defaultFilters: Partial<FilterState> = {}) {
  const defaults: FilterState = {
    search: '',
    tags: [],
    status: [],
    dateRange: null,
    ...defaultFilters,
  };

  const [filters, setFilters] = useUrlState<FilterState>('filters', defaults);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    setFilters(defaults);
  };

  const hasActiveFilters = () => {
    return (
      filters.search !== '' ||
      filters.tags.length > 0 ||
      filters.status.length > 0 ||
      filters.dateRange !== null
    );
  };

  return {
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
  };
}

// ============================================================================
// UTILITY: Clear All App State
// ============================================================================

/**
 * Nuclear option: Clear all stored state
 * Useful for debugging and "reset to defaults"
 */
export function clearAllAppState() {
  // Clear all localStorage items with nexuscanon prefix
  const keys = Object.keys(localStorage);
  keys.forEach((key) => {
    if (key.startsWith('nexuscanon:')) {
      localStorage.removeItem(key);
    }
  });

  // Clear sessionStorage scroll positions
  const sessionKeys = Object.keys(sessionStorage);
  sessionKeys.forEach((key) => {
    if (key.startsWith('scroll:')) {
      sessionStorage.removeItem(key);
    }
  });

  console.log('✅ All app state cleared');
}
