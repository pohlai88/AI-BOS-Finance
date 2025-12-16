/**
 * BioTable - Schema-driven data table component
 * 
 * Layer 3 (organisms) per CONT_10 BioSkin Architecture
 * Auto-generates a data table from Zod schema introspection.
 */

'use client';

import * as React from 'react';
import { z } from 'zod';
import { Surface } from '../atoms/Surface';
import { Txt } from '../atoms/Txt';
import { cn } from '../atoms/utils';
import { StatusBadge } from '../molecules/StatusBadge';
import { EmptyState } from '../molecules/EmptyState';
import { LoadingState } from '../molecules/LoadingState';
import { introspectZodSchema, type BioFieldDefinition } from '../introspector/ZodSchemaIntrospector';
import { Table } from 'lucide-react';

export interface BioTableProps<T extends z.ZodRawShape> {
  /** Zod schema defining the row structure */
  schema: z.ZodObject<T>;
  /** Array of data to display */
  data: z.infer<z.ZodObject<T>>[];
  /** Called when a row is clicked */
  onRowClick?: (row: z.infer<z.ZodObject<T>>, index: number) => void;
  /** Title for the table */
  title?: string;
  /** Show title */
  showTitle?: boolean;
  /** Columns to include (defaults to all) */
  include?: (keyof T)[];
  /** Columns to exclude */
  exclude?: (keyof T)[];
  /** Key field for row identification */
  keyField?: keyof T;
  /** Empty state message */
  emptyMessage?: string;
  /** Loading state */
  loading?: boolean;
  /** Additional className */
  className?: string;
}

// Detect if a field should render as a status badge
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

  // Auto-detect status fields
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

export function BioTable<T extends z.ZodRawShape>({
  schema,
  data,
  onRowClick,
  title,
  showTitle = true,
  include,
  exclude,
  keyField,
  emptyMessage = 'No data available',
  loading = false,
  className,
}: BioTableProps<T>) {
  // Introspect schema
  const definition = React.useMemo(() => introspectZodSchema(schema), [schema]);

  // Filter columns based on include/exclude
  const columns = React.useMemo(() => {
    let filtered = definition.fields;

    if (include && include.length > 0) {
      const includeSet = new Set(include.map(String));
      filtered = filtered.filter((f) => includeSet.has(f.name));
    }

    if (exclude && exclude.length > 0) {
      const excludeSet = new Set(exclude.map(String));
      filtered = filtered.filter((f) => !excludeSet.has(f.name));
    }

    return filtered;
  }, [definition.fields, include, exclude]);

  const displayTitle = title || definition.name;

  // Get row key
  const getRowKey = React.useCallback(
    (row: z.infer<z.ZodObject<T>>, index: number): string => {
      if (keyField) {
        const rowObj = row as Record<string, unknown>;
        const keyValue = rowObj[keyField as string];
        if (keyValue !== undefined) {
          return String(keyValue);
        }
      }
      return String(index);
    },
    [keyField]
  );

  // Loading state
  if (loading) {
    return (
      <Surface padding="lg" className={className}>
        <LoadingState variant="skeleton" rows={5} text="Loading data..." />
      </Surface>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <EmptyState
        icon={Table}
        title="No data"
        description={emptyMessage}
        className={className}
      />
    );
  }

  return (
    <Surface padding="none" className={cn('overflow-hidden', className)}>
      {showTitle && displayTitle && displayTitle !== 'Object' && (
        <div className="px-6 py-4 border-b border-default">
          <Txt variant="subheading" as="h3">
            {displayTitle}
          </Txt>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-subtle border-b border-default">
              {columns.map((column) => (
                <th
                  key={column.name}
                  className="px-4 py-3 text-left text-label text-text-secondary font-medium"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {data.map((row, index) => (
              <tr
                key={getRowKey(row, index)}
                onClick={() => onRowClick?.(row, index)}
                className={cn(
                  'transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-surface-hover'
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.name}
                    className="px-4 py-3 text-body text-text-primary"
                  >
                    {formatCellValue(
                      column.name,
                      (row as Record<string, unknown>)[column.name],
                      column.type
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-default bg-surface-subtle">
        <Txt variant="caption" color="secondary">
          {data.length} {data.length === 1 ? 'item' : 'items'}
        </Txt>
      </div>
    </Surface>
  );
}

BioTable.displayName = 'BioTable';

export const COMPONENT_META = {
  code: 'BIOSKIN_BioTable',
  version: '1.0.0',
  layer: 'organisms',
  family: 'DATA',
  status: 'stable',
} as const;
