import { useState } from 'react'
import { MetaAppShell } from '../components/shell/MetaAppShell'
import { MetaPageHeader } from '../components/MetaPageHeader'
import { PageAuditTrail, PageAuditData } from '../components/PageAuditTrail'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import {
  FolderTree,
  ChevronRight,
  ChevronDown,
  Plus,
  Lock,
  MoreHorizontal,
  Search,
  Filter,
  Download,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

// ============================================================================
// CORE_01 - MASTER CHART OF ACCOUNTS
// The skeletal structure of financial truth.
// ============================================================================

// --- TYPES ---
type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'
type AccountStatus = 'ACTIVE' | 'ARCHIVED' | 'SYSTEM_LOCKED'

interface AccountNode {
  id: string
  code: string
  name: string
  type: AccountType
  level: number
  status: AccountStatus
  balance?: string
  children?: AccountNode[]
  expanded?: boolean
}

// --- MOCK DATA (Forensic Standard) ---
const INITIAL_COA: AccountNode[] = [
  {
    id: '1000',
    code: '1000',
    name: 'ASSETS',
    type: 'ASSET',
    level: 0,
    status: 'SYSTEM_LOCKED',
    expanded: true,
    children: [
      {
        id: '1100',
        code: '1100',
        name: 'Current Assets',
        type: 'ASSET',
        level: 1,
        status: 'SYSTEM_LOCKED',
        expanded: true,
        children: [
          {
            id: '1110',
            code: '1110',
            name: 'Cash & Equivalents',
            type: 'ASSET',
            level: 2,
            status: 'ACTIVE',
            balance: '$1,240,500.00',
          },
          {
            id: '1120',
            code: '1120',
            name: 'Accounts Receivable',
            type: 'ASSET',
            level: 2,
            status: 'ACTIVE',
            balance: '$342,100.00',
          },
          {
            id: '1130',
            code: '1130',
            name: 'Inventory',
            type: 'ASSET',
            level: 2,
            status: 'ACTIVE',
            balance: '$0.00',
          },
        ],
      },
      {
        id: '1200',
        code: '1200',
        name: 'Non-Current Assets',
        type: 'ASSET',
        level: 1,
        status: 'SYSTEM_LOCKED',
        expanded: false,
        children: [
          {
            id: '1210',
            code: '1210',
            name: 'Property, Plant & Equipment',
            type: 'ASSET',
            level: 2,
            status: 'ACTIVE',
            balance: '$4,500,000.00',
          },
          {
            id: '1220',
            code: '1220',
            name: 'Intangible Assets',
            type: 'ASSET',
            level: 2,
            status: 'ACTIVE',
            balance: '$150,000.00',
          },
        ],
      },
    ],
  },
  {
    id: '2000',
    code: '2000',
    name: 'LIABILITIES',
    type: 'LIABILITY',
    level: 0,
    status: 'SYSTEM_LOCKED',
    expanded: false,
    children: [
      {
        id: '2100',
        code: '2100',
        name: 'Current Liabilities',
        type: 'LIABILITY',
        level: 1,
        status: 'SYSTEM_LOCKED',
        children: [
          {
            id: '2110',
            code: '2110',
            name: 'Accounts Payable',
            type: 'LIABILITY',
            level: 2,
            status: 'ACTIVE',
            balance: '$120,400.00',
          },
        ],
      },
    ],
  },
  {
    id: '3000',
    code: '3000',
    name: 'EQUITY',
    type: 'EQUITY',
    level: 0,
    status: 'SYSTEM_LOCKED',
    expanded: false,
    children: [],
  },
  {
    id: '4000',
    code: '4000',
    name: 'REVENUE',
    type: 'REVENUE',
    level: 0,
    status: 'SYSTEM_LOCKED',
    expanded: false,
    children: [],
  },
  {
    id: '5000',
    code: '5000',
    name: 'EXPENSES',
    type: 'EXPENSE',
    level: 0,
    status: 'SYSTEM_LOCKED',
    expanded: false,
    children: [],
  },
]

// --- COMPONENTS ---

const TypeBadge = ({ type }: { type: AccountType }) => {
  const styles = {
    ASSET: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    LIABILITY: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    EQUITY: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    REVENUE: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    EXPENSE: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
  }

  return (
    <span
      className={`rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${styles[type]}`}
    >
      {type}
    </span>
  )
}

const AccountRow = ({
  node,
  level,
  onToggle,
}: {
  node: AccountNode
  level: number
  onToggle: (id: string) => void
}) => {
  const hasChildren = node.children && node.children.length > 0
  const isLocked = node.status === 'SYSTEM_LOCKED'

  return (
    <div className="group relative">
      {/* Connector Lines (Visual Physics) */}
      {level > 0 && (
        <div
          className="absolute bottom-0 top-0 border-l border-[#1F1F1F] transition-colors group-hover:border-zinc-700"
          style={{ left: `${level * 24 - 12}px` }}
        />
      )}

      <div
        className={`flex h-10 items-center border-b border-[#1F1F1F] px-4 transition-colors ${level === 0 ? 'bg-[#0F0F0F]' : 'bg-black hover:bg-[#0A0A0A]'} `}
        style={{ paddingLeft: `${level * 24 + 16}px` }}
      >
        {/* Expand/Collapse */}
        <button
          onClick={() => hasChildren && onToggle(node.id)}
          className={`mr-2 flex h-4 w-4 items-center justify-center text-zinc-500 transition-colors hover:text-white ${!hasChildren && 'invisible'}`}
        >
          {node.expanded ? (
            <ChevronDown size={14} />
          ) : (
            <ChevronRight size={14} />
          )}
        </button>

        {/* Code */}
        <span
          className={`mr-4 font-mono text-xs ${level === 0 ? 'font-bold text-white' : 'text-zinc-400'}`}
        >
          {node.code}
        </span>

        {/* Name */}
        <span
          className={`flex-1 text-sm ${level === 0 ? 'font-medium text-white' : 'text-zinc-300'}`}
        >
          {node.name}
        </span>

        {/* Metadata Columns */}
        <div className="mr-4 flex items-center gap-6">
          <TypeBadge type={node.type} />

          <div className="w-24 text-right font-mono text-xs text-zinc-400">
            {node.balance || '-'}
          </div>

          <div className="flex w-8 justify-center">
            {isLocked && <Lock size={12} className="text-zinc-600" />}
          </div>

          <div className="flex w-8 justify-center opacity-0 transition-opacity group-hover:opacity-100">
            <button className="text-zinc-500 hover:text-white">
              <MoreHorizontal size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Recursive Children */}
      <AnimatePresence>
        {node.expanded && node.children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {node.children.map((child) => (
              <AccountRow
                key={child.id}
                node={child}
                level={level + 1}
                onToggle={onToggle}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function CoreCoaPage() {
  const [coaData, setCoaData] = useState(INITIAL_COA)
  const [searchQuery, setSearchQuery] = useState('')

  // Recursive toggle function
  const toggleNode = (data: AccountNode[], id: string): AccountNode[] => {
    return data.map((node) => {
      if (node.id === id) {
        return { ...node, expanded: !node.expanded }
      }
      if (node.children) {
        return { ...node, children: toggleNode(node.children, id) }
      }
      return node
    })
  }

  const handleToggle = (id: string) => {
    setCoaData((prev) => toggleNode(prev, id))
  }

  const auditData: PageAuditData = {
    pageCode: 'CORE_01',
    version: '2.4.0',
    status: 'ACTIVE',
    lastUpdated: new Date().toISOString(),
    validator: 'CFO_OFFICE',
    classification: 'RESTRICTED',
    recentChanges: [],
  }

  return (
    <MetaAppShell>
      <div className="mx-auto max-w-[1400px] px-6 py-8 md:px-12 md:py-12">
        <MetaPageHeader
          variant="default"
          code="CORE_01"
          title="MASTER CHART OF ACCOUNTS"
          subtitle="FINANCIAL SKELETON"
          description="The hierarchical definition of all general ledger accounts."
        />

        {/* Toolbar */}
        <div className="mb-6 mt-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex max-w-md flex-1 items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                placeholder="Search by code or name..."
                className="h-10 border-[#1F1F1F] bg-black pl-9 font-mono text-sm focus:border-emerald-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              className="border-[#1F1F1F] bg-black text-zinc-400 hover:text-white"
            >
              <Filter className="mr-2 h-4 w-4" /> Filter
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="border-[#1F1F1F] bg-black text-zinc-400 hover:text-white"
            >
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button className="bg-emerald-600 text-white hover:bg-emerald-500">
              <Plus className="mr-2 h-4 w-4" /> New Account
            </Button>
          </div>
        </div>

        {/* Tree Table */}
        <Card className="overflow-hidden border-[#1F1F1F] bg-[#0A0A0A]">
          {/* Table Header */}
          <div className="flex h-10 items-center border-b border-[#1F1F1F] bg-[#111] px-4 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            <div className="mr-2 w-4"></div>
            <div className="mr-4 w-12">Code</div>
            <div className="flex-1">Account Name</div>
            <div className="mr-4 flex items-center gap-6">
              <div className="w-16">Type</div>
              <div className="w-24 text-right">Balance</div>
              <div className="w-8 text-center">Sys</div>
              <div className="w-8"></div>
            </div>
          </div>

          {/* Tree Rows */}
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {coaData.map((node) => (
                <AccountRow
                  key={node.id}
                  node={node}
                  level={0}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          </div>

          {/* Footer / Pagination Stub */}
          <div className="flex h-8 items-center justify-between border-t border-[#1F1F1F] bg-[#0F0F0F] px-4 font-mono text-[10px] text-zinc-600">
            <span>SHOWING ALL ACCOUNTS</span>
            <span>SYNCED: JUST NOW</span>
          </div>
        </Card>
      </div>
      <PageAuditTrail data={auditData} />
    </MetaAppShell>
  )
}
