// ============================================================================
// BIOSKIN DEMO: Loading State
// ============================================================================
// Next.js App Router loading.tsx for bioskin-demo route
// Prevents white screens during Kernel data fetching
// ============================================================================

import { Surface } from '@aibos/ui'

export default function BioSkinDemoLoading() {
  return (
    <div className="min-h-screen space-y-8 bg-surface-flat p-8">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded-action bg-surface-base" />
          <div className="h-4 w-64 animate-pulse rounded-action bg-surface-base" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-24 animate-pulse rounded-action bg-surface-base" />
          <div className="h-10 w-24 animate-pulse rounded-action bg-surface-base" />
        </div>
      </div>

      {/* BioObject Skeleton */}
      <Surface variant="base" className="p-6">
        <div className="mb-4 h-6 w-48 animate-pulse rounded-action bg-surface-flat" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-32 animate-pulse rounded-action bg-surface-flat" />
              <div className="h-10 w-full animate-pulse rounded-action bg-surface-flat" />
            </div>
          ))}
        </div>
      </Surface>

      {/* BioList Skeleton */}
      <Surface variant="base" className="p-6">
        <div className="mb-4 h-6 w-48 animate-pulse rounded-action bg-surface-flat" />
        <div className="space-y-2">
          <div className="h-10 w-full animate-pulse rounded-action bg-surface-flat" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 w-full animate-pulse rounded-action bg-surface-flat" />
          ))}
        </div>
      </Surface>
    </div>
  )
}
