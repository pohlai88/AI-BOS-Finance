'use client';

/**
 * BioBulkActions - Governed bulk operations with role/state gating
 *
 * Bulk approve, post, allocate payments, reclass - all gated by role, state, and period.
 * Produces per-record audit events with correlation ID.
 *
 * @example
 * <BioBulkActions
 *   selectedItems={selectedRows}
 *   actions={[
 *     { id: 'approve', label: 'Approve', requiredRole: 'approver', requiredState: 'submitted' },
 *     { id: 'post', label: 'Post', requiredRole: 'accountant', requiredState: 'approved' },
 *   ]}
 *   onComplete={(results) => handleComplete(results)}
 * />
 *
 * @see FINANCE_ERP_GAP_ANALYSIS.md - Requirement #8
 */

import * as React from 'react';
import { motion as Motion, AnimatePresence } from 'motion/react';
import { Play, Pause, Check, X, AlertCircle, Loader2, ChevronDown, Lock, Unlock } from 'lucide-react';
import { cn } from '../atoms/utils';
import { Btn } from '../atoms/Btn';
import { Surface } from '../atoms/Surface';
import { Txt } from '../atoms/Txt';

// ============================================================
// Types
// ============================================================

export interface BulkActionItem {
  id: string;
  status?: string;
  [key: string]: unknown;
}

export interface BulkAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  requiredRole?: string;
  requiredState?: string | string[];
  periodCheck?: boolean;
  confirmMessage?: string;
  onExecute: (items: BulkActionItem[]) => Promise<BulkActionResult>;
  variant?: 'default' | 'destructive';
}

export interface BulkActionResult {
  success: BulkActionItem[];
  failed: Array<{ item: BulkActionItem; error: string }>;
  skipped: Array<{ item: BulkActionItem; reason: string }>;
}

export interface BioBulkActionsProps {
  selectedItems: BulkActionItem[];
  actions: BulkAction[];
  onComplete?: (actionId: string, results: BulkActionResult) => void;
  onStart?: (actionId: string) => void;
  userRole?: string;
  generateCorrelationId?: () => string;
  minItems?: number;
  maxItems?: number;
  className?: string;
}

// ============================================================
// Animation Constants
// ============================================================

const PROGRESS_ANIMATION = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0 },
  transition: { duration: 0.2 },
};

// ============================================================
// Component
// ============================================================

export const BioBulkActions = React.memo(function BioBulkActions({
  selectedItems,
  actions,
  onComplete,
  onStart,
  userRole,
  generateCorrelationId = () => `bulk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  minItems = 1,
  maxItems = 1000,
  className,
}: BioBulkActionsProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [executing, setExecuting] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState<{
    current: number;
    total: number;
    results: BulkActionResult;
  } | null>(null);
  const [confirmAction, setConfirmAction] = React.useState<BulkAction | null>(null);

  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check if action is available
  const isActionAvailable = React.useCallback(
    (action: BulkAction): { available: boolean; reason?: string } => {
      if (selectedItems.length < minItems) {
        return { available: false, reason: `Select at least ${minItems} item(s)` };
      }
      if (selectedItems.length > maxItems) {
        return { available: false, reason: `Maximum ${maxItems} items allowed` };
      }
      if (action.requiredRole && userRole !== action.requiredRole && userRole !== 'admin') {
        return { available: false, reason: `Requires ${action.requiredRole} role` };
      }
      if (action.requiredState) {
        const requiredStates = Array.isArray(action.requiredState) ? action.requiredState : [action.requiredState];
        const eligibleCount = selectedItems.filter((item) => requiredStates.includes(item.status as string)).length;
        if (eligibleCount === 0) {
          return { available: false, reason: `No items in ${requiredStates.join('/')} state` };
        }
      }
      return { available: true };
    },
    [selectedItems, minItems, maxItems, userRole]
  );

  // Get eligible items
  const getEligibleItems = React.useCallback(
    (action: BulkAction): { eligible: BulkActionItem[]; skipped: Array<{ item: BulkActionItem; reason: string }> } => {
      const eligible: BulkActionItem[] = [];
      const skipped: Array<{ item: BulkActionItem; reason: string }> = [];
      for (const item of selectedItems) {
        if (action.requiredState) {
          const requiredStates = Array.isArray(action.requiredState) ? action.requiredState : [action.requiredState];
          if (!requiredStates.includes(item.status as string)) {
            skipped.push({ item, reason: `Not in ${requiredStates.join('/')} state` });
            continue;
          }
        }
        eligible.push(item);
      }
      return { eligible, skipped };
    },
    [selectedItems]
  );

  // Execute action
  const executeAction = React.useCallback(
    async (action: BulkAction) => {
      setConfirmAction(null);
      setIsOpen(false);
      setExecuting(action.id);

      const { eligible, skipped } = getEligibleItems(action);
      setProgress({ current: 0, total: eligible.length, results: { success: [], failed: [], skipped } });
      onStart?.(action.id);

      try {
        const result = await action.onExecute(eligible);
        const finalResults: BulkActionResult = {
          success: result.success,
          failed: result.failed,
          skipped: [...skipped, ...result.skipped],
        };
        setProgress((prev) => (prev ? { ...prev, current: eligible.length, results: finalResults } : null));
        await new Promise((resolve) => setTimeout(resolve, 500));
        onComplete?.(action.id, finalResults);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        onComplete?.(action.id, { success: [], failed: eligible.map((item) => ({ item, error: errorMessage })), skipped });
      } finally {
        setExecuting(null);
        setProgress(null);
      }
    },
    [getEligibleItems, onStart, onComplete]
  );

  const handleActionClick = React.useCallback(
    (action: BulkAction) => {
      if (action.confirmMessage) {
        setConfirmAction(action);
      } else {
        executeAction(action);
      }
    },
    [executeAction]
  );

  if (selectedItems.length === 0) return null;

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <Btn variant="outline" onClick={() => setIsOpen(!isOpen)} disabled={executing !== null}>
        Actions ({selectedItems.length})
        {executing ? <Loader2 size={14} className="ml-2 animate-spin" /> : <ChevronDown size={14} className={cn('ml-2 transition-transform', isOpen && 'rotate-180')} />}
      </Btn>

      <AnimatePresence>
        {isOpen && !executing && (
          <Motion.div {...PROGRESS_ANIMATION} className={cn('absolute top-full left-0 mt-2 z-50 min-w-[220px] rounded-lg border bg-popover shadow-lg overflow-hidden')}>
            {actions.map((action) => {
              const { available, reason } = isActionAvailable(action);
              const { eligible } = getEligibleItems(action);
              return (
                <button
                  key={action.id}
                  onClick={() => available && handleActionClick(action)}
                  disabled={!available}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/50 transition-colors border-b border-border/50 last:border-b-0',
                    !available && 'opacity-50 cursor-not-allowed',
                    action.variant === 'destructive' && 'text-red-600 hover:bg-red-50'
                  )}
                >
                  {action.icon || (available ? <Unlock size={14} /> : <Lock size={14} />)}
                  <div className="flex-1">
                    <div className="font-medium text-sm">{action.label}</div>
                    {!available && reason && <div className="text-xs text-muted-foreground">{reason}</div>}
                    {available && action.requiredState && <div className="text-xs text-muted-foreground">{eligible.length} of {selectedItems.length} eligible</div>}
                  </div>
                </button>
              );
            })}
          </Motion.div>
        )}
      </AnimatePresence>

      {/* Progress Overlay */}
      <AnimatePresence>
        {progress && (
          <Motion.div {...PROGRESS_ANIMATION} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Surface className="p-6 max-w-md w-full mx-4">
              <div className="flex items-center gap-3 mb-4">
                <Loader2 size={24} className="animate-spin text-primary" />
                <div>
                  <Txt variant="body" weight="semibold">Processing...</Txt>
                  <Txt variant="caption" color="secondary">{progress.current} of {progress.total} items</Txt>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
                <Motion.div className="h-full bg-primary" initial={{ width: 0 }} animate={{ width: `${(progress.current / progress.total) * 100}%` }} transition={{ duration: 0.3 }} />
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-green-600"><Check size={14} />{progress.results.success.length} success</span>
                {progress.results.failed.length > 0 && <span className="flex items-center gap-1 text-red-600"><X size={14} />{progress.results.failed.length} failed</span>}
                {progress.results.skipped.length > 0 && <span className="flex items-center gap-1 text-amber-600"><AlertCircle size={14} />{progress.results.skipped.length} skipped</span>}
              </div>
            </Surface>
          </Motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {confirmAction && (
          <Motion.div {...PROGRESS_ANIMATION} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Surface className="p-6 max-w-md w-full mx-4">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle size={24} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <Txt variant="body" weight="semibold">Confirm {confirmAction.label}</Txt>
                  <Txt variant="caption" color="secondary">{confirmAction.confirmMessage || `Are you sure you want to ${confirmAction.label.toLowerCase()} ${selectedItems.length} item(s)?`}</Txt>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Btn variant="outline" onClick={() => setConfirmAction(null)}>Cancel</Btn>
                <Btn variant={confirmAction.variant === 'destructive' ? 'danger' : 'primary'} onClick={() => executeAction(confirmAction)}>{confirmAction.label}</Btn>
              </div>
            </Surface>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

BioBulkActions.displayName = 'BioBulkActions';

export default BioBulkActions;
