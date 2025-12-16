/**
 * useBioTable - TanStack Table + Jotai state management hook
 * 
 * Sprint 2 Day 6 per BIOSKIN 2.1 PRD
 * Provides reactive table state with sorting, filtering, pagination.
 * 
 * @example
 * const { table, sorting, filtering, pagination } = useBioTable({
 *   data,
 *   columns,
 *   enableSorting: true,
 *   enableFiltering: true,
 *   enablePagination: true,
 * });
 */

import * as React from 'react';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type PaginationState,
  type RowSelectionState,
  type VisibilityState,
  type Table,
} from '@tanstack/react-table';

// ============================================================
// Jotai Atoms - Atomic state for table features
// ============================================================

/** Global filter atom (search across all columns) */
export const globalFilterAtom = atom<string>('');

/** Sorting state atom */
export const sortingAtom = atom<SortingState>([]);

/** Column filters atom */
export const columnFiltersAtom = atom<ColumnFiltersState>([]);

/** Pagination state atom */
export const paginationAtom = atom<PaginationState>({
  pageIndex: 0,
  pageSize: 10,
});

/** Row selection atom */
export const rowSelectionAtom = atom<RowSelectionState>({});

/** Column visibility atom */
export const columnVisibilityAtom = atom<VisibilityState>({});

// ============================================================
// Hook Configuration
// ============================================================

export interface UseBioTableOptions<TData> {
  /** Table data */
  data: TData[];
  /** Column definitions */
  columns: ColumnDef<TData, unknown>[];
  /** Enable sorting (default: true) */
  enableSorting?: boolean;
  /** Enable filtering (default: true) */
  enableFiltering?: boolean;
  /** Enable pagination (default: true) */
  enablePagination?: boolean;
  /** Enable row selection (default: false) */
  enableRowSelection?: boolean;
  /** Enable multi-row selection (default: true if selection enabled) */
  enableMultiRowSelection?: boolean;
  /** Initial page size (default: 10) */
  pageSize?: number;
  /** Available page sizes (default: [10, 20, 50, 100]) */
  pageSizeOptions?: number[];
  /** Row ID accessor for selection */
  getRowId?: (row: TData) => string;
}

export interface UseBioTableReturn<TData> {
  /** TanStack table instance */
  table: Table<TData>;

  /** Sorting state and controls */
  sorting: {
    state: SortingState;
    set: (value: SortingState) => void;
    toggle: (columnId: string) => void;
    clear: () => void;
  };

  /** Filtering state and controls */
  filtering: {
    global: string;
    setGlobal: (value: string) => void;
    columns: ColumnFiltersState;
    setColumn: (columnId: string, value: unknown) => void;
    clear: () => void;
  };

  /** Pagination state and controls */
  pagination: {
    pageIndex: number;
    pageSize: number;
    pageCount: number;
    canPreviousPage: boolean;
    canNextPage: boolean;
    goToPage: (page: number) => void;
    nextPage: () => void;
    previousPage: () => void;
    setPageSize: (size: number) => void;
    pageSizeOptions: number[];
  };

  /** Selection state and controls */
  selection: {
    state: RowSelectionState;
    selectedRows: TData[];
    isAllSelected: boolean;
    isSomeSelected: boolean;
    toggleRow: (rowId: string) => void;
    toggleAll: () => void;
    clear: () => void;
  };

  /** Meta information */
  meta: {
    totalRows: number;
    filteredRows: number;
    visibleRows: number;
    isEmpty: boolean;
  };
}

// ============================================================
// Main Hook
// ============================================================

export function useBioTable<TData>({
  data,
  columns,
  enableSorting = true,
  enableFiltering = true,
  enablePagination = true,
  enableRowSelection = false,
  enableMultiRowSelection = true,
  pageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  getRowId,
}: UseBioTableOptions<TData>): UseBioTableReturn<TData> {
  // Jotai atoms for state
  const [sorting, setSorting] = useAtom(sortingAtom);
  const [columnFilters, setColumnFilters] = useAtom(columnFiltersAtom);
  const [globalFilter, setGlobalFilter] = useAtom(globalFilterAtom);
  const [pagination, setPagination] = useAtom(paginationAtom);
  const [rowSelection, setRowSelection] = useAtom(rowSelectionAtom);
  const [columnVisibility, setColumnVisibility] = useAtom(columnVisibilityAtom);

  // Initialize page size
  React.useEffect(() => {
    setPagination(prev => ({
      ...prev,
      pageSize,
    }));
  }, [pageSize, setPagination]);

  // Create TanStack table instance
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
      rowSelection,
      columnVisibility,
    },
    // State setters
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    // Row models
    getCoreRowModel: getCoreRowModel(),
    ...(enableSorting && { getSortedRowModel: getSortedRowModel() }),
    ...(enableFiltering && { getFilteredRowModel: getFilteredRowModel() }),
    ...(enablePagination && { getPaginationRowModel: getPaginationRowModel() }),
    // Options
    enableSorting,
    enableFilters: enableFiltering,
    enableRowSelection,
    enableMultiRowSelection,
    getRowId,
  });

  // ============================================================
  // Derived Values
  // ============================================================

  const filteredRows = table.getFilteredRowModel().rows;
  const selectedRows = React.useMemo(
    () => table.getSelectedRowModel().rows.map(row => row.original),
    [table, rowSelection]
  );

  // ============================================================
  // Return API
  // ============================================================

  return {
    table,

    sorting: {
      state: sorting,
      set: setSorting,
      toggle: (columnId: string) => {
        const column = table.getColumn(columnId);
        if (column) {
          column.toggleSorting();
        }
      },
      clear: () => setSorting([]),
    },

    filtering: {
      global: globalFilter,
      setGlobal: setGlobalFilter,
      columns: columnFilters,
      setColumn: (columnId: string, value: unknown) => {
        setColumnFilters(prev => {
          const existing = prev.find(f => f.id === columnId);
          if (existing) {
            return prev.map(f => f.id === columnId ? { ...f, value } : f);
          }
          return [...prev, { id: columnId, value }];
        });
      },
      clear: () => {
        setGlobalFilter('');
        setColumnFilters([]);
      },
    },

    pagination: {
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      pageCount: table.getPageCount(),
      canPreviousPage: table.getCanPreviousPage(),
      canNextPage: table.getCanNextPage(),
      goToPage: (page: number) => table.setPageIndex(page),
      nextPage: () => table.nextPage(),
      previousPage: () => table.previousPage(),
      setPageSize: (size: number) => table.setPageSize(size),
      pageSizeOptions,
    },

    selection: {
      state: rowSelection,
      selectedRows,
      isAllSelected: table.getIsAllRowsSelected(),
      isSomeSelected: table.getIsSomeRowsSelected(),
      toggleRow: (rowId: string) => {
        const row = table.getRow(rowId);
        if (row) {
          row.toggleSelected();
        }
      },
      toggleAll: () => table.toggleAllRowsSelected(),
      clear: () => setRowSelection({}),
    },

    meta: {
      totalRows: data.length,
      filteredRows: filteredRows.length,
      visibleRows: table.getRowModel().rows.length,
      isEmpty: data.length === 0,
    },
  };
}

// ============================================================
// Utility: Reset table state
// ============================================================

export function useResetBioTable() {
  const setSorting = useSetAtom(sortingAtom);
  const setColumnFilters = useSetAtom(columnFiltersAtom);
  const setGlobalFilter = useSetAtom(globalFilterAtom);
  const setPagination = useSetAtom(paginationAtom);
  const setRowSelection = useSetAtom(rowSelectionAtom);

  return React.useCallback(() => {
    setSorting([]);
    setColumnFilters([]);
    setGlobalFilter('');
    setPagination({ pageIndex: 0, pageSize: 10 });
    setRowSelection({});
  }, [setSorting, setColumnFilters, setGlobalFilter, setPagination, setRowSelection]);
}
