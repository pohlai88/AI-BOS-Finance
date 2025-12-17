'use client'

/**
 * PAY_01 - Payment Hub Route
 * Thin route - delegates to feature module
 * @see FRONTEND_CLEAN_STATE_REVIEW.md
 */

import { Suspense } from 'react'
import { PAY_01_PaymentHubPage } from '@/features/payments'

export default function PaymentsRoute() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>}>
      <PAY_01_PaymentHubPage />
    </Suspense>
  )
}
