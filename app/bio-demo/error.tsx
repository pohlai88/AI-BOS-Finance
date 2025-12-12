// ============================================================================
// BIO DEMO: Error Boundary
// ============================================================================
// Next.js App Router error.tsx for bio-demo route
// Handles errors gracefully with token-based styling
// ============================================================================

'use client'

import { useEffect } from 'react'
import { Surface, Txt, Btn } from '@aibos/ui'

export default function BioDemoError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to monitoring service (in production, use proper error tracking)
    if (process.env.NODE_ENV === 'development') {
      console.error('Bio Demo Error:', error)
    }
    // In production: send to error tracking service (e.g., Sentry)
  }, [error])

  return (
    <div className="min-h-screen bg-surface-flat p-8">
      <Surface variant="base" className="p-8">
        <div className="space-y-4 text-center">
          <Txt variant="h1" className="text-status-error">
            🧬 Biological UI Error
          </Txt>
          <Txt variant="body" className="text-text-secondary">
            {error.message ||
              'An unexpected error occurred while rendering the Generative UI'}
          </Txt>
          {error.digest && (
            <Txt variant="small" className="font-mono text-text-tertiary">
              Error ID: {error.digest}
            </Txt>
          )}
          <Txt variant="small" className="text-text-tertiary">
            This error occurred in the Biological UI Engine. Check the schema
            definition and data structure.
          </Txt>
          <div className="flex justify-center gap-2 pt-4">
            <Btn variant="primary" onClick={reset}>
              Try again
            </Btn>
            <Btn
              variant="secondary"
              onClick={() => (window.location.href = '/')}
            >
              Go home
            </Btn>
          </div>
        </div>
      </Surface>
    </div>
  )
}
