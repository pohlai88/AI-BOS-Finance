/**
 * BioTableColumnManager - Column visibility, ordering, and pinning UI
 *
 * Provides a popover/dialog to manage table columns:
 * - Toggle column visibility
 * - Reorder columns (drag and drop)
 * - Pin columns (left/right)
 * - Reset to defaults
 */

'use client';

import * as React from 'react';
import { type Table, type Column } from '@tanstack/react-table';
import {
  Settings2,
  Eye,
  EyeOff,
  GripVertical,
  Pin,
  PinOff,
  RotateCcw,
  ChevronDown,
} from 'lucide-react';
import { cn } from '../../atoms/utils';
import { Btn } from '../../atoms/Btn';
import { Txt } from '../../atoms/Txt';
import { Surface } from '../../atoms/Surface';

// ============================================================
// Types
// ============================================================

export interface BioTableColumnManagerProps<TData> {
  /** TanStack table instance */
  table: Table<TData>;
  /** Callback when column order changes */
  onColumnOrderChange?: (columnIds: string[]) => void;
  /** Enable column pinning */
  enablePinning?: boolean;
  /** Enable column reordering */
  enableReordering?: boolean;
  /** Persist settings to localStorage */
  persistKey?: string;
  /** Additional className */
  className?: string;
}

interface ColumnItem {
  id: string;
  label: string;
  isVisible: boolean;
  isPinned: 'left' | 'right' | false;
  canHide: boolean;
}

// ============================================================
// Component
// ============================================================

export function BioTableColumnManager<TData>({
  table,
  onColumnOrderChange,
  enablePinning = true,
  enableReordering = true,
  persistKey,
  className,
}: BioTableColumnManagerProps<TData>) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [draggedItem, setDraggedItem] = React.useState<string | null>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);

  // Get all columns with their visibility and pinning state
  const columns: ColumnItem[] = React.useMemo(() => {
    return table.getAllLeafColumns().map((column) => ({
      id: column.id,
      label: typeof column.columnDef.header === 'string'
        ? column.columnDef.header
        : column.id.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()),
      isVisible: column.getIsVisible(),
      isPinned: column.getIsPinned(),
      canHide: column.getCanHide(),
    }));
  }, [table, table.getState().columnVisibility, table.getState().columnPinning]);

  // Load persisted settings
  React.useEffect(() => {
    if (!persistKey) return;

    try {
      const stored = localStorage.getItem(`bioskin_columns_${persistKey}`);
      if (stored) {
        const { visibility, pinning, order } = JSON.parse(stored);
        if (visibility) table.setColumnVisibility(visibility);
        if (pinning) table.setColumnPinning(pinning);
        if (order) table.setColumnOrder(order);
      }
    } catch (error) {
      console.error('Failed to load column settings:', error);
    }
  }, [persistKey, table]);

  // Save settings on change
  const saveSettings = React.useCallback(() => {
    if (!persistKey) return;

    try {
      const settings = {
        visibility: table.getState().columnVisibility,
        pinning: table.getState().columnPinning,
        order: table.getState().columnOrder,
      };
      localStorage.setItem(`bioskin_columns_${persistKey}`, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save column settings:', error);
    }
  }, [persistKey, table]);

  // Toggle visibility
  const toggleVisibility = (columnId: string) => {
    const column = table.getColumn(columnId);
    if (column) {
      column.toggleVisibility();
      saveSettings();
    }
  };

  // Toggle pinning
  const togglePinning = (columnId: string, position: 'left' | 'right') => {
    const column = table.getColumn(columnId);
    if (column) {
      const currentPinned = column.getIsPinned();
      column.pin(currentPinned === position ? false : position);
      saveSettings();
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, columnId: string) => {
    setDraggedItem(columnId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId) return;

    const currentOrder = table.getState().columnOrder.length > 0
      ? table.getState().columnOrder
      : table.getAllLeafColumns().map(c => c.id);

    const draggedIndex = currentOrder.indexOf(draggedItem);
    const targetIndex = currentOrder.indexOf(targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newOrder = [...currentOrder];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedItem);

    table.setColumnOrder(newOrder);
    onColumnOrderChange?.(newOrder);
    saveSettings();
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  // Reset to defaults
  const resetToDefaults = () => {
    table.resetColumnVisibility();
    table.resetColumnPinning();
    table.resetColumnOrder();

    if (persistKey) {
      localStorage.removeItem(`bioskin_columns_${persistKey}`);
    }
  };

  // Show/hide all
  const showAll = () => {
    table.toggleAllColumnsVisible(true);
    saveSettings();
  };

  const hideAll = () => {
    table.getAllLeafColumns().forEach((column) => {
      if (column.getCanHide()) {
        column.toggleVisibility(false);
      }
    });
    saveSettings();
  };

  // Count visible columns
  const visibleCount = columns.filter(c => c.isVisible).length;
  const totalCount = columns.length;

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className={cn('relative', className)} ref={popoverRef}>
      {/* Trigger Button */}
      <Btn
        variant="secondary"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
      >
        <Settings2 className="h-4 w-4" />
        Columns
        <span className="text-text-tertiary text-small">
          ({visibleCount}/{totalCount})
        </span>
        <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
      </Btn>

      {/* Popover */}
      {isOpen && (
        <Surface
          variant="elevated"
          padding="none"
          className="absolute right-0 top-full mt-2 z-50 w-80 max-h-[400px] overflow-hidden shadow-lg"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-default flex items-center justify-between">
            <Txt variant="label" color="primary">
              Manage Columns
            </Txt>
            <div className="flex items-center gap-1">
              <button
                onClick={showAll}
                className="text-small text-accent-primary hover:underline"
              >
                Show all
              </button>
              <span className="text-text-tertiary">|</span>
              <button
                onClick={hideAll}
                className="text-small text-accent-primary hover:underline"
              >
                Hide all
              </button>
            </div>
          </div>

          {/* Column List */}
          <div className="max-h-[280px] overflow-y-auto">
            {columns.map((column) => (
              <div
                key={column.id}
                draggable={enableReordering}
                onDragStart={(e) => handleDragStart(e, column.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
                onDragEnd={handleDragEnd}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 border-b border-default last:border-b-0',
                  'hover:bg-surface-hover transition-colors',
                  draggedItem === column.id && 'opacity-50 bg-surface-subtle'
                )}
              >
                {/* Drag Handle */}
                {enableReordering && (
                  <GripVertical className="h-4 w-4 text-text-tertiary cursor-grab flex-shrink-0" />
                )}

                {/* Visibility Toggle */}
                <button
                  onClick={() => toggleVisibility(column.id)}
                  disabled={!column.canHide}
                  className={cn(
                    'p-1 rounded hover:bg-surface-nested transition-colors',
                    !column.canHide && 'opacity-50 cursor-not-allowed'
                  )}
                  title={column.isVisible ? 'Hide column' : 'Show column'}
                >
                  {column.isVisible ? (
                    <Eye className="h-4 w-4 text-status-success" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-text-tertiary" />
                  )}
                </button>

                {/* Column Label */}
                <span
                  className={cn(
                    'flex-1 text-small truncate',
                    column.isVisible ? 'text-text-primary' : 'text-text-tertiary'
                  )}
                >
                  {column.label}
                </span>

                {/* Pinning Controls */}
                {enablePinning && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => togglePinning(column.id, 'left')}
                      className={cn(
                        'p-1 rounded hover:bg-surface-nested transition-colors',
                        column.isPinned === 'left' && 'bg-accent-primary/10 text-accent-primary'
                      )}
                      title="Pin to left"
                    >
                      <Pin className="h-3.5 w-3.5 rotate-45" />
                    </button>
                    <button
                      onClick={() => togglePinning(column.id, 'right')}
                      className={cn(
                        'p-1 rounded hover:bg-surface-nested transition-colors',
                        column.isPinned === 'right' && 'bg-accent-primary/10 text-accent-primary'
                      )}
                      title="Pin to right"
                    >
                      <Pin className="h-3.5 w-3.5 -rotate-45" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-default bg-surface-subtle">
            <button
              onClick={resetToDefaults}
              className="flex items-center gap-1.5 text-small text-text-secondary hover:text-text-primary transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset to defaults
            </button>
          </div>
        </Surface>
      )}
    </div>
  );
}

BioTableColumnManager.displayName = 'BioTableColumnManager';
