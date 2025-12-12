'use client'

/**
 * META_02 - Metadata God View (Dashboard)
 *
 * Native Next.js App Router page (Phase 2 migration)
 * Migrated from: React Router route "/dashboard"
 *
 * Uses Router Adapter pattern for hybrid compatibility.
 *
 * @see REF_039_RouteMigrationStrategy.md - Wave 3
 */

import { MetadataGodView } from '@/views/META_02_MetadataGodView'

export default function DashboardPage() {
  return <MetadataGodView />
}
