import { useState } from 'react'
import { MetaAppShell } from '../components/shell/MetaAppShell'
import { MetaPageHeader } from '../components/MetaPageHeader'
import { mockHealthModules } from '../data/mockHealthScan'
import { HealthModuleCard } from '../components/health/HealthModuleCard'
import { HealthRadar } from '../components/health/HealthRadar'
import { HealthCoreGauge } from '../components/health/HealthCoreGauge'
import {
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
} from 'lucide-react'
import clsx from 'clsx'

export function MetaHealthScanPage() {
  const [selectedModule, setSelectedModule] = useState<string | null>(null)

  // Calculate overall health
  const overallScore = Math.round(
    mockHealthModules.reduce((sum, mod) => sum + mod.score, 0) /
      mockHealthModules.length
  )

  const governedCount = mockHealthModules.filter(
    (m) => m.status === 'Governed'
  ).length
  const watchCount = mockHealthModules.filter(
    (m) => m.status === 'Watch'
  ).length
  const exposedCount = mockHealthModules.filter(
    (m) => m.status === 'Exposed'
  ).length

  const criticalIssues = mockHealthModules.reduce(
    (sum, mod) =>
      sum + mod.issues.filter((i) => i.severity === 'Critical').length,
    0
  )

  return (
    <MetaAppShell>
      <div className="mx-auto max-w-[1600px] px-6 py-8 md:px-12 md:py-12">
        {/* HEADER */}
        <MetaPageHeader
          variant="document"
          code="META_06"
          title="HEALTH SCAN"
          subtitle="BYOS TELEMETRY"
          description="Automated governance health checks across IFRS, Tax, and SOC2 frameworks. Bring Your Own Standards."
        />

        {/* CORE METRICS */}
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded border border-[#1F1F1F] bg-[#0A0A0A] p-5">
            <div className="mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#666]" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
                Overall Health
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <div
                className={clsx(
                  'font-mono text-3xl',
                  overallScore >= 75
                    ? 'text-[#28E7A2]'
                    : overallScore >= 60
                      ? 'text-orange-400'
                      : 'text-red-500'
                )}
              >
                {overallScore}
              </div>
              <div className="text-sm text-[#666]">/ 100</div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-[#28E7A2]">
              <TrendingUp className="h-3 w-3" />
              +12% vs Q3
            </div>
          </div>

          <div className="rounded border border-[#28E7A2]/30 bg-[#0A0A0A] p-5">
            <div className="mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-[#28E7A2]" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#28E7A2]">
                Governed
              </span>
            </div>
            <div className="font-mono text-3xl text-[#28E7A2]">
              {governedCount}
            </div>
            <div className="mt-1 text-xs text-[#666]">Modules at target</div>
          </div>

          <div className="rounded border border-orange-500/30 bg-[#0A0A0A] p-5">
            <div className="mb-3 flex items-center gap-2">
              <Info className="h-4 w-4 text-orange-400" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-orange-400">
                Watch
              </span>
            </div>
            <div className="font-mono text-3xl text-orange-400">
              {watchCount}
            </div>
            <div className="mt-1 text-xs text-[#666]">Needs attention</div>
          </div>

          <div className="rounded border border-red-500/30 bg-[#0A0A0A] p-5">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-red-400">
                Exposed
              </span>
            </div>
            <div className="font-mono text-3xl text-red-500">
              {exposedCount}
            </div>
            <div className="mt-1 text-xs text-[#666]">Critical gaps</div>
          </div>
        </div>

        {/* VISUALIZATION GRID */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr,400px]">
          {/* LEFT: RADAR CHART */}
          <div className="overflow-hidden rounded border border-[#1F1F1F] bg-[#050505]">
            <div className="border-b border-[#1F1F1F] bg-[#0A0A0A] p-4">
              <h2 className="font-medium text-white">Health Radar</h2>
              <div className="mt-1 text-xs text-[#666]">
                Multi-dimensional governance coverage
              </div>
            </div>
            <div className="p-8">
              <HealthRadar modules={mockHealthModules} />
            </div>
          </div>

          {/* RIGHT: CORE GAUGE */}
          <div className="overflow-hidden rounded border border-[#1F1F1F] bg-[#050505]">
            <div className="border-b border-[#1F1F1F] bg-[#0A0A0A] p-4">
              <h2 className="font-medium text-white">Core Health</h2>
              <div className="mt-1 text-xs text-[#666]">Aggregate score</div>
            </div>
            <div className="flex items-center justify-center p-8">
              <HealthCoreGauge score={overallScore} />
            </div>

            {/* CRITICAL ISSUES ALERT */}
            {criticalIssues > 0 && (
              <div className="border-t border-[#1F1F1F] p-4">
                <div className="rounded border border-red-500/20 bg-red-500/5 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                    <div>
                      <div className="mb-1 text-sm font-medium text-white">
                        {criticalIssues} Critical Issues
                      </div>
                      <div className="text-xs text-[#888]">
                        Requires immediate attention to prevent compliance
                        failures or financial misstatement.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MODULE CARDS */}
        <div className="mt-8">
          <h2 className="mb-4 flex items-center gap-2 font-medium text-white">
            Module Breakdown
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
              {mockHealthModules.length} Modules Scanned
            </span>
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {mockHealthModules.map((module) => (
              <HealthModuleCard
                key={module.id}
                module={module}
                isSelected={selectedModule === module.id}
                onClick={() =>
                  setSelectedModule(
                    selectedModule === module.id ? null : module.id
                  )
                }
              />
            ))}
          </div>
        </div>

        {/* SCAN INFO */}
        <div className="mt-8 rounded border border-blue-500/20 bg-blue-500/5 p-5">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-400" />
            <div>
              <div className="mb-1 text-sm font-medium text-white">
                How Health Scan Works
              </div>
              <div className="space-y-1 text-sm text-[#888]">
                <p>
                  NexusCanon performs automated daily scans against your own
                  compliance frameworks (IFRS, Tax, SOC2, etc.). Each module is
                  scored across three dimensions:
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  <li>
                    <strong className="text-white">IFRS Compliance:</strong>{' '}
                    Revenue recognition, asset classification, disclosure
                    completeness
                  </li>
                  <li>
                    <strong className="text-white">Tax Alignment:</strong> WHT
                    flags, transfer pricing markers, deferred tax logic
                  </li>
                  <li>
                    <strong className="text-white">Control Strength:</strong>{' '}
                    Approval workflows, segregation of duties, audit trails
                  </li>
                </ul>
                <p className="mt-2">
                  Issues are automatically linked to Canon records, enabling
                  one-click remediation and propagation across all affected
                  systems.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MetaAppShell>
  )
}
