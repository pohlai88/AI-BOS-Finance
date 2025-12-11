// ============================================================================
// SUPER TABLE HEADER v2.0
// Generic, schema-driven table header with sorting, filtering, and selection
// ============================================================================
// DESIGN CREDITS:
// - Click Trap Fix: Prevents filter input clicks from triggering column sort
// - Indeterminate Checkbox: Uses ref callback for three-state checkbox
// - Column Visibility: Respects `visible` boolean from column definitions
// ============================================================================

import React from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  ChevronsUpDown, 
  Filter 
} from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Types ---

// A generic column definition
export interface ColumnDef<T> {
  key: keyof T | string;
  header: string;
  width?: string; // e.g., "w-32" or "w-[200px]"
  sortable?: boolean;
  filterable?: boolean;
  visible?: boolean; // Used for visibility toggle
}

interface SuperTableHeaderProps<T> {
  columns: ColumnDef<T>[];
  
  // Sorting State
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
  onSort: (key: string) => void;

  // Filter State
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;

  // Selection State
  enableSelection?: boolean;
  isAllSelected: boolean;
  isIndeterminate: boolean; // True if some, but not all, are selected
  onSelectAll: () => void;
  
  // Styling
  className?: string;
}

// --- Component ---

export const SuperTableHeader = <T,>({
  columns,
  sortConfig,
  onSort,
  filters,
  onFilterChange,
  enableSelection = false,
  isAllSelected,
  isIndeterminate,
  onSelectAll,
  className,
}: SuperTableHeaderProps<T>) => {

  // Helper to determine which icon to show
  const getSortIcon = (colKey: string) => {
    if (sortConfig?.key !== colKey) {
      // Neutral state - shows both arrows
      return <ChevronsUpDown className="w-3.5 h-3.5 text-[#666] opacity-50 group-hover:opacity-100 transition-opacity" />;
    }
    // Active sort state
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-[#28E7A2]" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-[#28E7A2]" />
    );
  };

  return (
    <thead className={cn(
      // Hide on mobile - cards don't need table headers
      "hidden md:table-header-group",
      // Desktop styling
      "bg-[#0A0A0A] border-b border-[#1F1F1F] sticky top-0 z-10",
      className
    )}>
      <tr>
        {/* 1. Master Checkbox Column */}
        {enableSelection && (
          <th className="px-4 py-3 w-12 text-left bg-[#0A0A0A]">
            <input
              type="checkbox"
              className={cn(
                "w-4 h-4 rounded border-[#333] bg-[#111] text-[#28E7A2]",
                "focus:ring-[#28E7A2] focus:ring-offset-0 focus:ring-1",
                "cursor-pointer transition-colors"
              )}
              checked={isAllSelected}
              ref={(input) => {
                // React doesn't support indeterminate attribute directly
                // Must set via DOM property using ref callback
                if (input) input.indeterminate = isIndeterminate;
              }}
              onChange={onSelectAll}
              aria-label={isAllSelected ? "Deselect all rows" : "Select all rows"}
            />
          </th>
        )}

        {/* 2. Dynamic Data Columns */}
        {columns.map((col) => {
          // Skip hidden columns
          if (col.visible === false) return null;

          const colKey = String(col.key);
          const isSorted = sortConfig?.key === colKey;

          return (
            <th
              key={colKey}
              className={cn(
                "px-4 py-3 text-left bg-[#0A0A0A]",
                col.width || 'w-auto'
              )}
            >
              <div className="flex flex-col gap-2">
                
                {/* Header Top: Label & Sort Button */}
                <div 
                  className={cn(
                    "flex items-center gap-1.5 group select-none",
                    col.sortable && "cursor-pointer",
                    col.sortable && !isSorted && "hover:text-[#AAA]"
                  )}
                  onClick={() => col.sortable && onSort(colKey)}
                  role={col.sortable ? "button" : undefined}
                  tabIndex={col.sortable ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (col.sortable && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onSort(colKey);
                    }
                  }}
                >
                  <span className={cn(
                    "text-[10px] font-mono uppercase tracking-wider",
                    isSorted ? "text-[#28E7A2]" : "text-[#666]"
                  )}>
                    {col.header}
                  </span>
                  {col.sortable && getSortIcon(colKey)}
                </div>

                {/* Header Bottom: Filter Input */}
                {col.filterable && (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                      <Filter className={cn(
                        "w-3 h-3",
                        filters[colKey] ? "text-[#28E7A2]" : "text-[#444]"
                      )} />
                    </div>
                    <input
                      type="text"
                      placeholder="Filter..."
                      className={cn(
                        "block w-full rounded border bg-[#111] pl-7 pr-2 py-1.5",
                        "text-[11px] font-mono text-white placeholder:text-[#444]",
                        "border-[#222] focus:border-[#28E7A2]/50 focus:ring-1 focus:ring-[#28E7A2]/30",
                        "transition-colors outline-none",
                        filters[colKey] && "border-[#28E7A2]/30 bg-[#28E7A2]/5"
                      )}
                      value={filters[colKey] || ''}
                      onChange={(e) => onFilterChange(colKey, e.target.value)}
                      // CRITICAL: Stop propagation so clicking input doesn't trigger sort
                      onClick={(e) => e.stopPropagation()} 
                    />
                    {/* Clear button when filter has value */}
                    {filters[colKey] && (
                      <button
                        className="absolute inset-y-0 right-0 flex items-center pr-2 text-[#666] hover:text-[#28E7A2] transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          onFilterChange(colKey, '');
                        }}
                        aria-label={`Clear ${col.header} filter`}
                      >
                        ×
                      </button>
                    )}
                  </div>
                )}
              </div>
            </th>
          );
        })}
      </tr>
    </thead>
  );
};

export default SuperTableHeader;

