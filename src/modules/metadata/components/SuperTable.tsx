// ============================================================================
// SUPERTABLE v2.0 - MERGED IMPLEMENTATION
// Combines: Generic Type Support + Mobile Responsive + Full Feature Set
// Engine: TanStack Table v8 (Headless)
// ============================================================================

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnDef,
  VisibilityState,
  RowSelectionState,
} from '@tanstack/react-table'
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Filter,
  Settings,
  Edit,
  Trash2,
  X,
  Check,
} from 'lucide-react'
import { NexusCard } from '@/components/nexus/NexusCard'
import { cn } from '@aibos/ui'

// ============================================================================
// TYPES
// ============================================================================

interface SuperTableProps<T> {
  // Data & Columns
  data: T[]
  columns: ColumnDef<T, any>[]
  title?: string

  // Mobile config
  mobileKey?: keyof T

  // Feature Flags
  enableSelection?: boolean
  enablePagination?: boolean
  enableColumnVisibility?: boolean
  enableColumnFilters?: boolean
  enableGlobalFilter?: boolean

  // Handlers
  onRowClick?: (row: T) => void
  onSelectionChange?: (selectedRows: T[]) => void

  // Loading state
  isLoading?: boolean
}

// ============================================================================
// INDETERMINATE CHECKBOX COMPONENT
// ============================================================================

function IndeterminateCheckbox({
  indeterminate,
  className,
  ...rest
}: { indeterminate?: boolean } & React.HTMLProps<HTMLInputElement>) {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (ref.current && typeof indeterminate === 'boolean') {
      ref.current.indeterminate = !rest.checked && indeterminate
    }
  }, [indeterminate, rest.checked])

  return (
    <input
      type="checkbox"
      ref={ref}
      {...rest}
      className={cn(
        'h-4 w-4 cursor-pointer appearance-none rounded-sm border border-[#333] bg-[#0A0A0A] transition-colors checked:border-[#28E7A2] checked:bg-[#28E7A2]',
        className
      )}
    />
  )
}

// ============================================================================
// SORTING INDICATOR COMPONENT
// ============================================================================

function SortIndicator({ isSorted }: { isSorted: false | 'asc' | 'desc' }) {
  if (isSorted === 'asc') {
    return <ChevronUp className="h-3 w-3 text-[#28E7A2]" />
  }
  if (isSorted === 'desc') {
    return <ChevronDown className="h-3 w-3 text-[#28E7A2]" />
  }
  return (
    <ChevronsUpDown className="h-3 w-3 opacity-50 transition-opacity group-hover:opacity-100" />
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SuperTable<T>({
  data,
  columns,
  title,
  mobileKey,
  enableSelection = false,
  enablePagination = true,
  enableColumnVisibility = true,
  enableColumnFilters = true,
  enableGlobalFilter = true,
  onRowClick,
  onSelectionChange,
  isLoading = false,
}: SuperTableProps<T>) {
  // === PHASE 1: STATE MANAGEMENT ===
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [showColumnManager, setShowColumnManager] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // Debounced global filter
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedGlobalFilter(globalFilter), 300)
    return () => clearTimeout(timer)
  }, [globalFilter])

  // === INJECT SELECTION COLUMN IF ENABLED ===
  const finalColumns = useMemo(() => {
    if (!enableSelection) return columns

    const selectColumn: ColumnDef<T, any> = {
      id: 'select',
      header: ({ table }) => (
        <div className="flex justify-center">
          <IndeterminateCheckbox
            checked={table.getIsAllRowsSelected()}
            indeterminate={table.getIsSomeRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        </div>
      ),
      cell: ({ row }) => (
        <div
          className="flex justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <IndeterminateCheckbox
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onChange={row.getToggleSelectedHandler()}
          />
        </div>
      ),
      size: 50,
      enableSorting: false,
      enableHiding: false,
    }

    return [selectColumn, ...columns]
  }, [columns, enableSelection])

  // === APPLY COLUMN FILTERS TO DATA ===
  const filteredData = useMemo(() => {
    let result = data

    // Global filter
    if (debouncedGlobalFilter) {
      const query = debouncedGlobalFilter.toLowerCase()
      result = result.filter((record) =>
        Object.values(record as object).some((value) =>
          String(value).toLowerCase().includes(query)
        )
      )
    }

    // Per-column filters
    Object.entries(columnFilters).forEach(([columnId, filterValue]) => {
      if (filterValue) {
        result = result.filter((record) => {
          const value = String((record as any)[columnId] || '').toLowerCase()
          return value.includes(filterValue.toLowerCase())
        })
      }
    })

    return result
  }, [data, debouncedGlobalFilter, columnFilters])

  // === TANSTACK TABLE INSTANCE ===
  const table = useReactTable({
    data: filteredData,
    columns: finalColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
    },
    enableRowSelection: enableSelection,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: enablePagination
      ? getPaginationRowModel()
      : undefined,
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  })

  // === SELECTION CHANGE CALLBACK ===
  useEffect(() => {
    if (onSelectionChange && enableSelection) {
      const selectedRows = table
        .getFilteredSelectedRowModel()
        .rows.map((row) => row.original)
      onSelectionChange(selectedRows)
    }
  }, [rowSelection, onSelectionChange, enableSelection, table])

  const selectedCount = table.getFilteredSelectedRowModel().rows.length

  // === HELPER: Clear column filter ===
  const clearColumnFilter = useCallback((columnId: string) => {
    setColumnFilters((prev) => {
      const next = { ...prev }
      delete next[columnId]
      return next
    })
  }, [])

  // === RENDER ===
  return (
    <NexusCard
      variant="default"
      className="flex h-full min-h-[500px] flex-col overflow-hidden p-0"
    >
      {/* ================================================================== */}
      {/* HEADER BAR */}
      {/* ================================================================== */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#1F1F1F] bg-[#0A0A0A] p-4 md:flex-row md:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <div className="h-2 w-2 animate-pulse rounded-full bg-[#28E7A2] shadow-[0_0_8px_rgba(40,231,162,0.5)]" />
          <span className="text-[13px] font-medium tracking-wide text-[#CCC]">
            {title || 'DATA_REGISTRY'}
          </span>
          <span className="font-mono text-[12px] text-[#555]">
            // {filteredData.length} RECORDS
          </span>
          {selectedCount > 0 && (
            <span className="rounded border border-[#28E7A2]/30 bg-[#28E7A2]/10 px-2 py-1 font-mono text-[11px] text-[#28E7A2]">
              {selectedCount} selected
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Global Search */}
          {enableGlobalFilter && (
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#444]" />
              <input
                type="text"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Search..."
                className="h-8 w-full rounded border border-[#1F1F1F] bg-[#050505] pl-9 pr-4 font-mono text-[12px] text-white placeholder:text-[#333] focus:border-[#28E7A2] focus:outline-none md:w-48"
              />
            </div>
          )}

          {/* Mobile Filter Button */}
          {enableColumnFilters && (
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="flex h-8 w-8 items-center justify-center rounded border border-[#1F1F1F] text-[#666] transition-colors hover:border-[#28E7A2] hover:text-[#28E7A2] md:hidden"
            >
              <Filter className="h-4 w-4" />
            </button>
          )}

          {/* Bulk Actions */}
          {selectedCount > 0 && (
            <div className="flex items-center gap-1">
              <button
                className="rounded border border-[#1F1F1F] p-2 transition-colors hover:border-[#28E7A2]"
                title="Edit selected"
              >
                <Edit className="h-4 w-4 text-[#666]" />
              </button>
              <button
                className="rounded border border-[#1F1F1F] p-2 transition-colors hover:border-red-400"
                title="Delete selected"
              >
                <Trash2 className="h-4 w-4 text-[#666]" />
              </button>
            </div>
          )}

          {/* Column Visibility Toggle */}
          {enableColumnVisibility && (
            <button
              onClick={() => setShowColumnManager(!showColumnManager)}
              className={cn(
                'hidden rounded border p-2 transition-colors md:flex',
                showColumnManager
                  ? 'border-[#28E7A2] bg-[#28E7A2]/10 text-[#28E7A2]'
                  : 'border-[#1F1F1F] text-[#666] hover:border-[#28E7A2] hover:text-[#28E7A2]'
              )}
              title="Column visibility"
            >
              <Settings className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ================================================================== */}
      {/* COLUMN VISIBILITY MANAGER (Desktop) */}
      {/* ================================================================== */}
      {showColumnManager && enableColumnVisibility && (
        <div className="hidden border-b border-[#1F1F1F] bg-[#050505] p-3 md:block">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-[#666]">
            Column Visibility
          </div>
          <div className="flex flex-wrap gap-2">
            {table.getAllLeafColumns().map((column) => {
              if (column.id === 'select') return null
              return (
                <label
                  key={column.id}
                  className="flex cursor-pointer items-center gap-2 rounded border border-[#1F1F1F] bg-[#0A0A0A] px-2 py-1 text-[11px] transition-colors hover:border-[#28E7A2]"
                >
                  <input
                    type="checkbox"
                    checked={column.getIsVisible()}
                    onChange={column.getToggleVisibilityHandler()}
                    className="h-3 w-3 rounded border border-[#333] bg-[#0A0A0A] checked:border-[#28E7A2] checked:bg-[#28E7A2]"
                  />
                  <span className="font-mono text-[#CCC]">
                    {typeof column.columnDef.header === 'string'
                      ? column.columnDef.header
                      : column.id.toUpperCase()}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* MOBILE FILTER DRAWER */}
      {/* ================================================================== */}
      {showMobileFilters && enableColumnFilters && (
        <div className="space-y-3 border-b border-[#1F1F1F] bg-[#050505] p-4 md:hidden">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#666]">
              Column Filters
            </span>
            <button
              onClick={() => setShowMobileFilters(false)}
              className="text-[#666] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {table.getAllLeafColumns().map((column) => {
            if (column.id === 'select' || !column.getCanSort()) return null
            const columnId = column.id
            return (
              <div key={columnId} className="flex flex-col gap-1">
                <label className="font-mono text-[10px] uppercase tracking-wider text-[#888]">
                  {typeof column.columnDef.header === 'string'
                    ? column.columnDef.header
                    : columnId}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={columnFilters[columnId] || ''}
                    onChange={(e) =>
                      setColumnFilters((prev) => ({
                        ...prev,
                        [columnId]: e.target.value,
                      }))
                    }
                    placeholder="Filter..."
                    className="h-8 w-full rounded border border-[#1F1F1F] bg-[#0A0A0A] px-3 font-mono text-[12px] text-white placeholder:text-[#333] focus:border-[#28E7A2] focus:outline-none"
                  />
                  {columnFilters[columnId] && (
                    <button
                      onClick={() => clearColumnFilter(columnId)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#666] hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ================================================================== */}
      {/* DESKTOP TABLE VIEW */}
      {/* ================================================================== */}
      <div className="hidden flex-1 overflow-auto bg-[#050505] md:block">
        <table className="w-full min-w-[1000px] border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-[#050505] shadow-[0_1px_0_#1F1F1F]">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{
                      width:
                        header.getSize() !== 150 ? header.getSize() : undefined,
                    }}
                    className="border-b border-[#1F1F1F] p-3 align-top"
                  >
                    <div className="flex flex-col gap-1">
                      {/* Column Header with Sort */}
                      <div
                        className={cn(
                          'group flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-[#666]',
                          header.column.getCanSort() &&
                            'cursor-pointer transition-colors hover:text-[#28E7A2]'
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <SortIndicator
                            isSorted={header.column.getIsSorted()}
                          />
                        )}
                      </div>

                      {/* Per-Column Filter */}
                      {enableColumnFilters &&
                        header.id !== 'select' &&
                        header.column.getCanSort() && (
                          <input
                            type="text"
                            value={columnFilters[header.id] || ''}
                            onChange={(e) =>
                              setColumnFilters((prev) => ({
                                ...prev,
                                [header.id]: e.target.value,
                              }))
                            }
                            placeholder="Filter..."
                            onClick={(e) => e.stopPropagation()}
                            className="h-7 w-full rounded border border-[#1F1F1F] bg-[#0A0A0A] px-2 font-mono text-[11px] text-[#CCC] placeholder-[#333] focus:border-[#333] focus:outline-none"
                          />
                        )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row.original)}
                className={cn(
                  'cursor-pointer border-b border-[#111] transition-colors',
                  row.getIsSelected()
                    ? 'bg-[#28E7A2]/5 hover:bg-[#28E7A2]/10'
                    : 'hover:bg-[#0A0A0A]'
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-3 align-middle">
                    <div className="font-mono text-xs">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty State */}
        {filteredData.length === 0 && !isLoading && (
          <div className="py-16 text-center">
            <div className="font-mono text-sm uppercase tracking-widest text-[#666]">
              No Records Found
            </div>
            <div className="mt-2 font-mono text-xs text-[#444]">
              Adjust filters or search criteria
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="py-16 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#28E7A2] border-t-transparent" />
            <div className="mt-4 font-mono text-xs uppercase tracking-widest text-[#666]">
              Loading...
            </div>
          </div>
        )}
      </div>

      {/* ================================================================== */}
      {/* MOBILE CARD VIEW */}
      {/* ================================================================== */}
      <div className="flex-1 space-y-3 overflow-auto bg-[#050505] p-4 md:hidden">
        {table.getRowModel().rows.map((row) => (
          <div
            key={row.id}
            onClick={() => onRowClick?.(row.original)}
            className={cn(
              'rounded border bg-[#0A0A0A] p-4 transition-colors',
              row.getIsSelected()
                ? 'border-[#28E7A2] bg-[#28E7A2]/5'
                : 'border-[#1F1F1F] active:border-[#28E7A2]'
            )}
          >
            {/* Mobile Card Header */}
            <div className="mb-3 flex items-start justify-between border-b border-[#1F1F1F] pb-2">
              <div className="flex items-center gap-3">
                {/* Selection Checkbox */}
                {enableSelection && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <IndeterminateCheckbox
                      checked={row.getIsSelected()}
                      onChange={row.getToggleSelectedHandler()}
                    />
                  </div>
                )}
                <div className="font-mono text-sm font-medium text-white">
                  {mobileKey
                    ? String((row.original as any)[mobileKey])
                    : row.id}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-[#666]" />
            </div>

            {/* Mobile Card Key-Value Pairs */}
            <div className="space-y-2">
              {row.getVisibleCells().map((cell) => {
                if (cell.column.id === 'select') return null
                if (cell.column.id === mobileKey) return null

                return (
                  <div
                    key={cell.id}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#666]">
                      {typeof cell.column.columnDef.header === 'string'
                        ? cell.column.columnDef.header
                        : cell.column.id}
                    </span>
                    <div className="text-right font-mono text-white">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Mobile Empty State */}
        {filteredData.length === 0 && !isLoading && (
          <div className="py-16 text-center">
            <div className="font-mono text-sm uppercase tracking-widest text-[#666]">
              No Records Found
            </div>
          </div>
        )}
      </div>

      {/* ================================================================== */}
      {/* PAGINATION FOOTER */}
      {/* ================================================================== */}
      {enablePagination && (
        <div className="flex items-center justify-between border-t border-[#1F1F1F] bg-[#050505] px-4 py-2 font-mono text-[11px] text-[#666]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <button
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="p-1.5 transition-colors hover:text-white disabled:opacity-30"
                title="First page"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="p-1.5 transition-colors hover:text-white disabled:opacity-30"
                title="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="p-1.5 transition-colors hover:text-white disabled:opacity-30"
                title="Next page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="p-1.5 transition-colors hover:text-white disabled:opacity-30"
                title="Last page"
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <span className="hidden uppercase tracking-widest sm:inline">
              PAGE {table.getState().pagination.pageIndex + 1} OF{' '}
              {table.getPageCount() || 1}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="cursor-pointer rounded border border-[#1F1F1F] bg-[#0A0A0A] px-2 py-1 text-[11px] text-[#CCC] focus:border-[#28E7A2] focus:outline-none"
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size} rows
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* SIMPLE FOOTER (No Pagination) */}
      {/* ================================================================== */}
      {!enablePagination && (
        <div className="flex items-center justify-between border-t border-[#1F1F1F] bg-[#050505] p-2 font-mono text-[9px] text-[#444]">
          <span>
            SYNC_ID: {Math.random().toString(16).slice(2, 8).toUpperCase()}
          </span>
          <span className="text-[#28E7A2]">LIVE_CONNECTION</span>
        </div>
      )}
    </NexusCard>
  )
}
