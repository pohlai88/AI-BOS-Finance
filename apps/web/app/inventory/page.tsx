'use client'

/**
 * INV_01 - Inventory Dashboard
 * 
 * First native Next.js App Router page (Phase 2 migration)
 * Migrated from: React Router route "/inventory"
 * 
 * @see REF_039_RouteMigrationStrategy.md
 * @see REF_082_NextJsEnvironmentAudit.md - Phase 2 Optimization
 */

import { Suspense } from 'react'
import { INV01Dashboard } from '@/modules/inventory'

// Note: Route segment config (dynamic, revalidate) cannot be exported from Client Components.
// This is a client component, so caching is handled via fetch options in child components.

export default function InventoryPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>}>
      <INV01Dashboard />
    </Suspense>
  )
}
