'use client';

/**
 * BioReconciliation - Two-pane matching workspace
 * @see FINANCE_ERP_GAP_ANALYSIS.md - Requirement #4
 */

import * as React from 'react';
import { motion as Motion, AnimatePresence } from 'motion/react';
import { Link2, Split, Trash2, Check, X, AlertCircle, ChevronRight, RefreshCw } from 'lucide-react';
import { cn } from '../../atoms/utils';
import { Btn } from '../../atoms/Btn';
import { Surface } from '../../atoms/Surface';
import { Txt } from '../../atoms/Txt';
import { StatusBadge } from '../../molecules/StatusBadge';

// ============================================================
// Types
// ============================================================

export interface ReconciliationItem<T = Record<string, unknown>> {
  id: string;
  data: T;
  amount: number;
  date: Date;
  reference?: string;
  description?: string;
  isMatched?: boolean;
  matchedWith?: string[];
  matchConfidence?: number;
  isSelected?: boolean;
}

export interface ReconciliationPane<T = Record<string, unknown>> {
  title: string;
  data: ReconciliationItem<T>[];
  columns: ReconciliationColumn<T>[];
  totalLabel?: string;
}

export interface ReconciliationColumn<T = Record<string, unknown>> {
  id: string;
  header: string;
  accessor: (item: ReconciliationItem<T>) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface MatchSuggestion {
  leftId: string;
  rightId: string;
  confidence: number;
  reason: string;
}

export interface SplitItem {
  amount: number;
  description?: string;
  account?: string;
}

export interface BioReconciliationProps<TLeft = Record<string, unknown>, TRight = Record<string, unknown>> {
  leftPane: ReconciliationPane<TLeft>;
  rightPane: ReconciliationPane<TRight>;
  onMatch?: (leftItems: ReconciliationItem<TLeft>[], rightItems: ReconciliationItem<TRight>[]) => void;
  onUnmatch?: (leftItem: ReconciliationItem<TLeft>, rightItem: ReconciliationItem<TRight>) => void;
  onSplit?: (item: ReconciliationItem<TLeft | TRight>, splits: SplitItem[]) => void;
  onWriteOff?: (item: ReconciliationItem<TLeft | TRight>, reason: string, account: string) => void;
  enableSuggestions?: boolean;
  suggestions?: MatchSuggestion[];
  onRefreshSuggestions?: () => void;
  amountTolerance?: number;
  allowManyToMany?: boolean;
  className?: string;
}

const ITEM_ANIMATION = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.15 },
};

// ============================================================
// Pane Item Component
// ============================================================

function PaneItem<T>({
  item,
  columns,
  isSelected,
  onSelect,
}: {
  item: ReconciliationItem<T>;
  columns: ReconciliationColumn<T>[];
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <Motion.div
      layout
      {...ITEM_ANIMATION}
      onClick={() => onSelect(item.id)}
      className={cn(
        'flex items-center gap-2 px-3 py-2 cursor-pointer border-b border-border/50 hover:bg-muted/50 transition-colors',
        isSelected && 'bg-primary/10 border-primary/20',
        item.isMatched && 'opacity-50'
      )}
      role="row"
      aria-selected={isSelected}
    >
      <div className={cn('w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center', isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/30', item.isMatched && 'bg-green-500 border-green-500')}>
        {(isSelected || item.isMatched) && <Check size={12} className="text-white" />}
      </div>
      {columns.map((col) => (
        <div key={col.id} className={cn('flex-1 truncate', col.align === 'right' && 'text-right', col.align === 'center' && 'text-center')} style={{ width: col.width }}>
          {col.accessor(item)}
        </div>
      ))}
      {item.matchConfidence !== undefined && item.matchConfidence > 0 && (
        <StatusBadge status={item.matchConfidence > 0.9 ? 'success' : item.matchConfidence > 0.7 ? 'warning' : 'info'} size="sm" label={`${Math.round(item.matchConfidence * 100)}%`} />
      )}
    </Motion.div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function BioReconciliation<TLeft = Record<string, unknown>, TRight = Record<string, unknown>>({
  leftPane,
  rightPane,
  onMatch,
  onSplit,
  onWriteOff,
  enableSuggestions = true,
  suggestions = [],
  onRefreshSuggestions,
  amountTolerance = 0.01,
  allowManyToMany = false,
  className,
}: BioReconciliationProps<TLeft, TRight>) {
  const [leftSelected, setLeftSelected] = React.useState<Set<string>>(new Set());
  const [rightSelected, setRightSelected] = React.useState<Set<string>>(new Set());
  const [, setShowSplitDialog] = React.useState(false);
  const [, setShowWriteOffDialog] = React.useState(false);

  const leftTotal = React.useMemo(() => leftPane.data.reduce((sum, item) => sum + item.amount, 0), [leftPane.data]);
  const rightTotal = React.useMemo(() => rightPane.data.reduce((sum, item) => sum + item.amount, 0), [rightPane.data]);
  const leftUnmatched = React.useMemo(() => leftPane.data.filter((item) => !item.isMatched), [leftPane.data]);
  const rightUnmatched = React.useMemo(() => rightPane.data.filter((item) => !item.isMatched), [rightPane.data]);

  const handleLeftSelect = React.useCallback((id: string) => {
    setLeftSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { if (!allowManyToMany) next.clear(); next.add(id); }
      return next;
    });
  }, [allowManyToMany]);

  const handleRightSelect = React.useCallback((id: string) => {
    setRightSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { if (!allowManyToMany) next.clear(); next.add(id); }
      return next;
    });
  }, [allowManyToMany]);

  const handleMatch = React.useCallback(() => {
    if (leftSelected.size === 0 || rightSelected.size === 0) return;
    const leftItems = leftPane.data.filter((item) => leftSelected.has(item.id));
    const rightItems = rightPane.data.filter((item) => rightSelected.has(item.id));
    onMatch?.(leftItems, rightItems);
    setLeftSelected(new Set());
    setRightSelected(new Set());
  }, [leftSelected, rightSelected, leftPane.data, rightPane.data, onMatch]);

  const canMatch = React.useMemo(() => {
    if (leftSelected.size === 0 || rightSelected.size === 0) return false;
    const leftSum = leftPane.data.filter((item) => leftSelected.has(item.id)).reduce((sum, item) => sum + item.amount, 0);
    const rightSum = rightPane.data.filter((item) => rightSelected.has(item.id)).reduce((sum, item) => sum + item.amount, 0);
    return Math.abs(leftSum - rightSum) <= amountTolerance;
  }, [leftSelected, rightSelected, leftPane.data, rightPane.data, amountTolerance]);

  const leftSelectedSum = React.useMemo(() => leftPane.data.filter((item) => leftSelected.has(item.id)).reduce((sum, item) => sum + item.amount, 0), [leftPane.data, leftSelected]);
  const rightSelectedSum = React.useMemo(() => rightPane.data.filter((item) => rightSelected.has(item.id)).reduce((sum, item) => sum + item.amount, 0), [rightPane.data, rightSelected]);
  const selectionDifference = leftSelectedSum - rightSelectedSum;

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Summary Bar */}
      <Surface className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div><Txt variant="caption" color="secondary">Unmatched Left</Txt><Txt variant="heading">{leftUnmatched.length} items</Txt></div>
            <div><Txt variant="caption" color="secondary">Unmatched Right</Txt><Txt variant="heading">{rightUnmatched.length} items</Txt></div>
            <div>
              <Txt variant="caption" color="secondary">Difference</Txt>
              <Txt variant="heading" className={cn('font-mono', Math.abs(leftTotal - rightTotal) > 0.01 && 'text-amber-600')}>
                {(leftTotal - rightTotal).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
              </Txt>
            </div>
          </div>
          {enableSuggestions && <Btn variant="outline" size="sm" onClick={onRefreshSuggestions}><RefreshCw size={14} className="mr-2" />Auto-Match ({suggestions.length})</Btn>}
        </div>
      </Surface>

      {/* Two-Pane Layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left Pane */}
        <Surface className="overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b bg-muted/30">
            <Txt variant="body" weight="semibold">{leftPane.title}</Txt>
            <StatusBadge status="info" size="sm" label={`${leftUnmatched.length} unmatched`} />
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {leftPane.data.map((item) => (
                <PaneItem key={item.id} item={item} columns={leftPane.columns} isSelected={leftSelected.has(item.id)} onSelect={handleLeftSelect} />
              ))}
            </AnimatePresence>
          </div>
          <div className="flex items-center justify-between p-3 border-t bg-muted/30">
            <Txt variant="caption" color="secondary">{leftPane.totalLabel || 'Total'}</Txt>
            <Txt variant="body" weight="semibold" className="font-mono">{leftTotal.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</Txt>
          </div>
        </Surface>

        {/* Right Pane */}
        <Surface className="overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b bg-muted/30">
            <Txt variant="body" weight="semibold">{rightPane.title}</Txt>
            <StatusBadge status="info" size="sm" label={`${rightUnmatched.length} unmatched`} />
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {rightPane.data.map((item) => (
                <PaneItem key={item.id} item={item} columns={rightPane.columns} isSelected={rightSelected.has(item.id)} onSelect={handleRightSelect} />
              ))}
            </AnimatePresence>
          </div>
          <div className="flex items-center justify-between p-3 border-t bg-muted/30">
            <Txt variant="caption" color="secondary">{rightPane.totalLabel || 'Total'}</Txt>
            <Txt variant="body" weight="semibold" className="font-mono">{rightTotal.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</Txt>
          </div>
        </Surface>
      </div>

      {/* Action Bar */}
      {(leftSelected.size > 0 || rightSelected.size > 0) && (
        <Surface className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm"><span className="text-muted-foreground">Left: </span><span className="font-mono font-semibold">{leftSelectedSum.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</span><span className="text-muted-foreground"> ({leftSelected.size} items)</span></div>
              <ChevronRight className="text-muted-foreground" />
              <div className="text-sm"><span className="text-muted-foreground">Right: </span><span className="font-mono font-semibold">{rightSelectedSum.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</span><span className="text-muted-foreground"> ({rightSelected.size} items)</span></div>
              {Math.abs(selectionDifference) > 0.01 && (
                <div className="flex items-center gap-1 text-amber-600"><AlertCircle size={14} /><span className="text-sm font-mono">Diff: {selectionDifference.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</span></div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Btn variant="outline" size="sm" onClick={() => { setLeftSelected(new Set()); setRightSelected(new Set()); }}><X size={14} className="mr-1" />Clear</Btn>
              {onSplit && leftSelected.size === 1 && rightSelected.size === 0 && <Btn variant="outline" size="sm" onClick={() => setShowSplitDialog(true)}><Split size={14} className="mr-1" />Split</Btn>}
              {onWriteOff && (leftSelected.size === 1 || rightSelected.size === 1) && <Btn variant="outline" size="sm" onClick={() => setShowWriteOffDialog(true)}><Trash2 size={14} className="mr-1" />Write Off</Btn>}
              <Btn variant="primary" size="sm" onClick={handleMatch} disabled={!canMatch}><Link2 size={14} className="mr-1" />Match</Btn>
            </div>
          </div>
        </Surface>
      )}
    </div>
  );
}

BioReconciliation.displayName = 'BioReconciliation';
export default BioReconciliation;
