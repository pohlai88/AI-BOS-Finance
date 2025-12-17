/**
 * BioTableHeader - Sortable table header component
 * 
 * Sprint 2 Day 7 per BIOSKIN 2.1 PRD
 * Renders table headers with click-to-sort functionality.
 */

'use client';

import * as React from 'react';
import { flexRender, type Header, type Table } from '@tanstack/react-table';
import { motion } from 'motion/react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '../../atoms/utils';

export interface BioTableHeaderProps<TData> {
  /** TanStack table instance */
  table: Table<TData>;
  /** Enable selection column */
  enableSelection?: boolean;
  /** Additional className */
  className?: string;
}

interface SortIndicatorProps {
  isSorted: false | 'asc' | 'desc';
  canSort: boolean;
}

function SortIndicator({ isSorted, canSort }: SortIndicatorProps) {
  if (!canSort) return null;

  return (
    <span className="ml-1.5 inline-flex items-center">
      {isSorted === false && (
        <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
      )}
      {isSorted === 'asc' && (
        <motion.span
          initial={{ opacity: 0, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          <ArrowUp className="h-3.5 w-3.5 text-foreground" />
        </motion.span>
      )}
      {isSorted === 'desc' && (
        <motion.span
          initial={{ opacity: 0, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          <ArrowDown className="h-3.5 w-3.5 text-foreground" />
        </motion.span>
      )}
    </span>
  );
}

function HeaderCell<TData>({ header }: { header: Header<TData, unknown> }) {
  const canSort = header.column.getCanSort();
  const isSorted = header.column.getIsSorted();

  return (
    <th
      key={header.id}
      colSpan={header.colSpan}
      className={cn(
        'px-4 py-3 text-left text-small font-medium',
        'bg-muted/50 border-b border-border',
        canSort && 'cursor-pointer select-none group hover:bg-muted transition-colors'
      )}
      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
      aria-sort={
        isSorted === 'asc' ? 'ascending' :
          isSorted === 'desc' ? 'descending' :
            undefined
      }
    >
      {header.isPlaceholder ? null : (
        <div className="flex items-center">
          <span className="text-muted-foreground">
            {flexRender(header.column.columnDef.header, header.getContext())}
          </span>
          <SortIndicator isSorted={isSorted} canSort={canSort} />
        </div>
      )}
    </th>
  );
}

function SelectionHeaderCell<TData>({ table }: { table: Table<TData> }) {
  const isAllSelected = table.getIsAllPageRowsSelected();
  const isSomeSelected = table.getIsSomePageRowsSelected();

  return (
    <th className="w-12 px-4 py-3 bg-muted/50 border-b border-border">
      <input
        type="checkbox"
        checked={isAllSelected}
        ref={el => {
          if (el) {
            el.indeterminate = isSomeSelected && !isAllSelected;
          }
        }}
        onChange={table.getToggleAllPageRowsSelectedHandler()}
        className={cn(
          'h-4 w-4 rounded border-border',
          'text-primary focus:ring-ring focus:ring-offset-0',
          'cursor-pointer'
        )}
        aria-label="Select all rows"
      />
    </th>
  );
}

export function BioTableHeader<TData>({
  table,
  enableSelection = false,
  className,
}: BioTableHeaderProps<TData>) {
  return (
    <thead className={className}>
      {table.getHeaderGroups().map(headerGroup => (
        <tr key={headerGroup.id}>
          {/* Selection checkbox column */}
          {enableSelection && <SelectionHeaderCell table={table} />}

          {/* Data columns */}
          {headerGroup.headers.map(header => (
            <HeaderCell key={header.id} header={header} />
          ))}
        </tr>
      ))}
    </thead>
  );
}

BioTableHeader.displayName = 'BioTableHeader';
