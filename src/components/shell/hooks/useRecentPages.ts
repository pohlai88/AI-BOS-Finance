// ============================================================================
// USE RECENT PAGES - Track recently visited META pages
// Like Linear: Quick access to recent issues/projects
// ============================================================================

import { useCallback, useState } from 'react'

// ============================================================================
// LOCALSTORAGE UTILITY (Internal dependency)
// ============================================================================

interface StorageOptions {
  ttl?: number // Time to live in milliseconds
  namespace?: string // Prefix for keys
}

/**
 * Hook for localStorage with expiration support
 * Like Notion: User preferences persist across sessions
 */
function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  options: StorageOptions = {}
): [T, (value: T) => void, () => void] {
  const { ttl, namespace = 'nexuscanon' } = options
  const fullKey = `${namespace}:${key}`

  // Get initial value from localStorage
  const getInitialValue = (): T => {
    try {
      const item = localStorage.getItem(fullKey)
      if (!item) return defaultValue

      const parsed = JSON.parse(item)

      // Check expiration if TTL set
      if (ttl && parsed.expiry && Date.now() > parsed.expiry) {
        localStorage.removeItem(fullKey)
        return defaultValue
      }

      return parsed.value ?? defaultValue
    } catch {
      return defaultValue
    }
  }

  const [state, setState] = useState<T>(getInitialValue)

  // Update localStorage when state changes
  const updateState = (newValue: T) => {
    setState(newValue)

    try {
      const item = {
        value: newValue,
        expiry: ttl ? Date.now() + ttl : null,
      }
      localStorage.setItem(fullKey, JSON.stringify(item))
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  }

  // Clear specific key
  const clearState = () => {
    setState(defaultValue)
    localStorage.removeItem(fullKey)
  }

  return [state, updateState, clearState]
}

// ============================================================================
// RECENT PAGES TRACKING
// ============================================================================

export interface RecentPage {
  path: string
  title: string
  code: string
  timestamp: number
}

const RECENT_PAGES_KEY = 'recent-pages'
const MAX_RECENT_PAGES = 10

/**
 * Track recently visited META pages
 * Like Linear: Quick access to recent issues/projects
 */
export function useRecentPages() {
  const [recentPages, setRecentPages] = useLocalStorage<RecentPage[]>(
    RECENT_PAGES_KEY,
    [],
    { ttl: 7 * 24 * 60 * 60 * 1000 } // 7 days
  )

  const addRecentPage = useCallback(
    (page: Omit<RecentPage, 'timestamp'>) => {
      const newPage: RecentPage = {
        ...page,
        timestamp: Date.now(),
      }

      setRecentPages((prevPages) => {
        // Remove if already exists, then add to front
        const filtered = prevPages.filter((p) => p.path !== page.path)
        const updated = [newPage, ...filtered].slice(0, MAX_RECENT_PAGES)
        return updated
      })
    },
    [setRecentPages]
  )

  const clearRecentPages = useCallback(() => {
    setRecentPages([])
  }, [setRecentPages])

  return {
    recentPages,
    addRecentPage,
    clearRecentPages,
  }
}
