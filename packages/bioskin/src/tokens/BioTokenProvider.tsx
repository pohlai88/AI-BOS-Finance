'use client';

/**
 * @fileoverview BioToken Provider
 *
 * React context provider for design token management.
 * Per CONT_14: Design Tokens Architecture
 *
 * @module @aibos/bioskin/tokens
 * @version 1.0.0
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { ThemeMode, AdapterThemeId, TokenOverrides, DesignTokens } from './types';
import { getAllTokens, invalidateTokenCache, applyTokenOverrides, removeTokenOverrides } from './types';

// Import CSS tokens
import './tokens.css';

// ============================================================
// CONTEXT TYPES
// ============================================================

export interface BioTokenContextValue {
  /** Current theme mode */
  theme: ThemeMode;
  /** Set theme mode */
  setTheme: (theme: ThemeMode) => void;
  /** Current adapter ID */
  adapterId: AdapterThemeId;
  /** Current token values (live) */
  tokens: DesignTokens | null;
  /** Refresh token values */
  refreshTokens: () => void;
}

// ============================================================
// CONTEXT
// ============================================================

const BioTokenContext = createContext<BioTokenContextValue | null>(null);

// ============================================================
// PROVIDER PROPS
// ============================================================

export interface BioTokenProviderProps {
  /** Children to render */
  children: ReactNode;
  /** Default theme mode */
  defaultTheme?: ThemeMode;
  /** Adapter ID for theming */
  adapterId?: AdapterThemeId;
  /** Token overrides (CSS variable values) */
  tokenOverrides?: TokenOverrides;
  /** Storage key for persisting theme preference */
  storageKey?: string;
}

// ============================================================
// PROVIDER COMPONENT
// ============================================================

/**
 * BioTokenProvider - Design token context provider
 *
 * Manages theme mode, adapter theming, and token overrides.
 * Automatically applies data-theme and data-adapter attributes.
 *
 * @example
 * ```tsx
 * // In your root layout
 * import { BioTokenProvider } from '@aibos/bioskin';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <BioTokenProvider
 *           defaultTheme="system"
 *           adapterId="corporate"
 *         >
 *           {children}
 *         </BioTokenProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function BioTokenProvider({
  children,
  defaultTheme = 'system',
  adapterId = null,
  tokenOverrides,
  storageKey = 'bio-theme',
}: BioTokenProviderProps): React.ReactElement {
  // Lazy initialize theme from localStorage
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return defaultTheme;

    try {
      const stored = localStorage.getItem(storageKey) as ThemeMode | null;
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    } catch (error) {
      console.warn('[BioTokenProvider] Failed to load theme from storage:', error);
    }

    return defaultTheme;
  });

  const [tokens, setTokens] = useState<DesignTokens | null>(null);

  // Refresh token values from DOM
  const refreshTokens = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      // Invalidate cache and force refresh
      invalidateTokenCache();
      const currentTokens = getAllTokens({ forceRefresh: true });
      setTokens(currentTokens);
    } catch (error) {
      console.warn('[BioTokenProvider] Failed to get token values:', error);
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.setAttribute('data-theme', systemTheme);

      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        refreshTokens();
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      root.setAttribute('data-theme', theme);
    }

    // Refresh tokens after theme change
    refreshTokens();
  }, [theme, refreshTokens]);

  // Apply adapter to document
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;

    if (adapterId) {
      root.setAttribute('data-adapter', adapterId);
    } else {
      root.removeAttribute('data-adapter');
    }

    // Refresh tokens after adapter change
    refreshTokens();
  }, [adapterId, refreshTokens]);

  // Apply token overrides
  useEffect(() => {
    if (!tokenOverrides) return;

    applyTokenOverrides(tokenOverrides);

    // Cleanup on unmount
    return () => {
      removeTokenOverrides(Object.keys(tokenOverrides));
    };
  }, [tokenOverrides]);

  // Load tokens after mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Wait for CSS to load
    const timer = setTimeout(() => {
      refreshTokens();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Set theme and persist to storage
  const setTheme = useCallback(
    (newTheme: ThemeMode) => {
      setThemeState(newTheme);

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(storageKey, newTheme);
        } catch (error) {
          console.warn('[BioTokenProvider] Failed to save theme to storage:', error);
        }
      }
    },
    [storageKey]
  );

  const contextValue = useMemo<BioTokenContextValue>(
    () => ({
      theme,
      setTheme,
      adapterId,
      tokens,
      refreshTokens,
    }),
    [theme, setTheme, adapterId, tokens, refreshTokens]
  );

  return (
    <BioTokenContext.Provider value={contextValue}>
      {children}
    </BioTokenContext.Provider>
  );
}

// ============================================================
// HOOK
// ============================================================

/**
 * useTokenContext - Access token context
 *
 * @returns Token context value
 * @throws Error if used outside BioTokenProvider
 *
 * @example
 * ```tsx
 * function ThemeToggle() {
 *   const { theme, setTheme } = useTokenContext();
 *
 *   return (
 *     <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
 *       Toggle Theme
 *     </button>
 *   );
 * }
 * ```
 */
export function useTokenContext(): BioTokenContextValue {
  const context = useContext(BioTokenContext);

  if (!context) {
    throw new Error('useTokenContext must be used within BioTokenProvider');
  }

  return context;
}

/**
 * useTheme - Get and set theme mode
 *
 * @returns Current theme and setter
 */
export function useTheme(): [ThemeMode, (theme: ThemeMode) => void] {
  const { theme, setTheme } = useTokenContext();
  return [theme, setTheme];
}

/**
 * useTokens - Get current token values
 *
 * @returns Design tokens object or null if not loaded
 */
export function useTokens(): DesignTokens | null {
  const { tokens } = useTokenContext();
  return tokens;
}
