/**
 * BioTableResizer - Column resize handle component
 *
 * Provides drag-to-resize functionality for table columns.
 */

'use client';

import * as React from 'react';
import { type Header } from '@tanstack/react-table';
import { cn } from '../../atoms/utils';

// ============================================================
// Types
// ============================================================

export interface BioTableResizerProps<TData> {
  /** TanStack header instance */
  header: Header<TData, unknown>;
  /** Additional className */
  className?: string;
}

// ============================================================
// Component
// ============================================================

export function BioTableResizer<TData>({
  header,
  className,
}: BioTableResizerProps<TData>) {
  const [isResizing, setIsResizing] = React.useState(false);

  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setIsResizing(true);
      header.getResizeHandler()(e);
    },
    [header]
  );

  const handleTouchStart = React.useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation();

      setIsResizing(true);
      header.getResizeHandler()(e);
    },
    [header]
  );

  // Track resize state
  React.useEffect(() => {
    if (!header.column.getIsResizing()) {
      setIsResizing(false);
    }
  }, [header.column.getIsResizing()]);

  if (!header.column.getCanResize()) {
    return null;
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className={cn(
        'absolute top-0 right-0 h-full w-1 cursor-col-resize select-none touch-none',
        'group-hover:bg-accent-primary/30 hover:bg-accent-primary transition-colors',
        isResizing && 'bg-accent-primary',
        className
      )}
      style={{
        transform: isResizing
          ? `translateX(${header.column.getSize() - (header.column.columnDef.size || 150)}px)`
          : undefined,
      }}
    >
      {/* Visual indicator */}
      <div
        className={cn(
          'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-1/2',
          'w-0.5 h-8 rounded-full transition-colors',
          isResizing ? 'bg-accent-primary' : 'bg-transparent group-hover:bg-accent-primary/50'
        )}
      />
    </div>
  );
}

BioTableResizer.displayName = 'BioTableResizer';

// ============================================================
// Hook for column resize persistence
// ============================================================

export interface UseColumnResizeOptions {
  /** Storage key for persistence */
  persistKey?: string;
  /** Default column sizes */
  defaultSizes?: Record<string, number>;
}

export function useColumnResize({ persistKey, defaultSizes = {} }: UseColumnResizeOptions) {
  const [columnSizes, setColumnSizes] = React.useState<Record<string, number>>(defaultSizes);

  // Load from localStorage
  React.useEffect(() => {
    if (!persistKey) return;

    try {
      const stored = localStorage.getItem(`bioskin_column_sizes_${persistKey}`);
      if (stored) {
        setColumnSizes(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load column sizes:', error);
    }
  }, [persistKey]);

  // Save to localStorage
  const saveColumnSizes = React.useCallback(
    (sizes: Record<string, number>) => {
      setColumnSizes(sizes);

      if (persistKey) {
        try {
          localStorage.setItem(`bioskin_column_sizes_${persistKey}`, JSON.stringify(sizes));
        } catch (error) {
          console.error('Failed to save column sizes:', error);
        }
      }
    },
    [persistKey]
  );

  // Update a single column size
  const setColumnSize = React.useCallback(
    (columnId: string, size: number) => {
      saveColumnSizes({ ...columnSizes, [columnId]: size });
    },
    [columnSizes, saveColumnSizes]
  );

  // Reset to defaults
  const resetColumnSizes = React.useCallback(() => {
    saveColumnSizes(defaultSizes);
  }, [defaultSizes, saveColumnSizes]);

  return {
    columnSizes,
    setColumnSize,
    setColumnSizes: saveColumnSizes,
    resetColumnSizes,
  };
}
