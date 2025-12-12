import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * 🛡️ The Allowed Variants (No "Large-Green-Dot" allowed)
 *
 * StatusDot is a specialized component for status indicator dots.
 * It uses the same governed status tokens as Badge.
 */
type StatusDotVariant = 'success' | 'warning' | 'error' | 'neutral'
type StatusDotSize = 'sm' | 'md' | 'lg'

interface StatusDotProps extends React.ComponentProps<'span'> {
  /**
   * Status variant - defines status intent
   * - 'success': Good/operational (green)
   * - 'warning': Caution/attention needed (yellow)
   * - 'error': Problem/failure (red)
   * - 'neutral': Info/default (blue)
   */
  variant?: StatusDotVariant
  /**
   * Dot size - defines visual prominence
   * - 'sm': Small (compact UI)
   * - 'md': Medium (default)
   * - 'lg': Large (prominent status)
   */
  size?: StatusDotSize
}

/**
 * StatusDot Component - Status Indicator Enforcement
 *
 * 🛡️ Governance: This component ENFORCES the status system for dots.
 * Developers CANNOT use hardcoded colors like `bg-emerald-500`.
 * They MUST use StatusDot for all status indicator dots.
 *
 * This replaces hardcoded dots like:
 * ❌ <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
 * ✅ <StatusDot variant="success" size="md" />
 *
 * Changing status tokens in globals.css updates ALL dots automatically.
 */
export const StatusDot = ({
  variant = 'neutral',
  size = 'md',
  className,
  ...props
}: StatusDotProps) => {
  // 🔒 LOCKED: Variant styles use governed colors (status-success/warning/error/neutral)
  const variants = {
    success: 'bg-status-success',
    warning: 'bg-status-warning',
    error: 'bg-status-error',
    neutral: 'bg-status-neutral',
  }

  // 🔒 LOCKED: Dot sizes
  const sizes = {
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
  }

  return (
    <span
      className={cn(
        'inline-block rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
      aria-label={`Status: ${variant}`}
      {...props}
    />
  )
}
