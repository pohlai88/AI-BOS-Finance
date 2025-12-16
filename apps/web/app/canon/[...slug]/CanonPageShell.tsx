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
    className: 'bg-primary/10 border-primary/30 text-primary',
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
    className: 'bg-nexus-signal/10 border-nexus-signal/30 text-text-primary/60',
    description: 'This document is archived for historical reference only.',
  },
}

export function CanonPageShell({ meta, children }: CanonPageShellProps) {
  const status = STATUS_CONFIG[meta.status]
  const StatusIcon = status.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="border-b border-subtle/30 pb-6">
        {/* Canon ID Badge */}
        <div className="flex items-center gap-3 mb-4">
          <span className="px-2 py-1 rounded bg-primary/20 text-primary text-xs font-mono font-semibold">
            {meta.id}
          </span>
          <span className="text-text-primary/40 text-xs">v{meta.version}</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          {meta.title}
        </h1>

        {/* Description */}
        {meta.description && (
          <p className="text-text-primary/60 text-lg">
            {meta.description}
          </p>
        )}

        {/* Status Banner */}
        <div className={`mt-4 flex items-center gap-2 px-3 py-2 rounded border ${status.className}`}>
          <StatusIcon className="w-4 h-4" />
          <span className="font-medium text-sm">{status.label}</span>
          <span className="text-sm opacity-70">— {status.description}</span>
        </div>

        {/* Last Updated */}
        <div className="mt-4 flex items-center gap-4 text-xs text-text-primary/40">
          <span>Last updated: {meta.lastUpdated}</span>
        </div>
      </header>

      {/* MDX Content */}
      <div className="min-h-[50vh]">
        {children}
      </div>

      {/* Footer */}
      <footer className="border-t border-subtle/30 pt-6 mt-12">
        <div className="flex items-center justify-between text-xs text-text-primary/40">
          <span>Canon ID: {meta.id} | Version: {meta.version}</span>
          <span>Part of the Nexus Canon Governance System</span>
        </div>
      </footer>
    </div>
  )
}
