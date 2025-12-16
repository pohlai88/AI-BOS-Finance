/**
 * BioTablePagination - Page navigation and size controls
 * 
 * Sprint 2 Day 9 per BIOSKIN 2.1 PRD
 * Provides page navigation, page size selection, and result counts.
 */

'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { cn } from '../../atoms/utils';
import { Txt } from '../../atoms/Txt';

export interface BioTablePaginationProps {
  /** Current page index (0-based) */
  pageIndex: number;
  /** Current page size */
  pageSize: number;
  /** Total number of pages */
  pageCount: number;
  /** Total number of rows (before pagination) */
  totalRows: number;
  /** Whether previous page is available */
  canPreviousPage: boolean;
  /** Whether next page is available */
  canNextPage: boolean;
  /** Go to specific page */
  onPageChange: (page: number) => void;
  /** Go to next page */
  onNextPage: () => void;
  /** Go to previous page */
  onPreviousPage: () => void;
  /** Change page size */
  onPageSizeChange: (size: number) => void;
  /** Available page sizes */
  pageSizeOptions?: number[];
  /** Show page size selector */
  showPageSize?: boolean;
  /** Show page numbers */
  showPageNumbers?: boolean;
  /** Show result info */
  showResultInfo?: boolean;
  /** Additional className */
  className?: string;
}

function PaginationButton({
  onClick,
  disabled,
  children,
  ariaLabel,
}: {
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        'p-2 rounded-lg transition-colors',
        'border border-default',
        disabled
          ? 'bg-surface-subtle text-text-disabled cursor-not-allowed'
          : 'bg-surface-base text-text-secondary hover:bg-surface-hover hover:text-text-primary'
      )}
    >
      {children}
    </button>
  );
}

function PageNumber({
  page,
  isActive,
  onClick,
}: {
  page: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'min-w-[36px] h-9 px-3 rounded-lg transition-colors',
        'text-small font-medium',
        isActive
          ? 'bg-accent-primary text-white'
          : 'bg-surface-base text-text-secondary hover:bg-surface-hover hover:text-text-primary border border-default'
      )}
    >
      {page}
    </button>
  );
}

function getPageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 5
): (number | 'ellipsis')[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [];
  const half = Math.floor(maxVisible / 2);

  let start = Math.max(1, currentPage - half);
  let end = Math.min(totalPages, start + maxVisible - 1);

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }

  // Always show first page
  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push('ellipsis');
  }

  // Middle pages
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  // Always show last page
  if (end < totalPages) {
    if (end < totalPages - 1) pages.push('ellipsis');
    pages.push(totalPages);
  }

  return pages;
}

export function BioTablePagination({
  pageIndex,
  pageSize,
  pageCount,
  totalRows,
  canPreviousPage,
  canNextPage,
  onPageChange,
  onNextPage,
  onPreviousPage,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  showPageSize = true,
  showPageNumbers = true,
  showResultInfo = true,
  className,
}: BioTablePaginationProps) {
  const currentPage = pageIndex + 1; // Convert to 1-based for display
  const startRow = pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);
  const pageNumbers = getPageNumbers(currentPage, pageCount);

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-4',
        'px-4 py-3 border-t border-default bg-surface-subtle',
        className
      )}
    >
      {/* Left: Result info + page size */}
      <div className="flex items-center gap-4">
        {showResultInfo && (
          <Txt variant="caption" color="secondary">
            {totalRows === 0 ? (
              'No results'
            ) : (
              <>
                Showing <span className="font-medium text-text-primary">{startRow}</span>
                {' '}to{' '}
                <span className="font-medium text-text-primary">{endRow}</span>
                {' '}of{' '}
                <span className="font-medium text-text-primary">{totalRows}</span>
              </>
            )}
          </Txt>
        )}

        {showPageSize && (
          <div className="flex items-center gap-2">
            <Txt variant="caption" color="secondary">
              Rows per page:
            </Txt>
            <select
              value={pageSize}
              onChange={e => onPageSizeChange(Number(e.target.value))}
              className={cn(
                'px-2 py-1 rounded-lg',
                'bg-surface-base border border-default',
                'text-small text-text-primary',
                'focus:outline-none focus:ring-2 focus:ring-accent-primary/30 focus:border-accent-primary',
                'cursor-pointer'
              )}
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Page navigation */}
      <div className="flex items-center gap-1">
        {/* First page */}
        <PaginationButton
          onClick={() => onPageChange(0)}
          disabled={!canPreviousPage}
          ariaLabel="Go to first page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </PaginationButton>

        {/* Previous page */}
        <PaginationButton
          onClick={onPreviousPage}
          disabled={!canPreviousPage}
          ariaLabel="Go to previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </PaginationButton>

        {/* Page numbers */}
        {showPageNumbers && pageCount > 0 && (
          <div className="flex items-center gap-1 mx-1">
            {pageNumbers.map((page, index) =>
              page === 'ellipsis' ? (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 text-text-muted"
                >
                  …
                </span>
              ) : (
                <PageNumber
                  key={page}
                  page={page}
                  isActive={page === currentPage}
                  onClick={() => onPageChange(page - 1)}
                />
              )
            )}
          </div>
        )}

        {/* Next page */}
        <PaginationButton
          onClick={onNextPage}
          disabled={!canNextPage}
          ariaLabel="Go to next page"
        >
          <ChevronRight className="h-4 w-4" />
        </PaginationButton>

        {/* Last page */}
        <PaginationButton
          onClick={() => onPageChange(pageCount - 1)}
          disabled={!canNextPage}
          ariaLabel="Go to last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </PaginationButton>
      </div>
    </div>
  );
}

BioTablePagination.displayName = 'BioTablePagination';
