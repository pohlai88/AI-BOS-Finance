/**
 * @aibos/bioskin - BioTable (Organism Layer)
 * 
 * Production-grade data table powered by TanStack Table + Jotai.
 * Sprint 2 deliverable per BIOSKIN 2.1 PRD.
 */

// Main component
export { BioTable, type BioTableProps, COMPONENT_META } from './BioTable';

// Virtualized table for large datasets (10k+ rows)
export {
  BioTableVirtual,
  type BioTableVirtualProps,
  VIRTUAL_COMPONENT_META,
} from './BioTableVirtual';

// Sub-components (for advanced usage)
export { BioTableHeader, type BioTableHeaderProps } from './BioTableHeader';
export {
  BioTableGlobalFilter,
  BioTableColumnFilter,
  BioTableFilterBar,
  type BioTableGlobalFilterProps,
  type BioTableColumnFilterProps,
  type BioTableFilterBarProps,
} from './BioTableFilters';
export { BioTablePagination, type BioTablePaginationProps } from './BioTablePagination';

// Hook + atoms (for custom implementations)
export {
  useBioTable,
  useResetBioTable,
  globalFilterAtom,
  sortingAtom,
  columnFiltersAtom,
  paginationAtom,
  rowSelectionAtom,
  columnVisibilityAtom,
  type UseBioTableOptions,
  type UseBioTableReturn,
} from './useBioTable';

// Export functionality (Sprint E4)
export {
  useBioTableExport,
  type ExportOptions,
  type PrintOptions,
  type UseBioTableExportReturn,
} from './useBioTableExport';

export {
  BioTableExportToolbar,
  type BioTableExportToolbarProps,
} from './BioTableExportToolbar';
