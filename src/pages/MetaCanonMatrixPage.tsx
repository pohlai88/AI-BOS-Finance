import { useState } from 'react';
import { MetaAppShell } from '../components/shell/MetaAppShell';
import { MetaPageHeader } from '../components/MetaPageHeader';
import { mockCanonRecords } from '../data/mockCanonMatrix';
import { CanonDetailPanel } from '../components/metadata/CanonDetailPanel';
import { CanonRecord } from '../data/mockCanonMatrix';
import { Database, Layers, FileText, ChevronRight, Shield, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

export function MetaCanonMatrixPage() {
  const [selectedRecord, setSelectedRecord] = useState<CanonRecord | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Organize records by hierarchy
  const groupRecords = mockCanonRecords.filter((r) => r.type === 'Group');
  const transactionRecords = mockCanonRecords.filter((r) => r.type === 'Transaction');
  const cellRecords = mockCanonRecords.filter((r) => r.type === 'Cell');

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  return (
    <MetaAppShell>
      <div className="px-6 py-8 md:px-12 md:py-12 max-w-[1600px] mx-auto">
        {/* HEADER */}
        <MetaPageHeader
          variant="document"
          code="META_05"
          title="CANON MATRIX"
          subtitle="GOVERNANCE DNA"
          description="The three-layer inheritance hierarchy that maintains truth across your financial organism."
        />

        {/* STATISTICS */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-[#28E7A2]" />
              <span className="text-[10px] uppercase tracking-wider text-[#666] font-mono">Groups</span>
            </div>
            <div className="text-2xl text-[#28E7A2] font-mono">{groupRecords.length}</div>
          </div>

          <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span className="text-[10px] uppercase tracking-wider text-[#666] font-mono">Transactions</span>
            </div>
            <div className="text-2xl text-blue-400 font-mono">{transactionRecords.length}</div>
          </div>

          <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-purple-400" />
              <span className="text-[10px] uppercase tracking-wider text-[#666] font-mono">Cells</span>
            </div>
            <div className="text-2xl text-purple-400 font-mono">{cellRecords.length}</div>
          </div>

          <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-[#666]" />
              <span className="text-[10px] uppercase tracking-wider text-[#666] font-mono">Total</span>
            </div>
            <div className="text-2xl text-white font-mono">{mockCanonRecords.length}</div>
          </div>
        </div>

        {/* MATRIX LAYOUT */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-6">
          {/* LEFT: HIERARCHY TREE */}
          <div className="bg-[#050505] border border-[#1F1F1F] rounded overflow-hidden">
            <div className="bg-[#0A0A0A] border-b border-[#1F1F1F] p-4">
              <h2 className="text-white font-medium flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#666]" />
                Canon Hierarchy
              </h2>
            </div>

            <div className="p-4 space-y-1">
              {groupRecords.map((group) => {
                const isExpanded = expandedGroups.has(group.id);
                const children = transactionRecords.filter((t) => t.parentId === group.id);

                return (
                  <div key={group.id}>
                    {/* GROUP ROW */}
                    <div
                      className={clsx(
                        'flex items-center gap-3 p-3 rounded cursor-pointer transition-all border',
                        selectedRecord?.id === group.id
                          ? 'bg-[#28E7A2]/10 border-[#28E7A2]'
                          : 'bg-[#0A0A0A] border-[#1F1F1F] hover:border-[#333]'
                      )}
                      onClick={() => setSelectedRecord(group)}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleGroup(group.id);
                        }}
                        className="p-1 hover:bg-[#111] rounded transition-colors"
                      >
                        <ChevronRight
                          className={clsx('w-4 h-4 text-[#666] transition-transform', isExpanded && 'rotate-90')}
                        />
                      </button>

                      <div className="w-8 h-8 rounded bg-[#28E7A2]/10 border border-[#28E7A2]/30 flex items-center justify-center flex-shrink-0">
                        <Database className="w-4 h-4 text-[#28E7A2]" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="text-white text-sm font-medium">{group.name}</div>
                          <span className="text-[10px] font-mono text-[#666]">{group.id}</span>
                          {group.riskWeight === 'CRITICAL' && (
                            <AlertTriangle className="w-3 h-3 text-red-500" />
                          )}
                        </div>
                        <div className="text-xs text-[#666]">{group.domain}</div>
                      </div>

                      <div
                        className={clsx(
                          'px-2 py-0.5 border text-[10px] font-mono uppercase rounded',
                          group.status === 'ACTIVE' && 'border-[#28E7A2]/30 bg-[#28E7A2]/10 text-[#28E7A2]',
                          group.status === 'DRAFT' && 'border-orange-500/30 bg-orange-500/10 text-orange-400'
                        )}
                      >
                        {group.status}
                      </div>
                    </div>

                    {/* TRANSACTION CHILDREN */}
                    {isExpanded && children.length > 0 && (
                      <div className="ml-8 mt-1 space-y-1">
                        {children.map((transaction) => {
                          const cells = cellRecords.filter((c) => c.parentId === transaction.id);

                          return (
                            <div key={transaction.id}>
                              {/* TRANSACTION ROW */}
                              <div
                                className={clsx(
                                  'flex items-center gap-3 p-3 rounded cursor-pointer transition-all border',
                                  selectedRecord?.id === transaction.id
                                    ? 'bg-blue-500/10 border-blue-500'
                                    : 'bg-[#0A0A0A] border-[#1F1F1F] hover:border-[#333]'
                                )}
                                onClick={() => setSelectedRecord(transaction)}
                              >
                                <div className="w-1 h-8 bg-[#28E7A2]/30" />

                                <div className="w-8 h-8 rounded bg-blue-500/10 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                                  <Layers className="w-4 h-4 text-blue-400" />
                                </div>

                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <div className="text-white text-sm font-medium">{transaction.name}</div>
                                    <span className="text-[10px] font-mono text-[#666]">{transaction.id}</span>
                                  </div>
                                  <div className="text-xs text-[#666]">{transaction.linkedItems}</div>
                                </div>
                              </div>

                              {/* CELL CHILDREN */}
                              {cells.length > 0 && (
                                <div className="ml-8 mt-1 space-y-1">
                                  {cells.map((cell) => (
                                    <div
                                      key={cell.id}
                                      className={clsx(
                                        'flex items-center gap-3 p-3 rounded cursor-pointer transition-all border',
                                        selectedRecord?.id === cell.id
                                          ? 'bg-purple-500/10 border-purple-500'
                                          : 'bg-[#0A0A0A] border-[#1F1F1F] hover:border-[#333]'
                                      )}
                                      onClick={() => setSelectedRecord(cell)}
                                    >
                                      <div className="w-1 h-8 bg-blue-500/30" />

                                      <div className="w-8 h-8 rounded bg-purple-500/10 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                                        <FileText className="w-4 h-4 text-purple-400" />
                                      </div>

                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <div className="text-white text-sm font-medium">{cell.name}</div>
                                          <span className="text-[10px] font-mono text-[#666]">{cell.id}</span>
                                        </div>
                                        <div className="text-xs text-[#666]">
                                          {cell.bindable ? 'Bindable to systems' : 'Abstract definition'}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: DETAIL PANEL */}
          <div className="bg-[#050505] border border-[#1F1F1F] rounded overflow-hidden">
            <CanonDetailPanel record={selectedRecord} />
          </div>
        </div>

        {/* EXPLANATION */}
        <div className="mt-8 bg-[#0A0A0A] border border-[#1F1F1F] rounded p-6">
          <h3 className="text-white font-medium mb-3">How the Canon Matrix Works</h3>
          <div className="space-y-2 text-sm text-[#888]">
            <p>
              <strong className="text-[#28E7A2]">Groups</strong> define the highest-level governance policies (e.g.,
              &quot;Revenue Recognition per IFRS 15&quot;). They are abstract and non-bindable.
            </p>
            <p>
              <strong className="text-blue-400">Transactions</strong> inherit from Groups and apply the logic to
              specific ledgers (e.g., &quot;Annual Contract Revenue&quot;). They add transaction-specific rules.
            </p>
            <p>
              <strong className="text-purple-400">Cells</strong> inherit from Transactions and define individual fields
              that can be bound to real systems (e.g., &quot;Revenue Amount must be DECIMAL(18,2)&quot;).
            </p>
          </div>
        </div>
      </div>
    </MetaAppShell>
  );
}
