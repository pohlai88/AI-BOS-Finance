// ============================================================================
// SUPERTABLE v2.0 - MERGED IMPLEMENTATION
// Combines: Generic Type Support + Mobile Responsive + Full Feature Set
// Engine: TanStack Table v8 (Headless)
// ============================================================================

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
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
} from '@tanstack/react-table';
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
} from 'lucide-react';
import { NexusCard } from '../nexus/NexusCard';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface SuperTableProps<T> {
  // Data & Columns
  data: T[];
  columns: ColumnDef<T, any>[];
  title?: string;

  // Mobile config
  mobileKey?: keyof T;

  // Feature Flags
  enableSelection?: boolean;
  enablePagination?: boolean;
  enableColumnVisibility?: boolean;
  enableColumnFilters?: boolean;
  enableGlobalFilter?: boolean;

  // Handlers
  onRowClick?: (row: T) => void;
  onSelectionChange?: (selectedRows: T[]) => void;

  // Loading state
  isLoading?: boolean;
}

// ============================================================================
// INDETERMINATE CHECKBOX COMPONENT
// ============================================================================

function IndeterminateCheckbox({
  indeterminate,
  className,
  ...rest
}: { indeterminate?: boolean } & React.HTMLProps<HTMLInputElement>) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current && typeof indeterminate === 'boolean') {
      ref.current.indeterminate = !rest.checked && indeterminate;
    }
  }, [indeterminate, rest.checked]);

  return (
    <input
      type="checkbox"
      ref={ref}
      {...rest}
      className={cn(
        'appearance-none w-4 h-4 border border-[#333] bg-[#0A0A0A] checked:bg-[#28E7A2] checked:border-[#28E7A2] rounded-sm cursor-pointer transition-colors',
        className
      )}
    />
  );
}

// ============================================================================
// SORTING INDICATOR COMPONENT
// ============================================================================

function SortIndicator({ isSorted }: { isSorted: false | 'asc' | 'desc' }) {
  if (isSorted === 'asc') {
    return <ChevronUp className="w-3 h-3 text-[#28E7A2]" />;
  }
  if (isSorted === 'desc') {
    return <ChevronDown className="w-3 h-3 text-[#28E7A2]" />;
  }
  return <ChevronsUpDown className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />;
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
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Debounced global filter
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedGlobalFilter(globalFilter), 300);
    return () => clearTimeout(timer);
  }, [globalFilter]);

  // === INJECT SELECTION COLUMN IF ENABLED ===
  const finalColumns = useMemo(() => {
    if (!enableSelection) return columns;

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
        <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
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
    };

    return [selectColumn, ...columns];
  }, [columns, enableSelection]);

  // === APPLY COLUMN FILTERS TO DATA ===
  const filteredData = useMemo(() => {
    let result = data;

    // Global filter
    if (debouncedGlobalFilter) {
      const query = debouncedGlobalFilter.toLowerCase();
      result = result.filter((record) =>
        Object.values(record as object).some((value) =>
          String(value).toLowerCase().includes(query)
        )
      );
    }

    // Per-column filters
    Object.entries(columnFilters).forEach(([columnId, filterValue]) => {
      if (filterValue) {
        result = result.filter((record) => {
          const value = String((record as any)[columnId] || '').toLowerCase();
          return value.includes(filterValue.toLowerCase());
        });
      }
    });

    return result;
  }, [data, debouncedGlobalFilter, columnFilters]);

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
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });

  // === SELECTION CHANGE CALLBACK ===
  useEffect(() => {
    if (onSelectionChange && enableSelection) {
      const selectedRows = table.getFilteredSelectedRowModel().rows.map((row) => row.original);
      onSelectionChange(selectedRows);
    }
  }, [rowSelection, onSelectionChange, enableSelection, table]);

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  // === HELPER: Clear column filter ===
  const clearColumnFilter = useCallback((columnId: string) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      delete next[columnId];
      return next;
    });
  }, []);

  // === RENDER ===
  return (
    <NexusCard variant="default" className="p-0 overflow-hidden flex flex-col h-full min-h-[500px]">
      {/* ================================================================== */}
      {/* HEADER BAR */}
      {/* ================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border-b border-[#1F1F1F] bg-[#0A0A0A] gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-2 h-2 rounded-full bg-[#28E7A2] shadow-[0_0_8px_rgba(40,231,162,0.5)] animate-pulse" />
          <span className="text-[#CCC] text-[13px] font-medium tracking-wide">
            {title || 'DATA_REGISTRY'}
          </span>
          <span className="text-[#555] text-[12px] font-mono">
            // {filteredData.length} RECORDS
          </span>
          {selectedCount > 0 && (
            <span className="px-2 py-1 bg-[#28E7A2]/10 border border-[#28E7A2]/30 rounded text-[11px] text-[#28E7A2] font-mono">
              {selectedCount} selected
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Global Search */}
          {enableGlobalFilter && (
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#444]" />
              <input
                type="text"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Search..."
                className="h-8 pl-9 pr-4 bg-[#050505] border border-[#1F1F1F] rounded text-white text-[12px] font-mono focus:outline-none focus:border-[#28E7A2] placeholder:text-[#333] w-full md:w-48"
              />
            </div>
          )}

          {/* Mobile Filter Button */}
          {enableColumnFilters && (
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="md:hidden h-8 w-8 flex items-center justify-center border border-[#1F1F1F] rounded hover:border-[#28E7A2] text-[#666] hover:text-[#28E7A2] transition-colors"
            >
              <Filter className="w-4 h-4" />
            </button>
          )}

          {/* Bulk Actions */}
          {selectedCount > 0 && (
            <div className="flex items-center gap-1">
              <button className="p-2 border border-[#1F1F1F] rounded hover:border-[#28E7A2] transition-colors" title="Edit selected">
                <Edit className="w-4 h-4 text-[#666]" />
              </button>
              <button className="p-2 border border-[#1F1F1F] rounded hover:border-red-400 transition-colors" title="Delete selected">
                <Trash2 className="w-4 h-4 text-[#666]" />
              </button>
            </div>
          )}

          {/* Column Visibility Toggle */}
          {enableColumnVisibility && (
            <button
              onClick={() => setShowColumnManager(!showColumnManager)}
              className={cn(
                'hidden md:flex p-2 border rounded transition-colors',
                showColumnManager
                  ? 'bg-[#28E7A2]/10 border-[#28E7A2] text-[#28E7A2]'
                  : 'border-[#1F1F1F] text-[#666] hover:border-[#28E7A2] hover:text-[#28E7A2]'
              )}
              title="Column visibility"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ================================================================== */}
      {/* COLUMN VISIBILITY MANAGER (Desktop) */}
      {/* ================================================================== */}
      {showColumnManager && enableColumnVisibility && (
        <div className="hidden md:block border-b border-[#1F1F1F] p-3 bg-[#050505]">
          <div className="text-[10px] font-mono text-[#666] uppercase tracking-widest mb-2">
            Column Visibility
          </div>
          <div className="flex flex-wrap gap-2">
            {table.getAllLeafColumns().map((column) => {
              if (column.id === 'select') return null;
              return (
                <label
                  key={column.id}
                  className="flex items-center gap-2 px-2 py-1 bg-[#0A0A0A] border border-[#1F1F1F] rounded hover:border-[#28E7A2] cursor-pointer transition-colors text-[11px]"
                >
                  <input
                    type="checkbox"
                    checked={column.getIsVisible()}
                    onChange={column.getToggleVisibilityHandler()}
                    className="w-3 h-3 rounded border border-[#333] bg-[#0A0A0A] checked:bg-[#28E7A2] checked:border-[#28E7A2]"
                  />
                  <span className="font-mono text-[#CCC]">
                    {typeof column.columnDef.header === 'string'
                      ? column.columnDef.header
                      : column.id.toUpperCase()}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* MOBILE FILTER DRAWER */}
      {/* ================================================================== */}
      {showMobileFilters && enableColumnFilters && (
        <div className="md:hidden border-b border-[#1F1F1F] p-4 bg-[#050505] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-[#666] uppercase tracking-widest">
              Column Filters
            </span>
            <button
              onClick={() => setShowMobileFilters(false)}
              className="text-[#666] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {table.getAllLeafColumns().map((column) => {
            if (column.id === 'select' || !column.getCanSort()) return null;
            const columnId = column.id;
            return (
              <div key={columnId} className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-[#888] uppercase tracking-wider">
                  {typeof column.columnDef.header === 'string'
                    ? column.columnDef.header
                    : columnId}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={columnFilters[columnId] || ''}
                    onChange={(e) =>
                      setColumnFilters((prev) => ({ ...prev, [columnId]: e.target.value }))
                    }
                    placeholder="Filter..."
                    className="h-8 w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded px-3 text-[12px] text-white placeholder:text-[#333] font-mono focus:outline-none focus:border-[#28E7A2]"
                  />
                  {columnFilters[columnId] && (
                    <button
                      onClick={() => clearColumnFilter(columnId)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#666] hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================================================================== */}
      {/* DESKTOP TABLE VIEW */}
      {/* ================================================================== */}
      <div className="hidden md:block flex-1 overflow-auto bg-[#050505]">
        <table className="w-full border-collapse text-left min-w-[1000px]">
          <thead className="sticky top-0 z-10 bg-[#050505] shadow-[0_1px_0_#1F1F1F]">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                    className="p-3 border-b border-[#1F1F1F] align-top"
                  >
                    <div className="flex flex-col gap-1">
                      {/* Column Header with Sort */}
                      <div
                        className={cn(
                          'flex items-center justify-between font-mono tracking-widest text-[#666] uppercase text-[10px] group',
                          header.column.getCanSort() && 'cursor-pointer hover:text-[#28E7A2] transition-colors'
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <SortIndicator isSorted={header.column.getIsSorted()} />
                        )}
                      </div>

                      {/* Per-Column Filter */}
                      {enableColumnFilters && header.id !== 'select' && header.column.getCanSort() && (
                        <input
                          type="text"
                          value={columnFilters[header.id] || ''}
                          onChange={(e) =>
                            setColumnFilters((prev) => ({ ...prev, [header.id]: e.target.value }))
                          }
                          placeholder="Filter..."
                          onClick={(e) => e.stopPropagation()}
                          className="h-7 w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded px-2 text-[11px] text-[#CCC] placeholder-[#333] focus:outline-none focus:border-[#333] font-mono"
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
                  'border-b border-[#111] cursor-pointer transition-colors',
                  row.getIsSelected()
                    ? 'bg-[#28E7A2]/5 hover:bg-[#28E7A2]/10'
                    : 'hover:bg-[#0A0A0A]'
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-3 align-middle">
                    <div className="font-mono text-xs">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
            <div className="text-[#666] font-mono uppercase tracking-widest text-sm">
              No Records Found
            </div>
            <div className="text-[#444] font-mono text-xs mt-2">
              Adjust filters or search criteria
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-2 border-[#28E7A2] border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="text-[#666] font-mono uppercase tracking-widest text-xs mt-4">
              Loading...
            </div>
          </div>
        )}
      </div>

      {/* ================================================================== */}
      {/* MOBILE CARD VIEW */}
      {/* ================================================================== */}
      <div className="md:hidden flex-1 overflow-auto bg-[#050505] p-4 space-y-3">
        {table.getRowModel().rows.map((row) => (
          <div
            key={row.id}
            onClick={() => onRowClick?.(row.original)}
            className={cn(
              'bg-[#0A0A0A] border rounded p-4 transition-colors',
              row.getIsSelected()
                ? 'border-[#28E7A2] bg-[#28E7A2]/5'
                : 'border-[#1F1F1F] active:border-[#28E7A2]'
            )}
          >
            {/* Mobile Card Header */}
            <div className="flex justify-between items-start mb-3 border-b border-[#1F1F1F] pb-2">
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
                <div className="font-mono text-sm text-white font-medium">
                  {mobileKey ? String((row.original as any)[mobileKey]) : row.id}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#666]" />
            </div>

            {/* Mobile Card Key-Value Pairs */}
            <div className="space-y-2">
              {row.getVisibleCells().map((cell) => {
                if (cell.column.id === 'select') return null;
                if (cell.column.id === mobileKey) return null;

                return (
                  <div key={cell.id} className="flex justify-between items-center text-xs">
                    <span className="text-[#666] font-mono uppercase text-[10px] tracking-wider">
                      {typeof cell.column.columnDef.header === 'string'
                        ? cell.column.columnDef.header
                        : cell.column.id}
                    </span>
                    <div className="text-white font-mono text-right">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Mobile Empty State */}
        {filteredData.length === 0 && !isLoading && (
          <div className="py-16 text-center">
            <div className="text-[#666] font-mono uppercase tracking-widest text-sm">
              No Records Found
            </div>
          </div>
        )}
      </div>

      {/* ================================================================== */}
      {/* PAGINATION FOOTER */}
      {/* ================================================================== */}
      {enablePagination && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-[#1F1F1F] bg-[#050505] font-mono text-[#666] text-[11px]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <button
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="p-1.5 hover:text-white disabled:opacity-30 transition-colors"
                title="First page"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="p-1.5 hover:text-white disabled:opacity-30 transition-colors"
                title="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="p-1.5 hover:text-white disabled:opacity-30 transition-colors"
                title="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="p-1.5 hover:text-white disabled:opacity-30 transition-colors"
                title="Last page"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="uppercase tracking-widest hidden sm:inline">
              PAGE {table.getState().pagination.pageIndex + 1} OF{' '}
              {table.getPageCount() || 1}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="bg-[#0A0A0A] border border-[#1F1F1F] rounded px-2 py-1 text-[11px] text-[#CCC] focus:outline-none focus:border-[#28E7A2] cursor-pointer"
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
        <div className="p-2 border-t border-[#1F1F1F] bg-[#050505] flex justify-between items-center text-[9px] font-mono text-[#444]">
          <span>SYNC_ID: {Math.random().toString(16).slice(2, 8).toUpperCase()}</span>
          <span className="text-[#28E7A2]">LIVE_CONNECTION</span>
        </div>
      )}
    </NexusCard>
  );
}
