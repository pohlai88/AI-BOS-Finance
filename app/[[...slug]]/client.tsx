'use client'

import dynamic from 'next/dynamic'

// ⚠️ CRITICAL: Disable SSR to prevent window/document access errors
// This ensures React Router (which may access browser APIs) doesn't crash during SSR
// Note: Providers are now in app/layout.tsx via Providers wrapper
const AppWithoutProviders = dynamic(
  () => import('../../src/App').then((mod) => {
    // We need to create a version of App without the outer providers
    // For now, we just render the full App (it will have nested providers)
    // This is temporary during migration - providers will be deduplicated
    return mod.default
  }), 
  { 
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-lg">Loading NexusCanon...</div>
        </div>
      </div>
    )
  }
)

export function ClientOnly() {
  return <AppWithoutProviders />
}
