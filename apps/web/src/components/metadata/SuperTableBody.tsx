// ============================================================================
// SUPER TABLE BODY v2.0 - "The Transformer"
// CSS-First Mobile Cards ↔ Desktop Table Rows
// ============================================================================
// PATTERN: Single DOM, dual layout via Tailwind responsive prefixes
// - Mobile: block/flex → Cards with key-value pairs
// - Desktop: table-row/table-cell → Traditional table rows
// ============================================================================

import React from 'react';
import { Inbox, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ColumnDef } from './SuperTableHeader';

interface SuperTableBodyProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  
  // Selection Props
  enableSelection?: boolean;
  selectedIds: Set<string | number>; // O(1) lookups
  onToggleRow: (row: T) => void;
  getRowId: (row: T) => string | number;
  
  // Row Interaction
  onRowClick?: (row: T) => void;
  
  // State
  isLoading?: boolean;
  
  // Custom Rendering
  renderCell?: (row: T, column: ColumnDef<T>, value: unknown) => React.ReactNode;
  
  // Styling
  className?: string;
}

export const SuperTableBody = <T,>({
  data,
  columns,
  enableSelection = false,
  selectedIds,
  onToggleRow,
  getRowId,
  onRowClick,
  isLoading = false,
  renderCell,
  className,
}: SuperTableBodyProps<T>) => {
  
  // Calculate colspan for full-width states
  const totalColumns = columns.filter(c => c.visible !== false).length + (enableSelection ? 1 : 0);

  // --- LOADING STATE ---
  if (isLoading) {
    return (
      <tbody className={cn("block md:table-row-group", className)}>
        {/* Skeleton Rows */}
        {[...Array(5)].map((_, i) => (
          <tr
            key={`skeleton-${i}`}
            className="block mb-4 border border-[#1F1F1F] rounded-lg bg-[#0A0A0A] md:table-row md:mb-0 md:rounded-none md:border-b"
          >
            {enableSelection && (
              <td className="p-3 md:table-cell md:p-4 md:w-12">
                <div className="w-4 h-4 bg-[#1A1A1A] rounded animate-pulse" />
              </td>
            )}
            {columns.filter(c => c.visible !== false).map((col, j) => (
              <td
                key={`skeleton-${i}-${j}`}
                className="flex justify-between p-3 border-b border-[#1A1A1A] last:border-b-0 md:table-cell md:border-b-0 md:p-4"
              >
                <span className="md:hidden w-16 h-3 bg-[#1A1A1A] rounded animate-pulse" />
                <span 
                  className="h-4 bg-[#1A1A1A] rounded animate-pulse"
                  style={{ width: `${60 + (j * 20) % 40}%` }}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    );
  }

  // --- EMPTY STATE ---
  if (!data || data.length === 0) {
    return (
      <tbody className={className}>
        <tr>
          <td 
            colSpan={totalColumns} 
            className="p-12 text-center"
          >
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 rounded-full bg-[#111] border border-[#1F1F1F] flex items-center justify-center">
                <Inbox className="w-8 h-8 text-[#333]" />
              </div>
              <div className="space-y-1">
                <p className="text-[#888] font-mono text-sm">No Records Found</p>
                <p className="text-[#555] text-xs">
                  Try adjusting your filters or search query.
                </p>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    );
  }

  // --- DATA ROWS ---
  return (
    <tbody className={cn("block md:table-row-group", className)}>
      {data.map((row) => {
        const rowId = getRowId(row);
        const isSelected = selectedIds.has(rowId);

        return (
          <tr
            key={String(rowId)}
            onClick={() => {
              if (onRowClick) onRowClick(row);
            }}
            className={cn(
              // === MOBILE: Card Style ===
              "block mb-3 border rounded-lg overflow-hidden",
              "bg-[#0A0A0A]",
              
              // === DESKTOP: Table Row Style ===
              "md:table-row md:mb-0 md:rounded-none md:border-b md:border-[#1A1A1A]",
              
              // === Interactive States ===
              "cursor-pointer transition-all duration-200",
              "hover:bg-[#111] hover:border-[#28E7A2]/30",
              
              // === Selection State ===
              isSelected 
                ? "border-[#28E7A2]/50 bg-[#28E7A2]/5 ring-1 ring-[#28E7A2]/30 md:ring-0 md:bg-[#28E7A2]/10" 
                : "border-[#1F1F1F]"
            )}
            role="row"
            aria-selected={isSelected}
          >
            
            {/* 1. CHECKBOX COLUMN */}
            {enableSelection && (
              <td className={cn(
                // Mobile: Header row for the card
                "flex justify-between items-center p-3 bg-[#111] border-b border-[#1A1A1A]",
                // Desktop: Standard cell
                "md:table-cell md:p-4 md:w-12 md:bg-transparent md:border-b-0"
              )}>
                {/* Mobile Label */}
                <span className="md:hidden font-mono text-[10px] text-[#666] uppercase tracking-wider">
                  Select
                </span>
                
                {/* Checkbox */}
                <input
                  type="checkbox"
                  className={cn(
                    "w-4 h-4 rounded border-[#333] bg-[#111]",
                    "text-[#28E7A2] focus:ring-[#28E7A2] focus:ring-offset-0 focus:ring-1",
                    "cursor-pointer transition-colors"
                  )}
                  checked={isSelected}
                  onChange={() => onToggleRow(row)}
                  onClick={(e) => e.stopPropagation()} // Prevent double toggle from row click
                  aria-label={`Select row ${rowId}`}
                />
              </td>
            )}

            {/* 2. DATA COLUMNS */}
            {columns.map((col) => {
              if (col.visible === false) return null;
              
              const colKey = String(col.key);
              // Access value with type assertion
              const cellValue = (row as Record<string, unknown>)[colKey];
              
              // Use custom renderer if provided, otherwise stringify
              const renderedValue = renderCell 
                ? renderCell(row, col, cellValue)
                : formatCellValue(cellValue);

              return (
                <td
                  key={`${rowId}-${colKey}`}
                  className={cn(
                    // Mobile: Flex row for key-value pair
                    "flex justify-between items-center p-3 border-b border-[#1A1A1A] last:border-b-0",
                    // Desktop: Standard table cell
                    "md:table-cell md:border-b-0 md:p-4 md:text-left",
                    col.width || 'w-auto'
                  )}
                >
                  {/* Mobile Label (Hidden on Desktop) */}
                  <span className="font-mono text-[10px] text-[#555] uppercase tracking-wider md:hidden shrink-0 mr-4">
                    {col.header}
                  </span>

                  {/* Cell Value */}
                  <span className={cn(
                    "text-[#CCC] text-sm font-mono",
                    "truncate max-w-[200px] md:max-w-none",
                    // First column is typically the "title" - make it prominent
                    colKey === String(columns[0]?.key) && "text-white font-medium"
                  )}>
                    {renderedValue}
                  </span>
                </td>
              );
            })}
          </tr>
        );
      })}
    </tbody>
  );
};

// --- HELPER: Format Cell Value ---
function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value instanceof Date) return value.toLocaleDateString();
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export default SuperTableBody;

