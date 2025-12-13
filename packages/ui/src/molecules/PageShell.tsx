import * as React from 'react'
import { Txt } from '../atoms/Txt'
import { cn } from '../lib/utils'

/**
 * PageShell Component - The Standard Page Frame
 *
 * 🛡️ Governance: This component provides a consistent page layout structure.
 * Every page should use this "Frame" to ensure visual consistency.
 *
 * Features:
 * - ✅ Standard header with title and description
 * - ✅ Action slot for page-level actions (e.g., "Create New")
 * - ✅ Content area with proper spacing
 * - ✅ Responsive layout (mobile-friendly)
 * - ✅ Uses only design tokens (no hardcoded values)
 *
 * This solves the "turning in circles" problem by standardizing every page layout instantly.
 */
export interface PageShellProps {
  /**
   * Page title (required)
   */
  title: string
  /**
   * Optional page description
   */
  description?: string
  /**
   * Action buttons/slot (e.g., "Create New" button)
   */
  actions?: React.ReactNode
  /**
   * Page content
   */
  children: React.ReactNode
  /**
   * Additional className for customization
   */
  className?: string
}

export const PageShell = ({
  title,
  description,
  actions,
  children,
  className,
}: PageShellProps) => {
  return (
    <div
      className={cn(
        'flex h-full w-full max-w-7xl flex-col space-y-6 p-6 md:p-8',
        className
      )}
    >
      {/* Standard Header */}
      <header className="flex flex-col gap-4 border-b border-border-surface-base pb-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <Txt variant="h1">{title}</Txt>
          {description && (
            <Txt variant="body" className="max-w-2xl text-text-secondary">
              {description}
            </Txt>
          )}
        </div>

        {/* Action Slot */}
        {actions && (
          <div className="flex shrink-0 items-center gap-3">{actions}</div>
        )}
      </header>

      {/* Content Area */}
      <main className="min-h-0 flex-1 animate-in fade-in duration-500">
        {children}
      </main>
    </div>
  )
}

export type { PageShellProps }
