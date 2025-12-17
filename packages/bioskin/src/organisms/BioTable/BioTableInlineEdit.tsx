/**
 * BioTableInlineEdit - Cell-level inline editing for tables
 *
 * Features:
 * - Click to edit cells
 * - Keyboard navigation (Tab, Enter, Escape)
 * - Auto-save on blur
 * - Validation with error display
 * - Undo support
 */

'use client';

import * as React from 'react';
import { z } from 'zod';
import { Check, X, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../../atoms/utils';
import { Txt } from '../../atoms/Txt';
import { type BioFieldDefinition } from '../../introspector/ZodSchemaIntrospector';

// ============================================================
// Types
// ============================================================

export interface CellEdit<T = unknown> {
  rowId: string;
  columnId: string;
  oldValue: T;
  newValue: T;
  timestamp: Date;
}

export interface BioTableInlineEditProps {
  /** Row ID */
  rowId: string;
  /** Column ID */
  columnId: string;
  /** Current value */
  value: unknown;
  /** Field definition */
  field: BioFieldDefinition;
  /** Is cell editable */
  editable?: boolean;
  /** Called when value changes */
  onChange: (rowId: string, columnId: string, value: unknown) => void;
  /** Called when editing starts */
  onEditStart?: (rowId: string, columnId: string) => void;
  /** Called when editing ends */
  onEditEnd?: (rowId: string, columnId: string) => void;
  /** Validation function */
  validate?: (value: unknown) => string | null;
  /** Is saving in progress */
  saving?: boolean;
  /** Error message */
  error?: string;
  /** Additional className */
  className?: string;
}

export interface UseBioTableInlineEditOptions<T> {
  /** Data array */
  data: T[];
  /** Called when cell value changes */
  onCellChange: (rowId: string, columnId: string, newValue: unknown, oldValue: unknown) => void | Promise<void>;
  /** Called when save is complete */
  onSaveComplete?: (edit: CellEdit) => void;
  /** Called when save fails */
  onSaveError?: (edit: CellEdit, error: Error) => void;
  /** Max undo history */
  maxUndo?: number;
}

export interface UseBioTableInlineEditReturn {
  /** Currently editing cell */
  editingCell: { rowId: string; columnId: string } | null;
  /** Start editing a cell */
  startEdit: (rowId: string, columnId: string) => void;
  /** Cancel editing */
  cancelEdit: () => void;
  /** Save current edit */
  saveEdit: (value: unknown) => Promise<void>;
  /** Is saving */
  isSaving: boolean;
  /** Current error */
  error: string | null;
  /** Pending changes */
  pendingChanges: CellEdit[];
  /** Undo last change */
  undo: () => void;
  /** Redo last undone change */
  redo: () => void;
  /** Can undo */
  canUndo: boolean;
  /** Can redo */
  canRedo: boolean;
}

// ============================================================
// Hook
// ============================================================

export function useBioTableInlineEdit<T extends Record<string, unknown>>({
  data,
  onCellChange,
  onSaveComplete,
  onSaveError,
  maxUndo = 50,
}: UseBioTableInlineEditOptions<T>): UseBioTableInlineEditReturn {
  const [editingCell, setEditingCell] = React.useState<{ rowId: string; columnId: string } | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = React.useState<CellEdit[]>([]);
  const [undoStack, setUndoStack] = React.useState<CellEdit[]>([]);
  const [redoStack, setRedoStack] = React.useState<CellEdit[]>([]);
  const originalValueRef = React.useRef<unknown>(null);

  const startEdit = React.useCallback((rowId: string, columnId: string) => {
    // Find current value
    const row = data.find((r, idx) => String(idx) === rowId || (r as Record<string, unknown>).id === rowId);
    if (row) {
      originalValueRef.current = (row as Record<string, unknown>)[columnId];
    }
    setEditingCell({ rowId, columnId });
    setError(null);
  }, [data]);

  const cancelEdit = React.useCallback(() => {
    setEditingCell(null);
    setError(null);
    originalValueRef.current = null;
  }, []);

  const saveEdit = React.useCallback(async (newValue: unknown) => {
    if (!editingCell) return;

    const { rowId, columnId } = editingCell;
    const oldValue = originalValueRef.current;

    // Skip if value hasn't changed
    if (newValue === oldValue) {
      setEditingCell(null);
      return;
    }

    const edit: CellEdit = {
      rowId,
      columnId,
      oldValue,
      newValue,
      timestamp: new Date(),
    };

    setIsSaving(true);
    setError(null);

    try {
      await onCellChange(rowId, columnId, newValue, oldValue);

      // Add to pending changes
      setPendingChanges(prev => [...prev, edit]);

      // Add to undo stack
      setUndoStack(prev => {
        const updated = [...prev, edit];
        return updated.slice(-maxUndo);
      });

      // Clear redo stack
      setRedoStack([]);

      onSaveComplete?.(edit);
      setEditingCell(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save';
      setError(errorMessage);
      onSaveError?.(edit, err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsSaving(false);
    }
  }, [editingCell, onCellChange, onSaveComplete, onSaveError, maxUndo]);

  const undo = React.useCallback(async () => {
    const lastEdit = undoStack[undoStack.length - 1];
    if (!lastEdit) return;

    try {
      await onCellChange(lastEdit.rowId, lastEdit.columnId, lastEdit.oldValue, lastEdit.newValue);
      setUndoStack(prev => prev.slice(0, -1));
      setRedoStack(prev => [...prev, lastEdit]);
    } catch (err) {
      setError('Failed to undo');
    }
  }, [undoStack, onCellChange]);

  const redo = React.useCallback(async () => {
    const lastRedo = redoStack[redoStack.length - 1];
    if (!lastRedo) return;

    try {
      await onCellChange(lastRedo.rowId, lastRedo.columnId, lastRedo.newValue, lastRedo.oldValue);
      setRedoStack(prev => prev.slice(0, -1));
      setUndoStack(prev => [...prev, lastRedo]);
    } catch (err) {
      setError('Failed to redo');
    }
  }, [redoStack, onCellChange]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    editingCell,
    startEdit,
    cancelEdit,
    saveEdit,
    isSaving,
    error,
    pendingChanges,
    undo,
    redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
  };
}

// ============================================================
// Inline Edit Cell Component
// ============================================================

export const BioTableInlineEdit = React.memo(function BioTableInlineEdit({
  rowId,
  columnId,
  value,
  field,
  editable = true,
  onChange,
  onEditStart,
  onEditEnd,
  validate,
  saving = false,
  error,
  className,
}: BioTableInlineEditProps) {
  // Stable IDs for accessibility
  const inputId = React.useId();
  const errorId = React.useId();

  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState<string>(String(value ?? ''));
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);

  // Reset edit value when value prop changes
  React.useEffect(() => {
    if (!isEditing) {
      setEditValue(String(value ?? ''));
    }
  }, [value, isEditing]);

  const startEdit = () => {
    if (!editable || saving) return;
    setIsEditing(true);
    setEditValue(String(value ?? ''));
    setValidationError(null);
    onEditStart?.(rowId, columnId);

    // Focus input after render
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditValue(String(value ?? ''));
    setValidationError(null);
    onEditEnd?.(rowId, columnId);
  };

  const saveEdit = () => {
    // Validate
    if (validate) {
      const error = validate(editValue);
      if (error) {
        setValidationError(error);
        return;
      }
    }

    // Parse value based on field type
    let parsedValue: unknown = editValue;
    switch (field.type) {
      case 'number':
        parsedValue = parseFloat(editValue) || 0;
        break;
      case 'boolean':
        parsedValue = editValue === 'true';
        break;
      case 'date':
        parsedValue = editValue ? new Date(editValue) : null;
        break;
    }

    onChange(rowId, columnId, parsedValue);
    setIsEditing(false);
    onEditEnd?.(rowId, columnId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
        if (!e.shiftKey) {
          e.preventDefault();
          saveEdit();
        }
        break;
      case 'Escape':
        e.preventDefault();
        cancelEdit();
        break;
      case 'Tab':
        saveEdit();
        // Let default tab behavior continue
        break;
    }
  };

  // Render display value
  if (!isEditing) {
    return (
      <div
        onClick={startEdit}
        onKeyDown={(e) => e.key === 'Enter' && startEdit()}
        tabIndex={editable ? 0 : undefined}
        role={editable ? 'button' : undefined}
        aria-label={editable ? `Edit ${field.label || columnId}` : undefined}
        className={cn(
          'px-2 py-1 rounded cursor-pointer transition-colors min-h-[28px]',
          editable && 'hover:bg-surface-hover focus:ring-2 focus:ring-accent-primary/30 focus:outline-none',
          !editable && 'cursor-default',
          className
        )}
        title={editable ? 'Click to edit' : undefined}
      >
        {value !== null && value !== undefined ? String(value) : (
          <span className="text-text-disabled">—</span>
        )}
      </div>
    );
  }

  // Render edit input
  const renderInput = () => {
    const baseInputClass = cn(
      'w-full px-2 py-1 rounded border text-body',
      'focus:outline-none focus:ring-2 focus:ring-accent-primary/30',
      validationError || error
        ? 'border-status-danger focus:ring-status-danger/30'
        : 'border-accent-primary',
    );

    switch (field.type) {
      case 'boolean':
        return (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={handleKeyDown}
            className={baseInputClass}
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        );

      case 'enum':
        return (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={handleKeyDown}
            className={baseInputClass}
          >
            {field.enumValues?.map((val) => (
              <option key={val} value={val}>{val}</option>
            ))}
          </select>
        );

      case 'date':
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="date"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={handleKeyDown}
            className={baseInputClass}
          />
        );

      case 'number':
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={handleKeyDown}
            className={baseInputClass}
          />
        );

      default:
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={handleKeyDown}
            className={baseInputClass}
          />
        );
    }
  };

  return (
    <div className={cn('relative', className)}>
      <div className="flex items-center gap-1">
        {renderInput()}

        {/* Action buttons */}
        <div className="flex items-center gap-0.5">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
          ) : (
            <>
              <button
                onClick={saveEdit}
                className="p-1 rounded hover:bg-status-success/10 text-status-success transition-colors"
                title="Save (Enter)"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={cancelEdit}
                className="p-1 rounded hover:bg-status-danger/10 text-status-danger transition-colors"
                title="Cancel (Escape)"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error message */}
      {(validationError || error) && (
        <div className="absolute left-0 top-full mt-1 z-10 flex items-center gap-1 px-2 py-1 bg-status-danger/10 border border-status-danger/20 rounded text-status-danger text-small">
          <AlertCircle className="h-3 w-3" />
          {validationError || error}
        </div>
      )}
    </div>
  );
});

BioTableInlineEdit.displayName = 'BioTableInlineEdit';

// ============================================================
// Bulk Edit Mode Component
// ============================================================

export interface BioTableBulkEditProps {
  /** Selected row IDs */
  selectedRowIds: string[];
  /** Available columns for bulk edit */
  columns: { id: string; label: string; type: BioFieldDefinition['type'] }[];
  /** Called when bulk edit is applied */
  onApply: (columnId: string, value: unknown, rowIds: string[]) => void;
  /** Called when cancelled */
  onCancel: () => void;
  /** Is applying */
  isApplying?: boolean;
  /** Additional className */
  className?: string;
}

export function BioTableBulkEdit({
  selectedRowIds,
  columns,
  onApply,
  onCancel,
  isApplying = false,
  className,
}: BioTableBulkEditProps) {
  const [selectedColumn, setSelectedColumn] = React.useState<string>('');
  const [newValue, setNewValue] = React.useState<string>('');

  const selectedColumnDef = columns.find(c => c.id === selectedColumn);

  const handleApply = () => {
    if (!selectedColumn || !newValue.trim()) return;

    let parsedValue: unknown = newValue;
    if (selectedColumnDef) {
      switch (selectedColumnDef.type) {
        case 'number':
          parsedValue = parseFloat(newValue) || 0;
          break;
        case 'boolean':
          parsedValue = newValue === 'true';
          break;
        case 'date':
          parsedValue = new Date(newValue);
          break;
      }
    }

    onApply(selectedColumn, parsedValue, selectedRowIds);
  };

  return (
    <div className={cn(
      'flex items-center gap-3 p-3 bg-accent-primary/5 border border-accent-primary/20 rounded-lg',
      className
    )}>
      <Txt variant="small" weight="medium">
        Edit {selectedRowIds.length} rows:
      </Txt>

      <select
        value={selectedColumn}
        onChange={(e) => setSelectedColumn(e.target.value)}
        className="px-3 py-1.5 rounded border border-default bg-surface-base text-body focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
      >
        <option value="">Select field...</option>
        {columns.map((col) => (
          <option key={col.id} value={col.id}>{col.label}</option>
        ))}
      </select>

      {selectedColumn && (
        <>
          <span className="text-text-muted">=</span>
          <input
            type={selectedColumnDef?.type === 'number' ? 'number' : 'text'}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="New value..."
            className="px-3 py-1.5 rounded border border-default bg-surface-base text-body focus:outline-none focus:ring-2 focus:ring-accent-primary/30 min-w-[150px]"
          />
        </>
      )}

      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 rounded text-small text-text-secondary hover:bg-surface-hover transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleApply}
          disabled={!selectedColumn || !newValue.trim() || isApplying}
          className={cn(
            'px-3 py-1.5 rounded text-small font-medium transition-colors',
            'bg-accent-primary text-white hover:bg-accent-primary/90',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isApplying ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Applying...
            </span>
          ) : (
            `Apply to ${selectedRowIds.length} rows`
          )}
        </button>
      </div>
    </div>
  );
}

BioTableBulkEdit.displayName = 'BioTableBulkEdit';
