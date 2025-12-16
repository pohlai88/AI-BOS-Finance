/**
 * BioDiffViewer - Change Diff Display Component
 *
 * Sprint E6+: Access Control 100%
 * Shows before/after comparison for audit trail and change review.
 *
 * @example
 * <BioDiffViewer
 *   before={{ name: 'John', amount: 100 }}
 *   after={{ name: 'John Doe', amount: 150 }}
 *   title="Invoice Changes"
 * />
 */

'use client';

import * as React from 'react';
import { Minus, Plus, Equal, ArrowRight } from 'lucide-react';
import { cn } from '../atoms/utils';

// ============================================================
// Types
// ============================================================

export interface BioDiffViewerProps {
  /** Previous value */
  before: Record<string, unknown>;
  /** New value */
  after: Record<string, unknown>;
  /** Title for the diff view */
  title?: string;
  /** Display mode */
  mode?: 'side-by-side' | 'inline' | 'unified';
  /** Show only changed fields */
  showOnlyChanges?: boolean;
  /** Custom field labels */
  fieldLabels?: Record<string, string>;
  /** Fields to exclude from diff */
  excludeFields?: string[];
  /** Custom class name */
  className?: string;
  /** Date/time of the change */
  timestamp?: Date;
  /** User who made the change */
  changedBy?: string;
}

export type DiffType = 'added' | 'removed' | 'changed' | 'unchanged';

export interface DiffEntry {
  field: string;
  label: string;
  type: DiffType;
  before: unknown;
  after: unknown;
}

// ============================================================
// Diff Calculation
// ============================================================

function calculateDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fieldLabels: Record<string, string> = {},
  excludeFields: string[] = []
): DiffEntry[] {
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const entries: DiffEntry[] = [];

  for (const key of allKeys) {
    if (excludeFields.includes(key)) continue;

    const beforeVal = before[key];
    const afterVal = after[key];
    const label = fieldLabels[key] || formatFieldLabel(key);

    let type: DiffType;

    if (!(key in before)) {
      type = 'added';
    } else if (!(key in after)) {
      type = 'removed';
    } else if (!deepEqual(beforeVal, afterVal)) {
      type = 'changed';
    } else {
      type = 'unchanged';
    }

    entries.push({
      field: key,
      label,
      type,
      before: beforeVal,
      after: afterVal,
    });
  }

  // Sort: changed first, then added, then removed, then unchanged
  const order: Record<DiffType, number> = {
    changed: 0,
    added: 1,
    removed: 2,
    unchanged: 3,
  };

  return entries.sort((a, b) => order[a.type] - order[b.type]);
}

/**
 * Deep equality check for values
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a === 'object') {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);

    if (aKeys.length !== bKeys.length) return false;

    for (const key of aKeys) {
      if (!bKeys.includes(key) || !deepEqual(aObj[key], bObj[key])) {
        return false;
      }
    }
    return true;
  }

  return false;
}

/**
 * Format field name to human-readable label
 */
function formatFieldLabel(field: string): string {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

/**
 * Format value for display
 */
function formatValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value instanceof Date) return value.toLocaleString();
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

// ============================================================
// Component
// ============================================================

export function BioDiffViewer({
  before,
  after,
  title,
  mode = 'inline',
  showOnlyChanges = false,
  fieldLabels = {},
  excludeFields = [],
  className,
  timestamp,
  changedBy,
}: BioDiffViewerProps) {
  const entries = React.useMemo(
    () => calculateDiff(before, after, fieldLabels, excludeFields),
    [before, after, fieldLabels, excludeFields]
  );

  const filteredEntries = showOnlyChanges
    ? entries.filter((e) => e.type !== 'unchanged')
    : entries;

  const changeCount = entries.filter((e) => e.type !== 'unchanged').length;

  // Icon for diff type
  const DiffIcon = ({ type }: { type: DiffType }) => {
    const iconProps = { size: 14, className: 'flex-shrink-0' };

    switch (type) {
      case 'added':
        return <Plus {...iconProps} className={cn(iconProps.className, 'text-green-600')} />;
      case 'removed':
        return <Minus {...iconProps} className={cn(iconProps.className, 'text-red-600')} />;
      case 'changed':
        return <ArrowRight {...iconProps} className={cn(iconProps.className, 'text-amber-600')} />;
      default:
        return <Equal {...iconProps} className={cn(iconProps.className, 'text-gray-400')} />;
    }
  };

  // Row background color
  const rowBgClass = (type: DiffType): string => {
    switch (type) {
      case 'added':
        return 'bg-green-50';
      case 'removed':
        return 'bg-red-50';
      case 'changed':
        return 'bg-amber-50';
      default:
        return '';
    }
  };

  // Render inline mode
  const renderInline = () => (
    <div className="divide-y divide-gray-100">
      {filteredEntries.map((entry) => (
        <div
          key={entry.field}
          className={cn('flex items-start gap-3 py-2 px-3', rowBgClass(entry.type))}
          data-diff-type={entry.type}
        >
          <DiffIcon type={entry.type} />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-gray-700">{entry.label}</div>
            {entry.type === 'unchanged' ? (
              <div className="text-sm text-gray-500">{formatValue(entry.after)}</div>
            ) : entry.type === 'added' ? (
              <div className="text-sm text-green-700">{formatValue(entry.after)}</div>
            ) : entry.type === 'removed' ? (
              <div className="text-sm text-red-700 line-through">{formatValue(entry.before)}</div>
            ) : (
              <div className="text-sm flex items-center gap-2">
                <span className="text-red-700 line-through">{formatValue(entry.before)}</span>
                <ArrowRight size={12} className="text-gray-400" />
                <span className="text-green-700">{formatValue(entry.after)}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  // Render side-by-side mode
  const renderSideBySide = () => (
    <div className="grid grid-cols-2 divide-x divide-gray-200">
      <div className="p-2">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
          Before
        </div>
        {filteredEntries.map((entry) => (
          <div
            key={`before-${entry.field}`}
            className={cn('py-1 px-2 rounded text-sm', entry.type === 'removed' || entry.type === 'changed' ? 'bg-red-50' : '')}
          >
            <span className="font-medium text-gray-600">{entry.label}:</span>{' '}
            <span className={entry.type === 'removed' || entry.type === 'changed' ? 'text-red-700' : 'text-gray-700'}>
              {entry.type === 'added' ? '-' : formatValue(entry.before)}
            </span>
          </div>
        ))}
      </div>
      <div className="p-2">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
          After
        </div>
        {filteredEntries.map((entry) => (
          <div
            key={`after-${entry.field}`}
            className={cn('py-1 px-2 rounded text-sm', entry.type === 'added' || entry.type === 'changed' ? 'bg-green-50' : '')}
          >
            <span className="font-medium text-gray-600">{entry.label}:</span>{' '}
            <span className={entry.type === 'added' || entry.type === 'changed' ? 'text-green-700' : 'text-gray-700'}>
              {entry.type === 'removed' ? '-' : formatValue(entry.after)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  // Render unified mode (git-style)
  const renderUnified = () => (
    <pre className="text-xs font-mono bg-gray-50 p-3 rounded overflow-x-auto">
      {filteredEntries.map((entry) => {
        if (entry.type === 'unchanged') {
          return (
            <div key={entry.field} className="text-gray-600">
              {`  ${entry.label}: ${formatValue(entry.after)}`}
            </div>
          );
        }
        if (entry.type === 'added') {
          return (
            <div key={entry.field} className="text-green-700 bg-green-50">
              {`+ ${entry.label}: ${formatValue(entry.after)}`}
            </div>
          );
        }
        if (entry.type === 'removed') {
          return (
            <div key={entry.field} className="text-red-700 bg-red-50">
              {`- ${entry.label}: ${formatValue(entry.before)}`}
            </div>
          );
        }
        // Changed
        return (
          <React.Fragment key={entry.field}>
            <div className="text-red-700 bg-red-50">
              {`- ${entry.label}: ${formatValue(entry.before)}`}
            </div>
            <div className="text-green-700 bg-green-50">
              {`+ ${entry.label}: ${formatValue(entry.after)}`}
            </div>
          </React.Fragment>
        );
      })}
    </pre>
  );

  return (
    <div
      className={cn('border rounded-lg overflow-hidden', className)}
      data-testid="bio-diff-viewer"
      data-mode={mode}
    >
      {/* Header */}
      {(title || timestamp || changedBy) && (
        <div className="bg-gray-50 border-b px-4 py-3 flex items-center justify-between">
          <div>
            {title && <h4 className="font-semibold text-gray-900">{title}</h4>}
            <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
              {changedBy && <span>By: {changedBy}</span>}
              {timestamp && <span>{timestamp.toLocaleString()}</span>}
              <span>
                {changeCount} {changeCount === 1 ? 'change' : 'changes'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {filteredEntries.length === 0 ? (
        <div className="p-4 text-center text-gray-500 text-sm">No changes detected</div>
      ) : mode === 'side-by-side' ? (
        renderSideBySide()
      ) : mode === 'unified' ? (
        renderUnified()
      ) : (
        renderInline()
      )}
    </div>
  );
}

// ============================================================
// Export Hook for Programmatic Diff
// ============================================================

export function useDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  options: {
    fieldLabels?: Record<string, string>;
    excludeFields?: string[];
  } = {}
): {
  entries: DiffEntry[];
  changeCount: number;
  hasChanges: boolean;
  changedFields: string[];
  addedFields: string[];
  removedFields: string[];
} {
  const entries = React.useMemo(
    () => calculateDiff(before, after, options.fieldLabels ?? {}, options.excludeFields ?? []),
    [before, after, options.fieldLabels, options.excludeFields]
  );

  return {
    entries,
    changeCount: entries.filter((e) => e.type !== 'unchanged').length,
    hasChanges: entries.some((e) => e.type !== 'unchanged'),
    changedFields: entries.filter((e) => e.type === 'changed').map((e) => e.field),
    addedFields: entries.filter((e) => e.type === 'added').map((e) => e.field),
    removedFields: entries.filter((e) => e.type === 'removed').map((e) => e.field),
  };
}

// ============================================================
// Component Meta
// ============================================================

export const COMPONENT_META = {
  code: 'BIOSKIN_BioDiffViewer',
  version: '1.0.0',
  layer: 'molecules',
  family: 'GOVERNANCE',
  status: 'stable',
} as const;
