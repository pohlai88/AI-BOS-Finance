/**
 * @fileoverview Design Token Types
 *
 * TypeScript interfaces for design tokens.
 * Per CONT_14: Design Tokens Architecture
 *
 * @module @aibos/bioskin/tokens
 * @version 1.0.0
 */

// ============================================================
// DESIGN TOKEN INTERFACE
// ============================================================

/**
 * Complete design token interface
 */
export interface DesignTokens {
  colors: {
    primary: string;
    primaryHover: string;
    primaryLight: string;
    secondary: string;
    secondaryHover: string;
  };

  status: {
    success: string;
    successBg: string;
    warning: string;
    warningBg: string;
    danger: string;
    dangerBg: string;
    info: string;
    infoBg: string;
  };

  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverted: string;
  };

  bg: {
    default: string;
    subtle: string;
    muted: string;
    elevated: string;
  };

  border: {
    default: string;
    subtle: string;
    focus: string;
  };

  space: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };

  font: {
    family: string;
    mono: string;
    sizeXs: string;
    sizeSm: string;
    sizeBase: string;
    sizeLg: string;
    sizeXl: string;
    size2xl: string;
    size3xl: string;
  };

  radius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };

  shadow: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };

  zIndex: {
    base: number;
    dropdown: number;
    sticky: number;
    modal: number;
    popover: number;
    tooltip: number;
    toast: number;
  };

  transition: {
    fast: string;
    normal: string;
    slow: string;
    spring: string;
  };
}

// ============================================================
// THEME TYPES
// ============================================================

/**
 * Theme mode
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Adapter ID for theming
 */
export type AdapterThemeId = 'corporate' | 'supplychain' | 'production' | 'agriops' | 'outlet' | null;

// ============================================================
// TOKEN OVERRIDE TYPES
// ============================================================

/**
 * Token override map (key = token name without --bio- prefix)
 */
export type TokenOverrides = Partial<Record<string, string>>;

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Cached root element for performance
 * @internal
 */
let rootElement: HTMLElement | null = null;

/**
 * Get cached root element
 * @internal
 */
function getRoot(): HTMLElement {
  if (!rootElement && typeof window !== 'undefined') {
    rootElement = document.documentElement;
  }
  return rootElement!;
}

/**
 * Get CSS variable value at runtime
 *
 * @param name - Token name (without --bio- prefix)
 * @returns Token value or empty string if not found
 *
 * @example
 * ```typescript
 * const primary = getToken('primary');
 * // Returns: '#2563eb' (or current value)
 * ```
 */
export function getToken(name: string): string {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(getRoot())
    .getPropertyValue(`--bio-${name}`)
    .trim();
}

/**
 * Set CSS variable value at runtime
 *
 * @param name - Token name (without --bio- prefix)
 * @param value - CSS value to set
 *
 * @example
 * ```typescript
 * setToken('primary', '#1e40af');
 * // Sets --bio-primary to #1e40af
 * ```
 */
export function setToken(name: string, value: string): void {
  if (typeof window === 'undefined') return;
  getRoot().style.setProperty(`--bio-${name}`, value);
}

/**
 * Remove CSS variable override
 *
 * @param name - Token name (without --bio- prefix)
 */
export function removeToken(name: string): void {
  if (typeof window === 'undefined') return;
  getRoot().style.removeProperty(`--bio-${name}`);
}

/**
 * Token cache for performance optimization
 * @internal
 */
let tokenCache: DesignTokens | null = null;
let cacheTheme: string | null = null;
let cacheAdapter: string | null = null;

/**
 * Invalidate token cache
 * Call this when theme or adapter changes
 *
 * @internal
 */
export function invalidateTokenCache(): void {
  tokenCache = null;
  cacheTheme = null;
  cacheAdapter = null;
}

/**
 * Get all current token values
 *
 * @param options - Configuration options
 * @param options.forceRefresh - Force refresh cache (default: false)
 * @returns Object with all token values
 */
export function getAllTokens(options?: { forceRefresh?: boolean }): DesignTokens {
  if (typeof window === 'undefined') {
    // Return empty tokens for SSR
    return createEmptyTokens();
  }

  // Check cache validity
  const root = getRoot();
  const currentTheme = root.getAttribute('data-theme');
  const currentAdapter = root.getAttribute('data-adapter');

  if (
    !options?.forceRefresh &&
    tokenCache &&
    cacheTheme === currentTheme &&
    cacheAdapter === currentAdapter
  ) {
    return tokenCache;
  }

  // Recompute tokens (expensive)
  tokenCache = {
    colors: {
      primary: getToken('primary'),
      primaryHover: getToken('primary-hover'),
      primaryLight: getToken('primary-light'),
      secondary: getToken('secondary'),
      secondaryHover: getToken('secondary-hover'),
    },
    status: {
      success: getToken('status-success'),
      successBg: getToken('status-success-bg'),
      warning: getToken('status-warning'),
      warningBg: getToken('status-warning-bg'),
      danger: getToken('status-danger'),
      dangerBg: getToken('status-danger-bg'),
      info: getToken('status-info'),
      infoBg: getToken('status-info-bg'),
    },
    text: {
      primary: getToken('text-primary'),
      secondary: getToken('text-secondary'),
      muted: getToken('text-muted'),
      inverted: getToken('text-inverted'),
    },
    bg: {
      default: getToken('bg'),
      subtle: getToken('bg-subtle'),
      muted: getToken('bg-muted'),
      elevated: getToken('bg-elevated'),
    },
    border: {
      default: getToken('border'),
      subtle: getToken('border-subtle'),
      focus: getToken('border-focus'),
    },
    space: {
      xs: getToken('space-xs'),
      sm: getToken('space-sm'),
      md: getToken('space-md'),
      lg: getToken('space-lg'),
      xl: getToken('space-xl'),
      '2xl': getToken('space-2xl'),
    },
    font: {
      family: getToken('font-family'),
      mono: getToken('font-mono'),
      sizeXs: getToken('font-size-xs'),
      sizeSm: getToken('font-size-sm'),
      sizeBase: getToken('font-size-base'),
      sizeLg: getToken('font-size-lg'),
      sizeXl: getToken('font-size-xl'),
      size2xl: getToken('font-size-2xl'),
      size3xl: getToken('font-size-3xl'),
    },
    radius: {
      sm: getToken('radius-sm'),
      md: getToken('radius-md'),
      lg: getToken('radius-lg'),
      xl: getToken('radius-xl'),
      full: getToken('radius-full'),
    },
    shadow: {
      sm: getToken('shadow-sm'),
      md: getToken('shadow-md'),
      lg: getToken('shadow-lg'),
      xl: getToken('shadow-xl'),
    },
    zIndex: {
      base: parseInt(getToken('z-base') || '0', 10),
      dropdown: parseInt(getToken('z-dropdown') || '50', 10),
      sticky: parseInt(getToken('z-sticky') || '100', 10),
      modal: parseInt(getToken('z-modal') || '200', 10),
      popover: parseInt(getToken('z-popover') || '300', 10),
      tooltip: parseInt(getToken('z-tooltip') || '400', 10),
      toast: parseInt(getToken('z-toast') || '500', 10),
    },
    transition: {
      fast: getToken('transition-fast'),
      normal: getToken('transition-normal'),
      slow: getToken('transition-slow'),
      spring: getToken('transition-spring'),
    },
  };

  // Update cache metadata
  cacheTheme = currentTheme;
  cacheAdapter = currentAdapter;

  return tokenCache;
}

/**
 * Create empty token structure for SSR
 * @internal
 */
function createEmptyTokens(): DesignTokens {
  return {
    colors: {
      primary: '',
      primaryHover: '',
      primaryLight: '',
      secondary: '',
      secondaryHover: '',
    },
    status: {
      success: '',
      successBg: '',
      warning: '',
      warningBg: '',
      danger: '',
      dangerBg: '',
      info: '',
      infoBg: '',
    },
    text: {
      primary: '',
      secondary: '',
      muted: '',
      inverted: '',
    },
    bg: {
      default: '',
      subtle: '',
      muted: '',
      elevated: '',
    },
    border: {
      default: '',
      subtle: '',
      focus: '',
    },
    space: {
      xs: '',
      sm: '',
      md: '',
      lg: '',
      xl: '',
      '2xl': '',
    },
    font: {
      family: '',
      mono: '',
      sizeXs: '',
      sizeSm: '',
      sizeBase: '',
      sizeLg: '',
      sizeXl: '',
      size2xl: '',
      size3xl: '',
    },
    radius: {
      sm: '',
      md: '',
      lg: '',
      xl: '',
      full: '',
    },
    shadow: {
      sm: '',
      md: '',
      lg: '',
      xl: '',
    },
    zIndex: {
      base: 0,
      dropdown: 50,
      sticky: 100,
      modal: 200,
      popover: 300,
      tooltip: 400,
      toast: 500,
    },
    transition: {
      fast: '',
      normal: '',
      slow: '',
      spring: '',
    },
  };
}

/**
 * Apply multiple token overrides at once
 *
 * @param overrides - Map of token names to values
 *
 * @example
 * ```typescript
 * applyTokenOverrides({
 *   'primary': '#1e40af',
 *   'status-success': '#16a34a',
 * });
 * ```
 */
export function applyTokenOverrides(overrides: TokenOverrides): void {
  if (typeof window === 'undefined') return;

  for (const [key, value] of Object.entries(overrides)) {
    if (value) {
      setToken(key, value);
    }
  }
}

/**
 * Remove multiple token overrides
 *
 * @param keys - Array of token names to remove
 */
export function removeTokenOverrides(keys: string[]): void {
  if (typeof window === 'undefined') return;

  for (const key of keys) {
    removeToken(key);
  }
}
