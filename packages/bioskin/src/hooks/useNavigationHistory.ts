/**
 * useNavigationHistory - Back/forward navigation history
 *
 * Features:
 * - Track navigation history
 * - Back/forward navigation
 * - Persist history
 * - Keyboard shortcuts (Alt+Left/Right)
 */

'use client';

import * as React from 'react';

// ============================================================
// Types
// ============================================================

export interface NavigationEntry {
  /** Unique entry ID */
  id: string;
  /** Entry path/URL */
  path: string;
  /** Entry title */
  title?: string;
  /** Entry state/data */
  state?: Record<string, unknown>;
  /** Timestamp */
  timestamp: number;
}

export interface UseNavigationHistoryOptions {
  /** Maximum history entries */
  maxEntries?: number;
  /** Enable keyboard shortcuts */
  enableKeyboardShortcuts?: boolean;
  /** Persist to localStorage */
  persistKey?: string;
  /** Called when navigating */
  onNavigate?: (entry: NavigationEntry) => void;
}

export interface UseNavigationHistoryReturn {
  /** Current history entries */
  history: NavigationEntry[];
  /** Current position in history */
  currentIndex: number;
  /** Current entry */
  currentEntry: NavigationEntry | null;
  /** Can go back */
  canGoBack: boolean;
  /** Can go forward */
  canGoForward: boolean;
  /** Navigate back */
  goBack: () => void;
  /** Navigate forward */
  goForward: () => void;
  /** Navigate to specific entry */
  goTo: (index: number) => void;
  /** Push new entry */
  push: (path: string, options?: { title?: string; state?: Record<string, unknown> }) => void;
  /** Replace current entry */
  replace: (path: string, options?: { title?: string; state?: Record<string, unknown> }) => void;
  /** Clear history */
  clear: () => void;
}

// ============================================================
// Hook
// ============================================================

export function useNavigationHistory({
  maxEntries = 50,
  enableKeyboardShortcuts = true,
  persistKey,
  onNavigate,
}: UseNavigationHistoryOptions = {}): UseNavigationHistoryReturn {
  const [history, setHistory] = React.useState<NavigationEntry[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState(-1);

  // Load persisted history
  React.useEffect(() => {
    if (persistKey) {
      try {
        const stored = localStorage.getItem(`bioskin_nav_history_${persistKey}`);
        if (stored) {
          const { history: storedHistory, currentIndex: storedIndex } = JSON.parse(stored);
          if (storedHistory?.length) {
            setHistory(storedHistory);
            setCurrentIndex(storedIndex ?? storedHistory.length - 1);
          }
        }
      } catch (error) {
        console.error('Failed to load navigation history:', error);
      }
    }
  }, [persistKey]);

  // Save history on change
  React.useEffect(() => {
    if (persistKey && history.length > 0) {
      try {
        localStorage.setItem(`bioskin_nav_history_${persistKey}`, JSON.stringify({
          history,
          currentIndex,
        }));
      } catch (error) {
        console.error('Failed to save navigation history:', error);
      }
    }
  }, [history, currentIndex, persistKey]);

  // Keyboard shortcuts
  React.useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+Left for back
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentIndex > 0) {
          const newIndex = currentIndex - 1;
          setCurrentIndex(newIndex);
          onNavigate?.(history[newIndex]);
        }
      }

      // Alt+Right for forward
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentIndex < history.length - 1) {
          const newIndex = currentIndex + 1;
          setCurrentIndex(newIndex);
          onNavigate?.(history[newIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardShortcuts, history, currentIndex, onNavigate]);

  // Current entry
  const currentEntry = currentIndex >= 0 && currentIndex < history.length
    ? history[currentIndex]
    : null;

  // Navigation state
  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < history.length - 1;

  // Go back
  const goBack = React.useCallback(() => {
    if (!canGoBack) return;
    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    onNavigate?.(history[newIndex]);
  }, [canGoBack, currentIndex, history, onNavigate]);

  // Go forward
  const goForward = React.useCallback(() => {
    if (!canGoForward) return;
    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    onNavigate?.(history[newIndex]);
  }, [canGoForward, currentIndex, history, onNavigate]);

  // Go to specific index
  const goTo = React.useCallback((index: number) => {
    if (index < 0 || index >= history.length) return;
    setCurrentIndex(index);
    onNavigate?.(history[index]);
  }, [history, onNavigate]);

  // Push new entry
  const push = React.useCallback((
    path: string,
    options?: { title?: string; state?: Record<string, unknown> }
  ) => {
    const entry: NavigationEntry = {
      id: `nav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      path,
      title: options?.title,
      state: options?.state,
      timestamp: Date.now(),
    };

    setHistory(prev => {
      // Remove forward history
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(entry);

      // Trim to max entries
      if (newHistory.length > maxEntries) {
        return newHistory.slice(-maxEntries);
      }
      return newHistory;
    });

    setCurrentIndex(prev => Math.min(prev + 1, maxEntries - 1));
    onNavigate?.(entry);
  }, [currentIndex, maxEntries, onNavigate]);

  // Replace current entry
  const replace = React.useCallback((
    path: string,
    options?: { title?: string; state?: Record<string, unknown> }
  ) => {
    if (currentIndex < 0) {
      push(path, options);
      return;
    }

    const entry: NavigationEntry = {
      id: `nav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      path,
      title: options?.title,
      state: options?.state,
      timestamp: Date.now(),
    };

    setHistory(prev => {
      const newHistory = [...prev];
      newHistory[currentIndex] = entry;
      return newHistory;
    });

    onNavigate?.(entry);
  }, [currentIndex, push, onNavigate]);

  // Clear history
  const clear = React.useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);

    if (persistKey) {
      localStorage.removeItem(`bioskin_nav_history_${persistKey}`);
    }
  }, [persistKey]);

  return {
    history,
    currentIndex,
    currentEntry,
    canGoBack,
    canGoForward,
    goBack,
    goForward,
    goTo,
    push,
    replace,
    clear,
  };
}
