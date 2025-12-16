'use client';

/**
 * @aibos/bioskin/table - Granular entry point for BioTable
 *
 * Use this for better tree-shaking when you only need table components.
 *
 * @example
 * import { BioTable, BioTableVirtual } from '@aibos/bioskin/table';
 *
 * @see PERFORMANCE.md for optimization guide
 */

export { BioTable, type BioTableProps } from './organisms/BioTable';
export { BioTableVirtual, type BioTableVirtualProps } from './organisms/BioTable/BioTableVirtual';
export { useBioTable, useResetBioTable, type UseBioTableOptions, type UseBioTableReturn } from './organisms/BioTable/useBioTable';
export { useBioTableExport, type UseBioTableExportOptions } from './organisms/BioTable/useBioTableExport';
export { BioTableExportToolbar, type BioTableExportToolbarProps } from './organisms/BioTable/BioTableExportToolbar';
