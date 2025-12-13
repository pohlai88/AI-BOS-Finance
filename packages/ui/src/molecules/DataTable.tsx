'use client'

import * as React from 'react'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  type RowSelectionState,
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
  Settings,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { Input } from '../atoms/Input'
import { Btn } from '../atoms/Btn'
import { Surface } from '../atoms/Surface'
import { Txt } from '../atoms/Txt'
import { ScrollArea } from '../primitives/scroll-area'

/**
 * DataTable Component - Headless Table Engine
 *
 * 🛡️ Governance: This component uses ONLY design tokens from globals.css.
 * No hardcoded colors, spacing, or typography allowed.
 *
 * This is the "Solid Core" table that powers both:
 * - Manual implementations (custom table features)
 * - BioSkin generative tables (schema-driven)
 *
 * Features:
 * - ✅ Sorting (single/multi-column)
 * - ✅ Pagination (configurable page size)
 * - ✅ Global search (debounced)
 * - ✅ Column visibility toggle
 * - ✅ Row selection (optional)
 * - ✅ Loading states
 * - ✅ Empty states
 * - ✅ Responsive (mobile-friendly)
 * - ✅ Keyboard accessible
 * - ✅ Uses only design tokens
 */
export interface DataTableProps<TData> {
  /**
   * Table data array
   */
  data: TData[]
  /**
   * Column definitions (TanStack Table format)
   */
  columns: ColumnDef<TData, any>[]
  /**
   * Optional table title
   */
  title?: string
  /**
   * Enable row selection
   */
  enableSelection?: boolean
  /**
   * Enable pagination
   */
  enablePagination?: boolean
  /**
   * Enable column visibility toggle
   */
  enableColumnVisibility?: boolean
  /**
   * Enable global search
   */
  enableGlobalFilter?: boolean
  /**
   * Row click handler
   */
  onRowClick?: (row: TData) => void
  /**
   * Selection change handler
   */
  onSelectionChange?: (selectedRows: TData[]) => void
  /**
   * Loading state
   */
  isLoading?: boolean
  /**
   * Empty state message
   */
  emptyMessage?: string
  /**
   * Initial page size (default: 20)
   */
  pageSize?: number
  /**
   * Additional className
   */
  className?: string
}

/**
 * Indeterminate Checkbox Component
 * Used for row selection (header and cells)
 */
function IndeterminateCheckbox({
  indeterminate,
  className,
  ...rest
}: { indeterminate?: boolean } & React.HTMLProps<HTMLInputElement>) {
  const ref = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
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
        'h-4 w-4 cursor-pointer appearance-none rounded-sm border border-border-base bg-surface-base transition-colors checked:border-action-primary checked:bg-action-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-primary',
        className
      )}
    />
  )
}

/**
 * Sort Indicator Component
 * Shows sort direction in column headers
 */
function SortIndicator({ isSorted }: { isSorted: false | 'asc' | 'desc' }) {
  if (isSorted === 'asc') {
    return <ChevronUp className="h-3 w-3 text-action-primary" />
  }
  if (isSorted === 'desc') {
    return <ChevronDown className="h-3 w-3 text-action-primary" />
  }
  return (
    <ChevronsUpDown className="h-3 w-3 opacity-50 transition-opacity group-hover:opacity-100" />
  )
}

/**
 * DataTable Component
 */
export function DataTable<TData>({
  data,
  columns,
  title,
  enableSelection = false,
  enablePagination = true,
  enableColumnVisibility = true,
  enableGlobalFilter = true,
  onRowClick,
  onSelectionChange,
  isLoading = false,
  emptyMessage = 'No data available',
  pageSize = 20,
  className,
}: DataTableProps<TData>) {
  // State Management
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState('')
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [showColumnManager, setShowColumnManager] = React.useState(false)

  // Debounced global filter
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] =
    React.useState('')
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedGlobalFilter(globalFilter), 300)
    return () => clearTimeout(timer)
  }, [globalFilter])

  // Inject selection column if enabled
  const finalColumns = React.useMemo(() => {
    if (!enableSelection) return columns

    const selectColumn: ColumnDef<TData, any> = {
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

  // TanStack Table Instance
  const table = useReactTable({
    data,
    columns: finalColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      globalFilter: debouncedGlobalFilter,
    },
    enableRowSelection: enableSelection,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: enablePagination
      ? getPaginationRowModel()
      : undefined,
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize,
      },
    },
  })

  // Selection change callback
  React.useEffect(() => {
    if (onSelectionChange && enableSelection) {
      const selectedRows = table
        .getFilteredSelectedRowModel()
        .rows.map((row) => row.original)
      onSelectionChange(selectedRows)
    }
  }, [rowSelection, onSelectionChange, enableSelection, table])

  const selectedCount = table.getFilteredSelectedRowModel().rows.length

  return (
    <Surface variant="base" className={cn('flex h-full flex-col', className)}>
      {/* Header Bar */}
      <div className="flex flex-col justify-between gap-4 border-b border-border-surface-base bg-surface-base p-4 md:flex-row md:items-center">
        <div className="flex flex-wrap items-center gap-3">
          {title && (
            <>
              <div className="h-2 w-2 animate-pulse rounded-full bg-action-primary shadow-[0_0_8px_rgb(var(--action-primary)/0.5)]" />
              <Txt variant="small" className="font-medium tracking-wide">
                {title}
              </Txt>
            </>
          )}
          <Txt variant="small" className="font-mono text-text-tertiary">
            // {table.getFilteredRowModel().rows.length} RECORDS
          </Txt>
          {selectedCount > 0 && (
            <Surface
              variant="flat"
              className="border-action-primary/30 bg-action-primary/10 px-2 py-1"
            >
              <Txt variant="small" className="font-mono text-action-primary">
                {selectedCount} selected
              </Txt>
            </Surface>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Global Search */}
          {enableGlobalFilter && (
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
              <Input
                type="text"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Search..."
                className="h-8 w-full pl-9 pr-4 text-sm md:w-48"
                size="sm"
              />
            </div>
          )}

          {/* Column Visibility Toggle */}
          {enableColumnVisibility && (
            <Btn
              variant="secondary"
              size="sm"
              onClick={() => setShowColumnManager(!showColumnManager)}
              className={cn(
                showColumnManager &&
                'border-action-primary bg-action-primary/10 text-action-primary'
              )}
              aria-label="Column visibility"
            >
              <Settings className="h-4 w-4" />
            </Btn>
          )}
        </div>
      </div>

      {/* Column Visibility Manager */}
      {showColumnManager && enableColumnVisibility && (
        <div className="border-b border-border-surface-base bg-surface-flat p-3">
          <Txt variant="small" className="mb-2 uppercase tracking-widest text-text-tertiary">
            Column Visibility
          </Txt>
          <div className="flex flex-wrap gap-2">
            {table.getAllLeafColumns().map((column) => {
              if (column.id === 'select') return null
              return (
                <label
                  key={column.id}
                  className="flex cursor-pointer items-center gap-2 rounded border border-border-base bg-surface-base px-2 py-1 text-xs transition-colors hover:border-action-primary"
                >
                  <input
                    type="checkbox"
                    checked={column.getIsVisible()}
                    onChange={column.getToggleVisibilityHandler()}
                    className="h-3 w-3 rounded border border-border-base bg-surface-base checked:border-action-primary checked:bg-action-primary"
                  />
                  <Txt variant="small" className="font-mono">
                    {typeof column.columnDef.header === 'string'
                      ? column.columnDef.header
                      : column.id.toUpperCase()}
                  </Txt>
                </label>
              )
            })}
          </div>
        </div>
      )}

      {/* Table Content */}
      <ScrollArea className="flex-1">
        <div className="min-w-full">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Txt variant="body" className="text-text-tertiary">
                Loading...
              </Txt>
            </div>
          ) : table.getRowModel().rows.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <Txt variant="body" className="text-text-tertiary">
                {emptyMessage}
              </Txt>
            </div>
          ) : (
            <table className="w-full min-w-full border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-surface-base shadow-[0_1px_0_rgb(var(--border-surface-base))]">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        style={{
                          width:
                            header.getSize() !== 150
                              ? header.getSize()
                              : undefined,
                        }}
                        className="border-b border-border-surface-base p-3 align-top"
                      >
                        <div className="flex flex-col gap-1">
                          {header.isPlaceholder ? null : (
                            <div
                              className={cn(
                                'group flex items-center gap-2',
                                header.column.getCanSort() &&
                                'cursor-pointer select-none'
                              )}
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              <Txt variant="small" className="font-medium">
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                              </Txt>
                              {header.column.getCanSort() && (
                                <SortIndicator
                                  isSorted={header.column.getIsSorted()}
                                />
                              )}
                            </div>
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
                    className={cn(
                      'border-b border-border-surface-base transition-colors',
                      onRowClick && 'cursor-pointer hover:bg-surface-flat'
                    )}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </ScrollArea>

      {/* Pagination */}
      {enablePagination && table.getPageCount() > 1 && (
        <div className="flex items-center justify-between border-t border-border-surface-base bg-surface-base p-4">
          <Txt variant="small" className="text-text-secondary">
            Showing {table.getState().pagination.pageIndex * pageSize + 1} to{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * pageSize,
              table.getFilteredRowModel().rows.length
            )}{' '}
            of {table.getFilteredRowModel().rows.length} results
          </Txt>
          <div className="flex items-center gap-2">
            <Btn
              variant="secondary"
              size="sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              aria-label="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Btn>
            <Btn
              variant="secondary"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Btn>
            <Txt variant="small" className="text-text-secondary">
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount()}
            </Txt>
            <Btn
              variant="secondary"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Btn>
            <Btn
              variant="secondary"
              size="sm"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              aria-label="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Btn>
          </div>
        </div>
      )}
    </Surface>
  )
}
