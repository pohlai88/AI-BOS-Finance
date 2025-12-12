import * as React from 'react'
import { cn } from '@/lib/utils'

interface SurfaceProps extends React.ComponentProps<'div'> {
  /**
   * Surface variant - defines the visual intent, not the color
   * - 'base': Standard card surface (elevated, with border)
   * - 'flat': Subtle panel surface (no elevation, minimal border)
   * - 'ghost': Transparent surface (no background, no border)
   */
  variant?: 'base' | 'flat' | 'ghost'
  children: React.ReactNode
}

/**
 * Surface Component - The Atomic Building Block
 *
 * 🛡️ Governance: This component OBEYS the tokens defined in globals.css.
 * It does NOT choose colors. It only applies the "Constitution" (tokens).
 *
 * Changing --surface-* variables in globals.css updates ALL Surfaces.
 * This is the "Single Source of Truth" pattern.
 */
export const Surface = ({
  variant = 'base',
  className,
  children,
  ...props
}: SurfaceProps) => {
  // 🔒 LOCKED: We only use classes defined in tailwind.config.ts
  // These classes map to tokens in globals.css (The Constitution)
  // If you change the token in globals.css, it changes EVERYWHERE.
  const variants = {
    base: 'bg-surface-base border border-border-surface-base shadow-sm',
    flat: 'bg-surface-flat border border-border-surface-flat',
    ghost: 'bg-transparent border-none',
  }

  return (
    <div
      className={cn(
        'rounded-surface transition-all', // Uses token: rounded-surface
        variants[variant], // Variant-specific classes (all use Tailwind tokens)
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
