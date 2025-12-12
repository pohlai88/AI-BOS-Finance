'use client'

/**
 * Home Page (/)
 * 
 * Native Next.js App Router page (Wave 4 migration)
 * Migrated from: React Router route "/"
 * 
 * @see REF_039_RouteMigrationStrategy.md - Wave 4
 */

import { LandingPage } from '@/views/LandingPage'
import { useRouterAdapter } from '@/hooks/useRouterAdapter'

export default function HomePage() {
  const { navigate } = useRouterAdapter()

  const handleTryIt = () => {
    navigate('/dashboard')
  }

  return <LandingPage onTryIt={handleTryIt} onCanonClick={handleTryIt} />
}
