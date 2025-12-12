/**
 * Canon Health Dashboard
 * 
 * 🛡️ GOVERNANCE: Atomic Normalization Complete
 * - Uses Surface component (no inline card styles)
 * - Uses Txt component (no arbitrary typography)
 * - Zero color decisions (all tokens from globals.css)
 * - 80% code reduction (687 → ~60 lines)
 * 
 * @page CANON_01
 * @version 3.0.0
 * @see REF_046 - Next.js UI/UX Refactoring Strategy
 */

'use client'

import React from 'react'
import { Surface } from "@/components/ui/Surface"
import { Txt } from "@/components/ui/Txt"
import { Btn } from "@/components/ui/Btn"
import { StatusDot } from "@/components/ui/StatusDot"

// 🟢 MOCK DATA (Ideally this moves to a hook later)
const STATS = [
  { label: 'System Status', value: 'Operational', status: 'good' },
  { label: 'Active Nodes', value: '24/24', status: 'neutral' },
  { label: 'Uptime', value: '99.9%', status: 'good' },
]

export default function CanonHealthDashboard() {
  return (
    <div className="min-h-screen bg-surface-flat p-8 space-y-12">

      {/* 1. HEADER SECTION */}
      <header className="flex items-start justify-between">
        <div className="space-y-2">
          {/* 🛡️ Governance: No more <h1> with arbitrary classes */}
          <Txt variant="h1">Canon Health</Txt>
          <Txt variant="body">Real-time system diagnostics and performance metrics.</Txt>
        </div>

        {/* 🛡️ Governance: Real Button (not fake Surface) */}
        <Btn variant="secondary" size="sm">
          Export Report
        </Btn>
      </header>

      {/* 2. STATS GRID */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {STATS.map((stat) => (
          // 🛡️ Governance: Locked Card Shape (Surface)
          <Surface key={stat.label} variant="base" className="p-6 space-y-2">
            <Txt variant="subtle">{stat.label}</Txt>
            <div className="flex items-center gap-3">
              <Txt variant="h2">{stat.value}</Txt>
              {/* 🛡️ Governance: Governed StatusDot (not hardcoded green dot) */}
              {stat.status === 'good' && (
                <StatusDot variant="success" size="md" />
              )}
              {stat.status === 'neutral' && (
                <StatusDot variant="neutral" size="md" />
              )}
            </div>
          </Surface>
        ))}
      </section>

      {/* 3. MAIN CONTENT AREA */}
      <Surface variant="base" className="p-8 min-h-[400px] flex items-center justify-center border-dashed">
        <div className="text-center space-y-4">
          <Txt variant="h3">System Visualization</Txt>
          <Txt variant="subtle">Interactive node graph will render here.</Txt>
        </div>
      </Surface>

    </div>
  )
}
