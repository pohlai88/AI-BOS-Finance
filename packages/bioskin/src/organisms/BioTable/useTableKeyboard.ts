/**
 * useTableKeyboard - Excel-like keyboard navigation for tables
 *
 * Provides:
 * - Arrow key navigation
 * - Tab/Shift+Tab cell navigation
 * - Enter to edit/select
 * - Escape to cancel
 * - Ctrl+C to copy
 * - Ctrl+A to select all
 */

'use client';

import * as React from 'react';
import { type Table } from '@tanstack/react-table';

// ============================================================
// Types
// ============================================================

export interface CellPosition {
  rowIndex: number;
  columnIndex: number;
}

export interface UseTableKeyboardOptions<TData> {
  /** TanStack table instance */
  table: Table<TData>;
  /** Container ref for keyboard events */
  containerRef: React.RefObject<HTMLElement>;
  /** Enable keyboard navigation */
  enabled?: boolean;
  /** Called when cell is selected */
  onCellSelect?: (position: CellPosition, cell: unknown) => void;
  /** Called when Enter is pressed on a cell */
  onCellEnter?: (position: CellPosition, cell: unknown) => void;
  /** Called when Escape is pressed */
  onEscape?: () => void;
  /** Called when copy is triggered */
  onCopy?: (value: unknown) => void;
  /** Enable cell selection mode */
  enableCellSelection?: boolean;
  /** Wrap navigation at edges */
  wrapNavigation?: boolean;
}

export interface UseTableKeyboardReturn {
  /** Currently focused cell position */
  focusedCell: CellPosition | null;
  /** Set focused cell */
  setFocusedCell: (position: CellPosition | null) => void;
  /** Is a cell currently focused */
  isCellFocused: (rowIndex: number, columnIndex: number) => boolean;
  /** Handle key down event */
  handleKeyDown: (e: React.KeyboardEvent) => void;
  /** Get cell props for focus management */
  getCellProps: (rowIndex: number, columnIndex: number) => {
    tabIndex: number;
    'data-focused': boolean;
    onFocus: () => void;
    onClick: () => void;
  };
}

// ============================================================
// Hook
// ============================================================

export function useTableKeyboard<TData>({
  table,
  containerRef,
  enabled = true,
  onCellSelect,
  onCellEnter,
  onEscape,
  onCopy,
  enableCellSelection = true,
  wrapNavigation = false,
}: UseTableKeyboardOptions<TData>): UseTableKeyboardReturn {
  const [focusedCell, setFocusedCell] = React.useState<CellPosition | null>(null);

  // Get row and column counts
  const rowCount = table.getRowModel().rows.length;
  const columnCount = table.getVisibleLeafColumns().length;

  // Navigate to a new cell position
  const navigateTo = React.useCallback(
    (rowDelta: number, colDelta: number) => {
      if (!focusedCell) {
        // Start at first cell if nothing is focused
        setFocusedCell({ rowIndex: 0, columnIndex: 0 });
        return;
      }

      let newRow = focusedCell.rowIndex + rowDelta;
      let newCol = focusedCell.columnIndex + colDelta;

      if (wrapNavigation) {
        // Wrap at edges
        if (newCol < 0) {
          newCol = columnCount - 1;
          newRow--;
        } else if (newCol >= columnCount) {
          newCol = 0;
          newRow++;
        }

        if (newRow < 0) {
          newRow = rowCount - 1;
        } else if (newRow >= rowCount) {
          newRow = 0;
        }
      } else {
        // Clamp at edges
        newRow = Math.max(0, Math.min(rowCount - 1, newRow));
        newCol = Math.max(0, Math.min(columnCount - 1, newCol));
      }

      const newPosition = { rowIndex: newRow, columnIndex: newCol };
      setFocusedCell(newPosition);

      // Get cell value for callback
      if (onCellSelect) {
        const row = table.getRowModel().rows[newRow];
        const column = table.getVisibleLeafColumns()[newCol];
        if (row && column) {
          const cell = row.getValue(column.id);
          onCellSelect(newPosition, cell);
        }
      }
    },
    [focusedCell, rowCount, columnCount, wrapNavigation, table, onCellSelect]
  );

  // Copy current cell value
  const copyCell = React.useCallback(() => {
    if (!focusedCell) return;

    const row = table.getRowModel().rows[focusedCell.rowIndex];
    const column = table.getVisibleLeafColumns()[focusedCell.columnIndex];

    if (row && column) {
      const value = row.getValue(column.id);
      const textValue = value === null || value === undefined ? '' : String(value);

      navigator.clipboard.writeText(textValue).catch(console.error);
      onCopy?.(value);
    }
  }, [focusedCell, table, onCopy]);

  // Select all rows
  const selectAll = React.useCallback(() => {
    table.toggleAllRowsSelected(true);
  }, [table]);

  // Handle key events
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (!enabled) return;

      const key = e.key;
      const isCtrl = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;

      switch (key) {
        case 'ArrowUp':
          e.preventDefault();
          navigateTo(-1, 0);
          break;

        case 'ArrowDown':
          e.preventDefault();
          navigateTo(1, 0);
          break;

        case 'ArrowLeft':
          e.preventDefault();
          navigateTo(0, -1);
          break;

        case 'ArrowRight':
          e.preventDefault();
          navigateTo(0, 1);
          break;

        case 'Tab':
          e.preventDefault();
          if (isShift) {
            navigateTo(0, -1);
          } else {
            navigateTo(0, 1);
          }
          break;

        case 'Enter':
          if (focusedCell && onCellEnter) {
            e.preventDefault();
            const row = table.getRowModel().rows[focusedCell.rowIndex];
            const column = table.getVisibleLeafColumns()[focusedCell.columnIndex];
            if (row && column) {
              const cell = row.getValue(column.id);
              onCellEnter(focusedCell, cell);
            }
          }
          break;

        case 'Escape':
          e.preventDefault();
          setFocusedCell(null);
          onEscape?.();
          break;

        case 'c':
          if (isCtrl) {
            e.preventDefault();
            copyCell();
          }
          break;

        case 'a':
          if (isCtrl) {
            e.preventDefault();
            selectAll();
          }
          break;

        case 'Home':
          e.preventDefault();
          if (isCtrl) {
            // Go to first cell
            setFocusedCell({ rowIndex: 0, columnIndex: 0 });
          } else {
            // Go to first column in current row
            setFocusedCell(prev => prev ? { ...prev, columnIndex: 0 } : null);
          }
          break;

        case 'End':
          e.preventDefault();
          if (isCtrl) {
            // Go to last cell
            setFocusedCell({ rowIndex: rowCount - 1, columnIndex: columnCount - 1 });
          } else {
            // Go to last column in current row
            setFocusedCell(prev => prev ? { ...prev, columnIndex: columnCount - 1 } : null);
          }
          break;

        case 'PageUp':
          e.preventDefault();
          navigateTo(-10, 0);
          break;

        case 'PageDown':
          e.preventDefault();
          navigateTo(10, 0);
          break;
      }
    },
    [enabled, focusedCell, navigateTo, copyCell, selectAll, onCellEnter, onEscape, table, rowCount, columnCount]
  );

  // Focus cell helper
  const isCellFocused = React.useCallback(
    (rowIndex: number, columnIndex: number): boolean => {
      return focusedCell?.rowIndex === rowIndex && focusedCell?.columnIndex === columnIndex;
    },
    [focusedCell]
  );

  // Get props for a cell
  const getCellProps = React.useCallback(
    (rowIndex: number, columnIndex: number) => ({
      tabIndex: isCellFocused(rowIndex, columnIndex) ? 0 : -1,
      'data-focused': isCellFocused(rowIndex, columnIndex),
      onFocus: () => {
        if (enableCellSelection) {
          setFocusedCell({ rowIndex, columnIndex });
        }
      },
      onClick: () => {
        if (enableCellSelection) {
          setFocusedCell({ rowIndex, columnIndex });
        }
      },
    }),
    [isCellFocused, enableCellSelection]
  );

  // Attach keyboard listener to container
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    const handler = (e: KeyboardEvent) => {
      handleKeyDown(e as unknown as React.KeyboardEvent);
    };

    container.addEventListener('keydown', handler);
    return () => container.removeEventListener('keydown', handler);
  }, [containerRef, enabled, handleKeyDown]);

  return {
    focusedCell,
    setFocusedCell,
    isCellFocused,
    handleKeyDown,
    getCellProps,
  };
}
