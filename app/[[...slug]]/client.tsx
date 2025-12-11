'use client'

import dynamic from 'next/dynamic'

// ⚠️ CRITICAL: Disable SSR to prevent window/document access errors
// This ensures React Router (which may access browser APIs) doesn't crash during SSR
const App = dynamic(() => import('../../src/App'), { 
  ssr: false, // Prevents server-side rendering
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-nexus-void text-nexus-signal">
      <div className="text-center">
        <div className="animate-pulse text-lg">Loading NexusCanon...</div>
      </div>
    </div>
  )
})

export function ClientOnly() {
  return <App />
}
