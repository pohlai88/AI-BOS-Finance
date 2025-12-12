import React from 'react'
import { CanonRecord } from '../../data/mockCanonMatrix'
import {
  ArrowDown,
  Shield,
  Link,
  Layers,
  FileText,
  AlertTriangle,
  Anchor,
  Ban,
  GitCommit,
} from 'lucide-react'

interface CanonDetailPanelProps {
  record: CanonRecord | null
  onClose?: () => void
}

export function CanonDetailPanel({ record, onClose }: CanonDetailPanelProps) {
  if (!record) {
    return (
      <div className="flex h-full flex-col items-center justify-center border-l border-[#1F1F1F] bg-[#050505] p-8 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#333] bg-[#111]">
          <Layers className="h-6 w-6 text-[#666]" />
        </div>
        <h3 className="mb-2 font-mono text-sm uppercase tracking-wider text-[#888]">
          No Canon Selected
        </h3>
        <p className="max-w-[200px] text-xs text-[#666]">
          Select a row from the matrix to view its governance DNA.
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden border-l border-[#1F1F1F] bg-[#050505]">
      {/* Header - Fixed */}
      <div className="border-b border-[#1F1F1F] bg-[#0A0A0A] p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#28E7A2]">
            {record.id}
          </span>
          <div
            className={`rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${record.status === 'ACTIVE' ? 'border-[#28E7A2]/30 bg-[#28E7A2]/10 text-[#28E7A2]' : 'border-[#666] text-[#666]'}`}
          >
            {record.status}
          </div>
        </div>
        <h2 className="mb-2 text-xl font-medium leading-tight text-white">
          {record.name}
        </h2>
        <p className="mt-3 border-l-2 border-[#333] pl-3 text-xs leading-relaxed text-[#888]">
          {record.description}
        </p>
      </div>

      {/* Scrollable Circuit Board Content */}
      <div className="relative flex-1 overflow-y-auto p-0">
        {/* The Golden Thread Line */}
        <div className="absolute bottom-0 left-8 top-0 z-0 w-[1px] bg-[#1F1F1F]" />

        {/* Node 1: Standards (The Source) */}
        <div className="relative z-10 px-8 py-8">
          <div className="absolute left-[31px] top-10 h-2 w-2 rounded-full border border-[#666] bg-[#333]" />
          <div className="pl-8">
            <h4 className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#666]">
              <Shield className="h-3 w-3" /> Policy Source
            </h4>

            <div className="rounded-sm border border-[#1F1F1F] bg-[#0F0F0F] p-4 transition-colors hover:border-[#333]">
              <div className="mb-3">
                <div className="mb-1 text-[10px] uppercase text-[#666]">
                  Primary Standard
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <FileText className="h-3 w-3 text-[#28E7A2]" />
                  {record.primaryStandard}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {record.supportingFrameworks.map((fw, i) => (
                  <span
                    key={i}
                    className="rounded-sm border border-[#333] bg-[#1A1A1A] px-1.5 py-0.5 text-[10px] text-[#BBB]"
                  >
                    {fw}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-[#1F1F1F] pt-3">
                <span className="text-[10px] uppercase text-[#666]">
                  Weight
                </span>
                <span
                  className={`rounded-sm border px-1.5 py-0.5 font-mono text-[10px] uppercase ${record.riskWeight === 'CRITICAL' ? 'border-red-900 bg-red-900/10 text-red-500' : 'border-blue-900 bg-blue-900/10 text-blue-400'}`}
                >
                  {record.riskWeight}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Node 2: Inheritance (The Logic) */}
        <div className="relative z-10 px-8 pb-8">
          <div className="absolute left-[31px] top-2 h-2 w-2 rounded-full bg-[#28E7A2] shadow-[0_0_10px_rgba(40,231,162,0.3)]" />
          <div className="pl-8">
            <h4 className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#28E7A2]">
              <GitCommit className="h-3 w-3" /> Logic Node
            </h4>

            <div className="space-y-1">
              <div
                className={`border-l-2 p-3 ${record.type === 'Group' ? 'border-l-[#28E7A2] bg-[#28E7A2]/5' : 'border-l-[#333] bg-[#0A0A0A] opacity-60'} border-y border-r border-[#1F1F1F] text-xs`}
              >
                <span className="mb-1 block font-mono text-[9px] uppercase text-[#666]">
                  Group
                </span>
                <span className="text-[#EEE]">
                  {record.type === 'Group'
                    ? record.name
                    : record.parentId || 'Parent Group'}
                </span>
              </div>

              <div className="ml-1 h-2 border-l border-dashed border-[#333] pl-2" />

              <div
                className={`border-l-2 p-3 ${record.type === 'Transaction' ? 'border-l-[#28E7A2] bg-[#28E7A2]/5' : 'border-l-[#333] bg-[#0A0A0A] opacity-60'} ml-2 border-y border-r border-[#1F1F1F] text-xs`}
              >
                <span className="mb-1 block font-mono text-[9px] uppercase text-[#666]">
                  Transaction
                </span>
                <span className="text-[#EEE]">
                  {record.type === 'Transaction'
                    ? record.name
                    : record.type === 'Cell'
                      ? record.parentId
                      : 'Child Ledger'}
                </span>
              </div>

              <div className="ml-3 h-2 border-l border-dashed border-[#333] pl-2" />

              <div
                className={`border-l-2 p-3 ${record.type === 'Cell' ? 'border-l-[#28E7A2] bg-[#28E7A2]/5' : 'border-l-[#333] bg-[#0A0A0A] opacity-60'} ml-4 border-y border-r border-[#1F1F1F] text-xs`}
              >
                <span className="mb-1 block font-mono text-[9px] uppercase text-[#666]">
                  Cell
                </span>
                <span className="text-[#EEE]">
                  {record.type === 'Cell' ? record.name : 'Target Field'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Node 3: Binding (The Anchor) */}
        <div className="relative z-10 px-8 pb-12">
          {/* Terminal Point */}
          <div className="absolute left-[29px] top-2 flex h-3 w-3 items-center justify-center border border-[#28E7A2] bg-[#050505]">
            <div className="h-1 w-1 bg-[#28E7A2]" />
          </div>

          <div className="pl-8">
            <h4 className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#666]">
              <Anchor className="h-3 w-3" /> Binding Point
            </h4>

            {record.bindable ? (
              <div className="border border-[#1F1F1F] bg-[#0F0F0F] p-4">
                <div className="mb-4 grid grid-cols-2 gap-4">
                  <div>
                    <div className="mb-1 text-[10px] uppercase text-[#666]">
                      Systems
                    </div>
                    <div className="text-xs text-[#EEE]">
                      {record.usage.systems.length > 0
                        ? record.usage.systems.join(', ')
                        : 'None'}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-[10px] uppercase text-[#666]">
                      GL Accounts
                    </div>
                    <div className="font-mono text-xs text-[#28E7A2]">
                      {record.usage.glAccounts.length > 0
                        ? record.usage.glAccounts.join(', ')
                        : '—'}
                    </div>
                  </div>
                </div>

                {record.usage.riskSignals > 0 && (
                  <div className="flex items-center gap-3 border border-red-900/30 bg-red-900/10 p-2">
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                    <span className="font-mono text-[10px] uppercase text-red-400">
                      {record.usage.riskSignals} Risk Signals Active
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 border border-[#1F1F1F] bg-[#111] p-4 opacity-60">
                <Ban className="h-4 w-4 text-[#666]" />
                <span className="text-xs text-[#666]">
                  Abstract Canon. Not bindable to ledger.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
