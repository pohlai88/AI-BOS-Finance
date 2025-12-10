import React from 'react';
import { HealthModule, HealthIssue } from '../../data/mockHealthScan';
import { ArrowRight, FileText, Shield, AlertCircle, Eye, Activity } from 'lucide-react';

interface HealthDeepDivePanelProps {
  module: HealthModule | null;
}

export function HealthDeepDivePanel({ module }: HealthDeepDivePanelProps) {
  if (!module) return null;

  return (
    <div className="border border-[#1F1F1F] bg-[#0A0A0A] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
      {/* Header Strip */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-[#1F1F1F] bg-[#111]">
        <div className="flex items-center gap-3">
          <Activity className="w-4 h-4 text-[#28E7A2]" />
          <span className="text-xs font-mono text-[#666] uppercase tracking-widest">
            DEEP DIVE SCAN // {module.id}
          </span>
        </div>
        <div className="text-xs text-[#EEE] font-mono">
          Last Scan: <span className="text-[#28E7A2]">10m ago</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[400px]">
        {/* LEFT: Score Breakdown */}
        <div className="col-span-12 lg:col-span-4 p-8 border-b lg:border-b-0 lg:border-r border-[#1F1F1F] bg-[#0F0F0F]">
          <h3 className="text-2xl text-white font-medium mb-2">{module.name}</h3>
          <div className="text-sm text-[#888] mb-8">{module.keyIssue}</div>

          <div className="space-y-6">
            <ScoreBar
              label="IFRS Alignment"
              score={module.subScores.ifrs}
              icon={<FileText className="w-3 h-3" />}
            />
            <ScoreBar
              label="Tax Consistency"
              score={module.subScores.tax}
              icon={<AlertCircle className="w-3 h-3" />}
            />
            <ScoreBar
              label="Control Evidence"
              score={module.subScores.controls}
              icon={<Shield className="w-3 h-3" />}
            />
          </div>

          <div className="mt-12 p-4 border border-[#333] bg-[#0A0A0A] rounded-sm">
            <h4 className="text-[10px] text-[#666] uppercase tracking-widest mb-2">
              Forensic Summary
            </h4>
            <p className="text-xs text-[#BBB] leading-relaxed">
              This module is currently{' '}
              <span className="text-white font-medium">{module.status}</span>. Review the issues on
              the right. Critical findings in IFRS alignment require immediate remediation before
              next audit cycle.
            </p>
          </div>
        </div>

        {/* RIGHT: Issues List */}
        <div className="col-span-12 lg:col-span-8 p-0">
          <div className="flex items-center gap-4 px-8 py-4 border-b border-[#1F1F1F]">
            <span className="text-xs font-mono text-[#666] uppercase tracking-widest">
              Detected Findings ({module.issues.length})
            </span>
          </div>

          <div className="divide-y divide-[#1F1F1F]">
            {module.issues.map((issue) => (
              <IssueRow key={issue.id} issue={issue} />
            ))}
            {module.issues.length === 0 && (
              <div className="p-8 text-center text-[#666] text-sm italic">
                No critical issues detected in this scan.
              </div>
            )}
          </div>

          <div className="p-4 bg-[#0A0A0A] border-t border-[#1F1F1F] flex justify-end">
            <button className="text-xs font-mono text-[#28E7A2] hover:underline flex items-center gap-2">
              VIEW FULL AUDIT LOG <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, score, icon }: { label: string; score: number; icon: React.ReactNode }) {
  const getColor = (s: number) => {
    if (s >= 80) return 'bg-[#28E7A2]';
    if (s >= 60) return 'bg-amber-400';
    return 'bg-red-500';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <div className="flex items-center gap-2 text-xs text-[#CCC] font-medium">
          {icon} {label}
        </div>
        <span className="text-xs font-mono text-[#EEE]">{score}/100</span>
      </div>
      <div className="h-1.5 w-full bg-[#1F1F1F] rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor(score)} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function IssueRow({ issue }: { issue: HealthIssue }) {
  return (
    <div className="p-6 hover:bg-[#111] transition-colors group">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <Badge type={issue.severity} />
          <Badge type={issue.source} outline />
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="p-1.5 border border-[#333] hover:border-[#666] text-[#666] hover:text-[#EEE] rounded-sm"
            title="View in Risk Radar"
          >
            <Activity className="w-3 h-3" />
          </button>
          <button
            className="p-1.5 border border-[#333] hover:border-[#666] text-[#666] hover:text-[#EEE] rounded-sm"
            title="View Canon"
          >
            <Eye className="w-3 h-3" />
          </button>
        </div>
      </div>

      <h4 className="text-sm text-[#EEE] font-medium mb-1">{issue.summary}</h4>

      <div className="flex items-center gap-2 text-xs">
        <span className="text-[#666]">Impact:</span>
        <span className="text-[#888] font-mono">{issue.impact}</span>
      </div>

      {issue.canonId && (
        <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-1 bg-[#0A0A0A] border border-[#1F1F1F] rounded-sm">
          <span className="w-1 h-1 bg-[#28E7A2] rounded-full" />
          <span className="text-[10px] font-mono text-[#666]">Canon: {issue.canonId}</span>
        </div>
      )}
    </div>
  );
}

function Badge({ type, outline = false }: { type: string; outline?: boolean }) {
  let colors = '';

  if (outline) {
    // Source styles (IFRS, Tax, etc)
    colors = 'border border-[#333] text-[#888]';
    if (type === 'IFRS') colors = 'border-[#28E7A2]/30 text-[#28E7A2]';
    if (type === 'Tax') colors = 'border-amber-400/30 text-amber-400';
    if (type === 'SOC2') colors = 'border-blue-400/30 text-blue-400';
  } else {
    // Severity styles
    if (type === 'Critical') colors = 'bg-red-900/20 text-red-500 border border-red-900/30';
    if (type === 'Major') colors = 'bg-amber-900/20 text-amber-500 border border-amber-900/30';
    if (type === 'Minor') colors = 'bg-[#1F1F1F] text-[#888] border border-[#333]';
  }

  return (
    <span
      className={`px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider rounded-sm ${colors}`}
    >
      {type}
    </span>
  );
}
