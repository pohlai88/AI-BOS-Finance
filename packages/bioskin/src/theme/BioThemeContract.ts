/**
 * BioThemeContract - SINGLE SOURCE OF TRUTH for all design tokens
 * 
 * This file defines ALL tokens used across the system.
 * - CSS variables are defined in globals.css using these exact names
 * - Tailwind config reads from CSS variables
 * - Components use Tailwind classes
 * 
 * If a token is not in this contract, it DOES NOT EXIST.
 * 
 * @see IMMORTAL Strategy - Layer 1
 */

// ============================================================
// TOKEN DEFINITIONS - The Contract
// ============================================================

export const BIO_THEME_CONTRACT = {
  // Surface tokens (backgrounds)
  surfaces: {
    base: { token: '--color-surface-base', fallback: '#18181B', description: 'Input/form field base' },
    subtle: { token: '--color-surface-subtle', fallback: '#1A1A1D', description: 'Subtle backgrounds' },
    card: { token: '--color-surface-card', fallback: '#1F1F23', description: 'Card backgrounds' },
    nested: { token: '--color-surface-nested', fallback: '#141416', description: 'Nested containers' },
    hover: { token: '--color-surface-hover', fallback: '#252528', description: 'Hover states' },
  },

  // Text tokens
  text: {
    primary: { token: '--color-text-primary', fallback: '#FFFFFF', description: 'Primary text' },
    secondary: { token: '--color-text-secondary', fallback: '#B0B0B5', description: 'Secondary text' },
    tertiary: { token: '--color-text-tertiary', fallback: '#7A7A80', description: 'Tertiary text' },
    muted: { token: '--color-text-muted', fallback: '#6E6E73', description: 'Muted/disabled text' },
    disabled: { token: '--color-text-disabled', fallback: '#6E6E73', description: 'Disabled text' },
  },

  // Border tokens
  borders: {
    default: { token: '--color-border-default', fallback: '#2C2C31', description: 'Default border' },
    subtle: { token: '--color-border-subtle', fallback: '#1F1F23', description: 'Subtle border' },
    active: { token: '--color-border-active', fallback: '#4A90E2', description: 'Active/focus border' },
  },

  // Accent tokens (interactive elements)
  accents: {
    primary: { token: '--color-accent-primary', fallback: '#4A90E2', description: 'Primary accent (Electric Blue)' },
    secondary: { token: '--color-accent-secondary', fallback: '#50E3C2', description: 'Secondary accent (Emerald Teal)' },
  },

  // Status tokens
  status: {
    success: { token: '--color-status-success', fallback: '#27AE60', description: 'Success state' },
    warning: { token: '--color-status-warning', fallback: '#F5A623', description: 'Warning state' },
    danger: { token: '--color-status-danger', fallback: '#E74C3C', description: 'Error/danger state' },
    info: { token: '--color-status-info', fallback: '#4A90E2', description: 'Info state' },
  },

  // Brand tokens
  brand: {
    primary: { token: '--color-primary', fallback: '#4A90E2', description: 'Brand primary' },
    secondary: { token: '--color-secondary', fallback: '#50E3C2', description: 'Brand secondary' },
    highlight: { token: '--color-highlight', fallback: '#A259FF', description: 'Brand highlight' },
  },
} as const;

// ============================================================
// TYPE EXPORTS - Compile-time safety
// ============================================================

export type BioSurface = keyof typeof BIO_THEME_CONTRACT.surfaces;
export type BioText = keyof typeof BIO_THEME_CONTRACT.text;
export type BioBorder = keyof typeof BIO_THEME_CONTRACT.borders;
export type BioAccent = keyof typeof BIO_THEME_CONTRACT.accents;
export type BioStatus = keyof typeof BIO_THEME_CONTRACT.status;
export type BioBrand = keyof typeof BIO_THEME_CONTRACT.brand;

// ============================================================
// CSS GENERATOR - Generate CSS with fallbacks
// ============================================================

/**
 * Generates CSS :root block with all tokens and fallbacks
 * Use this in build scripts to ensure globals.css has all tokens
 */
export function generateCSSTokens(): string {
  const lines: string[] = [':root {'];

  const addCategory = (category: Record<string, { token: string; fallback: string; description: string }>) => {
    for (const [, value] of Object.entries(category)) {
      lines.push(`  ${value.token}: ${value.fallback}; /* ${value.description} */`);
    }
  };

  lines.push('  /* === Surfaces === */');
  addCategory(BIO_THEME_CONTRACT.surfaces);

  lines.push('  /* === Text === */');
  addCategory(BIO_THEME_CONTRACT.text);

  lines.push('  /* === Borders === */');
  addCategory(BIO_THEME_CONTRACT.borders);

  lines.push('  /* === Accents === */');
  addCategory(BIO_THEME_CONTRACT.accents);

  lines.push('  /* === Status === */');
  addCategory(BIO_THEME_CONTRACT.status);

  lines.push('  /* === Brand === */');
  addCategory(BIO_THEME_CONTRACT.brand);

  lines.push('}');

  return lines.join('\n');
}

// ============================================================
// RUNTIME VALIDATOR - Check tokens exist at runtime
// ============================================================

/**
 * Validates that all required CSS tokens are defined
 * Call this on app initialization to catch missing tokens early
 * 
 * @returns Array of missing tokens, empty if all present
 */
export function validateThemeTokens(): { missing: string[]; warnings: string[] } {
  if (typeof window === 'undefined') {
    return { missing: [], warnings: ['Cannot validate tokens on server'] };
  }

  const missing: string[] = [];
  const warnings: string[] = [];
  const style = getComputedStyle(document.documentElement);

  const checkCategory = (category: Record<string, { token: string; fallback: string }>) => {
    for (const [name, value] of Object.entries(category)) {
      const cssValue = style.getPropertyValue(value.token).trim();
      if (!cssValue) {
        missing.push(`${value.token} (${name})`);
      }
    }
  };

  checkCategory(BIO_THEME_CONTRACT.surfaces);
  checkCategory(BIO_THEME_CONTRACT.text);
  checkCategory(BIO_THEME_CONTRACT.borders);
  checkCategory(BIO_THEME_CONTRACT.accents);
  checkCategory(BIO_THEME_CONTRACT.status);
  checkCategory(BIO_THEME_CONTRACT.brand);

  return { missing, warnings };
}

// ============================================================
// TAILWIND CONFIG GENERATOR
// ============================================================

/**
 * Generates Tailwind color config that references CSS variables
 * Use this in tailwind.config.js to ensure sync with CSS
 */
export function generateTailwindColors(): Record<string, string> {
  const colors: Record<string, string> = {};

  const addCategory = (prefix: string, category: Record<string, { token: string }>) => {
    for (const [name, value] of Object.entries(category)) {
      colors[`${prefix}-${name}`] = `var(${value.token})`;
    }
  };

  addCategory('surface', BIO_THEME_CONTRACT.surfaces);
  addCategory('text', BIO_THEME_CONTRACT.text);
  addCategory('border', BIO_THEME_CONTRACT.borders);
  addCategory('accent', BIO_THEME_CONTRACT.accents);
  addCategory('status', BIO_THEME_CONTRACT.status);

  return colors;
}
