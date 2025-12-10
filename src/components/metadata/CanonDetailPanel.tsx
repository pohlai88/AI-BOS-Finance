import React from 'react';
import { CanonRecord } from '../../data/mockCanonMatrix';
import { ArrowDown, Shield, Link, Layers, FileText, AlertTriangle, Anchor, Ban, GitCommit } from 'lucide-react';

interface CanonDetailPanelProps {
  record: CanonRecord | null;
  onClose?: () => void;
}

export function CanonDetailPanel({ record, onClose }: CanonDetailPanelProps) {
  if (!record) {
    return (
      <div className="h-full border-l border-[#1F1F1F] bg-[#050505] p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-[#111] border border-[#333] flex items-center justify-center mb-4">
          <Layers className="w-6 h-6 text-[#666]" />
        </div>
        <h3 className="text-[#888] font-mono text-sm uppercase tracking-wider mb-2">No Canon Selected</h3>
        <p className="text-[#666] text-xs max-w-[200px]">Select a row from the matrix to view its governance DNA.</p>
      </div>
    );
  }

  return (
    <div className="h-full border-l border-[#1F1F1F] bg-[#050505] flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <div className="p-6 border-b border-[#1F1F1F] bg-[#0A0A0A]">
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-[10px] text-[#28E7A2] uppercase tracking-widest">{record.id}</span>
          <div className={`px-2 py-0.5 border text-[10px] font-mono uppercase tracking-wider rounded-sm
            ${record.status === 'ACTIVE' ? 'border-[#28E7A2]/30 bg-[#28E7A2]/10 text-[#28E7A2]' : 'border-[#666] text-[#666]'}`}>
            {record.status}
          </div>
        </div>
        <h2 className="text-xl text-white font-medium leading-tight mb-2">{record.name}</h2>
        <p className="text-[#888] text-xs leading-relaxed border-l-2 border-[#333] pl-3 mt-3">
          {record.description}
        </p>
      </div>

      {/* Scrollable Circuit Board Content */}
      <div className="flex-1 overflow-y-auto p-0 relative">
        {/* The Golden Thread Line */}
        <div className="absolute left-8 top-0 bottom-0 w-[1px] bg-[#1F1F1F] z-0" />

        {/* Node 1: Standards (The Source) */}
        <div className="relative z-10 px-8 py-8">
          <div className="absolute left-[31px] top-10 w-2 h-2 rounded-full bg-[#333] border border-[#666]" />
          <div className="pl-8">
            <h4 className="font-mono text-[10px] text-[#666] uppercase tracking-widest mb-3 flex items-center gap-2">
              <Shield className="w-3 h-3" /> Policy Source
            </h4>
            
            <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-sm p-4 hover:border-[#333] transition-colors">
              <div className="mb-3">
                <div className="text-[10px] text-[#666] uppercase mb-1">Primary Standard</div>
                <div className="text-sm text-white font-medium flex items-center gap-2">
                  <FileText className="w-3 h-3 text-[#28E7A2]" />
                  {record.primaryStandard}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {record.supportingFrameworks.map((fw, i) => (
                  <span key={i} className="px-1.5 py-0.5 bg-[#1A1A1A] border border-[#333] text-[10px] text-[#BBB] rounded-sm">
                    {fw}
                  </span>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-[#1F1F1F] flex items-center justify-between">
                 <span className="text-[10px] text-[#666] uppercase">Weight</span>
                 <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-sm border 
                  ${record.riskWeight === 'CRITICAL' ? 'border-red-900 bg-red-900/10 text-red-500' : 'border-blue-900 bg-blue-900/10 text-blue-400'}`}>
                  {record.riskWeight}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Node 2: Inheritance (The Logic) */}
        <div className="relative z-10 px-8 pb-8">
          <div className="absolute left-[31px] top-2 w-2 h-2 rounded-full bg-[#28E7A2] shadow-[0_0_10px_rgba(40,231,162,0.3)]" />
          <div className="pl-8">
            <h4 className="font-mono text-[10px] text-[#28E7A2] uppercase tracking-widest mb-3 flex items-center gap-2">
              <GitCommit className="w-3 h-3" /> Logic Node
            </h4>

            <div className="space-y-1">
              <div className={`p-3 border-l-2 ${record.type === 'Group' ? 'border-l-[#28E7A2] bg-[#28E7A2]/5' : 'border-l-[#333] bg-[#0A0A0A] opacity-60'} border-y border-r border-[#1F1F1F] text-xs`}>
                <span className="font-mono text-[9px] text-[#666] uppercase block mb-1">Group</span>
                <span className="text-[#EEE]">{record.type === 'Group' ? record.name : (record.parentId || 'Parent Group')}</span>
              </div>
              
              <div className="ml-1 pl-2 border-l border-[#333] border-dashed h-2" />

              <div className={`p-3 border-l-2 ${record.type === 'Transaction' ? 'border-l-[#28E7A2] bg-[#28E7A2]/5' : 'border-l-[#333] bg-[#0A0A0A] opacity-60'} border-y border-r border-[#1F1F1F] text-xs ml-2`}>
                <span className="font-mono text-[9px] text-[#666] uppercase block mb-1">Transaction</span>
                <span className="text-[#EEE]">{record.type === 'Transaction' ? record.name : (record.type === 'Cell' ? record.parentId : 'Child Ledger')}</span>
              </div>

              <div className="ml-3 pl-2 border-l border-[#333] border-dashed h-2" />

              <div className={`p-3 border-l-2 ${record.type === 'Cell' ? 'border-l-[#28E7A2] bg-[#28E7A2]/5' : 'border-l-[#333] bg-[#0A0A0A] opacity-60'} border-y border-r border-[#1F1F1F] text-xs ml-4`}>
                 <span className="font-mono text-[9px] text-[#666] uppercase block mb-1">Cell</span>
                 <span className="text-[#EEE]">{record.type === 'Cell' ? record.name : 'Target Field'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Node 3: Binding (The Anchor) */}
        <div className="relative z-10 px-8 pb-12">
          {/* Terminal Point */}
          <div className="absolute left-[29px] top-2 w-3 h-3 border border-[#28E7A2] bg-[#050505] flex items-center justify-center">
            <div className="w-1 h-1 bg-[#28E7A2]" />
          </div>

          <div className="pl-8">
            <h4 className="font-mono text-[10px] text-[#666] uppercase tracking-widest mb-3 flex items-center gap-2">
              <Anchor className="w-3 h-3" /> Binding Point
            </h4>

            {record.bindable ? (
              <div className="bg-[#0F0F0F] border border-[#1F1F1F] p-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-[10px] text-[#666] uppercase mb-1">Systems</div>
                    <div className="text-xs text-[#EEE]">{record.usage.systems.length > 0 ? record.usage.systems.join(', ') : 'None'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#666] uppercase mb-1">GL Accounts</div>
                    <div className="text-xs text-[#28E7A2] font-mono">{record.usage.glAccounts.length > 0 ? record.usage.glAccounts.join(', ') : '—'}</div>
                  </div>
                </div>
                
                {record.usage.riskSignals > 0 && (
                   <div className="p-2 bg-red-900/10 border border-red-900/30 flex items-center gap-3">
                    <AlertTriangle className="w-3 h-3 text-red-500" />
                    <span className="text-[10px] text-red-400 font-mono uppercase">{record.usage.riskSignals} Risk Signals Active</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-[#1F1F1F] bg-[#111] p-4 flex items-center gap-3 opacity-60">
                <Ban className="w-4 h-4 text-[#666]" />
                <span className="text-xs text-[#666]">Abstract Canon. Not bindable to ledger.</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
