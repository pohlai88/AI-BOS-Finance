// ============================================================================
// BIOSKIN DEMO: Error Boundary
// ============================================================================
// Next.js App Router error.tsx for bioskin-demo route
// Handles errors gracefully with token-based styling
// ============================================================================

'use client'

import { useEffect } from 'react'
import { Surface, Txt, Btn } from '@aibos/ui'

export default function BioSkinDemoError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('BioSkin Demo Error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-surface-flat p-8">
      <Surface variant="base" className="p-8">
        <div className="text-center space-y-4">
          <Txt variant="h1" className="text-status-error">
            Something went wrong!
          </Txt>
          <Txt variant="body" className="text-text-secondary">
            {error.message || 'An unexpected error occurred'}
          </Txt>
          {error.digest && (
            <Txt variant="small" className="text-text-tertiary font-mono">
              Error ID: {error.digest}
            </Txt>
          )}
          <div className="pt-4">
            <Btn variant="primary" onClick={reset}>
              Try again
            </Btn>
          </div>
        </div>
      </Surface>
    </div>
  )
}
