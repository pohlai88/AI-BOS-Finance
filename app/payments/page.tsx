'use client'

/**
 * PAY_01 - Payment Hub
 *
 * Native Next.js App Router page (Phase 2 migration)
 * Migrated from: React Router route "/payments"
 * Alias: /payment-hub (handled separately)
 *
 * @see REF_039_RouteMigrationStrategy.md
 */

import { PaymentHubPage } from '@/modules/payment'

export default function PaymentsPage() {
  return <PaymentHubPage />
}
