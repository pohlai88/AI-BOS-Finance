/**
 * @fileoverview BioTokens Module Exports
 *
 * Design token system for runtime theming.
 * Per CONT_14: Design Tokens Architecture
 *
 * @module @aibos/bioskin/tokens
 * @version 1.0.0
 */

// ============================================================
// REACT PROVIDER
// ============================================================
// Note: CSS tokens are imported in BioTokenProvider.tsx to avoid
// forcing all consumers to load CSS (better tree-shaking)

export {
  BioTokenProvider,
  useTokenContext,
  useTheme,
  useTokens,
  type BioTokenContextValue,
  type BioTokenProviderProps,
} from './BioTokenProvider';

// ============================================================
// TYPE EXPORTS
// ============================================================

export type {
  DesignTokens,
  ThemeMode,
  AdapterThemeId,
  TokenOverrides,
} from './types';

// ============================================================
// UTILITY EXPORTS
// ============================================================

export {
  getToken,
  setToken,
  removeToken,
  getAllTokens,
  invalidateTokenCache,
  applyTokenOverrides,
  removeTokenOverrides,
} from './types';
