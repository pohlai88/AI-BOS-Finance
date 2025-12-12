import React from 'react'
import { useRouterAdapter } from '@/hooks/useRouterAdapter'
import { NexusIcon } from '@/components/nexus/NexusIcon'

interface ForensicStripProps {
  code: string
  status?: string
}

export function ForensicClassificationStrip({
  code,
  status = 'ACTIVE',
}: ForensicStripProps) {
  const { navigate } = useRouterAdapter()

  return (
    <div className="border-b border-[#1F1F1F] bg-[#000000]">
      {/* Top Green Line */}
      <div className="h-[1px] bg-[#28E7A2]" />

      {/* Content */}
      <div className="flex h-12 items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('/')}
            className="group flex items-center gap-2 transition-opacity hover:opacity-80"
            title="Return to Home"
          >
            <NexusIcon size="sm" />
          </button>
          <div className="h-3 w-[1px] bg-[#333]" />
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#666] md:text-[12px]">
            Classified // Forensic Metadata
          </span>
          <div className="h-3 w-[1px] bg-[#333]" />
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#28E7A2] md:text-[12px]">
            {code}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`h-1.5 w-1.5 rounded-full ${status === 'CRITICAL' ? 'bg-[#FF3333]' : 'bg-[#28E7A2]'} animate-pulse`}
          />
          <span
            className={`font-mono text-[10px] tracking-[0.15em] md:text-[12px] ${status === 'CRITICAL' ? 'text-[#FF3333]' : 'text-[#666]'} uppercase`}
          >
            {status}
          </span>
        </div>
      </div>
    </div>
  )
}
