// ============================================================================
// SCHEMA COLUMN GENERATOR - The Holy Grail
// Translates Metadata Registry → TanStack Table Columns
// ============================================================================
// PHILOSOPHY: "Protect. Correct. React."
// - UI is a downstream consumer of Metadata Registry
// - Changes in Kernel propagate instantly to all tables
// - No hardcoded columns - everything schema-driven
// ============================================================================

import React from 'react'
import { ColumnDef } from '@tanstack/react-table'
import {
  BadgeCheck,
  Lock,
  Calendar,
  Hash,
  Type,
  AlertTriangle,
  Shield,
  DollarSign,
  ToggleLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// 1. METADATA CONTRACT (Mirrors Kernel Registry)
// ============================================================================

export type MetadataType =
  | 'text'
  | 'number'
  | 'currency'
  | 'date'
  | 'datetime'
  | 'boolean'
  | 'status'
  | 'json'
  | 'percentage'
  | 'code' // For technical IDs, codes

export interface MetadataField {
  // Core Identity
  technical_name: string // e.g., "total_revenue_amt"
  business_term: string // e.g., "Total Revenue"
  data_type: MetadataType // e.g., "currency"

  // Governance
  description?: string // Tooltip content
  is_critical?: boolean // Shows shield/lock icon
  is_editable?: boolean // Determines if cell is interactive
  canon_id?: string // Link to Canon definition

  // Display
  width?: number // Optional default width
  align?: 'left' | 'center' | 'right'

  // Formatting
  format_pattern?: string // e.g., "USD", "YYYY-MM-DD"
  status_config?: Record<string, string> // Map status -> style classes

  // Sorting/Filtering
  sortable?: boolean
  filterable?: boolean
}

// ============================================================================
// 2. CELL RENDERERS (Standardizing the Look - NexusCanon Dark Theme)
// ============================================================================

// --- Currency Cell ---
const CurrencyCell = ({
  value,
  currency = 'USD',
}: {
  value: unknown
  currency?: string
}) => {
  if (value === null || value === undefined) {
    return <span className="font-mono text-[#444]">—</span>
  }

  const num = Number(value)
  const isNegative = num < 0

  return (
    <span
      className={cn(
        'font-mono text-sm',
        isNegative ? 'text-[#FF4D4D]' : 'text-[#28E7A2]'
      )}
    >
      {new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
      }).format(num)}
    </span>
  )
}

// --- Number Cell ---
const NumberCell = ({ value }: { value: unknown }) => {
  if (value === null || value === undefined) {
    return <span className="font-mono text-[#444]">—</span>
  }

  return (
    <span className="font-mono text-sm text-[#CCC]">
      {new Intl.NumberFormat('en-US').format(Number(value))}
    </span>
  )
}

// --- Percentage Cell ---
const PercentageCell = ({ value }: { value: unknown }) => {
  if (value === null || value === undefined) {
    return <span className="font-mono text-[#444]">—</span>
  }

  const num = Number(value)
  const isNegative = num < 0

  return (
    <span
      className={cn(
        'font-mono text-sm',
        isNegative
          ? 'text-[#FF4D4D]'
          : num > 0
            ? 'text-[#28E7A2]'
            : 'text-[#888]'
      )}
    >
      {num >= 0 ? '+' : ''}
      {num.toFixed(2)}%
    </span>
  )
}

// --- Status Cell ---
const StatusCell = ({
  value,
  config,
}: {
  value: unknown
  config?: Record<string, string>
}) => {
  const statusKey = String(value).toLowerCase()

  // Default NexusCanon status styles
  const defaultConfig: Record<string, string> = {
    active: 'bg-[#132F2B] text-[#28E7A2] border-[#1D4436]',
    locked: 'bg-[#132F2B] text-[#28E7A2] border-[#1D4436]',
    pending: 'bg-[#2A2610] text-[#FFD600] border-[#423C12]',
    draft: 'bg-[#1F1F1F] text-[#888] border-[#333]',
    error: 'bg-[#2F1515] text-[#FF4D4D] border-[#491C1C]',
    overdue: 'bg-[#2F1515] text-[#FF4D4D] border-[#491C1C]',
    conflict: 'bg-[#2F1515] text-[#FF4D4D] border-[#491C1C]',
    untrusted: 'bg-[#2F1F15] text-[#FF9F43] border-[#4A3520]',
    paid: 'bg-[#132F2B] text-[#28E7A2] border-[#1D4436]',
    archived: 'bg-[#1A1A1A] text-[#666] border-[#333]',
  }

  const mergedConfig = { ...defaultConfig, ...config }
  const colorClass =
    mergedConfig[statusKey] || 'bg-[#1F1F1F] text-[#888] border-[#333]'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider',
        colorClass
      )}
    >
      {String(value)}
    </span>
  )
}

// --- Date Cell ---
const DateCell = ({
  value,
  includeTime = false,
}: {
  value: unknown
  includeTime?: boolean
}) => {
  if (!value) {
    return <span className="font-mono text-[#444]">—</span>
  }

  const date = new Date(String(value))

  return (
    <div className="flex items-center gap-2 text-[#888]">
      <Calendar className="h-3 w-3 text-[#555]" />
      <span className="font-mono text-xs">
        {includeTime ? date.toLocaleString() : date.toLocaleDateString()}
      </span>
    </div>
  )
}

// --- Boolean Cell ---
const BooleanCell = ({ value }: { value: unknown }) => {
  return (
    <div className="flex justify-center">
      {value ? (
        <BadgeCheck className="h-5 w-5 text-[#28E7A2]" />
      ) : (
        <div className="h-5 w-5 rounded-sm border border-[#333] bg-[#111]" />
      )}
    </div>
  )
}

// --- Code Cell (Technical IDs) ---
const CodeCell = ({ value }: { value: unknown }) => {
  if (!value) {
    return <span className="font-mono text-[#444]">—</span>
  }

  return (
    <span className="rounded border border-[#222] bg-[#111] px-1.5 py-0.5 font-mono text-[11px] text-[#666]">
      {String(value)}
    </span>
  )
}

// --- Text Cell (Default) ---
const TextCell = ({ value }: { value: unknown }) => {
  if (!value) {
    return <span className="text-[#444]">—</span>
  }

  return (
    <span className="block truncate text-sm text-[#CCC]" title={String(value)}>
      {String(value)}
    </span>
  )
}

// ============================================================================
// 3. THE GENERATOR FUNCTION
// ============================================================================

export function generateColumnsFromSchema<T>(
  schema: MetadataField[]
): ColumnDef<T, unknown>[] {
  return schema.map((field) => {
    // --- Build Column Definition ---
    const colDef: ColumnDef<T, unknown> = {
      accessorKey: field.technical_name,
      id: field.technical_name,

      // --- Header Renderer ---
      header: () => (
        <div
          className="group flex items-center gap-1.5"
          title={field.description}
        >
          {/* Type Icon */}
          {getTypeIcon(field.data_type)}

          {/* Business Term */}
          <span
            className={cn(
              'font-mono text-[10px] uppercase tracking-wider transition-colors',
              field.is_critical ? 'text-[#888]' : 'text-[#666]',
              'group-hover:text-[#28E7A2]'
            )}
          >
            {field.business_term}
          </span>

          {/* Critical Badge */}
          {field.is_critical && (
            <span title="Critical Field">
              <Shield className="h-3 w-3 text-[#FFD600]" />
            </span>
          )}
        </div>
      ),

      // --- Size ---
      size: field.width || 150,

      // --- Sorting ---
      enableSorting: field.sortable !== false,

      // --- Cell Renderer ---
      cell: (info) => {
        const value = info.getValue()

        switch (field.data_type) {
          case 'currency':
            return (
              <CurrencyCell value={value} currency={field.format_pattern} />
            )

          case 'number':
            return <NumberCell value={value} />

          case 'percentage':
            return <PercentageCell value={value} />

          case 'status':
            return <StatusCell value={value} config={field.status_config} />

          case 'date':
            return <DateCell value={value} includeTime={false} />

          case 'datetime':
            return <DateCell value={value} includeTime={true} />

          case 'boolean':
            return <BooleanCell value={value} />

          case 'code':
            return <CodeCell value={value} />

          case 'json':
            return (
              <code className="rounded bg-[#111] px-1 text-[10px] text-[#666]">
                {JSON.stringify(value).slice(0, 30)}...
              </code>
            )

          default:
            return <TextCell value={value} />
        }
      },

      // --- Governance Metadata (for downstream use) ---
      meta: {
        canonId: field.canon_id,
        isCritical: field.is_critical,
        isEditable: field.is_editable,
        dataType: field.data_type,
        description: field.description,
      },
    }

    return colDef
  })
}

// ============================================================================
// 4. HELPER: Type Icons
// ============================================================================

function getTypeIcon(type: MetadataType): React.ReactNode {
  const iconClass = 'w-3 h-3 text-[#444]'

  switch (type) {
    case 'currency':
      return <DollarSign className={iconClass} />
    case 'number':
    case 'percentage':
      return <Hash className={iconClass} />
    case 'date':
    case 'datetime':
      return <Calendar className={iconClass} />
    case 'boolean':
      return <ToggleLeft className={iconClass} />
    case 'status':
      return <AlertTriangle className={iconClass} />
    case 'code':
      return <Lock className={iconClass} />
    default:
      return <Type className={iconClass} />
  }
}

// ============================================================================
// 5. PRESETS: Common Status Configurations
// ============================================================================

export const STATUS_PRESETS = {
  // Canon Status
  canonStatus: {
    locked: 'bg-[#132F2B] text-[#28E7A2] border-[#1D4436]',
    pending: 'bg-[#2A2610] text-[#FFD600] border-[#423C12]',
    conflict: 'bg-[#2F1515] text-[#FF4D4D] border-[#491C1C]',
    draft: 'bg-[#1F1F1F] text-[#888] border-[#333]',
    untrusted: 'bg-[#2F1F15] text-[#FF9F43] border-[#4A3520]',
  },

  // Invoice Status
  invoiceStatus: {
    paid: 'bg-[#132F2B] text-[#28E7A2] border-[#1D4436]',
    pending: 'bg-[#2A2610] text-[#FFD600] border-[#423C12]',
    overdue: 'bg-[#2F1515] text-[#FF4D4D] border-[#491C1C]',
    draft: 'bg-[#1F1F1F] text-[#888] border-[#333]',
  },

  // General Active/Inactive
  activeStatus: {
    active: 'bg-[#132F2B] text-[#28E7A2] border-[#1D4436]',
    inactive: 'bg-[#1F1F1F] text-[#888] border-[#333]',
    suspended: 'bg-[#2F1F15] text-[#FF9F43] border-[#4A3520]',
  },

  // Criticality Levels
  criticality: {
    critical: 'bg-[#2F1515] text-[#FF4D4D] border-[#491C1C]',
    high: 'bg-[#2F1F15] text-[#FF9F43] border-[#4A3520]',
    medium: 'bg-[#2A2610] text-[#FFD600] border-[#423C12]',
    low: 'bg-[#132F2B] text-[#28E7A2] border-[#1D4436]',
  },
}
