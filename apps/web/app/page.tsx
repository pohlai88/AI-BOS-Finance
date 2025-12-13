/**
 * Home Page (/)
 * 
 * Native Next.js App Router page (Wave 4 migration)
 * Migrated from: React Router route "/"
 * 
 * ✅ Server Component - Optimized for static generation
 * 
 * @see REF_039_RouteMigrationStrategy.md - Wave 4
 * @see REF_082_NextJsEnvironmentAudit.md - Phase 2 Optimization
 */

import { LandingPageClient } from '@/components/landing/LandingPageClient'
import { Suspense } from 'react'

export const dynamic = 'force-static'
export const revalidate = 3600 // Revalidate every hour

export default function HomePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <LandingPageClient />
    </Suspense>
  )
}
