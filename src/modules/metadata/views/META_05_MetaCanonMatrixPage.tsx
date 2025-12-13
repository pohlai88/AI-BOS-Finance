import { useState } from 'react'
import { MetaAppShell } from '../components/shell/MetaAppShell'
import { MetaPageHeader } from '../components/MetaPageHeader'
import { mockCanonRecords } from '../mock-data'/mockCanonMatrix'
import { CanonDetailPanel } from '../components/metadata/CanonDetailPanel'
import { CanonRecord } from '../mock-data'/mockCanonMatrix'
import {
  Database,
  Layers,
  FileText,
  ChevronRight,
  Shield,
  AlertTriangle,
} from 'lucide-react'
import clsx from 'clsx'

export function MetaCanonMatrixPage() {
  const [selectedRecord, setSelectedRecord] = useState<CanonRecord | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  // Organize records by hierarchy
  const groupRecords = mockCanonRecords.filter((r) => r.type === 'Group')
  const transactionRecords = mockCanonRecords.filter(
    (r) => r.type === 'Transaction'
  )
  const cellRecords = mockCanonRecords.filter((r) => r.type === 'Cell')

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
  }

  return (
    <MetaAppShell>
      <div className="mx-auto max-w-[1600px] px-6 py-8 md:px-12 md:py-12">
        {/* HEADER */}
        <MetaPageHeader
          variant="document"
          code="META_05"
          title="CANON MATRIX"
          subtitle="GOVERNANCE DNA"
          description="The three-layer inheritance hierarchy that maintains truth across your financial organism."
        />

        {/* STATISTICS */}
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded border border-[#1F1F1F] bg-[#0A0A0A] p-4">
            <div className="mb-2 flex items-center gap-2">
              <Database className="h-4 w-4 text-[#28E7A2]" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
                Groups
              </span>
            </div>
            <div className="font-mono text-2xl text-[#28E7A2]">
              {groupRecords.length}
            </div>
          </div>

          <div className="rounded border border-[#1F1F1F] bg-[#0A0A0A] p-4">
            <div className="mb-2 flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-400" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
                Transactions
              </span>
            </div>
            <div className="font-mono text-2xl text-blue-400">
              {transactionRecords.length}
            </div>
          </div>

          <div className="rounded border border-[#1F1F1F] bg-[#0A0A0A] p-4">
            <div className="mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-400" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
                Cells
              </span>
            </div>
            <div className="font-mono text-2xl text-purple-400">
              {cellRecords.length}
            </div>
          </div>

          <div className="rounded border border-[#1F1F1F] bg-[#0A0A0A] p-4">
            <div className="mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#666]" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
                Total
              </span>
            </div>
            <div className="font-mono text-2xl text-white">
              {mockCanonRecords.length}
            </div>
          </div>
        </div>

        {/* MATRIX LAYOUT */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr,400px]">
          {/* LEFT: HIERARCHY TREE */}
          <div className="overflow-hidden rounded border border-[#1F1F1F] bg-[#050505]">
            <div className="border-b border-[#1F1F1F] bg-[#0A0A0A] p-4">
              <h2 className="flex items-center gap-2 font-medium text-white">
                <Layers className="h-5 w-5 text-[#666]" />
                Canon Hierarchy
              </h2>
            </div>

            <div className="space-y-1 p-4">
              {groupRecords.map((group) => {
                const isExpanded = expandedGroups.has(group.id)
                const children = transactionRecords.filter(
                  (t) => t.parentId === group.id
                )

                return (
                  <div key={group.id}>
                    {/* GROUP ROW */}
                    <div
                      className={clsx(
                        'flex cursor-pointer items-center gap-3 rounded border p-3 transition-all',
                        selectedRecord?.id === group.id
                          ? 'border-[#28E7A2] bg-[#28E7A2]/10'
                          : 'border-[#1F1F1F] bg-[#0A0A0A] hover:border-[#333]'
                      )}
                      onClick={() => setSelectedRecord(group)}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleGroup(group.id)
                        }}
                        className="rounded p-1 transition-colors hover:bg-[#111]"
                      >
                        <ChevronRight
                          className={clsx(
                            'h-4 w-4 text-[#666] transition-transform',
                            isExpanded && 'rotate-90'
                          )}
                        />
                      </button>

                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded border border-[#28E7A2]/30 bg-[#28E7A2]/10">
                        <Database className="h-4 w-4 text-[#28E7A2]" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-white">
                            {group.name}
                          </div>
                          <span className="font-mono text-[10px] text-[#666]">
                            {group.id}
                          </span>
                          {group.riskWeight === 'CRITICAL' && (
                            <AlertTriangle className="h-3 w-3 text-red-500" />
                          )}
                        </div>
                        <div className="text-xs text-[#666]">
                          {group.domain}
                        </div>
                      </div>

                      <div
                        className={clsx(
                          'rounded border px-2 py-0.5 font-mono text-[10px] uppercase',
                          group.status === 'ACTIVE' &&
                            'border-[#28E7A2]/30 bg-[#28E7A2]/10 text-[#28E7A2]',
                          group.status === 'DRAFT' &&
                            'border-orange-500/30 bg-orange-500/10 text-orange-400'
                        )}
                      >
                        {group.status}
                      </div>
                    </div>

                    {/* TRANSACTION CHILDREN */}
                    {isExpanded && children.length > 0 && (
                      <div className="ml-8 mt-1 space-y-1">
                        {children.map((transaction) => {
                          const cells = cellRecords.filter(
                            (c) => c.parentId === transaction.id
                          )

                          return (
                            <div key={transaction.id}>
                              {/* TRANSACTION ROW */}
                              <div
                                className={clsx(
                                  'flex cursor-pointer items-center gap-3 rounded border p-3 transition-all',
                                  selectedRecord?.id === transaction.id
                                    ? 'border-blue-500 bg-blue-500/10'
                                    : 'border-[#1F1F1F] bg-[#0A0A0A] hover:border-[#333]'
                                )}
                                onClick={() => setSelectedRecord(transaction)}
                              >
                                <div className="h-8 w-1 bg-[#28E7A2]/30" />

                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded border border-blue-500/30 bg-blue-500/10">
                                  <Layers className="h-4 w-4 text-blue-400" />
                                </div>

                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <div className="text-sm font-medium text-white">
                                      {transaction.name}
                                    </div>
                                    <span className="font-mono text-[10px] text-[#666]">
                                      {transaction.id}
                                    </span>
                                  </div>
                                  <div className="text-xs text-[#666]">
                                    {transaction.linkedItems}
                                  </div>
                                </div>
                              </div>

                              {/* CELL CHILDREN */}
                              {cells.length > 0 && (
                                <div className="ml-8 mt-1 space-y-1">
                                  {cells.map((cell) => (
                                    <div
                                      key={cell.id}
                                      className={clsx(
                                        'flex cursor-pointer items-center gap-3 rounded border p-3 transition-all',
                                        selectedRecord?.id === cell.id
                                          ? 'border-purple-500 bg-purple-500/10'
                                          : 'border-[#1F1F1F] bg-[#0A0A0A] hover:border-[#333]'
                                      )}
                                      onClick={() => setSelectedRecord(cell)}
                                    >
                                      <div className="h-8 w-1 bg-blue-500/30" />

                                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded border border-purple-500/30 bg-purple-500/10">
                                        <FileText className="h-4 w-4 text-purple-400" />
                                      </div>

                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <div className="text-sm font-medium text-white">
                                            {cell.name}
                                          </div>
                                          <span className="font-mono text-[10px] text-[#666]">
                                            {cell.id}
                                          </span>
                                        </div>
                                        <div className="text-xs text-[#666]">
                                          {cell.bindable
                                            ? 'Bindable to systems'
                                            : 'Abstract definition'}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* RIGHT: DETAIL PANEL */}
          <div className="overflow-hidden rounded border border-[#1F1F1F] bg-[#050505]">
            <CanonDetailPanel record={selectedRecord} />
          </div>
        </div>

        {/* EXPLANATION */}
        <div className="mt-8 rounded border border-[#1F1F1F] bg-[#0A0A0A] p-6">
          <h3 className="mb-3 font-medium text-white">
            How the Canon Matrix Works
          </h3>
          <div className="space-y-2 text-sm text-[#888]">
            <p>
              <strong className="text-[#28E7A2]">Groups</strong> define the
              highest-level governance policies (e.g., &quot;Revenue Recognition
              per IFRS 15&quot;). They are abstract and non-bindable.
            </p>
            <p>
              <strong className="text-blue-400">Transactions</strong> inherit
              from Groups and apply the logic to specific ledgers (e.g.,
              &quot;Annual Contract Revenue&quot;). They add
              transaction-specific rules.
            </p>
            <p>
              <strong className="text-purple-400">Cells</strong> inherit from
              Transactions and define individual fields that can be bound to
              real systems (e.g., &quot;Revenue Amount must be
              DECIMAL(18,2)&quot;).
            </p>
          </div>
        </div>
      </div>
    </MetaAppShell>
  )
}
