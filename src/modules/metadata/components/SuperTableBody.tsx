// ============================================================================
// SUPER TABLE BODY v2.0 - "The Transformer"
// CSS-First Mobile Cards ↔ Desktop Table Rows
// ============================================================================
// PATTERN: Single DOM, dual layout via Tailwind responsive prefixes
// - Mobile: block/flex → Cards with key-value pairs
// - Desktop: table-row/table-cell → Traditional table rows
// ============================================================================

import React from 'react'
import { Inbox, Loader2 } from 'lucide-react'
import { cn } from '@aibos/ui'
import type { ColumnDef } from './SuperTableHeader'

interface SuperTableBodyProps<T> {
  data: T[]
  columns: ColumnDef<T>[]

  // Selection Props
  enableSelection?: boolean
  selectedIds: Set<string | number> // O(1) lookups
  onToggleRow: (row: T) => void
  getRowId: (row: T) => string | number

  // Row Interaction
  onRowClick?: (row: T) => void

  // State
  isLoading?: boolean

  // Custom Rendering
  renderCell?: (row: T, column: ColumnDef<T>, value: unknown) => React.ReactNode

  // Styling
  className?: string
}

export const SuperTableBody = <T,>({
  data,
  columns,
  enableSelection = false,
  selectedIds,
  onToggleRow,
  getRowId,
  onRowClick,
  isLoading = false,
  renderCell,
  className,
}: SuperTableBodyProps<T>) => {
  // Calculate colspan for full-width states
  const totalColumns =
    columns.filter((c) => c.visible !== false).length +
    (enableSelection ? 1 : 0)

  // --- LOADING STATE ---
  if (isLoading) {
    return (
      <tbody className={cn('block md:table-row-group', className)}>
        {/* Skeleton Rows */}
        {[...Array(5)].map((_, i) => (
          <tr
            key={`skeleton-${i}`}
            className="mb-4 block rounded-lg border border-[#1F1F1F] bg-[#0A0A0A] md:mb-0 md:table-row md:rounded-none md:border-b"
          >
            {enableSelection && (
              <td className="p-3 md:table-cell md:w-12 md:p-4">
                <div className="h-4 w-4 animate-pulse rounded bg-[#1A1A1A]" />
              </td>
            )}
            {columns
              .filter((c) => c.visible !== false)
              .map((col, j) => (
                <td
                  key={`skeleton-${i}-${j}`}
                  className="flex justify-between border-b border-[#1A1A1A] p-3 last:border-b-0 md:table-cell md:border-b-0 md:p-4"
                >
                  <span className="h-3 w-16 animate-pulse rounded bg-[#1A1A1A] md:hidden" />
                  <span
                    className="h-4 animate-pulse rounded bg-[#1A1A1A]"
                    style={{ width: `${60 + ((j * 20) % 40)}%` }}
                  />
                </td>
              ))}
          </tr>
        ))}
      </tbody>
    )
  }

  // --- EMPTY STATE ---
  if (!data || data.length === 0) {
    return (
      <tbody className={className}>
        <tr>
          <td colSpan={totalColumns} className="p-12 text-center">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#1F1F1F] bg-[#111]">
                <Inbox className="h-8 w-8 text-[#333]" />
              </div>
              <div className="space-y-1">
                <p className="font-mono text-sm text-[#888]">
                  No Records Found
                </p>
                <p className="text-xs text-[#555]">
                  Try adjusting your filters or search query.
                </p>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    )
  }

  // --- DATA ROWS ---
  return (
    <tbody className={cn('block md:table-row-group', className)}>
      {data.map((row) => {
        const rowId = getRowId(row)
        const isSelected = selectedIds.has(rowId)

        return (
          <tr
            key={String(rowId)}
            onClick={() => {
              if (onRowClick) onRowClick(row)
            }}
            className={cn(
              // === MOBILE: Card Style ===
              'mb-3 block overflow-hidden rounded-lg border',
              'bg-[#0A0A0A]',

              // === DESKTOP: Table Row Style ===
              'md:mb-0 md:table-row md:rounded-none md:border-b md:border-[#1A1A1A]',

              // === Interactive States ===
              'cursor-pointer transition-all duration-200',
              'hover:border-[#28E7A2]/30 hover:bg-[#111]',

              // === Selection State ===
              isSelected
                ? 'border-[#28E7A2]/50 bg-[#28E7A2]/5 ring-1 ring-[#28E7A2]/30 md:bg-[#28E7A2]/10 md:ring-0'
                : 'border-[#1F1F1F]'
            )}
            role="row"
            aria-selected={isSelected}
          >
            {/* 1. CHECKBOX COLUMN */}
            {enableSelection && (
              <td
                className={cn(
                  // Mobile: Header row for the card
                  'flex items-center justify-between border-b border-[#1A1A1A] bg-[#111] p-3',
                  // Desktop: Standard cell
                  'md:table-cell md:w-12 md:border-b-0 md:bg-transparent md:p-4'
                )}
              >
                {/* Mobile Label */}
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#666] md:hidden">
                  Select
                </span>

                {/* Checkbox */}
                <input
                  type="checkbox"
                  className={cn(
                    'h-4 w-4 rounded border-[#333] bg-[#111]',
                    'text-[#28E7A2] focus:ring-1 focus:ring-[#28E7A2] focus:ring-offset-0',
                    'cursor-pointer transition-colors'
                  )}
                  checked={isSelected}
                  onChange={() => onToggleRow(row)}
                  onClick={(e) => e.stopPropagation()} // Prevent double toggle from row click
                  aria-label={`Select row ${rowId}`}
                />
              </td>
            )}

            {/* 2. DATA COLUMNS */}
            {columns.map((col) => {
              if (col.visible === false) return null

              const colKey = String(col.key)
              // Access value with type assertion
              const cellValue = (row as Record<string, unknown>)[colKey]

              // Use custom renderer if provided, otherwise stringify
              const renderedValue = renderCell
                ? renderCell(row, col, cellValue)
                : formatCellValue(cellValue)

              return (
                <td
                  key={`${rowId}-${colKey}`}
                  className={cn(
                    // Mobile: Flex row for key-value pair
                    'flex items-center justify-between border-b border-[#1A1A1A] p-3 last:border-b-0',
                    // Desktop: Standard table cell
                    'md:table-cell md:border-b-0 md:p-4 md:text-left',
                    col.width || 'w-auto'
                  )}
                >
                  {/* Mobile Label (Hidden on Desktop) */}
                  <span className="mr-4 shrink-0 font-mono text-[10px] uppercase tracking-wider text-[#555] md:hidden">
                    {col.header}
                  </span>

                  {/* Cell Value */}
                  <span
                    className={cn(
                      'font-mono text-sm text-[#CCC]',
                      'max-w-[200px] truncate md:max-w-none',
                      // First column is typically the "title" - make it prominent
                      colKey === String(columns[0]?.key) &&
                        'font-medium text-white'
                    )}
                  >
                    {renderedValue}
                  </span>
                </td>
              )
            })}
          </tr>
        )
      })}
    </tbody>
  )
}

// --- HELPER: Format Cell Value ---
function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (value instanceof Date) return value.toLocaleDateString()
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export default SuperTableBody
