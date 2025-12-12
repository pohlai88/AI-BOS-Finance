// ============================================================================
// PAGE CONTAINER
// Standard content wrapper with consistent padding and max-width
// ============================================================================

import { ReactNode } from 'react'

interface PageContainerProps {
  children: ReactNode
  maxWidth?: 'full' | 'wide' | 'standard'
  className?: string
}

export function PageContainer({
  children,
  maxWidth = 'full',
  className = '',
}: PageContainerProps) {
  const maxWidthClass = {
    full: 'max-w-none',
    wide: 'max-w-[1800px]',
    standard: 'max-w-[1400px]',
  }[maxWidth]

  return (
    <div className={`${maxWidthClass} mx-auto px-8 py-8 ${className}`}>
      {children}
    </div>
  )
}
