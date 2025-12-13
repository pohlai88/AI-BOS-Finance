'use client'

/**
 * Home Page (/)
 *
 * Native Next.js App Router page
 * Redirects to dashboard
 *
 * @see REF_039_RouteMigrationStrategy.md
 */

import { useRouterAdapter } from '@/hooks/useRouterAdapter'
import { useEffect } from 'react'

export default function HomePage() {
  const { navigate } = useRouterAdapter()

  useEffect(() => {
    navigate('/dashboard')
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="text-center">
        <h1 className="mb-4 text-2xl font-medium text-white">NexusCanon</h1>
        <p className="text-zinc-400">Redirecting to dashboard...</p>
      </div>
    </div>
  )
}
