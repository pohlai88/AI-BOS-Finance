'use client';

/**
 * BioPeriodClose - Period close cockpit with checklist
 * @see FINANCE_ERP_GAP_ANALYSIS.md - Requirement #3
 */

import * as React from 'react';
import { motion as Motion, AnimatePresence } from 'motion/react';
import { Lock, Unlock, Check, X, AlertCircle, Loader2, RefreshCw, Calendar, ChevronRight } from 'lucide-react';
import { cn } from '../../atoms/utils';
import { Btn } from '../../atoms/Btn';
import { Surface } from '../../atoms/Surface';
import { Txt } from '../../atoms/Txt';
import { StatusBadge } from '../../molecules/StatusBadge';

// ============================================================
// Types
// ============================================================

export interface AccountingPeriod { year: number; month: number; }

export interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
  check: () => Promise<number> | number;
  resolveLink?: string;
  isBlocking?: boolean;
  category?: 'documents' | 'reconciliation' | 'adjustments' | 'review';
}

export interface ChecklistResult {
  id: string;
  status: 'pending' | 'checking' | 'complete' | 'incomplete' | 'error';
  count?: number;
  error?: string;
}

export interface PeriodCloseState {
  isClosed: boolean;
  isLocked: boolean;
  closedAt?: Date;
  closedBy?: string;
  lockReason?: string;
}

export interface BioPeriodCloseProps {
  period: AccountingPeriod;
  checklist: ChecklistItem[];
  periodState?: PeriodCloseState;
  onLock?: (period: AccountingPeriod, reason: string) => Promise<void>;
  onUnlock?: (period: AccountingPeriod, reason: string) => Promise<void>;
  canOverride?: boolean;
  onNavigate?: (link: string) => void;
  className?: string;
}

function formatPeriod(period: AccountingPeriod): string {
  return new Date(period.year, period.month - 1).toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
}

// ============================================================
// Checklist Row Component
// ============================================================

const ChecklistRow = React.memo(function ChecklistRow({
  item, result, onRefresh, onNavigate,
}: {
  item: ChecklistItem;
  result: ChecklistResult;
  onRefresh: () => void;
  onNavigate?: (link: string) => void;
}) {
  const StatusIcon = React.useMemo(() => {
    switch (result.status) {
      case 'checking': return <Loader2 size={16} className="animate-spin text-primary" />;
      case 'complete': return <Check size={16} className="text-green-600" />;
      case 'incomplete': return item.isBlocking ? <X size={16} className="text-red-600" /> : <AlertCircle size={16} className="text-amber-600" />;
      case 'error': return <X size={16} className="text-red-600" />;
      default: return <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />;
    }
  }, [result.status, item.isBlocking]);

  return (
    <div className={cn('flex items-center gap-4 px-4 py-3 border-b border-border/50 last:border-b-0', result.status === 'complete' && 'bg-green-50/50', result.status === 'incomplete' && item.isBlocking && 'bg-red-50/50', result.status === 'error' && 'bg-red-50/50')}>
      <Motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}>{StatusIcon}</Motion.div>
      <div className="flex-1">
        <div className="flex items-center gap-2"><span className="font-medium">{item.label}</span>{item.isBlocking && <StatusBadge status="error" size="sm" label="Required" />}</div>
        {item.description && <Txt variant="caption" color="secondary">{item.description}</Txt>}
      </div>
      {result.status === 'incomplete' && result.count !== undefined && (
        <div className="flex items-center gap-2">
          <span className={cn('font-mono font-semibold', item.isBlocking ? 'text-red-600' : 'text-amber-600')}>{result.count} outstanding</span>
          {item.resolveLink && onNavigate && <Btn variant="ghost" size="sm" onClick={() => onNavigate(item.resolveLink!)}>Resolve <ChevronRight size={14} className="ml-1" /></Btn>}
        </div>
      )}
      {result.status === 'error' && <Txt variant="caption" color="danger">{result.error || 'Check failed'}</Txt>}
      <button onClick={onRefresh} className="p-1 hover:bg-muted rounded transition-colors" title="Refresh"><RefreshCw size={14} className="text-muted-foreground" /></button>
    </div>
  );
});

// ============================================================
// Main Component
// ============================================================

export function BioPeriodClose({
  period,
  checklist,
  periodState,
  onLock,
  onUnlock,
  canOverride = false,
  onNavigate,
  className,
}: BioPeriodCloseProps) {
  const [results, setResults] = React.useState<Map<string, ChecklistResult>>(new Map());
  const [isRunning, setIsRunning] = React.useState(false);
  const [lockReason, setLockReason] = React.useState('');
  const [showLockDialog, setShowLockDialog] = React.useState(false);
  const [showUnlockDialog, setShowUnlockDialog] = React.useState(false);
  const [isLocking, setIsLocking] = React.useState(false);

  React.useEffect(() => {
    const initial = new Map<string, ChecklistResult>();
    checklist.forEach((item) => { initial.set(item.id, { id: item.id, status: 'pending' }); });
    setResults(initial);
  }, [checklist]);

  const runCheck = React.useCallback(async (item: ChecklistItem) => {
    setResults((prev) => { const next = new Map(prev); next.set(item.id, { id: item.id, status: 'checking' }); return next; });
    try {
      const count = await item.check();
      setResults((prev) => { const next = new Map(prev); next.set(item.id, { id: item.id, status: count === 0 ? 'complete' : 'incomplete', count }); return next; });
    } catch (error) {
      setResults((prev) => { const next = new Map(prev); next.set(item.id, { id: item.id, status: 'error', error: error instanceof Error ? error.message : 'Check failed' }); return next; });
    }
  }, []);

  const runAllChecks = React.useCallback(async () => {
    setIsRunning(true);
    for (const item of checklist) { await runCheck(item); }
    setIsRunning(false);
  }, [checklist, runCheck]);

  React.useEffect(() => { runAllChecks(); }, []);

  const canClose = React.useMemo(() => {
    const blockingItems = checklist.filter((item) => item.isBlocking);
    return blockingItems.every((item) => { const result = results.get(item.id); return result?.status === 'complete'; });
  }, [checklist, results]);

  const stats = React.useMemo(() => {
    let complete = 0, incomplete = 0, pending = 0;
    results.forEach((result) => {
      if (result.status === 'complete') complete++;
      else if (result.status === 'incomplete' || result.status === 'error') incomplete++;
      else pending++;
    });
    return { complete, incomplete, pending, total: results.size };
  }, [results]);

  const handleLock = React.useCallback(async () => {
    if (!onLock || !lockReason.trim()) return;
    setIsLocking(true);
    try { await onLock(period, lockReason.trim()); setShowLockDialog(false); setLockReason(''); } finally { setIsLocking(false); }
  }, [onLock, period, lockReason]);

  const handleUnlock = React.useCallback(async () => {
    if (!onUnlock || !lockReason.trim()) return;
    setIsLocking(true);
    try { await onUnlock(period, lockReason.trim()); setShowUnlockDialog(false); setLockReason(''); } finally { setIsLocking(false); }
  }, [onUnlock, period, lockReason]);

  return (
    <div className={cn('space-y-6', className)}>
      <Surface className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10"><Calendar size={24} className="text-primary" /></div>
            <div><Txt variant="heading">{formatPeriod(period)}</Txt><Txt variant="caption" color="secondary">Period Close Cockpit</Txt></div>
          </div>
          <div className="flex items-center gap-4">
            <StatusBadge status={periodState?.isLocked ? 'error' : periodState?.isClosed ? 'success' : 'warning'} size="lg" label={periodState?.isLocked ? 'Locked' : periodState?.isClosed ? 'Closed' : 'Open'} />
            {!periodState?.isLocked && onLock && <Btn variant="primary" onClick={() => setShowLockDialog(true)} disabled={!canClose}><Lock size={16} className="mr-2" />Close & Lock Period</Btn>}
            {periodState?.isLocked && canOverride && onUnlock && <Btn variant="outline" onClick={() => setShowUnlockDialog(true)}><Unlock size={16} className="mr-2" />Override Lock</Btn>}
          </div>
        </div>
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <Txt variant="caption" color="secondary">{stats.complete} of {stats.total} checks complete</Txt>
            <Btn variant="ghost" size="sm" onClick={runAllChecks} disabled={isRunning}><RefreshCw size={14} className={cn('mr-2', isRunning && 'animate-spin')} />Refresh All</Btn>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <Motion.div className={cn('h-full', stats.incomplete > 0 ? 'bg-amber-500' : 'bg-green-500')} initial={{ width: 0 }} animate={{ width: `${(stats.complete / stats.total) * 100}%` }} transition={{ duration: 0.3 }} />
          </div>
        </div>
      </Surface>

      <Surface className="overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <Txt variant="body" weight="semibold">Close Checklist</Txt>
          {!canClose && <Txt variant="caption" color="warning">Complete all required items to close</Txt>}
        </div>
        <div>{checklist.map((item) => <ChecklistRow key={item.id} item={item} result={results.get(item.id) || { id: item.id, status: 'pending' }} onRefresh={() => runCheck(item)} onNavigate={onNavigate} />)}</div>
      </Surface>

      {/* Lock Dialog */}
      <AnimatePresence>
        {showLockDialog && (
          <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Surface className="p-6 max-w-md w-full mx-4">
              <div className="flex items-start gap-3 mb-4">
                <Lock size={24} className="text-primary flex-shrink-0 mt-0.5" />
                <div><Txt variant="body" weight="semibold">Close & Lock {formatPeriod(period)}</Txt><Txt variant="caption" color="secondary">This will prevent any further postings to this period.</Txt></div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Reason for closing</label>
                <input type="text" value={lockReason} onChange={(e) => setLockReason(e.target.value)} placeholder="e.g., Month-end close completed" className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div className="flex items-center justify-end gap-2">
                <Btn variant="outline" onClick={() => setShowLockDialog(false)}>Cancel</Btn>
                <Btn variant="primary" onClick={handleLock} disabled={!lockReason.trim() || isLocking}>{isLocking ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Lock size={14} className="mr-2" />}Close & Lock</Btn>
              </div>
            </Surface>
          </Motion.div>
        )}
      </AnimatePresence>

      {/* Unlock Dialog */}
      <AnimatePresence>
        {showUnlockDialog && (
          <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Surface className="p-6 max-w-md w-full mx-4">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle size={24} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div><Txt variant="body" weight="semibold">Override Period Lock</Txt><Txt variant="caption" color="secondary">This action will be logged for audit purposes.</Txt></div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Override reason</label>
                <input type="text" value={lockReason} onChange={(e) => setLockReason(e.target.value)} placeholder="e.g., Correction required per audit finding" className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div className="flex items-center justify-end gap-2">
                <Btn variant="outline" onClick={() => setShowUnlockDialog(false)}>Cancel</Btn>
                <Btn variant="danger" onClick={handleUnlock} disabled={!lockReason.trim() || isLocking}>{isLocking ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Unlock size={14} className="mr-2" />}Override Lock</Btn>
              </div>
            </Surface>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

BioPeriodClose.displayName = 'BioPeriodClose';
export default BioPeriodClose;
