// ============================================================================
// SUPER TABLE PAGINATION v2.0
// Responsive pagination with page size selector
// ============================================================================
// FEATURES:
// - "Showing X to Y of Z" status text
// - First/Prev/Next/Last navigation
// - Page size selector dropdown
// - Mobile: Stacks vertically, Desktop: Horizontal flex
// ============================================================================

import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuperTablePaginationProps {
  // Current State
  pageIndex: number; // 0-based index (0 is page 1)
  pageSize: number;
  totalCount: number;

  // Handlers
  onPageChange: (newPageIndex: number) => void;
  onPageSizeChange: (newPageSize: number) => void;
  
  // Options
  pageSizeOptions?: number[];
  
  // Styling
  className?: string;
}

export const SuperTablePagination = ({
  pageIndex,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  className,
}: SuperTablePaginationProps) => {
  
  // === DERIVED VALUES ===
  const totalPages = Math.ceil(totalCount / pageSize);
  const canPrevious = pageIndex > 0;
  const canNext = pageIndex < totalPages - 1;
  
  // Calculate "Showing X to Y of Z"
  const startRow = totalCount === 0 ? 0 : (pageIndex * pageSize) + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalCount);

  // Hide pagination when no data
  if (totalCount === 0) return null;

  // === NAV BUTTON COMPONENT ===
  const NavButton = ({ 
    onClick, 
    disabled, 
    label, 
    children 
  }: { 
    onClick: () => void; 
    disabled: boolean; 
    label: string; 
    children: React.ReactNode;
  }) => (
    <button
      className={cn(
        "p-1.5 rounded border border-[#222] bg-[#111]",
        "transition-all duration-200",
        disabled 
          ? "opacity-30 cursor-not-allowed" 
          : "hover:bg-[#1A1A1A] hover:border-[#28E7A2]/30 hover:text-[#28E7A2]"
      )}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
    >
      {children}
    </button>
  );

  return (
    <div className={cn(
      "flex flex-col sm:flex-row items-center justify-between gap-4",
      "py-3 px-4 border-t border-[#1F1F1F] bg-[#0A0A0A]",
      className
    )}>
      
      {/* SECTION 1: Status Text & Page Size */}
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
        
        {/* Status Text */}
        <span className="text-[11px] font-mono text-[#666]">
          Showing{' '}
          <span className="text-[#28E7A2] font-medium">{startRow}</span>
          {' '}to{' '}
          <span className="text-[#28E7A2] font-medium">{endRow}</span>
          {' '}of{' '}
          <span className="text-white font-medium">{totalCount}</span>
          {' '}results
        </span>

        {/* Page Size Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#555] uppercase tracking-wider hidden sm:inline font-mono">
            Rows
          </span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className={cn(
              "rounded border border-[#222] bg-[#111] text-[#CCC]",
              "py-1.5 pl-2 pr-6 text-xs font-mono",
              "focus:border-[#28E7A2]/50 focus:ring-1 focus:ring-[#28E7A2]/30",
              "outline-none cursor-pointer",
              "appearance-none bg-no-repeat bg-right",
              // Custom dropdown arrow
              "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23666%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')]",
              "pr-6"
            )}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size} className="bg-[#111] text-[#CCC]">
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SECTION 2: Navigation Buttons */}
      <div className="flex items-center gap-1">
        
        {/* First Page */}
        <NavButton
          onClick={() => onPageChange(0)}
          disabled={!canPrevious}
          label="First Page"
        >
          <ChevronsLeft className="w-4 h-4 text-[#888]" />
        </NavButton>

        {/* Previous Page */}
        <NavButton
          onClick={() => onPageChange(pageIndex - 1)}
          disabled={!canPrevious}
          label="Previous Page"
        >
          <ChevronLeft className="w-4 h-4 text-[#888]" />
        </NavButton>

        {/* Page Indicator */}
        <div className="px-3 py-1 mx-1 rounded bg-[#111] border border-[#222]">
          <span className="text-xs font-mono text-[#888]">
            <span className="text-white">{pageIndex + 1}</span>
            <span className="mx-1">/</span>
            <span>{totalPages}</span>
          </span>
        </div>

        {/* Next Page */}
        <NavButton
          onClick={() => onPageChange(pageIndex + 1)}
          disabled={!canNext}
          label="Next Page"
        >
          <ChevronRight className="w-4 h-4 text-[#888]" />
        </NavButton>

        {/* Last Page */}
        <NavButton
          onClick={() => onPageChange(totalPages - 1)}
          disabled={!canNext}
          label="Last Page"
        >
          <ChevronsRight className="w-4 h-4 text-[#888]" />
        </NavButton>
      </div>
    </div>
  );
};

export default SuperTablePagination;

