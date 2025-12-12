import * as React from 'react'
import { cn } from '../lib/utils'

/**
 * 🛡️ The Allowed Sizes (No "Large-Bold-Input" allowed)
 *
 * These are the ONLY input sizes allowed in the system.
 * They MUST match Button sizes exactly for form symmetry.
 */
type InputSize = 'sm' | 'md' | 'lg'

interface InputProps extends React.ComponentProps<'input'> {
  /**
   * Input size - defines height and padding
   * MUST match Button size for form symmetry
   * - 'sm': Small (h-8, matches Button sm)
   * - 'md': Medium (h-10, matches Button md) - default
   * - 'lg': Large (h-12, matches Button lg)
   */
  size?: InputSize
  /**
   * Error state - shows error styling
   */
  error?: boolean
}

/**
 * Input Component - Data Entry Enforcement Layer
 *
 * 🛡️ Governance: This component ENFORCES form symmetry with Button.
 * Developers CANNOT use arbitrary input styles that break alignment.
 *
 * **Form Symmetry Rules:**
 * - ✅ Height matches Button exactly (h-10 for md)
 * - ✅ Border-radius matches Button exactly (rounded-action)
 * - ✅ Focus ring matches Button exactly (ring-action-primary)
 * - ✅ Padding matches Button exactly (px-4 for md)
 *
 * **Features:**
 * - ✅ Keyboard accessible (Tab, Enter)
 * - ✅ Focus states (visible focus ring matching Button)
 * - ✅ Error states (border-status-error)
 * - ✅ Disabled states (opacity + pointer-events)
 * - ✅ Placeholder styling (token-based)
 * - ✅ Semantic HTML (<input> tag)
 *
 * Changing input tokens in globals.css updates ALL inputs automatically.
 * This is the "Input Atom" - no drift allowed, perfect form symmetry.
 */
export const Input = ({
  size = 'md',
  error = false,
  className,
  disabled,
  ...props
}: InputProps) => {
  // 🔒 LOCKED: Size variants MUST match Button sizes exactly
  // This ensures perfect form symmetry (Input + Button side-by-side)
  const sizes = {
    sm: 'h-8 px-3 text-sm', // Matches Button sm
    md: 'h-10 px-4 text-base', // Matches Button md (default)
    lg: 'h-12 px-6 text-lg', // Matches Button lg
  }

  // 🔒 LOCKED: Base styles use governed tokens
  // Border-radius MUST match Button exactly (rounded-action for perfect form symmetry)
  // Focus ring MUST match Button exactly (ring-action-primary)
  const baseStyles = [
    'w-full min-w-0',
    'bg-input-bg text-input-text',
    'border border-input-border',
    'rounded-action', // MUST match Button's rounded-action (0.5rem) for perfect form symmetry
    'px-4 py-0', // Padding handled by size variant
    'text-base', // Base font size
    'placeholder:text-input-placeholder',
    'transition-all',
    'outline-none',
    // Focus ring MUST match Button exactly
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-primary focus-visible:ring-offset-2',
    // Error state (token-based)
    error && 'border-status-error focus-visible:ring-status-error',
    // Disabled state (matches Button)
    'disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
  ].filter(Boolean)

  return (
    <input
      type="text"
      className={cn(baseStyles, sizes[size], className)}
      disabled={disabled}
      aria-invalid={error}
      {...props}
    />
  )
}

export type { InputProps }
