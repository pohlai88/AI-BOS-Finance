'use client';

/**
 * BioExceptionDashboard - Exception-first control view
 * @see FINANCE_ERP_GAP_ANALYSIS.md - Requirement #5
 */

import * as React from 'react';
import { motion as Motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, AlertCircle, Info, CheckCircle, ChevronRight, ChevronDown, RefreshCw } from 'lucide-react';
import { cn } from '../atoms/utils';
import { Btn } from '../atoms/Btn';
import { Surface } from '../atoms/Surface';
import { Txt } from '../atoms/Txt';
import { StatusBadge } from './StatusBadge';

// ============================================================
// Types
// ============================================================

export type ExceptionSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface ExceptionItem {
  id: string;
  data: Record<string, unknown>;
  message?: string;
  createdAt?: Date;
}

export interface ExceptionAction {
  id: string;
  label: string;
  handler: (items: ExceptionItem[]) => Promise<void> | void;
  isBulk?: boolean;
}

export interface Exception {
  type: string;
  label: string;
  description?: string;
  severity: ExceptionSeverity;
  count: number;
  items: ExceptionItem[];
  category?: string;
  actions?: ExceptionAction[];
  viewAllLink?: string;
}

export interface BioExceptionDashboardProps {
  exceptions: Exception[];
  onResolve?: (exception: Exception, action: ExceptionAction, items: ExceptionItem[]) => void;
  onNavigate?: (link: string) => void;
  onRefresh?: () => void;
  groupBy?: 'severity' | 'category' | 'type';
  filterSeverity?: ExceptionSeverity[];
  compact?: boolean;
  className?: string;
}

const SEVERITY_CONFIG: Record<ExceptionSeverity, { color: string; bgColor: string; icon: typeof AlertTriangle; label: string }> = {
  critical: { color: 'text-status-danger/90', bgColor: 'bg-status-danger/10 border-status-danger/20', icon: AlertTriangle, label: 'Critical' },
  high: { color: 'text-status-warning/90', bgColor: 'bg-status-warning/10 border-status-warning/20', icon: AlertCircle, label: 'High' },
  medium: { color: 'text-status-warning/80', bgColor: 'bg-status-warning/8 border-status-warning/15', icon: AlertCircle, label: 'Medium' },
  low: { color: 'text-status-info/90', bgColor: 'bg-status-info/10 border-status-info/20', icon: Info, label: 'Low' },
  info: { color: 'text-muted-foreground', bgColor: 'bg-muted/50 border-border', icon: Info, label: 'Info' },
};

const SEVERITY_ORDER: ExceptionSeverity[] = ['critical', 'high', 'medium', 'low', 'info'];

// ============================================================
// Exception Card Component
// ============================================================

const ExceptionCard = React.memo(function ExceptionCard({
  exception,
  onResolve,
  onNavigate,
  compact,
}: {
  exception: Exception;
  onResolve?: (action: ExceptionAction, items: ExceptionItem[]) => void;
  onNavigate?: (link: string) => void;
  compact?: boolean;
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const config = SEVERITY_CONFIG[exception.severity];
  const Icon = config.icon;

  return (
    <Motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn('rounded-lg border overflow-hidden', config.bgColor)}>
      <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-black/5 transition-colors text-left">
        <Icon size={20} className={config.color} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold truncate">{exception.label}</span>
            <StatusBadge status={exception.severity === 'critical' ? 'error' : 'warning'} size="sm" label={String(exception.count)} />
          </div>
          {!compact && exception.description && <Txt variant="caption" color="secondary" className="truncate">{exception.description}</Txt>}
        </div>
        <ChevronDown size={16} className={cn('text-muted-foreground transition-transform', isExpanded && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {isExpanded && (
          <Motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="border-t">
            <div className="max-h-48 overflow-y-auto">
              {exception.items.slice(0, 10).map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-2 border-b last:border-b-0 bg-white/50">
                  <div className="flex-1 text-sm truncate">{item.message || `Item ${item.id}`}</div>
                  {exception.actions?.filter((a) => !a.isBulk).map((action) => (
                    <Btn key={action.id} variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onResolve?.(action, [item]); }}>{action.label}</Btn>
                  ))}
                </div>
              ))}
              {exception.items.length > 10 && <div className="px-4 py-2 text-sm text-muted-foreground text-center">+{exception.items.length - 10} more items</div>}
            </div>
            <div className="flex items-center justify-between px-4 py-2 bg-white/30 border-t">
              <div className="flex items-center gap-2">
                {exception.actions?.filter((a) => a.isBulk).map((action) => (
                  <Btn key={action.id} variant="outline" size="sm" onClick={() => onResolve?.(action, exception.items)}>{action.label} All</Btn>
                ))}
              </div>
              {exception.viewAllLink && onNavigate && (
                <Btn variant="ghost" size="sm" onClick={() => onNavigate(exception.viewAllLink!)}>View All <ChevronRight size={14} className="ml-1" /></Btn>
              )}
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </Motion.div>
  );
});

// ============================================================
// Main Component
// ============================================================

export const BioExceptionDashboard = React.memo(function BioExceptionDashboard({
  exceptions,
  onResolve,
  onNavigate,
  onRefresh,
  groupBy = 'severity',
  filterSeverity,
  compact = false,
  className,
}: BioExceptionDashboardProps) {
  const filteredExceptions = React.useMemo(() => {
    if (!filterSeverity || filterSeverity.length === 0) return exceptions;
    return exceptions.filter((e) => filterSeverity.includes(e.severity));
  }, [exceptions, filterSeverity]);

  const groupedExceptions = React.useMemo(() => {
    const groups = new Map<string, Exception[]>();
    for (const exception of filteredExceptions) {
      const key = groupBy === 'category' ? (exception.category || 'Uncategorized') : groupBy === 'type' ? exception.type : exception.severity;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(exception);
    }
    const sortedEntries = Array.from(groups.entries());
    if (groupBy === 'severity') {
      sortedEntries.sort((a, b) => SEVERITY_ORDER.indexOf(a[0] as ExceptionSeverity) - SEVERITY_ORDER.indexOf(b[0] as ExceptionSeverity));
    }
    return sortedEntries;
  }, [filteredExceptions, groupBy]);

  const summary = React.useMemo(() => {
    const counts: Record<ExceptionSeverity, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    for (const exception of exceptions) { counts[exception.severity] += exception.count; }
    return counts;
  }, [exceptions]);

  const totalCount = Object.values(summary).reduce((a, b) => a + b, 0);

  const handleResolve = React.useCallback((exception: Exception, action: ExceptionAction, items: ExceptionItem[]) => {
    onResolve?.(exception, action, items);
  }, [onResolve]);

  if (exceptions.length === 0) {
    return (
      <Surface className={cn('p-8 text-center', className)}>
        <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
        <Txt variant="body" weight="semibold">No Exceptions</Txt>
        <Txt variant="caption" color="secondary">All items are in good standing</Txt>
      </Surface>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      <Surface className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <Txt variant="caption" color="secondary">Total Exceptions</Txt>
              <Txt variant="heading">{totalCount}</Txt>
            </div>
            <div className="flex items-center gap-3">
              {SEVERITY_ORDER.map((severity) => {
                if (summary[severity] === 0) return null;
                const config = SEVERITY_CONFIG[severity];
                const Icon = config.icon;
                return (
                  <div key={severity} className="flex items-center gap-1">
                    <Icon size={14} className={config.color} />
                    <span className={cn('font-semibold', config.color)}>{summary[severity]}</span>
                    <span className="text-muted-foreground text-sm">{config.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
          {onRefresh && <Btn variant="outline" size="sm" onClick={onRefresh}><RefreshCw size={14} className="mr-2" />Refresh</Btn>}
        </div>
      </Surface>

      {groupedExceptions.map(([groupKey, groupExceptions]) => (
        <div key={groupKey}>
          {groupBy !== 'type' && (
            <div className="flex items-center gap-2 mb-3">
              {groupBy === 'severity' && (
                <>
                  {React.createElement(SEVERITY_CONFIG[groupKey as ExceptionSeverity].icon, { size: 16, className: SEVERITY_CONFIG[groupKey as ExceptionSeverity].color })}
                  <Txt variant="body" weight="semibold" className="capitalize">{SEVERITY_CONFIG[groupKey as ExceptionSeverity].label}</Txt>
                </>
              )}
              {groupBy === 'category' && <Txt variant="body" weight="semibold">{groupKey}</Txt>}
              <StatusBadge status="info" size="sm" label={String(groupExceptions.reduce((sum, e) => sum + e.count, 0))} />
            </div>
          )}
          <div className="space-y-3">
            {groupExceptions.map((exception) => (
              <ExceptionCard key={exception.type} exception={exception} onResolve={(action, items) => handleResolve(exception, action, items)} onNavigate={onNavigate} compact={compact} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});

BioExceptionDashboard.displayName = 'BioExceptionDashboard';
export default BioExceptionDashboard;
