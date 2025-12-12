import * as React from 'react'
import { cn } from "@/lib/utils"

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
  
  // 🛡️ THE LAW: These variants reference CSS variables (The Constitution)
  // If you change the token in globals.css, it changes EVERYWHERE.
  const variants = {
    base: "border shadow-sm",
    flat: "border-transparent",
    ghost: "border-transparent bg-transparent",
  }

  // Apply background and border colors via CSS variables
  const variantStyles = {
    base: {
      backgroundColor: 'var(--surface-base-bg)',
      borderColor: 'var(--surface-base-border)',
      boxShadow: 'var(--surface-base-shadow)',
    },
    flat: {
      backgroundColor: 'var(--surface-flat-bg)',
      borderColor: 'var(--surface-flat-border)',
      boxShadow: 'var(--surface-flat-shadow)',
    },
    ghost: {
      backgroundColor: 'var(--surface-ghost-bg)',
      borderColor: 'var(--surface-ghost-border)',
      boxShadow: 'var(--surface-ghost-shadow)',
    },
  }

  return (
    <div
      className={cn(
        "border transition-all", // Base styles
        variants[variant], // Variant-specific classes
        className
      )}
      style={{
        borderRadius: 'var(--surface-radius)', // Locked shape from Constitution
        ...variantStyles[variant], // Apply token-based styles
      }}
      {...props}
    >
      {children}
    </div>
  )
}
