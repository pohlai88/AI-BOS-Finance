'use client'

/**
 * SYS_01 - System Bootloader
 *
 * Native Next.js App Router page (Phase 2 migration)
 * Migrated from: React Router route "/system"
 * Alias: /settings (handled separately)
 *
 * @see REF_039_RouteMigrationStrategy.md
 */

import { SYS01Bootloader } from '@/modules/system'

export default function SystemPage() {
  return <SYS01Bootloader />
}
