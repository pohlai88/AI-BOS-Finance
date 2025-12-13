// ============================================================================
// SUPER TABLE LITE - Modular Assembly
// Uses: SuperTableHeader + SuperTableBody + SuperTablePagination
// ============================================================================
// USE CASE: When you need lighter weight than TanStack Table, or want to
// understand the underlying mechanics without library abstractions.
// For full power, use SuperTable.tsx (TanStack-powered)
// ============================================================================

import React, { useState, useMemo, useCallback } from 'react'
import { SuperTableHeader, type ColumnDef } from './SuperTableHeader'
import { SuperTableBody } from './SuperTableBody'
import { SuperTablePagination } from './SuperTablePagination'
import { ColumnVisibilityMenu } from './ColumnVisibilityMenu'
import { Search, X } from 'lucide-react'
import { cn } from '@aibos/ui'

// ============================================================================
// TYPES
// ============================================================================

interface SuperTableLiteProps<T> {
  // Required
  data: T[]
  columns: ColumnDef<T>[]
  getRowId: (row: T) => string | number

  // Optional config
  title?: string
  enableSelection?: boolean
  enableGlobalSearch?: boolean
  enableColumnVisibility?: boolean
  initialPageSize?: number

  // Handlers
  onRowClick?: (row: T) => void
  onSelectionChange?: (selectedRows: T[]) => void

  // State
  isLoading?: boolean

  // Custom rendering
  renderCell?: (row: T, column: ColumnDef<T>, value: unknown) => React.ReactNode

  // Styling
  className?: string
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SuperTableLite<T>({
  data,
  columns: initialColumns,
  getRowId,
  title = 'DATA_REGISTRY',
  enableSelection = false,
  enableGlobalSearch = true,
  enableColumnVisibility = true,
  initialPageSize = 20,
  onRowClick,
  onSelectionChange,
  isLoading = false,
  renderCell,
  className,
}: SuperTableLiteProps<T>) {
  // === STATE MANAGEMENT ===

  // Pagination
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(initialPageSize)

  // Sorting (single column)
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: 'asc' | 'desc'
  } | null>(null)

  // Filtering
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(
    new Set()
  )

  // Column visibility
  const [columns, setColumns] = useState<ColumnDef<T>[]>(
    initialColumns.map((col) => ({ ...col, visible: col.visible !== false }))
  )

  // === LOGIC ENGINE ===

  // A. Global + Column Filtering
  const filteredData = useMemo(() => {
    let result = [...data]

    // Global filter
    if (globalFilter) {
      const query = globalFilter.toLowerCase()
      result = result.filter((row) =>
        Object.values(row as object).some((value) =>
          String(value).toLowerCase().includes(query)
        )
      )
    }

    // Per-column filters
    Object.entries(columnFilters).forEach(([key, filterValue]) => {
      if (filterValue) {
        result = result.filter((row) => {
          const value = String(
            (row as Record<string, unknown>)[key] || ''
          ).toLowerCase()
          return value.includes(filterValue.toLowerCase())
        })
      }
    })

    return result
  }, [data, globalFilter, columnFilters])

  // B. Sorting
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData

    return [...filteredData].sort((a, b) => {
      const valA = (a as Record<string, unknown>)[sortConfig.key]
      const valB = (b as Record<string, unknown>)[sortConfig.key]

      // Handle nulls
      if (valA == null && valB == null) return 0
      if (valA == null) return 1
      if (valB == null) return -1

      // Compare
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredData, sortConfig])

  // C. Pagination (client-side slice)
  const paginatedData = useMemo(() => {
    const start = pageIndex * pageSize
    return sortedData.slice(start, start + pageSize)
  }, [sortedData, pageIndex, pageSize])

  // === HANDLERS ===

  const handleSort = useCallback((key: string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        if (current.direction === 'asc') return { key, direction: 'desc' }
        return null // Third click clears sort
      }
      return { key, direction: 'asc' }
    })
  }, [])

  const handleFilterChange = useCallback((key: string, value: string) => {
    setColumnFilters((prev) => ({ ...prev, [key]: value }))
    setPageIndex(0) // Reset to first page on filter change
  }, [])

  const handleRowSelect = useCallback(
    (row: T) => {
      const id = getRowId(row)
      setSelectedIds((prev) => {
        const next = new Set(prev)
        if (next.has(id)) {
          next.delete(id)
        } else {
          next.add(id)
        }
        return next
      })
    },
    [getRowId]
  )

  const handleSelectAll = useCallback(() => {
    const currentPageIds = paginatedData.map(getRowId)
    const allSelected = currentPageIds.every((id) => selectedIds.has(id))

    setSelectedIds((prev) => {
      const next = new Set(prev)
      currentPageIds.forEach((id) => {
        if (allSelected) {
          next.delete(id)
        } else {
          next.add(id)
        }
      })
      return next
    })
  }, [paginatedData, getRowId, selectedIds])

  const handleColumnVisibilityToggle = useCallback((key: string) => {
    setColumns((prev) =>
      prev.map((col) =>
        String(col.key) === key ? { ...col, visible: !col.visible } : col
      )
    )
  }, [])

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize)
    setPageIndex(0) // Reset to first page
  }, [])

  // === DERIVED STATE ===

  const currentPageIds = paginatedData.map(getRowId)
  const isAllSelected =
    currentPageIds.length > 0 &&
    currentPageIds.every((id) => selectedIds.has(id))
  const isIndeterminate =
    currentPageIds.some((id) => selectedIds.has(id)) && !isAllSelected
  const selectedCount = selectedIds.size

  // Notify parent of selection changes
  React.useEffect(() => {
    if (onSelectionChange) {
      const selectedRows = data.filter((row) => selectedIds.has(getRowId(row)))
      onSelectionChange(selectedRows)
    }
  }, [selectedIds, data, getRowId, onSelectionChange])

  // === RENDER ===

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-lg border border-[#1F1F1F] bg-[#0A0A0A]',
        className
      )}
    >
      {/* ================================================================ */}
      {/* HEADER BAR */}
      {/* ================================================================ */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#1F1F1F] p-4 md:flex-row md:items-center">
        {/* Left: Title + Stats */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="h-2 w-2 animate-pulse rounded-full bg-[#28E7A2] shadow-[0_0_8px_rgba(40,231,162,0.5)]" />
          <span className="font-mono text-[13px] font-medium tracking-wide text-[#CCC]">
            {title}
          </span>
          <span className="font-mono text-[11px] text-[#555]">
            // {sortedData.length} RECORDS
          </span>
          {selectedCount > 0 && (
            <span className="rounded border border-[#28E7A2]/30 bg-[#28E7A2]/10 px-2 py-1 font-mono text-[11px] text-[#28E7A2]">
              {selectedCount} selected
            </span>
          )}
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          {/* Global Search */}
          {enableGlobalSearch && (
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#444]" />
              <input
                type="text"
                value={globalFilter}
                onChange={(e) => {
                  setGlobalFilter(e.target.value)
                  setPageIndex(0)
                }}
                placeholder="Search..."
                className={cn(
                  'h-8 rounded border border-[#1F1F1F] bg-[#050505] pl-9 pr-8',
                  'font-mono text-[12px] text-white',
                  'focus:border-[#28E7A2] focus:outline-none',
                  'w-full placeholder:text-[#333] md:w-48'
                )}
              />
              {globalFilter && (
                <button
                  onClick={() => setGlobalFilter('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#666] hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Column Visibility */}
          {enableColumnVisibility && (
            <ColumnVisibilityMenu
              columns={columns}
              onToggle={handleColumnVisibilityToggle}
            />
          )}
        </div>
      </div>

      {/* ================================================================ */}
      {/* TABLE */}
      {/* ================================================================ */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          {/* Header: Hidden on mobile (cards have inline labels) */}
          <SuperTableHeader<T>
            columns={columns}
            sortConfig={sortConfig}
            onSort={handleSort}
            filters={columnFilters}
            onFilterChange={handleFilterChange}
            enableSelection={enableSelection}
            isAllSelected={isAllSelected}
            isIndeterminate={isIndeterminate}
            onSelectAll={handleSelectAll}
          />

          {/* Body: Transforms to cards on mobile */}
          <SuperTableBody<T>
            data={paginatedData}
            columns={columns}
            enableSelection={enableSelection}
            selectedIds={selectedIds}
            onToggleRow={handleRowSelect}
            getRowId={getRowId}
            onRowClick={onRowClick}
            isLoading={isLoading}
            renderCell={renderCell}
          />
        </table>
      </div>

      {/* ================================================================ */}
      {/* PAGINATION */}
      {/* ================================================================ */}
      <SuperTablePagination
        pageIndex={pageIndex}
        pageSize={pageSize}
        totalCount={sortedData.length}
        onPageChange={setPageIndex}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  )
}

export default SuperTableLite
