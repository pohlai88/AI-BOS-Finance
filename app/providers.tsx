'use client'

import { SysConfigProvider } from '@/modules/system'
import { RouterAdapterProvider } from '@/hooks/useRouterAdapter'
import { Toaster } from 'sonner'

/**
 * Client-side providers wrapper for Next.js App Router
 *
 * Contains all providers that need client-side features:
 * - RouterAdapterProvider (unified routing for hybrid app)
 * - SysConfigProvider (uses localStorage)
 * - Toaster (uses client-side rendering)
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <RouterAdapterProvider>
      <SysConfigProvider>
        {/* Global app wrapper with styling */}
        <div className="text-nexus-signal bg-nexus-void selection:bg-nexus-green/30 min-h-screen font-sans antialiased">
          {/* THE CINEMATIC VIGNETTE - Focus the eye to center */}
          <div className="pointer-events-none fixed inset-0 z-40 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.4)_100%)]" />

          {children}

          <Toaster position="bottom-right" theme="dark" />
        </div>
      </SysConfigProvider>
    </RouterAdapterProvider>
  )
}
