'use client'

/**
 * SYS_01 - System Bootloader Route
 * Thin route - delegates to feature module
 * @see FRONTEND_CLEAN_STATE_REVIEW.md
 */

import { Suspense } from 'react'
import { SYS_01_SysBootloaderPage } from '@/features/system'

export default function SystemRoute() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>}>
      <SYS_01_SysBootloaderPage />
    </Suspense>
  )
}
