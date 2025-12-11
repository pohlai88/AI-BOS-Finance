import { useState } from 'react';
import { MetaAppShell } from '../components/shell/MetaAppShell';
import { MetaPageHeader } from '../components/MetaPageHeader';
import { mockHealthModules } from '../data/mockHealthScan';
import { HealthModuleCard } from '../components/health/HealthModuleCard';
import { HealthRadar } from '../components/health/HealthRadar';
import { HealthCoreGauge } from '../components/health/HealthCoreGauge';
import { Activity, TrendingUp, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import clsx from 'clsx';

export function MetaHealthScanPage() {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  // Calculate overall health
  const overallScore = Math.round(
    mockHealthModules.reduce((sum, mod) => sum + mod.score, 0) / mockHealthModules.length,
  );

  const governedCount = mockHealthModules.filter((m) => m.status === 'Governed').length;
  const watchCount = mockHealthModules.filter((m) => m.status === 'Watch').length;
  const exposedCount = mockHealthModules.filter((m) => m.status === 'Exposed').length;

  const criticalIssues = mockHealthModules.reduce(
    (sum, mod) => sum + mod.issues.filter((i) => i.severity === 'Critical').length,
    0,
  );

  return (
    <MetaAppShell>
      <div className="px-6 py-8 md:px-12 md:py-12 max-w-[1600px] mx-auto">
        {/* HEADER */}
        <MetaPageHeader
          variant="document"
          code="META_06"
          title="HEALTH SCAN"
          subtitle="BYOS TELEMETRY"
          description="Automated governance health checks across IFRS, Tax, and SOC2 frameworks. Bring Your Own Standards."
        />

        {/* CORE METRICS */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded p-5">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-[#666]" />
              <span className="text-[10px] uppercase tracking-wider text-[#666] font-mono">
                Overall Health
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <div
                className={clsx(
                  'text-3xl font-mono',
                  overallScore >= 75
                    ? 'text-[#28E7A2]'
                    : overallScore >= 60
                      ? 'text-orange-400'
                      : 'text-red-500',
                )}
              >
                {overallScore}
              </div>
              <div className="text-sm text-[#666]">/ 100</div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-[#28E7A2]">
              <TrendingUp className="w-3 h-3" />
              +12% vs Q3
            </div>
          </div>

          <div className="bg-[#0A0A0A] border border-[#28E7A2]/30 rounded p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-[#28E7A2]" />
              <span className="text-[10px] uppercase tracking-wider text-[#28E7A2] font-mono">
                Governed
              </span>
            </div>
            <div className="text-3xl text-[#28E7A2] font-mono">{governedCount}</div>
            <div className="text-xs text-[#666] mt-1">Modules at target</div>
          </div>

          <div className="bg-[#0A0A0A] border border-orange-500/30 rounded p-5">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-orange-400" />
              <span className="text-[10px] uppercase tracking-wider text-orange-400 font-mono">
                Watch
              </span>
            </div>
            <div className="text-3xl text-orange-400 font-mono">{watchCount}</div>
            <div className="text-xs text-[#666] mt-1">Needs attention</div>
          </div>

          <div className="bg-[#0A0A0A] border border-red-500/30 rounded p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-[10px] uppercase tracking-wider text-red-400 font-mono">
                Exposed
              </span>
            </div>
            <div className="text-3xl text-red-500 font-mono">{exposedCount}</div>
            <div className="text-xs text-[#666] mt-1">Critical gaps</div>
          </div>
        </div>

        {/* VISUALIZATION GRID */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-6">
          {/* LEFT: RADAR CHART */}
          <div className="bg-[#050505] border border-[#1F1F1F] rounded overflow-hidden">
            <div className="bg-[#0A0A0A] border-b border-[#1F1F1F] p-4">
              <h2 className="text-white font-medium">Health Radar</h2>
              <div className="text-xs text-[#666] mt-1">Multi-dimensional governance coverage</div>
            </div>
            <div className="p-8">
              <HealthRadar modules={mockHealthModules} />
            </div>
          </div>

          {/* RIGHT: CORE GAUGE */}
          <div className="bg-[#050505] border border-[#1F1F1F] rounded overflow-hidden">
            <div className="bg-[#0A0A0A] border-b border-[#1F1F1F] p-4">
              <h2 className="text-white font-medium">Core Health</h2>
              <div className="text-xs text-[#666] mt-1">Aggregate score</div>
            </div>
            <div className="p-8 flex items-center justify-center">
              <HealthCoreGauge score={overallScore} />
            </div>

            {/* CRITICAL ISSUES ALERT */}
            {criticalIssues > 0 && (
              <div className="p-4 border-t border-[#1F1F1F]">
                <div className="bg-red-500/5 border border-red-500/20 rounded p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm text-white font-medium mb-1">
                        {criticalIssues} Critical Issues
                      </div>
                      <div className="text-xs text-[#888]">
                        Requires immediate attention to prevent compliance failures or financial
                        misstatement.
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
          <h2 className="text-white font-medium mb-4 flex items-center gap-2">
            Module Breakdown
            <span className="text-[10px] font-mono text-[#666] uppercase tracking-wider">
              {mockHealthModules.length} Modules Scanned
            </span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockHealthModules.map((module) => (
              <HealthModuleCard
                key={module.id}
                module={module}
                isSelected={selectedModule === module.id}
                onClick={() => setSelectedModule(selectedModule === module.id ? null : module.id)}
              />
            ))}
          </div>
        </div>

        {/* SCAN INFO */}
        <div className="mt-8 bg-blue-500/5 border border-blue-500/20 rounded p-5">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm text-white font-medium mb-1">How Health Scan Works</div>
              <div className="text-sm text-[#888] space-y-1">
                <p>
                  NexusCanon performs automated daily scans against your own compliance frameworks
                  (IFRS, Tax, SOC2, etc.). Each module is scored across three dimensions:
                </p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>
                    <strong className="text-white">IFRS Compliance:</strong> Revenue recognition,
                    asset classification, disclosure completeness
                  </li>
                  <li>
                    <strong className="text-white">Tax Alignment:</strong> WHT flags, transfer
                    pricing markers, deferred tax logic
                  </li>
                  <li>
                    <strong className="text-white">Control Strength:</strong> Approval workflows,
                    segregation of duties, audit trails
                  </li>
                </ul>
                <p className="mt-2">
                  Issues are automatically linked to Canon records, enabling one-click remediation
                  and propagation across all affected systems.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MetaAppShell>
  );
}
