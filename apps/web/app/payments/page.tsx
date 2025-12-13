'use client'

/**
 * PAY_01 - Payment Hub
 * 
 * Native Next.js App Router page (Phase 2 migration)
 * Migrated from: React Router route "/payments"
 * Alias: /payment-hub (handled separately)
 * 
 * @see REF_039_RouteMigrationStrategy.md
 * @see REF_082_NextJsEnvironmentAudit.md - Phase 2 Optimization
 */

import { Suspense } from 'react'
import PAY01PaymentHubPage from '@/views/PAY_01_PaymentHubPage'

// Note: Route segment config (dynamic, revalidate) cannot be exported from Client Components.
// This is a client component, so caching is handled via fetch options in child components.

export default function PaymentsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>}>
      <PAY01PaymentHubPage />
    </Suspense>
  )
}
