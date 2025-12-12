import * as React from "react"
import { cn } from '../lib/utils'

/**
 * 🛡️ The Allowed Variants (No "Large-Bold-Blue" allowed)
 * 
 * These are the ONLY text styles allowed in the system.
 * No arbitrary combinations. No guessing font sizes.
 */
type TxtVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'subtle' | 'small'

interface TxtProps extends React.ComponentProps<'p'> {
  /**
   * Text variant - defines semantic meaning and visual hierarchy
   * - 'h1': Main title (largest, boldest)
   * - 'h2': Section title
   * - 'h3': Card title
   * - 'h4': Subsection title
   * - 'body': Standard body text (default)
   * - 'subtle': Captions, metadata, less important text
   * - 'small': Small labels, fine print
   */
  variant?: TxtVariant
  /**
   * Semantic HTML element override
   * Use when you need different semantic meaning (e.g., render h1 visually but use h2 tag for SEO)
   */
  as?: keyof JSX.IntrinsicElements
  children: React.ReactNode
}

/**
 * Txt Component - Typography Enforcement Layer
 * 
 * 🛡️ Governance: This component ENFORCES the typography system.
 * Developers CANNOT use arbitrary text classes like `text-slate-500`.
 * They MUST use one of the defined variants.
 * 
 * Changing text tokens in globals.css updates ALL text automatically.
 * This is the "Martial Law" for Typography - no drift allowed.
 */
export const Txt = ({
  variant = 'body',
  as,
  className,
  children,
  ...props
}: TxtProps) => {

  // 1. Map Variant -> Tag (Semantic HTML)
  // Headings render as their semantic tag, body/subtle/small render as <p>
  const Component = as || (variant.startsWith('h') ? variant : 'p') as keyof JSX.IntrinsicElements

  // 2. Map Variant -> Classes (Visual Law)
  // 🔒 LOCKED: We only use governed colors (text-text-primary/secondary/tertiary)
  // No arbitrary colors allowed. No guessing font sizes.
  const styles = {
    h1: "text-4xl font-bold tracking-tight text-text-primary",
    h2: "text-2xl font-semibold tracking-tight text-text-primary",
    h3: "text-xl font-semibold text-text-primary",
    h4: "text-lg font-medium text-text-primary",
    body: "text-base text-text-secondary leading-relaxed",
    subtle: "text-sm text-text-tertiary",
    small: "text-xs text-text-tertiary font-medium",
  }

  return (
    <Component
      className={cn(styles[variant], className)}
      {...props}
    >
      {children}
    </Component>
  )
}

export type { TxtProps }
