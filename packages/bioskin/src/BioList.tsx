// ============================================================================
// BIOSKIN: BioList - Table Renderer
// ============================================================================
// v0: Basic list/table renderer (no virtualization yet)
// Columns derived from schema shape + kernel ordering
// 🛡️ GOVERNANCE: Only uses Surface, Txt, BioCell (which uses atoms)
// ============================================================================

'use client';

import React from 'react';
import { Surface } from '@/components/ui/Surface';
import { Txt } from '@/components/ui/Txt';
import { BioCell } from './BioCell';
import type { ExtendedMetadataField } from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface BioListProps {
  /** Array of field metadata from Kernel (defines columns) */
  schema: ExtendedMetadataField[];
  /** Array of records to display */
  data: Record<string, unknown>[];
  /** Row click handler (opens FieldContextSidebar) */
  onRowClick?: (record: Record<string, unknown>) => void;
  /** Optional row key field (defaults to 'id') */
  rowKey?: string;
  /** Additional className */
  className?: string;
}

// ============================================================================
// BIO LIST - Table Renderer
// ============================================================================

export function BioList({
  schema,
  data,
  onRowClick,
  rowKey = 'id',
  className,
}: BioListProps) {
  // Filter visible columns (exclude hidden fields)
  const visibleColumns = schema.filter((field) => !field.hidden);

  // Sort columns by order if specified
  const sortedColumns = [...visibleColumns].sort((a, b) => {
    const orderA = a.order ?? 999;
    const orderB = b.order ?? 999;
    return orderA - orderB;
  });

  if (data.length === 0) {
    return (
      <Surface variant="base" className={`p-8 ${className || ''}`}>
        <div className="text-center">
          <Txt variant="body" className="text-text-tertiary">
            No data available
          </Txt>
        </div>
      </Surface>
    );
  }

  return (
    <Surface variant="base" className={`overflow-hidden ${className || ''}`}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" aria-label="BioSkin data table">
          {/* Header */}
          <thead>
            <tr className="border-b border-border-surface-base">
              {sortedColumns.map((field) => (
                <th
                  key={field.technical_name}
                  className="px-4 py-3 text-left"
                  scope="col"
                  style={field.width ? { width: field.width } : undefined}
                >
                  <Txt variant="small" className="font-medium text-text-secondary uppercase">
                    {field.business_term}
                  </Txt>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {data.map((record, index) => {
              const recordId = record[rowKey] as string | number | undefined;
              const key = recordId !== undefined ? String(recordId) : `row-${index}`;
              const isClickable = !!onRowClick;

              return (
                <tr
                  key={key}
                  className={`
                    border-b border-border-surface-base
                    ${isClickable ? 'cursor-pointer hover:bg-surface-flat transition-colors' : ''}
                  `}
                  tabIndex={isClickable ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (!isClickable) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onRowClick?.(record);
                    }
                  }}
                  onClick={() => isClickable && onRowClick?.(record)}
                >
                  {sortedColumns.map((field) => {
                    const value = record[field.technical_name];

                    return (
                      <td key={field.technical_name} className="px-4 py-3">
                        <BioCell fieldMeta={field} value={value} intent="view" />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Surface>
  );
}
