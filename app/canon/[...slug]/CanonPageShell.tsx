'use client'

import { ReactNode } from 'react'
import { AlertTriangle, CheckCircle, Clock, Archive } from 'lucide-react'
import type { CanonPageMeta } from '@/canon-pages/registry'

/**
 * Canon Page Shell
 *
 * Wraps MDX content with governance metadata:
 * - Status banner (ACTIVE, DRAFT, DEPRECATED, ARCHIVED)
 * - Version and last updated info
 * - Canon ID badge
 *
 * @see REF_037 - Phase 3: Canon Page System
 */

interface CanonPageShellProps {
  meta: CanonPageMeta
  children: ReactNode
}

const STATUS_CONFIG = {
  ACTIVE: {
    icon: CheckCircle,
    label: 'Active',
    className: 'bg-nexus-green/10 border-nexus-green/30 text-nexus-green',
    description: 'This document is current and actively maintained.',
  },
  DRAFT: {
    icon: Clock,
    label: 'Draft',
    className: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500',
    description: 'This document is a work in progress and may change.',
  },
  DEPRECATED: {
    icon: AlertTriangle,
    label: 'Deprecated',
    className: 'bg-orange-500/10 border-orange-500/30 text-orange-500',
    description: 'This document is outdated. A newer version may be available.',
  },
  ARCHIVED: {
    icon: Archive,
    label: 'Archived',
    className: 'bg-nexus-signal/10 border-nexus-signal/30 text-nexus-signal/60',
    description: 'This document is archived for historical reference only.',
  },
}

export function CanonPageShell({ meta, children }: CanonPageShellProps) {
  const status = STATUS_CONFIG[meta.status]
  const StatusIcon = status.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="border-nexus-border/30 border-b pb-6">
        {/* Canon ID Badge */}
        <div className="mb-4 flex items-center gap-3">
          <span className="bg-nexus-green/20 text-nexus-green rounded px-2 py-1 font-mono text-xs font-semibold">
            {meta.id}
          </span>
          <span className="text-nexus-signal/40 text-xs">v{meta.version}</span>
        </div>

        {/* Title */}
        <h1 className="text-nexus-signal mb-2 text-3xl font-bold">
          {meta.title}
        </h1>

        {/* Description */}
        {meta.description && (
          <p className="text-nexus-signal/60 text-lg">{meta.description}</p>
        )}

        {/* Status Banner */}
        <div
          className={`mt-4 flex items-center gap-2 rounded border px-3 py-2 ${status.className}`}
        >
          <StatusIcon className="h-4 w-4" />
          <span className="text-sm font-medium">{status.label}</span>
          <span className="text-sm opacity-70">— {status.description}</span>
        </div>

        {/* Last Updated */}
        <div className="text-nexus-signal/40 mt-4 flex items-center gap-4 text-xs">
          <span>Last updated: {meta.lastUpdated}</span>
        </div>
      </header>

      {/* MDX Content */}
      <div className="min-h-[50vh]">{children}</div>

      {/* Footer */}
      <footer className="border-nexus-border/30 mt-12 border-t pt-6">
        <div className="text-nexus-signal/40 flex items-center justify-between text-xs">
          <span>
            Canon ID: {meta.id} | Version: {meta.version}
          </span>
          <span>Part of the Nexus Canon Governance System</span>
        </div>
      </footer>
    </div>
  )
}
