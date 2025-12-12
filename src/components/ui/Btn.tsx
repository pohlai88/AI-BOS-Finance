import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * 🛡️ The Allowed Variants (No "Large-Bold-Blue-Button" allowed)
 * 
 * These are the ONLY button styles allowed in the system.
 * No arbitrary combinations. No guessing colors or sizes.
 */
type BtnVariant = 'primary' | 'secondary'
type BtnSize = 'sm' | 'md' | 'lg'

interface BtnProps extends React.ComponentProps<'button'> {
  /**
   * Button variant - defines visual intent
   * - 'primary': Main action (brand green, high contrast)
   * - 'secondary': Alternative action (outlined, subtle)
   */
  variant?: BtnVariant
  /**
   * Button size - defines touch target and padding
   * - 'sm': Small (compact UI)
   * - 'md': Medium (default)
   * - 'lg': Large (prominent actions)
   */
  size?: BtnSize
  /**
   * Loading state - shows spinner and disables interaction
   */
  loading?: boolean
  /**
   * Disabled state - prevents interaction
   */
  disabled?: boolean
  children: React.ReactNode
}

/**
 * Btn Component - Action Enforcement Layer
 * 
 * 🛡️ Governance: This component ENFORCES the action system.
 * Developers CANNOT use Surface as a fake button.
 * They MUST use Btn for all interactive actions.
 * 
 * Features:
 * - ✅ Keyboard accessible (Tab, Enter, Space)
 * - ✅ Focus states (visible focus ring)
 * - ✅ Disabled states (opacity + pointer-events)
 * - ✅ Loading states (spinner + disabled)
 * - ✅ Consistent padding (size variants)
 * - ✅ Semantic HTML (<button> tag)
 * 
 * Changing action tokens in globals.css updates ALL buttons automatically.
 * This is the "Action Atom" - no drift allowed.
 */
export const Btn = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className,
  children,
  ...props
}: BtnProps) => {

  // 🔒 LOCKED: Variant styles use governed colors (action-primary/secondary)
  // No arbitrary colors allowed. No guessing button styles.
  const variants = {
    primary: "bg-action-primary text-action-primary-fg hover:bg-action-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-primary focus-visible:ring-offset-2",
    secondary: "bg-action-secondary text-action-secondary-fg border border-action-secondary-border hover:bg-action-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-secondary-border focus-visible:ring-offset-2",
  }

  // 🔒 LOCKED: Size variants use consistent padding
  const sizes = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 text-base",
    lg: "h-12 px-6 text-lg",
  }

  const isDisabled = disabled || loading

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-action font-medium transition-all",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={isDisabled}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}
