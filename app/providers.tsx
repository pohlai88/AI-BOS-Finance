'use client'

import { SysConfigProvider } from '@/context/SysConfigContext'
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
      <div className="antialiased text-nexus-signal bg-nexus-void min-h-screen font-sans selection:bg-nexus-green/30">
        {/* THE CINEMATIC VIGNETTE - Focus the eye to center */}
        <div className="fixed inset-0 pointer-events-none z-40 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.4)_100%)]" />
        
        {children}
        
        <Toaster position="bottom-right" theme="dark" />
      </div>
      </SysConfigProvider>
    </RouterAdapterProvider>
  )
}
