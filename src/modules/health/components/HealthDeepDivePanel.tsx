import React from 'react'
import { HealthModule, HealthIssue } from '../../mock-data'/mockHealthScan'
import {
  ArrowRight,
  FileText,
  Shield,
  AlertCircle,
  Eye,
  Activity,
} from 'lucide-react'

interface HealthDeepDivePanelProps {
  module: HealthModule | null
}

export function HealthDeepDivePanel({ module }: HealthDeepDivePanelProps) {
  if (!module) return null

  return (
    <div className="overflow-hidden border border-[#1F1F1F] bg-[#0A0A0A] duration-300 animate-in fade-in slide-in-from-top-4">
      {/* Header Strip */}
      <div className="flex items-center justify-between border-b border-[#1F1F1F] bg-[#111] px-8 py-4">
        <div className="flex items-center gap-3">
          <Activity className="h-4 w-4 text-[#28E7A2]" />
          <span className="font-mono text-xs uppercase tracking-widest text-[#666]">
            DEEP DIVE SCAN // {module.id}
          </span>
        </div>
        <div className="font-mono text-xs text-[#EEE]">
          Last Scan: <span className="text-[#28E7A2]">10m ago</span>
        </div>
      </div>

      <div className="grid min-h-[400px] grid-cols-1 lg:grid-cols-12">
        {/* LEFT: Score Breakdown */}
        <div className="col-span-12 border-b border-[#1F1F1F] bg-[#0F0F0F] p-8 lg:col-span-4 lg:border-b-0 lg:border-r">
          <h3 className="mb-2 text-2xl font-medium text-white">
            {module.name}
          </h3>
          <div className="mb-8 text-sm text-[#888]">{module.keyIssue}</div>

          <div className="space-y-6">
            <ScoreBar
              label="IFRS Alignment"
              score={module.subScores.ifrs}
              icon={<FileText className="h-3 w-3" />}
            />
            <ScoreBar
              label="Tax Consistency"
              score={module.subScores.tax}
              icon={<AlertCircle className="h-3 w-3" />}
            />
            <ScoreBar
              label="Control Evidence"
              score={module.subScores.controls}
              icon={<Shield className="h-3 w-3" />}
            />
          </div>

          <div className="mt-12 rounded-sm border border-[#333] bg-[#0A0A0A] p-4">
            <h4 className="mb-2 text-[10px] uppercase tracking-widest text-[#666]">
              Forensic Summary
            </h4>
            <p className="text-xs leading-relaxed text-[#BBB]">
              This module is currently{' '}
              <span className="font-medium text-white">{module.status}</span>.
              Review the issues on the right. Critical findings in IFRS
              alignment require immediate remediation before next audit cycle.
            </p>
          </div>
        </div>

        {/* RIGHT: Issues List */}
        <div className="col-span-12 p-0 lg:col-span-8">
          <div className="flex items-center gap-4 border-b border-[#1F1F1F] px-8 py-4">
            <span className="font-mono text-xs uppercase tracking-widest text-[#666]">
              Detected Findings ({module.issues.length})
            </span>
          </div>

          <div className="divide-y divide-[#1F1F1F]">
            {module.issues.map((issue) => (
              <IssueRow key={issue.id} issue={issue} />
            ))}
            {module.issues.length === 0 && (
              <div className="p-8 text-center text-sm italic text-[#666]">
                No critical issues detected in this scan.
              </div>
            )}
          </div>

          <div className="flex justify-end border-t border-[#1F1F1F] bg-[#0A0A0A] p-4">
            <button className="flex items-center gap-2 font-mono text-xs text-[#28E7A2] hover:underline">
              VIEW FULL AUDIT LOG <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ScoreBar({
  label,
  score,
  icon,
}: {
  label: string
  score: number
  icon: React.ReactNode
}) {
  const getColor = (s: number) => {
    if (s >= 80) return 'bg-[#28E7A2]'
    if (s >= 60) return 'bg-amber-400'
    return 'bg-red-500'
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-[#CCC]">
          {icon} {label}
        </div>
        <span className="font-mono text-xs text-[#EEE]">{score}/100</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1F1F1F]">
        <div
          className={`h-full ${getColor(score)} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

function IssueRow({ issue }: { issue: HealthIssue }) {
  return (
    <div className="group p-6 transition-colors hover:bg-[#111]">
      <div className="mb-2 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Badge type={issue.severity} />
          <Badge type={issue.source} outline />
        </div>
        <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            className="rounded-sm border border-[#333] p-1.5 text-[#666] hover:border-[#666] hover:text-[#EEE]"
            title="View in Risk Radar"
          >
            <Activity className="h-3 w-3" />
          </button>
          <button
            className="rounded-sm border border-[#333] p-1.5 text-[#666] hover:border-[#666] hover:text-[#EEE]"
            title="View Canon"
          >
            <Eye className="h-3 w-3" />
          </button>
        </div>
      </div>

      <h4 className="mb-1 text-sm font-medium text-[#EEE]">{issue.summary}</h4>

      <div className="flex items-center gap-2 text-xs">
        <span className="text-[#666]">Impact:</span>
        <span className="font-mono text-[#888]">{issue.impact}</span>
      </div>

      {issue.canonId && (
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-sm border border-[#1F1F1F] bg-[#0A0A0A] px-2 py-1">
          <span className="h-1 w-1 rounded-full bg-[#28E7A2]" />
          <span className="font-mono text-[10px] text-[#666]">
            Canon: {issue.canonId}
          </span>
        </div>
      )}
    </div>
  )
}

function Badge({ type, outline = false }: { type: string; outline?: boolean }) {
  let colors = ''

  if (outline) {
    // Source styles (IFRS, Tax, etc)
    colors = 'border border-[#333] text-[#888]'
    if (type === 'IFRS') colors = 'border-[#28E7A2]/30 text-[#28E7A2]'
    if (type === 'Tax') colors = 'border-amber-400/30 text-amber-400'
    if (type === 'SOC2') colors = 'border-blue-400/30 text-blue-400'
  } else {
    // Severity styles
    if (type === 'Critical')
      colors = 'bg-red-900/20 text-red-500 border border-red-900/30'
    if (type === 'Major')
      colors = 'bg-amber-900/20 text-amber-500 border border-amber-900/30'
    if (type === 'Minor')
      colors = 'bg-[#1F1F1F] text-[#888] border border-[#333]'
  }

  return (
    <span
      className={`rounded-sm px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${colors}`}
    >
      {type}
    </span>
  )
}
