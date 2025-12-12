// ============================================================================
// FORENSIC HEADER - Terminal-style simulation header
// ============================================================================

import { Activity } from 'lucide-react'
import { StatusDot } from '@aibos/ui'

interface ForensicHeaderProps {
  title?: string
  subtitle?: string
  legacyStatus?: string
  nexusStatus?: string
}

export const ForensicHeader = ({
  title = 'Structural',
  subtitle = 'Divergence.',
  legacyStatus = 'DEGRADING',
  nexusStatus = 'OPTIMAL',
}: ForensicHeaderProps) => {
  return (
    <div className="border-nexus-structure mb-16 flex w-full items-end justify-between border-b pb-8">
      <div className="space-y-4">
        <div className="text-nexus-green/80 flex items-center gap-2">
          <Activity className="h-4 w-4 animate-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-widest">
            Live Simulation // SEQ_ID:{' '}
            {Math.random().toString(36).substring(7).toUpperCase()}
          </span>
        </div>
        <h2 className="text-4xl font-medium tracking-tighter text-white md:text-5xl">
          {title} <span className="text-nexus-noise">{subtitle}</span>
        </h2>
      </div>

      <div className="hidden flex-col items-end gap-2 text-right md:flex">
        <div className="text-nexus-noise font-mono text-[10px] uppercase tracking-widest">
          System Integrity Monitor
        </div>
        <div className="flex gap-4">
          {/* 🛡️ GOVERNANCE: Uses StatusDot component for status indicators */}
          <div className="flex items-center gap-2">
            <StatusDot variant="error" size="sm" className="animate-pulse" />
            <span className="font-mono text-xs text-status-error">
              LEGACY: {legacyStatus}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <StatusDot variant="success" size="sm" />
            <span className="font-mono text-xs text-status-success">
              NEXUS: {nexusStatus}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
