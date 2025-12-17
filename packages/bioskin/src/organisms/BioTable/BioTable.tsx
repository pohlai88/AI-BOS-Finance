/**
 * BioTable - Schema-driven data table powered by TanStack Table
 *
 * Sprint 2 Day 10 per BIOSKIN 2.1 PRD
 * Production-grade table with sorting, filtering, pagination, and selection.
 *
 * @example
 * // Basic usage
 * <BioTable schema={PaymentSchema} data={payments} />
 *
 * @example
 * // Full featured
 * <BioTable
 *   schema={PaymentSchema}
 *   data={payments}
 *   enableSorting
 *   enableFiltering
 *   enablePagination
 *   enableSelection
 *   onRowClick={handleRowClick}
 *   onSelectionChange={handleSelectionChange}
 * />
 *
 * ---
 * ## ⚡ Performance Tips
 *
 * **Bundle Size:** ~25KB (@tanstack/react-table) - Dynamic import for non-table pages:
 * ```tsx
 * const LazyTable = dynamic(() => import('@aibos/bioskin').then(m => m.BioTable), {
 *   loading: () => <LoadingState />
 * });
 * ```
 *
 * **Large Datasets (1000+ rows):** Use `BioTableVirtual` instead:
 * ```tsx
 * import { BioTableVirtual } from '@aibos/bioskin';
 * <BioTableVirtual schema={schema} data={largeData} height={600} />
 * ```
 *
 * **Memoize callbacks:**
 * ```tsx
 * const handleRowClick = useCallback((row) => { ... }, []);
 * ```
 *
 * @see PERFORMANCE.md for full optimization guide
 */

'use client';

import * as React from 'react';
import { z } from 'zod';
import { Provider as JotaiProvider } from 'jotai';
import { flexRender, type ColumnDef } from '@tanstack/react-table';
import { motion, AnimatePresence } from 'motion/react';
import { Table as TableIcon, Loader2 } from 'lucide-react';

import { cn } from '../../atoms/utils';
import { Surface } from '../../atoms/Surface';
import { Txt } from '../../atoms/Txt';
import { StatusBadge } from '../../molecules/StatusBadge';
import { EmptyState } from '../../molecules/EmptyState';
import { introspectZodSchema, type BioFieldDefinition } from '../../introspector/ZodSchemaIntrospector';

import { useBioTable, type UseBioTableOptions } from './useBioTable';
import { BioTableHeader } from './BioTableHeader';
import { BioTableFilterBar } from './BioTableFilters';
import { BioTablePagination } from './BioTablePagination';

// ============================================================
// Types
// ============================================================

export interface BioTableProps<T extends z.ZodRawShape> {
  /** Zod schema defining the row structure */
  schema: z.ZodObject<T>;
  /** Array of data to display */
  data: z.infer<z.ZodObject<T>>[];
  /** Title for the table */
  title?: string;
  /** Show title (default: true) */
  showTitle?: boolean;
  /** Columns to include (defaults to all) */
  include?: (keyof T)[];
  /** Columns to exclude */
  exclude?: (keyof T)[];
  /** Key field for row identification */
  keyField?: keyof T;

  // Feature flags
  /** Enable sorting (default: true) */
  enableSorting?: boolean;
  /** Enable filtering (default: true) */
  enableFiltering?: boolean;
  /** Enable pagination (default: true) */
  enablePagination?: boolean;
  /** Enable row selection (default: false) */
  enableSelection?: boolean;

  // Callbacks
  /** Called when a row is clicked */
  onRowClick?: (row: z.infer<z.ZodObject<T>>, index: number) => void;
  /** Called when selection changes */
  onSelectionChange?: (selected: z.infer<z.ZodObject<T>>[]) => void;

  // State
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: Error | null;
  /** Empty state message */
  emptyMessage?: string;

  // Customization
  /** Initial page size */
  pageSize?: number;
  /** Available page sizes */
  pageSizeOptions?: number[];
  /** Additional className */
  className?: string;
}

// ============================================================
// Cell Renderers
// ============================================================

function isStatusField(name: string, value: unknown): boolean {
  const statusFieldNames = ['status', 'state', 'phase', 'stage'];
  return (
    statusFieldNames.some(s => name.toLowerCase().includes(s)) &&
    typeof value === 'string'
  );
}

function formatCellValue(
  name: string,
  value: unknown,
  type: BioFieldDefinition['type']
): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">—</span>;
  }

  // Auto-detect status fields
  if (isStatusField(name, value)) {
    return <StatusBadge status={value as string} size="sm" />;
  }

  switch (type) {
    case 'boolean':
      return (
        <span className={value ? 'text-green-500' : 'text-muted-foreground'}>
          {value ? 'Yes' : 'No'}
        </span>
      );
    case 'date':
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }
      if (typeof value === 'string') {
        return new Date(value).toLocaleDateString();
      }
      return String(value);
    case 'number':
      if (typeof value === 'number') {
        return <span className="tabular-nums">{value.toLocaleString()}</span>;
      }
      return String(value);
    case 'array':
      if (Array.isArray(value)) {
        return value.length > 0 ? value.join(', ') : '—';
      }
      return String(value);
    case 'object':
      return <span className="text-muted-foreground">[Object]</span>;
    case 'enum':
      return (
        <span className="px-2 py-0.5 text-small bg-muted rounded">
          {String(value)}
        </span>
      );
    default:
      return String(value);
  }
}

// ============================================================
// Column Generator
// ============================================================

function generateColumns<T extends z.ZodRawShape>(
  fields: BioFieldDefinition[],
  include?: (keyof T)[],
  exclude?: (keyof T)[]
): ColumnDef<z.infer<z.ZodObject<T>>, unknown>[] {
  let filtered = fields;

  if (include && include.length > 0) {
    const includeSet = new Set(include.map(String));
    filtered = filtered.filter(f => includeSet.has(f.name));
  }

  if (exclude && exclude.length > 0) {
    const excludeSet = new Set(exclude.map(String));
    filtered = filtered.filter(f => !excludeSet.has(f.name));
  }

  return filtered.map(field => ({
    id: field.name,
    accessorKey: field.name,
    header: field.label,
    cell: ({ getValue }) => formatCellValue(field.name, getValue(), field.type),
    enableSorting: true,
    enableColumnFilter: true,
  }));
}

// ============================================================
// Internal Table Component (uses hook)
// ============================================================

function BioTableInternal<T extends z.ZodRawShape>({
  schema,
  data,
  title,
  showTitle = true,
  include,
  exclude,
  keyField,
  enableSorting = true,
  enableFiltering = true,
  enablePagination = true,
  enableSelection = false,
  onRowClick,
  onSelectionChange,
  loading = false,
  error = null,
  emptyMessage = 'No data available',
  pageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  className,
}: BioTableProps<T>) {
  // Introspect schema
  const definition = React.useMemo(() => introspectZodSchema(schema), [schema]);

  // Generate columns
  const columns = React.useMemo(
    () => generateColumns<T>(definition.fields, include, exclude),
    [definition.fields, include, exclude]
  );

  // Create table instance with jotai state
  const { table, sorting, filtering, pagination, selection, meta } = useBioTable({
    data,
    columns,
    enableSorting,
    enableFiltering,
    enablePagination,
    enableRowSelection: enableSelection,
    pageSize,
    pageSizeOptions,
    getRowId: keyField
      ? (row) => String((row as Record<string, unknown>)[keyField as string])
      : undefined,
  });

  // Notify parent of selection changes
  React.useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selection.selectedRows);
    }
  }, [selection.selectedRows, onSelectionChange]);

  const displayTitle = title || (definition.name !== 'Object' ? definition.name : undefined);

  // Error state
  if (error) {
    return (
      <Surface padding="lg" className={className}>
        <div className="text-center py-8">
          <Txt variant="body" color="danger">
            Error: {error.message}
          </Txt>
        </div>
      </Surface>
    );
  }

  // Loading state
  if (loading) {
    return (
      <Surface padding="lg" className={cn('overflow-hidden', className)}>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Surface>
    );
  }

  // Empty state
  if (meta.isEmpty) {
    return (
      <EmptyState
        icon={TableIcon}
        title="No data"
        description={emptyMessage}
        className={className}
      />
    );
  }

  return (
    <Surface padding="none" className={cn('overflow-hidden', className)} data-testid="bio-table">
      {/* Header */}
      {(showTitle && displayTitle) || enableFiltering ? (
        <div className="px-6 py-4 border-b border-border space-y-4">
          {showTitle && displayTitle && (
            <Txt variant="subheading" as="h3">
              {displayTitle}
            </Txt>
          )}

          {enableFiltering && (
            <BioTableFilterBar
              table={table}
              globalFilter={filtering.global}
              onGlobalFilterChange={filtering.setGlobal}
              onClearFilters={filtering.clear}
            />
          )}
        </div>
      ) : null}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <BioTableHeader
            table={table}
            enableSelection={enableSelection}
          />

          <tbody className="divide-y divide-border">
            <AnimatePresence mode="popLayout">
              {table.getRowModel().rows.map((row, index) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15, delay: index * 0.02 }}
                  onClick={() => onRowClick?.(row.original, row.index)}
                  className={cn(
                    'transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-muted/50',
                    row.getIsSelected() && 'bg-primary/5'
                  )}
                >
                  {/* Selection checkbox */}
                  {enableSelection && (
                    <td className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={row.getIsSelected()}
                        disabled={!row.getCanSelect()}
                        onChange={row.getToggleSelectedHandler()}
                        className={cn(
                          'h-4 w-4 rounded border-border',
                          'text-primary focus:ring-ring focus:ring-offset-0',
                          'cursor-pointer'
                        )}
                        aria-label={`Select row ${row.index + 1}`}
                      />
                    </td>
                  )}

                  {/* Data cells */}
                  {row.getVisibleCells().map(cell => (
                    <td
                      key={cell.id}
                      className="px-4 py-3 text-body text-foreground"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {enablePagination && (
        <BioTablePagination
          pageIndex={pagination.pageIndex}
          pageSize={pagination.pageSize}
          pageCount={pagination.pageCount}
          totalRows={meta.filteredRows}
          canPreviousPage={pagination.canPreviousPage}
          canNextPage={pagination.canNextPage}
          onPageChange={pagination.goToPage}
          onNextPage={pagination.nextPage}
          onPreviousPage={pagination.previousPage}
          onPageSizeChange={pagination.setPageSize}
          pageSizeOptions={pageSizeOptions}
        />
      )}
    </Surface>
  );
}

// ============================================================
// Main Export (with Jotai Provider)
// ============================================================

export function BioTable<T extends z.ZodRawShape>(props: BioTableProps<T>) {
  return (
    <JotaiProvider>
      <BioTableInternal {...props} />
    </JotaiProvider>
  );
}

BioTable.displayName = 'BioTable';

export const COMPONENT_META = {
  code: 'BIOSKIN_BioTable',
  version: '2.0.0',
  layer: 'organisms',
  family: 'DATA',
  status: 'stable',
  poweredBy: ['@tanstack/react-table', 'jotai', 'motion'],
} as const;
