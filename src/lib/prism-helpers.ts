// ============================================================================
// PRISM HELPERS - CSS Variable Access Utilities
// Provides backward compatibility after migrating prism-tokens.ts to globals.css
// Components can use these helpers to access CSS variables programmatically
// ============================================================================

// 1. SPACING SYSTEM (Tailwind classes remain the same)
export const SPACING = {
  cell_padding_x: 'px-3',
  cell_padding_y: 'py-2',
  header_padding_x: 'px-4',
  header_padding_y: 'py-3',
  cell_gap_sm: 'gap-2',
  cell_gap_md: 'gap-3',
  section_gap: 'gap-4',
} as const

// 2. TYPOGRAPHY SCALE (Tailwind classes)
export const TYPOGRAPHY = {
  meta: 'text-[10px]',
  label: 'text-xs',
  value: 'text-sm',
  heading: 'text-base',
} as const

// 3. LETTER SPACING (Tailwind classes)
export const TRACKING = {
  meta_caps: 'tracking-[0.08em]',
  normal: 'tracking-normal',
  tight: 'tracking-[-0.01em]',
  negative: 'tracking-[-0.02em]',
} as const

// 4. COLOR TOKENS (CSS Variable references)
export const COLORS = {
  void: 'var(--prism-void)',
  matter: 'var(--prism-matter)',
  elevated: 'var(--prism-elevated)',
  structure_primary: 'var(--prism-structure-primary)',
  structure_secondary: 'var(--prism-structure-secondary)',
  structure_subtle: 'var(--prism-structure-subtle)',
  signal: 'var(--prism-signal)',
  signal_secondary: 'var(--prism-signal-secondary)',
  noise: 'var(--prism-noise)',
  noise_dim: 'var(--prism-noise-dim)',
  noise_faint: 'var(--prism-noise-faint)',
  nexus: 'var(--prism-nexus)',
  nexus_dim: 'var(--prism-nexus-dim)',
  warning: 'var(--prism-warning)',
  error: 'var(--prism-error)',
  info: 'var(--prism-info)',
} as const

// 5. INTERACTIVE STATES (Tailwind classes)
export const STATES = {
  hover: 'hover:bg-[var(--prism-hover)]',
  hover_strong: 'hover:bg-[var(--prism-hover-strong)]',
  active: 'bg-[var(--prism-active)]',
  focus:
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--prism-nexus)] focus-visible:ring-offset-0',
  disabled: 'opacity-40 cursor-not-allowed',
} as const

// 6. DENSITY VARIANTS
export const DENSITY = {
  compact: {
    row_height: 'h-8',
    header_height: 'h-10',
    padding: 'px-2 py-1',
    gap: 'gap-1',
  },
  normal: {
    row_height: 'h-10',
    header_height: 'h-12',
    padding: 'px-3 py-2',
    gap: 'gap-2',
  },
  comfortable: {
    row_height: 'h-12',
    header_height: 'h-14',
    padding: 'px-4 py-3',
    gap: 'gap-3',
  },
} as const

// 7. BORDER SYSTEM (Tailwind classes with CSS vars)
export const BORDERS = {
  primary: 'border-[var(--prism-structure-primary)]',
  secondary: 'border-[var(--prism-structure-secondary)]',
  active: 'border-[var(--prism-nexus)]',
  subtle: 'border-[var(--prism-structure-subtle)]',
  width: 'border',
  width_2: 'border-2',
} as const

// 8. SHADOW SYSTEM
export const SHADOWS = {
  sticky_intersection: 'shadow-[4px_4px_16px_rgba(0,0,0,0.6)]',
  sticky_header: 'shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
  sticky_column: 'shadow-[4px_0_12px_rgba(0,0,0,0.4)]',
  tooltip: 'shadow-lg',
  modal: 'shadow-2xl',
} as const

// 9. Z-INDEX SYSTEM
export const Z_INDEX = {
  base: 'z-0',
  sticky_column: 'z-30',
  sticky_header: 'z-40',
  sticky_intersection: 'z-50',
  tooltip: 'z-[60]',
  dropdown: 'z-[70]',
  modal_backdrop: 'z-[80]',
  modal: 'z-[90]',
} as const

// 10. TRANSITIONS
export const TRANSITIONS = {
  fast: 'transition-all duration-150',
  normal: 'transition-all duration-200',
  slow: 'transition-all duration-300',
  colors: 'transition-colors duration-200',
} as const

// Helper function to combine token classes
export const combineTokens = (...tokens: string[]) => tokens.join(' ')
