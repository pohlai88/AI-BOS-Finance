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
 * 
 * SCROLLING: The body handles scrolling (set in globals.css).
 * This wrapper is just for styling and providers.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <RouterAdapterProvider>
      <SysConfigProvider>
        {/* 
          Global app wrapper - NO height/overflow constraints.
          Body scrolling is handled by globals.css.
        */}
        <div className="antialiased bg-background font-sans selection:bg-primary/30">
          {children}

          <Toaster position="bottom-right" theme="dark" />
        </div>
      </SysConfigProvider>
    </RouterAdapterProvider>
  )
}
