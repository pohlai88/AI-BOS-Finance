/**
 * useKeyboardNavigation - Keyboard navigation hook for complex components
 *
 * Sprint E8: Accessibility 100%
 * Provides consistent keyboard navigation patterns for grids, lists, and interactive elements.
 *
 * @example
 * const { handleKeyDown, focusedIndex, setFocusedIndex } = useKeyboardNavigation({
 *   itemCount: items.length,
 *   columns: 7, // For grid layout (calendar)
 *   onSelect: (index) => selectItem(index),
 *   onEscape: () => closeModal(),
 * });
 */

'use client';

import * as React from 'react';

// ============================================================
// Types
// ============================================================

export interface UseKeyboardNavigationOptions {
  /** Total number of items */
  itemCount: number;
  /** Number of columns (for grid navigation) */
  columns?: number;
  /** Called when item is selected (Enter/Space) */
  onSelect?: (index: number) => void;
  /** Called when Escape is pressed */
  onEscape?: () => void;
  /** Called when navigation occurs */
  onNavigate?: (index: number) => void;
  /** Wrap around when reaching bounds */
  wrap?: boolean;
  /** Initial focused index */
  initialIndex?: number;
  /** Enable/disable the hook */
  enabled?: boolean;
  /** Orientation for 1D navigation */
  orientation?: 'horizontal' | 'vertical';
}

export interface UseKeyboardNavigationReturn {
  /** Index of currently focused item */
  focusedIndex: number;
  /** Set focused index programmatically */
  setFocusedIndex: React.Dispatch<React.SetStateAction<number>>;
  /** Key down handler to attach to container */
  handleKeyDown: (event: React.KeyboardEvent) => void;
  /** Move focus to next item */
  focusNext: () => void;
  /** Move focus to previous item */
  focusPrevious: () => void;
  /** Move focus to first item */
  focusFirst: () => void;
  /** Move focus to last item */
  focusLast: () => void;
  /** Props to spread on container for a11y */
  containerProps: {
    role: string;
    tabIndex: number;
    'aria-activedescendant'?: string;
    onKeyDown: (event: React.KeyboardEvent) => void;
  };
  /** Get props for an individual item */
  getItemProps: (index: number, id?: string) => {
    id: string;
    role: string;
    tabIndex: number;
    'aria-selected': boolean;
    'data-focused': boolean;
  };
}

// ============================================================
// Hook
// ============================================================

export function useKeyboardNavigation({
  itemCount,
  columns = 1,
  onSelect,
  onEscape,
  onNavigate,
  wrap = false,
  initialIndex = 0,
  enabled = true,
  orientation = 'vertical',
}: UseKeyboardNavigationOptions): UseKeyboardNavigationReturn {
  const [focusedIndex, setFocusedIndex] = React.useState(initialIndex);

  // Ensure focused index is within bounds
  React.useEffect(() => {
    if (focusedIndex >= itemCount) {
      setFocusedIndex(Math.max(0, itemCount - 1));
    }
  }, [itemCount, focusedIndex]);

  // Navigation helpers
  const moveFocus = React.useCallback(
    (delta: number) => {
      setFocusedIndex((current) => {
        let next = current + delta;

        if (wrap) {
          if (next < 0) next = itemCount - 1;
          if (next >= itemCount) next = 0;
        } else {
          next = Math.max(0, Math.min(itemCount - 1, next));
        }

        onNavigate?.(next);
        return next;
      });
    },
    [itemCount, wrap, onNavigate]
  );

  const focusNext = React.useCallback(() => moveFocus(1), [moveFocus]);
  const focusPrevious = React.useCallback(() => moveFocus(-1), [moveFocus]);
  const focusFirst = React.useCallback(() => {
    setFocusedIndex(0);
    onNavigate?.(0);
  }, [onNavigate]);
  const focusLast = React.useCallback(() => {
    const last = itemCount - 1;
    setFocusedIndex(last);
    onNavigate?.(last);
  }, [itemCount, onNavigate]);

  // Handle key events
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (!enabled) return;

      const isGrid = columns > 1;
      let handled = true;

      switch (event.key) {
        case 'ArrowRight':
          if (isGrid || orientation === 'horizontal') {
            moveFocus(1);
          }
          break;

        case 'ArrowLeft':
          if (isGrid || orientation === 'horizontal') {
            moveFocus(-1);
          }
          break;

        case 'ArrowDown':
          if (isGrid) {
            moveFocus(columns);
          } else if (orientation === 'vertical') {
            moveFocus(1);
          }
          break;

        case 'ArrowUp':
          if (isGrid) {
            moveFocus(-columns);
          } else if (orientation === 'vertical') {
            moveFocus(-1);
          }
          break;

        case 'Home':
          if (event.ctrlKey || !isGrid) {
            focusFirst();
          } else {
            // Go to start of current row
            const rowStart = Math.floor(focusedIndex / columns) * columns;
            setFocusedIndex(rowStart);
            onNavigate?.(rowStart);
          }
          break;

        case 'End':
          if (event.ctrlKey || !isGrid) {
            focusLast();
          } else {
            // Go to end of current row
            const rowEnd = Math.min(
              Math.floor(focusedIndex / columns) * columns + columns - 1,
              itemCount - 1
            );
            setFocusedIndex(rowEnd);
            onNavigate?.(rowEnd);
          }
          break;

        case 'PageUp':
          if (isGrid) {
            moveFocus(-columns * 5); // Jump 5 rows
          }
          break;

        case 'PageDown':
          if (isGrid) {
            moveFocus(columns * 5); // Jump 5 rows
          }
          break;

        case 'Enter':
        case ' ':
          onSelect?.(focusedIndex);
          break;

        case 'Escape':
          onEscape?.();
          break;

        default:
          handled = false;
      }

      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    [
      enabled,
      columns,
      orientation,
      moveFocus,
      focusFirst,
      focusLast,
      focusedIndex,
      itemCount,
      onSelect,
      onEscape,
      onNavigate,
    ]
  );

  // Container props for a11y
  const containerProps = React.useMemo(
    () => ({
      role: columns > 1 ? 'grid' : 'listbox',
      tabIndex: 0,
      'aria-activedescendant': `item-${focusedIndex}`,
      onKeyDown: handleKeyDown,
    }),
    [columns, focusedIndex, handleKeyDown]
  );

  // Item props generator
  const getItemProps = React.useCallback(
    (index: number, id?: string) => ({
      id: id || `item-${index}`,
      role: columns > 1 ? 'gridcell' : 'option',
      tabIndex: index === focusedIndex ? 0 : -1,
      'aria-selected': index === focusedIndex,
      'data-focused': index === focusedIndex,
    }),
    [columns, focusedIndex]
  );

  return {
    focusedIndex,
    setFocusedIndex,
    handleKeyDown,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    containerProps,
    getItemProps,
  };
}

// ============================================================
// Roving Tab Index Hook (simpler alternative)
// ============================================================

export interface UseRovingTabIndexOptions {
  /** Total number of items */
  itemCount: number;
  /** Initial focused index */
  initialIndex?: number;
  /** Enable/disable */
  enabled?: boolean;
}

export function useRovingTabIndex({
  itemCount,
  initialIndex = 0,
  enabled = true,
}: UseRovingTabIndexOptions) {
  const [activeIndex, setActiveIndex] = React.useState(initialIndex);

  const getTabIndex = React.useCallback(
    (index: number) => (enabled && index === activeIndex ? 0 : -1),
    [activeIndex, enabled]
  );

  const focusItem = React.useCallback(
    (index: number) => {
      if (index >= 0 && index < itemCount) {
        setActiveIndex(index);
      }
    },
    [itemCount]
  );

  return {
    activeIndex,
    setActiveIndex,
    getTabIndex,
    focusItem,
  };
}
