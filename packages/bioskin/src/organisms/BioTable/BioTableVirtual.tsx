/**
 * BioTableVirtual - Virtualized table for large datasets (10k+ rows)
 *
 * Sprint E5: Performance Hardening
 * Uses @tanstack/react-virtual for windowed rendering.
 *
 * @example
 * <BioTableVirtual
 *   schema={InvoiceSchema}
 *   data={largeDataset} // 10k+ rows
 *   height={600} // Fixed height required for virtualization
 * />
 */

'use client';

import * as React from 'react';
import { z } from 'zod';
import { Provider as JotaiProvider } from 'jotai';
import { flexRender, type ColumnDef } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
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

// ============================================================
// Types
// ============================================================

export interface BioTableVirtualProps<T extends z.ZodRawShape> {
  /** Zod schema defining the row structure */
  schema: z.ZodObject<T>;
  /** Array of data to display */
  data: z.infer<z.ZodObject<T>>[];
  /** Fixed height for the virtualized container (required) */
  height: number;
  /** Estimated row height for virtualization (default: 48) */
  estimatedRowHeight?: number;
  /** Overscan count - extra rows to render above/below visible (default: 5) */
  overscan?: number;
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

  /** Additional className */
  className?: string;
}

// ============================================================
// Cell Renderers (shared with BioTable)
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
    return <span className="text-text-disabled">—</span>;
  }

  if (isStatusField(name, value)) {
    return <StatusBadge status={value as string} size="sm" />;
  }

  switch (type) {
    case 'boolean':
      return (
        <span className={value ? 'text-status-success' : 'text-text-secondary'}>
          {value ? 'Yes' : 'No'}
        </span>
      );
    case 'date':
      if (value instanceof Date) return value.toLocaleDateString();
      if (typeof value === 'string') return new Date(value).toLocaleDateString();
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
      return <span className="text-text-tertiary">[Object]</span>;
    case 'enum':
      return (
        <span className="px-2 py-0.5 text-small bg-surface-subtle rounded">
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
// Internal Virtualized Table
// ============================================================

function BioTableVirtualInternal<T extends z.ZodRawShape>({
  schema,
  data,
  height,
  estimatedRowHeight = 48,
  overscan = 5,
  title,
  showTitle = true,
  include,
  exclude,
  keyField,
  enableSorting = true,
  enableFiltering = true,
  enableSelection = false,
  onRowClick,
  onSelectionChange,
  loading = false,
  error = null,
  emptyMessage = 'No data available',
  className,
}: BioTableVirtualProps<T>) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  // Introspect schema
  const definition = React.useMemo(() => introspectZodSchema(schema), [schema]);

  // Generate columns
  const columns = React.useMemo(
    () => generateColumns<T>(definition.fields, include, exclude),
    [definition.fields, include, exclude]
  );

  // Create table instance (without pagination for virtual tables)
  const { table, sorting, filtering, selection, meta } = useBioTable({
    data,
    columns,
    enableSorting,
    enableFiltering,
    enablePagination: false, // Virtualization handles this
    enableRowSelection: enableSelection,
    getRowId: keyField
      ? (row) => String((row as Record<string, unknown>)[keyField as string])
      : undefined,
  });

  // Get all rows (filtered/sorted but not paginated)
  const rows = table.getRowModel().rows;

  // Virtual row setup
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedRowHeight,
    overscan,
  });

  const virtualRows = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

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
          <Loader2 className="h-8 w-8 animate-spin text-text-muted" />
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
    <Surface
      padding="none"
      className={cn('overflow-hidden', className)}
      data-testid="bio-table-virtual"
    >
      {/* Header */}
      {(showTitle && displayTitle) || enableFiltering ? (
        <div className="px-6 py-4 border-b border-default space-y-4">
          {showTitle && displayTitle && (
            <div className="flex items-center justify-between">
              <Txt variant="subheading" as="h3">
                {displayTitle}
              </Txt>
              <Txt variant="caption" color="secondary">
                {meta.filteredRows.toLocaleString()} rows
              </Txt>
            </div>
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

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <BioTableHeader
            table={table}
            enableSelection={enableSelection}
          />
        </table>
      </div>

      {/* Virtualized Body */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height, maxHeight: height }}
      >
        <div
          style={{
            height: totalSize,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualRows.map(virtualRow => {
            const row = rows[virtualRow.index];
            return (
              <div
                key={row.id}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <table className="w-full">
                  <tbody>
                    <tr
                      onClick={() => onRowClick?.(row.original, row.index)}
                      className={cn(
                        'transition-colors border-b border-border-subtle',
                        onRowClick && 'cursor-pointer hover:bg-surface-hover',
                        row.getIsSelected() && 'bg-accent-primary/5'
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
                              'h-4 w-4 rounded border-border-default',
                              'text-accent-primary focus:ring-accent-primary focus:ring-offset-0',
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
                          className="px-4 py-3 text-body text-text-primary"
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer with stats */}
      <div className="px-6 py-3 border-t border-default bg-surface-subtle">
        <Txt variant="small" color="secondary">
          Showing {virtualRows.length} of {meta.filteredRows.toLocaleString()} rows
          {meta.totalRows !== meta.filteredRows && (
            <span> (filtered from {meta.totalRows.toLocaleString()})</span>
          )}
        </Txt>
      </div>
    </Surface>
  );
}

// ============================================================
// Main Export (with Jotai Provider)
// ============================================================

export function BioTableVirtual<T extends z.ZodRawShape>(props: BioTableVirtualProps<T>) {
  return (
    <JotaiProvider>
      <BioTableVirtualInternal {...props} />
    </JotaiProvider>
  );
}

BioTableVirtual.displayName = 'BioTableVirtual';

export const VIRTUAL_COMPONENT_META = {
  code: 'BIOSKIN_BioTableVirtual',
  version: '2.0.0',
  layer: 'organisms',
  family: 'DATA',
  status: 'stable',
  poweredBy: ['@tanstack/react-table', '@tanstack/react-virtual', 'jotai'],
} as const;
