// ============================================================================
// BIOSKIN: BioList - Table Renderer
// ============================================================================
// v0: Basic list/table renderer (no virtualization yet)
// Columns derived from schema shape + kernel ordering
// 🛡️ GOVERNANCE: Only uses Surface, Txt, BioCell (which uses atoms)
// ============================================================================

'use client'

import React from 'react'
import { Surface, Txt } from '@aibos/ui'
import { BioCell } from './BioCell'
import type { ExtendedMetadataField } from './types'
// Note: TypeScript language server may show errors for @/ imports,
// but these resolve correctly at build time via tsconfig.json paths

// ============================================================================
// TYPES
// ============================================================================

export interface BioListProps {
  /** Array of field metadata from Kernel (defines columns) */
  schema: ExtendedMetadataField[]
  /** Array of records to display */
  data: Record<string, unknown>[]
  /** Row click handler (opens FieldContextSidebar) */
  onRowClick?: (record: Record<string, unknown>) => void
  /** Optional row key field (defaults to 'id') */
  rowKey?: string
  /** Loading state (shows skeleton table rows) */
  isLoading?: boolean
  /** Additional className */
  className?: string
  /** Custom cell renderers - Escape hatch for custom columns */
  customRenderers?: {
    [fieldName: string]: (value: unknown, record: Record<string, unknown>) => React.ReactNode
  }
}

// ============================================================================
// BIO LIST - Table Renderer
// ============================================================================

export function BioList({
  schema,
  data,
  onRowClick,
  rowKey = 'id',
  isLoading = false,
  className,
  customRenderers,
}: BioListProps) {
  // Filter visible columns (exclude hidden fields)
  const visibleColumns: ExtendedMetadataField[] = schema.filter(
    (field) => !field.hidden
  )

  // Sort columns by order if specified
  const sortedColumns: ExtendedMetadataField[] = [...visibleColumns].sort(
    (a, b) => {
      const orderA = a.order ?? 999
      const orderB = b.order ?? 999
      return orderA - orderB
    }
  )

  // Loading state: render skeleton table
  if (isLoading) {
    return (
      <Surface variant="base" className={`overflow-hidden ${className || ''}`}>
        <div className="overflow-x-auto">
          <table
            className="w-full border-collapse"
            aria-label="BioSkin data table (loading)"
          >
            <thead>
              <tr className="border-border-surface-base border-b">
                {sortedColumns.map((field) => (
                  <th
                    key={field.technical_name}
                    className="px-4 py-3 text-left"
                    scope="col"
                  >
                    <div className="h-4 w-24 animate-pulse rounded-action bg-surface-flat" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((rowIdx) => (
                <tr
                  key={`skeleton-${rowIdx}`}
                  className="border-border-surface-base border-b"
                >
                  {sortedColumns.map((field) => (
                    <td key={field.technical_name} className="px-4 py-3">
                      <div className="h-5 w-full animate-pulse rounded-action bg-surface-flat" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>
    )
  }

  if (data.length === 0) {
    return (
      <Surface variant="base" className={`p-8 ${className || ''}`}>
        <div className="text-center">
          <Txt variant="body" className="text-text-tertiary">
            No data available
          </Txt>
        </div>
      </Surface>
    )
  }

  return (
    <Surface variant="base" className={`overflow-hidden ${className || ''}`}>
      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse"
          aria-label="BioSkin data table"
        >
          {/* Header */}
          <thead>
            <tr className="border-border-surface-base border-b">
              {sortedColumns.map((field) => (
                <th
                  key={field.technical_name}
                  className="px-4 py-3 text-left"
                  scope="col"
                  style={field.width ? { width: field.width } : undefined}
                >
                  <Txt
                    variant="small"
                    className="font-medium uppercase text-text-secondary"
                  >
                    {field.business_term}
                  </Txt>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {data.map((record, index) => {
              const recordId = record[rowKey] as string | number | undefined
              const key =
                recordId !== undefined ? String(recordId) : `row-${index}`
              const isClickable = !!onRowClick

              return (
                <tr
                  key={key}
                  className={`border-border-surface-base border-b ${isClickable ? 'cursor-pointer transition-colors hover:bg-surface-flat focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-primary focus-visible:ring-offset-2' : ''}`}
                  tabIndex={isClickable ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (!isClickable) return
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onRowClick?.(record)
                    }
                  }}
                  onClick={() => isClickable && onRowClick?.(record)}
                >
                  {sortedColumns.map((field) => {
                    const value = record[field.technical_name]

                    // Escape hatch: Use custom renderer if provided
                    if (customRenderers && customRenderers[field.technical_name]) {
                      return (
                        <td key={field.technical_name} className="px-4 py-3">
                          {customRenderers[field.technical_name](value, record)}
                        </td>
                      )
                    }

                    // Default: Use BioCell
                    return (
                      <td key={field.technical_name} className="px-4 py-3">
                        <BioCell
                          fieldMeta={field}
                          value={value}
                          intent="view"
                        />
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Surface>
  )
}
