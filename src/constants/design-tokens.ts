// ============================================================================
// NEXUSCANON DESIGN TOKENS
// Machine-enforceable implementation of Guidelines.md
// Prevents AI drift and ensures forensic aesthetic consistency
// ============================================================================

/**
 * CRITICAL: These tokens are IMMUTABLE.
 * All components MUST import from this file.
 * Direct class strings (e.g., 'bg-gray-800') are FORBIDDEN.
 */

// ============================================================================
// COLOR SYSTEM - Section III: Color System (Monolith)
// ============================================================================

export const COLORS = {
  // Core Palette
  void: '#000000', // Background (deepest)
  matter: '#0A0A0A', // Card backgrounds
  structure: '#1F1F1F', // Borders/dividers (THE 1px RULE)
  signal: '#FFFFFF', // Primary data/text
  noise: '#888888', // Secondary text

  // Nested Backgrounds (depth via stroke lightness, not shadows)
  depth: {
    base: '#0A0A0A',
    nested: '#050505',
    hover: '#0F0F0F',
  },

  // Border System (1px borders only - Section II Rule #1)
  border: {
    default: '#1F1F1F', // Standard separation
    subtle: '#111111', // Minimal separation
    emphasis: '#333333', // Highlighted separation
    glow: '#444444', // Micro-glow (Linear aesthetic)
  },

  // Nexus Green (MAX 5% of screen area - Section III)
  accent: {
    primary: '#28E7A2', // Primary CTA, data upticks, active state
    hover: '#2DF5B0',
    muted: '#1DB87F',
    transparent: {
      10: 'rgba(40, 231, 162, 0.1)',
      20: 'rgba(40, 231, 162, 0.2)',
      40: 'rgba(40, 231, 162, 0.4)',
    },
  },

  // Status Colors (muted to avoid "neon crypto" look)
  status: {
    success: '#28E7A2',
    warning: '#F5A623',
    danger: '#E74C3C',
    info: '#3498DB',
  },

  // Text Hierarchy (contrast-based, not size-based)
  text: {
    primary: '#FFFFFF',
    secondary: '#888888',
    tertiary: '#666666',
    disabled: '#444444',
  },
} as const;

// ============================================================================
// SPACING SYSTEM - Section V: Vertical Rhythm
// ============================================================================

/**
 * TIERED SPACING SYSTEM
 *
 * Guidelines.md says "120px, 240px" but this applies to SECTION-level spacing.
 * We define 4 tiers to eliminate ambiguity:
 */

export const SPACING = {
  // Tier 1: Section-level (Guidelines.md multipliers)
  section: {
    sm: '120px',
    lg: '240px',
  },

  // Tier 2: Component-level (cards, panels)
  component: {
    xs: '12px',
    sm: '24px',
    md: '48px',
  },

  // Tier 3: Element-level (internal padding, gaps)
  element: {
    xs: '8px',
    sm: '16px',
    md: '24px',
    lg: '32px',
  },

  // Tier 4: Micro (icons, borders, fine-tuning)
  micro: {
    xs: '2px',
    sm: '4px',
    md: '8px',
  },

  // Card-specific tokens (LOCKED VALUES)
  card: {
    gap: '24px', // Grid gap between cards
    header: {
      px: 'px-6', // 24px horizontal
      py: 'py-4', // 16px vertical
    },
    body: {
      p: 'p-6', // 24px all sides
    },
    footer: {
      px: 'px-6',
      py: 'py-3', // 12px vertical
    },
    compact: {
      header: {
        px: 'px-5', // 20px horizontal
        py: 'py-3', // 12px vertical
      },
      body: {
        p: 'p-5',
      },
      footer: {
        px: 'px-5',
        py: 'py-2.5', // 10px vertical
      },
    },
  },
} as const;

// ============================================================================
// TYPOGRAPHY PHYSICS - Section IV
// ============================================================================

/**
 * LETTER SPACING (TRACKING) - CRITICAL
 * This is THE secret to the Linear/Palantir aesthetic
 *
 * ⚠️ FONT SIZE MINIMUM RULE:
 * - Functional UI text (user must read): ≥9px
 * - Decorative text (ambient, coordinates): Can use 8px or smaller
 * - Why: 8px fails WCAG standards and causes eye strain
 */

export const TYPOGRAPHY = {
  // Tracking (letter-spacing)
  tracking: {
    tight: '-0.04em', // H1-H2 (aggressive negative)
    normal: '0', // Body text
    wide: '0.1em', // Labels
    wider: '0.15em', // Buttons, micro-labels
    widest: '0.2em', // ALL CAPS section headers
  },

  // Typeface pairing
  fontFamily: {
    primary: 'Inter, system-ui, sans-serif', // Neo-Grotesque
    mono: 'JetBrains Mono, SF Mono, monospace', // Technical
  },

  // Size hierarchy (use sparingly, prefer contrast)
  size: {
    h1: 'text-4xl', // 36px
    h2: 'text-2xl', // 24px
    h3: 'text-lg', // 18px
    body: 'text-sm', // 14px - MINIMUM for body text
    label: 'text-[11px]', // 11px - Form labels, metadata
    micro: 'text-[10px]', // 10px - Section headers (uppercase only)
    nano: 'text-[9px]', // 9px - Button labels (uppercase only) - MINIMUM for functional UI

    // ⚠️ DECORATIVE ONLY - Not for functional text
    ambient: 'text-[8px]', // 8px - ONLY for: coordinates, corner marks, Easter eggs
    ghost: 'text-[6px]', // 6px - Ultra-ambient (rare, must have aria-hidden)
  },

  // Minimum sizes (enforcement)
  minReadable: 9, // Pixels - Never go below this for functional UI
  minComfortable: 11, // Pixels - Recommended minimum for readability

  // Component-specific locked styles
  components: {
    cardTitle: 'tracking-tight text-white',
    cardSubtitle: 'text-[10px] font-mono text-zinc-600 tracking-[0.1em]',
    sectionLabel: 'text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-600',
    buttonLabel: 'font-mono text-[9px] uppercase tracking-[0.15em]',
    badge: 'text-[10px] font-mono uppercase tracking-wider',
  },
} as const;

// ============================================================================
// BORDER SYSTEM - Section II: The "1px" Rule
// ============================================================================

/**
 * ALL separation MUST use 1px strokes.
 * Large shadows are FORBIDDEN.
 */

export const BORDERS = {
  // Standard borders (1px only)
  default: 'border border-[#1F1F1F]',
  top: 'border-t border-[#1F1F1F]',
  bottom: 'border-b border-[#1F1F1F]',
  left: 'border-l border-[#1F1F1F]',
  right: 'border-r border-[#1F1F1F]',

  // Emphasis borders (brighter, not thicker)
  emphasis: 'border border-[#333]',

  // Micro-glows (Linear aesthetic - Section II Rule #2)
  glow: {
    top: 'border-t border-[#333]/0 hover:border-[#333]/100 transition-colors duration-300',
    emerald: 'border-emerald-500/40',
    amber: 'border-amber-500/40',
  },

  // FORBIDDEN: Never use these
  // - shadow-lg
  // - shadow-xl
  // - border-2
  // - border-4
} as const;

// ============================================================================
// CORNER RADIUS - Section VI: Component Behaviors
// ============================================================================

/**
 * Sharp corners or slightly rounded (4px).
 * NO pill shapes (999px).
 */

export const RADIUS = {
  none: 'rounded-none',
  sm: 'rounded', // 4px (acceptable)
  // FORBIDDEN: rounded-lg, rounded-xl, rounded-full
} as const;

// ============================================================================
// SHADOWS - FORBIDDEN (Depth via Borders Only)
// ============================================================================

/**
 * Section I Anti-Pattern #4: The "Soft Shadow"
 * Depth is created via stroke lightness, not diffuse shadows.
 */

export const SHADOWS = {
  // Only acceptable shadow: inset micro-glow
  insetGlow: 'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]',

  // FORBIDDEN:
  // - shadow-sm
  // - shadow-md
  // - shadow-lg
  // - shadow-xl
  // - shadow-2xl
} as const;

// ============================================================================
// COMPONENT TOKENS
// ============================================================================

export const COMPONENTS = {
  card: {
    base: `${BORDERS.default} ${COLORS.depth.base}`,
    header: `${BORDERS.bottom} ${SPACING.card.header.px} ${SPACING.card.header.py}`,
    body: SPACING.card.body.p,
    footer: `${BORDERS.top} bg-[${COLORS.depth.nested}] ${SPACING.card.footer.px} ${SPACING.card.footer.py}`,
  },

  button: {
    primary: `bg-[${COLORS.accent.primary}] ${BORDERS.default} ${TYPOGRAPHY.components.buttonLabel}`,
    secondary: `${BORDERS.default} bg-[${COLORS.depth.nested}] ${TYPOGRAPHY.components.buttonLabel}`,
    ghost: `${BORDERS.default} ${TYPOGRAPHY.components.buttonLabel}`,
  },

  badge: {
    base: `${TYPOGRAPHY.components.badge} px-2 py-1 ${BORDERS.default}`,
  },

  input: {
    base: `${BORDERS.default} bg-[${COLORS.depth.nested}] px-3 py-2`,
  },
} as const;

// ============================================================================
// FOCUS STATES - Accessibility (WCAG 2.1 AA)
// ============================================================================

export const FOCUS = {
  ring: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]',
  ringAmber:
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]',
} as const;

// ============================================================================
// ANIMATION TOKENS
// ============================================================================

export const ANIMATION = {
  transition: {
    fast: 'transition-all duration-150',
    normal: 'transition-all duration-200',
    slow: 'transition-all duration-300',
  },

  // Forensic loading (no playful spinners)
  loading: 'border-2 border-emerald-500 border-t-transparent rounded-full animate-spin',
} as const;

// ============================================================================
// GRID SYSTEM - 12-Column Figma Standard
// ============================================================================

export const GRID = {
  container: 'w-full max-w-[1280px]', // 1440px - 160px margins
  gap: 'gap-6', // 24px gutter
  columns: {
    1: 'col-span-1',
    2: 'col-span-2',
    3: 'col-span-3',
    4: 'col-span-4',
    5: 'col-span-5',
    6: 'col-span-6',
    7: 'col-span-7',
    8: 'col-span-8',
    9: 'col-span-9',
    10: 'col-span-10',
    11: 'col-span-11',
    12: 'col-span-12',
  },
} as const;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Use these functions to validate component implementations
 */

export function validateSpacing(value: string): boolean {
  const allowed = [
    ...Object.values(SPACING.section),
    ...Object.values(SPACING.component),
    ...Object.values(SPACING.element),
    ...Object.values(SPACING.micro),
  ];
  return allowed.includes(value);
}

export function validateColor(value: string): boolean {
  const allowed = [
    COLORS.void,
    COLORS.matter,
    COLORS.structure,
    COLORS.signal,
    COLORS.noise,
    ...Object.values(COLORS.depth),
    ...Object.values(COLORS.border),
    COLORS.accent.primary,
    COLORS.accent.hover,
    COLORS.accent.muted,
  ];
  return allowed.includes(value);
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ColorToken = typeof COLORS;
export type SpacingToken = typeof SPACING;
export type TypographyToken = typeof TYPOGRAPHY;
export type BorderToken = typeof BORDERS;

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * ✅ CORRECT USAGE:
 *
 * import { BORDERS, COLORS, TYPOGRAPHY, FOCUS } from '@/constants/design-tokens';
 *
 * <div className={`${BORDERS.default} ${TYPOGRAPHY.components.cardTitle} ${FOCUS.ring}`}>
 *
 * ❌ INCORRECT USAGE:
 *
 * <div className="border border-gray-800 text-lg shadow-lg rounded-lg">
 *
 * The second example violates multiple Guidelines.md rules:
 * - Uses arbitrary color (not from palette)
 * - Uses soft shadow (forbidden)
 * - Uses large radius (forbidden)
 */
